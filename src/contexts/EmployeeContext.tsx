import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Employee, UnavailableTime } from '../types';

interface EmployeeContextType {
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  getEmployee: (id: string) => Employee | undefined;
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
    monthlyLimit: 160,
    unavailableTimes: [
      {
        id: '1',
        dayOfWeek: 2, // Martes
        startTime: '14:00',
        endTime: '18:00'
      }
    ],
    birthday: '1995-04-10',
    isActive: true,
    color: '#3B82F6' // Azul
  },
  {
    id: '2',
    name: 'Luis Gomez',
    monthlyLimit: 150,
    unavailableTimes: [],
    birthday: '1990-08-15',
    isActive: true,
    color: '#10B981' // Verde
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

  const value: EmployeeContextType = {
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployee,
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


