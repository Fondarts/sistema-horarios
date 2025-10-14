import React, { useState } from 'react';
import { useSchedule } from '../contexts/ScheduleContext';
import { Settings, Clock, Calendar, Plus, Trash2, Edit, X } from 'lucide-react';
import { StoreSchedule, StoreException } from '../types';
import TimeInput from './TimeInput';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function StoreSettings() {
  const { 
    storeSchedule, 
    storeExceptions, 
    addStoreSchedule, 
    updateStoreSchedule,
    addStoreException,
    updateStoreException,
    deleteStoreException
  } = useSchedule();

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
    'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo', 'Feriados'
  ];

  // Función para obtener el nombre del día, manejando el caso especial de "Feriados"
  const getDayName = (dayOfWeek: number) => {
    if (dayOfWeek === 7) return 'Feriados'; // Caso especial para feriados
    return daysOfWeek[dayOfWeek];
  };

  const handleScheduleChange = (id: string, updates: Partial<StoreSchedule>) => {
    updateStoreSchedule(id, updates);
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Configuración de Tienda</h2>
        <p className="text-gray-600 dark:text-gray-400">Define el horario de apertura y excepciones</p>
      </div>

      {/* Store Schedule */}
      <div className="card">
        <div className="flex items-center mb-4">
          <Clock className="w-6 h-6 text-primary-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Horario Semanal</h3>
        </div>

        <div className="space-y-4">
          {storeSchedule.map((schedule) => (
            <div key={schedule.id} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="w-24">
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {getDayName(schedule.dayOfWeek)}
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={schedule.isOpen}
                    onChange={(e) => handleScheduleChange(schedule.id, { isOpen: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {schedule.isOpen ? 'Abierto' : 'Cerrado'}
                  </span>
                </label>
              </div>

              {schedule.isOpen && (
                <div className="flex items-center space-x-3">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Abre</label>
                    <TimeInput
                      value={schedule.openTime || '09:00'}
                      onChange={(value) => handleScheduleChange(schedule.id, { openTime: value })}
                      className="input-field text-sm"
                      placeholder="HH:MM"
                    />
                  </div>
                  <span className="text-gray-500 dark:text-gray-400">-</span>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Cierra</label>
                    <TimeInput
                      value={schedule.closeTime || '20:00'}
                      onChange={(value) => handleScheduleChange(schedule.id, { closeTime: value })}
                      className="input-field text-sm"
                      placeholder="HH:MM"
                    />
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Excepciones de Horario</h3>
          </div>
          <button
            onClick={handleAddException}
            className="btn-primary flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Agregar Excepción
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
                    Fecha
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
                    Motivo (opcional)
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
                      Horario de Apertura
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
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Agregar Excepción
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Exceptions List */}
        {storeExceptions.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay excepciones configuradas</p>
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
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {editingException ? 'Editar Excepción de Horario' : 'Agregar Excepción de Horario'}
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
                    Fecha
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
                        Abre
                      </label>
                      <TimeInput
                        value={exceptionForm.openTime}
                        onChange={(time) => setExceptionForm(prev => ({ ...prev, openTime: time }))}
                      />
                    </div>
                    <div className="flex-1">
                      <label htmlFor="exceptionCloseTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Cierra
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
                    Motivo
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
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editingException ? 'Actualizar Excepción' : 'Agregar Excepción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


