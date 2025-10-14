import React from 'react';
import { Cake, X } from 'lucide-react';
import { Employee } from '../types';

interface BirthdayNotificationProps {
  employees: Employee[];
  onClose: () => void;
}

export function BirthdayNotification({ employees, onClose }: BirthdayNotificationProps) {
  // Función para verificar si hoy es cumpleaños
  const isBirthdayToday = (birthday: string): boolean => {
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
      
      const today = new Date();
      return date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
    } catch (error) {
      console.error('Error parsing birthday:', error);
      return false;
    }
  };

  // Filtrar empleados que cumplen años hoy
  const birthdayEmployees = employees.filter(employee => 
    employee.isActive && isBirthdayToday(employee.birthday)
  );

  // Si no hay cumpleaños, no mostrar nada
  if (birthdayEmployees.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <Cake className="w-5 h-5 text-pink-500 mr-2" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              ¡Cumpleaños de hoy!
            </h3>
          </div>
          <button
            onClick={onClose}
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
                <strong>{employee.name}</strong> cumple años hoy 🎉
              </span>
            </div>
          ))}
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            ¡No olvides felicitarlos!
          </p>
        </div>
      </div>
    </div>
  );
}
