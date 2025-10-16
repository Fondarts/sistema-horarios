import React, { useState } from 'react';
import { Bell, X, Calendar, Users, Clock, AlertCircle, Cake, Gift } from 'lucide-react';
import { Employee } from '../types';
import { format, addDays, isAfter, isBefore, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

export {};

interface NotificationCenterProps {
  employees: Employee[];
  currentEmployee: Employee | null;
  isManager: boolean;
}

interface Notification {
  id: string;
  type: 'birthday' | 'holiday' | 'schedule' | 'change' | 'reminder';
  title: string;
  message: string;
  date?: Date;
  priority: 'low' | 'medium' | 'high';
  icon: React.ReactNode;
}

export function NotificationCenter({ employees, currentEmployee, isManager }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewedNotifications, setViewedNotifications] = useState<Set<string>>(new Set());

  // Función para verificar si una fecha es cumpleaños
  const isBirthdayOnDate = (birthday: string, targetDate: Date): boolean => {
    if (!birthday) return false;
    
    try {
      let date: Date;
      if (birthday.includes('/')) {
        const [day, month, year] = birthday.split('/');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        date = new Date(birthday);
      }
      
      return date.getMonth() === targetDate.getMonth() && date.getDate() === targetDate.getDate();
    } catch (error) {
      return false;
    }
  };

  // Generar notificaciones según el tipo de usuario
  const generateNotifications = (): Notification[] => {
    const notifications: Notification[] = [];
    const today = new Date();
    const nextWeek = addDays(today, 7);

    if (isManager) {
      // Notificaciones para administradores
      
      // Cumpleaños próximos (próximos 7 días)
      for (let i = 0; i < 7; i++) {
        const checkDate = addDays(today, i);
        const birthdayEmployees = employees.filter(emp => 
          emp.isActive && isBirthdayOnDate(emp.birthday, checkDate)
        );

        birthdayEmployees.forEach(employee => {
          const daysUntil = differenceInDays(checkDate, today);
          notifications.push({
            id: `birthday-${employee.id}-${checkDate.toISOString()}`,
            type: 'birthday',
            title: 'Cumpleaños próximo',
            message: `${employee.name} cumple años ${daysUntil === 0 ? 'hoy' : `en ${daysUntil} día${daysUntil > 1 ? 's' : ''}`}`,
            date: checkDate,
            priority: daysUntil <= 1 ? 'high' : 'medium',
            icon: <Cake className="w-4 h-4 text-pink-500" />
          });
        });
      }

      // Recordatorios de planificación
      const currentHour = today.getHours();
      if (currentHour >= 9 && currentHour <= 17) {
        notifications.push({
          id: 'planning-reminder',
          type: 'reminder',
          title: 'Recordatorio de planificación',
          message: 'Recuerda revisar y publicar los horarios de la próxima semana',
          priority: 'medium',
          icon: <Calendar className="w-4 h-4 text-blue-500" />
        });
      }

      // Empleados sin horarios asignados
      // Esta sería una lógica más compleja que requeriría acceso a los horarios
      // Por ahora, agregamos un placeholder
      notifications.push({
        id: 'unassigned-employees',
        type: 'reminder',
        title: 'Revisar asignaciones',
        message: 'Verifica que todos los empleados tengan horarios asignados',
        priority: 'low',
        icon: <Users className="w-4 h-4 text-orange-500" />
      });

    } else {
      // Notificaciones para empleados
      
      // Cumpleaños de compañeros (próximos 3 días)
      for (let i = 0; i < 3; i++) {
        const checkDate = addDays(today, i);
        const birthdayEmployees = employees.filter(emp => 
          emp.isActive && 
          emp.id !== currentEmployee?.id && 
          isBirthdayOnDate(emp.birthday, checkDate)
        );

        birthdayEmployees.forEach(employee => {
          const daysUntil = differenceInDays(checkDate, today);
          notifications.push({
            id: `colleague-birthday-${employee.id}-${checkDate.toISOString()}`,
            type: 'birthday',
            title: 'Cumpleaños de compañero',
            message: `${employee.name} cumple años ${daysUntil === 0 ? 'hoy' : `en ${daysUntil} día${daysUntil > 1 ? 's' : ''}`}. ¡No olvides felicitarlo!`,
            date: checkDate,
            priority: daysUntil <= 1 ? 'high' : 'medium',
            icon: <Gift className="w-4 h-4 text-pink-500" />
          });
        });
      }

      // Nuevos horarios (simulado - en una app real vendría de una API)
      notifications.push({
        id: 'new-schedule',
        type: 'schedule',
        title: 'Nuevos horarios disponibles',
        message: 'Se han publicado los horarios de la próxima semana. Revisa tus turnos asignados.',
        priority: 'high',
        icon: <Clock className="w-4 h-4 text-green-500" />
      });

      // Cambios en horarios
      notifications.push({
        id: 'schedule-changes',
        type: 'change',
        title: 'Cambios en horarios',
        message: 'Se han realizado modificaciones en algunos turnos. Verifica si te afectan.',
        priority: 'medium',
        icon: <AlertCircle className="w-4 h-4 text-yellow-500" />
      });
    }

    return notifications.sort((a, b) => {
      // Ordenar por prioridad y fecha
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      if (a.date && b.date) {
        return a.date.getTime() - b.date.getTime();
      }
      return 0;
    });
  };

  const notifications = generateNotifications();
  const unreadCount = notifications.filter(n => n.priority === 'high' && !viewedNotifications.has(n.id)).length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default: return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="relative">
      {/* Botón de notificaciones */}
      <button
        onClick={() => {
          if (!isOpen) {
            // Marcar todas las notificaciones de alta prioridad como vistas cuando se abre
            const highPriorityNotifications = notifications.filter(n => n.priority === 'high');
            const newViewedIds = new Set([...Array.from(viewedNotifications), ...highPriorityNotifications.map(n => n.id)]);
            setViewedNotifications(newViewedIds);
          }
          setIsOpen(!isOpen);
        }}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="Notificaciones"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-gray-200 dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Notificaciones
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No hay notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-l-4 ${getPriorityColor(notification.priority)}`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3">
                        {notification.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {notification.message}
                        </p>
                        {notification.date && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {format(notification.date, 'dd/MM/yyyy', { locale: es })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {notifications.length} notificación{notifications.length !== 1 ? 'es' : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
