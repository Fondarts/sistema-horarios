import React, { useState } from 'react';
import { useAbsence } from '../contexts/AbsenceContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useDateFormat } from '../contexts/DateFormatContext';
import { useEmployees } from '../contexts/EmployeeContext';
import { useAuth } from '../contexts/AuthContext';
import { FileUpload } from './FileUpload';
import { LocalFileStorage } from '../services/localFileStorage';
import { 
  Calendar, 
  User, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Plus,
  Filter,
  Download,
  Eye,
  Trash2,
  X
} from 'lucide-react';

// Función para formatear automáticamente la fecha mientras se escribe
const formatDateInput = (value: string): string => {
  // Remover todos los caracteres que no sean números
  const numbers = value.replace(/\D/g, '');
  
  // Limitar a 8 dígitos máximo
  const limitedNumbers = numbers.slice(0, 8);
  
  // Aplicar formato automático
  if (limitedNumbers.length <= 2) {
    return limitedNumbers;
  } else if (limitedNumbers.length <= 4) {
    return `${limitedNumbers.slice(0, 2)}/${limitedNumbers.slice(2)}`;
  } else {
    return `${limitedNumbers.slice(0, 2)}/${limitedNumbers.slice(2, 4)}/${limitedNumbers.slice(4)}`;
  }
};

