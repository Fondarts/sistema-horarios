import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Employee } from '../types';
import { useEmployees } from './EmployeeContext';
import { auth, db } from '../firebase';
import { 
  signInAnonymously, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  currentEmployee: Employee | null;
  login: (name: string, pin: string) => Promise<{ success: boolean; message: string }>;
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
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Escuchar cambios en la autenticación de Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      
      if (user) {
        // Usuario autenticado, buscar empleado asociado
        try {
          const employeeDoc = await getDoc(doc(db, 'employees', user.uid));
          if (employeeDoc.exists()) {
            const employeeData = employeeDoc.data() as Employee;
            setCurrentEmployee({ id: user.uid, ...employeeData });
          } else {
            // Si no hay empleado asociado, cerrar sesión
            await signOut(auth);
            setCurrentEmployee(null);
          }
        } catch (error) {
          console.error('Error loading employee data:', error);
          setCurrentEmployee(null);
        }
      } else {
        setCurrentEmployee(null);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (name: string, pin: string): Promise<{ success: boolean; message: string }> => {
    try {
      // Buscar empleado por nombre y PIN
      const employee = employees.find(emp => 
        emp.name.toLowerCase().trim() === name.toLowerCase().trim() && 
        emp.pin === pin &&
        emp.isActive
      );

      if (employee) {
        // Crear un documento temporal para el empleado si no existe
        const employeeRef = doc(db, 'employees', employee.id);
        const employeeDoc = await getDoc(employeeRef);
        
        if (!employeeDoc.exists()) {
          // Si el empleado no existe en Firestore, crearlo
          await setDoc(employeeRef, employee);
        }

        // Autenticar con Firebase usando el ID del empleado como UID
        await signInAnonymously(auth);
        
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

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentEmployee(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isAuthenticated = currentEmployee !== null && firebaseUser !== null;
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