import React, { useState, useEffect } from 'react';
import { Cake, X, Calendar } from 'lucide-react';
import { Employee } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNotificationStack } from '../contexts/NotificationStackContext';

interface BirthdayNotificationProps {
  employees: Employee[];
  onClose: () => void;
  currentDate?: Date; // Fecha para la cual se están generando horarios
}

export function BirthdayNotification({ employees, onClose, currentDate }: BirthdayNotificationProps) {
  const [showNotification, setShowNotification] = useState(false);
  const [autoHideTimer, setAutoHideTimer] = useState<NodeJS.Timeout | null>(null);
  const { addNotification } = useNotificationStack();
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
      // Marcar como mostrada
      localStorage.setItem(notificationKey, 'true');
      
      // Agregar notificación al stack
      addNotification({
        type: 'birthday',
        title: currentDate ? 'Cumpleaños en esta fecha' : '¡Cumpleaños de hoy!',
        message: `${birthdayEmployees.map(emp => emp.name).join(', ')} cumple${birthdayEmployees.length > 1 ? 'n' : ''} años ${currentDate ? 'en esta fecha' : 'hoy'} 🎉`,
        duration: 10000, // 10 segundos
        component: (
          <div className="mt-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              Considera no asignar turnos para que puedan celebrar.
            </p>
          </div>
        )
      });
      
      setShowNotification(true);
    }
    
    return () => {
      if (autoHideTimer) {
        clearTimeout(autoHideTimer);
      }
    };
  }, [birthdayEmployees.length, hasShownToday, notificationKey, addNotification, currentDate, autoHideTimer]);

  // Si no hay cumpleaños o ya se mostró hoy, no mostrar nada
  if (birthdayEmployees.length === 0 || !showNotification) {
    return null;
  }

  // Este componente ya no renderiza su propia notificación
  // Ahora usa el sistema de NotificationStack
  return null;
}
