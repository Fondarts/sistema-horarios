import React, { useState } from 'react';
import { useSchedule } from '../contexts/ScheduleContext';
import { Download, Calendar, FileText, ExternalLink } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

export function ExportTools() {
  const { shifts } = useSchedule();
  const [selectedFormat, setSelectedFormat] = useState<'ical' | 'csv' | 'google'>('ical');
  const [dateRange, setDateRange] = useState({
    start: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    end: format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  });

  const publishedShifts = shifts.filter(shift => shift.isPublished);

  const exportToCSV = () => {
    const csvContent = [
      ['Empleado', 'Fecha', 'Desde', 'Hasta', 'Horas'],
      ...publishedShifts.map(shift => [
        shift.employeeId, // En una app real, obtendrías el nombre del empleado
        shift.date,
        shift.startTime,
        shift.endTime,
        shift.hours.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `horarios_${dateRange.start}_${dateRange.end}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToICal = () => {
    const icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Horarios App//ES',
      'CALSCALE:GREGORIAN',
      ...publishedShifts.map(shift => [
        'BEGIN:VEVENT',
        `UID:${shift.id}@horarios-app.com`,
        `DTSTART:${shift.date.replace(/-/g, '')}T${shift.startTime.replace(':', '')}00`,
        `DTEND:${shift.date.replace(/-/g, '')}T${shift.endTime.replace(':', '')}00`,
        `SUMMARY:Turno de trabajo`,
        `DESCRIPTION:Turno asignado`,
        'END:VEVENT'
      ]).flat(),
      'END:VCALENDAR'
    ].join('\n');

    const blob = new Blob([icalContent], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `horarios_${dateRange.start}_${dateRange.end}.ics`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToGoogleCalendar = () => {
    // En una implementación real, esto integraría con la API de Google Calendar
    alert('Funcionalidad de Google Calendar en desarrollo. Por ahora, usa la exportación iCal.');
  };

  const handleExport = () => {
    switch (selectedFormat) {
      case 'csv':
        exportToCSV();
        break;
      case 'ical':
        exportToICal();
        break;
      case 'google':
        exportToGoogleCalendar();
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Exportar Horarios</h2>
        <p className="text-gray-600">Exporta los horarios publicados en diferentes formatos</p>
      </div>

      {/* Export Options */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Opciones de Exportación</h3>

        {/* Format Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Formato de Exportación
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="relative">
              <input
                type="radio"
                name="format"
                value="ical"
                checked={selectedFormat === 'ical'}
                onChange={(e) => setSelectedFormat(e.target.value as 'ical')}
                className="sr-only"
              />
              <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                selectedFormat === 'ical' 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <Calendar className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                <div className="text-center">
                  <div className="font-medium text-gray-900">iCal</div>
                  <div className="text-sm text-gray-600">Archivo .ics</div>
                </div>
              </div>
            </label>

            <label className="relative">
              <input
                type="radio"
                name="format"
                value="csv"
                checked={selectedFormat === 'csv'}
                onChange={(e) => setSelectedFormat(e.target.value as 'csv')}
                className="sr-only"
              />
              <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                selectedFormat === 'csv' 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <FileText className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-center">
                  <div className="font-medium text-gray-900">CSV</div>
                  <div className="text-sm text-gray-600">Hoja de cálculo</div>
                </div>
              </div>
            </label>

            <label className="relative">
              <input
                type="radio"
                name="format"
                value="google"
                checked={selectedFormat === 'google'}
                onChange={(e) => setSelectedFormat(e.target.value as 'google')}
                className="sr-only"
              />
              <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                selectedFormat === 'google' 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <ExternalLink className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-center">
                  <div className="font-medium text-gray-900">Google Calendar</div>
                  <div className="text-sm text-gray-600">Sincronización directa</div>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Date Range */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Rango de Fechas
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Desde</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Hasta</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Export Button */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {publishedShifts.length} turnos publicados disponibles para exportar
          </div>
          <button
            onClick={handleExport}
            disabled={publishedShifts.length === 0}
            className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5 mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Export History */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial de Exportaciones</h3>
        <div className="text-center py-8">
          <Download className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No hay exportaciones recientes</p>
          <p className="text-sm text-gray-500 mt-2">
            Las exportaciones realizadas aparecerán aquí
          </p>
        </div>
      </div>
    </div>
  );
}


