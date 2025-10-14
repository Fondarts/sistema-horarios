import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy,
  where
} from 'firebase/firestore';

export interface Holiday {
  id: string;
  date: string;
  name: string;
  type: 'national' | 'regional' | 'local';
  description?: string;
  isRecurring: boolean;
  addedToCalendar: boolean;
  year: number;
}

interface HolidayContextType {
  holidays: Holiday[];
  addHolidayToCalendar: (holiday: Omit<Holiday, 'id'>) => Promise<void>;
  removeHolidayFromCalendar: (holidayId: string) => Promise<void>;
  isHoliday: (date: string) => boolean;
  getHolidayForDate: (date: string) => Holiday | undefined;
  isLoading: boolean;
}

const HolidayContext = createContext<HolidayContextType | undefined>(undefined);

export function HolidayProvider({ children }: { children: ReactNode }) {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar feriados desde Firebase
  useEffect(() => {
    const holidaysRef = collection(db, 'holidays');
    const q = query(holidaysRef, orderBy('date'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const holidaysData: Holiday[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        holidaysData.push({
          id: doc.id,
          ...data,
          addedToCalendar: data.addedToCalendar || false
        } as Holiday);
      });
      setHolidays(holidaysData);
      setIsLoading(false);
    }, (error) => {
      console.error('Error loading holidays:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addHolidayToCalendar = async (holidayData: Omit<Holiday, 'id'>) => {
    try {
      await addDoc(collection(db, 'holidays'), {
        ...holidayData,
        addedToCalendar: true
      });
    } catch (error) {
      console.error('Error adding holiday to calendar:', error);
      throw error;
    }
  };

  const removeHolidayFromCalendar = async (holidayId: string) => {
    try {
      await deleteDoc(doc(db, 'holidays', holidayId));
    } catch (error) {
      console.error('Error removing holiday from calendar:', error);
      throw error;
    }
  };

  const isHoliday = (date: string): boolean => {
    return holidays.some(holiday => 
      holiday.date === date && holiday.addedToCalendar
    );
  };

  const getHolidayForDate = (date: string): Holiday | undefined => {
    return holidays.find(holiday => 
      holiday.date === date && holiday.addedToCalendar
    );
  };

  return (
    <HolidayContext.Provider value={{
      holidays,
      addHolidayToCalendar,
      removeHolidayFromCalendar,
      isHoliday,
      getHolidayForDate,
      isLoading
    }}>
      {children}
    </HolidayContext.Provider>
  );
}

export function useHolidays() {
  const context = useContext(HolidayContext);
  if (context === undefined) {
    throw new Error('useHolidays must be used within a HolidayProvider');
  }
  return context;
}
