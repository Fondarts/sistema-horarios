import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Employee, UnavailableTime } from '../types';
import { useStore } from './StoreContext';
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

// Función para generar un PIN único de 5 dígitos
const generateUniquePin = (existingEmployees: Employee[]): string => {
  const usedPins = existingEmployees.map(emp => emp.pin);
  let newPin: string;
  do {
    newPin = Math.floor(10000 + Math.random() * 90000).toString(); // 10000-99999
  } while (usedPins.includes(newPin));
  return newPin;
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
    color: '#3B82F6', // Azul
    pin: '12345',
    role: 'encargado'
  },
  {
    id: '2',
    name: 'Luis Gomez',
    weeklyLimit: 35,
    unavailableTimes: [],
    birthday: '15/08/1990',
    isActive: true,
    color: '#10B981', // Verde
    pin: '23456',
    role: 'empleado'
  },
  {
    id: '3',
    name: 'María Rodriguez',
    weeklyLimit: 30,
    unavailableTimes: [
      {
        id: '2',
        dayOfWeek: 0, // Domingo
        startTime: '09:00',
        endTime: '12:00'
      }
    ],
    birthday: '22/03/1988',
    isActive: true,
    color: '#F59E0B', // Amarillo
    pin: '34567',
    role: 'empleado'
  },
  {
    id: '4',
    name: 'Carlos Martinez',
    weeklyLimit: 25,
    unavailableTimes: [],
    birthday: '05/12/1992',
    isActive: true,
    color: '#EF4444', // Rojo
    pin: '45678',
    role: 'empleado'
  },
  {
    id: '5',
    name: 'Sofia Lopez',
    weeklyLimit: 32,
    unavailableTimes: [
      {
        id: '3',
        dayOfWeek: 6, // Sábado
        startTime: '18:00',
        endTime: '22:00'
      }
    ],
    birthday: '18/07/1996',
    isActive: true,
    color: '#8B5CF6', // Púrpura
    pin: '56789',
    role: 'empleado'
  },
  {
    id: '6',
    name: 'Diego Fernandez',
    weeklyLimit: 28,
    unavailableTimes: [],
    birthday: '03/11/1991',
    isActive: true,
    color: '#06B6D4', // Cian
    pin: '67890',
    role: 'empleado'
  },
  {
    id: '7',
    name: 'Valentina Torres',
    weeklyLimit: 26,
    unavailableTimes: [
      {
        id: '4',
        dayOfWeek: 1, // Lunes
        startTime: '08:00',
        endTime: '10:00'
      }
    ],
    birthday: '14/09/1994',
    isActive: true,
    color: '#F97316', // Naranja
    pin: '78901',
    role: 'empleado'
  },
  {
    id: '8',
    name: 'Roberto Silva',
    weeklyLimit: 30,
    unavailableTimes: [],
    birthday: '28/01/1989',
    isActive: true,
    color: '#84CC16', // Lima
    pin: '89012',
    role: 'empleado'
  },
  {
    id: '9',
    name: 'Camila Herrera',
    weeklyLimit: 24,
    unavailableTimes: [
      {
        id: '5',
        dayOfWeek: 3, // Miércoles
        startTime: '16:00',
        endTime: '20:00'
      }
    ],
    birthday: '12/06/1993',
    isActive: true,
    color: '#EC4899', // Rosa
    pin: '90123',
    role: 'empleado'
  },
  {
    id: '10',
    name: 'Andres Morales',
    weeklyLimit: 35,
    unavailableTimes: [],
    birthday: '07/02/1990',
    isActive: true,
    color: '#6B7280', // Gris
    pin: '01234',
    role: 'empleado'
  }
];

export function EmployeeProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentStore } = useStore();

  // Cargar empleados desde Firebase filtrados por tienda
  useEffect(() => {
    console.log('EmployeeContext: currentStore changed:', currentStore);
    
    if (!currentStore) {
      console.log('EmployeeContext: No currentStore, clearing employees');
      setEmployees([]);
      setIsLoading(false);
      return;
    }

    console.log('EmployeeContext: Loading employees for store:', currentStore.id, currentStore.name);

    const employeesRef = collection(db, 'employees');
    const q = query(
      employeesRef, 
      where('storeId', '==', currentStore.id),
      orderBy('name')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const employeesData: Employee[] = [];
      console.log('EmployeeContext: Received snapshot with', snapshot.size, 'employees');
      
      snapshot.forEach((doc) => {
        const employeeData = { id: doc.id, ...doc.data() } as Employee;
        console.log('EmployeeContext: Employee data:', employeeData);
        employeesData.push(employeeData);
      });
      
      console.log('EmployeeContext: Setting employees:', employeesData);
      setEmployees(employeesData);
      setIsLoading(false);
    }, (error) => {
      console.error('Error loading employees:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentStore]);

  const addEmployee = async (employeeData: Omit<Employee, 'id'>) => {
    if (!currentStore) {
      throw new Error('No hay tienda seleccionada');
    }

    try {
      const newEmployee: Omit<Employee, 'id'> = {
        ...employeeData,
        storeId: currentStore.id,
        color: employeeData.color || getNextAvailableColor(employees),
        pin: employeeData.pin || generateUniquePin(employees),
        role: employeeData.role || 'empleado'
      };

      console.log('EmployeeContext: Adding employee with data:', newEmployee);
      console.log('EmployeeContext: Current store ID:', currentStore.id);
      
      const docRef = await addDoc(collection(db, 'employees'), newEmployee);
      console.log('EmployeeContext: Employee added with ID:', docRef.id);
    } catch (error) {
      console.error('Error adding employee:', error);
      throw error;
    }
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    try {
      const employeeRef = doc(db, 'employees', id);
      await updateDoc(employeeRef, updates);
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'employees', id));
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  };

  const getEmployee = (id: string): Employee | undefined => {
    return employees.find(emp => emp.id === id);
  };

  const resetToMockEmployees = async () => {
    if (!currentStore) {
      throw new Error('No hay tienda seleccionada');
    }

    try {
      setIsLoading(true);
      
      // Eliminar solo los empleados de la tienda actual
      const employeesRef = collection(db, 'employees');
      const q = query(employeesRef, where('storeId', '==', currentStore.id));
      const snapshot = await getDocs(q);
      
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Agregar empleados de prueba con el storeId correcto
      const addPromises = mockEmployees.map(employee => {
        const { id, ...employeeData } = employee;
        return addDoc(employeesRef, { ...employeeData, storeId: currentStore.id });
      });
      
      await Promise.all(addPromises);
    } catch (error) {
      console.error('Error resetting to mock employees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <EmployeeContext.Provider value={{
      employees,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      getEmployee,
      resetToMockEmployees,
      isLoading
    }}>
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