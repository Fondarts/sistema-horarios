import React, { useState, useEffect } from 'react';
import { History, Filter, Calendar, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { isIT } from '../utils/rolePermissions';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore';
import { useEmployees } from '../contexts/EmployeeContext';
import { usePermissions } from '../hooks/usePermissions';

export type HistoryActionType = 
  | 'shift_created' 
  | 'shift_updated' 
  | 'shift_deleted'
  | 'employee_created'
  | 'employee_updated'
  | 'employee_deleted'
  | 'store_schedule_updated'
  | 'absence_created'
  | 'absence_approved'
  | 'absence_rejected'
  | 'absence_deleted'
  | 'store_created'
  | 'store_updated'
  | 'store_deleted'
  | 'company_settings_updated'
  | 'permissions_updated';

export interface HistoryEntry {
  id: string;
  action: HistoryActionType;
  entityType: string; // 'shift', 'employee', 'store', 'absence', etc.
  entityId: string;
  entityName?: string; // Nombre del empleado, tienda, etc.
  userId: string;
  userName?: string;
  changes?: Record<string, { old: any; new: any }>; // Cambios realizados
  timestamp: Timestamp;
  details?: string; // Descripción adicional
}

const ACTION_LABELS: Record<HistoryActionType, string> = {
  shift_created: 'Turno Creado',
  shift_updated: 'Turno Modificado',
  shift_deleted: 'Turno Eliminado',
  employee_created: 'Empleado Creado',
  employee_updated: 'Empleado Modificado',
  employee_deleted: 'Empleado Eliminado',
  store_schedule_updated: 'Horario de Tienda Modificado',
  absence_created: 'Ausencia Creada',
  absence_approved: 'Ausencia Aprobada',
  absence_rejected: 'Ausencia Rechazada',
  absence_deleted: 'Ausencia Eliminada',
  store_created: 'Tienda Creada',
  store_updated: 'Tienda Modificada',
  store_deleted: 'Tienda Eliminada',
  company_settings_updated: 'Configuración de Empresa Actualizada',
  permissions_updated: 'Permisos Actualizados'
};

export function HistoryManagement() {
  const { currentEmployee } = useAuth();
  const { employees } = useEmployees();
  const { t } = useLanguage();
  const permissions = usePermissions();
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');

  const canView = permissions.history?.read || false;

  useEffect(() => {
    if (!canView) {
      setIsLoading(false);
      return;
    }

    const loadHistory = async () => {
      try {
        const historyRef = collection(db, 'history');
        
        // Construir la query con todas las condiciones
        let q: any;
        
        try {
          if (filterType !== 'all' && filterUser !== 'all') {
            // Ambos filtros - puede requerir índice compuesto
            q = query(
              historyRef, 
              where('entityType', '==', filterType),
              where('userId', '==', filterUser),
              orderBy('timestamp', 'desc'), 
              limit(500)
            );
          } else if (filterType !== 'all') {
            // Solo filtro de tipo
            q = query(
              historyRef, 
              where('entityType', '==', filterType),
              orderBy('timestamp', 'desc'), 
              limit(500)
            );
          } else if (filterUser !== 'all') {
            // Solo filtro de usuario
            q = query(
              historyRef, 
              where('userId', '==', filterUser),
              orderBy('timestamp', 'desc'), 
              limit(500)
            );
          } else {
            // Sin filtros
            q = query(historyRef, orderBy('timestamp', 'desc'), limit(500));
          }

          const snapshot = await getDocs(q);
          const entries: HistoryEntry[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data() as any;
            entries.push({
              id: doc.id,
              ...data,
              timestamp: (data.timestamp as Timestamp) || Timestamp.now()
            } as HistoryEntry);
          });

          // Aplicar filtros adicionales en memoria si la query falló por índices
          let filteredEntries = entries;
          if (filterType !== 'all') {
            filteredEntries = filteredEntries.filter(e => e.entityType === filterType);
          }
          if (filterUser !== 'all') {
            filteredEntries = filteredEntries.filter(e => e.userId === filterUser);
          }

          // Ordenar por timestamp (descendente)
          filteredEntries.sort((a, b) => {
            const aTime = a.timestamp?.toMillis?.() || 0;
            const bTime = b.timestamp?.toMillis?.() || 0;
            return bTime - aTime;
          });

          // Limitar a 500
          filteredEntries = filteredEntries.slice(0, 500);

          // Enriquecer con nombres de usuarios
          const enrichedEntries = filteredEntries.map(entry => {
            const user = employees.find(emp => emp.id === entry.userId);
            return {
              ...entry,
              userName: user?.name || entry.userName || 'Usuario desconocido'
            };
          });

          setHistoryEntries(enrichedEntries);
        } catch (queryError: any) {
          // Si falla por índice compuesto, cargar todo y filtrar en memoria
          if (queryError?.code === 'failed-precondition' || queryError?.message?.includes('index')) {
            console.warn('Índice compuesto requerido, cargando y filtrando en memoria...');
            const allQuery = query(historyRef, orderBy('timestamp', 'desc'), limit(1000));
            const snapshot = await getDocs(allQuery);
            const entries: HistoryEntry[] = [];
            
            snapshot.forEach((doc) => {
              const data = doc.data() as any;
              entries.push({
                id: doc.id,
                ...data,
                timestamp: (data.timestamp as Timestamp) || Timestamp.now()
              } as HistoryEntry);
            });

            // Aplicar filtros en memoria
            let filteredEntries = entries;
            if (filterType !== 'all') {
              filteredEntries = filteredEntries.filter(e => e.entityType === filterType);
            }
            if (filterUser !== 'all') {
              filteredEntries = filteredEntries.filter(e => e.userId === filterUser);
            }

            // Limitar a 500
            filteredEntries = filteredEntries.slice(0, 500);

            // Enriquecer con nombres de usuarios
            const enrichedEntries = filteredEntries.map(entry => {
              const user = employees.find(emp => emp.id === entry.userId);
              return {
                ...entry,
                userName: user?.name || entry.userName || 'Usuario desconocido'
              };
            });

            setHistoryEntries(enrichedEntries);
          } else {
            throw queryError;
          }
        }
      } catch (error) {
        console.error('Error loading history:', error);
        setHistoryEntries([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [canView, filterType, filterUser, employees, permissions]);

  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const getEntityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'shift': 'Turno',
      'employee': 'Empleado',
      'store': 'Tienda',
      'absence': 'Ausencia',
      'company_settings': 'Configuración Empresa',
      'permissions': 'Permisos'
    };
    return labels[type] || type;
  };

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Solo el personal de IT puede ver el historial
          </p>
        </div>
      </div>
    );
  }

  const uniqueEntityTypes = Array.from(new Set(historyEntries.map(e => e.entityType)));
  const uniqueUsers = Array.from(new Set(historyEntries.map(e => e.userId)));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <History className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Historial de Cambios
              </h2>
            </div>
          </div>

          {/* Filtros */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tipo:
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos</option>
                  {uniqueEntityTypes.map(type => (
                    <option key={type} value={type}>
                      {getEntityTypeLabel(type)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Usuario:
                </label>
                <select
                  value={filterUser}
                  onChange={(e) => setFilterUser(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos</option>
                  {uniqueUsers.map(userId => {
                    const user = employees.find(emp => emp.id === userId);
                    return (
                      <option key={userId} value={userId}>
                        {user?.name || 'Usuario desconocido'}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="text-gray-500 dark:text-gray-400">Cargando historial...</div>
              </div>
            ) : historyEntries.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  No hay registros en el historial
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Fecha y Hora
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Acción
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Entidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Detalles
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {historyEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{formatDate(entry.timestamp)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {ACTION_LABELS[entry.action] || entry.action}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {getEntityTypeLabel(entry.entityType)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {entry.entityName || entry.entityId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span>{entry.userName || 'Usuario desconocido'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {entry.details || (
                            entry.changes ? (
                              <details className="cursor-pointer">
                                <summary className="text-blue-600 dark:text-blue-400 hover:underline">
                                  Ver cambios
                                </summary>
                                <div className="mt-2 pl-4 border-l-2 border-gray-300 dark:border-gray-600">
                                  {Object.entries(entry.changes).map(([key, change]) => (
                                    <div key={key} className="mb-1">
                                      <strong>{key}:</strong> {JSON.stringify(change.old)} → {JSON.stringify(change.new)}
                                    </div>
                                  ))}
                                </div>
                              </details>
                            ) : '-'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
