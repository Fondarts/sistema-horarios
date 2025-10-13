import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Shift, StoreSchedule, StoreException, ValidationError, Template } from '../types';
import { db } from '../firebase';
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
  isLoading: boolean;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

// Horario de tienda por defecto
const defaultStoreSchedule: StoreSchedule[] = [
  { id: '1', dayOfWeek: 1, isOpen: true, openTime: '09:00', closeTime: '20:00' }, // Lunes
  { id: '2', dayOfWeek: 2, isOpen: true, openTime: '09:00', closeTime: '20:00' }, // Martes
  { id: '3', dayOfWeek: 3, isOpen: true, openTime: '09:00', closeTime: '20:00' }, // Miércoles
  { id: '4', dayOfWeek: 4, isOpen: true, openTime: '09:00', closeTime: '20:00' }, // Jueves
  { id: '5', dayOfWeek: 5, isOpen: true, openTime: '09:00', closeTime: '20:00' }, // Viernes
  { id: '6', dayOfWeek: 6, isOpen: true, openTime: '09:00', closeTime: '20:00' }, // Sábado
  { id: '7', dayOfWeek: 0, isOpen: false }, // Domingo cerrado
];

// Función para calcular horas entre dos tiempos
const calculateHours = (startTime: string, endTime: string): number => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return (endMinutes - startMinutes) / 60;
};

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [storeSchedule, setStoreSchedule] = useState<StoreSchedule[]>([]);
  const [storeExceptions, setStoreExceptions] = useState<StoreException[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar datos desde Firebase
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar shifts
        const shiftsRef = collection(db, 'shifts');
        const shiftsQuery = query(shiftsRef, orderBy('date'));
        const shiftsUnsubscribe = onSnapshot(shiftsQuery, (snapshot) => {
          const shiftsData: Shift[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            shiftsData.push({
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
            } as Shift);
          });
          setShifts(shiftsData);
        });

        // Cargar store schedule
        const storeScheduleRef = collection(db, 'storeSchedule');
        const storeScheduleQuery = query(storeScheduleRef, orderBy('dayOfWeek'));
        const storeScheduleUnsubscribe = onSnapshot(storeScheduleQuery, (snapshot) => {
          const scheduleData: StoreSchedule[] = [];
          snapshot.forEach((doc) => {
            scheduleData.push({ id: doc.id, ...doc.data() } as StoreSchedule);
          });
          setStoreSchedule(scheduleData);
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
          shiftsUnsubscribe();
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
  }, []);

  // Inicializar datos por defecto si no existen
  useEffect(() => {
    const initializeDefaultData = async () => {
      try {
        // Verificar si ya existe store schedule
        const storeScheduleRef = collection(db, 'storeSchedule');
        const scheduleSnapshot = await getDocs(storeScheduleRef);
        
        if (scheduleSnapshot.empty) {
          // Agregar horario por defecto
          const addPromises = defaultStoreSchedule.map(schedule => {
            const { id, ...scheduleData } = schedule;
            return addDoc(storeScheduleRef, scheduleData);
          });
          await Promise.all(addPromises);
        }
      } catch (error) {
        console.error('Error initializing default data:', error);
      }
    };

    if (!isLoading) {
      initializeDefaultData();
    }
  }, [isLoading]);

  const addShift = async (shiftData: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>): Promise<ValidationError[]> => {
    const errors: ValidationError[] = [];
    
    try {
      // Calcular horas automáticamente
      const hours = calculateHours(shiftData.startTime, shiftData.endTime);
      
      const newShift = {
        ...shiftData,
        hours,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'shifts'), newShift);
    } catch (error) {
      console.error('Error adding shift:', error);
      errors.push({ type: 'schedule', message: 'Error al crear el turno' });
    }
    
    return errors;
  };

  const updateShift = async (id: string, updates: Partial<Shift>): Promise<ValidationError[]> => {
    const errors: ValidationError[] = [];
    
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
      await addDoc(collection(db, 'storeSchedule'), scheduleData);
    } catch (error) {
      console.error('Error adding store schedule:', error);
    }
  };

  const updateStoreSchedule = async (id: string, updates: Partial<StoreSchedule>) => {
    try {
      await updateDoc(doc(db, 'storeSchedule', id), updates);
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
    
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) {
        errors.push({ type: 'schedule', message: 'Plantilla no encontrada' });
        return errors;
      }

      const addPromises = template.shifts.map(shift => {
        const newShift = {
          ...shift,
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