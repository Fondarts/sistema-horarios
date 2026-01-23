import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { RolePermissions, ModuleType } from '../components/PermissionsManagement';

export interface ModulePermissions {
  read: boolean;
  edit: boolean;
}

export interface Permissions {
  schedule: ModulePermissions;
  employees: ModulePermissions;
  absences: ModulePermissions;
  storeSchedule: ModulePermissions;
  stores: ModulePermissions;
  statistics: ModulePermissions;
  export: ModulePermissions;
  history: ModulePermissions;
  timeClockHistory: ModulePermissions;
}

const DEFAULT_PERMISSIONS: Permissions = {
  schedule: { read: false, edit: false },
  employees: { read: false, edit: false },
  absences: { read: false, edit: false },
  storeSchedule: { read: false, edit: false },
  stores: { read: false, edit: false },
  statistics: { read: false, edit: false },
  export: { read: false, edit: false },
  history: { read: false, edit: false },
  timeClockHistory: { read: false, edit: false }
};

const DEFAULT_ROLE_PERMISSIONS: Record<string, Permissions> = {
  'region': {
    schedule: { read: true, edit: true },
    employees: { read: true, edit: true },
    absences: { read: true, edit: true },
    storeSchedule: { read: true, edit: true },
    stores: { read: true, edit: false },
    statistics: { read: true, edit: true },
    export: { read: true, edit: true },
    history: { read: false, edit: false },
    timeClockHistory: { read: false, edit: false }
  },
  'distrito': {
    schedule: { read: true, edit: true },
    employees: { read: true, edit: true },
    absences: { read: true, edit: true },
    storeSchedule: { read: true, edit: true },
    stores: { read: true, edit: false },
    statistics: { read: true, edit: true },
    export: { read: true, edit: true },
    history: { read: false, edit: false },
    timeClockHistory: { read: false, edit: false }
  },
  'encargado': {
    schedule: { read: true, edit: true },
    employees: { read: true, edit: true },
    absences: { read: true, edit: true },
    storeSchedule: { read: true, edit: true },
    stores: { read: true, edit: false },
    statistics: { read: true, edit: true },
    export: { read: true, edit: true },
    history: { read: false, edit: false },
    timeClockHistory: { read: false, edit: false }
  },
  'empleado': {
    schedule: { read: true, edit: false },
    employees: { read: true, edit: false },
    absences: { read: true, edit: false },
    storeSchedule: { read: false, edit: false },
    stores: { read: false, edit: false },
    statistics: { read: false, edit: false },
    export: { read: false, edit: false },
    history: { read: false, edit: false },
    timeClockHistory: { read: false, edit: false }
  },
  'it': {
    schedule: { read: true, edit: true },
    employees: { read: true, edit: true },
    absences: { read: true, edit: true },
    storeSchedule: { read: true, edit: true },
    stores: { read: true, edit: false },
    statistics: { read: true, edit: true },
    export: { read: true, edit: true },
    history: { read: true, edit: true },
    timeClockHistory: { read: true, edit: true }
  }
};

export function usePermissions(): Permissions {
  const { currentEmployee } = useAuth();
  const [permissions, setPermissions] = useState<Permissions>(DEFAULT_PERMISSIONS);

  useEffect(() => {
    if (!currentEmployee) {
      setPermissions(DEFAULT_PERMISSIONS);
      return;
    }

    const permissionsRef = doc(db, 'permissions', 'main');
    
    const unsubscribe = onSnapshot(
      permissionsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const roles: RolePermissions[] = data.roles || [];
          
          // Primero buscar permisos individuales (tienen prioridad)
          const individualPermissions = data.individualPermissions || [];
          const individualPerm = individualPermissions.find((p: any) => p.employeeId === currentEmployee.id);
          
          // Buscar los permisos del rol actual del empleado
          const rolePermissions = roles.find(r => r.role === currentEmployee.role);
          
          // Si hay permisos individuales, usarlos; si no, usar los del rol
          if (individualPerm && individualPerm.permissions) {
            // Usar permisos individuales (tienen prioridad)
            const loadedPermissions: Permissions = {
              schedule: individualPerm.permissions.schedule || DEFAULT_PERMISSIONS.schedule,
              employees: individualPerm.permissions.employees || DEFAULT_PERMISSIONS.employees,
              absences: individualPerm.permissions.absences || DEFAULT_PERMISSIONS.absences,
              storeSchedule: individualPerm.permissions.storeSchedule || DEFAULT_PERMISSIONS.storeSchedule,
              stores: individualPerm.permissions.stores || DEFAULT_PERMISSIONS.stores,
              statistics: individualPerm.permissions.statistics || DEFAULT_PERMISSIONS.statistics,
              export: individualPerm.permissions.export || DEFAULT_PERMISSIONS.export,
              history: individualPerm.permissions.history || DEFAULT_PERMISSIONS.history,
              timeClockHistory: individualPerm.permissions.timeClockHistory || DEFAULT_PERMISSIONS.timeClockHistory
            };
            setPermissions(loadedPermissions);
          } else if (rolePermissions && rolePermissions.permissions) {
            // Usar permisos del rol
            const loadedPermissions: Permissions = {
              schedule: rolePermissions.permissions.schedule || DEFAULT_PERMISSIONS.schedule,
              employees: rolePermissions.permissions.employees || DEFAULT_PERMISSIONS.employees,
              absences: rolePermissions.permissions.absences || DEFAULT_PERMISSIONS.absences,
              storeSchedule: rolePermissions.permissions.storeSchedule || DEFAULT_PERMISSIONS.storeSchedule,
              stores: rolePermissions.permissions.stores || DEFAULT_PERMISSIONS.stores,
              statistics: rolePermissions.permissions.statistics || DEFAULT_PERMISSIONS.statistics,
              export: rolePermissions.permissions.export || DEFAULT_PERMISSIONS.export,
              history: rolePermissions.permissions.history || DEFAULT_PERMISSIONS.history,
              timeClockHistory: rolePermissions.permissions.timeClockHistory || DEFAULT_PERMISSIONS.timeClockHistory
            };
            setPermissions(loadedPermissions);
          } else {
            // Si no se encuentra el rol, usar permisos por defecto según el rol
            setPermissions(DEFAULT_ROLE_PERMISSIONS[currentEmployee.role] || DEFAULT_PERMISSIONS);
          }
        } else {
          // Si no existe la configuración, usar permisos por defecto
          setPermissions(DEFAULT_ROLE_PERMISSIONS[currentEmployee.role] || DEFAULT_PERMISSIONS);
        }
      },
      (error) => {
        console.error('Error loading permissions:', error);
        // En caso de error, usar permisos por defecto
        setPermissions(DEFAULT_ROLE_PERMISSIONS[currentEmployee?.role || 'empleado'] || DEFAULT_PERMISSIONS);
      }
    );

    return () => unsubscribe();
  }, [currentEmployee]);

  return permissions;
}

// Helper function para verificar si un usuario tiene acceso a un módulo (lectura o edición)
export function hasModuleAccess(permissions: Permissions, module: ModuleType, requireEdit: boolean = false): boolean {
  const modulePerms = permissions[module];
  if (!modulePerms) return false;
  
  if (requireEdit) {
    return modulePerms.read && modulePerms.edit;
  }
  return modulePerms.read;
}
