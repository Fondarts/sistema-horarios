import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Shift, StoreSchedule, StoreException, ValidationError, Template } from '../types';

interface ScheduleContextType {
  shifts: Shift[];
  storeSchedule: StoreSchedule[];
  storeExceptions: StoreException[];
  templates: Template[];
  addShift: (shift: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>) => ValidationError[];
  updateShift: (id: string, updates: Partial<Shift>) => ValidationError[];
  deleteShift: (id: string) => void;
  publishShifts: (shiftIds: string[]) => void;
  addStoreSchedule: (schedule: Omit<StoreSchedule, 'id'>) => void;
  updateStoreSchedule: (id: string, updates: Partial<StoreSchedule>) => void;
  addStoreException: (exception: Omit<StoreException, 'id'>) => void;
  updateStoreException: (id: string, updates: Partial<StoreException>) => void;
  deleteStoreException: (id: string) => void;
  saveTemplate: (name: string, shifts: Omit<Shift, 'id' | 'isPublished' | 'createdAt' | 'updatedAt'>[]) => void;
  applyTemplate: (templateId: string, startDate: string) => ValidationError[];
  copyWeekToNext: (startDate: string) => ValidationError[];
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

// Turnos de prueba
const mockShifts: Shift[] = [
  {
    id: '1',
    employeeId: '1',
    date: '2025-01-13',
    startTime: '09:00',
    endTime: '17:00',
    hours: 8,
    isPublished: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

interface ScheduleProviderProps {
  children: ReactNode;
}

export function ScheduleProvider({ children }: ScheduleProviderProps) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [storeSchedule, setStoreSchedule] = useState<StoreSchedule[]>([]);
  const [storeExceptions, setStoreExceptions] = useState<StoreException[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Cargar datos desde localStorage
    const savedShifts = localStorage.getItem('shifts');
    const savedStoreSchedule = localStorage.getItem('storeSchedule');
    const savedStoreExceptions = localStorage.getItem('storeExceptions');
    const savedTemplates = localStorage.getItem('templates');

    if (savedShifts) {
      try {
        setShifts(JSON.parse(savedShifts));
      } catch (error) {
        console.error('Error parsing saved shifts:', error);
        setShifts(mockShifts);
      }
    } else {
      setShifts(mockShifts);
    }

    if (savedStoreSchedule) {
      try {
        setStoreSchedule(JSON.parse(savedStoreSchedule));
      } catch (error) {
        console.error('Error parsing saved store schedule:', error);
        setStoreSchedule(defaultStoreSchedule);
      }
    } else {
      setStoreSchedule(defaultStoreSchedule);
    }

    if (savedStoreExceptions) {
      try {
        setStoreExceptions(JSON.parse(savedStoreExceptions));
      } catch (error) {
        console.error('Error parsing saved store exceptions:', error);
        setStoreExceptions([]);
      }
    }

    if (savedTemplates) {
      try {
        setTemplates(JSON.parse(savedTemplates));
      } catch (error) {
        console.error('Error parsing saved templates:', error);
        setTemplates([]);
      }
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Guardar datos en localStorage cuando cambien
    if (!isLoading) {
      localStorage.setItem('shifts', JSON.stringify(shifts));
      localStorage.setItem('storeSchedule', JSON.stringify(storeSchedule));
      localStorage.setItem('storeExceptions', JSON.stringify(storeExceptions));
      localStorage.setItem('templates', JSON.stringify(templates));
    }
  }, [shifts, storeSchedule, storeExceptions, templates, isLoading]);

  // Funciones de validación
  const validateShift = (shift: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>, excludeId?: string): ValidationError[] => {
    const errors: ValidationError[] = [];
    const shiftDate = new Date(shift.date);
    const dayOfWeek = shiftDate.getDay();

    // Validar horario de tienda (solo para días cerrados, permitir turnos fuera del horario)
    const daySchedule = storeSchedule.find(s => s.dayOfWeek === dayOfWeek);
    if (!daySchedule?.isOpen) {
      errors.push({
        type: 'schedule',
        message: 'La tienda está cerrada este día'
      });
    }
    // Comentado: Permitir turnos fuera del horario de tienda para inventarios, limpieza, etc.
    // else if (daySchedule.openTime && daySchedule.closeTime) {
    //   if (shift.startTime < daySchedule.openTime || shift.endTime > daySchedule.closeTime) {
    //     errors.push({
    //       type: 'schedule',
    //       message: 'Turno fuera del horario de tienda'
    //     });
    //   }
    // }

    // Validar excepciones
    const exception = storeExceptions.find(e => e.date === shift.date);
    if (exception && !exception.isOpen) {
      errors.push({
        type: 'schedule',
        message: 'La tienda está cerrada por excepción'
      });
    }

    // Validar solapamiento de turnos
    const overlappingShifts = shifts.filter(s => 
      s.employeeId === shift.employeeId &&
      s.date === shift.date &&
      (excludeId ? s.id !== excludeId : true) &&
      ((shift.startTime >= s.startTime && shift.startTime < s.endTime) ||
       (shift.endTime > s.startTime && shift.endTime <= s.endTime) ||
       (shift.startTime <= s.startTime && shift.endTime >= s.endTime))
    );

    if (overlappingShifts.length > 0) {
      errors.push({
        type: 'conflict',
        message: 'Solapamiento de turnos'
      });
    }

    return errors;
  };

  const addShift = (shiftData: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>): ValidationError[] => {
    const errors = validateShift(shiftData);
    
    if (errors.length === 0) {
      const newShift: Shift = {
        ...shiftData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setShifts(prev => [...prev, newShift]);
    }
    
    return errors;
  };

  const updateShift = (id: string, updates: Partial<Shift>): ValidationError[] => {
    const existingShift = shifts.find(s => s.id === id);
    if (!existingShift) return [];

    const updatedShift = { ...existingShift, ...updates };
    const errors = validateShift(updatedShift, id);
    
    if (errors.length === 0) {
      setShifts(prev => 
        prev.map(s => 
          s.id === id 
            ? { ...s, ...updates, updatedAt: new Date().toISOString() }
            : s
        )
      );
    }
    
    return errors;
  };

  const deleteShift = (id: string) => {
    setShifts((prev: Shift[]) => prev.filter((s: Shift) => s.id !== id));
  };

  const publishShifts = (shiftIds: string[]) => {
    setShifts((prev: Shift[]) => 
      prev.map((s: Shift) => 
        shiftIds.includes(s.id) 
          ? { ...s, isPublished: true, updatedAt: new Date().toISOString() }
          : s
      )
    );
  };

  const addStoreSchedule = (scheduleData: Omit<StoreSchedule, 'id'>) => {
    const newSchedule: StoreSchedule = {
      ...scheduleData,
      id: Date.now().toString()
    };
    setStoreSchedule((prev: StoreSchedule[]) => [...prev, newSchedule]);
  };

  const updateStoreSchedule = (id: string, updates: Partial<StoreSchedule>) => {
    setStoreSchedule((prev: StoreSchedule[]) => 
      prev.map((s: StoreSchedule) => 
        s.id === id ? { ...s, ...updates } : s
      )
    );
  };

  const addStoreException = (exceptionData: Omit<StoreException, 'id'>) => {
    const newException: StoreException = {
      ...exceptionData,
      id: Date.now().toString()
    };
    setStoreExceptions((prev: StoreException[]) => [...prev, newException]);
  };

  const updateStoreException = (id: string, updates: Partial<StoreException>) => {
    setStoreExceptions((prev: StoreException[]) => 
      prev.map((e: StoreException) => 
        e.id === id ? { ...e, ...updates } : e
      )
    );
  };

  const deleteStoreException = (id: string) => {
    setStoreExceptions((prev: StoreException[]) => prev.filter((e: StoreException) => e.id !== id));
  };

  const saveTemplate = (name: string, templateShifts: Omit<Shift, 'id' | 'isPublished' | 'createdAt' | 'updatedAt'>[]) => {
    const newTemplate: Template = {
      id: Date.now().toString(),
      name,
      shifts: templateShifts,
      createdAt: new Date().toISOString()
    };
    setTemplates((prev: Template[]) => [...prev, newTemplate]);
  };

  const applyTemplate = (templateId: string, startDate: string): ValidationError[] => {
    const template = templates.find((t: Template) => t.id === templateId);
    if (!template) return [];

    const errors: ValidationError[] = [];
    const startDateObj = new Date(startDate);
    
    template.shifts.forEach((templateShift: Omit<Shift, 'id' | 'isPublished' | 'createdAt' | 'updatedAt'>) => {
      const shiftDate = new Date(startDateObj);
      shiftDate.setDate(startDateObj.getDate() + (parseInt(templateShift.date.split('-')[2]) - parseInt(startDate.split('-')[2])));
      
      const newShift: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'> = {
        ...templateShift,
        date: shiftDate.toISOString().split('T')[0],
        isPublished: false
      };
      
      const shiftErrors = validateShift(newShift);
      errors.push(...shiftErrors);
      
      if (shiftErrors.length === 0) {
        const finalShift: Shift = {
          ...newShift,
          id: Date.now().toString() + Math.random(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setShifts((prev: Shift[]) => [...prev, finalShift]);
      }
    });
    
    return errors;
  };

  const copyWeekToNext = (startDate: string): ValidationError[] => {
    const startDateObj = new Date(startDate);
    const nextWeekStart = new Date(startDateObj);
    nextWeekStart.setDate(startDateObj.getDate() + 7);
    
    const currentWeekShifts = shifts.filter((s: Shift) => {
      const shiftDate = new Date(s.date);
      return shiftDate >= startDateObj && shiftDate < nextWeekStart;
    });
    
    const errors: ValidationError[] = [];
    
    currentWeekShifts.forEach((shift: Shift) => {
      const newDate = new Date(shift.date);
      newDate.setDate(newDate.getDate() + 7);
      
      const newShift: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'> = {
        ...shift,
        date: newDate.toISOString().split('T')[0],
        isPublished: false
      };
      
      const shiftErrors = validateShift(newShift);
      errors.push(...shiftErrors);
      
      if (shiftErrors.length === 0) {
        const finalShift: Shift = {
          ...newShift,
          id: Date.now().toString() + Math.random(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setShifts((prev: Shift[]) => [...prev, finalShift]);
      }
    });
    
    return errors;
  };

  const value: ScheduleContextType = {
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
  };

  return (
    <ScheduleContext.Provider value={value}>
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

