import React, { useState } from 'react';
import { Calendar, Plus, Edit, Trash2, Check, X, Clock, User } from 'lucide-react';
import { useEmployees } from '../contexts/EmployeeContext';
import { useVacation, VacationRequest } from '../contexts/VacationContext';
import { useAuth } from '../contexts/AuthContext';
import { format, addDays, isAfter, isBefore, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

export function VacationManagement() {
  const { employees } = useEmployees();
  const { currentEmployee } = useAuth();
  const { 
    vacationRequests, 
    addVacationRequest, 
    updateVacationRequest, 
    deleteVacationRequest,
    approveVacationRequest,
    rejectVacationRequest,
    isLoading 
  } = useVacation();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRequest, setEditingRequest] = useState<VacationRequest | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');

  const [formData, setFormData] = useState({
    employeeId: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingRequest) {
        // Editar solicitud existente
        await updateVacationRequest(editingRequest.id, {
          employeeId: formData.employeeId,
          employeeName: employees.find(emp => emp.id === formData.employeeId)?.name || '',
          startDate: formData.startDate,
          endDate: formData.endDate,
          reason: formData.reason
        });
      } else {
        // Crear nueva solicitud
        const newRequest = {
          employeeId: formData.employeeId,
          employeeName: employees.find(emp => emp.id === formData.employeeId)?.name || '',
          startDate: formData.startDate,
          endDate: formData.endDate,
          reason: formData.reason,
          status: 'pending' as const
        };
        
        await addVacationRequest(newRequest);
      }
      
      setFormData({ employeeId: '', startDate: '', endDate: '', reason: '' });
      setShowAddForm(false);
      setEditingRequest(null);
    } catch (error) {
      console.error('Error saving vacation request:', error);
    }
  };

  const handleEdit = (request: VacationRequest) => {
    setEditingRequest(request);
    setFormData({
      employeeId: request.employeeId,
      startDate: request.startDate,
      endDate: request.endDate,
      reason: request.reason
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteVacationRequest(id);
    } catch (error) {
      console.error('Error deleting vacation request:', error);
    }
  };

  const handleStatusChange = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const approvedBy = currentEmployee?.name || 'Manager';
      
      if (status === 'approved') {
        await approveVacationRequest(id, approvedBy);
      } else {
        await rejectVacationRequest(id, approvedBy);
      }
    } catch (error) {
      console.error('Error updating vacation request status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprobado';
      case 'rejected': return 'Rechazado';
      case 'pending': return 'Pendiente';
      default: return 'Desconocido';
    }
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return differenceInDays(end, start) + 1;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gestión de Vacaciones</h2>
          <p className="text-gray-600 dark:text-gray-400">Administra las solicitudes de vacaciones y días libres</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nueva Solicitud
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {editingRequest ? 'Editar Solicitud' : 'Nueva Solicitud de Vacaciones'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Empleado
              </label>
              <select
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="input-field"
                required
              >
                <option value="">Seleccionar empleado</option>
                {employees.filter(emp => emp.isActive).map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Fin
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Motivo
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="input-field"
                rows={3}
                placeholder="Describe el motivo de la solicitud..."
                required
              />
            </div>

            <div className="flex gap-3">
              <button type="submit" className="btn-primary">
                {editingRequest ? 'Actualizar' : 'Crear'} Solicitud
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingRequest(null);
                  setFormData({ employeeId: '', startDate: '', endDate: '', reason: '' });
                }}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vacation Requests List */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Solicitudes de Vacaciones</h3>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando solicitudes...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Empleado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Período
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Días
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Motivo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {vacationRequests.map((request) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {request.employeeName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {format(new Date(request.startDate), 'dd/MM/yyyy', { locale: es })} - {format(new Date(request.endDate), 'dd/MM/yyyy', { locale: es })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {calculateDays(request.startDate, request.endDate)} días
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                      {request.reason}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                      {getStatusText(request.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(request.id, 'approved')}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            title="Aprobar"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleStatusChange(request.id, 'rejected')}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Rechazar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleEdit(request)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(request.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
