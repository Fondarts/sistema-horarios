import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSchedule } from '../contexts/ScheduleContext';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useDateFormat } from '../contexts/DateFormatContext';
import { useCompactMode } from '../contexts/CompactModeContext';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, Loader, LogOut, UserX } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { TimeClockEntry } from '../types';
import { AbsenceManagement } from './AbsenceManagement';
import { NotificationBell } from './NotificationBell';

// Función para calcular distancia entre dos puntos GPS (fórmula de Haversine)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distancia en metros
}

export default function TimeClockApp() {
  const { currentEmployee, logout } = useAuth();
  const { shifts } = useSchedule();
  const { stores } = useStore();
  const { t, language } = useLanguage();
  const { formatDate } = useDateFormat();
  const { isMobile } = useCompactMode();
  const dateLocale = language === 'es' ? es : enUS;

  // Obtener el nombre de la tienda del empleado
  const employeeStore = currentEmployee?.storeId 
    ? stores.find(store => store.id === currentEmployee.storeId)
    : null;

  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [timeClockEntries, setTimeClockEntries] = useState<TimeClockEntry[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [lastClockAction, setLastClockAction] = useState<'entry' | 'exit' | null>(null);
  const [storeLocation, setStoreLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [maxDistance, setMaxDistance] = useState(100); // Radio permitido en metros (100m por defecto)
  const [activeTab, setActiveTab] = useState<'schedule' | 'vacations'>('schedule');

  // Cargar fichadas del empleado
  useEffect(() => {
    if (!currentEmployee) return;

    const entriesRef = collection(db, 'timeClockEntries');
    // Removemos orderBy para evitar problemas con índices - ordenaremos en JavaScript
    const entriesQuery = query(
      entriesRef,
      where('employeeId', '==', currentEmployee.id)
    );

    const unsubscribe = onSnapshot(entriesQuery, (snapshot) => {
      const entries: TimeClockEntry[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        entries.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
        } as TimeClockEntry);
      });
      
      // Ordenar por timestamp descendente en JavaScript
      entries.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeB - timeA; // Descendente (más reciente primero)
      });
      
      setTimeClockEntries(entries);

      // Determinar la última acción (entrada o salida)
      if (entries.length > 0) {
        const lastEntry = entries[0];
        setLastClockAction(lastEntry.type);
      } else {
        setLastClockAction(null);
      }
    }, (error) => {
      console.error('Error loading time clock entries:', error);
      // Manejar errores de Firestore de manera más robusta
      if (error.code === 'failed-precondition') {
        console.warn('Firestore index may be required. Error:', error.message);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentEmployee]);

  // Obtener ubicación de la tienda (si está disponible)
  useEffect(() => {
    if (currentEmployee?.storeId && employeeStore) {
      // Usar las coordenadas guardadas de la tienda
      if (employeeStore.latitude && employeeStore.longitude) {
        setStoreLocation({ lat: employeeStore.latitude, lon: employeeStore.longitude });
        setMaxDistance(100); // 100 metros de radio
      } else {
        // Si no hay coordenadas guardadas, no validar distancia
        setStoreLocation(null);
      }
    } else {
      setStoreLocation(null);
    }
  }, [currentEmployee?.storeId, employeeStore]);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentWeek(subWeeks(currentWeek, 1));
    } else {
      setCurrentWeek(addWeeks(currentWeek, 1));
    }
  };

  // Obtener turnos del empleado para la semana actual
  const employeeShifts = shifts.filter(shift => 
    shift.employeeId === currentEmployee?.id &&
    shift.date >= format(weekStart, 'yyyy-MM-dd') &&
    shift.date <= format(weekEnd, 'yyyy-MM-dd') &&
    shift.isPublished
  );

  // Obtener fichadas de la semana actual
  const weekEntries = timeClockEntries.filter(entry => {
    const entryDate = new Date(entry.timestamp);
    return entryDate >= weekStart && entryDate <= weekEnd;
  });

  // Función para obtener la ubicación GPS
  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no está disponible en este dispositivo'));
        return;
      }

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        options
      );
    });
  };

  // Función para fichar entrada o salida
  const handleClockInOut = async () => {
    if (!currentEmployee) return;

    setIsLoadingLocation(true);
    setLocationError(null);

    try {
      // Obtener ubicación GPS
      const position = await getCurrentLocation();
      const { latitude, longitude, accuracy } = position.coords;

      // Validar distancia si hay ubicación de tienda configurada
      if (storeLocation) {
        const distance = calculateDistance(latitude, longitude, storeLocation.lat, storeLocation.lon);
        if (distance > maxDistance) {
          setLocationError(t('tooFarFromStore')?.replace('{distance}', Math.round(distance).toString())?.replace('{maxDistance}', maxDistance.toString()) || `Estás demasiado lejos de la tienda (${Math.round(distance)}m). Distancia máxima permitida: ${maxDistance}m`);
          setIsLoadingLocation(false);
          return;
        }
      }

      // Determinar tipo de fichada (si la última fue entrada, esta es salida, y viceversa)
      const clockType: 'entry' | 'exit' = lastClockAction === 'entry' ? 'exit' : 'entry';

      // Crear registro de fichada
      const now = new Date();
      const entry: Omit<TimeClockEntry, 'id'> = {
        employeeId: currentEmployee.id,
        storeId: currentEmployee.storeId,
        type: clockType,
        timestamp: now.toISOString(),
        date: format(now, 'yyyy-MM-dd'),
        time: format(now, 'HH:mm'),
        latitude,
        longitude,
        accuracy: accuracy || undefined,
        createdAt: now.toISOString()
      };

      // Guardar en Firestore
      await addDoc(collection(db, 'timeClockEntries'), entry);

      setLastClockAction(clockType);
      setLocationError(null);
    } catch (error: any) {
      console.error('Error al fichar:', error);
      if (error.code === 1) {
        setLocationError(t('locationPermissionDenied') || 'Permiso de ubicación denegado. Por favor, permite el acceso a la ubicación en la configuración del navegador.');
      } else if (error.code === 2) {
        setLocationError(t('locationUnavailable') || 'No se pudo obtener la ubicación. Verifica que el GPS esté activado.');
      } else if (error.code === 3) {
        setLocationError(t('locationTimeout') || 'Tiempo de espera agotado al obtener la ubicación.');
      } else {
        setLocationError(error.message || 'Error al obtener la ubicación');
      }
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const formatHours = (decimalHours: number): string => {
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    
    if (minutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  // Obtener fichadas de un día específico
  const getEntriesForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return weekEntries.filter(entry => entry.date === dateStr);
  };

  // Obtener turnos de un día específico
  const getShiftsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return employeeShifts.filter(shift => shift.date === dateStr);
  };

  if (!currentEmployee) {
    return null;
  }

  const canClockIn = lastClockAction !== 'entry';
  const canClockOut = lastClockAction === 'entry';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-gray-200 shadow dark:bg-gray-800 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-left">
                {currentEmployee.name}
              </h1>
              {employeeStore && (
                <p className="text-xs text-gray-600 dark:text-gray-400 text-left mt-1">
                  {employeeStore.name}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {/* Campanita de notificaciones */}
              <NotificationBell userId={currentEmployee.id} />
              {/* Botón de cerrar sesión */}
              <button
                onClick={logout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                title={t('closeSession') || 'Cerrar Sesión'}
              >
                <LogOut className="w-5 h-5" />
                {!isMobile && <span className="text-sm">{t('closeSession') || 'Cerrar Sesión'}</span>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-200 border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="max-w-md mx-auto px-4">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`py-3 px-1 border-b-2 font-medium text-sm flex-1 ${
                activeTab === 'schedule'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center justify-center">
                <Calendar className="w-4 h-4 mr-2" />
                {t('mySchedules') || 'Mis Horarios'}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('vacations')}
              className={`py-3 px-1 border-b-2 font-medium text-sm flex-1 ${
                activeTab === 'vacations'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center justify-center">
                <UserX className="w-4 h-4 mr-2" />
                {t('vacationsAndAbsences') || 'Vacaciones y Ausencias'}
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Contenido principal */}
      {activeTab === 'schedule' ? (
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Resumen de la semana */}
        <div className="bg-gray-200 rounded-lg shadow p-4 mb-4 dark:bg-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {format(weekStart, 'd MMM', { locale: dateLocale })} - {format(weekEnd, 'd MMM yyyy', { locale: dateLocale })}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateWeek('prev')}
                className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                ←
              </button>
              <button
                onClick={() => setCurrentWeek(new Date())}
                className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 bg-gray-300 dark:bg-gray-700 rounded"
                title={t('currentWeek') || 'Semana actual'}
              >
                Hoy
              </button>
              <button
                onClick={() => navigateWeek('next')}
                className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                →
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-primary-600 mr-2" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Turnos</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{employeeShifts.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-green-600 mr-2" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Horas</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {formatHours(employeeShifts.reduce((total, shift) => total + shift.hours, 0))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de días de la semana */}
        <div className="space-y-2">
          {weekDays.map((day) => {
            const dayShifts = getShiftsForDay(day);
            const dayEntries = getEntriesForDay(day);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={`bg-gray-200 rounded-lg shadow p-4 dark:bg-gray-800 ${
                  isToday ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium mr-3 ${
                      isToday ? 'bg-primary-600' : 'bg-gray-400'
                    }`}>
                      {format(day, 'd')}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                        {format(day, 'EEEE', { locale: dateLocale })}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                        {format(day, 'MMMM', { locale: dateLocale })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Turnos programados */}
                {dayShifts.length > 0 && (
                  <div className="mb-2">
                    {dayShifts.map((shift) => {
                      const shiftStore = shift.storeId 
                        ? stores.find(store => store.id === shift.storeId)
                        : null;
                      
                      return (
                        <div
                          key={shift.id}
                          className="bg-white dark:bg-gray-700 rounded p-1.5 mb-1"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 text-primary-600 mr-1.5" />
                              <span className="text-xs text-gray-900 dark:text-gray-100">
                                {shift.startTime} - {shift.endTime}
                              </span>
                              {shiftStore && (
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 ml-2">
                                  {shiftStore.name}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {formatHours(shift.hours)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Fichadas del día */}
                {dayEntries.length > 0 && (
                  <div className="space-y-1">
                    {dayEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className={`flex items-center justify-between p-2 rounded ${
                          entry.type === 'entry'
                            ? 'bg-green-100 dark:bg-green-900'
                            : 'bg-red-100 dark:bg-red-900'
                        }`}
                      >
                        <div className="flex items-center">
                          {entry.type === 'entry' ? (
                            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600 mr-2" />
                          )}
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {entry.type === 'entry' ? (t('entry') || 'Entrada') : (t('exit') || 'Salida')}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-3 h-3 text-gray-500 mr-1" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {entry.time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {dayShifts.length === 0 && dayEntries.length === 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                    {t('noShiftsOrEntries') || 'Sin turnos ni fichadas'}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
      ) : (
        /* Pestaña de Vacaciones y Ausencias */
        <div className="max-w-md mx-auto px-4 py-6 pb-24">
          <AbsenceManagement isEmployeeDashboard={true} />
        </div>
      )}

      {/* Botón de Fichar - Fijo en la parte inferior (solo en pestaña de horarios) */}
      {activeTab === 'schedule' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 z-20">
          <div className="max-w-md mx-auto">
            {locationError && (
              <div className="mb-3 p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">{locationError}</p>
              </div>
            )}
            
            <button
              onClick={handleClockInOut}
              disabled={isLoadingLocation || (!canClockIn && !canClockOut)}
              className={`w-full py-4 px-6 rounded-lg font-semibold text-white text-lg transition-all ${
                isLoadingLocation
                  ? 'bg-gray-400 cursor-not-allowed'
                  : canClockIn
                    ? 'bg-green-600 hover:bg-green-700 active:bg-green-800'
                    : 'bg-red-600 hover:bg-red-700 active:bg-red-800'
              }`}
            >
              {isLoadingLocation ? (
                <div className="flex items-center justify-center">
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  <span>{t('gettingLocation') || 'Obteniendo ubicación...'}</span>
                </div>
              ) : canClockIn ? (
                <div className="flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span>{t('clockIn') || 'Fichar Entrada'}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <XCircle className="w-5 h-5 mr-2" />
                  <span>{t('clockOut') || 'Fichar Salida'}</span>
                </div>
              )}
            </button>

            {lastClockAction && (
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                {t('lastAction') || 'Última acción'}: {lastClockAction === 'entry' ? (t('entry') || 'Entrada') : (t('exit') || 'Salida')} - {
                  timeClockEntries.length > 0 
                    ? format(new Date(timeClockEntries[0].timestamp), 'HH:mm', { locale: dateLocale })
                    : ''
                }
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
