import React, { useState, useRef, useEffect } from 'react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { Eye, EyeOff, Save, Copy } from 'lucide-react';
import { useSchedule } from '../contexts/ScheduleContext';
import { useEmployees } from '../contexts/EmployeeContext';
import { useVacation } from '../contexts/VacationContext';
import { useHolidays } from '../contexts/HolidayContext';
import { useCompactMode } from '../contexts/CompactModeContext';
import { Shift, Employee } from '../types';
import TimeInput from './TimeInput';
import { BirthdayNotification } from './BirthdayNotification';

export default function ScheduleManagement() {
  const { shifts, addShift, updateShift, deleteShift, publishShifts, storeSchedule } = useSchedule();
  const { employees } = useEmployees();
  const { vacationRequests } = useVacation();
  const { isHoliday, getHolidayForDate } = useHolidays();
  const { isCompactMode, isMobile } = useCompactMode();
  
  
  // Función para verificar si un empleado está de vacaciones en una fecha específica
  const isEmployeeOnVacation = (employeeId: string, date: string): boolean => {
    const approvedVacations = vacationRequests.filter(vr => 
      vr.employeeId === employeeId && vr.status === 'approved'
    );
    
    const targetDate = new Date(date);
    
    return approvedVacations.some(vacation => {
      const startDate = new Date(vacation.startDate);
      const endDate = new Date(vacation.endDate);
      return targetDate >= startDate && targetDate <= endDate;
    });
  };
  
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showUnpublished, setShowUnpublished] = useState(true);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [modalEmployee, setModalEmployee] = useState<{id: string, name: string} | null>(null);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [showBirthdayNotification, setShowBirthdayNotification] = useState(true);
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
  const [show24Hours, setShow24Hours] = useState(false); // Toggle for 24h vs focused view
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

  // Calcular horas visibles basado en el toggle
  const { startHour: storeStartHour, endHour: storeEndHour } = getStoreHoursRange();
  const startHour = show24Hours ? 0 : storeStartHour; // 0 si 24h, o horario de tienda si enfocado
  const endHour = show24Hours ? 23 : storeEndHour;    // 23 si 24h, o horario de tienda si enfocado
  // En móvil mostrar cada 2 horas, en desktop cada hora
  const hours = isMobile 
    ? Array.from({ length: Math.ceil((endHour - startHour + 1) / 2) }, (_, i) => startHour + (i * 2))
    : Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

  // Filtrar turnos de la semana actual
  const weekShifts = shifts.filter(shift => {
    const shiftDate = new Date(shift.date);
    return shiftDate >= weekStart && shiftDate <= weekEnd && 
           (showUnpublished || shift.isPublished);
  });

  // Agrupar turnos por día y empleado
  const groupedShifts = days.reduce((acc, day) => {
    const dayString = format(day, 'yyyy-MM-dd');
    acc[dayString] = employees.reduce((empAcc, employee) => {
      empAcc[employee.id] = weekShifts.filter(shift => 
        shift.employeeId === employee.id && format(new Date(shift.date), 'yyyy-MM-dd') === dayString
      ).sort((a, b) => {
        const timeA = parseInt(a.startTime.replace(':', ''));
        const timeB = parseInt(b.startTime.replace(':', ''));
        return timeA - timeB;
      });
      return empAcc;
    }, {} as Record<string, Shift[]>);
    return acc;
  }, {} as Record<string, Record<string, Shift[]>>);

  // Obtener empleados que tienen turnos asignados para un día específico
  const getEmployeesWithShiftsForDay = (day: Date) => {
    const dayString = format(day, 'yyyy-MM-dd');
    const employeeIdsWithShifts = new Set<string>();
    employees.forEach(employee => {
      if (groupedShifts[dayString] && groupedShifts[dayString][employee.id] && groupedShifts[dayString][employee.id].length > 0) {
        employeeIdsWithShifts.add(employee.id);
      }
    });
    return Array.from(employeeIdsWithShifts).map(id => employees.find(emp => emp.id === id)).filter(Boolean) as Employee[];
  };

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

  // Función para calcular el contraste y determinar el color del texto
  const getTextColorForBackground = (backgroundColor: string): string => {
    // Convertir color hex a RGB
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calcular luminancia relativa usando la fórmula WCAG
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Si la luminancia es mayor a 0.5, usar texto negro, sino blanco
    return luminance > 0.5 ? '#000000' : '#ffffff';
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
    const minZoom = getMinimumZoomForVisibleHours();
    setZoomLevel(prev => Math.max(prev - 0.2, minZoom));
  };

  const resetZoom = () => {
    setZoomLevel(1);
  };

  // Calculate column width based on zoom level
  const getColumnWidth = () => {
    // En móvil, columnas más anchas para legibilidad
    if (isMobile) {
      return Math.round(80 * zoomLevel);
    }
    
    // En desktop, calcular ancho para ocupar todo el espacio disponible
    if (scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.offsetWidth;
      const dayColumnWidth = isCompactMode ? 100 : 120;
      const availableWidth = containerWidth - dayColumnWidth;
      const hourCount = hours.length;
      const baseWidth = Math.max(40, availableWidth / hourCount);
      return Math.round(baseWidth * zoomLevel);
    }
    
    // Fallback para modo compacto
    const baseWidth = isCompactMode ? 40 : 60;
    return Math.round(baseWidth * zoomLevel);
  };

  // Calculate minimum zoom level to fit visible hours in available width
  const getMinimumZoomForVisibleHours = () => {
    if (!scrollContainerRef.current) return 0.3;
    
    const containerWidth = scrollContainerRef.current.clientWidth;
    const dayColumnWidth = 200; // Fixed width for day/employee column
    const availableWidth = containerWidth - dayColumnWidth;
    const visibleHours = endHour - startHour + 1;
    const minColumnWidth = availableWidth / visibleHours;
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
  
  // Set initial zoom to show visible hours when component mounts
  useEffect(() => {
    if (scrollContainerRef.current) {
      const minZoom = getMinimumZoomForVisibleHours();
      setZoomLevel(minZoom);
    }
  }, [show24Hours]); // Recalculate when toggle changes

  // Recalculate column widths when hours change
  useEffect(() => {
    // Forzar re-render para recalcular anchos de columnas
    setZoomLevel(prev => prev);
  }, [hours.length, show24Hours]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      if (show24Hours) {
        // If showing 24h, scroll to beginning
        scrollContainerRef.current.scrollLeft = 0;
      } else {
        // If showing focused view, scroll to show store hours (with some padding)
        const storeStartPixel = storeStartHour * getColumnWidth(); // dynamic px per hour
        const scrollPosition = Math.max(0, storeStartPixel - (2 * getColumnWidth())); // 2 hours before store opens
        scrollContainerRef.current.scrollLeft = scrollPosition;
      }
    }
  }, [storeStartHour, zoomLevel, show24Hours]);

  // Recalculate minimum zoom when window resizes
  useEffect(() => {
    const handleResize = () => {
      const minZoom = getMinimumZoomForVisibleHours();
      if (zoomLevel < minZoom) {
        setZoomLevel(minZoom);
      }
      // Forzar re-render para recalcular anchos de columnas
      setZoomLevel(prev => prev);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [zoomLevel, show24Hours, hours.length]);

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

        // Validate that times are within visible range
        const newStartHour = parseInt(newStartTime.split(':')[0]);
        const newEndHour = parseInt(newEndTime.split(':')[0]);
        
        // Use visible hours range when toggle is off, or full 24h when toggle is on
        const minHour = show24Hours ? 0 : startHour;
        const maxHour = show24Hours ? 23 : endHour;
        
        if (newStartHour >= minHour && newStartHour <= maxHour && newEndHour >= minHour && newEndHour <= maxHour) {
          // Update shift in real time
          await updateShift(draggedShift.id, {
            date: draggedShift.date, // Keep same date for now
            startTime: newStartTime,
            endTime: newEndTime
          });
        }
      }

      // Handle resizing
      if (resizingShift && resizeHandle) {
        if (resizeHandle === 'start') {
          // Resize start time, keep end time fixed
          const newStartTime = newTime;
          const endTimeMinutes = timeToMinutes(resizingShift.endTime);
          const newStartHour = parseInt(newStartTime.split(':')[0]);
          
          // Ensure start time is before end time (minimum 10 minutes) and within visible range
          const minHour = show24Hours ? 0 : startHour;
          const maxHour = show24Hours ? 23 : endHour;
          
          if (newTimeMinutes < endTimeMinutes - 10 && newStartHour >= minHour && newStartHour <= maxHour) {
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
          const newEndHour = parseInt(newEndTime.split(':')[0]);
          
          // Ensure end time is after start time (minimum 10 minutes) and within visible range
          const minHour = show24Hours ? 0 : startHour;
          const maxHour = show24Hours ? 23 : endHour;
          
          if (newTimeMinutes > startTimeMinutes + 10 && newEndHour >= minHour && newEndHour <= maxHour) {
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gestión de Horarios</h2>
        </div>
        <div className="flex items-center space-x-4">
          
          {/* 24h Toggle */}
          <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded p-1">
            <label className="flex items-center space-x-1 cursor-pointer">
              <input
                type="checkbox"
                checked={show24Hours}
                onChange={(e) => setShow24Hours(e.target.checked)}
                className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-1"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                Ver 24h
              </span>
            </label>
          </div>
          
          <button
            onClick={() => setShowUnpublished(!showUnpublished)}
            className={`flex items-center px-2 py-1 rounded text-xs transition-colors ${
              showUnpublished 
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300' 
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {showUnpublished ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
            {showUnpublished ? 'Ocultar' : 'Mostrar'}
          </button>
          <button
            onClick={publishWeekShifts}
            className="flex items-center px-2 py-1 bg-primary-600 hover:bg-primary-700 text-white text-xs rounded transition-colors"
          >
            <Save className="w-3 h-3 mr-1" />
            Publicar
          </button>
        </div>
      </div>

      {/* Employee Selection */}
      <div className="card">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Crear Turnos</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Haz clic en un empleado para crear un turno manualmente
        </p>
        <div className="flex flex-wrap gap-2">
          {employees.map((employee) => (
            <button
              key={employee.id}
              onClick={() => openShiftModal({id: employee.id, name: employee.name})}
              className="px-4 py-2 rounded-lg text-sm transition-colors bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-primary-300 flex items-center gap-2"
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

      {/* Week Navigation */}
      <div className="card">
        {/* Fecha centrada */}
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
            {format(weekStart, 'd MMM', { locale: es })} - {format(weekEnd, 'd MMM yyyy', { locale: es })}
          </h3>
        </div>

        {/* Botones de navegación */}
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => navigateWeek('prev')}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm rounded transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
          >
            ← Anterior
          </button>
          <button
            onClick={() => navigateWeek('next')}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm rounded transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
          >
            Siguiente →
          </button>
          <button
            onClick={repeatPreviousWeek}
            disabled={isCopyingShifts}
            className={`flex items-center px-3 py-1 text-sm rounded transition-colors ${
              isCopyingShifts 
                ? 'bg-gray-200 opacity-50 cursor-not-allowed text-gray-500 dark:bg-gray-700 dark:text-gray-400' 
                : 'bg-primary-600 hover:bg-primary-700 text-white'
            }`}
            title={isCopyingShifts ? "Copiando turnos..." : "Copiar todos los turnos de la semana anterior"}
          >
            <Copy className={`w-3 h-3 mr-1 ${isCopyingShifts ? 'animate-spin' : ''}`} />
            <span>{isCopyingShifts ? 'Copiando...' : 'Repetir'}</span>
          </button>
          <button
            onClick={() => setCurrentWeek(new Date())}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm rounded transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
          >
            Esta Semana
          </button>
        </div>
      </div>

      {/* Gantt Chart */}
      <div ref={scrollContainerRef} className="overflow-x-auto">
        <div className="min-w-full">
          {/* Header with hours */}
          <div 
            className="grid border-b border-gray-200 dark:border-gray-600" 
            style={{ 
              gridTemplateColumns: `${isMobile ? '60px' : (isCompactMode ? '100px' : '120px')} repeat(${hours.length}, 1fr)`,
              minWidth: 'max-content'
            }}
          >
            <div className={`${isMobile ? 'p-1' : (isCompactMode ? 'p-2' : 'p-3')} font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 ${isMobile ? 'text-xs' : (isCompactMode ? 'text-sm' : '')} ${isMobile ? 'sticky left-0 z-10' : ''}`}>Día</div>
            {hours.map((hour) => {
              // Check if this hour is within store hours
              const isStoreHour = hour >= storeStartHour && hour <= storeEndHour;
              return (
                <div 
                  key={hour} 
                  className={`${isMobile ? 'px-2' : 'px-1'} border-l border-gray-200 dark:border-gray-600 flex items-center justify-center ${isStoreHour ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-700'}`}
                >
                  <div className={`${isMobile ? 'text-sm font-semibold' : 'text-xs font-medium'} ${isStoreHour ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300'}`}>
                    {isMobile ? `${hour}:00` : hour}
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
              
              const dayString = format(day, 'yyyy-MM-dd');
              const isHolidayDay = isHoliday(dayString);
              const holiday = getHolidayForDate(dayString);

              return (
                  <div 
                    key={day.toISOString()} 
                    className="grid border-b border-gray-300 dark:border-gray-600 relative" 
                    style={{ 
                      gridTemplateColumns: `${isMobile ? '60px' : (isCompactMode ? '100px' : '120px')} repeat(${hours.length}, 1fr)`, 
                      minHeight: '120px',
                      minWidth: 'max-content'
                    }}
                  >
                  {/* Day and employees */}
                  <div className={`${isMobile ? 'p-1' : (isCompactMode ? 'p-2' : 'p-3')} border-r border-gray-200 dark:border-gray-600 ${
                    isHolidayDay 
                      ? 'bg-orange-50 dark:bg-orange-900/20' 
                      : 'bg-gray-50 dark:bg-gray-700'
                  } ${isMobile ? 'sticky left-0 z-10' : ''}`}>
                    <div className={`font-medium ${isMobile ? 'mb-0' : 'mb-2'} ${
                      isHolidayDay
                        ? 'text-orange-700 dark:text-orange-300'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {isMobile ? (
                        <div className="text-center">
                          <div className="text-xs font-semibold">
                            {format(day, 'EEE', { locale: es })}
                          </div>
                          <div className="text-sm font-bold">
                            {format(day, 'd', { locale: es })}
                          </div>
                          {isHolidayDay && (
                            <div className="text-xs">🎉</div>
                          )}
                        </div>
                      ) : (
                        <>
                          {format(day, 'EEE d', { locale: es })}
                          {isHolidayDay && (
                            <span className="ml-2 text-xs">🎉</span>
                          )}
                        </>
                      )}
                    </div>
                    {/* Solo mostrar nombres de empleados en desktop */}
                    {!isMobile && employeesOnDay.map(employeeId => {
                      const employee = employees.find(emp => emp.id === employeeId);
                      const isOnVacation = employee ? isEmployeeOnVacation(employee.id, format(day, 'yyyy-MM-dd')) : false;
                      return employee ? (
                        <div key={employeeId} className={`text-sm mb-1 flex items-center gap-1 ${
                          isOnVacation 
                            ? 'text-orange-600 dark:text-orange-400 font-medium' 
                            : 'text-gray-600 dark:text-gray-300'
                        }`}>
                          {isOnVacation && (
                            <span className="text-xs" title="Empleado de vacaciones">🏖️</span>
                          )}
                          {employee.name}
                        </div>
                      ) : null;
                    })}
                  </div>

                  {/* Hours for this day */}
                  {hours.map((hour) => {
                    const isStoreHour = hour >= storeStartHour && hour <= storeEndHour;
                    
                    // Determinar el color de fondo
                    let backgroundColor = '';
                    if (isHolidayDay) {
                      backgroundColor = 'bg-orange-50 dark:bg-orange-900/20';
                    } else if (isStoreHour) {
                      backgroundColor = 'bg-blue-25 dark:bg-blue-900/10';
                    }
                    
                    return (
                      <div 
                        key={`${day.toISOString()}-${hour}`} 
                        className={`relative border-r border-gray-200 dark:border-gray-600 ${backgroundColor}`} 
                        style={{ height: '120px' }}
                        title={isHolidayDay ? `Feriado: ${holiday?.name}` : ''}
                      >
                        {/* Hour line */}
                        <div className="absolute w-full border-t border-gray-100 dark:border-gray-600" style={{ top: '0' }}>
                          <div className={`text-xs px-1 ${
                            isHolidayDay 
                              ? 'text-orange-600 dark:text-orange-300 font-medium' 
                              : isStoreHour 
                                ? 'text-blue-600 dark:text-blue-300' 
                                : 'text-gray-400 dark:text-gray-500'
                          }`}>
                            {hour}:00
                          </div>
                        </div>
                        
                        {/* Render shift bars for this hour */}
                        {employeesOnDay.map((employeeId, empIndex) => {
                          const employeeShifts = groupedShifts[dayString]?.[employeeId] || [];
                          return employeeShifts.map((shift, shiftIndex) => {
                            const employee = employees.find(emp => emp.id === shift.employeeId);
                            const shiftStartHour = parseInt(shift.startTime.split(':')[0]);
                            const shiftStartMinute = parseInt(shift.startTime.split(':')[1]);
                            const shiftEndHour = parseInt(shift.endTime.split(':')[0]);
                            const shiftEndMinute = parseInt(shift.endTime.split(':')[1]);
                            
                            // Calculate position and width based on the hour grid
                            const shiftStartTimeInHours = shiftStartHour + (shiftStartMinute / 60);
                            const shiftEndTimeInHours = shiftEndHour + (shiftEndMinute / 60);
                            const durationInHours = shiftEndTimeInHours - shiftStartTimeInHours;
                            
                            // Check if this shift overlaps with this hour cell
                            const hourStart = hour;
                            const hourEnd = hour + (isMobile ? 2 : 1);
                            
                            if (shiftStartTimeInHours >= hourEnd || shiftEndTimeInHours <= hourStart) {
                              return null; // Shift doesn't overlap with this hour
                            }
                            
                            // Calculate position within this hour cell
                            const startInCell = Math.max(0, shiftStartTimeInHours - hourStart);
                            const endInCell = Math.min(hourEnd - hourStart, shiftEndTimeInHours - hourStart);
                            const durationInCell = endInCell - startInCell;
                            
                            const leftPercent = (startInCell / (hourEnd - hourStart)) * 100;
                            const widthPercent = (durationInCell / (hourEnd - hourStart)) * 100;
                            
                            const top = (isHolidayDay ? 55 : 15) + (shiftIndex * 35);
                            
                            return (
                              <div
                                key={shift.id}
                                className="absolute rounded text-xs shift-bar"
                                style={{
                                  left: `${leftPercent}%`,
                                  width: `${widthPercent}%`,
                                  top: `${top}px`,
                                  height: '32px',
                                  zIndex: 10,
                                  backgroundColor: employee?.color || '#3B82F6',
                                  color: getTextColorForBackground(employee?.color || '#3B82F6'),
                                  padding: '6px 8px 6px 8px'
                                }}
                                onMouseDown={(e) => handleDragStart(e, shift)}
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  openEditShiftModal(shift);
                                }}
                              >
                                {/* Resize handle - Start (left) */}
                                <div
                                  className="absolute left-0 top-0 w-2 h-full cursor-ew-resize rounded-l"
                                  style={{
                                    backgroundColor: getTextColorForBackground(employee?.color || '#3B82F6'),
                                    opacity: 0.3
                                  }}
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
                                    handleResizeStart(e, shift, 'start');
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.opacity = '0.5';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.opacity = '0.3';
                                  }}
                                  title="Arrastra para cambiar hora de inicio"
                                />
                                
                                {/* Main shift content */}
                                <div className="w-full h-full cursor-move">
                                  <div className="font-medium text-xs leading-tight">
                                    {employee?.name}
                                  </div>
                                  <div className="text-xs opacity-90 leading-tight">
                                    <div className="truncate">
                                      {shift.startTime}-{shift.endTime}
                                    </div>
                                    <div className="text-xs opacity-75">
                                      {formatHours(shift.hours)}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Resize handle - End (right) */}
                                <div
                                  className="absolute right-0 top-0 w-2 h-full cursor-ew-resize rounded-r"
                                  style={{
                                    backgroundColor: getTextColorForBackground(employee?.color || '#3B82F6'),
                                    opacity: 0.3
                                  }}
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
                                    handleResizeStart(e, shift, 'end');
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.opacity = '0.5';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.opacity = '0.3';
                                  }}
                                  title="Arrastra para cambiar hora de fin"
                                />
                              </div>
                            );
                          });
                        })}
                      </div>
                    );
                  })}

                  {/* Holiday block for this day */}
                  {isHolidayDay && (
                    <div
                      className="absolute rounded text-xs holiday-block"
                      style={{
                        left: isMobile ? '60px' : (isCompactMode ? '100px' : '120px'), // Start after the day column
                        right: '0px', // Extend to the end
                        top: '15px',
                        height: '32px',
                        zIndex: 5,
                        backgroundColor: '#F97316', // Orange color for holidays
                        color: '#FFFFFF',
                        padding: '4px 8px',
                        border: '2px solid #EA580C',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      <div className="flex items-center justify-center h-full">
                        <span className="font-bold text-sm">🎉 {holiday?.name}</span>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Shift Creation Modal */}
      {showShiftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {editingShift ? 'Editar Turno' : 'Crear Turno'}
              </h3>
              <button
                onClick={closeShiftModal}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleCreateOrUpdateShift(); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={shiftForm.date}
                    onChange={(e) => setShiftForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Empleado
                  </label>
                  <select
                    value={shiftForm.employeeId}
                    onChange={(e) => setShiftForm(prev => ({ ...prev, employeeId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hora de inicio
                  </label>
                  <TimeInput
                    value={shiftForm.startTime}
                    onChange={(value) => setShiftForm(prev => ({ ...prev, startTime: value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="HH:MM"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hora de fin
                  </label>
                  <TimeInput
                    value={shiftForm.endTime}
                    onChange={(value) => setShiftForm(prev => ({ ...prev, endTime: value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
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

      {/* Birthday Notification */}
      {showBirthdayNotification && (
        <BirthdayNotification 
          employees={employees}
          currentDate={currentWeek}
          onClose={() => setShowBirthdayNotification(false)}
        />
      )}

    </div>
  );
}