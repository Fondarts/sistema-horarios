import React, { useState } from 'react';
import { useEmployees } from '../contexts/EmployeeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useDateFormat } from '../contexts/DateFormatContext';
import { format, parseISO, isValid, parse } from 'date-fns';
import { useCompactMode } from '../contexts/CompactModeContext';
import { useStore } from '../contexts/StoreContext';
import { Plus, Edit, Trash2, User, Clock, Calendar, Eye, EyeOff, ArrowRightLeft } from 'lucide-react';
import { Employee, UnavailableTime, EmployeeTransfer } from '../types';
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

// Función para formatear fecha de inicio de dd/mm/yyyy a formato legible
const formatStartDate = (startDate: string): string => {
  if (!startDate) return '';
  
  // Si ya está en formato dd/mm/yyyy, devolverlo tal como está
  if (startDate.includes('/')) {
    return startDate;
  }
  
  // Si está en formato ISO (YYYY-MM-DD), convertir a dd/mm/yyyy
  try {
    const date = new Date(startDate);
    if (!isNaN(date.getTime())) {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (error) {
    console.error('Error formatting start date:', error);
  }
  
  return startDate;
};

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

export function EmployeeManagement() {
  const { employees, addEmployee, updateEmployee, deleteEmployee, resetToMockEmployees } = useEmployees();
  const { stores, currentStore } = useStore();
  const { isCompactMode, isMobile } = useCompactMode();
  const { t } = useLanguage();
  const { formatDate, dateFormat } = useDateFormat();
  
  // Helper function to format date for display
  const getDisplayDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    try {
      return formatDate(dateString);
    } catch (error) {
      console.error("Error formatting date for display:", error);
      return dateString; // Fallback to YYYY-MM-DD if formatting fails
    }
  };

  // Helper function to parse input date string to YYYY-MM-DD
  const getInternalDate = (inputString: string) => {
    if (!inputString) return '';
    try {
      // Convert the input string to a Date object using the configured format
      const dateObj = new Date(inputString);
      if (isValid(dateObj)) {
        return format(dateObj, 'yyyy-MM-dd');
      }
      return '';
    } catch (error) {
      console.error("Error parsing input date:", error);
      return ''; // Return empty string for invalid input
    }
  };
  
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
        return '07/22/1992';
      case 'yyyy/mm/dd':
        return '1992/07/22';
      case 'dd/mm/yyyy':
      default:
        return '22/07/1992';
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

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [employeeToTransfer, setEmployeeToTransfer] = useState<Employee | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [transferType, setTransferType] = useState<'permanent' | 'temporary'>('permanent');
  const [transferStartDate, setTransferStartDate] = useState<string>('');
  const [returnDate, setReturnDate] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [terminationDate, setTerminationDate] = useState<string>('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    weeklyLimit: 40,
    birthday: '',
    color: '#3B82F6',
    isActive: true,
    role: 'empleado' as 'encargado' | 'empleado' | 'distrito',
    unavailableTimes: [] as UnavailableTime[],
    vacationDaysPerYear: 20,
    startDate: ''
  });

  const daysOfWeek = [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado',
    'Lunes a Viernes', 'Sábado y Domingo'
  ];

  // Función para obtener el nombre del día
  const getDayName = (dayOfWeek: number): string => {
    const dayNames = [
      t('sunday'), t('monday'), t('tuesday'), t('wednesday'), 
      t('thursday'), t('friday'), t('saturday')
    ];
    return dayNames[dayOfWeek] || t('invalidDay');
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
      birthday: employee.birthday ? formatDate(new Date(employee.birthday)) : '',
      color: employee.color,
      isActive: employee.isActive,
      role: employee.role,
      unavailableTimes: employee.unavailableTimes,
      vacationDaysPerYear: employee.vacationDaysPerYear || 20,
      startDate: formatStartDate(employee.startDate || '')
    });
    setShowAddForm(true);
  };

  const handleTransfer = (employee: Employee) => {
    setEmployeeToTransfer(employee);
    setSelectedStoreId('');
    setTransferType('permanent');
    setTransferStartDate(new Date().toISOString().split('T')[0]);
    setReturnDate('');
    setShowTransferModal(true);
  };

  const confirmTransfer = () => {
    if (employeeToTransfer && selectedStoreId && transferStartDate) {
      const today = format(new Date(), 'yyyy-MM-dd');

      // Validación de fechas
      if (transferStartDate < today) {
        alert('La fecha de inicio no puede ser en el pasado.');
        return;
      }

      if (transferType === 'temporary' && returnDate) {
        if (returnDate < transferStartDate) {
          alert('La fecha de retorno no puede ser anterior a la fecha de inicio.');
          return;
        }
      }

      const now = new Date().toISOString();
      const transferId = `transfer_${Date.now()}`;
      
      // Crear registro de traspaso
      const transfer: EmployeeTransfer = {
        id: transferId,
        employeeId: employeeToTransfer.id,
        fromStoreId: employeeToTransfer.storeId || currentStore?.id || '',
        toStoreId: selectedStoreId,
        transferDate: transferStartDate,
        returnDate: transferType === 'temporary' ? returnDate : undefined,
        isTemporary: transferType === 'temporary',
        status: 'active',
        createdAt: now,
        updatedAt: now
      };

      // Actualizar empleado
      const updatedEmployee = { 
        ...employeeToTransfer, 
        storeId: selectedStoreId,
        transferHistory: [...(employeeToTransfer.transferHistory || []), transfer],
        currentTransfer: transferType === 'temporary' ? transfer : undefined
      };
      
      updateEmployee(employeeToTransfer.id, updatedEmployee);
      
      // Limpiar modal
      setShowTransferModal(false);
      setEmployeeToTransfer(null);
      setSelectedStoreId('');
      setTransferType('permanent');
      setTransferStartDate('');
      setReturnDate('');
    }
  };

  const handleDelete = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setTerminationDate(new Date().toISOString().split('T')[0]);
    setShowDeleteModal(true);
    setShowDeleteConfirmation(false);
  };

  const confirmDelete = () => {
    if (employeeToDelete && terminationDate) {
      const today = format(new Date(), 'yyyy-MM-dd');

      // Validación de fecha de baja
      if (terminationDate < today) {
        alert('La fecha de baja no puede ser en el pasado.');
        return;
      }

      if (!showDeleteConfirmation) {
        setShowDeleteConfirmation(true);
        return;
      }

      // Actualizar empleado con fecha de baja
      const updatedEmployee = { 
        ...employeeToDelete, 
        isActive: false,
        terminationDate: terminationDate
      };
      
      updateEmployee(employeeToDelete.id, updatedEmployee);
      
      // Limpiar modal
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
      setTerminationDate('');
      setShowDeleteConfirmation(false);
    }
  };

  // Función para validar username (solo letras, números y puntos)
  const validateUsername = (username: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9.]+$/;
    return usernameRegex.test(username);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar username
    if (!validateUsername(formData.username)) {
      alert('El nombre de usuario solo puede contener letras, números y puntos (sin tildes ni caracteres especiales)');
      return;
    }
    
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
      unavailableTimes: [],
      vacationDaysPerYear: 20,
      startDate: ''
    });
    setEditingEmployee(null);
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('employees')}</h2>
          <p className="text-gray-600 dark:text-gray-400">{t('manageEmployeeInfo')}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            {t('addEmployee')}
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {editingEmployee ? t('editEmployee') : t('newEmployee')}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('employeeName')}
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
                  {t('username')}
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className={`input-field ${formData.username && !validateUsername(formData.username) ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Ej: ana.perez"
                  pattern="[a-zA-Z0-9.]+"
                  title="Solo letras, números y puntos (sin tildes ni caracteres especiales)"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('uniqueUsernameForLogin')}
                </p>
                {formData.username && !validateUsername(formData.username) && (
                  <p className="text-xs text-red-500 mt-1">
                    Solo se permiten letras, números y puntos (sin tildes ni caracteres especiales)
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('password')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="input-field pr-10"
                    placeholder="Mínimo 4 caracteres"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t('passwordForLogin')}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('role')}
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'encargado' | 'empleado' }))}
                  className="input-field"
                  required
                >
                  <option value="empleado">{t('regularEmployee')}</option>
                  <option value="encargado">{t('mainManager')}</option>
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
                  {t('weeklyLimit')}
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
                  {t('birthday')}
                </label>
                <input
                  type="text"
                  value={formData.birthday}
                  onChange={(e) => setFormData(prev => ({ ...prev, birthday: formatDateInput(e.target.value) }))}
                  className="input-field"
                  placeholder={getDatePlaceholder()}
                  pattern={getDatePattern()}
                  title={`Formato: ${getDatePlaceholder()} (ejemplo: ${getDateExample()})`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formato: {getDatePlaceholder()} (ejemplo: {getDateExample()}) - Opcional
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('employeeStartDate')}
                </label>
                <input
                  type="text"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: formatDateInput(e.target.value) }))}
                  className="input-field"
                  placeholder={getDatePlaceholder()}
                  pattern={getDatePattern()}
                  title={`Formato: ${getDatePlaceholder()} (ejemplo: ${getDateExample()})`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formato: {getDatePlaceholder()} (ejemplo: {getDateExample()}) - Opcional
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('vacationDays')}
                </label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={formData.vacationDaysPerYear}
                  onChange={(e) => setFormData(prev => ({ ...prev, vacationDaysPerYear: parseInt(e.target.value) || 0 }))}
                  className="input-field"
                  placeholder="20"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Número de días de vacaciones por año - Opcional
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('color')}
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
                  {t('unavailableTimes')}
                </label>
                <button
                  type="button"
                  onClick={addUnavailableTime}
                  className="btn-secondary text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {t('add')}
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.unavailableTimes.map((unavailable) => (
                  <div key={unavailable.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                      {/* Día de la semana */}
                      <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
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
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
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
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
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
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                {editingEmployee ? t('update') : t('create')} {t('employee')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Employees List */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('employeeList')}</h3>
        
        {employees.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay empleados registrados</p>
          </div>
        ) : (
          <div className={`grid gap-4 ${isCompactMode ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
            {employees.map((employee) => (
              <div key={employee.id} className={`bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-sm transition-shadow ${isCompactMode ? 'p-3' : 'p-4'} ${!employee.isActive ? 'opacity-60 bg-gray-50 dark:bg-gray-800' : ''}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: employee.color }}
                    ></div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{employee.name}</h4>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${employee.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {employee.isActive ? t('active') : t('inactive')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(employee)}
                      className="text-primary-600 hover:text-primary-800"
                      title={t('edit')}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        const updatedEmployee = { ...employee, isActive: !employee.isActive };
                        updateEmployee(employee.id, updatedEmployee);
                      }}
                      className={`${employee.isActive ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'}`}
                      title={employee.isActive ? 'Desactivar empleado' : 'Activar empleado'}
                    >
                      {employee.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleTransfer(employee)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Traspasar a otra tienda"
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(employee)}
                      className="text-red-600 hover:text-red-800"
                      title={t('delete')}
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
                    <span>{employee.birthday ? formatDate(new Date(employee.birthday)) : 'No especificada'}</span>
                  </div>
                  <div className="flex items-center justify-end">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      employee.role === 'encargado' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {employee.role === 'encargado' ? t('manager') : t('employee')}
                    </span>
                  </div>
                  {employee.unavailableTimes.length > 0 && (
                    <div className="text-xs text-gray-500">
                      <div className="font-medium mb-1">{t('scheduleRestrictions')}:</div>
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

      {/* Modal de Traspaso */}
      {showTransferModal && employeeToTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Traspasar Empleado
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              ¿A qué tienda deseas traspasar a <strong>{employeeToTransfer.name}</strong>?
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Seleccionar Tienda
              </label>
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Seleccionar tienda...</option>
                {stores
                  .filter(store => store.id !== currentStore?.id)
                  .map(store => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Traspaso
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="permanent"
                    checked={transferType === 'permanent'}
                    onChange={(e) => setTransferType(e.target.value as 'permanent' | 'temporary')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Permanente</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="temporary"
                    checked={transferType === 'temporary'}
                    onChange={(e) => setTransferType(e.target.value as 'permanent' | 'temporary')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Temporal</span>
                </label>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de Inicio
              </label>
              <input
                type="text"
                value={getDisplayDate(transferStartDate)}
                onChange={(e) => setTransferStartDate(getInternalDate(e.target.value))}
                placeholder={getDatePlaceholder()}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {transferType === 'temporary' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Retorno
                </label>
                <input
                  type="text"
                  value={getDisplayDate(returnDate)}
                  onChange={(e) => setReturnDate(getInternalDate(e.target.value))}
                  placeholder={getDatePlaceholder()}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setEmployeeToTransfer(null);
                  setSelectedStoreId('');
                  setTransferType('permanent');
                  setTransferStartDate('');
                  setReturnDate('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmTransfer}
                disabled={!selectedStoreId || !transferStartDate || (transferType === 'temporary' && !returnDate)}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Traspasar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Eliminación */}
      {showDeleteModal && employeeToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Eliminar Empleado
            </h3>
            
            {!showDeleteConfirmation ? (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  ¿Estás seguro de que deseas eliminar a <strong>{employeeToDelete.name}</strong>?
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha de Baja
                  </label>
                  <input
                    type="text"
                    value={getDisplayDate(terminationDate)}
                    onChange={(e) => setTerminationDate(getInternalDate(e.target.value))}
                    placeholder={getDatePlaceholder()}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  El empleado estará disponible hasta la fecha de baja especificada.
                </p>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setEmployeeToDelete(null);
                      setTerminationDate('');
                      setShowDeleteConfirmation(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={!terminationDate}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    Continuar
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-2">
                    ⚠️ Confirmación Final
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Esta acción marcará a <strong>{employeeToDelete.name}</strong> como inactivo a partir del <strong>{getDisplayDate(terminationDate)}</strong>.
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirmation(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                  >
                    Volver
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                  >
                    Confirmar Eliminación
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


