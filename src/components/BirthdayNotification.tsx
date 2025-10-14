import React, { useState, useEffect } from 'react';
import { Cake, X, Calendar } from 'lucide-react';
import { Employee } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface BirthdayNotificationProps {
  employees: Employee[];
  onClose: () => void;
  currentDate?: Date; // Fecha para la cual se están generando horarios
}

export function BirthdayNotification({ employees, onClose, currentDate }: BirthdayNotificationProps) {
  const [showNotification, setShowNotification] = useState(false);
  const [autoHideTimer, setAutoHideTimer] = useState<NodeJS.Timeout | null>(null);
  // Función para verificar si una fecha específica es cumpleaños
  const isBirthdayOnDate = (birthday: string, targetDate: Date): boolean => {
    if (!birthday) return false;
    
    try {
      // Convertir fecha de dd/mm/yyyy a objeto Date
      let date: Date;
      if (birthday.includes('/')) {
        const [day, month, year] = birthday.split('/');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        // Si está en formato ISO
        date = new Date(birthday);
      }
      
      return date.getMonth() === targetDate.getMonth() && date.getDate() === targetDate.getDate();
    } catch (error) {
      console.error('Error parsing birthday:', error);
      return false;
    }
  };

  // Usar la fecha actual si no se proporciona una fecha específica
  const checkDate = currentDate || new Date();
  
  // Filtrar empleados que cumplen años en la fecha especificada
  const birthdayEmployees = employees.filter(employee => 
    employee.isActive && isBirthdayOnDate(employee.birthday, checkDate)
  );

  // Verificar si ya se mostró la notificación hoy
  const today = format(checkDate, 'yyyy-MM-dd');
  const notificationKey = `birthday_notification_${today}`;
  const hasShownToday = localStorage.getItem(notificationKey) === 'true';

  // Mostrar notificación solo si hay cumpleaños y no se ha mostrado hoy
  useEffect(() => {
    if (birthdayEmployees.length > 0 && !hasShownToday) {
      setShowNotification(true);
      
      // Marcar como mostrada
      localStorage.setItem(notificationKey, 'true');
      
      // Auto-ocultar después de 10 segundos
      const timer = setTimeout(() => {
        setShowNotification(false);
        onClose();
      }, 10000);
      
      setAutoHideTimer(timer);
    }
    
    return () => {
      if (autoHideTimer) {
        clearTimeout(autoHideTimer);
      }
    };
  }, [birthdayEmployees.length, hasShownToday, notificationKey, onClose, autoHideTimer]);

  // Si no hay cumpleaños o ya se mostró hoy, no mostrar nada
  if (birthdayEmployees.length === 0 || !showNotification) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <Cake className="w-5 h-5 text-pink-500 mr-2" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {currentDate ? 'Cumpleaños en esta fecha' : '¡Cumpleaños de hoy!'}
            </h3>
          </div>
          <button
            onClick={() => {
              if (autoHideTimer) {
                clearTimeout(autoHideTimer);
              }
              setShowNotification(false);
              onClose();
            }}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-2">
          {birthdayEmployees.map((employee) => (
            <div key={employee.id} className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-3"
                style={{ backgroundColor: employee.color }}
              ></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                <strong>{employee.name}</strong> cumple años {currentDate ? `el ${format(checkDate, 'dd/MM', { locale: es })}` : 'hoy'} 🎉
              </span>
            </div>
          ))}
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="w-3 h-3 mr-1" />
            <span>Considera no asignar turnos para que puedan celebrar</span>
          </div>
        </div>
      </div>
    </div>
  );
}
