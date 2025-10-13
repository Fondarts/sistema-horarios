import React, { useState, useRef, useEffect } from 'react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { Eye, EyeOff, Save, Copy } from 'lucide-react';
import { useSchedule } from '../contexts/ScheduleContext';
import { useEmployees } from '../contexts/EmployeeContext';
import { Shift } from '../types';
import TimeInput from './TimeInput';

export default function ScheduleManagement() {
  const { shifts, addShift, updateShift, deleteShift, publishShifts, storeSchedule } = useSchedule();
  const { employees } = useEmployees();
  
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showUnpublished, setShowUnpublished] = useState(true);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [modalEmployee, setModalEmployee] = useState<{id: string, name: string} | null>(null);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [shiftForm, setShiftForm] = useState({
    date: '',
    startTime: '09:00',
    endTime: '17:00',
    employeeId: ''
  });
  const [zoomLevel, setZoomLevel] = useState(() => {
    // Calculate initial zoom to show all 24 hours
    if (typeof window !== 'undefined') {
      const containerWidth = window.innerWidth - 200; // Approximate available width
      const minColumnWidth = containerWidth / 24; // 24 hours
      const minZoom = minColumnWidth / 60; // Base width is 60px
      return Math.max(0.3, minZoom); // Minimum 30% zoom
    }
    return 0.3; // Fallback
  });
  const [draggedShift, setDraggedShift] = useState<Shift | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizingShift, setResizingShift] = useState<Shift | null>(null);
  const [resizeHandle, setResizeHandle] = useState<'start' | 'end' | null>(null);
  const [isDraggingOrResizing, setIsDraggingOrResizing] = useState(false);
  const [isCopyingShifts, setIsCopyingShifts] = useState(false);
  const ganttRef = useRef<HTMLDivElement>(null);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Lunes
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 }); // Domingo
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Calcular el rango de horas basado en el horario de la tienda
  const getStoreHoursRange = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const todaySchedule = storeSchedule.find(s => s.dayOfWeek === dayOfWeek);
    
    if (todaySchedule && todaySchedule.isOpen && todaySchedule.openTime && todaySchedule.closeTime) {
      const openHour = parseInt(todaySchedule.openTime.split(':')[0]);
      const closeHour = parseInt(todaySchedule.closeTime.split(':')[0]);
      
      // Agregar 1 hora antes y después
      const startHour = Math.max(0, openHour - 1);
      const endHour = Math.min(23, closeHour + 1);
      
      return { startHour, endHour };
    }
    
    // Horario por defecto si no hay configuración
    return { startHour: 8, endHour: 21 };
  };

  // Siempre mostrar las 24 horas completas para permitir turnos fuera del horario de la tienda
  const { startHour: storeStartHour, endHour: storeEndHour } = getStoreHoursRange();
  const startHour = 0; // Siempre empezar desde las 00:00
  const endHour = 23;  // Siempre terminar en las 23:00
  const hours = Array.from({ length: 24 }, (_, i) => i); // 0-23 horas

  // Filtrar turnos de la semana actual
  const weekShifts = shifts.filter(shift => {
    const shiftDate = new Date(shift.date);
    return shiftDate >= weekStart && shiftDate <= weekEnd && 
           (showUnpublished || shift.isPublished);
  });

  // Utility functions for time calculations
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const roundToIncrement = (minutes: number, increment: number = 10): number => {
    return Math.round(minutes / increment) * increment;
  };

  const handleMouseDown = (e: React.MouseEvent, shift: Shift) => {
    setDraggedShift(shift);
    setDragStart({ x: e.clientX, y: e.clientY });
    setIsDraggingOrResizing(true);
    e.preventDefault();
  };

  const handleResizeStart = (e: React.MouseEvent, shift: Shift, handle: 'start' | 'end') => {
    e.stopPropagation(); // Prevent triggering drag
    setResizingShift(shift);
    setResizeHandle(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
    setIsDraggingOrResizing(true);
    e.preventDefault();
  };

  const createShift = async (employeeId: string, date: string, hour: number) => {
    const startTime = `${hour.toString().padStart(2, '0')}:00`;
    const endTime = `${(hour + 8).toString().padStart(2, '0')}:00`;
    
    const errors = await addShift({
      employeeId,
      date,
      startTime,
      endTime,
      hours: 8,
      isPublished: false
    });

    if (errors.length > 0) {
      alert(errors.map(e => e.message).join('\n'));
    }
  };

  const openShiftModal = (employee: {id: string, name: string}) => {
    setModalEmployee(employee);
    setEditingShift(null);
    setShiftForm({
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '17:00',
      employeeId: employee.id
    });
    setShowShiftModal(true);
  };

  const openEditShiftModal = (shift: Shift) => {
    setModalEmployee(employees.find(emp => emp.id === shift.employeeId) || null);
    setEditingShift(shift);
    setShiftForm({
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      employeeId: shift.employeeId
    });
    setShowShiftModal(true);
  };

  const closeShiftModal = () => {
    setShowShiftModal(false);
    setModalEmployee(null);
    setEditingShift(null);
    setShiftForm({
      date: '',
      startTime: '09:00',
      endTime: '17:00',
      employeeId: ''
    });
  };

  const handleCreateOrUpdateShift = async () => {
    if (!shiftForm.employeeId) return;

    const startHour = parseInt(shiftForm.startTime.split(':')[0]);
    const endHour = parseInt(shiftForm.endTime.split(':')[0]);
    const hours = endHour - startHour;

    if (editingShift) {
      // Actualizar turno existente
      await updateShift(editingShift.id, {
        employeeId: shiftForm.employeeId,
        date: shiftForm.date,
        startTime: shiftForm.startTime,
        endTime: shiftForm.endTime,
        hours: hours
      });
    } else {
      // Crear nuevo turno
      const errors = await addShift({
        employeeId: shiftForm.employeeId,
        date: shiftForm.date,
        startTime: shiftForm.startTime,
        endTime: shiftForm.endTime,
        hours: hours,
        isPublished: false
      });

      if (errors.length > 0) {
        alert(errors.map(e => e.message).join('\n'));
        return;
      }
    }
    
    closeShiftModal();
  };

  const handleDeleteShift = () => {
    if (editingShift) {
      deleteShift(editingShift.id);
      closeShiftModal();
    }
  };


  const publishWeekShifts = () => {
    const unpublishedShifts = weekShifts.filter(s => !s.isPublished);
    publishShifts(unpublishedShifts.map(s => s.id));
  };

  const repeatPreviousWeek = async () => {
    if (isCopyingShifts) return; // Prevenir múltiples ejecuciones
    
    setIsCopyingShifts(true);
    
    try {
      // Calcular la semana anterior
      const previousWeek = new Date(currentWeek);
      previousWeek.setDate(previousWeek.getDate() - 7);
      
      const prevWeekStart = startOfWeek(previousWeek, { weekStartsOn: 1 });
      const prevWeekEnd = endOfWeek(previousWeek, { weekStartsOn: 1 });
      const prevWeekDays = eachDayOfInterval({ start: prevWeekStart, end: prevWeekEnd });
      
      // Obtener turnos de la semana anterior
      const previousWeekShifts = shifts.filter(shift => {
        const shiftDate = new Date(shift.date);
        return shiftDate >= prevWeekStart && shiftDate <= prevWeekEnd;
      });
      
      // Verificar si hay turnos para copiar
      if (previousWeekShifts.length === 0) {
        alert('No hay turnos en la semana anterior para copiar.');
        return;
      }
      
      // Confirmar la acción
      const confirmMessage = `¿Estás seguro de que quieres copiar ${previousWeekShifts.length} turnos de la semana anterior?\n\nEsto sobrescribirá cualquier turno existente en la semana actual.`;
      if (!confirm(confirmMessage)) {
        return;
      }
      
      // Verificar si ya hay turnos en la semana actual
      const currentWeekShifts = weekShifts;
      if (currentWeekShifts.length > 0) {
        const overwriteConfirm = `Ya existen ${currentWeekShifts.length} turnos en la semana actual.\n\n¿Quieres continuar y sobrescribir los turnos existentes?`;
        if (!confirm(overwriteConfirm)) {
          return;
        }
      }
      
      let copiedCount = 0;
      
      // Copiar turnos a la semana actual
      for (const prevShift of previousWeekShifts) {
        const prevShiftDate = new Date(prevShift.date);
        const dayIndex = prevWeekDays.findIndex(day => 
          format(day, 'yyyy-MM-dd') === format(prevShiftDate, 'yyyy-MM-dd')
        );
        
        if (dayIndex !== -1) {
          const newDate = weekDays[dayIndex];
          
          // Crear nuevo turno sin el ID
          const { id, ...shiftWithoutId } = prevShift;
          const newShift = {
            ...shiftWithoutId,
            date: format(newDate, 'yyyy-MM-dd'),
            isPublished: false // Los turnos copiados no están publicados
          };
          
          try {
            await addShift(newShift);
            copiedCount++;
          } catch (error) {
            console.error('Error al copiar turno:', error);
          }
        }
      }
      
      // Mostrar mensaje de confirmación
      alert(`Se copiaron ${copiedCount} turnos de la semana anterior exitosamente.`);
      
    } finally {
      setIsCopyingShifts(false);
    }
  };

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 2.5));
  };

  const zoomOut = () => {
    const minZoom = getMinimumZoomFor24Hours();
    setZoomLevel(prev => Math.max(prev - 0.2, minZoom));
  };

  const resetZoom = () => {
    setZoomLevel(1);
  };

  // Calculate column width based on zoom level
  const getColumnWidth = () => {
    return Math.round(60 * zoomLevel); // Base width 60px * zoom level
  };

  // Calculate minimum zoom level to fit 24 hours in available width
  const getMinimumZoomFor24Hours = () => {
    if (!scrollContainerRef.current) return 0.3;
    
    const containerWidth = scrollContainerRef.current.clientWidth;
    const dayColumnWidth = 200; // Fixed width for day/employee column
    const availableWidth = containerWidth - dayColumnWidth;
    const minColumnWidth = availableWidth / 24; // 24 hours
    const minZoom = minColumnWidth / 60; // Base width is 60px
    
    return Math.max(0.2, minZoom); // Minimum 20% zoom
  };

  // Format hours in a readable way (e.g., "7h 55m" or "5h 30m")
  const formatHours = (hours: number): string => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    
    if (minutes === 0) {
      return `${wholeHours}h`;
    } else {
      return `${wholeHours}h ${minutes}m`;
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => addDays(prev, direction === 'next' ? 7 : -7));
  };

  // Auto-scroll to store hours on load
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Set initial zoom to show all 24 hours when component mounts
  useEffect(() => {
    if (scrollContainerRef.current) {
      const minZoom = getMinimumZoomFor24Hours();
      setZoomLevel(minZoom);
    }
  }, []); // Run only once when component mounts

  useEffect(() => {
    if (scrollContainerRef.current) {
      // Scroll to show store hours (with some padding)
      const storeStartPixel = storeStartHour * getColumnWidth(); // dynamic px per hour
      const scrollPosition = Math.max(0, storeStartPixel - (2 * getColumnWidth())); // 2 hours before store opens
      scrollContainerRef.current.scrollLeft = scrollPosition;
    }
  }, [storeStartHour, zoomLevel]);

  // Recalculate minimum zoom when window resizes
  useEffect(() => {
    const handleResize = () => {
      const minZoom = getMinimumZoomFor24Hours();
      if (zoomLevel < minZoom) {
        setZoomLevel(minZoom);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [zoomLevel]);

  // Global event listeners for drag and resize functionality
  useEffect(() => {
    const handleGlobalMouseMove = async (e: MouseEvent) => {
      if (!ganttRef.current) return;

      const rect = ganttRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Calculate which day column we're in (200px for day column + hour columns)
      const dayColumnWidth = 200;
      const hourColumnWidth = getColumnWidth();
      
      if (x < dayColumnWidth) return; // Don't drag if in day column
      
      // Calculate which hour we're in
      const hourX = x - dayColumnWidth;
      const hourIndex = Math.floor(hourX / hourColumnWidth);
      
      if (hourIndex < 0 || hourIndex >= hours.length) return;
      
      // Calculate which 10-minute increment within the hour
      const hourStartX = hourIndex * hourColumnWidth;
      const positionInHour = hourX - hourStartX;
      const minuteIncrement = Math.floor((positionInHour / hourColumnWidth) * 6); // 6 increments of 10min per hour
      const minutes = Math.max(0, Math.min(50, minuteIncrement * 10)); // 0-50 minutes in 10min increments
      
      // Calculate new time based on target hour and minutes
      const targetHour = hours[hourIndex];
      const newTimeMinutes = targetHour * 60 + minutes;
      const newTime = minutesToTime(roundToIncrement(newTimeMinutes, 10));

      // Handle dragging
      if (draggedShift) {
        // Calculate new start time
        const newStartTime = newTime;
        
        // Calculate new end time maintaining the same duration
        const originalDuration = timeToMinutes(draggedShift.endTime) - timeToMinutes(draggedShift.startTime);
        const newEndMinutes = newTimeMinutes + originalDuration;
        const newEndTime = minutesToTime(roundToIncrement(newEndMinutes, 10));

        // Update shift in real time
        await updateShift(draggedShift.id, {
          date: draggedShift.date, // Keep same date for now
          startTime: newStartTime,
          endTime: newEndTime
        });
      }

      // Handle resizing
      if (resizingShift && resizeHandle) {
        if (resizeHandle === 'start') {
          // Resize start time, keep end time fixed
          const newStartTime = newTime;
          const endTimeMinutes = timeToMinutes(resizingShift.endTime);
          
          // Ensure start time is before end time (minimum 10 minutes)
          if (newTimeMinutes < endTimeMinutes - 10) {
            await updateShift(resizingShift.id, {
              date: resizingShift.date,
              startTime: newStartTime,
              endTime: resizingShift.endTime
              // hours will be recalculated automatically in updateShift
            });
          }
        } else if (resizeHandle === 'end') {
          // Resize end time, keep start time fixed
          const newEndTime = newTime;
          const startTimeMinutes = timeToMinutes(resizingShift.startTime);
          
          // Ensure end time is after start time (minimum 10 minutes)
          if (newTimeMinutes > startTimeMinutes + 10) {
            await updateShift(resizingShift.id, {
              date: resizingShift.date,
              startTime: resizingShift.startTime,
              endTime: newEndTime
              // hours will be recalculated automatically in updateShift
            });
          }
        }
      }
    };

  const handleGlobalMouseUp = () => {
    console.log('handleGlobalMouseUp called, isDraggingOrResizing:', isDraggingOrResizing);
    setDraggedShift(null);
    setResizingShift(null);
    setResizeHandle(null);
    // Usar setTimeout para asegurar que el estado se actualice antes de que se procese el click
    setTimeout(() => {
      setIsDraggingOrResizing(false);
    }, 10);
  };

    if (draggedShift || resizingShift) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [draggedShift, resizingShift, resizeHandle, hours, updateShift, timeToMinutes, minutesToTime, roundToIncrement]);


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Horarios</h2>
          <p className="text-gray-600">Planifica los turnos de tus empleados</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Zoom Controls */}
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={zoomOut}
              className="p-2 rounded hover:bg-gray-200 transition-colors"
              title="Alejar"
            >
              <span className="text-lg font-bold">−</span>
            </button>
            <span className="px-2 text-sm text-gray-600 min-w-[3rem] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="p-2 rounded hover:bg-gray-200 transition-colors"
              title="Acercar"
            >
              <span className="text-lg font-bold">+</span>
            </button>
            <button
              onClick={resetZoom}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
              title="Resetear zoom"
            >
              Reset
            </button>
          </div>
          <button
            onClick={() => setShowUnpublished(!showUnpublished)}
            className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
              showUnpublished 
                ? 'bg-primary-100 text-primary-700' 
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {showUnpublished ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
            {showUnpublished ? 'Ocultar Borradores' : 'Mostrar Borradores'}
          </button>
          <button
            onClick={publishWeekShifts}
            className="btn-primary flex items-center"
          >
            <Save className="w-5 h-5 mr-2" />
            Publicar Cambios
          </button>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateWeek('prev')}
              className="btn-secondary"
            >
              ← Semana Anterior
            </button>
            <h3 className="text-lg font-semibold">
              {format(weekStart, 'd MMM', { locale: es })} - {format(weekEnd, 'd MMM yyyy', { locale: es })}
            </h3>
            <button
              onClick={() => navigateWeek('next')}
              className="btn-secondary"
            >
              Semana Siguiente →
            </button>
            <button
              onClick={repeatPreviousWeek}
              disabled={isCopyingShifts}
              className={`flex items-center space-x-2 ${
                isCopyingShifts 
                  ? 'btn-secondary opacity-50 cursor-not-allowed' 
                  : 'btn-primary hover:bg-primary-600'
              }`}
              title={isCopyingShifts ? "Copiando turnos..." : "Copiar todos los turnos de la semana anterior"}
            >
              <Copy className={`w-4 h-4 ${isCopyingShifts ? 'animate-spin' : ''}`} />
              <span>{isCopyingShifts ? 'Copiando...' : 'Repetir Semana Anterior'}</span>
            </button>
          </div>
          <button
            onClick={() => setCurrentWeek(new Date())}
            className="btn-secondary"
          >
            Esta Semana
          </button>
        </div>

        {/* Employee Selection */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Crear Turnos</h4>
          <p className="text-sm text-gray-600 mb-3">
            Haz clic en un empleado para crear un turno manualmente
          </p>
          <div className="flex flex-wrap gap-2">
            {employees.map((employee) => (
              <button
                key={employee.id}
                onClick={() => openShiftModal({id: employee.id, name: employee.name})}
                className="px-4 py-2 rounded-lg text-sm transition-colors bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-primary-300 flex items-center gap-2"
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: employee.color }}
                ></div>
                {employee.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <div ref={scrollContainerRef} className="overflow-x-auto">
        <div className="min-w-full">
          {/* Header with hours */}
          <div className="grid border-b border-gray-200" style={{ gridTemplateColumns: `200px repeat(${hours.length}, ${getColumnWidth()}px)` }}>
            <div className="p-3 font-medium text-gray-700 bg-gray-50">Día / Empleado</div>
            {hours.map((hour) => {
              // Check if this hour is within store hours
              const isStoreHour = hour >= storeStartHour && hour <= storeEndHour;
              return (
                <div 
                  key={hour} 
                  className={`px-2 border-l border-gray-200 flex items-start justify-center ${isStoreHour ? 'bg-blue-50' : 'bg-gray-50'}`} 
                  style={{ width: `${getColumnWidth()}px`, paddingTop: '4px', paddingBottom: '8px' }}
                >
                  <div className={`text-xs ${isStoreHour ? 'text-blue-700 font-medium' : 'text-gray-600'}`}>
                    {hour}:00
                  </div>
                </div>
              );
            })}
          </div>

          {/* Gantt Grid */}
          <div
            ref={ganttRef}
            className="relative"
          >
            {weekDays.map((day) => {
              // Get employees working on this day
              const dayShifts = weekShifts.filter(shift => 
                shift.date === format(day, 'yyyy-MM-dd')
              );
              const employeesOnDay = Array.from(new Set(dayShifts.map(shift => shift.employeeId)));
              
              return (
                <div key={day.toISOString()} className="grid border-b border-gray-300 relative" style={{ 
                  gridTemplateColumns: `200px repeat(${hours.length}, ${getColumnWidth()}px)`, 
                  minHeight: '120px'
                }}>
                  {/* Day and employees */}
                  <div className="p-3 border-r border-gray-200 bg-gray-50">
                    <div className="font-medium text-gray-900 mb-2">
                      {format(day, 'EEE d', { locale: es })}
                    </div>
                    {employeesOnDay.map(employeeId => {
                      const employee = employees.find(emp => emp.id === employeeId);
                      return employee ? (
                        <div key={employeeId} className="text-sm text-gray-600 mb-1">
                          {employee.name}
                        </div>
                      ) : null;
                    })}
                  </div>

                  {/* Hours for this day */}
                  {hours.map((hour) => {
                    const isStoreHour = hour >= storeStartHour && hour <= storeEndHour;
                    return (
                      <div 
                        key={`${day.toISOString()}-${hour}`} 
                        className={`relative border-r border-gray-200 ${isStoreHour ? 'bg-blue-25' : ''}`} 
                        style={{ height: '120px', width: `${getColumnWidth()}px` }}
                      >
                        {/* Hour line */}
                        <div className="absolute w-full border-t border-gray-100" style={{ top: '0' }}>
                          <div className={`text-xs px-1 ${isStoreHour ? 'text-blue-600' : 'text-gray-400'}`}>
                            {hour}:00
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Shift bars for this day */}
                  {dayShifts.map((shift, shiftIndex) => {
                    const employee = employees.find(emp => emp.id === shift.employeeId);
                    const shiftStartHour = parseInt(shift.startTime.split(':')[0]);
                    const shiftEndHour = parseInt(shift.endTime.split(':')[0]);
                    const shiftStartMinute = parseInt(shift.startTime.split(':')[1]);
                    const shiftEndMinute = parseInt(shift.endTime.split(':')[1]);
                    
                    // Calculate position and width based on the hour grid
                    const shiftStartTimeInHours = shiftStartHour + (shiftStartMinute / 60);
                    const shiftEndTimeInHours = shiftEndHour + (shiftEndMinute / 60);
                    const durationInHours = shiftEndTimeInHours - shiftStartTimeInHours;
                    
                    // Position relative to the hour columns using dynamic pixel widths
                    // The grid has 200px for day/employee + hour columns (dynamic width based on zoom)
                    // Calculate position based on the actual shift start time relative to the visible range
                    const columnWidth = getColumnWidth();
                    const margin = 2; // Small margin to prevent overlapping with hour labels
                    const left = 200 + ((shiftStartTimeInHours - startHour) * columnWidth) + margin; // 200px + (actual shift time - visible start time) * columnWidth + margin
                    const width = (durationInHours * columnWidth) - (margin * 2); // hours * columnWidth - margins on both sides
                    const top = shiftIndex * 35 + 15; // Increased from 5 to 15 for better vertical spacing
                    
                    return (
                      <div
                        key={shift.id}
                        className="absolute rounded text-white text-xs shift-bar"
                        style={{
                          left: `${left}px`,
                          width: `${width}px`,
                          top: `${top}px`,
                          height: '32px',
                          zIndex: 10,
                          backgroundColor: employee?.color || '#3B82F6',
                          padding: '4px 8px 8px 8px' // top right bottom left
                        }}
                      >
                        {/* Resize handle - Start (left) */}
                        <div
                          className="absolute left-0 top-0 w-2 h-full cursor-ew-resize bg-white bg-opacity-30 hover:bg-opacity-50 rounded-l"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleResizeStart(e, shift, 'start');
                          }}
                          title="Arrastra para cambiar hora de inicio"
                        />
                        
                        {/* Main shift content */}
                        <div
                          className="w-full h-full cursor-move"
                          onMouseDown={(e) => handleMouseDown(e, shift)}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            openEditShiftModal(shift);
                          }}
                        >
                          <div className="font-medium text-xs truncate">
                            {employee?.name}
                          </div>
                          <div className="text-xs opacity-90 flex justify-between items-center">
                            <span className="truncate">
                              {shift.startTime}-{shift.endTime}
                            </span>
                            <span className="ml-2 flex-shrink-0">
                              {formatHours(shift.hours)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Resize handle - End (right) */}
                        <div
                          className="absolute right-0 top-0 w-2 h-full cursor-ew-resize bg-white bg-opacity-30 hover:bg-opacity-50 rounded-r"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleResizeStart(e, shift, 'end');
                          }}
                          title="Arrastra para cambiar hora de fin"
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Shift Creation Modal */}
      {showShiftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingShift ? 'Editar Turno' : 'Crear Turno'}
              </h3>
              <button
                onClick={closeShiftModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleCreateOrUpdateShift(); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={shiftForm.date}
                    onChange={(e) => setShiftForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Empleado
                  </label>
                  <select
                    value={shiftForm.employeeId}
                    onChange={(e) => setShiftForm(prev => ({ ...prev, employeeId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">Seleccionar empleado</option>
                    {employees.map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora de inicio
                  </label>
                  <TimeInput
                    value={shiftForm.startTime}
                    onChange={(value) => setShiftForm(prev => ({ ...prev, startTime: value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="HH:MM"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora de fin
                  </label>
                  <TimeInput
                    value={shiftForm.endTime}
                    onChange={(value) => setShiftForm(prev => ({ ...prev, endTime: value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="HH:MM"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                {/* Botón de eliminar (solo visible cuando se está editando) */}
                {editingShift && (
                  <button
                    type="button"
                    onClick={handleDeleteShift}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Eliminar
                  </button>
                )}
                {/* Botones de acción */}
                <div className="flex space-x-3 ml-auto">
                  <button
                    type="button"
                    onClick={closeShiftModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {editingShift ? 'Actualizar Turno' : 'Crear Turno'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}