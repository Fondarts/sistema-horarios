import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Employee } from '../types';
import { useEmployees } from './EmployeeContext';

interface AuthContextType {
  currentEmployee: Employee | null;
  login: (name: string, pin: string) => { success: boolean; message: string };
  logout: () => void;
  isAuthenticated: boolean;
  isManager: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { employees } = useEmployees();
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar empleado logueado desde localStorage al iniciar
  useEffect(() => {
    const savedEmployee = localStorage.getItem('currentEmployee');
    if (savedEmployee) {
      try {
        const employee = JSON.parse(savedEmployee);
        // Verificar que el empleado aún existe en la lista actual
        const existingEmployee = employees.find(emp => emp.id === employee.id);
        if (existingEmployee) {
          setCurrentEmployee(existingEmployee);
        } else {
          // Si el empleado ya no existe, limpiar la sesión
          localStorage.removeItem('currentEmployee');
        }
      } catch (error) {
        console.error('Error loading saved employee:', error);
        localStorage.removeItem('currentEmployee');
      }
    }
    setIsLoading(false);
  }, [employees]);

  // Guardar empleado logueado en localStorage
  useEffect(() => {
    if (currentEmployee) {
      localStorage.setItem('currentEmployee', JSON.stringify(currentEmployee));
    } else {
      localStorage.removeItem('currentEmployee');
    }
  }, [currentEmployee]);

  const login = (name: string, pin: string): { success: boolean; message: string } => {
    // Buscar empleado por nombre y PIN
    const employee = employees.find(emp => 
      emp.name.toLowerCase().trim() === name.toLowerCase().trim() && 
      emp.pin === pin &&
      emp.isActive
    );

    if (employee) {
      setCurrentEmployee(employee);
      return { 
        success: true, 
        message: `Bienvenido/a, ${employee.name}` 
      };
    } else {
      return { 
        success: false, 
        message: 'Credenciales incorrectas o empleado inactivo' 
      };
    }
  };

  const logout = () => {
    setCurrentEmployee(null);
  };

  const isAuthenticated = currentEmployee !== null;
  const isManager = currentEmployee?.role === 'encargado';

  return (
    <AuthContext.Provider value={{
      currentEmployee,
      login,
      logout,
      isAuthenticated,
      isManager,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}