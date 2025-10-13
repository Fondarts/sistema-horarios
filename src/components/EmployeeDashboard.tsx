import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSchedule } from '../contexts/ScheduleContext';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, LogOut, Calendar, Clock } from 'lucide-react';

export default function EmployeeDashboard() {
  const { currentEmployee, logout } = useAuth();
  const { shifts } = useSchedule();
  const [currentWeek, setCurrentWeek] = useState(new Date());

  if (!currentEmployee) {
    return null;
  }

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Lunes
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 }); // Domingo
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentWeek(prev => new Date(prev.getTime() - 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentWeek(prev => new Date(prev.getTime() + 7 * 24 * 60 * 60 * 1000));
    }
  };

  // Obtener turnos del empleado para la semana actual
  const employeeShifts = shifts.filter(shift => 
    shift.employeeId === currentEmployee.id &&
    shift.date >= format(weekStart, 'yyyy-MM-dd') &&
    shift.date <= format(weekEnd, 'yyyy-MM-dd') &&
    shift.isPublished
  );

  const formatHours = (decimalHours: number): string => {
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    
    if (minutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  const totalHours = employeeShifts.reduce((total, shift) => total + shift.hours, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Mis Horarios
              </h1>
              <p className="text-gray-600">
                Bienvenido/a, {currentEmployee.name}
              </p>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Week Navigation */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateWeek('prev')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Semana Anterior</span>
              </button>
              <h2 className="text-lg font-semibold">
                {format(weekStart, 'd MMM', { locale: es })} - {format(weekEnd, 'd MMM yyyy', { locale: es })}
              </h2>
              <button
                onClick={() => navigateWeek('next')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <span>Semana Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => setCurrentWeek(new Date())}
              className="text-primary-600 hover:text-primary-800"
            >
              Esta Semana
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-primary-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Turnos Esta Semana</p>
                <p className="text-2xl font-bold text-gray-900">{employeeShifts.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Horas Totales</p>
                <p className="text-2xl font-bold text-gray-900">{formatHours(totalHours)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full mr-3" style={{ backgroundColor: currentEmployee.color }}></div>
              <div>
                <p className="text-sm text-gray-600">Tope Semanal</p>
                <p className="text-2xl font-bold text-gray-900">{currentEmployee.weeklyLimit}h</p>
              </div>
            </div>
          </div>
        </div>

        {/* Shifts List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Mis Turnos</h3>
          </div>
          
          {employeeShifts.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No tienes turnos asignados esta semana</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {employeeShifts.map((shift) => {
                const shiftDate = new Date(shift.date);
                const dayName = format(shiftDate, 'EEEE', { locale: es });
                const dayNumber = format(shiftDate, 'd');
                const month = format(shiftDate, 'MMM', { locale: es });
                
                return (
                  <div key={shift.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                             style={{ backgroundColor: currentEmployee.color }}>
                          {dayNumber}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {dayName}, {dayNumber} de {month}
                        </p>
                        <p className="text-sm text-gray-600">
                          {shift.startTime} - {shift.endTime}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatHours(shift.hours)}
                      </p>
                      <p className="text-xs text-gray-500">duración</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}