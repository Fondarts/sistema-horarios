import React, { useState, useEffect } from 'react';
import { Calendar, Download, CheckCircle, AlertCircle, RefreshCw, Plus } from 'lucide-react';
import { format, addYears, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface Holiday {
  id: string;
  date: string;
  name: string;
  type: 'national' | 'regional' | 'local';
  description?: string;
  isRecurring: boolean;
  addedToCalendar?: boolean;
}

export function HolidayIntegration() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Feriados fijos de España
  const getFixedHolidays = (year: number): Holiday[] => {
    return [
      {
        id: `new-year-${year}`,
        date: `${year}-01-01`,
        name: 'Año Nuevo',
        type: 'national',
        description: 'Día de Año Nuevo',
        isRecurring: true,
        addedToCalendar: false
      },
      {
        id: `epiphany-${year}`,
        date: `${year}-01-06`,
        name: 'Epifanía del Señor',
        type: 'national',
        description: 'Día de Reyes',
        isRecurring: true,
        addedToCalendar: false
      },
      {
        id: `good-friday-${year}`,
        date: `${year}-03-29`, // Fecha aproximada, se calcularía dinámicamente
        name: 'Viernes Santo',
        type: 'national',
        description: 'Viernes Santo',
        isRecurring: true,
        addedToCalendar: false
      },
      {
        id: `labour-day-${year}`,
        date: `${year}-05-01`,
        name: 'Día del Trabajador',
        type: 'national',
        description: 'Día Internacional del Trabajador',
        isRecurring: true,
        addedToCalendar: false
      },
      {
        id: `assumption-${year}`,
        date: `${year}-08-15`,
        name: 'Asunción de la Virgen',
        type: 'national',
        description: 'Asunción de la Virgen María',
        isRecurring: true,
        addedToCalendar: false
      },
      {
        id: `hispanic-day-${year}`,
        date: `${year}-10-12`,
        name: 'Fiesta Nacional de España',
        type: 'national',
        description: 'Día de la Hispanidad',
        isRecurring: true,
        addedToCalendar: false
      },
      {
        id: `all-saints-${year}`,
        date: `${year}-11-01`,
        name: 'Día de Todos los Santos',
        type: 'national',
        description: 'Día de Todos los Santos',
        isRecurring: true,
        addedToCalendar: false
      },
      {
        id: `constitution-day-${year}`,
        date: `${year}-12-06`,
        name: 'Día de la Constitución',
        type: 'national',
        description: 'Día de la Constitución Española',
        isRecurring: true,
        addedToCalendar: false
      },
      {
        id: `immaculate-${year}`,
        date: `${year}-12-08`,
        name: 'Inmaculada Concepción',
        type: 'national',
        description: 'Inmaculada Concepción',
        isRecurring: true,
        addedToCalendar: false
      },
      {
        id: `christmas-${year}`,
        date: `${year}-12-25`,
        name: 'Navidad',
        type: 'national',
        description: 'Día de Navidad',
        isRecurring: true,
        addedToCalendar: false
      }
    ];
  };

  // Función para calcular fechas variables (como Viernes Santo)
  const calculateEaster = (year: number): Date => {
    // Algoritmo de Gauss para calcular Pascua
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const n = Math.floor((h + l - 7 * m + 114) / 31);
    const p = (h + l - 7 * m + 114) % 31;
    
    return new Date(year, n - 1, p + 1);
  };

  const getVariableHolidays = (year: number): Holiday[] => {
    const easter = calculateEaster(year);
    const goodFriday = new Date(easter);
    goodFriday.setDate(easter.getDate() - 2);
    
    return [
      {
        id: `good-friday-${year}`,
        date: format(goodFriday, 'yyyy-MM-dd'),
        name: 'Viernes Santo',
        type: 'national',
        description: 'Viernes Santo',
        isRecurring: true,
        addedToCalendar: false
      }
    ];
  };

  const loadHolidays = async (year: number) => {
    setIsLoading(true);
    
    try {
      // Simular carga de API (en una app real sería una llamada a una API de feriados)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const fixedHolidays = getFixedHolidays(year);
      const variableHolidays = getVariableHolidays(year);
      
      // Filtrar feriados duplicados
      const allHolidays = [...fixedHolidays, ...variableHolidays];
      const uniqueHolidays = allHolidays.filter((holiday, index, self) => 
        index === self.findIndex(h => h.id === holiday.id)
      );
      
      setHolidays(uniqueHolidays);
      setLastSync(new Date().toISOString());
    } catch (error) {
      console.error('Error loading holidays:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHolidays(selectedYear);
  }, [selectedYear]);

  const handleSyncHolidays = () => {
    loadHolidays(selectedYear);
  };

  const handleAddToCalendar = (holidayId: string) => {
    setHolidays(prev => prev.map(holiday => 
      holiday.id === holidayId 
        ? { ...holiday, addedToCalendar: !holiday.addedToCalendar }
        : holiday
    ));
  };

  const getHolidayTypeColor = (type: string) => {
    switch (type) {
      case 'national': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'regional': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'local': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getHolidayTypeText = (type: string) => {
    switch (type) {
      case 'national': return 'Nacional';
      case 'regional': return 'Regional';
      case 'local': return 'Local';
      default: return 'Desconocido';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Feriados de España</h2>
          <p className="text-gray-600 dark:text-gray-400">Gestión automática de días festivos nacionales</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="input-field"
          >
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() + i;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>
          <button
            onClick={handleSyncHolidays}
            disabled={isLoading}
            className="btn-primary flex items-center"
          >
            {isLoading ? (
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Download className="w-5 h-5 mr-2" />
            )}
            {isLoading ? 'Sincronizando...' : 'Sincronizar'}
          </button>
        </div>
      </div>

      {/* Status */}
      {lastSync && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-sm text-green-700 dark:text-green-300">
              Última sincronización: {format(parseISO(lastSync), 'dd/MM/yyyy HH:mm', { locale: es })}
            </span>
          </div>
        </div>
      )}

      {/* Holidays List */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Feriados Nacionales {selectedYear}
        </h3>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mr-2" />
            <span className="text-gray-600 dark:text-gray-400">Cargando feriados...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {holidays.map((holiday) => (
              <div
                key={holiday.id}
                className={`bg-white dark:bg-gray-700 border rounded-lg p-4 hover:shadow-md transition-shadow ${
                  holiday.addedToCalendar 
                    ? 'border-orange-300 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/20' 
                    : 'border-gray-200 dark:border-gray-600'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {format(parseISO(holiday.date), 'dd/MM', { locale: es })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getHolidayTypeColor(holiday.type)}`}>
                      {getHolidayTypeText(holiday.type)}
                    </span>
                    <button
                      onClick={() => handleAddToCalendar(holiday.id)}
                      className={`p-1 rounded-full transition-colors ${
                        holiday.addedToCalendar
                          ? 'bg-orange-500 text-white hover:bg-orange-600'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                      }`}
                      title={holiday.addedToCalendar ? 'Quitar del calendario' : 'Agregar al calendario'}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {holiday.name}
                </h4>
                
                {holiday.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {holiday.description}
                  </p>
                )}
                
                <div className="mt-3 flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {holiday.isRecurring ? 'Recurrente' : 'Único'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
              Información sobre Feriados
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Los feriados nacionales se sincronizan automáticamente cada año. 
              Estos días se consideran automáticamente como no laborables en la planificación de horarios.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
