import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Employee, EmployeeRole } from '../types';
import { useEmployees } from './EmployeeContext';

export type UserRole = 'employee' | 'manager' | 'district-manager'; // DEPRECATED: usar EmployeeRole

interface AuthContextType {
  currentEmployee: Employee | null;
  userRole: UserRole | null;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateCurrentEmployee: (updates: Partial<Employee>) => void;
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
  const { employees, getAllEmployees } = useEmployees();
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

  const login = async (username: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      // Primero, verificar usuarios especiales (para compatibilidad mientras se migran a Firebase)
      const specialUsers = [
        { 
          username: 'admin', 
          password: 'admin123', 
          role: 'distrito' as EmployeeRole,
          name: 'Encargado de Distrito'
        },
        { 
          username: 'distrito', 
          password: 'distrito123', 
          role: 'distrito' as EmployeeRole,
          name: 'Encargado de Distrito'
        }
      ];

      const specialUser = specialUsers.find(su => 
        su.username.toLowerCase() === username.toLowerCase() && 
        su.password === password
      );

      if (specialUser) {
        // Crear empleado temporal para usuarios especiales (se migrarán a Firebase después)
        const tempEmployee: Employee = {
          id: `special-${specialUser.username}`,
          name: specialUser.name,
          username: specialUser.username,
          password: specialUser.password,
          role: specialUser.role,
          color: '#8B5CF6',
          weeklyLimit: 0,
          monthlyHoursLimit: 0,
          unavailableTimes: [],
          unavailableHours: [],
          birthday: '1990-01-01',
          isActive: true,
          isManager: true
        };
        
        setCurrentEmployee(tempEmployee);
        setUserRole('district-manager');
        return { 
          success: true, 
          message: `Bienvenido/a, ${tempEmployee.name}` 
        };
      }

      // Buscar empleado en Firebase por username y password
      // Usar getAllEmployees() para incluir usuarios IT y otros que no tienen storeId
      const allEmployees = getAllEmployees();
      const employee = allEmployees.find(emp => 
        emp.username.toLowerCase().trim() === username.toLowerCase().trim() && 
        emp.password === password &&
        emp.isActive
      );

      if (employee) {
        setCurrentEmployee(employee);
        
        // Mapear el rol del empleado al UserRole (para compatibilidad)
        let userRole: UserRole = 'employee';
        if (employee.role === 'it') {
          userRole = 'district-manager'; // IT tiene permisos similares a district manager
        } else if (employee.role === 'region' || employee.role === 'distrito') {
          userRole = 'district-manager';
        } else if (employee.role === 'encargado') {
          userRole = 'manager';
        }
        
        setUserRole(userRole);
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

  const updateCurrentEmployee = (updates: Partial<Employee>) => {
    if (currentEmployee) {
      const updatedEmployee = { ...currentEmployee, ...updates };
      setCurrentEmployee(updatedEmployee);
      // El useEffect ya guardará automáticamente en localStorage
    }
  };

  const isAuthenticated = currentEmployee !== null;
  const isManager = userRole === 'manager' || (currentEmployee?.isManager ?? false);
  const isDistrictManager = userRole === 'district-manager';

  return (
    <AuthContext.Provider value={{
      currentEmployee,
      userRole,
      login,
      logout,
      updateCurrentEmployee,
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