import React, { useState, useEffect } from 'react';
import { useSchedule } from '../contexts/ScheduleContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useCompactMode } from '../contexts/CompactModeContext';
import { Settings, Clock, Calendar, Plus, Trash2, Edit, X } from 'lucide-react';
import { StoreSchedule, StoreException, TimeRange } from '../types';
import TimeInput from './TimeInput';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function StoreSettings() {
  const { t } = useLanguage();
  const { 
    storeSchedule, 
    storeExceptions, 
    addStoreSchedule, 
    updateStoreSchedule,
    addStoreException,
    updateStoreException,
    deleteStoreException
  } = useSchedule();
  const { isCompactMode, isMobile } = useCompactMode();

  // Horario de tienda por defecto (Lunes a Domingo + Feriados)
  const defaultStoreSchedule = [
    { dayOfWeek: 1, isOpen: true, timeRanges: [{ id: `range_1_${Date.now()}`, openTime: '09:00', closeTime: '20:00' }], openTime: '09:00', closeTime: '20:00' }, // Lunes
    { dayOfWeek: 2, isOpen: true, timeRanges: [{ id: `range_2_${Date.now()}`, openTime: '09:00', closeTime: '20:00' }], openTime: '09:00', closeTime: '20:00' }, // Martes
    { dayOfWeek: 3, isOpen: true, timeRanges: [{ id: `range_3_${Date.now()}`, openTime: '09:00', closeTime: '20:00' }], openTime: '09:00', closeTime: '20:00' }, // Miércoles
    { dayOfWeek: 4, isOpen: true, timeRanges: [{ id: `range_4_${Date.now()}`, openTime: '09:00', closeTime: '20:00' }], openTime: '09:00', closeTime: '20:00' }, // Jueves
    { dayOfWeek: 5, isOpen: true, timeRanges: [{ id: `range_5_${Date.now()}`, openTime: '09:00', closeTime: '20:00' }], openTime: '09:00', closeTime: '20:00' }, // Viernes
    { dayOfWeek: 6, isOpen: true, timeRanges: [{ id: `range_6_${Date.now()}`, openTime: '09:00', closeTime: '20:00' }], openTime: '09:00', closeTime: '20:00' }, // Sábado
    { dayOfWeek: 0, isOpen: false, timeRanges: [] }, // Domingo cerrado
    { dayOfWeek: 7, isOpen: false, timeRanges: [] }, // Feriados cerrado por defecto
  ];

  // Función para inicializar horarios por defecto si no existen
  const initializeDefaultSchedules = async () => {
    if (storeSchedule.length === 0) {
      console.log('StoreSettings: Inicializando horarios por defecto...');
      for (const schedule of defaultStoreSchedule) {
        console.log('StoreSettings: Agregando horario para dayOfWeek:', schedule.dayOfWeek);
        await addStoreSchedule(schedule);
      }
    } else {
      console.log('StoreSettings: Horarios existentes:', storeSchedule.length);
      console.log('StoreSettings: Horarios:', storeSchedule.map(s => ({ id: s.id, dayOfWeek: s.dayOfWeek, isOpen: s.isOpen })));
    }
  };

  // Inicializar horarios por defecto cuando se carga el componente
  useEffect(() => {
    initializeDefaultSchedules();
  }, [storeSchedule.length]);

  const [showExceptionForm, setShowExceptionForm] = useState(false);
  const [editingException, setEditingException] = useState<StoreException | null>(null);
  const [exceptionForm, setExceptionForm] = useState({
    date: '',
    isOpen: false,
    openTime: '09:00',
    closeTime: '20:00',
    reason: ''
  });

  const daysOfWeek = [
    t('sunday'), t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday'), t('holidays')
  ];

  // Función para obtener el nombre del día, manejando el caso especial de "Feriados"
  const getDayName = (dayOfWeek: number) => {
    if (dayOfWeek === 7) return 'Feriados'; // Caso especial para feriados
    return daysOfWeek[dayOfWeek];
  };

  const handleScheduleChange = (id: string, updates: Partial<StoreSchedule>) => {
    console.log('StoreSettings: handleScheduleChange called with:', { id, updates });
    updateStoreSchedule(id, updates);
  };

  // Función para agregar un nuevo rango de tiempo
  const addTimeRange = (scheduleId: string) => {
    const schedule = storeSchedule.find(s => s.id === scheduleId);
    if (!schedule) return;

    const newTimeRange: TimeRange = {
      id: `range_${Date.now()}`,
      openTime: '09:00',
      closeTime: '17:00'
    };

    const updatedSchedule = {
      ...schedule,
      timeRanges: [...(schedule.timeRanges || []), newTimeRange]
    };

    updateStoreSchedule(scheduleId, updatedSchedule);
  };

  // Función para inicializar el primer rango cuando se marca como abierto
  const initializeFirstTimeRange = (scheduleId: string) => {
    const schedule = storeSchedule.find(s => s.id === scheduleId);
    if (!schedule) return;

    // Si no tiene timeRanges o está vacío, crear el primer rango
    if (!schedule.timeRanges || schedule.timeRanges.length === 0) {
      const firstTimeRange: TimeRange = {
        id: `range_${scheduleId}_${Date.now()}`,
        openTime: '09:00',
        closeTime: '20:00'
      };

      const updatedSchedule = {
        ...schedule,
        timeRanges: [firstTimeRange]
      };

      updateStoreSchedule(scheduleId, updatedSchedule);
    }
  };

  // Función para eliminar un rango de tiempo
  const removeTimeRange = (scheduleId: string, rangeId: string) => {
    const schedule = storeSchedule.find(s => s.id === scheduleId);
    if (!schedule) return;

    const updatedSchedule = {
      ...schedule,
      timeRanges: schedule.timeRanges?.filter(range => range.id !== rangeId) || []
    };

    updateStoreSchedule(scheduleId, updatedSchedule);
  };

  // Función para actualizar un rango de tiempo
  const updateTimeRange = (scheduleId: string, rangeId: string, updates: Partial<TimeRange>) => {
    const schedule = storeSchedule.find(s => s.id === scheduleId);
    if (!schedule) return;

    const updatedSchedule = {
      ...schedule,
      timeRanges: schedule.timeRanges?.map(range => 
        range.id === rangeId ? { ...range, ...updates } : range
      ) || []
    };

    updateStoreSchedule(scheduleId, updatedSchedule);
  };

  const handleAddException = () => {
    setEditingException(null);
    setExceptionForm({
      date: '',
      isOpen: false,
      openTime: '09:00',
      closeTime: '20:00',
      reason: ''
    });
    setShowExceptionForm(true);
  };

  const handleEditException = (exception: StoreException) => {
    setEditingException(exception);
    setExceptionForm({
      date: exception.date,
      isOpen: exception.isOpen,
      openTime: exception.openTime || '09:00',
      closeTime: exception.closeTime || '20:00',
      reason: exception.reason || ''
    });
    setShowExceptionForm(true);
  };

  const handleDeleteException = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta excepción de horario?')) {
      try {
        await deleteStoreException(id);
      } catch (error) {
        console.error('Error deleting store exception:', error);
      }
    }
  };

  const handleExceptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingException) {
        await updateStoreException(editingException.id, exceptionForm);
      } else {
        await addStoreException(exceptionForm);
      }
      setShowExceptionForm(false);
      setEditingException(null);
    } catch (error) {
      console.error('Error saving store exception:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('storeSettings')}</h2>
        <p className="text-gray-600 dark:text-gray-400">{t('defineOpeningHoursAndExceptions')}</p>
      </div>

      {/* Store Schedule */}
      <div className="card">
        <div className="flex items-center mb-4">
          <Clock className="w-6 h-6 text-primary-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('weeklySchedule')}</h3>
        </div>

        <div className="space-y-4">
          {storeSchedule.map((schedule) => (
            <div key={schedule.id} className={`p-4 bg-gray-50 dark:bg-gray-700 rounded-lg ${isMobile ? 'space-y-3' : 'flex items-center space-x-4'}`}>
              {/* Día y checkbox */}
              <div className={`${isMobile ? 'flex items-center justify-between' : 'w-24'}`}>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {getDayName(schedule.dayOfWeek)}
                </span>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={schedule.isOpen}
                    onChange={(e) => {
                      handleScheduleChange(schedule.id, { isOpen: e.target.checked });
                      if (e.target.checked) {
                        initializeFirstTimeRange(schedule.id);
                      }
                    }}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {schedule.isOpen ? t('open') : t('closed')}
                  </span>
                </label>
              </div>

              {/* Horarios */}
              {schedule.isOpen && (
                <div className="flex-1">
                  <div className={`${isMobile ? 'space-y-3' : 'flex items-center space-x-4'}`}>
                    {/* Rangos de horarios existentes */}
                    {(schedule.timeRanges || []).map((timeRange, index) => (
                      <div key={timeRange.id} className={`${isMobile ? 'space-y-2' : 'flex items-center space-x-3'}`}>
                        {isMobile ? (
                          // Layout móvil: vertical
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {index === 0 ? t('opens') + ':' : `${t('range')} ${index + 1} - ${t('opens')}:`}
                              </label>
                              <TimeInput
                                value={timeRange.openTime}
                                onChange={(value) => updateTimeRange(schedule.id, timeRange.id, { openTime: value })}
                                className="input-field text-sm w-20"
                                placeholder="HH:MM"
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {index === 0 ? t('closes') + ':' : `${t('range')} ${index + 1} - ${t('closes')}:`}
                              </label>
                              <div className="flex items-center space-x-2">
                                <TimeInput
                                  value={timeRange.closeTime}
                                  onChange={(value) => updateTimeRange(schedule.id, timeRange.id, { closeTime: value })}
                                  className="input-field text-sm w-20"
                                  placeholder="HH:MM"
                                />
                                {(schedule.timeRanges || []).length > 1 && (
                                  <button
                                    onClick={() => removeTimeRange(schedule.id, timeRange.id)}
                                    className="p-1 text-red-600 hover:text-red-800 transition-colors"
                                    title="Eliminar rango"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Layout desktop: horizontal
                          <>
                            <div>
                              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                {index === 0 ? t('opens') : `${t('range')} ${index + 1} - ${t('opens')}`}
                              </label>
                              <TimeInput
                                value={timeRange.openTime}
                                onChange={(value) => updateTimeRange(schedule.id, timeRange.id, { openTime: value })}
                                className="input-field text-sm"
                                placeholder="HH:MM"
                              />
                            </div>
                            <span className="text-gray-500 dark:text-gray-400">-</span>
                            <div>
                              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                {index === 0 ? t('closes') : `${t('range')} ${index + 1} - ${t('closes')}`}
                              </label>
                              <TimeInput
                                value={timeRange.closeTime}
                                onChange={(value) => updateTimeRange(schedule.id, timeRange.id, { closeTime: value })}
                                className="input-field text-sm"
                                placeholder="HH:MM"
                              />
                            </div>
                            {(schedule.timeRanges || []).length > 1 && (
                              <button
                                onClick={() => removeTimeRange(schedule.id, timeRange.id)}
                                className="p-1 text-red-600 hover:text-red-800 transition-colors"
                                title="Eliminar rango"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                    
                    {/* Botón para agregar nuevo rango - solo si hay al menos un rango */}
                    {(schedule.timeRanges || []).length > 0 && (
                      <button
                        onClick={() => addTimeRange(schedule.id)}
                        className={`${isMobile ? 'w-full' : 'flex-shrink-0'} flex items-center px-3 py-2 text-sm text-primary-600 hover:text-primary-800 transition-colors border border-primary-300 rounded-lg hover:bg-primary-50 dark:border-primary-600 dark:hover:bg-primary-900/20`}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {isMobile ? t('addAnotherRange') : t('addRange')}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Store Exceptions */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Calendar className="w-6 h-6 text-primary-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('scheduleExceptions')}</h3>
          </div>
          <button
            onClick={handleAddException}
            className="btn-primary flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            {t('addException')}
          </button>
        </div>

        {/* Exception Form */}
        {showExceptionForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-4">Nueva Excepción</h4>
            <form onSubmit={handleExceptionSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('date')}
                  </label>
                  <input
                    type="date"
                    value={exceptionForm.date}
                    onChange={(e) => setExceptionForm(prev => ({ ...prev, date: e.target.value }))}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('reasonOptional')}
                  </label>
                  <input
                    type="text"
                    value={exceptionForm.reason}
                    onChange={(e) => setExceptionForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="input-field"
                    placeholder="ej: Feriado, Mantenimiento"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exceptionForm.isOpen}
                    onChange={(e) => setExceptionForm(prev => ({ ...prev, isOpen: e.target.checked }))}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Tienda abierta</span>
                </label>
              </div>

              {exceptionForm.isOpen && (
                <div className="flex items-center space-x-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('openingHours')}
                    </label>
                    <div className="flex items-center space-x-2">
                      <TimeInput
                        value={exceptionForm.openTime}
                        onChange={(value) => setExceptionForm(prev => ({ ...prev, openTime: value }))}
                        className="input-field"
                        placeholder="HH:MM"
                      />
                      <span className="text-gray-500">-</span>
                      <TimeInput
                        value={exceptionForm.closeTime}
                        onChange={(value) => setExceptionForm(prev => ({ ...prev, closeTime: value }))}
                        className="input-field"
                        placeholder="HH:MM"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowExceptionForm(false)}
                  className="btn-secondary"
                >
                  {t('cancel')}
                </button>
                <button type="submit" className="btn-primary">
                  {t('addException')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Exceptions List */}
        {storeExceptions.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">{t('noExceptionsConfigured')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {storeExceptions.map((exception) => (
              <div key={exception.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div>
                    <span className="font-medium text-gray-900">
                      {new Date(exception.date).toLocaleDateString()}
                    </span>
                    {exception.reason && (
                      <span className="text-sm text-gray-600 ml-2">
                        ({exception.reason})
                      </span>
                    )}
                  </div>
                  <div className="text-sm">
                    {exception.isOpen ? (
                      <span className="text-green-600">
                        Abierto {exception.openTime} - {exception.closeTime}
                      </span>
                    ) : (
                      <span className="text-red-600">Cerrado</span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditException(exception)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteException(exception.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Exception Add/Edit Modal */}
      {showExceptionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-200 dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {editingException ? t('editScheduleException') : t('addScheduleException')}
              </h3>
              <button
                onClick={() => setShowExceptionForm(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExceptionSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="exceptionDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('date')}
                  </label>
                  <input
                    type="date"
                    id="exceptionDate"
                    value={exceptionForm.date}
                    onChange={(e) => setExceptionForm(prev => ({ ...prev, date: e.target.value }))}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-primary-600 dark:text-primary-400 rounded"
                      checked={exceptionForm.isOpen}
                      onChange={(e) => setExceptionForm(prev => ({ ...prev, isOpen: e.target.checked }))}
                    />
                    <span className="ml-2 text-gray-700 dark:text-gray-300">Abierto</span>
                  </label>
                </div>
                {exceptionForm.isOpen && (
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <label htmlFor="exceptionOpenTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('opens')}
                      </label>
                      <TimeInput
                        value={exceptionForm.openTime}
                        onChange={(time) => setExceptionForm(prev => ({ ...prev, openTime: time }))}
                      />
                    </div>
                    <div className="flex-1">
                      <label htmlFor="exceptionCloseTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('closes')}
                      </label>
                      <TimeInput
                        value={exceptionForm.closeTime}
                        onChange={(time) => setExceptionForm(prev => ({ ...prev, closeTime: time }))}
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label htmlFor="exceptionReason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('reason')}
                  </label>
                  <textarea
                    id="exceptionReason"
                    value={exceptionForm.reason}
                    onChange={(e) => setExceptionForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="input-field"
                    rows={3}
                    placeholder="Ej: Feriado nacional, evento especial, etc."
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowExceptionForm(false)}
                  className="btn-secondary"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editingException ? t('updateException') : t('addException')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


