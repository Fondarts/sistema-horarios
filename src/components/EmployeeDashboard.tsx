import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSchedule } from '../contexts/ScheduleContext';
import { useEmployees } from '../contexts/EmployeeContext';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, LogOut, Calendar, Clock, UserX } from 'lucide-react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useCompactMode } from '../contexts/CompactModeContext';
import { ThemeToggle } from './ThemeToggle';
import { BirthdayNotification } from './BirthdayNotification';
import { NotificationCenter } from './NotificationCenter';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { Logo } from './Logo';
import { AbsenceManagement } from './AbsenceManagement';
import { HamburgerMenu } from './HamburgerMenu';

export default function EmployeeDashboard() {
  const { currentEmployee, logout } = useAuth();
  const { shifts } = useSchedule();
  const { employees } = useEmployees();
  const { isCompactMode, isMobile } = useCompactMode();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showBirthdayNotification, setShowBirthdayNotification] = useState(true);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [activeTab, setActiveTab] = useState<'schedule' | 'vacations'>('schedule');

  // Atajos de teclado para empleados
  useKeyboardShortcuts([
    {
      key: '/',
      ctrlKey: true,
      action: () => setShowKeyboardHelp(!showKeyboardHelp),
      description: 'Mostrar/ocultar ayuda de atajos'
    },
    {
      key: '1',
      ctrlKey: true,
      action: () => setActiveTab('schedule'),
      description: 'Ir a pestaña Horarios'
    },
    {
      key: '2',
      ctrlKey: true,
      action: () => setActiveTab('vacations'),
      description: 'Ir a pestaña Vacaciones y Ausencias'
    },
    {
      key: 'ArrowLeft',
      action: () => setCurrentWeek(subWeeks(currentWeek, 1)),
      description: 'Semana anterior'
    },
    {
      key: 'ArrowRight',
      action: () => setCurrentWeek(addWeeks(currentWeek, 1)),
      description: 'Semana siguiente'
    }
  ]);

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gray-200 shadow dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              {/* Solo mostrar logo y título en desktop */}
              {!isMobile ? (
                <>
                  <Logo />
                  <div className="ml-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      Mis Horarios
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                      Bienvenido/a, {currentEmployee.name}
                    </p>
                  </div>
                </>
              ) : (
                /* En móvil solo mostrar saludo */
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Bienvenido/a, {currentEmployee.name}
                  </h1>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <NotificationCenter 
                employees={employees}
                currentEmployee={currentEmployee}
                isManager={false}
              />
              
              {/* Solo mostrar en desktop */}
              {!isMobile && (
                <>
                  <KeyboardShortcuts 
                    isManager={false}
                  />
                  <ThemeToggle />
                </>
              )}
              
              {/* Botón de cerrar sesión - solo visible en desktop */}
              {!isMobile && (
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              )}
              
            </div>
            
            {/* Menú hamburguesa - solo visible en móvil */}
            <HamburgerMenu 
              activeTab={activeTab}
              onTabChange={(tab) => setActiveTab(tab as 'schedule' | 'vacations')}
              isManager={false}
              onShowKeyboardHelp={() => setShowKeyboardHelp(true)}
              onLogout={logout}
            />
          </div>
        </div>
      </div>

      {/* Tabs - solo visible en desktop */}
      {!isMobile && (
        <div className="bg-gray-200 border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'schedule'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Mis Horarios
              </div>
            </button>
            <button
              onClick={() => setActiveTab('vacations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'vacations'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center">
                <UserX className="w-4 h-4 mr-2" />
                Vacaciones y Ausencias
              </div>
            </button>
          </nav>
        </div>
      </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'schedule' ? (
          <>
            {/* Week Navigation */}
            <div className="bg-gray-200 rounded-lg shadow p-6 mb-6 dark:bg-gray-800 dark:border dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateWeek('prev')}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Semana Anterior</span>
              </button>
              <h2 className="text-lg font-semibold">
                {format(weekStart, 'd MMM', { locale: es })} - {format(weekEnd, 'd MMM yyyy', { locale: es })}
              </h2>
              <button
                onClick={() => navigateWeek('next')}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
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
          <div className="bg-gray-200 rounded-lg shadow p-6 dark:bg-gray-800">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-primary-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Turnos Esta Semana</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{employeeShifts.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-200 rounded-lg shadow p-6 dark:bg-gray-800">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Horas Totales</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatHours(totalHours)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-200 rounded-lg shadow p-6 dark:bg-gray-800">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full mr-3" style={{ backgroundColor: currentEmployee.color }}></div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tope Semanal</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{currentEmployee.weeklyLimit}h</p>
              </div>
            </div>
          </div>
        </div>

        {/* Shifts List */}
        <div className="bg-gray-200 rounded-lg shadow dark:bg-gray-800">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Mis Turnos</h3>
          </div>
          
          {employeeShifts.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No tienes turnos asignados esta semana</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
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
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                          {dayName}, {dayNumber} de {month}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {shift.startTime} - {shift.endTime}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatHours(shift.hours)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">duración</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
            </div>
          </>
        ) : (
          <AbsenceManagement />
        )}
      </div>

      {/* Birthday Notification */}
      {showBirthdayNotification && (
        <BirthdayNotification 
          employees={employees}
          onClose={() => setShowBirthdayNotification(false)}
        />
      )}
    </div>
  );
}