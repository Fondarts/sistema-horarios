import React, { useState } from 'react';
import { useSchedule } from '../contexts/ScheduleContext';
import { Settings, Clock, Calendar, Plus, Trash2 } from 'lucide-react';
import { StoreSchedule, StoreException } from '../types';
import TimeInput from './TimeInput';

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
  const [exceptionForm, setExceptionForm] = useState({
    date: '',
    isOpen: false,
    openTime: '09:00',
    closeTime: '20:00',
    reason: ''
  });

  const daysOfWeek = [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
  ];

  const handleScheduleChange = (id: string, updates: Partial<StoreSchedule>) => {
    updateStoreSchedule(id, updates);
  };

  const handleExceptionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addStoreException(exceptionForm);
    setExceptionForm({
      date: '',
      isOpen: false,
      openTime: '09:00',
      closeTime: '20:00',
      reason: ''
    });
    setShowExceptionForm(false);
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
                  {daysOfWeek[schedule.dayOfWeek]}
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
            <h3 className="text-lg font-semibold text-gray-900">Excepciones</h3>
          </div>
          <button
            onClick={() => setShowExceptionForm(true)}
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
                <button
                  onClick={() => deleteStoreException(exception.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


