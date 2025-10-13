import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSchedule } from '../contexts/ScheduleContext';
import { useEmployees } from '../contexts/EmployeeContext';
import { LogOut, Calendar, Clock, User } from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';

export function EmployeeDashboard() {
  const { user, logout } = useAuth();
  const { shifts } = useSchedule();
  const { getEmployee } = useEmployees();

  // Obtener turnos del empleado actual
  const employeeShifts = shifts.filter(shift => 
    shift.employeeId === user?.id && shift.isPublished
  );

  // Ordenar turnos por fecha
  const sortedShifts = employeeShifts.sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) return 'Hoy';
    if (isTomorrow(date)) return 'Mañana';
    if (isYesterday(date)) return 'Ayer';
    return format(date, 'EEEE, d MMMM', { locale: es });
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // HH:MM
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-primary-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Mis Horarios
                </h1>
                <p className="text-sm text-gray-600">
                  Hola, {user?.name}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información del empleado */}
          <div className="lg:col-span-1">
            <div className="card">
              <div className="flex items-center mb-4">
                <User className="w-6 h-6 text-primary-600 mr-3" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Mi Información
                </h2>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Nombre</p>
                  <p className="font-medium">{user?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Rol</p>
                  <p className="font-medium capitalize">{user?.role}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Turnos esta semana</p>
                  <p className="font-medium">{employeeShifts.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de turnos */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center mb-6">
                <Clock className="w-6 h-6 text-primary-600 mr-3" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Mis Turnos
                </h2>
              </div>

              {sortedShifts.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No tienes turnos asignados</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedShifts.map((shift) => (
                    <div
                      key={shift.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {formatDate(shift.date)}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-primary-600">
                            {shift.hours}h
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(parseISO(shift.date), 'dd/MM', { locale: es })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


