import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Shift, StoreSchedule, StoreException, ValidationError, Template } from '../types';
import { useStore } from './StoreContext';
import { db } from '../firebase';
import { VacationRequest } from './VacationContext';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  onSnapshot,
  query,
  orderBy,
  where
} from 'firebase/firestore';

interface ScheduleContextType {
  shifts: Shift[];
  storeSchedule: StoreSchedule[];
  storeExceptions: StoreException[];
  templates: Template[];
  addShift: (shift: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ValidationError[]>;
  updateShift: (id: string, updates: Partial<Shift>) => Promise<ValidationError[]>;
  deleteShift: (id: string) => void;
  publishShifts: (shiftIds: string[]) => void;
  addStoreSchedule: (schedule: Omit<StoreSchedule, 'id'>) => void;
  updateStoreSchedule: (id: string, updates: Partial<StoreSchedule>) => void;
  addStoreException: (exception: Omit<StoreException, 'id'>) => void;
  updateStoreException: (id: string, updates: Partial<StoreException>) => void;
  deleteStoreException: (id: string) => void;
  saveTemplate: (name: string, shifts: Omit<Shift, 'id' | 'isPublished' | 'createdAt' | 'updatedAt'>[]) => void;
  applyTemplate: (templateId: string, startDate: string) => Promise<ValidationError[]>;
  copyWeekToNext: (startDate: string) => Promise<ValidationError[]>;
  checkVacationConflict: (employeeId: string, date: string) => Promise<boolean>;
  getShiftsByStore: (storeId: string) => Shift[];
  getAllShifts: () => Shift[];
  isLoading: boolean;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

// Horario de tienda por defecto (Lunes a Domingo + Feriados)
const defaultStoreSchedule: StoreSchedule[] = [
  { 
    id: '1', 
    dayOfWeek: 1, 
    isOpen: true, 
    timeRanges: [{ id: 'range_1', openTime: '09:00', closeTime: '20:00' }],
    openTime: '09:00', 
    closeTime: '20:00' 
  }, // Lunes
  { 
    id: '2', 
    dayOfWeek: 2, 
    isOpen: true, 
    timeRanges: [{ id: 'range_2', openTime: '09:00', closeTime: '20:00' }],
    openTime: '09:00', 
    closeTime: '20:00' 
  }, // Martes
  { 
    id: '3', 
    dayOfWeek: 3, 
    isOpen: true, 
    timeRanges: [{ id: 'range_3', openTime: '09:00', closeTime: '20:00' }],
    openTime: '09:00', 
    closeTime: '20:00' 
  }, // Miércoles
  { 
    id: '4', 
    dayOfWeek: 4, 
    isOpen: true, 
    timeRanges: [{ id: 'range_4', openTime: '09:00', closeTime: '20:00' }],
    openTime: '09:00', 
    closeTime: '20:00' 
  }, // Jueves
  { 
    id: '5', 
    dayOfWeek: 5, 
    isOpen: true, 
    timeRanges: [{ id: 'range_5', openTime: '09:00', closeTime: '20:00' }],
    openTime: '09:00', 
    closeTime: '20:00' 
  }, // Viernes
  { 
    id: '6', 
    dayOfWeek: 6, 
    isOpen: true, 
    timeRanges: [{ id: 'range_6', openTime: '09:00', closeTime: '20:00' }],
    openTime: '09:00', 
    closeTime: '20:00' 
  }, // Sábado
  { 
    id: '7', 
    dayOfWeek: 0, 
    isOpen: false, 
    timeRanges: [] 
  }, // Domingo cerrado
  { 
    id: '8', 
    dayOfWeek: 7, 
    isOpen: false, 
    timeRanges: [] 
  }, // Feriados cerrado por defecto
];

// Función para migrar horarios antiguos a la nueva estructura
const migrateStoreSchedule = (schedule: StoreSchedule): StoreSchedule => {
  // Si ya tiene timeRanges, no hacer nada
  if (schedule.timeRanges && schedule.timeRanges.length > 0) {
    return schedule;
  }
  
  // Si tiene openTime y closeTime, migrar a timeRanges
  if (schedule.openTime && schedule.closeTime) {
    return {
      ...schedule,
      timeRanges: [{
        id: `range_${schedule.id}_${Date.now()}`,
        openTime: schedule.openTime,
        closeTime: schedule.closeTime
      }]
    };
  }
  
  // Si no tiene horarios, usar array vacío
  return {
    ...schedule,
    timeRanges: []
  };
};

// Función para calcular horas entre dos tiempos
const calculateHours = (startTime: string, endTime: string): number => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return (endMinutes - startMinutes) / 60;
};

// Función para convertir tiempo a minutos
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Función para detectar conflictos entre turnos del mismo empleado
const checkShiftConflict = (newShift: { employeeId: string; date: string; startTime: string; endTime: string }, existingShifts: Shift[], excludeId?: string): boolean => {
  const newStartMinutes = timeToMinutes(newShift.startTime);
  const newEndMinutes = timeToMinutes(newShift.endTime);
  
  return existingShifts.some(shift => {
    // Excluir el turno que se está editando
    if (excludeId && shift.id === excludeId) {
      return false;
    }
    
    // Solo verificar turnos del mismo empleado en la misma fecha
    if (shift.employeeId !== newShift.employeeId || shift.date !== newShift.date) {
      return false;
    }
    
    const existingStartMinutes = timeToMinutes(shift.startTime);
    const existingEndMinutes = timeToMinutes(shift.endTime);
    
    // Verificar si hay solapamiento
    // Un turno se solapa si:
    // - Su inicio está dentro del rango del otro turno, O
    // - Su fin está dentro del rango del otro turno, O
    // - Contiene completamente al otro turno
    return (newStartMinutes < existingEndMinutes && newEndMinutes > existingStartMinutes);
  });
};

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [allShifts, setAllShifts] = useState<Shift[]>([]);
  const [storeSchedule, setStoreSchedule] = useState<StoreSchedule[]>([]);
  const [storeExceptions, setStoreExceptions] = useState<StoreException[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentStore } = useStore();

