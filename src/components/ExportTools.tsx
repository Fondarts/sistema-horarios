import React, { useState } from 'react';
import { useSchedule } from '../contexts/ScheduleContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useDateFormat } from '../contexts/DateFormatContext';
import { useEmployees } from '../contexts/EmployeeContext';
import { useStore } from '../contexts/StoreContext';
import { Download, Calendar, FileText, Table } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import ExcelJS from 'exceljs';

export function ExportTools() {
  const { shifts } = useSchedule();
  const { employees } = useEmployees();
  const { currentStore } = useStore();
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
    
    // Dividir el rango en semanas completas (Lunes a Domingo)
    const weeks = [];
    let currentWeekStart = startOfWeek(startDate, { weekStartsOn: 1 }); // Lunes
    
    while (currentWeekStart <= endDate) {
      const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 }); // Domingo
      
      // Solo incluir la semana si tiene días dentro del rango seleccionado
      if (weekEnd >= startDate && currentWeekStart <= endDate) {
        const weekDays = eachDayOfInterval({ 
          start: new Date(Math.max(currentWeekStart.getTime(), startDate.getTime())), 
          end: new Date(Math.min(weekEnd.getTime(), endDate.getTime())) 
        });
        weeks.push(weekDays);
      }
      
      currentWeekStart = addDays(weekEnd, 1); // Siguiente lunes
    }
    
    // Crear un solo workbook con una sola hoja
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Horarios Semana');
    
    // Filas de empleados (orden personalizado si existe)
    const savedOrder = (currentStore?.settings as any)?.employeeOrder as string[] | undefined;
    const orderedEmployees = savedOrder && savedOrder.length > 0
      ? savedOrder.map(id => employees.find(e => e.id === id)).filter(Boolean) as typeof employees
      : employees;

    let currentRow = 1;
    
    // Procesar cada semana
    weeks.forEach((weekDays, weekIndex) => {
      // Crear headers para esta semana
      const headerRow1 = ['TARGET'];
      const headerRow2 = [''];
      const headerRow3 = [''];
      
      weekDays.forEach(day => {
        const dayNumber = day.getDate();
        const dayName = format(day, 'EEEE', { locale: es });
        
        // Para cada día: 5 columnas consecutivas (sin columna separadora)
        headerRow1.push(dayNumber.toString(), '', '', '', '');
        headerRow2.push(dayName.toUpperCase(), '', '', '', '');
        headerRow3.push('', '', '', '', 'HOURS');
      });
      
      // Agregar columnas de resumen semanal después del domingo
      headerRow1.push('', '', '');
      headerRow2.push('WORKED HOURS', 'CONTRACT HOURS', 'EXTRA HOURS THIS WEEK');
      headerRow3.push('', '', '');
      
      // Agregar filas de headers
      const row1 = worksheet.addRow(headerRow1);
      const row2 = worksheet.addRow(headerRow2);
      const row3 = worksheet.addRow(headerRow3);
      
      // Configurar celdas unificadas: números de días (fila 1) y nombres de días (fila 2)
      weekDays.forEach((day, dayIndex) => {
        const startCol = 2 + (dayIndex * 5); // Columna B del día actual
        const endCol = startCol + 4; // 5 columnas por día
        
        // Unificar celdas para el número del día (fila 1)
        worksheet.mergeCells(currentRow, startCol, currentRow, endCol);
        // Unificar celdas para el nombre del día (fila 2)
        worksheet.mergeCells(currentRow + 1, startCol, currentRow + 1, endCol);
      });
      
      currentRow += 3; // Avanzar 3 filas (headers)
      
      // Filas de empleados para esta semana
      orderedEmployees.forEach(employee => {
        const employeeRow = [employee.name]; // Columna A: nombre del empleado
        let totalWeeklyHours = 0;
        
        // Para cada día de esta semana, agregar los datos del empleado
        weekDays.forEach(day => {
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
          totalWeeklyHours += totalDayHours;
          employeeRow.push(totalDayHours > 0 ? formatHoursToHHMM(totalDayHours) : '0:00');
        });
        
        // Agregar columnas de resumen semanal
        const contractHours = employee.weeklyLimit || 40; // Horas por contrato (default 40)
        const extraHours = Math.max(0, totalWeeklyHours - contractHours);
        
        employeeRow.push(
          formatHoursToHHMM(totalWeeklyHours), // WORKED HOURS
          formatHoursToHHMM(contractHours),    // CONTRACT HOURS
          formatHoursToHHMM(extraHours)        // EXTRA HOURS THIS WEEK
        );
        
        worksheet.addRow(employeeRow);
        currentRow++;
      });
      
      // Fila de totales para esta semana
      const totalRow = ['TOTAL'];
      let totalWeeklyWorkedHours = 0;
      let totalContractHours = 0;
      
      weekDays.forEach(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayShifts = publishedShifts.filter(shift => shift.date === dayStr);
        const totalDayHours = dayShifts.reduce((sum, shift) => sum + shift.hours, 0);
        totalWeeklyWorkedHours += totalDayHours;
        
        // Agregar celdas vacías para horarios + total en columna HOURS
        totalRow.push('', '', '', '', formatHoursToHHMM(totalDayHours));
      });
      
      // Calcular totales de contrato para todos los empleados
      orderedEmployees.forEach(employee => {
        totalContractHours += employee.weeklyLimit || 40;
      });
      
      const totalExtraHours = Math.max(0, totalWeeklyWorkedHours - totalContractHours);
      
      // Agregar totales de resumen semanal
      totalRow.push(
        formatHoursToHHMM(totalWeeklyWorkedHours), // Total WORKED HOURS
        formatHoursToHHMM(totalContractHours),     // Total CONTRACT HOURS
        formatHoursToHHMM(totalExtraHours)         // Total EXTRA HOURS THIS WEEK
      );
      
      const totalRowAdded = worksheet.addRow(totalRow);
      currentRow++;
      
      // Agregar 2 filas en blanco entre semanas (excepto la última)
      if (weekIndex < weeks.length - 1) {
        worksheet.addRow([]);
        worksheet.addRow([]);
        currentRow += 2;
      }
    });
    
    // Aplicar estilos para múltiples semanas
    const employeeColors = [
      '#FFFFFF', // Blanco
      '#E8E8E8', // Gris claro
      '#FFFFFF', // Blanco
      '#FFE4E1', // Rosa claro
      '#E0F0FF', // Azul claro
      '#FFFFFF'  // Blanco
    ];
    
    // Configurar ancho de columnas
    worksheet.getColumn(1).width = 25; // Columna A más ancha para nombres completos
    
    // Aplicar estilos semana por semana
    let styleRow = 1;
    
    weeks.forEach((weekDays, weekIndex) => {
      const weeklySummaryStartCol = 2 + (weekDays.length * 5); // Primera columna de resumen semanal
      const lastCol = weeklySummaryStartCol + 2; // Última columna (EXTRA HOURS THIS WEEK)
      const weekEndRow = styleRow + 3 + employees.length; // Headers (3) + empleados + fila total
      
      // Configurar ancho de las columnas de resumen semanal
      worksheet.getColumn(weeklySummaryStartCol).width = 15;     // WORKED HOURS
      worksheet.getColumn(weeklySummaryStartCol + 1).width = 15; // CONTRACT HOURS  
      worksheet.getColumn(weeklySummaryStartCol + 2).width = 20; // EXTRA HOURS THIS WEEK
      
      // Aplicar colores a las filas de empleados
      for (let i = 0; i < employees.length; i++) {
        const row = worksheet.getRow(styleRow + 3 + i);
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
      
      // Estilos para headers (filas 1, 2, 3 de cada semana)
      for (let headerRow = 0; headerRow < 3; headerRow++) {
        const row = worksheet.getRow(styleRow + headerRow);
        row.eachCell((cell, colNumber) => {
          if (colNumber > 1) { // Todas las columnas excepto TARGET
            // Estilo especial para las columnas de resumen semanal
            const isWeeklySummary = colNumber > (1 + weekDays.length * 5);
            let fillColor = 'FFD3D3D3'; // Default gris claro
            
            if (headerRow === 1) { // Fila 2 (nombres de días)
              fillColor = isWeeklySummary ? 'FFB0E0E6' : 'FFA9A9A9';
            } else if (headerRow === 2) { // Fila 3 (HOURS)
              fillColor = isWeeklySummary ? 'FFE0F0FF' : 'FFD3D3D3';
            }
            
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: fillColor }
            };
          }
          
          cell.font = { bold: true };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF808080' } },
            bottom: { style: 'thin', color: { argb: 'FF808080' } },
            left: { style: 'thin', color: { argb: 'FF808080' } },
            right: { style: 'thin', color: { argb: 'FF808080' } }
          };
        });
      }
      
      // Estilos para fila de totales
      const totalRow = worksheet.getRow(weekEndRow);
      totalRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF808080' } },
          bottom: { style: 'thin', color: { argb: 'FF808080' } },
          left: { style: 'thin', color: { argb: 'FF808080' } },
          right: { style: 'thin', color: { argb: 'FF808080' } }
        };
      });
      
      // Aplicar bordes gruesos para esta semana
      // Borde grueso exterior (toda la semana)
      for (let row = styleRow; row <= weekEndRow; row++) {
        // Borde izquierdo (columna A)
        const leftCell = worksheet.getCell(row, 1);
        leftCell.border = {
          ...leftCell.border,
          left: { style: 'thick', color: { argb: 'FF000000' } }
        };
        
        // Borde derecho (última columna)
        const rightCell = worksheet.getCell(row, lastCol);
        rightCell.border = {
          ...rightCell.border,
          right: { style: 'thick', color: { argb: 'FF000000' } }
        };
      }
      
      // Borde superior e inferior
      for (let col = 1; col <= lastCol; col++) {
        // Borde superior (primera fila de la semana)
        const topCell = worksheet.getCell(styleRow, col);
        topCell.border = {
          ...topCell.border,
          top: { style: 'thick', color: { argb: 'FF000000' } }
        };
        
        // Borde inferior (fila total de la semana)
        const bottomCell = worksheet.getCell(weekEndRow, col);
        bottomCell.border = {
          ...bottomCell.border,
          bottom: { style: 'thick', color: { argb: 'FF000000' } }
        };
      }
      
      // Bordes gruesos para cada día (separadores verticales)
      weekDays.forEach((day, dayIndex) => {
        const dayStartCol = 2 + (dayIndex * 5); // Primera columna del día
        
        // Borde izquierdo del día (excepto el primer día)
        if (dayIndex > 0) {
          for (let row = styleRow; row <= weekEndRow; row++) {
            const cell = worksheet.getCell(row, dayStartCol);
            cell.border = {
              ...cell.border,
              left: { style: 'thick', color: { argb: 'FF000000' } }
            };
          }
        }
      });
      
      // Borde grueso antes de las columnas de resumen semanal
      for (let row = styleRow; row <= weekEndRow; row++) {
        const cell = worksheet.getCell(row, weeklySummaryStartCol);
        cell.border = {
          ...cell.border,
          left: { style: 'thick', color: { argb: 'FF000000' } }
        };
      }
      
      // Avanzar para la siguiente semana (incluyendo las 2 filas en blanco)
      styleRow = weekEndRow + 3; // +1 por la fila total + 2 filas en blanco
    });
    
    // Generar y descargar el archivo único con todas las hojas
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = weeks.length === 1 
      ? `horarios_semana_${format(startDate, 'dd-MM')}_${format(endDate, 'dd-MM')}.xlsx`
      : `horarios_${weeks.length}_semanas_${format(startDate, 'dd-MM')}_${format(endDate, 'dd-MM')}.xlsx`;
    a.download = fileName;
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