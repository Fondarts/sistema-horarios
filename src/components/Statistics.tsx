import React, { useState } from 'react';
import { useSchedule } from '../contexts/ScheduleContext';
import { useEmployees } from '../contexts/EmployeeContext';
import { useCompactMode } from '../contexts/CompactModeContext';
import { BarChart3, TrendingUp, AlertTriangle, Users, Clock, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Statistics as StatisticsType, Shift, Employee } from '../types';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
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

// Función para detectar problemas de cobertura
const detectCoverageProblems = (shifts: Shift[], employees: Employee[], storeSchedule: any) => {
  const problems: Array<{
    type: 'gap' | 'conflict' | 'unavailable';
    day: string;
    time: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }> = [];

  // Validar que tenemos datos necesarios
  if (!shifts || !employees || !storeSchedule || !Array.isArray(storeSchedule)) {
    return problems;
  }

  // Agrupar turnos por día
  const shiftsByDay = shifts.reduce((acc, shift) => {
    if (!shift || !shift.date) return acc;
    if (!acc[shift.date]) {
      acc[shift.date] = [];
    }
    acc[shift.date].push(shift);
    return acc;
  }, {} as Record<string, Shift[]>);

  // Verificar cada día
  Object.entries(shiftsByDay).forEach(([date, dayShifts]) => {
    const dayOfWeek = new Date(date).getDay();
    
    console.log(`Procesando día: ${date}, día de la semana: ${dayOfWeek} (${['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][dayOfWeek]})`);
    
    // Obtener horario de la tienda para este día
    const daySchedule = storeSchedule.find((s: any) => s && s.dayOfWeek === dayOfWeek);
    if (!daySchedule || !daySchedule.openTime || !daySchedule.closeTime) return;

    const storeOpen = timeToMinutes(daySchedule.openTime);
    const storeClose = timeToMinutes(daySchedule.closeTime);

    // Filtrar turnos válidos y ordenar por hora de inicio
    const validShifts = dayShifts.filter(shift => 
      shift && shift.startTime && shift.endTime && 
      typeof shift.startTime === 'string' && typeof shift.endTime === 'string'
    );
    
    const sortedShifts = validShifts.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    // Verificar huecos en la cobertura
    let lastEndTime = storeOpen;
    sortedShifts.forEach((shift) => {
      const shiftStart = timeToMinutes(shift.startTime);
      const shiftEnd = timeToMinutes(shift.endTime);

      // Verificar si hay un hueco antes de este turno
      if (shiftStart > lastEndTime) {
        const gapDuration = shiftStart - lastEndTime;
        if (gapDuration >= 30) { // Solo reportar huecos de 30+ minutos
          problems.push({
            type: 'gap',
            day: new Date(date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' }),
            time: `${minutesToTime(lastEndTime)} - ${minutesToTime(shiftStart)}`,
            description: `Hueco sin cobertura de ${Math.floor(gapDuration / 60)}h ${gapDuration % 60}m`,
            severity: gapDuration >= 120 ? 'high' : gapDuration >= 60 ? 'medium' : 'low'
          });
        }
      }

      lastEndTime = Math.max(lastEndTime, shiftEnd);
    });

    // Verificar si hay hueco al final del día
    if (lastEndTime < storeClose) {
      const gapDuration = storeClose - lastEndTime;
      if (gapDuration >= 30) {
        problems.push({
          type: 'gap',
          day: new Date(date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' }),
          time: `${minutesToTime(lastEndTime)} - ${minutesToTime(storeClose)}`,
          description: `Hueco sin cobertura al final del día de ${Math.floor(gapDuration / 60)}h ${gapDuration % 60}m`,
          severity: gapDuration >= 120 ? 'high' : gapDuration >= 60 ? 'medium' : 'low'
        });
      }
    }

    // Verificar conflictos con horarios no disponibles
    validShifts.forEach((shift) => {
      const employee = employees.find(emp => emp && emp.id === shift.employeeId);
      if (!employee || !employee.unavailableTimes) return;

      const shiftStart = timeToMinutes(shift.startTime);
      const shiftEnd = timeToMinutes(shift.endTime);

      // Debug: Log para verificar datos
      console.log(`Verificando conflicto para ${employee.name} en ${date} (día ${dayOfWeek}):`, {
        shift: `${shift.startTime}-${shift.endTime}`,
        unavailableTimes: employee.unavailableTimes
      });

      // Verificar si el empleado tiene horarios no disponibles este día
      const unavailableTimes = employee.unavailableTimes.filter(ut => 
        ut && ut.dayOfWeek === dayOfWeek && ut.startTime && ut.endTime &&
        typeof ut.startTime === 'string' && typeof ut.endTime === 'string'
      );
      
      console.log(`Horarios no disponibles para día ${dayOfWeek}:`, unavailableTimes);
      
      unavailableTimes.forEach((unavailable) => {
        const unavailableStart = timeToMinutes(unavailable.startTime);
        const unavailableEnd = timeToMinutes(unavailable.endTime);

        console.log(`Comparando turno ${shift.startTime}-${shift.endTime} con no disponible ${unavailable.startTime}-${unavailable.endTime}`);

        // Verificar si hay solapamiento
        if (shiftStart < unavailableEnd && shiftEnd > unavailableStart) {
          const overlapStart = Math.max(shiftStart, unavailableStart);
          const overlapEnd = Math.min(shiftEnd, unavailableEnd);
          const overlapDuration = overlapEnd - overlapStart;

          console.log(`¡CONFLICTO DETECTADO! Solapamiento: ${minutesToTime(overlapStart)}-${minutesToTime(overlapEnd)}`);

          problems.push({
            type: 'unavailable',
            day: new Date(date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' }),
            time: `${minutesToTime(overlapStart)} - ${minutesToTime(overlapEnd)}`,
            description: `${employee.name} asignado durante horario no disponible (${unavailable.startTime}-${unavailable.endTime})`,
            severity: overlapDuration >= 120 ? 'high' : overlapDuration >= 60 ? 'medium' : 'low'
          });
        }
      });
    });
  });

  return problems;
};

export function Statistics() {
  const { shifts, storeSchedule } = useSchedule();
  const { employees } = useEmployees();
  const { isMobile } = useCompactMode();
  
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
    
    // Calcular días desde último fin de semana libre (simplificado)
    const lastWeekendOff = 7; // Placeholder
    
    // Calcular día más ocupado (simplificado)
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
      daysSinceLastWeekendOff: lastWeekendOff,
      busiestDayOfWeek: busiestDay,
      coverageIssues: [] // Placeholder
    };
  });

  const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  // Detectar problemas de cobertura
  const coverageProblems = detectCoverageProblems(weeklyShifts, employees, storeSchedule);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Estadísticas</h2>
        <p className="text-gray-600 dark:text-gray-400">Métricas de cobertura y carga de trabajo</p>
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
            ← Anterior
          </button>
          <button
            onClick={() => navigateWeek('next')}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm rounded transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
          >
            Siguiente →
          </button>
          <button
            onClick={() => setSelectedWeek(new Date())}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm rounded transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
          >
            Esta Semana
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-primary-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Empleados Activos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{employees.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Turnos Esta Semana</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{weeklyShifts.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Horas Totales</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatHours(weeklyShifts.reduce((total, shift) => total + shift.hours, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Statistics */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Estadísticas por Empleado</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Empleado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Horas Asignadas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tope Semanal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  % Utilización
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Día Más Ocupado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Días Sin Fin de Semana
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
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
                      {stat.daysSinceLastWeekendOff} días
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Coverage Issues */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Problemas de Cobertura</h3>
        
        {coverageProblems.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No se detectaron problemas de cobertura</p>
            <p className="text-sm text-gray-500 mt-2">
              El sistema verificará automáticamente la cobertura mínima configurada
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {coverageProblems.map((problem, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  problem.severity === 'high' ? 'bg-red-50 border-red-500' :
                  problem.severity === 'medium' ? 'bg-yellow-50 border-yellow-500' :
                  'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {problem.type === 'gap' ? (
                      <Clock className={`w-5 h-5 ${
                        problem.severity === 'high' ? 'text-red-500' :
                        problem.severity === 'medium' ? 'text-yellow-500' :
                        'text-blue-500'
                      }`} />
                    ) : (
                      <X className={`w-5 h-5 ${
                        problem.severity === 'high' ? 'text-red-500' :
                        problem.severity === 'medium' ? 'text-yellow-500' :
                        'text-blue-500'
                      }`} />
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-medium ${
                        problem.severity === 'high' ? 'text-red-800' :
                        problem.severity === 'medium' ? 'text-yellow-800' :
                        'text-blue-800'
                      }`}>
                        {problem.type === 'gap' ? 'Hueco sin cobertura' : 'Conflicto de horario'}
                      </h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        problem.severity === 'high' ? 'bg-red-100 text-red-800' :
                        problem.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {problem.severity === 'high' ? 'Alta' :
                         problem.severity === 'medium' ? 'Media' : 'Baja'}
                      </span>
                    </div>
                    <p className={`text-sm mt-1 ${
                      problem.severity === 'high' ? 'text-red-700' :
                      problem.severity === 'medium' ? 'text-yellow-700' :
                      'text-blue-700'
                    }`}>
                      <strong>{problem.day}</strong> - {problem.time}
                    </p>
                    <p className={`text-sm ${
                      problem.severity === 'high' ? 'text-red-600' :
                      problem.severity === 'medium' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`}>
                      {problem.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