// Función para convertir fecha dd/mm/yyyy a formato ISO para JavaScript
const convertToISODate = (dateString: string): string => {
  if (!dateString || !dateString.includes('/')) {
    return dateString; // Si no tiene formato dd/mm/yyyy, devolver tal como está
  }
  
  const [day, month, year] = dateString.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

import { 
  AbsenceType, 
  AbsenceStatus, 
  ABSENCE_TYPE_LABELS, 
  ABSENCE_STATUS_LABELS,
  ABSENCE_TYPE_COLORS,
  ABSENCE_STATUS_COLORS
} from '../types/absence';

interface AbsenceManagementProps {
  isEmployeeDashboard?: boolean;
}

export const AbsenceManagement: React.FC<AbsenceManagementProps> = ({ isEmployeeDashboard = false }) => {
  const { t } = useLanguage();
  const { formatDate, parseDate, dateFormat } = useDateFormat();
  
  // Función para obtener el placeholder dinámico según el formato de fecha
  const getDatePlaceholder = () => {
    switch (dateFormat) {
      case 'mm/dd/yyyy':
        return 'mm/dd/yyyy';
      case 'yyyy/mm/dd':
        return 'yyyy/mm/dd';
      case 'dd/mm/yyyy':
      default:
        return 'dd/mm/yyyy';
    }
  };

  // Función para obtener el ejemplo dinámico según el formato de fecha
  const getDateExample = () => {
    switch (dateFormat) {
      case 'mm/dd/yyyy':
        return '03/15/2024';
      case 'yyyy/mm/dd':
        return '2024/03/15';
      case 'dd/mm/yyyy':
      default:
        return '15/03/2024';
    }
  };

  // Función para obtener el patrón regex dinámico según el formato de fecha
  const getDatePattern = () => {
    switch (dateFormat) {
      case 'mm/dd/yyyy':
        return '\\d{2}/\\d{2}/\\d{4}';
      case 'yyyy/mm/dd':
        return '\\d{4}/\\d{2}/\\d{2}';
      case 'dd/mm/yyyy':
      default:
        return '\\d{2}/\\d{2}/\\d{4}';
    }
  };

  const { 
    absenceRequests, 
    addAbsenceRequest, 
    approveAbsenceRequest, 
    rejectAbsenceRequest, 
    deleteAbsenceRequest,
    getAbsenceStats,
    getPendingApprovals,
    isLoading 
  } = useAbsence();
  const { employees } = useEmployees();
  const { currentEmployee } = useAuth();

  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  const [selectedType, setSelectedType] = useState<'all' | AbsenceType>('all');
  const [selectedStatus, setSelectedStatus] = useState<AbsenceStatus | 'all'>('all');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [showDetails, setShowDetails] = useState<string | null>(null);

  // Formulario de nueva solicitud
  const [newRequest, setNewRequest] = useState({
    employeeId: currentEmployee?.id || '',
    startDate: '',
    endDate: '',
    reason: '',
    type: 'vacation' as AbsenceType
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stats = getAbsenceStats();
  const pendingApprovals = getPendingApprovals();

  // Filtrar solicitudes
  const filteredRequests = absenceRequests.filter(request => {
    const typeMatch = selectedType === 'all' || request.type === selectedType;
    const statusMatch = selectedStatus === 'all' || request.status === selectedStatus;
    const employeeMatch = !selectedEmployee || request.employeeId === selectedEmployee;
    return typeMatch && statusMatch && employeeMatch;
  });

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Iniciando envío de solicitud con datos:', newRequest);
    
    if (!newRequest.employeeId || !newRequest.startDate || !newRequest.endDate) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Buscando empleado con ID:', newRequest.employeeId);
      const employee = employees.find(emp => emp.id === newRequest.employeeId);
      if (!employee) {
        console.error(`${t('employee')} no encontrado`);
        alert(`${t('employee')} no encontrado`);
        return;
      }

      console.log(`${t('employee')} encontrado:`, employee);
      
      if (!employee.storeId) {
        console.error(`${t('employee')} sin storeId:`, employee);
        alert('El empleado no tiene una tienda asignada');
        return;
      }

      const requestData = {
        employeeId: newRequest.employeeId,
        employeeName: employee.name,
        storeId: employee.storeId!,
        type: newRequest.type,
        startDate: convertToISODate(newRequest.startDate),
        endDate: convertToISODate(newRequest.endDate),
        reason: newRequest.reason,
        status: 'pending' as const
      };

      console.log('Enviando solicitud con datos:', requestData);
      console.log('Archivo seleccionado:', selectedFile);

      await addAbsenceRequest(requestData, selectedFile || undefined);

      console.log('Solicitud enviada exitosamente, reseteando formulario');
      
      // Reset form
      setNewRequest({
        employeeId: '',
        startDate: '',
        endDate: '',
        reason: '',
        type: 'vacation'
      });
      setSelectedFile(null);
      setShowNewRequestForm(false);
    } catch (error) {
      console.error('Error submitting request:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      alert('Error al enviar la solicitud: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!currentEmployee) return;
    try {
      await approveAbsenceRequest(id, currentEmployee.name || 'Manager');
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Error al aprobar la solicitud');
    }
  };

  const handleReject = async (id: string) => {
    if (!currentEmployee) return;
    const reason = prompt('Motivo del rechazo (opcional):');
    try {
      await rejectAbsenceRequest(id, currentEmployee.name || 'Manager', reason || undefined);
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Error al rechazar la solicitud');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta solicitud?')) return;
    try {
      await deleteAbsenceRequest(id);
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('Error al eliminar la solicitud');
    }
  };

  const formatDateLocal = (dateString: string) => {
    const isoDate = convertToISODate(dateString);
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    return formatDate(date);
  };

  const getDaysDifference = (startDate: string, endDate: string) => {
    const startIso = convertToISODate(startDate);
    const endIso = convertToISODate(endDate);
    const start = new Date(startIso);
    const end = new Date(endIso);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 0;
    }
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('absenceManagement')}</h2>
          <p className="text-gray-600">{t('manageAllAbsenceRequests')}</p>
        </div>
        <button
          onClick={() => {
            setNewRequest({
              employeeId: currentEmployee?.id || '',
              startDate: '',
              endDate: '',
              reason: '',
              type: 'vacation' as AbsenceType
            });
            setShowNewRequestForm(true);
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('newRequest')}
        </button>
      </div>

              {/* Estadísticas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-200 dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <Calendar className="w-8 h-8 text-blue-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('totalAbsences')}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">{stats.totalAbsences}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-200 dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <Clock className="w-8 h-8 text-yellow-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('pending')}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">{stats.pendingApprovals}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-200 dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <XCircle className="w-8 h-8 text-red-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ausencias No Justificadas</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">{stats.absencesByType.unjustified}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-200 dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('remainingVacationDays')}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                        {currentEmployee?.vacationDaysPerYear ? 
                          Math.max(0, currentEmployee.vacationDaysPerYear - stats.absencesByType.vacation) : 
                          'N/A'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filtros */}
              <div className="bg-gray-200 dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('type')}</label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value as AbsenceType)}
                      className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-50"
                    >
                      <option value="all">{t('allTypes')}</option>
                      {Object.entries(ABSENCE_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{t(value as AbsenceType)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('status')}</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value as AbsenceStatus | 'all')}
                      className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-50"
                    >
                      <option value="all">{t('allStatuses')}</option>
                      {Object.entries(ABSENCE_STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{t(value as AbsenceStatus)}</option>
                      ))}
                    </select>
                  </div>
                  {/* Solo encargados y encargados de distrito pueden filtrar por empleado */}
                  {(currentEmployee?.role === 'encargado' || currentEmployee?.role === 'distrito') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('employee')}</label>
                      <select
                        value={selectedEmployee}
                        onChange={(e) => setSelectedEmployee(e.target.value)}
                        className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-50"
                      >
                        <option value="">{t('allEmployees')}</option>
                        {employees.map(employee => (
                          <option key={employee.id} value={employee.id}>{employee.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Lista de solicitudes */}
              <div className="bg-gray-200 dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          {t('employee')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          {t('type')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          {t('dates')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          {t('days')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          {t('status')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          {t('actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <User className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2" />
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-50">{request.employeeName}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{request.employeeId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ABSENCE_TYPE_COLORS[request.type]}`}>
                              {t(request.type)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-50">
                            <div>{formatDateLocal(request.startDate)}</div>
                            <div className="text-gray-500 dark:text-gray-400">al {formatDateLocal(request.endDate)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-50">
                            {getDaysDifference(request.startDate, request.endDate)} {t('days')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ABSENCE_STATUS_COLORS[request.status]}`}>
                              {t(request.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setShowDetails(showDetails === request.id ? null : request.id)}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {/* Solo encargados y encargados de distrito pueden aprobar/rechazar/eliminar */}
                              {(currentEmployee?.role === 'encargado' || currentEmployee?.role === 'distrito') && (
                                <>
                                  {request.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => handleApprove(request.id)}
                                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                      >
                                        <CheckCircle className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleReject(request.id)}
                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                      >
                                        <XCircle className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
                                  <button
                                    onClick={() => handleDelete(request.id)}
                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
            </tbody>
          </table>
        </div>
      </div>

              {/* Modal de nueva solicitud */}
              {showNewRequestForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-gray-200 dark:bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-4">{t('newAbsenceRequest')}</h3>
                    <form onSubmit={handleSubmitRequest} className="space-y-4">
                      {/* Mostrar selector de empleado para encargados y encargados de distrito, o campo fijo para empleados */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('employee')}</label>
                        {(() => {
                          // Si estamos en el dashboard de empleado, siempre mostrar campo fijo
                          // Si no, verificar el rol del empleado
                          if (isEmployeeDashboard) {
                            return false; // Mostrar campo fijo desde dashboard de empleado
                          }
                          
                          const isEmployee = currentEmployee?.role === 'empleado';
                          return !isEmployee; // Mostrar dropdown si NO es empleado regular
                        })() ? (
                          <select
                            value={newRequest.employeeId}
                            onChange={(e) => setNewRequest({...newRequest, employeeId: e.target.value})}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50"
                            required
                          >
                            <option value="">{t('selectEmployee')}</option>
                            {employees.map(employee => (
                              <option key={employee.id} value={employee.id}>{employee.name}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={(() => {
                              // Para empleados regulares, siempre mostrar su propio nombre
                              if (currentEmployee?.role === 'empleado') {
                                return currentEmployee?.name || '';
                              }
                              // Para encargados/distrito, mostrar el nombre del empleado seleccionado
                              const selectedEmployee = employees.find(emp => emp.id === newRequest.employeeId);
                              return selectedEmployee?.name || '';
                            })()}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                            disabled
                            readOnly
                          />
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('absenceType')}</label>
                        <select
                          value={newRequest.type}
                          onChange={(e) => setNewRequest({...newRequest, type: e.target.value as AbsenceType})}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50"
                        >
                          {Object.entries(ABSENCE_TYPE_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{t(value as AbsenceType)}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('startDate')}</label>
                          <input
                            type="text"
                            value={newRequest.startDate}
                            onChange={(e) => setNewRequest({...newRequest, startDate: formatDateInput(e.target.value)})}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50"
                            placeholder={getDatePlaceholder()}
                            pattern={getDatePattern()}
                            title={`Formato: ${getDatePlaceholder()} (ejemplo: ${getDateExample()})`}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('endDate')}</label>
                          <input
                            type="text"
                            value={newRequest.endDate}
                            onChange={(e) => setNewRequest({...newRequest, endDate: formatDateInput(e.target.value)})}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50"
                            placeholder={getDatePlaceholder()}
                            pattern={getDatePattern()}
                            title={`Formato: ${getDatePlaceholder()} (ejemplo: ${getDateExample()})`}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('reason')}</label>
                        <textarea
                          value={newRequest.reason}
                          onChange={(e) => setNewRequest({...newRequest, reason: e.target.value})}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50"
                          rows={3}
                          placeholder={t('describeAbsenceReason')}
                        />
                      </div>
                      {(newRequest.type === 'sickness' || newRequest.type === 'special') && (
                        <FileUpload
                          onFileSelect={setSelectedFile}
                          onFileUpload={async (file) => {
                            // Esta función se manejará en el contexto
                            return '';
                          }}
                          label="Justificante Médico"
                          required={newRequest.type === 'sickness'}
                        />
                      )}
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowNewRequestForm(false)}
                          className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                        >
                          {isSubmitting ? t('submitting') : t('submitRequest')}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Modal de detalles de solicitud */}
              {showDetails && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl border border-gray-200 dark:border-gray-700">
                    {(() => {
                      const request = absenceRequests.find(r => r.id === showDetails);
                      if (!request) return null;
                      
                      return (
                        <>
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50">
                              {t('requestDetails')}
                            </h3>
                            <button
                              onClick={() => setShowDetails(null)}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              <X className="w-6 h-6" />
                            </button>
                          </div>
                          
                          <div className="space-y-4">
                            {/* Información del empleado */}
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                              <h4 className="font-medium text-gray-900 dark:text-gray-50 mb-2">Información del {t('employee')}</h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">{t('name')}:</span>
                                  <p className="text-gray-900 dark:text-gray-50">{request.employeeName}</p>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">ID:</span>
                                  <p className="text-gray-900 dark:text-gray-50">{request.employeeId}</p>
                                </div>
                              </div>
                            </div>

                            {/* Información de la ausencia */}
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                              <h4 className="font-medium text-gray-900 dark:text-gray-50 mb-2">{t('absenceInformation')}</h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">{t('type')}:</span>
                                  <p className="text-gray-900 dark:text-gray-50">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ABSENCE_TYPE_COLORS[request.type]}`}>
                                      {t(request.type)}
                                    </span>
                                  </p>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">{t('status')}:</span>
                                  <p className="text-gray-900 dark:text-gray-50">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ABSENCE_STATUS_COLORS[request.status]}`}>
                                      {t(request.status)}
                                    </span>
                                  </p>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">{t('startDate')}:</span>
                                  <p className="text-gray-900 dark:text-gray-50">{formatDateLocal(request.startDate)}</p>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">{t('endDate')}:</span>
                                  <p className="text-gray-900 dark:text-gray-50">{formatDateLocal(request.endDate)}</p>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">{t('duration')}:</span>
                                  <p className="text-gray-900 dark:text-gray-50">{getDaysDifference(request.startDate, request.endDate)} {t('days')}</p>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">{t('requestDate')}:</span>
                                  <p className="text-gray-900 dark:text-gray-50">{formatDateLocal(request.createdAt)}</p>
                                </div>
                              </div>
                            </div>

                            {/* Motivo */}
                            {request.reason && (
                              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-900 dark:text-gray-50 mb-2">{t('reason')}</h4>
                                <p className="text-gray-900 dark:text-gray-50">{request.reason}</p>
                              </div>
                            )}

                            {/* Justificante médico */}
                            {request.medicalCertificate && (
                              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-900 dark:text-gray-50 mb-2">Justificante Médico</h4>
                                {request.medicalCertificate.startsWith('local-file:') ? (
                                  (() => {
                                    const fileId = request.medicalCertificate.replace('local-file:', '');
                                    const fileData = LocalFileStorage.getFile(fileId);
                                    
                                    if (fileData) {
                                      return (
                                        <div className="flex items-center gap-2">
                                          <FileText className="w-4 h-4 text-blue-500" />
                                          <div className="flex-1">
                                            <p className="text-gray-900 dark:text-gray-50">
                                              {fileData.name}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                              {(fileData.size / 1024).toFixed(1)} KB • {fileData.type}
                                            </p>
                                            <button
                                              onClick={() => {
                                                const link = document.createElement('a');
                                                link.href = fileData.data;
                                                link.download = fileData.name;
                                                link.click();
                                              }}
                                              className="mt-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-2 text-sm"
                                            >
                                              <Download className="w-4 h-4" />
                                              Descargar archivo
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    } else {
                                      return (
                                        <div className="flex items-center gap-2">
                                          <FileText className="w-4 h-4 text-red-500" />
                                          <div>
                                            <p className="text-gray-900 dark:text-gray-50">
                                              Archivo no encontrado
                                            </p>
                                            <p className="text-sm text-red-500 dark:text-red-400">
                                              El archivo puede haber sido eliminado
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    }
                                  })()
                                ) : request.medicalCertificate.startsWith('temp-file:') ? (
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-blue-500" />
                                    <div>
                                      <p className="text-gray-900 dark:text-gray-50">
                                        Archivo adjunto: {request.medicalCertificate.split(':')[1]}
                                      </p>
                                      <p className="text-sm text-gray-500 dark:text-gray-400">
                                        (Archivo guardado localmente)
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-blue-500" />
                                    <a
                                      href={request.medicalCertificate}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-2"
                                    >
                                      <Download className="w-4 h-4" />
                                      Descargar archivo
                                    </a>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                      (Archivo externo)
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Información de aprobación/rechazo */}
                            {request.status !== 'pending' && (
                              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-900 dark:text-gray-50 mb-2">
                                  {request.status === 'approved' ? 'Información de Aprobación' : 'Información de Rechazo'}
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                      {request.status === 'approved' ? 'Aprobado por:' : 'Rechazado por:'}
                                    </span>
                                    <p className="text-gray-900 dark:text-gray-50">{request.approvedBy || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Fecha:</span>
                                    <p className="text-gray-900 dark:text-gray-50">
                                      {request.approvedAt ? formatDateLocal(request.approvedAt) : 'N/A'}
                                    </p>
                                  </div>
                                  {request.status === 'rejected' && request.rejectionReason && (
                                    <div className="col-span-2">
                                      <span className="text-sm text-gray-500 dark:text-gray-400">Motivo del rechazo:</span>
                                      <p className="text-gray-900 dark:text-gray-50">{request.rejectionReason}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          );
        };
