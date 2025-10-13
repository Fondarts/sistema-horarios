import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Employee, UnavailableTime } from '../types';

interface EmployeeContextType {
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  getEmployee: (id: string) => Employee | undefined;
  resetToMockEmployees: () => void;
  isLoading: boolean;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

// Colores predefinidos para empleados
const defaultColors = [
  '#3B82F6', // Azul
  '#10B981', // Verde
  '#F59E0B', // Amarillo
  '#EF4444', // Rojo
  '#8B5CF6', // Púrpura
  '#06B6D4', // Cian
  '#F97316', // Naranja
  '#84CC16', // Lima
  '#EC4899', // Rosa
  '#6B7280'  // Gris
];

// Función para obtener el siguiente color disponible
const getNextAvailableColor = (existingEmployees: Employee[]): string => {
  const usedColors = existingEmployees.map(emp => emp.color);
  const availableColor = defaultColors.find(color => !usedColors.includes(color));
  return availableColor || defaultColors[Math.floor(Math.random() * defaultColors.length)];
};

// Empleados de prueba
const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'Ana Perez',
    weeklyLimit: 40,
    unavailableTimes: [
      {
        id: '1',
        dayOfWeek: 2, // Martes
        startTime: '14:00',
        endTime: '18:00'
      }
    ],
    birthday: '10/04/1995',
    isActive: true,
    color: '#3B82F6' // Azul
  },
  {
    id: '2',
    name: 'Luis Gomez',
    weeklyLimit: 35,
    unavailableTimes: [],
    birthday: '15/08/1990',
    isActive: true,
    color: '#10B981' // Verde
  },
  {
    id: '3',
    name: 'María Rodriguez',
    weeklyLimit: 30,
    unavailableTimes: [
      {
        id: '2',
        dayOfWeek: 0, // Domingo
        startTime: '00:00',
        endTime: '23:59'
      }
    ],
    birthday: '03/12/1988',
    isActive: true,
    color: '#F59E0B' // Amarillo
  },
  {
    id: '4',
    name: 'Carlos Martinez',
    weeklyLimit: 45,
    unavailableTimes: [
      {
        id: '3',
        dayOfWeek: 1, // Lunes
        startTime: '09:00',
        endTime: '12:00'
      }
    ],
    birthday: '22/07/1992',
    isActive: true,
    color: '#EF4444' // Rojo
  },
  {
    id: '5',
    name: 'Sofia Lopez',
    weeklyLimit: 38,
    unavailableTimes: [],
    birthday: '14/03/1996',
    isActive: true,
    color: '#8B5CF6' // Púrpura
  },
  {
    id: '6',
    name: 'Diego Fernandez',
    weeklyLimit: 42,
    unavailableTimes: [
      {
        id: '4',
        dayOfWeek: 5, // Viernes
        startTime: '18:00',
        endTime: '23:59'
      }
    ],
    birthday: '08/11/1991',
    isActive: true,
    color: '#06B6D4' // Cian
  },
  {
    id: '7',
    name: 'Valentina Torres',
    weeklyLimit: 32,
    unavailableTimes: [],
    birthday: '17/09/1994',
    isActive: true,
    color: '#F97316' // Naranja
  }
];

interface EmployeeProviderProps {
  children: ReactNode;
}

export function EmployeeProvider({ children }: EmployeeProviderProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Cargar empleados desde localStorage o usar datos de prueba
    const savedEmployees = localStorage.getItem('employees');
    if (savedEmployees) {
      try {
        const parsedEmployees = JSON.parse(savedEmployees);
        // Migrar empleados existentes que no tienen color
        const migratedEmployees = parsedEmployees.map((emp: any) => ({
          ...emp,
          color: emp.color || getNextAvailableColor(parsedEmployees)
        }));
        setEmployees(migratedEmployees);
      } catch (error) {
        console.error('Error parsing saved employees:', error);
        setEmployees(mockEmployees);
      }
    } else {
      setEmployees(mockEmployees);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Guardar empleados en localStorage cuando cambien
    if (!isLoading) {
      localStorage.setItem('employees', JSON.stringify(employees));
    }
  }, [employees, isLoading]);

  const addEmployee = (employeeData: Omit<Employee, 'id'>) => {
    const newEmployee: Employee = {
      ...employeeData,
      id: Date.now().toString(),
      color: employeeData.color || getNextAvailableColor(employees)
    };
    setEmployees(prev => [...prev, newEmployee]);
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees(prev => 
      prev.map(emp => 
        emp.id === id ? { ...emp, ...updates } : emp
      )
    );
  };

  const deleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(emp => emp.id !== id));
  };

  const getEmployee = (id: string) => {
    return employees.find(emp => emp.id === id);
  };

  const resetToMockEmployees = () => {
    localStorage.removeItem('employees');
    setEmployees(mockEmployees);
  };

  const value: EmployeeContextType = {
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployee,
    resetToMockEmployees,
    isLoading
  };

  return (
    <EmployeeContext.Provider value={value}>
      {children}
    </EmployeeContext.Provider>
  );
}

export function useEmployees() {
  const context = useContext(EmployeeContext);
  if (context === undefined) {
    throw new Error('useEmployees must be used within an EmployeeProvider');
  }
  return context;
}


