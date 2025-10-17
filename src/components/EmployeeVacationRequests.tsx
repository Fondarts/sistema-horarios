import React, { useState } from 'react';
import { Calendar, Plus, Clock, User, Plane } from 'lucide-react';
import { useVacation, VacationRequest } from '../contexts/VacationContext';
import { useAuth } from '../contexts/AuthContext';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

export function EmployeeVacationRequests() {
  const { currentEmployee } = useAuth();
  const { vacationRequests, addVacationRequest, isLoading } = useVacation();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: ''
  });

  // Filtrar solo las solicitudes del empleado actual
  const myRequests = vacationRequests.filter(request => 
    request.employeeId === currentEmployee?.id
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentEmployee) return;
    
    try {
      const newRequest = {
        employeeId: currentEmployee.id,
        employeeName: currentEmployee.name,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
        status: 'pending' as const
      };
      
      await addVacationRequest(newRequest);
      
      setFormData({ startDate: '', endDate: '', reason: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error creating vacation request:', error);
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
      case 'pending': return t('pending');
      default: return 'Desconocido';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return '✅';
      case 'rejected': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('vacationsAndAbsences')}</h2>
          <p className="text-gray-600 dark:text-gray-400">Solicita y gestiona tus días de vacaciones</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t('requestVacation')}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t('newVacationRequest')}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="Describe el motivo de tu solicitud de vacaciones..."
                required
              />
            </div>

            <div className="flex gap-3">
              <button type="submit" className="btn-primary">
                {t('submitRequest')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({ startDate: '', endDate: '', reason: '' });
                }}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* My Requests */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
          {t('myVacationRequests')}
        </h3>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando solicitudes...</span>
          </div>
        ) : myRequests.length === 0 ? (
          <div className="text-center py-8">
            <Plane className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No tienes solicitudes de vacaciones aún
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Haz clic en "Solicitar Vacaciones" para crear tu primera solicitud
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {myRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {format(new Date(request.startDate), 'dd/MM/yyyy', { locale: es })} - {format(new Date(request.endDate), 'dd/MM/yyyy', { locale: es })}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {calculateDays(request.startDate, request.endDate)} días
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getStatusIcon(request.status)}</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                      {getStatusText(request.status)}
                    </span>
                  </div>
                </div>
                
                <div className="mb-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Motivo:</strong> {request.reason}
                  </p>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>
                      Solicitado: {format(new Date(request.requestedAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </span>
                  </div>
                  {request.approvedAt && (
                    <div className="flex items-center">
                      <User className="w-3 h-3 mr-1" />
                      <span>
                        {request.status === 'approved' ? 'Aprobado' : 'Rechazado'} por {request.approvedBy} el {format(new Date(request.approvedAt), 'dd/MM/yyyy', { locale: es })}
                      </span>
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
