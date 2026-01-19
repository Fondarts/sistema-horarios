import React, { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Save, X } from 'lucide-react';
import { useCompanySettings } from '../contexts/CompanySettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { EmployeeRole, getRoleLabel } from '../utils/rolePermissions';
import { db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { isIT } from '../utils/rolePermissions';
import { HistoryService } from '../services/historyService';

export type ModuleType = 
  | 'schedule'           // Horarios
  | 'employees'          // Empleados
  | 'absences'           // Vacaciones y ausencias
  | 'holidays'           // Feriados
  | 'storeSchedule'     // Horarios tienda
  | 'statistics'         // Estadísticas
  | 'export'            // Exportar
  | 'history';          // Historial

export type PermissionType = 'read' | 'edit';

export interface ModulePermissions {
  read: boolean;
  edit: boolean;
}

export interface RolePermissions {
  role: EmployeeRole | string; // Puede ser un rol existente o un nuevo puesto
  permissions: {
    schedule: ModulePermissions;
    employees: ModulePermissions;
    absences: ModulePermissions;
    holidays: ModulePermissions;
    storeSchedule: ModulePermissions;
    statistics: ModulePermissions;
    export: ModulePermissions;
    history: ModulePermissions;
  };
}

export interface PermissionsConfig {
  roles: RolePermissions[];
  updatedAt: string;
  updatedBy: string;
}

const DEFAULT_ROLES: EmployeeRole[] = ['region', 'distrito', 'encargado', 'empleado', 'it'];

const MODULE_LABELS: Record<ModuleType, string> = {
  schedule: 'Horarios',
  employees: 'Empleados',
  absences: 'Vacaciones y Ausencias',
  holidays: 'Feriados',
  storeSchedule: 'Horarios Tienda',
  statistics: 'Estadísticas',
  export: 'Exportar',
  history: 'Historial'
};

const PERMISSION_LABELS: Record<PermissionType, string> = {
  read: 'Lectura',
  edit: 'Edición'
};

export function PermissionsManagement() {
  const { currentEmployee } = useAuth();
  const { t } = useLanguage();
  const [permissionsConfig, setPermissionsConfig] = useState<PermissionsConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [editingRole, setEditingRole] = useState<string | null>(null);

  const canEdit = currentEmployee && isIT(currentEmployee.role);

  useEffect(() => {
    const permissionsRef = doc(db, 'permissions', 'main');
    
    const unsubscribe = onSnapshot(
      permissionsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setPermissionsConfig(snapshot.data() as PermissionsConfig);
        } else {
          // Crear configuración por defecto
          const defaultConfig: PermissionsConfig = {
            roles: DEFAULT_ROLES.map(role => ({
              role,
              permissions: {
                schedule: {
                  read: true,
                  edit: role !== 'empleado'
                },
                employees: {
                  read: true,
                  edit: role !== 'empleado'
                },
                absences: {
                  read: true,
                  edit: role !== 'empleado'
                },
                holidays: {
                  read: true,
                  edit: role === 'region' || role === 'distrito' || role === 'encargado' || role === 'it'
                },
                storeSchedule: {
                  read: true,
                  edit: role === 'region' || role === 'distrito' || role === 'encargado' || role === 'it'
                },
                statistics: {
                  read: true,
                  edit: role === 'region' || role === 'distrito' || role === 'encargado' || role === 'it'
                },
                export: {
                  read: role === 'region' || role === 'distrito' || role === 'encargado' || role === 'it',
                  edit: role === 'region' || role === 'distrito' || role === 'encargado' || role === 'it'
                },
                history: {
                  read: role === 'it',
                  edit: role === 'it'
                }
              }
            })),
            updatedAt: new Date().toISOString(),
            updatedBy: currentEmployee?.id || ''
          };
          setPermissionsConfig(defaultConfig);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('Error loading permissions:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentEmployee]);

  const handlePermissionChange = (role: string, module: ModuleType, permission: PermissionType, value: boolean) => {
    if (!permissionsConfig || !canEdit) return;

    const updatedRoles = permissionsConfig.roles.map(r => {
      if (r.role === role) {
        return {
          ...r,
          permissions: {
            ...r.permissions,
            [module]: {
              ...r.permissions[module],
              [permission]: value
            }
          }
        };
      }
      return r;
    });

    setPermissionsConfig({
      ...permissionsConfig,
      roles: updatedRoles,
      updatedAt: new Date().toISOString(),
      updatedBy: currentEmployee!.id
    });
  };

  const handleSave = async () => {
    if (!permissionsConfig || !canEdit) return;

    try {
      const permissionsRef = doc(db, 'permissions', 'main');
      await setDoc(permissionsRef, {
        ...permissionsConfig,
        updatedAt: new Date().toISOString(),
        updatedBy: currentEmployee!.id
      });
      
      // Registrar en historial
      await HistoryService.logPermissionsUpdated(currentEmployee!.id);
      
      alert('Permisos guardados exitosamente');
    } catch (error) {
      console.error('Error saving permissions:', error);
      alert('Error al guardar los permisos');
    }
  };

  const handleAddRole = () => {
    if (!newRoleName.trim() || !permissionsConfig || !canEdit) return;

    // Verificar que el rol no exista
    if (permissionsConfig.roles.some(r => r.role.toLowerCase() === newRoleName.trim().toLowerCase())) {
      alert('Este puesto ya existe');
      return;
    }

    const newRole: RolePermissions = {
      role: newRoleName.trim(),
      permissions: {
        schedule: { read: false, edit: false },
        employees: { read: false, edit: false },
        absences: { read: false, edit: false },
        holidays: { read: false, edit: false },
        storeSchedule: { read: false, edit: false },
        statistics: { read: false, edit: false },
        export: { read: false, edit: false },
        history: { read: false, edit: false }
      }
    };

    setPermissionsConfig({
      ...permissionsConfig,
      roles: [...permissionsConfig.roles, newRole],
      updatedAt: new Date().toISOString(),
      updatedBy: currentEmployee!.id
    });

    setNewRoleName('');
    setShowAddRoleModal(false);
  };

  const handleDeleteRole = (role: string) => {
    if (!permissionsConfig || !canEdit) return;
    
    // No permitir eliminar roles del sistema
    if (DEFAULT_ROLES.includes(role as EmployeeRole)) {
      alert('No se pueden eliminar los puestos del sistema');
      return;
    }

    if (!confirm(`¿Estás seguro de que quieres eliminar el puesto "${role}"?`)) {
      return;
    }

    setPermissionsConfig({
      ...permissionsConfig,
      roles: permissionsConfig.roles.filter(r => r.role !== role),
      updatedAt: new Date().toISOString(),
      updatedBy: currentEmployee!.id
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Cargando permisos...</div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Solo el personal de IT puede gestionar los permisos
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-[95vw] mx-auto p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Gestión de Permisos
              </h2>
            </div>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Botón para agregar nuevo puesto */}
            <div className="mb-4">
              <button
                onClick={() => setShowAddRoleModal(true)}
                className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Nuevo Puesto</span>
              </button>
            </div>

            {/* Tabla de permisos */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-xs">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-gray-700 z-10 min-w-[140px]">
                      Puesto/Cargo
                    </th>
                    {Object.entries(MODULE_LABELS).map(([moduleKey, moduleLabel]) => (
                      <th key={moduleKey} colSpan={2} className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-l border-gray-200 dark:border-gray-600 min-w-[120px]">
                        {moduleLabel}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    <th className="px-4 py-1.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 sticky left-0 bg-gray-50 dark:bg-gray-700 z-10"></th>
                    {Object.entries(MODULE_LABELS).map(([moduleKey]) => (
                      <React.Fragment key={moduleKey}>
                        <th className="px-2 py-1.5 text-center text-xs font-medium text-gray-500 dark:text-gray-300 border-l border-gray-200 dark:border-gray-600">
                          {PERMISSION_LABELS.read}
                        </th>
                        <th className="px-2 py-1.5 text-center text-xs font-medium text-gray-500 dark:text-gray-300">
                          {PERMISSION_LABELS.edit}
                        </th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {permissionsConfig?.roles.map((rolePerm) => {
                    const isSystemRole = DEFAULT_ROLES.includes(rolePerm.role as EmployeeRole);
                    const roleLabel = isSystemRole 
                      ? getRoleLabel(rolePerm.role as EmployeeRole)
                      : rolePerm.role;
                    
                    return (
                      <tr key={rolePerm.role}>
                        <td className="px-4 py-2 whitespace-nowrap sticky left-0 bg-white dark:bg-gray-800 z-10">
                          <div className="text-xs font-medium text-gray-900 dark:text-gray-100">
                            {roleLabel}
                          </div>
                        </td>
                        {Object.keys(MODULE_LABELS).map((moduleKey) => {
                          const module = moduleKey as ModuleType;
                          return (
                            <React.Fragment key={moduleKey}>
                              <td className="px-2 py-2 whitespace-nowrap text-center border-l border-gray-200 dark:border-gray-600">
                                <input
                                  type="checkbox"
                                  checked={rolePerm.permissions[module]?.read || false}
                                  onChange={(e) => handlePermissionChange(rolePerm.role, module, 'read', e.target.checked)}
                                  className="w-3.5 h-3.5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-1 dark:bg-gray-700 dark:border-gray-600"
                                />
                              </td>
                              <td className="px-2 py-2 whitespace-nowrap text-center">
                                <input
                                  type="checkbox"
                                  checked={rolePerm.permissions[module]?.edit || false}
                                  onChange={(e) => handlePermissionChange(rolePerm.role, module, 'edit', e.target.checked)}
                                  className="w-3.5 h-3.5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-1 dark:bg-gray-700 dark:border-gray-600"
                                />
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Explicación de permisos */}
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Explicación de Permisos
              </h3>
              <div className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
                <div>
                  <strong className="text-gray-900 dark:text-gray-100">Lectura:</strong> Permite ver y consultar información del módulo. Si está marcada, aparece el botón y puedes acceder a esa sección.
                </div>
                <div>
                  <strong className="text-gray-900 dark:text-gray-100">Edición:</strong> Permite crear, modificar y eliminar información del módulo. Requiere que también esté marcada la casilla de lectura.
                </div>
                <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                  <strong className="text-gray-900 dark:text-gray-100">Módulos:</strong>
                  <ul className="mt-2 ml-4 list-disc space-y-1">
                    <li><strong>Horarios:</strong> Gestión de turnos y horarios de empleados</li>
                    <li><strong>Empleados:</strong> Gestión de información de empleados</li>
                    <li><strong>Vacaciones y Ausencias:</strong> Gestión de solicitudes de vacaciones y ausencias</li>
                    <li><strong>Feriados:</strong> Gestión de días feriados</li>
                    <li><strong>Horarios Tienda:</strong> Configuración de horarios de apertura/cierre de la tienda</li>
                    <li><strong>Estadísticas:</strong> Visualización de estadísticas y reportes</li>
                    <li><strong>Exportar:</strong> Exportación de datos a diferentes formatos</li>
                    <li><strong>Historial:</strong> Visualización del historial de cambios</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para agregar nuevo puesto */}
      {showAddRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Agregar Nuevo Puesto
              </h3>
              <button
                onClick={() => {
                  setShowAddRoleModal(false);
                  setNewRoleName('');
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre del Puesto
              </label>
              <input
                type="text"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="Ej: Supervisor, Asistente, etc."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddRole();
                  }
                }}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddRoleModal(false);
                  setNewRoleName('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddRole}
                disabled={!newRoleName.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
