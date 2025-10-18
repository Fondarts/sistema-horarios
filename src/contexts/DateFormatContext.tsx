import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type DateFormat = 'dd/mm/yyyy' | 'mm/dd/yyyy' | 'yyyy/mm/dd';

interface DateFormatContextType {
  dateFormat: DateFormat;
  setDateFormat: (format: DateFormat) => void;
  formatDate: (date: Date | string) => string;
  parseDate: (dateString: string) => Date;
}

const DateFormatContext = createContext<DateFormatContextType | undefined>(undefined);

export function useDateFormat() {
  const context = useContext(DateFormatContext);
  if (context === undefined) {
    throw new Error('useDateFormat must be used within a DateFormatProvider');
  }
  return context;
}

interface DateFormatProviderProps {
  children: ReactNode;
}

export function DateFormatProvider({ children }: DateFormatProviderProps) {
  const [dateFormat, setDateFormatState] = useState<DateFormat>('dd/mm/yyyy');

  // Load date format from localStorage on mount
  useEffect(() => {
    const savedDateFormat = localStorage.getItem('selectedDateFormat') as DateFormat;
    if (savedDateFormat && ['dd/mm/yyyy', 'mm/dd/yyyy', 'yyyy/mm/dd'].includes(savedDateFormat)) {
      setDateFormatState(savedDateFormat);
    }
  }, []);

  const setDateFormat = (newFormat: DateFormat) => {
    setDateFormatState(newFormat);
    localStorage.setItem('selectedDateFormat', newFormat);
  };

  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return '';
    }

    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear().toString();

    switch (dateFormat) {
      case 'mm/dd/yyyy':
        return `${month}/${day}/${year}`;
      case 'yyyy/mm/dd':
        return `${year}/${month}/${day}`;
      case 'dd/mm/yyyy':
      default:
        return `${day}/${month}/${year}`;
    }
  };

  const parseDate = (dateString: string): Date => {
    if (!dateString) return new Date();
    
    let parts: string[];
    
    if (dateString.includes('/')) {
      parts = dateString.split('/');
    } else if (dateString.includes('-')) {
      parts = dateString.split('-');
    } else {
      return new Date(dateString);
    }

    if (parts.length !== 3) {
      return new Date(dateString);
    }

    let day: number, month: number, year: number;

    switch (dateFormat) {
      case 'mm/dd/yyyy':
        month = parseInt(parts[0], 10) - 1; // JavaScript months are 0-based
        day = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
        break;
      case 'yyyy/mm/dd':
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-based
        day = parseInt(parts[2], 10);
        break;
      case 'dd/mm/yyyy':
      default:
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-based
        year = parseInt(parts[2], 10);
        break;
    }

    return new Date(year, month, day);
  };

  return (
    <DateFormatContext.Provider value={{ dateFormat, setDateFormat, formatDate, parseDate }}>
      {children}
    </DateFormatContext.Provider>
  );
}
