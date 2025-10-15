import React, { useState } from 'react';
import { useEmployees } from '../contexts/EmployeeContext';
import { useCompactMode } from '../contexts/CompactModeContext';
import { Plus, Edit, Trash2, User, Clock, Calendar } from 'lucide-react';
import { Employee, UnavailableTime } from '../types';
import TimeInput from './TimeInput';

// Función para formatear fecha de dd/mm/yyyy a formato legible
const formatBirthday = (birthday: string): string => {
  if (!birthday) return '';
  
  // Si ya está en formato dd/mm/yyyy, devolverlo tal como está
  if (birthday.includes('/')) {
    return birthday;
  }
  
  // Si está en formato ISO (YYYY-MM-DD), convertir a dd/mm/yyyy
  try {
    const date = new Date(birthday);
    if (!isNaN(date.getTime())) {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (error) {
    console.error('Error formatting birthday:', error);
  }
  
  return birthday;
};

export function EmployeeManagement() {
  const { employees, addEmployee, updateEmployee, deleteEmployee, resetToMockEmployees } = useEmployees();
  const { isCompactMode, isMobile } = useCompactMode();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    weeklyLimit: 40,
    birthday: '',
    color: '#3B82F6',
    isActive: true,
    role: 'empleado' as 'encargado' | 'empleado',
    unavailableTimes: [] as UnavailableTime[]
  });

  const daysOfWeek = [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado',
    'Lunes a Viernes', 'Sábado y Domingo'
  ];

  // Función para obtener el nombre del día
  const getDayName = (dayOfWeek: number): string => {
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dayNames[dayOfWeek] || 'Día inválido';
  };


  const addUnavailableTime = () => {
    setFormData(prev => ({
      ...prev,
      unavailableTimes: [
        ...prev.unavailableTimes,
        {
          id: Date.now().toString(),
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00'
        }
      ]
    }));
  };

  const removeUnavailableTime = (id: string) => {
    setFormData(prev => ({
      ...prev,
      unavailableTimes: prev.unavailableTimes.filter(ut => ut.id !== id)
    }));
  };

  const updateUnavailableTime = (id: string, updates: Partial<UnavailableTime>) => {
    setFormData(prev => {
      const currentTime = prev.unavailableTimes.find(ut => ut.id === id);
      if (!currentTime) return prev;

      // Si se está cambiando el día de la semana
      if (updates.dayOfWeek !== undefined) {
        const newDayOfWeek = updates.dayOfWeek;
        
        // Si se selecciona "Lunes a Viernes" (índice 7)
        if (newDayOfWeek === 7) {
          // Eliminar la entrada actual
          const filteredTimes = prev.unavailableTimes.filter(ut => ut.id !== id);
          
          // Crear 5 entradas para lunes a viernes
          const weekdays = [1, 2, 3, 4, 5]; // Lunes a Viernes
          const newTimes = weekdays.map(day => ({
            id: `${Date.now()}-${day}`,
            dayOfWeek: day,
            startTime: currentTime.startTime,
            endTime: currentTime.endTime
          }));
          
          return {
            ...prev,
            unavailableTimes: [...filteredTimes, ...newTimes]
          };
        }
        
        // Si se selecciona "Sábado y Domingo" (índice 8)
        if (newDayOfWeek === 8) {
          // Eliminar la entrada actual
          const filteredTimes = prev.unavailableTimes.filter(ut => ut.id !== id);
          
          // Crear 2 entradas para sábado y domingo
          const weekendDays = [0, 6]; // Domingo y Sábado
          const newTimes = weekendDays.map(day => ({
            id: `${Date.now()}-${day}`,
            dayOfWeek: day,
            startTime: currentTime.startTime,
            endTime: currentTime.endTime
          }));
          
          return {
            ...prev,
            unavailableTimes: [...filteredTimes, ...newTimes]
          };
        }
      }

      // Actualización normal para días individuales
      return {
        ...prev,
        unavailableTimes: prev.unavailableTimes.map(ut =>
          ut.id === id ? { ...ut, ...updates } : ut
        )
      };
    });
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      username: employee.username,
      password: employee.password,
      weeklyLimit: employee.weeklyLimit,
      birthday: employee.birthday,
      color: employee.color,
      isActive: employee.isActive,
      role: employee.role,
      unavailableTimes: employee.unavailableTimes
    });
    setShowAddForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingEmployee) {
      updateEmployee(editingEmployee.id, formData);
    } else {
      addEmployee(formData);
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      username: '',
      password: '',
      weeklyLimit: 40,
      birthday: '',
      color: '#3B82F6',
      isActive: true,
      role: 'empleado',
      unavailableTimes: []
    });
    setEditingEmployee(null);
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gestión de Empleados</h2>
          <p className="text-gray-600 dark:text-gray-400">Administra la información de tus empleados</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Agregar Empleado
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Usuario
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="input-field"
                  placeholder="Ej: ana.perez"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Usuario único para el login del empleado
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="input-field"
                  placeholder="Mínimo 4 caracteres"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Contraseña para el login del empleado
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rol del Empleado
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'encargado' | 'empleado' }))}
                  className="input-field"
                  required
                >
                  <option value="empleado">Empleado Regular</option>
                  <option value="encargado">Encargado Principal</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.role === 'encargado' 
                    ? 'Puede gestionar horarios, empleados y configuraciones'
                    : 'Solo puede ver sus propios horarios'
                  }
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tope Semanal (horas)
                </label>
                <input
                  type="number"
                  value={formData.weeklyLimit}
                  onChange={(e) => setFormData(prev => ({ ...prev, weeklyLimit: parseInt(e.target.value) }))}
                  className="input-field"
                  min="1"
                  max="60"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Nacimiento
                </label>
                <input
                  type="text"
                  value={formData.birthday}
                  onChange={(e) => setFormData(prev => ({ ...prev, birthday: e.target.value }))}
                  className="input-field"
                  placeholder="dd/mm/yyyy"
                  pattern="\d{2}/\d{2}/\d{4}"
                  title="Formato: dd/mm/yyyy (ejemplo: 22/07/1992)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formato: día/mes/año (ejemplo: 22/07/1992) - Opcional
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color del Empleado
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="input-field flex-1"
                    placeholder="#3B82F6"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Este color se usará para identificar los turnos del empleado en el horario
                </p>
              </div>
            </div>

            {/* No Disponibilidad */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Horarios No Disponibles
                </label>
                <button
                  type="button"
                  onClick={addUnavailableTime}
                  className="btn-secondary text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.unavailableTimes.map((unavailable) => (
                  <div key={unavailable.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                      {/* Día de la semana */}
                      <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Día
                        </label>
                        <select
                          value={unavailable.dayOfWeek}
                          onChange={(e) => updateUnavailableTime(unavailable.id, { dayOfWeek: parseInt(e.target.value) })}
                          className="input-field w-full"
                        >
                          {daysOfWeek.map((day, index) => (
                            <option key={index} value={index}>{day}</option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Hora de inicio */}
                      <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Desde
                        </label>
                        <TimeInput
                          value={unavailable.startTime}
                          onChange={(value) => updateUnavailableTime(unavailable.id, { startTime: value })}
                          className="input-field w-full"
                          placeholder="HH:MM"
                        />
                      </div>
                      
                      {/* Hora de fin */}
                      <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Hasta
                        </label>
                        <TimeInput
                          value={unavailable.endTime}
                          onChange={(value) => updateUnavailableTime(unavailable.id, { endTime: value })}
                          className="input-field w-full"
                          placeholder="HH:MM"
                        />
                      </div>
                      
                      {/* Botón eliminar */}
                      <div className="md:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeUnavailableTime(unavailable.id)}
                          className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar horario no disponible"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                {editingEmployee ? 'Actualizar' : 'Crear'} Empleado
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Employees List */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Lista de Empleados</h3>
        
        {employees.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay empleados registrados</p>
          </div>
        ) : (
          <div className={`grid gap-4 ${isCompactMode ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
            {employees.map((employee) => (
              <div key={employee.id} className={`bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-sm transition-shadow ${isCompactMode ? 'p-3' : 'p-4'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: employee.color }}
                    ></div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{employee.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {employee.isActive ? 'Activo' : 'Inactivo'}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(employee)}
                      className="text-primary-600 hover:text-primary-800"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        console.log('Delete button clicked for employee:', employee.id);
                        deleteEmployee(employee.id);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-gray-400 mr-2" />
                    <span>{employee.weeklyLimit}h/semana</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <span>{employee.birthday ? formatBirthday(employee.birthday) : 'No especificada'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                      PIN: {employee.pin}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      employee.role === 'encargado' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {employee.role === 'encargado' ? 'Encargado' : 'Empleado'}
                    </span>
                  </div>
                  {employee.unavailableTimes.length > 0 && (
                    <div className="text-xs text-gray-500">
                      <div className="font-medium mb-1">Restricciones de horario:</div>
                      {employee.unavailableTimes.map((ut, index) => (
                        <div key={ut.id} className="ml-2">
                          {getDayName(ut.dayOfWeek)}: {ut.startTime}-{ut.endTime}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


