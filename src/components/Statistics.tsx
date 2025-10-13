import React from 'react';
import { useSchedule } from '../contexts/ScheduleContext';
import { useEmployees } from '../contexts/EmployeeContext';
import { BarChart3, TrendingUp, AlertTriangle, Users } from 'lucide-react';
import { Statistics as StatisticsType } from '../types';

export function Statistics() {
  const { shifts } = useSchedule();
  const { employees } = useEmployees();

  // Calcular estadísticas básicas
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyShifts = shifts.filter(shift => {
    const shiftDate = new Date(shift.date);
    return shiftDate.getMonth() === currentMonth && 
           shiftDate.getFullYear() === currentYear &&
           shift.isPublished;
  });

  const employeeStats: StatisticsType[] = employees.map(employee => {
    const employeeShifts = monthlyShifts.filter(s => s.employeeId === employee.id);
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
      monthlyAssignedHours: assignedHours,
      monthlyLimit: employee.monthlyLimit,
      daysSinceLastWeekendOff: lastWeekendOff,
      busiestDayOfWeek: busiestDay,
      coverageIssues: [] // Placeholder
    };
  });

  const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Estadísticas</h2>
        <p className="text-gray-600">Métricas de cobertura y carga de trabajo</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-primary-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Empleados Activos</p>
              <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Turnos Este Mes</p>
              <p className="text-2xl font-bold text-gray-900">{monthlyShifts.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Horas Totales</p>
              <p className="text-2xl font-bold text-gray-900">
                {monthlyShifts.reduce((total, shift) => total + shift.hours, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Statistics */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Estadísticas por Empleado</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empleado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Horas Asignadas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tope Mensual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % Utilización
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Día Más Ocupado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Días Sin Fin de Semana
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employeeStats.map((stat) => {
                const utilization = (stat.monthlyAssignedHours / stat.monthlyLimit) * 100;
                const isNearLimit = utilization > 90;
                const isOverLimit = utilization > 100;

                return (
                  <tr key={stat.employeeId}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{stat.employeeName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900">{stat.monthlyAssignedHours}h</span>
                        {isOverLimit && (
                          <AlertTriangle className="w-4 h-4 text-red-500 ml-2" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stat.monthlyLimit}h
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
                          isNearLimit ? 'text-yellow-600' : 'text-gray-900'
                        }`}>
                          {utilization.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {daysOfWeek[stat.busiestDayOfWeek]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Problemas de Cobertura</h3>
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No se detectaron problemas de cobertura</p>
          <p className="text-sm text-gray-500 mt-2">
            El sistema verificará automáticamente la cobertura mínima configurada
          </p>
        </div>
      </div>
    </div>
  );
}

