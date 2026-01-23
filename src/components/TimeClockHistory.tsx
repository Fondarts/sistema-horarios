import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../contexts/StoreContext';
import { useEmployees } from '../contexts/EmployeeContext';
import { useSchedule } from '../contexts/ScheduleContext';
import { usePermissions } from '../hooks/usePermissions';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, limit, QuerySnapshot, QueryDocumentSnapshot, FirestoreError } from 'firebase/firestore';
import { TimeClockEntry, Shift } from '../types';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { Clock, MapPin, User, Calendar, Filter, Download, Search, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { isIT } from '../utils/rolePermissions';

export function TimeClockHistory() {
  const { currentEmployee } = useAuth();
  const { stores, currentStore } = useStore();
  const { getAllEmployees } = useEmployees();
  const { getAllShifts } = useSchedule();
  const permissions = usePermissions();
  const { t, language } = useLanguage();
  const dateLocale = language === 'es' ? es : enUS;

  const [timeClockEntries, setTimeClockEntries] = useState<TimeClockEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<TimeClockEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [filterEmployee, setFilterEmployee] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'entry' | 'exit'>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const employees = getAllEmployees();
  const allShifts = getAllShifts();
  const isITUser = currentEmployee ? isIT(currentEmployee.role) : false;
  const canView = permissions.timeClockHistory?.read || false;

  // Si es IT, puede ver todas las tiendas; si no, solo la tienda actual
  const availableStores = isITUser ? stores : (currentStore ? [currentStore] : []);

  // Función para obtener el turno de un empleado para una fecha específica
  const getShiftForDate = (employeeId: string, date: string): Shift | undefined => {
    return allShifts.find(shift => 
      shift.employeeId === employeeId && 
      shift.date === date && 
      shift.isPublished
    );
  };

  // Función para comparar hora de fichada con hora del turno
  const compareTimeWithShift = (entry: TimeClockEntry): { status: 'onTime' | 'early' | 'late'; minutesDiff: number; shiftTime?: string } => {
    if (entry.type !== 'entry') {
      return { status: 'onTime', minutesDiff: 0 };
    }

    const shift = getShiftForDate(entry.employeeId, entry.date);
    if (!shift) {
      return { status: 'onTime', minutesDiff: 0 };
    }

    // Convertir horas a minutos para comparar
    const [shiftHour, shiftMinute] = shift.startTime.split(':').map(Number);
    const [entryHour, entryMinute] = entry.time.split(':').map(Number);
    
    const shiftMinutes = shiftHour * 60 + shiftMinute;
    const entryMinutes = entryHour * 60 + entryMinute;
    
    const minutesDiff = entryMinutes - shiftMinutes;
    
    // Considerar "a tiempo" si está dentro de 5 minutos antes o después
    if (minutesDiff >= -5 && minutesDiff <= 5) {
      return { status: 'onTime', minutesDiff, shiftTime: shift.startTime };
    } else if (minutesDiff < -5) {
      return { status: 'early', minutesDiff: Math.abs(minutesDiff), shiftTime: shift.startTime };
    } else {
      return { status: 'late', minutesDiff, shiftTime: shift.startTime };
    }
  };

  useEffect(() => {
    if (!canView) {
      setIsLoading(false);
      return;
    }

    // Si no es IT y hay una tienda actual, usarla por defecto
    if (!isITUser && currentStore && !selectedStoreId) {
      setSelectedStoreId(currentStore.id);
    } else if (isITUser && availableStores.length > 0 && !selectedStoreId) {
      // Si es IT y hay tiendas, seleccionar la primera por defecto
      setSelectedStoreId(availableStores[0].id);
    }
  }, [canView, isITUser, currentStore, availableStores]);

  // Cargar fichadas desde Firestore
  useEffect(() => {
    if (!canView) {
      setIsLoading(false);
      return;
    }

    // Si es IT y no hay tienda seleccionada aún, esperar
    if (isITUser && !selectedStoreId && availableStores.length > 0) {
      return;
    }

    const entriesRef = collection(db, 'timeClockEntries');
    
    // Construir query - si hay tienda seleccionada, filtrar por tienda
    let q: any;
    
    try {
      if (selectedStoreId) {
        q = query(
          entriesRef,
          where('storeId', '==', selectedStoreId),
          orderBy('timestamp', 'desc'),
          limit(1000)
        );
      } else if (isITUser) {
        // Si es IT y no hay tienda seleccionada, cargar todas
        // Nota: Esto puede requerir un índice compuesto en Firestore
        q = query(
          entriesRef,
          orderBy('timestamp', 'desc'),
          limit(1000)
        );
      } else {
        // Si no es IT y no hay tienda, no cargar nada
        setTimeClockEntries([]);
        setIsLoading(false);
        return;
      }

      const unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot) => {
          const entries: TimeClockEntry[] = [];
          snapshot.forEach((doc: QueryDocumentSnapshot) => {
            const data = doc.data();
            entries.push({
              id: doc.id,
              ...data,
              timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp,
              createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            } as TimeClockEntry);
          });

          // Ordenar por timestamp descendente (por si acaso)
          entries.sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            return timeB - timeA;
          });

          setTimeClockEntries(entries);
          setIsLoading(false);
        },
        (error: FirestoreError) => {
          console.error('Error loading time clock entries:', error);
          // Si hay error de índice, intentar cargar sin orderBy
          if (error.code === 'failed-precondition') {
            console.warn('Firestore index may be required. Loading without orderBy...');
            const fallbackQuery = selectedStoreId 
              ? query(entriesRef, where('storeId', '==', selectedStoreId), limit(1000))
              : query(entriesRef, limit(1000));
            
            onSnapshot(fallbackQuery, (snapshot: QuerySnapshot) => {
              const entries: TimeClockEntry[] = [];
              snapshot.forEach((doc: QueryDocumentSnapshot) => {
                const data = doc.data();
                entries.push({
                  id: doc.id,
                  ...data,
                  timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp,
                  createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
                } as TimeClockEntry);
              });
              
              entries.sort((a, b) => {
                const timeA = new Date(a.timestamp).getTime();
                const timeB = new Date(b.timestamp).getTime();
                return timeB - timeA;
              });
              
              setTimeClockEntries(entries);
              setIsLoading(false);
            });
          } else {
            setIsLoading(false);
          }
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up query:', error);
      setIsLoading(false);
    }
  }, [canView, selectedStoreId, isITUser, availableStores.length]);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...timeClockEntries];

    // Filtro por empleado
    if (filterEmployee !== 'all') {
      filtered = filtered.filter(entry => entry.employeeId === filterEmployee);
    }

    // Filtro por tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(entry => entry.type === filterType);
    }

    // Filtro por fecha desde
    if (filterDateFrom) {
      const fromDate = new Date(filterDateFrom);
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= fromDate;
      });
    }

    // Filtro por fecha hasta
    if (filterDateTo) {
      const toDate = new Date(filterDateTo);
      toDate.setHours(23, 59, 59, 999); // Incluir todo el día
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate <= toDate;
      });
    }

    // Búsqueda por nombre de empleado
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(entry => {
        const employee = employees.find(emp => emp.id === entry.employeeId);
        return employee?.name.toLowerCase().includes(searchLower);
      });
    }

    setFilteredEntries(filtered);
  }, [timeClockEntries, filterEmployee, filterType, filterDateFrom, filterDateTo, searchTerm, employees]);

  // Exportar a CSV
  const handleExport = () => {
    const headers = ['Fecha', 'Horario de Entrada', 'Horario del Turno', 'Estado', 'Empleado', 'Tienda', 'Tipo', 'Latitud', 'Longitud', 'Precisión (m)'];
    const rows = filteredEntries.map(entry => {
      const employee = employees.find(emp => emp.id === entry.employeeId);
      const store = stores.find(s => s.id === entry.storeId);
      const timeComparison = compareTimeWithShift(entry);
      
      let status = '-';
      if (entry.type === 'entry' && timeComparison.shiftTime) {
        if (timeComparison.status === 'onTime') {
          status = 'A tiempo';
        } else if (timeComparison.status === 'early') {
          status = `${timeComparison.minutesDiff} min antes`;
        } else if (timeComparison.status === 'late') {
          status = `${timeComparison.minutesDiff} min tarde`;
        }
      }
      
      return [
        entry.date,
        entry.time,
        timeComparison.shiftTime || '-',
        status,
        employee?.name || 'N/A',
        store?.name || 'N/A',
        entry.type === 'entry' ? 'Entrada' : 'Salida',
        entry.latitude.toString(),
        entry.longitude.toString(),
        entry.accuracy?.toString() || 'N/A'
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `fichadas_${selectedStoreId || 'todas'}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!canView) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-600 dark:text-gray-400">
          No tienes permisos para ver el historial de fichadas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Clock className="w-6 h-6 text-primary-600 dark:text-primary-400 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Historial de Fichadas
            </h2>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </button>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Selector de tienda (solo para IT) */}
          {isITUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tienda
              </label>
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Todas las tiendas</option>
                {availableStores.map(store => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Búsqueda por nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Buscar empleado
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nombre del empleado..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Filtro por empleado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Empleado
            </label>
            <select
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">Todos</option>
              {employees
                .filter(emp => {
                  if (selectedStoreId) {
                    return emp.storeId === selectedStoreId;
                  }
                  return true;
                })
                .map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Filtro por tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'entry' | 'exit')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">Todos</option>
              <option value="entry">Entrada</option>
              <option value="exit">Salida</option>
            </select>
          </div>

          {/* Filtro fecha desde */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha desde
            </label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Filtro fecha hasta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha hasta
            </label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Resumen */}
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Mostrando {filteredEntries.length} de {timeClockEntries.length} fichadas
        </div>
      </div>

      {/* Tabla de fichadas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">Cargando fichadas...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No se encontraron fichadas con los filtros seleccionados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Horario de Entrada
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Horario del Turno
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Empleado
                  </th>
                  {isITUser && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tienda
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ubicación GPS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Precisión
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredEntries.map((entry) => {
                  const employee = employees.find(emp => emp.id === entry.employeeId);
                  const store = stores.find(s => s.id === entry.storeId);
                  const entryDate = parseISO(entry.timestamp);
                  const timeComparison = compareTimeWithShift(entry);

                  return (
                    <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {format(entryDate, 'dd/MM/yyyy', { locale: dateLocale })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {entry.time}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {entry.type === 'entry' && timeComparison.shiftTime ? (
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {timeComparison.shiftTime}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">
                            -
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {entry.type === 'entry' && timeComparison.shiftTime ? (
                          <div className="flex items-center">
                            {timeComparison.status === 'onTime' && (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                  A tiempo
                                </span>
                              </>
                            )}
                            {timeComparison.status === 'early' && (
                              <>
                                <AlertCircle className="w-4 h-4 text-blue-500 mr-1" />
                                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                  {timeComparison.minutesDiff} min antes
                                </span>
                              </>
                            )}
                            {timeComparison.status === 'late' && (
                              <>
                                <XCircle className="w-4 h-4 text-red-500 mr-1" />
                                <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                                  {timeComparison.minutesDiff} min tarde
                                </span>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">
                            -
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {employee?.name || 'N/A'}
                          </span>
                        </div>
                      </td>
                      {isITUser && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {store?.name || 'N/A'}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          entry.type === 'entry'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {entry.type === 'entry' ? 'Entrada' : 'Salida'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900 dark:text-gray-100">
                          <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="font-mono text-xs">
                            {entry.latitude.toFixed(6)}, {entry.longitude.toFixed(6)}
                          </span>
                        </div>
                        <a
                          href={`https://www.google.com/maps?q=${entry.latitude},${entry.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Ver en Google Maps
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {entry.accuracy ? `${Math.round(entry.accuracy)}m` : 'N/A'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