  // Cargar todos los turnos para estadísticas globales
  useEffect(() => {
    const shiftsRef = collection(db, 'shifts');
    const shiftsQuery = query(shiftsRef);

    const unsubscribe = onSnapshot(shiftsQuery, (snapshot) => {
      const allShiftsData: Shift[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        allShiftsData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
        } as Shift);
      });
      
      // Ordenar por fecha en JavaScript
      allShiftsData.sort((a, b) => a.date.localeCompare(b.date));
      
      setAllShifts(allShiftsData);
    }, (error) => {
      console.error('Error loading all shifts:', error);
    });

    return () => unsubscribe();
  }, []);

  // Cargar datos desde Firebase
  useEffect(() => {
    console.log('ScheduleContext: useEffect ejecutándose, currentStore:', currentStore?.id || 'ninguna');
    if (!currentStore) {
      console.log('ScheduleContext: No hay tienda seleccionada, limpiando datos');
      setShifts([]);
      setStoreSchedule([]);
      setStoreExceptions([]);
      setTemplates([]);
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        // Filtrar shifts de la tienda actual desde allShifts
        const storeShifts = allShifts.filter(shift => shift.storeId === currentStore.id);
        setShifts(storeShifts);

        // Cargar store schedule
        const storeScheduleRef = collection(db, 'storeSchedule');
        const storeScheduleQuery = query(storeScheduleRef, orderBy('dayOfWeek'));
        const storeScheduleUnsubscribe = onSnapshot(storeScheduleQuery, async (snapshot) => {
          const scheduleData: StoreSchedule[] = [];
          snapshot.forEach((doc) => {
            scheduleData.push({ id: doc.id, ...doc.data() } as StoreSchedule);
          });
          
          console.log('ScheduleContext: Cargando storeSchedule desde Firebase:', scheduleData.length, 'documentos encontrados');
          console.log('ScheduleContext: IDs de storeSchedule:', scheduleData.map(s => s.id));
          console.log('ScheduleContext: isClearingData flag:', localStorage.getItem('isClearingData'));

          // COMENTADO: No crear storeSchedule automáticamente para evitar recreación durante borrado
          // Los horarios de tienda deben ser creados explícitamente por el usuario o el generador de datos
          /*
          // Verificar si faltan horarios por defecto y agregarlos
          // Solo si hay una tienda seleccionada y hay datos de schedule
          const missingDefaultDays = defaultStoreSchedule.filter(defaultDay =>
            !scheduleData.some(s => s.dayOfWeek === defaultDay.dayOfWeek)
          );

          // Solo agregar días faltantes si hay una tienda seleccionada
          // Esto evita la recreación automática durante el borrado de datos
          if (currentStore && missingDefaultDays.length > 0 && scheduleData.length > 0) {
            // Agregar días faltantes a Firebase
            for (const missingDay of missingDefaultDays) {
              try {
                await addDoc(collection(db, 'storeSchedule'), {
                  dayOfWeek: missingDay.dayOfWeek,
                  isOpen: missingDay.isOpen,
                  openTime: missingDay.openTime || null,
                  closeTime: missingDay.closeTime || null,
                });
              } catch (error) {
                console.error(`Error adding default store schedule for day ${missingDay.dayOfWeek}:`, error);
              }
            }
          }
          */

          // Combinar datos existentes con defaults y migrar si es necesario
          const completeSchedule = defaultStoreSchedule.map(defaultDay => {
            const existing = scheduleData.find(s => s.dayOfWeek === defaultDay.dayOfWeek);
            if (existing) {
              return migrateStoreSchedule(existing);
            }
            return defaultDay;
          });

          // Ordenar: Lunes -> Domingo -> Feriados
          const sortedSchedule = completeSchedule.sort((a, b) => {
            const order = (day: number) => {
              if (day === 1) return 0; // Lunes
              if (day === 2) return 1; // Martes
              if (day === 3) return 2; // Miércoles
              if (day === 4) return 3; // Jueves
              if (day === 5) return 4; // Viernes
              if (day === 6) return 5; // Sábado
              if (day === 0) return 6; // Domingo
              if (day === 7) return 7; // Feriados
              return day;
            };
            return order(a.dayOfWeek) - order(b.dayOfWeek);
          });

          setStoreSchedule(sortedSchedule);
        });

        // Cargar store exceptions
        const exceptionsRef = collection(db, 'storeExceptions');
        const exceptionsQuery = query(exceptionsRef, orderBy('date'));
        const exceptionsUnsubscribe = onSnapshot(exceptionsQuery, (snapshot) => {
          const exceptionsData: StoreException[] = [];
          snapshot.forEach((doc) => {
            exceptionsData.push({ id: doc.id, ...doc.data() } as StoreException);
          });
          setStoreExceptions(exceptionsData);
        });

        // Cargar templates
        const templatesRef = collection(db, 'templates');
        const templatesQuery = query(templatesRef, orderBy('name'));
        const templatesUnsubscribe = onSnapshot(templatesQuery, (snapshot) => {
          const templatesData: Template[] = [];
          snapshot.forEach((doc) => {
            templatesData.push({ id: doc.id, ...doc.data() } as Template);
          });
          setTemplates(templatesData);
        });

        setIsLoading(false);

        // Cleanup function
        return () => {
          storeScheduleUnsubscribe();
          exceptionsUnsubscribe();
          templatesUnsubscribe();
        };
      } catch (error) {
        console.error('Error loading data:', error);
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentStore, allShifts]);

  // Inicializar datos por defecto si no existen
  useEffect(() => {
    const initializeDefaultData = async () => {
      try {
        // Verificar si ya existe store schedule
        const storeScheduleRef = collection(db, 'storeSchedule');
        const scheduleSnapshot = await getDocs(storeScheduleRef);
        
        // COMENTADO: No crear storeSchedule automáticamente para evitar recreación durante borrado
        // Los horarios se crearán cuando el usuario configure una tienda
        /*
        const isClearingData = localStorage.getItem('isClearingData') === 'true';
        if (scheduleSnapshot.empty && !isClearingData) {
          // Agregar horario por defecto
          const addPromises = defaultStoreSchedule.map(schedule => {
            const { id, ...scheduleData } = schedule;
            return addDoc(storeScheduleRef, scheduleData);
          });
          await Promise.all(addPromises);
        }
        */
      } catch (error) {
        console.error('Error initializing default data:', error);
      }
    };

    if (!isLoading) {
      initializeDefaultData();
    }
  }, [isLoading]);

  const checkVacationConflict = async (employeeId: string, date: string): Promise<boolean> => {
    try {
      const vacationRequestsRef = collection(db, 'vacationRequests');
      const q = query(
        vacationRequestsRef,
        where('employeeId', '==', employeeId),
        where('status', '==', 'approved')
      );
      
      const snapshot = await getDocs(q);
      
      for (const doc of snapshot.docs) {
        const vacation = doc.data() as VacationRequest;
        const vacationStart = new Date(vacation.startDate);
        const vacationEnd = new Date(vacation.endDate);
        const shiftDate = new Date(date);
        
        // Verificar si la fecha del turno está dentro del período de vacaciones
        if (shiftDate >= vacationStart && shiftDate <= vacationEnd) {
          return true; // Hay conflicto
        }
      }
      
      return false; // No hay conflicto
    } catch (error) {
      console.error('Error checking vacation conflict:', error);
      return false; // En caso de error, permitir el turno
    }
  };

  const getShiftsByStore = (storeId: string): Shift[] => {
    return allShifts.filter(shift => shift.storeId === storeId);
  };

  const getAllShifts = (): Shift[] => {
    return allShifts;
  };

  const addShift = async (shiftData: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>): Promise<ValidationError[]> => {
    const errors: ValidationError[] = [];
    
    console.log('ScheduleContext: addShift called with data:', shiftData);
    console.log('ScheduleContext: currentStore:', currentStore);
    
    // Validar que hay una tienda seleccionada
    if (!currentStore) {
      console.log('ScheduleContext: No currentStore, returning error');
      errors.push({ type: 'schedule', message: 'No hay tienda seleccionada' });
      return errors;
    }
    
    // Validar que los horarios no superen las 24 horas
    const startHour = parseInt(shiftData.startTime.split(':')[0]);
    const endHour = parseInt(shiftData.endTime.split(':')[0]);
    
    if (startHour < 0 || startHour > 23) {
      errors.push({ type: 'schedule', message: 'La hora de inicio debe estar entre 00:00 y 23:59' });
    }
    
    if (endHour < 0 || endHour > 23) {
      errors.push({ type: 'schedule', message: 'La hora de fin debe estar entre 00:00 y 23:59' });
    }
    
    // Validar que la hora de fin sea posterior a la de inicio
    if (startHour > endHour || (startHour === endHour && parseInt(shiftData.startTime.split(':')[1]) >= parseInt(shiftData.endTime.split(':')[1]))) {
      errors.push({ type: 'schedule', message: 'La hora de fin debe ser posterior a la hora de inicio' });
    }
    
    // Validar que el empleado no esté de vacaciones en esa fecha
    const hasVacationConflict = await checkVacationConflict(shiftData.employeeId, shiftData.date);
    if (hasVacationConflict) {
      errors.push({ type: 'schedule', message: 'No se puede asignar un turno durante las vacaciones aprobadas del empleado' });
    }
    
    // Validar que no haya conflictos con otros turnos del mismo empleado
    const hasShiftConflict = checkShiftConflict(shiftData, shifts);
    if (hasShiftConflict) {
      errors.push({ type: 'schedule', message: 'El empleado ya tiene un turno asignado en ese horario' });
    }
    
    if (errors.length > 0) {
      return errors;
    }
    
    try {
      // Calcular horas automáticamente
      const hours = calculateHours(shiftData.startTime, shiftData.endTime);
      
      const newShift = {
        ...shiftData,
        storeId: currentStore.id,
        hours,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('ScheduleContext: Adding shift to Firebase:', newShift);
      const docRef = await addDoc(collection(db, 'shifts'), newShift);
      console.log('ScheduleContext: Shift added with ID:', docRef.id);
    } catch (error) {
      console.error('Error adding shift:', error);
      errors.push({ type: 'schedule', message: 'Error al crear el turno' });
    }
    
    console.log('ScheduleContext: addShift returning errors:', errors);
    return errors;
  };

  const updateShift = async (id: string, updates: Partial<Shift>): Promise<ValidationError[]> => {
    const errors: ValidationError[] = [];
    
    // Validar que los horarios no superen las 24 horas si se están actualizando
    if (updates.startTime) {
      const startHour = parseInt(updates.startTime.split(':')[0]);
      if (startHour < 0 || startHour > 23) {
        errors.push({ type: 'schedule', message: 'La hora de inicio debe estar entre 00:00 y 23:59' });
      }
    }
    
    if (updates.endTime) {
      const endHour = parseInt(updates.endTime.split(':')[0]);
      if (endHour < 0 || endHour > 23) {
        errors.push({ type: 'schedule', message: 'La hora de fin debe estar entre 00:00 y 23:59' });
      }
    }
    
    // Validar que la hora de fin sea posterior a la de inicio si se actualizan ambos
    if (updates.startTime && updates.endTime) {
      const startHour = parseInt(updates.startTime.split(':')[0]);
      const endHour = parseInt(updates.endTime.split(':')[0]);
      const startMinute = parseInt(updates.startTime.split(':')[1]);
      const endMinute = parseInt(updates.endTime.split(':')[1]);
      
      if (startHour > endHour || (startHour === endHour && startMinute >= endMinute)) {
        errors.push({ type: 'schedule', message: 'La hora de fin debe ser posterior a la hora de inicio' });
      }
    }
    
    // Validar que el empleado no esté de vacaciones si se actualiza la fecha o el empleado
    if (updates.date || updates.employeeId) {
      const currentShift = shifts.find(s => s.id === id);
      if (currentShift) {
        const employeeId = updates.employeeId || currentShift.employeeId;
        const date = updates.date || currentShift.date;
        
        const hasVacationConflict = await checkVacationConflict(employeeId, date);
        if (hasVacationConflict) {
          errors.push({ type: 'schedule', message: 'No se puede asignar un turno durante las vacaciones aprobadas del empleado' });
        }
      }
    }
    
    // Validar conflictos de turnos si se actualiza horario, empleado o fecha
    if (updates.startTime || updates.endTime || updates.employeeId || updates.date) {
      const currentShift = shifts.find(s => s.id === id);
      if (currentShift) {
        const updatedShift = {
          employeeId: updates.employeeId || currentShift.employeeId,
          date: updates.date || currentShift.date,
          startTime: updates.startTime || currentShift.startTime,
          endTime: updates.endTime || currentShift.endTime
        };
        
        const hasShiftConflict = checkShiftConflict(updatedShift, shifts, id);
        if (hasShiftConflict) {
          errors.push({ type: 'schedule', message: 'El empleado ya tiene un turno asignado en ese horario' });
        }
      }
    }
    
    if (errors.length > 0) {
      return errors;
    }
    
    try {
      const shiftRef = doc(db, 'shifts', id);
      
      // Si se actualiza startTime o endTime, recalcular hours
      if (updates.startTime || updates.endTime) {
        const currentShift = shifts.find(s => s.id === id);
        if (currentShift) {
          const startTime = updates.startTime || currentShift.startTime;
          const endTime = updates.endTime || currentShift.endTime;
          updates.hours = calculateHours(startTime, endTime);
        }
      }
      
      const updateData = {
        ...updates,
        isPublished: false, // Marcar como no publicado cuando se modifica
        updatedAt: new Date()
      };
      
      await updateDoc(shiftRef, updateData);
    } catch (error) {
      console.error('Error updating shift:', error);
      errors.push({ type: 'schedule', message: 'Error al actualizar el turno' });
    }
    
    return errors;
  };

  const deleteShift = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'shifts', id));
    } catch (error) {
      console.error('Error deleting shift:', error);
    }
  };

  const publishShifts = async (shiftIds: string[]) => {
    try {
      const updatePromises = shiftIds.map(id => {
        const shiftRef = doc(db, 'shifts', id);
        return updateDoc(shiftRef, { 
          isPublished: true,
          updatedAt: new Date()
        });
      });
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error publishing shifts:', error);
    }
  };

  const addStoreSchedule = async (scheduleData: Omit<StoreSchedule, 'id'>) => {
    try {
      console.log('ScheduleContext: addStoreSchedule called with:', scheduleData);
      const docRef = await addDoc(collection(db, 'storeSchedule'), scheduleData);
      console.log('ScheduleContext: addStoreSchedule completed with ID:', docRef.id);
    } catch (error) {
      console.error('Error adding store schedule:', error);
    }
  };

  const updateStoreSchedule = async (id: string, updates: Partial<StoreSchedule>) => {
    try {
      console.log('ScheduleContext: updateStoreSchedule called with:', { id, updates });
      await updateDoc(doc(db, 'storeSchedule', id), updates);
      console.log('ScheduleContext: updateStoreSchedule completed successfully');
    } catch (error) {
      console.error('Error updating store schedule:', error);
    }
  };

  const addStoreException = async (exceptionData: Omit<StoreException, 'id'>) => {
    try {
      await addDoc(collection(db, 'storeExceptions'), exceptionData);
    } catch (error) {
      console.error('Error adding store exception:', error);
    }
  };

  const updateStoreException = async (id: string, updates: Partial<StoreException>) => {
    try {
      await updateDoc(doc(db, 'storeExceptions', id), updates);
    } catch (error) {
      console.error('Error updating store exception:', error);
    }
  };

  const deleteStoreException = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'storeExceptions', id));
    } catch (error) {
      console.error('Error deleting store exception:', error);
    }
  };

  const saveTemplate = async (name: string, templateShifts: Omit<Shift, 'id' | 'isPublished' | 'createdAt' | 'updatedAt'>[]) => {
    try {
      const templateData = {
        name,
        shifts: templateShifts,
        createdAt: new Date()
      };
      
      await addDoc(collection(db, 'templates'), templateData);
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const applyTemplate = async (templateId: string, startDate: string): Promise<ValidationError[]> => {
    const errors: ValidationError[] = [];
    
    // Validar que hay una tienda seleccionada
    if (!currentStore) {
      errors.push({ type: 'schedule', message: 'No hay tienda seleccionada' });
      return errors;
    }
    
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) {
        errors.push({ type: 'schedule', message: 'Plantilla no encontrada' });
        return errors;
      }

      const addPromises = template.shifts.map(shift => {
        const newShift = {
          ...shift,
          storeId: currentStore.id,
          date: startDate,
          isPublished: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        return addDoc(collection(db, 'shifts'), newShift);
      });
      
      await Promise.all(addPromises);
    } catch (error) {
      console.error('Error applying template:', error);
      errors.push({ type: 'schedule', message: 'Error al aplicar la plantilla' });
    }
    
    return errors;
  };

  const copyWeekToNext = async (startDate: string): Promise<ValidationError[]> => {
    const errors: ValidationError[] = [];
    
    // Validar que hay una tienda seleccionada
    if (!currentStore) {
      errors.push({ type: 'schedule', message: 'No hay tienda seleccionada' });
      return errors;
    }
    
    try {
      // Calcular la fecha de inicio de la siguiente semana
      const currentDate = new Date(startDate);
      const nextWeekDate = new Date(currentDate);
      nextWeekDate.setDate(currentDate.getDate() + 7);
      const nextWeekStart = nextWeekDate.toISOString().split('T')[0];
      
      // Obtener turnos de la semana actual
      const weekShifts = shifts.filter(shift => shift.date === startDate);
      
      const addPromises = weekShifts.map(shift => {
        const newShift = {
          employeeId: shift.employeeId,
          storeId: currentStore.id,
          date: nextWeekStart,
          startTime: shift.startTime,
          endTime: shift.endTime,
          hours: shift.hours,
          isPublished: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        return addDoc(collection(db, 'shifts'), newShift);
      });
      
      await Promise.all(addPromises);
    } catch (error) {
      console.error('Error copying week:', error);
      errors.push({ type: 'schedule', message: 'Error al copiar la semana' });
    }
    
    return errors;
  };

  return (
    <ScheduleContext.Provider value={{
      shifts,
      storeSchedule,
      storeExceptions,
      templates,
      addShift,
      updateShift,
      deleteShift,
      publishShifts,
      addStoreSchedule,
      updateStoreSchedule,
      addStoreException,
      updateStoreException,
      deleteStoreException,
      saveTemplate,
      applyTemplate,
      copyWeekToNext,
      checkVacationConflict,
      getShiftsByStore,
      getAllShifts,
      isLoading
    }}>
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
}