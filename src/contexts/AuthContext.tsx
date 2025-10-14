import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Employee } from '../types';
import { useEmployees } from './EmployeeContext';

export type UserRole = 'employee' | 'manager' | 'district-manager';

interface AuthContextType {
  currentEmployee: Employee | null;
  userRole: UserRole | null;
  login: (name: string, pin: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  isManager: boolean;
  isDistrictManager: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { employees } = useEmployees();
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
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

  const login = async (name: string, pin: string): Promise<{ success: boolean; message: string }> => {
    try {
      // Verificar si es un encargado de distrito (usuarios especiales)
      const districtManagers = [
        { name: 'admin', pin: 'admin123', role: 'district-manager' as UserRole },
        { name: 'distrito', pin: 'distrito123', role: 'district-manager' as UserRole }
      ];

      const districtManager = districtManagers.find(dm => 
        dm.name.toLowerCase() === name.toLowerCase() && dm.pin === pin
      );

      if (districtManager) {
        // Crear un empleado temporal para district managers
        const tempEmployee: Employee = {
          id: 'district-manager',
          name: 'Encargado de Distrito',
          position: 'District Manager',
          pin: pin,
          color: '#8B5CF6',
          monthlyHoursLimit: 0,
          unavailableHours: [],
          isActive: true,
          isManager: true
        };
        
        setCurrentEmployee(tempEmployee);
        setUserRole(districtManager.role);
        return { 
          success: true, 
          message: `Bienvenido/a, ${tempEmployee.name}` 
        };
      }

      // Buscar empleado normal por nombre y PIN
      const employee = employees.find(emp => 
        emp.name.toLowerCase().trim() === name.toLowerCase().trim() && 
        emp.pin === pin &&
        emp.isActive
      );

      if (employee) {
        setCurrentEmployee(employee);
        setUserRole(employee.isManager ? 'manager' : 'employee');
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
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: 'Error al iniciar sesión' 
      };
    }
  };

  const logout = () => {
    setCurrentEmployee(null);
    setUserRole(null);
  };

  const isAuthenticated = currentEmployee !== null;
  const isManager = userRole === 'manager' || currentEmployee?.isManager;
  const isDistrictManager = userRole === 'district-manager';

  return (
    <AuthContext.Provider value={{
      currentEmployee,
      userRole,
      login,
      logout,
      isAuthenticated,
      isManager,
      isDistrictManager,
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