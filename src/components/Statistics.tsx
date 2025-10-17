import React, { useState } from 'react';
import { useSchedule } from '../contexts/ScheduleContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useEmployees } from '../contexts/EmployeeContext';
import { useCompactMode } from '../contexts/CompactModeContext';
import { BarChart3, TrendingUp, Users, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { Statistics as StatisticsType, Shift, Employee } from '../types';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

// Función para formatear horas decimales a formato "Xh Ym"
const formatHours = (decimalHours: number): string => {
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
};

// Función para convertir tiempo a minutos
const timeToMinutes = (time: string | undefined): number => {
  if (!time || typeof time !== 'string') {
    return 0;
  }
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Función para convertir minutos a tiempo
const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};


export function Statistics() {
  const { shifts, storeSchedule } = useSchedule();
  const { employees } = useEmployees();
  const { isMobile } = useCompactMode();
  const { t } = useLanguage();
  
  const [selectedWeek, setSelectedWeek] = useState(new Date());

  // Calcular estadísticas básicas (semanal)
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 }); // Lunes
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 }); // Domingo

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedWeek(prev => subWeeks(prev, 1));
    } else {
      setSelectedWeek(prev => addWeeks(prev, 1));
    }
  };

  const weeklyShifts = shifts.filter(shift => {
    const shiftDate = new Date(shift.date);
    return shiftDate >= weekStart && 
           shiftDate <= weekEnd &&
           shift.isPublished;
  });

  const employeeStats: StatisticsType[] = employees.map(employee => {
    const employeeShifts = weeklyShifts.filter(s => s.employeeId === employee.id);
    const assignedHours = employeeShifts.reduce((total, shift) => total + shift.hours, 0);
    
    // Calcular días desde último fin de semana completamente libre (sábado Y domingo sin turnos)
    const calculateDaysSinceLastWeekendOff = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalizar a medianoche
      
      // Obtener todos los turnos del empleado (no solo de esta semana)
      const allEmployeeShifts = shifts.filter(s => s.employeeId === employee.id && s.isPublished);
      
      console.log(`=== Calculando para ${employee.name} ===`);
      console.log(`Hoy: ${today.toISOString().split('T')[0]}`);
      console.log(`Total turnos: ${allEmployeeShifts.length}`);
      console.log(`Fechas de turnos:`, Array.from(allEmployeeShifts.map(shift => shift.date)));
      console.log(`Turnos recientes (últimos 10):`, allEmployeeShifts.slice(0, 10).map(shift => `${shift.date} (${new Date(shift.date).toLocaleDateString('es-ES', { weekday: 'long' })})`));
      
      if (allEmployeeShifts.length === 0) {
        console.log(`Sin turnos, retornando 0`);
        return 0; // Si no tiene turnos, no hay días desde último fin de semana
      }
      
      // Crear un Set de fechas con turnos para búsqueda rápida
      const shiftDates = new Set(allEmployeeShifts.map(shift => shift.date));
      
      // Verificar fines de semana recientes específicamente usando date-fns
      console.log(`Verificando fines de semana recientes:`);
      for (let i = 0; i < 4; i++) {
        // Calcular el domingo de la semana i hacia atrás usando date-fns
        const sunday = endOfWeek(subWeeks(today, i), { weekStartsOn: 1 }); // Lunes = 1, Domingo = 0
        const saturday = subDays(sunday, 1);
        
        const saturdayStr = format(saturday, 'yyyy-MM-dd');
        const sundayStr = format(sunday, 'yyyy-MM-dd');
        
        const hasShiftOnSaturday = shiftDates.has(saturdayStr);
        const hasShiftOnSunday = shiftDates.has(sundayStr);
        
        console.log(`  Semana ${i + 1}: ${saturdayStr} (Sáb) - ${sundayStr} (Dom): Sábado=${hasShiftOnSaturday ? 'SÍ' : 'NO'}, Domingo=${hasShiftOnSunday ? 'SÍ' : 'NO'}`);
      }
      
      // Buscar hacia atrás día por día hasta encontrar un fin de semana completamente libre
      for (let daysBack = 0; daysBack < 90; daysBack++) {
        const checkDate = subDays(today, daysBack);
        
        // Si llegamos a un domingo, verificar el fin de semana completo
        if (checkDate.getDay() === 0) { // Domingo
          const sunday = checkDate;
          const saturday = subDays(sunday, 1);
          
          const saturdayStr = format(saturday, 'yyyy-MM-dd');
          const sundayStr = format(sunday, 'yyyy-MM-dd');
          
          // Verificar si tiene turnos en sábado o domingo
          const hasShiftOnSaturday = shiftDates.has(saturdayStr);
          const hasShiftOnSunday = shiftDates.has(sundayStr);
          
          console.log(`Revisando fin de semana ${saturdayStr} - ${sundayStr}: Sábado=${hasShiftOnSaturday ? 'SÍ' : 'NO'}, Domingo=${hasShiftOnSunday ? 'SÍ' : 'NO'}`);
          
          // Si NO tiene turnos ni el sábado ni el domingo, es un fin de semana completamente libre
          if (!hasShiftOnSaturday && !hasShiftOnSunday) {
            console.log(`¡Fin de semana libre encontrado! ${saturdayStr} - ${sundayStr}, días desde entonces: ${daysBack}`);
            return daysBack; // Retornar los días desde ese domingo
          }
        }
      }
      
      // Si no encontramos ningún fin de semana completamente libre en 3 meses,
      // buscar el último fin de semana que trabajó
      for (let daysBack = 0; daysBack < 90; daysBack++) {
        const checkDate = subDays(today, daysBack);
        
        // Si llegamos a un domingo, verificar si trabajó ese fin de semana
        if (checkDate.getDay() === 0) { // Domingo
          const sunday = checkDate;
          const saturday = subDays(sunday, 1);
          
          const saturdayStr = format(saturday, 'yyyy-MM-dd');
          const sundayStr = format(sunday, 'yyyy-MM-dd');
          
          // Verificar si tiene turnos en sábado o domingo
          const hasShiftOnSaturday = shiftDates.has(saturdayStr);
          const hasShiftOnSunday = shiftDates.has(sundayStr);
          
          // Si trabajó al menos uno de los dos días, retornar los días desde ese domingo
          if (hasShiftOnSaturday || hasShiftOnSunday) {
            console.log(`Último fin de semana trabajado: ${saturdayStr} - ${sundayStr}, días desde entonces: ${daysBack}`);
            return daysBack;
          }
        }
      }
      
      return 0; // Si no encuentra nada en 3 meses
    };
    
    const daysSinceLastWeekendOff = calculateDaysSinceLastWeekendOff();
    
    // Calcular día más ocupado
    const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // Domingo a Sábado
    employeeShifts.forEach(shift => {
      const dayOfWeek = new Date(shift.date).getDay();
      dayCounts[dayOfWeek] += shift.hours;
    });
    const busiestDay = dayCounts.indexOf(Math.max(...dayCounts));

    return {
      employeeId: employee.id,
      employeeName: employee.name,
      weeklyAssignedHours: assignedHours,
      weeklyLimit: employee.weeklyLimit,
      daysSinceLastWeekendOff: daysSinceLastWeekendOff,
      busiestDayOfWeek: busiestDay,
      coverageIssues: [] // Placeholder
    };
  });

  const daysOfWeek = [
    t('sunday'), t('monday'), t('tuesday'), t('wednesday'), 
    t('thursday'), t('friday'), t('saturday')
  ];


  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('statistics')}</h2>
        <p className="text-gray-600 dark:text-gray-400">{t('coverageAndWorkloadMetrics')}</p>
      </div>

      {/* Week Navigation */}
      <div className="card">
        {/* Fecha centrada */}
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
            {format(weekStart, 'd MMM', { locale: es })} - {format(weekEnd, 'd MMM yyyy', { locale: es })}
          </h3>
        </div>

        {/* Botones de navegación */}
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => navigateWeek('prev')}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm rounded transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
          >
            ← {t('previous')}
          </button>
          <button
            onClick={() => navigateWeek('next')}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm rounded transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
          >
            {t('next')} →
          </button>
          <button
            onClick={() => setSelectedWeek(new Date())}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm rounded transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
          >
            {t('thisWeek')}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-primary-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('activeEmployees')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{employees.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('shiftsThisWeek')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{weeklyShifts.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('totalHours')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatHours(weeklyShifts.reduce((total, shift) => total + shift.hours, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Statistics */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">{t('statisticsByEmployee')}</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('employee')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('assignedHours')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('weeklyCap')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('utilization')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('busiestDay')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('daysWithoutWeekend')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-200 dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {employeeStats.map((stat) => {
                const utilization = (stat.weeklyAssignedHours / stat.weeklyLimit) * 100;
                const isNearLimit = utilization > 90;
                const isOverLimit = utilization > 100;

                return (
                  <tr key={stat.employeeId}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{stat.employeeName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900 dark:text-gray-100">{formatHours(stat.weeklyAssignedHours)}</span>
                        {isOverLimit && (
                          <AlertTriangle className="w-4 h-4 text-red-500 ml-2" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {stat.weeklyLimit}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className={`h-2 rounded-full ${
                              isOverLimit ? 'bg-red-500' : 
                              isNearLimit ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          />
                        </div>
                        <span className={`text-sm ${
                          isOverLimit ? 'text-red-600' : 
                          isNearLimit ? 'text-yellow-600' : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {utilization.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {daysOfWeek[stat.busiestDayOfWeek]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {stat.daysSinceLastWeekendOff} {t('days')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

