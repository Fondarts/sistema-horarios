import React, { useState } from 'react';
import { useEmployees } from '../contexts/EmployeeContext';
import { Plus, Edit, Trash2, User, Clock, Calendar } from 'lucide-react';
import { Employee, UnavailableTime } from '../types';

export function EmployeeManagement() {
  const { employees, addEmployee, updateEmployee, deleteEmployee, resetToMockEmployees } = useEmployees();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    weeklyLimit: 40,
    birthday: '',
    color: '#3B82F6',
    unavailableTimes: [] as UnavailableTime[]
  });

  const daysOfWeek = [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingEmployee) {
      updateEmployee(editingEmployee.id, formData);
    } else {
      addEmployee({
        ...formData,
        isActive: true
      });
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      weeklyLimit: 40,
      birthday: '',
      color: '#3B82F6',
      unavailableTimes: []
    });
    setShowAddForm(false);
    setEditingEmployee(null);
  };

  const handleEdit = (employee: Employee) => {
    setFormData({
      name: employee.name,
      weeklyLimit: employee.weeklyLimit,
      birthday: employee.birthday,
      color: employee.color,
      unavailableTimes: employee.unavailableTimes
    });
    setEditingEmployee(employee);
    setShowAddForm(true);
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
    setFormData(prev => ({
      ...prev,
      unavailableTimes: prev.unavailableTimes.map(ut =>
        ut.id === id ? { ...ut, ...updates } : ut
      )
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Empleados</h2>
          <p className="text-gray-600">Administra la información de tus empleados</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={resetToMockEmployees}
            className="btn-secondary flex items-center"
          >
            <User className="w-5 h-5 mr-2" />
            Cargar Empleados de Prueba
          </button>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  value={formData.birthday}
                  onChange={(e) => setFormData(prev => ({ ...prev, birthday: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <label className="block text-sm font-medium text-gray-700">
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
                  <div key={unavailable.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <select
                      value={unavailable.dayOfWeek}
                      onChange={(e) => updateUnavailableTime(unavailable.id, { dayOfWeek: parseInt(e.target.value) })}
                      className="input-field flex-1"
                    >
                      {daysOfWeek.map((day, index) => (
                        <option key={index} value={index}>{day}</option>
                      ))}
                    </select>
                    
                    <input
                      type="time"
                      value={unavailable.startTime}
                      onChange={(e) => updateUnavailableTime(unavailable.id, { startTime: e.target.value })}
                      className="input-field"
                    />
                    
                    <span className="text-gray-500">a</span>
                    
                    <input
                      type="time"
                      value={unavailable.endTime}
                      onChange={(e) => updateUnavailableTime(unavailable.id, { endTime: e.target.value })}
                      className="input-field"
                    />
                    
                    <button
                      type="button"
                      onClick={() => removeUnavailableTime(unavailable.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Lista de Empleados</h3>
        
        {employees.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay empleados registrados</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map((employee) => (
              <div key={employee.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: employee.color }}
                    ></div>
                    <div>
                      <h4 className="font-medium text-gray-900">{employee.name}</h4>
                      <p className="text-sm text-gray-600">
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
                      onClick={() => deleteEmployee(employee.id)}
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
                    <span>{new Date(employee.birthday).toLocaleDateString()}</span>
                  </div>
                  {employee.unavailableTimes.length > 0 && (
                    <div className="text-xs text-gray-500">
                      {employee.unavailableTimes.length} restricción(es) de horario
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


