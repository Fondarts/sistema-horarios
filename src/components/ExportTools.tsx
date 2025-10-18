import React, { useState } from 'react';
import { useSchedule } from '../contexts/ScheduleContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useDateFormat } from '../contexts/DateFormatContext';
import { useEmployees } from '../contexts/EmployeeContext';
import { Download, Calendar, FileText, Table } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import ExcelJS from 'exceljs';

export function ExportTools() {
  const { shifts } = useSchedule();
  const { employees } = useEmployees();
  const { t } = useLanguage();
  const { formatDate, dateFormat } = useDateFormat();
  
  // Función para obtener el formato de fecha actual
  const getDateFormatText = () => {
    switch (dateFormat) {
      case 'mm/dd/yyyy':
        return 'MM/DD/YYYY';
      case 'yyyy/mm/dd':
        return 'YYYY/MM/DD';
      case 'dd/mm/yyyy':
      default:
        return 'DD/MM/YYYY';
    }
  };

  const [selectedFormat, setSelectedFormat] = useState<'ical' | 'csv' | 'excel'>('ical');
  const [dateRange, setDateRange] = useState({
    start: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    end: format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  });

  const publishedShifts = shifts.filter(shift => shift.isPublished);

  const exportToCSV = () => {
    const csvContent = [
      ['Empleado', 'Fecha', 'Hora Inicio', 'Hora Fin', 'Horas'],
      ...publishedShifts.map(shift => {
        const employee = employees.find(emp => emp.id === shift.employeeId);
        return [
          employee?.name || 'Desconocido',
          shift.date,
          shift.startTime,
          shift.endTime,
          shift.hours
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `horarios_${dateRange.start}_${dateRange.end}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToICal = () => {
    const icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Horarios App//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      ...publishedShifts.map(shift => {
        const employee = employees.find(emp => emp.id === shift.employeeId);
        const startDateTime = `${shift.date.replace(/-/g, '')}T${shift.startTime.replace(':', '')}00`;
        const endDateTime = `${shift.date.replace(/-/g, '')}T${shift.endTime.replace(':', '')}00`;
        
        return [
          'BEGIN:VEVENT',
          `UID:${shift.id}@horarios-app.com`,
          `DTSTART:${startDateTime}`,
          `DTEND:${endDateTime}`,
          `SUMMARY:${employee?.name || 'Desconocido'}`,
          `DESCRIPTION:Turno de ${shift.startTime} a ${shift.endTime}`,
          'END:VEVENT'
        ].join('\r\n');
      }),
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8;' });
    const a = document.createElement('a');
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = `horarios_${dateRange.start}_${dateRange.end}.ics`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Función para convertir horas decimales a formato HH:MM
  const formatHoursToHHMM = (decimalHours: number): string => {
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  const exportToExcel = async () => {
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Crear un solo workbook con una sola hoja
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Horarios Semana');
    
    // Crear headers para todos los días
    const headerRow1 = ['TARGET'];
    const headerRow2 = [''];
    const headerRow3 = [''];
    
    days.forEach(day => {
      const dayNumber = day.getDate();
      const dayName = format(day, 'EEEE', { locale: es });
      
      // Para cada día: número del día (unificado en 5 columnas) + celda vacía
      headerRow1.push(dayNumber.toString(), '', '', '', '', '');
      headerRow2.push(dayName.toUpperCase(), '', '', '', '', '');
      headerRow3.push('', '', '', '', '', 'HOURS');
    });
    
    // Agregar filas de headers
    const row1 = worksheet.addRow(headerRow1);
    const row2 = worksheet.addRow(headerRow2);
    const row3 = worksheet.addRow(headerRow3);
    
    // Configurar celdas unificadas solo para números de días (fila 1)
    days.forEach((day, dayIndex) => {
      const startCol = 2 + (dayIndex * 6); // Columna B del día actual
      const endCol = startCol + 4; // Columna F del día actual
      
      // Solo unificar celdas para el número del día (fila 1)
      worksheet.mergeCells(1, startCol, 1, endCol); // Fila 1: número del día
    });
    
    // Filas de empleados
    employees.forEach(employee => {
      const employeeRow = [employee.name]; // Columna A: nombre del empleado
      
      // Para cada día, agregar los datos del empleado
      days.forEach(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayShifts = publishedShifts.filter(shift => 
          shift.date === dayStr && shift.employeeId === employee.id
        );
        
        // Llenar horarios para hasta 2 turnos (4 columnas)
        if (dayShifts.length > 0) {
          employeeRow.push(dayShifts[0].startTime, dayShifts[0].endTime);
        } else {
          employeeRow.push('', '');
        }
        
        if (dayShifts.length > 1) {
          employeeRow.push(dayShifts[1].startTime, dayShifts[1].endTime);
        } else {
          employeeRow.push('', '');
        }
        
        // Calcular total de horas del empleado en este día
        const totalDayHours = dayShifts.reduce((sum, shift) => sum + shift.hours, 0);
        employeeRow.push(totalDayHours > 0 ? formatHoursToHHMM(totalDayHours) : '0:00');
      });
      
      worksheet.addRow(employeeRow);
    });
    
    // Fila de totales
    const totalRow = ['TOTAL'];
    days.forEach(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayShifts = publishedShifts.filter(shift => shift.date === dayStr);
      const totalDayHours = dayShifts.reduce((sum, shift) => sum + shift.hours, 0);
      
      // Agregar celdas vacías para horarios + total en columna HOURS
      totalRow.push('', '', '', '', formatHoursToHHMM(totalDayHours));
    });
    const totalRowAdded = worksheet.addRow(totalRow);
    
    // Aplicar estilos
    // Colores para empleados
    const employeeColors = [
      '#FFFFFF', // Blanco
      '#E8E8E8', // Gris claro
      '#FFFFFF', // Blanco
      '#FFE4E1', // Rosa claro
      '#E0F0FF', // Azul claro
      '#FFFFFF'  // Blanco
    ];
    
    // Aplicar colores a las filas de empleados (empezando desde la fila 4)
    for (let i = 0; i < employees.length; i++) {
      const row = worksheet.getRow(4 + i);
      const color = employeeColors[i % employeeColors.length];
      
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: color.replace('#', 'FF') }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF808080' } },
          bottom: { style: 'thin', color: { argb: 'FF808080' } },
          left: { style: 'thin', color: { argb: 'FF808080' } },
          right: { style: 'thin', color: { argb: 'FF808080' } }
        };
      });
    }
    
    // Estilos para fila 1 (TARGET + números de días + HOURS)
    row1.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
      };
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF808080' } },
        bottom: { style: 'thin', color: { argb: 'FF808080' } },
        left: { style: 'thin', color: { argb: 'FF808080' } },
        right: { style: 'thin', color: { argb: 'FF808080' } }
      };
    });
    
    // Estilos para fila 2 (días de la semana)
    row2.eachCell((cell, colNumber) => {
      if (colNumber > 1) { // Todas las columnas excepto TARGET
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFA9A9A9' }
        };
        cell.font = { bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF808080' } },
          bottom: { style: 'thin', color: { argb: 'FF808080' } },
          left: { style: 'thin', color: { argb: 'FF808080' } },
          right: { style: 'thin', color: { argb: 'FF808080' } }
        };
      }
    });
    
    // Estilos para fila 3 (unificada - mismo formato que fila 1)
    row3.eachCell((cell, colNumber) => {
      if (colNumber > 1) { // Todas las columnas excepto TARGET
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD3D3D3' }
        };
        cell.font = { bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF808080' } },
          bottom: { style: 'thin', color: { argb: 'FF808080' } },
          left: { style: 'thin', color: { argb: 'FF808080' } },
          right: { style: 'thin', color: { argb: 'FF808080' } }
        };
      }
    });
    
    // Estilos para fila de totales
    totalRowAdded.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF808080' } },
        bottom: { style: 'thin', color: { argb: 'FF808080' } },
        left: { style: 'thin', color: { argb: 'FF808080' } },
        right: { style: 'thin', color: { argb: 'FF808080' } }
      };
    });
    
    // Configurar ancho de columnas
    worksheet.getColumn(1).width = 20; // Columna A más ancha para nombres completos
    
    // Generar y descargar el archivo único con todas las hojas
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `horarios_semana_${format(startDate, 'dd-MM')}_${format(endDate, 'dd-MM')}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };


  const handleExport = async () => {
    switch (selectedFormat) {
      case 'csv':
        exportToCSV();
        break;
      case 'excel':
        await exportToExcel();
        break;
      case 'ical':
        exportToICal();
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('exportSchedules')}</h2>
        <p className="text-gray-600 dark:text-gray-400">{t('exportPublishedSchedulesInDifferentFormats')}</p>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:border dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('dateRange')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('startDate')}
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Formato: {getDateFormatText()}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('endDate')}
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Formato: {getDateFormatText()}
            </p>
          </div>
        </div>
      </div>

      {/* Format Selection */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:border dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('exportFormat')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex items-center space-x-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
            <input
              type="radio"
              name="format"
              value="excel"
              checked={selectedFormat === 'excel'}
              onChange={(e) => setSelectedFormat(e.target.value as any)}
              className="w-4 h-4 text-blue-600"
            />
            <Table className="w-6 h-6 text-green-600" />
            <span className="font-medium text-gray-900 dark:text-gray-100">{t('excel')}</span>
          </label>
          <label className="flex items-center space-x-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
            <input
              type="radio"
              name="format"
              value="csv"
              checked={selectedFormat === 'csv'}
              onChange={(e) => setSelectedFormat(e.target.value as any)}
              className="w-4 h-4 text-blue-600"
            />
            <FileText className="w-6 h-6 text-blue-600" />
            <span className="font-medium text-gray-900 dark:text-gray-100">{t('csv')}</span>
          </label>
          <label className="flex items-center space-x-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
            <input
              type="radio"
              name="format"
              value="ical"
              checked={selectedFormat === 'ical'}
              onChange={(e) => setSelectedFormat(e.target.value as any)}
              className="w-4 h-4 text-blue-600"
            />
            <Calendar className="w-6 h-6 text-purple-600" />
            <span className="font-medium text-gray-900 dark:text-gray-100">{t('ical')}</span>
          </label>
        </div>
      </div>

      {/* Export Button */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:border dark:border-gray-700">
        <button
          onClick={handleExport}
          disabled={publishedShifts.length === 0}
          className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="w-5 h-5" />
          <span>{t('exportSchedules')}</span>
        </button>
        {publishedShifts.length === 0 && (
          <p className="text-sm text-gray-500 mt-2 text-center">
            {t('noPublishedSchedulesToExport')}
          </p>
        )}
      </div>
    </div>
  );
}