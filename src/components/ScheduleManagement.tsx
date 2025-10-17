import React, { useState, useRef, useEffect } from 'react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { Eye, EyeOff, Save, Copy, Trash2, AlertTriangle, Clock, X } from 'lucide-react';
import { useSchedule } from '../contexts/ScheduleContext';
import { useEmployees } from '../contexts/EmployeeContext';
import { useVacation } from '../contexts/VacationContext';
import { useHolidays } from '../contexts/HolidayContext';
import { useCompactMode } from '../contexts/CompactModeContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useTheme } from '../contexts/ThemeContext';
import { Shift, Employee } from '../types';
import TimeInput from './TimeInput';
import { BirthdayNotification } from './BirthdayNotification';

export default function ScheduleManagement() {
  const { shifts, addShift, updateShift, deleteShift, publishShifts, storeSchedule } = useSchedule();
  const { employees } = useEmployees();
  const { vacationRequests } = useVacation();
  const { isHoliday, getHolidayForDate } = useHolidays();
  const { isCompactMode, isMobile } = useCompactMode();
  const { addNotification } = useNotifications();
  const { theme } = useTheme();
  
  // Definir ancho fijo para columnas de horas en móvil
  const mobileHourColumnWidth = 57;
  
  
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

  // Función para validar conflictos en un turno
  const validateShiftConflicts = (shift: Shift): { hasConflict: boolean; conflictType: string } => {
    const shiftDate = new Date(shift.date);
    const dayOfWeek = shiftDate.getDay();
    const todaySchedule = storeSchedule.find(s => s.dayOfWeek === dayOfWeek);
    
    // 1. Verificar si está fuera del horario permitido de la tienda
    if (todaySchedule && todaySchedule.isOpen && todaySchedule.openTime && todaySchedule.closeTime) {
      const storeOpenTime = todaySchedule.openTime;
      const storeCloseTime = todaySchedule.closeTime;
      
      if (shift.startTime < storeOpenTime || shift.endTime > storeCloseTime) {
        return { hasConflict: true, conflictType: 'Fuera del horario de la tienda' };
      }
    }
    
    // 2. Verificar superposición con otros turnos del mismo empleado
    const employeeShifts = weekShifts.filter(s => 
      s.employeeId === shift.employeeId && 
      s.id !== shift.id && 
      format(new Date(s.date), 'yyyy-MM-dd') === format(shiftDate, 'yyyy-MM-dd')
    );
    
    for (const otherShift of employeeShifts) {
      if (isTimeOverlap(shift.startTime, shift.endTime, otherShift.startTime, otherShift.endTime)) {
        return { hasConflict: true, conflictType: 'Superposición con otro turno' };
      }
    }
    
    // 3. Verificar exceso de horas semanales (máximo 48 horas por semana)
    const weekStart = startOfWeek(shiftDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(shiftDate, { weekStartsOn: 1 });
    
    const weeklyShifts = weekShifts.filter(s => {
      const sDate = new Date(s.date);
      return s.employeeId === shift.employeeId && 
             sDate >= weekStart && 
             sDate <= weekEnd &&
             s.id !== shift.id;
    });
    
    const currentWeeklyHours = weeklyShifts.reduce((total, s) => total + s.hours, 0);
    const newTotalHours = currentWeeklyHours + shift.hours;
    
    if (newTotalHours > 48) {
      return { hasConflict: true, conflictType: 'Exceso de horas semanales (máx. 48h)' };
    }
    
    return { hasConflict: false, conflictType: '' };
  };

  // Función auxiliar para verificar superposición de horarios
  const isTimeOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const start1Min = timeToMinutes(start1);
    const end1Min = timeToMinutes(end1);
    const start2Min = timeToMinutes(start2);
    const end2Min = timeToMinutes(end2);
    
    return start1Min < end2Min && start2Min < end1Min;
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
  // Estados para drag and drop - implementación simple como el ejemplo
  const [draggedElement, setDraggedElement] = useState<HTMLDivElement | null>(null);
  const [resizingElement, setResizingElement] = useState<HTMLDivElement | null>(null);
  const [startX, setStartX] = useState(0);
  const [startLeft, setStartLeft] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isCopyingShifts, setIsCopyingShifts] = useState(false);
  const [show24Hours, setShow24Hours] = useState(false); // Toggle for 24h vs focused view
  
  // Estados temporales para texto en tiempo real durante drag/resize
  const [tempStartTime, setTempStartTime] = useState<string | null>(null);
  const [tempEndTime, setTempEndTime] = useState<string | null>(null);
  const [tempHours, setTempHours] = useState<number | null>(null);
  const [tempWidth, setTempWidth] = useState<number | null>(null);
  
  // Estado para días colapsados
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());
  
  // Función para toggle del colapso de días
  const toggleDayCollapse = (dayString: string) => {
    setCollapsedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dayString)) {
        newSet.delete(dayString);
      } else {
        newSet.add(dayString);
      }
      return newSet;
    });
  };
  
  const ganttRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Lunes
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 }); // Domingo
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

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
      const employeeShifts = weekShifts.filter(shift => {
        // Usar comparación directa de strings para evitar problemas de zona horaria
        return shift.employeeId === employee.id && shift.date === dayString;
      }).sort((a, b) => {
        const timeA = parseInt(a.startTime.replace(':', ''));
        const timeB = parseInt(b.startTime.replace(':', ''));
        return timeA - timeB;
      });
      
      empAcc[employee.id] = employeeShifts;
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

  // Función para redondear tiempos para visualización
  const roundTimeForDisplay = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':');
    const totalMinutes = parseInt(hours) * 60 + parseFloat(minutes);
    const roundedMinutes = roundToIncrement(totalMinutes, 5);
    return minutesToTime(roundedMinutes);
  };

  const roundToIncrement = (minutes: number, increment: number = 5): number => {
    return Math.round(minutes / increment) * increment;
  };

  // Función centralizada para obtener el ancho de la columna del día
  const getDayColumnWidth = (): number => {
    return isMobile ? 60 : (isCompactMode ? 100 : 120);
  };

  // Función para obtener el espaciado entre barras según el modo
  const getBarSpacing = (): number => {
    if (isCompactMode) {
      return 2; // Espaciado mínimo en modo compacto
    }
    return 35; // Espaciado normal en modo normal
  };

  // Función para determinar si un día está en modo compacto
  const isDayInCompactMode = (dayString: string): boolean => {
    // Si el modo compacto global está activo, todos los días están en modo compacto
    if (isCompactMode) {
      return true;
    }
    // Si el día está colapsado individualmente, también está en modo compacto
    if (collapsedDays.has(dayString)) {
      return true;
    }
    return false;
  };

  // Función para calcular la altura dinámica de las celdas solo en modo compacto
  const calculateCompactCellHeight = (dayString: string): number => {
    // Solo calcular altura dinámica si está en modo compacto
    if (!isDayInCompactMode(dayString)) {
      console.log(`Day ${dayString}: Not in compact mode, returning 120px`);
      return 120; // Altura fija para modo normal
    }

    console.log(`Day ${dayString}: In compact mode, calculating dynamic height`);

    // Contar el número total de barras para este día
    const dayShifts = weekShifts.filter(shift => shift.date === dayString);
    const totalBars = dayShifts.length;
    
    // Debug: Mostrar información detallada del filtro
    console.log(`Day ${dayString}: Filtering shifts for date. Total weekShifts: ${weekShifts.length}, dayShifts found: ${dayShifts.length}`);
    console.log(`Day ${dayString}: Looking for date format: "${dayString}"`);
    
    // Debug: Mostrar TODOS los shifts para verificar datos
    if (dayString === '2025-10-18') {
      console.log(`Day ${dayString}: ALL weekShifts:`, weekShifts.map(s => ({ id: s.id, date: s.date, employeeId: s.employeeId })));
      console.log(`Day ${dayString}: Filtering for exact match: "${dayString}"`);
      const exactMatches = weekShifts.filter(shift => shift.date === dayString);
      console.log(`Day ${dayString}: Exact matches found:`, exactMatches.length);
    }
    
    if (weekShifts.length > 0) {
      console.log(`Day ${dayString}: Sample shift dates:`, weekShifts.slice(0, 3).map(s => s.date));
    }
    if (dayShifts.length > 0) {
      console.log(`Day ${dayString}: Found shifts:`, dayShifts.map(s => ({ id: s.id, date: s.date, employeeId: s.employeeId })));
    }

    if (totalBars === 0) {
      // Si no hay barras, altura mínima compacta para todos los días en modo compacto
      console.log(`Day ${dayString}: No bars, returning 32px`);
      return 32;
    }

    // Usar parámetros compactos para TODOS los días en modo compacto
    const barHeight = 8; // Altura pequeña para todos los días compactos
    const barSpacing = 2; // Espaciado mínimo
    const minHeight = 32; // Mínimo pequeño para todos los días compactos
    const baseHeight = 8; // Altura base pequeña
    const bottomPadding = 5; // Padding inferior mínimo
    
    const calculatedHeight = baseHeight + (totalBars * (barHeight + barSpacing)) + bottomPadding;
    const finalHeight = Math.max(minHeight, calculatedHeight);
    
    console.log(`Day ${dayString}: ${totalBars} bars, barHeight: ${barHeight}px, calculated: ${calculatedHeight}px, final: ${finalHeight}px`);
    
    return finalHeight;
  };

  // Funciones de conversión para texto en tiempo real
  const positionToTime = (position: number, startHour: number, endHour: number): string => {
    const dayColumnWidth = getDayColumnWidth();
    const containerWidth = scrollContainerRef.current?.offsetWidth || 800;
    const availableWidth = containerWidth - dayColumnWidth;
    
    // Calcular la posición relativa (0-1)
    const relativePosition = Math.max(0, Math.min(1, (position - dayColumnWidth) / availableWidth));
    
    // Convertir a horas - usar la misma fórmula que en el cálculo inicial
    const totalHours = endHour - startHour + 1;
    const timeInHours = startHour + (relativePosition * totalHours);
    
    // Redondear a incrementos de 5 minutos
    const timeInMinutes = timeInHours * 60;
    const roundedMinutes = roundToIncrement(timeInMinutes, 5);
    
    return minutesToTime(roundedMinutes);
  };

  // Versión sin redondeo para mantener posiciones exactas al guardar
  const positionToTimeExact = (position: number, startHour: number, endHour: number): string => {
    const dayColumnWidth = getDayColumnWidth();
    const containerWidth = scrollContainerRef.current?.offsetWidth || 800;
    const availableWidth = containerWidth - dayColumnWidth;
    
    // Calcular la posición relativa (0-1)
    const relativePosition = Math.max(0, Math.min(1, (position - dayColumnWidth) / availableWidth));
    
    // Convertir a horas - usar la misma fórmula que en el cálculo inicial
    const totalHours = endHour - startHour + 1;
    const timeInHours = startHour + (relativePosition * totalHours);
    
    // NO redondear para mantener posición exacta
    const timeInMinutes = timeInHours * 60;
    
    return minutesToTime(timeInMinutes);
  };

  const timeToPosition = (timeInHours: number, startHour: number, endHour: number): number => {
    const dayColumnWidth = getDayColumnWidth();
    const containerWidth = scrollContainerRef.current?.offsetWidth || 800;
    const availableWidth = containerWidth - dayColumnWidth;
    
    // NO redondear aquí para evitar saltos visuales
    // Solo redondear en positionToTime cuando se convierte de vuelta a tiempo
    const totalHours = endHour - startHour + 1;
    const relativePosition = (timeInHours - startHour) / totalHours;
    
    // Asegurar que la posición no exceda los límites del día
    const position = dayColumnWidth + (relativePosition * availableWidth);
    const maxPosition = dayColumnWidth + availableWidth;
    
    return Math.min(position, maxPosition);
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

  // Función de inicio de arrastre - implementación simple como el ejemplo
  const startDrag = (e: React.MouseEvent, shift: Shift) => {
    // No iniciar arrastre si estamos redimensionando
    if ((e.target as HTMLElement).classList.contains('resize-handle')) return;
    
        const target = e.currentTarget as HTMLDivElement;
    setDraggedElement(target);
    setContainerRect(target.parentElement?.getBoundingClientRect() || null);
    setStartX(e.clientX);
    setStartLeft(target.offsetLeft);
    
    target.style.opacity = '0.7';
    target.style.zIndex = '1000';
    
    e.preventDefault();
  };

  // Función de inicio de redimensionado - implementación simple como el ejemplo
  const startResize = (e: React.MouseEvent, shift: Shift, isLeft: boolean) => {
    e.stopPropagation();
    const target = e.currentTarget as HTMLDivElement;
    setResizingElement(target);
    setContainerRect(target.parentElement?.getBoundingClientRect() || null);
    setStartX(e.clientX);
    setStartLeft(target.offsetLeft);
    setStartWidth(target.offsetWidth);
    setIsResizingLeft(isLeft);
    
    e.preventDefault();
  };

  const createShift = async (employeeId: string, date: string, hour: number) => {
    const startTime = `${hour.toString().padStart(2, '0')}:00`;
    const endTime = `${(hour + 8).toString().padStart(2, '0')}:00`;
    
    console.log('ScheduleManagement: createShift called with:', { employeeId, date, hour, startTime, endTime });
    
    const errors = await addShift({
      employeeId,
      date,
      startTime,
      endTime,
      hours: 8,
      isPublished: false
    });

    console.log('ScheduleManagement: createShift errors:', errors);

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
      console.log('ScheduleManagement: Creating new shift from form:', shiftForm);
      
      const errors = await addShift({
        employeeId: shiftForm.employeeId,
        date: shiftForm.date,
        startTime: shiftForm.startTime,
        endTime: shiftForm.endTime,
        hours: hours,
        isPublished: false
      });

      console.log('ScheduleManagement: Form shift creation errors:', errors);

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


  const publishWeekShifts = async () => {
    const unpublishedShifts = weekShifts.filter(s => !s.isPublished);
    await publishShifts(unpublishedShifts.map(s => s.id));
    
    // Mostrar notificación de éxito
    addNotification({
      userId: 'manager',
      type: 'schedule_change',
      title: 'Horarios Publicados',
      message: `Se han publicado ${unpublishedShifts.length} turnos para la semana del ${format(weekStart, 'd MMM', { locale: es })} al ${format(weekEnd, 'd MMM', { locale: es })}.`,
      data: {
        publishedShifts: unpublishedShifts.length,
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString()
      }
    });
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
          const newDate = days[dayIndex];
          
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

  // Función para borrar toda la semana visible
  const deleteCurrentWeek = async () => {
    if (!confirm('¿Estás seguro de que quieres borrar todos los turnos de esta semana? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      // Obtener todos los turnos de la semana actual
      const currentWeekShifts = weekShifts.filter(shift => {
        const shiftDate = new Date(shift.date);
        return shiftDate >= startOfWeek(currentWeek, { weekStartsOn: 1 }) && 
               shiftDate <= endOfWeek(currentWeek, { weekStartsOn: 1 });
      });

      // Eliminar todos los turnos de la semana
      for (const shift of currentWeekShifts) {
        await deleteShift(shift.id);
      }

      console.log(`Eliminados ${currentWeekShifts.length} turnos de la semana`);
    } catch (error) {
      console.error('Error al eliminar turnos de la semana:', error);
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
      const dayColumnWidth = getDayColumnWidth();
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

  // Función para calcular duración exacta entre dos tiempos
  const calculateExactDuration = (startTime: string, endTime: string): number => {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const durationMinutes = endMinutes - startMinutes;
    // Usar Math.round para evitar problemas de precisión de punto flotante
    return Math.round(durationMinutes) / 60;
  };

  // Función para detectar problemas de cobertura
  const detectCoverageProblems = (shifts: Shift[], employees: Employee[], storeSchedule: any) => {
    const problems: Array<{
      type: 'gap' | 'conflict' | 'unavailable' | 'overtime' | 'empty_day';
      day: string;
      time: string;
      description: string;
    }> = [];

    // Validar que tenemos datos necesarios
    if (!shifts || !employees || !storeSchedule || !Array.isArray(storeSchedule)) {
      return problems;
    }

    // Agrupar turnos por día
    const shiftsByDay = shifts.reduce((acc: any, shift) => {
      if (!shift || !shift.date) return acc;
      if (!acc[shift.date]) {
        acc[shift.date] = [];
      }
      acc[shift.date].push(shift);
      return acc;
    }, {});

    // Verificar cada día
    Object.entries(shiftsByDay).forEach(([date, dayShifts]) => {
      const dayOfWeek = new Date(date).getDay();
      
      // Obtener horario de la tienda para este día
      const daySchedule = storeSchedule.find((s: any) => s && s.dayOfWeek === dayOfWeek);
      if (!daySchedule || !daySchedule.timeRanges || daySchedule.timeRanges.length === 0) return;

      // Filtrar turnos válidos
      const validShifts = (dayShifts as Shift[]).filter(shift => 
        shift && shift.startTime && shift.endTime && 
        typeof shift.startTime === 'string' && typeof shift.endTime === 'string'
      );

      // Verificar si el día está completamente vacío
      if (validShifts.length === 0) {
        problems.push({
          type: 'empty_day',
          day: new Date(date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' }),
          time: 'Todo el día',
          description: 'Día sin turnos asignados'
        });
        return; // No verificar más problemas si no hay turnos
      }

      // Verificar jornadas excesivas (más de 8 horas por día)
      const employeeDailyHours = validShifts.reduce((acc: any, shift) => {
        if (!acc[shift.employeeId]) {
          acc[shift.employeeId] = 0;
        }
        acc[shift.employeeId] += shift.hours;
        return acc;
      }, {});

      Object.entries(employeeDailyHours).forEach(([employeeId, totalHours]) => {
        const hours = totalHours as number;
        if (hours > 8) {
          const employee = employees.find(emp => emp && emp.id === employeeId);
          problems.push({
            type: 'overtime',
            day: new Date(date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' }),
            time: 'Todo el día',
            description: `${employee?.name || 'Empleado'} trabaja ${Math.floor(hours)}h ${Math.round((hours - Math.floor(hours)) * 60)}m (máximo 8h)`
          });
        }
      });

      // Para horarios partidos, verificar cada rango
      daySchedule.timeRanges.forEach((timeRange: any) => {
        const storeOpen = timeToMinutes(timeRange.openTime);
        const storeClose = timeToMinutes(timeRange.closeTime);

        // Filtrar turnos que se solapan con este rango de horario
        const shiftsInRange = validShifts.filter(shift => {
          const shiftStart = timeToMinutes(shift.startTime);
          const shiftEnd = timeToMinutes(shift.endTime);
          return shiftStart < storeClose && shiftEnd > storeOpen;
        });
        
        const sortedShifts = shiftsInRange.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

        // Verificar huecos en la cobertura (ahora desde 5 minutos)
        let lastEndTime = storeOpen;
        sortedShifts.forEach((shift) => {
          const shiftStart = timeToMinutes(shift.startTime);
          const shiftEnd = timeToMinutes(shift.endTime);

          // Verificar si hay un hueco antes de este turno
          if (shiftStart > lastEndTime) {
            const gapDuration = shiftStart - lastEndTime;
            if (gapDuration >= 5) { // Reportar huecos de 5+ minutos
              problems.push({
                type: 'gap',
                day: new Date(date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' }),
                time: `${minutesToTime(lastEndTime)} - ${minutesToTime(shiftStart)}`,
                description: `Hueco sin cobertura de ${Math.floor(gapDuration / 60)}h ${gapDuration % 60}m`
              });
            }
          }

          lastEndTime = Math.max(lastEndTime, shiftEnd);
        });

        // Verificar si hay hueco al final del día
        if (lastEndTime < storeClose) {
          const gapDuration = storeClose - lastEndTime;
          if (gapDuration >= 5) { // Reportar huecos de 5+ minutos
            problems.push({
              type: 'gap',
              day: new Date(date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' }),
              time: `${minutesToTime(lastEndTime)} - ${minutesToTime(storeClose)}`,
              description: `Hueco sin cobertura de ${Math.floor(gapDuration / 60)}h ${gapDuration % 60}m`
            });
          }
        }

        // Verificar conflictos con horarios no disponibles
        validShifts.forEach((shift) => {
          const employee = employees.find(emp => emp && emp.id === shift.employeeId);
          if (!employee) return;

          const shiftStart = timeToMinutes(shift.startTime);
          const shiftEnd = timeToMinutes(shift.endTime);

          const unavailableTimes = employee.unavailableTimes.filter(ut => 
            ut && ut.dayOfWeek === dayOfWeek
          );
          
          unavailableTimes.forEach((unavailable) => {
            const unavailableStart = timeToMinutes(unavailable.startTime);
            const unavailableEnd = timeToMinutes(unavailable.endTime);

            // Verificar si hay solapamiento
            if (shiftStart < unavailableEnd && shiftEnd > unavailableStart) {
              const overlapStart = Math.max(shiftStart, unavailableStart);
              const overlapEnd = Math.min(shiftEnd, unavailableEnd);
              const overlapDuration = overlapEnd - overlapStart;

              problems.push({
                type: 'unavailable',
                day: new Date(date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' }),
                time: `${minutesToTime(overlapStart)} - ${minutesToTime(overlapEnd)}`,
                description: `${employee.name} asignado durante horario no disponible (${unavailable.startTime}-${unavailable.endTime})`
              });
            }
          });
        });
      });
    });

    return problems;
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

  // Event listeners globales - implementación exacta como el ejemplo HTML
      useEffect(() => {
    const drag = (e: MouseEvent) => {
      if (!draggedElement || !containerRect) return;
      
      const deltaX = e.clientX - startX;
      let newLeft = startLeft + deltaX;
      
      // Limitar dentro del contenedor y respetar las horas visibles
      const dayColumnWidth = getDayColumnWidth(); // Usar la función centralizada
      const availableWidth = containerRect.width - dayColumnWidth;
      const minLeft = dayColumnWidth; // No puede ir más a la izquierda que la columna del día
      const maxLeft = dayColumnWidth + availableWidth - draggedElement.offsetWidth; // No puede salirse del área de horas
      newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));
      
      draggedElement.style.left = newLeft + 'px';
      
      // Calcular tiempos en tiempo real - usar horarios redondeados para consistencia
      const { startHour, endHour } = getStoreHoursRange();
      const newStartTime = positionToTime(newLeft, startHour, endHour);
      const newEndTime = positionToTime(newLeft + draggedElement.offsetWidth, startHour, endHour);
      const newHours = calculateExactDuration(newStartTime, newEndTime);
      
      setTempStartTime(newStartTime);
      setTempEndTime(newEndTime);
      setTempHours(newHours);
      setTempWidth(draggedElement.offsetWidth);
    };

    const stopDrag = () => {
      if (draggedElement) {
        // Guardar los cambios antes de limpiar
        const shiftId = draggedElement.dataset.shiftId;
        if (shiftId) {
          const currentShift = shifts.find(s => s.id === shiftId);
          if (currentShift) {
            const { startHour, endHour } = getStoreHoursRange();
            const newStartTime = positionToTime(draggedElement.offsetLeft, startHour, endHour);
            const newEndTime = positionToTime(draggedElement.offsetLeft + draggedElement.offsetWidth, startHour, endHour);
            const newHours = calculateExactDuration(newStartTime, newEndTime);

            updateShift(shiftId, {
              ...currentShift,
              startTime: newStartTime,
              endTime: newEndTime,
              hours: newHours,
              isPublished: false,
            });
          }
        }

        draggedElement.style.opacity = '1';
        draggedElement.style.zIndex = '';
        setDraggedElement(null);
        
        // Limpiar estados temporales
        setTempStartTime(null);
        setTempEndTime(null);
        setTempHours(null);
        setTempWidth(null);
      }
    };

    const resize = (e: MouseEvent) => {
      if (!resizingElement || !containerRect) return;
      
      const deltaX = e.clientX - startX;
      
      if (isResizingLeft) {
        // Redimensionar desde la izquierda
        let newLeft = startLeft + deltaX;
        let newWidth = startWidth - deltaX;
        
        // Límites - respetar las horas visibles
        const dayColumnWidth = getDayColumnWidth(); // Usar la función centralizada
        const minLeft = dayColumnWidth; // No puede ir más a la izquierda que la columna del día
        const minWidth = 20; // Ancho mínimo
        
        if (newWidth >= minWidth && newLeft >= minLeft) {
          resizingElement.style.left = newLeft + 'px';
          resizingElement.style.width = newWidth + 'px';
          
          // Calcular tiempos en tiempo real - usar horarios redondeados para consistencia
          const { startHour, endHour } = getStoreHoursRange();
          const newStartTime = positionToTime(newLeft, startHour, endHour);
          const newEndTime = positionToTime(newLeft + newWidth, startHour, endHour);
          const newHours = calculateExactDuration(newStartTime, newEndTime);
          
          setTempStartTime(newStartTime);
          setTempEndTime(newEndTime);
          setTempHours(newHours);
          setTempWidth(newWidth);
        }
      } else {
        // Redimensionar desde la derecha
        let newWidth = startWidth + deltaX;
        
        // Límites - respetar las horas visibles
        const dayColumnWidth = getDayColumnWidth(); // Usar la función centralizada
        const availableWidth = containerRect.width - dayColumnWidth;
        const maxWidth = dayColumnWidth + availableWidth - resizingElement.offsetLeft; // No puede salirse del área de horas
        const minWidth = 20; // Ancho mínimo
        newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
        
        resizingElement.style.width = newWidth + 'px';
        
        // Calcular tiempos en tiempo real - usar horarios redondeados para consistencia
        const { startHour, endHour } = getStoreHoursRange();
        const newStartTime = positionToTime(resizingElement.offsetLeft, startHour, endHour);
        const newEndTime = positionToTime(resizingElement.offsetLeft + newWidth, startHour, endHour);
        const newHours = calculateExactDuration(newStartTime, newEndTime);
        
        setTempStartTime(newStartTime);
        setTempEndTime(newEndTime);
        setTempHours(newHours);
        setTempWidth(newWidth);
      }
    };

    const stopResize = () => {
      if (resizingElement) {
        // Guardar los cambios antes de limpiar
        const shiftId = resizingElement.dataset.shiftId;
        if (shiftId) {
          const currentShift = shifts.find(s => s.id === shiftId);
          if (currentShift) {
            const { startHour, endHour } = getStoreHoursRange();
            const newStartTime = positionToTime(resizingElement.offsetLeft, startHour, endHour);
            const newEndTime = positionToTime(resizingElement.offsetLeft + resizingElement.offsetWidth, startHour, endHour);
            const newHours = calculateExactDuration(newStartTime, newEndTime);

            updateShift(shiftId, {
              ...currentShift,
              startTime: newStartTime,
              endTime: newEndTime,
              hours: newHours,
              isPublished: false,
            });
          }
        }

        resizingElement.style.opacity = '1';
        resizingElement.style.zIndex = '';
        setResizingElement(null);
      }
      
      // Limpiar estados temporales
      setTempStartTime(null);
      setTempEndTime(null);
      setTempHours(null);
      setTempWidth(null);
    };

    if (draggedElement) {
      document.addEventListener('mousemove', drag);
      document.addEventListener('mouseup', stopDrag);
    }

    if (resizingElement) {
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResize);
    }

    return () => {
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('mouseup', stopDrag);
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResize);
    };
  }, [draggedElement, resizingElement, startX, startLeft, startWidth, containerRect, isResizingLeft]);

  // Configurar event listeners en los elementos gantt-bar, exactamente como en el ejemplo HTML
  useEffect(() => {
    const ganttBars = document.querySelectorAll('.gantt-bar');
    
    ganttBars.forEach(bar => {
      // Event listener para drag
      const handleMouseDown = (e: Event) => {
        // No iniciar arrastre si estamos redimensionando
        if ((e.target as HTMLElement).classList.contains('resize-handle')) return;
        
        const target = e.currentTarget as HTMLDivElement;
        setDraggedElement(target);
        setContainerRect(target.parentElement?.getBoundingClientRect() || null);
        setStartX((e as MouseEvent).clientX);
        setStartLeft(target.offsetLeft);
        
        target.style.opacity = '0.7';
        target.style.zIndex = '1000';
        
        e.preventDefault();
      };
      
      // Event listeners para resize handles
      const leftHandle = bar.querySelector('.resize-handle-left');
      const rightHandle = bar.querySelector('.resize-handle-right');
      
      if (leftHandle) {
        const handleLeftResize = (e: Event) => {
          e.stopPropagation();
          const target = e.currentTarget as HTMLDivElement;
          setResizingElement(target.closest('.gantt-bar') as HTMLDivElement);
          setContainerRect(target.closest('.gantt-bar')?.parentElement?.getBoundingClientRect() || null);
          setStartX((e as MouseEvent).clientX);
          setStartLeft((target.closest('.gantt-bar') as HTMLDivElement).offsetLeft);
          setStartWidth((target.closest('.gantt-bar') as HTMLDivElement).offsetWidth);
          setIsResizingLeft(true);
          e.preventDefault();
        };
        leftHandle.addEventListener('mousedown', handleLeftResize);
      }
      
      if (rightHandle) {
        const handleRightResize = (e: Event) => {
          e.stopPropagation();
          const target = e.currentTarget as HTMLDivElement;
          setResizingElement(target.closest('.gantt-bar') as HTMLDivElement);
          setContainerRect(target.closest('.gantt-bar')?.parentElement?.getBoundingClientRect() || null);
          setStartX((e as MouseEvent).clientX);
          setStartLeft((target.closest('.gantt-bar') as HTMLDivElement).offsetLeft);
          setStartWidth((target.closest('.gantt-bar') as HTMLDivElement).offsetWidth);
          setIsResizingLeft(false);
          e.preventDefault();
        };
        rightHandle.addEventListener('mousedown', handleRightResize);
      }
      
      bar.addEventListener('mousedown', handleMouseDown);
    });

    return () => {
      ganttBars.forEach(bar => {
        bar.removeEventListener('mousedown', () => {});
        const leftHandle = bar.querySelector('.resize-handle-left');
        const rightHandle = bar.querySelector('.resize-handle-right');
        if (leftHandle) leftHandle.removeEventListener('mousedown', () => {});
        if (rightHandle) rightHandle.removeEventListener('mousedown', () => {});
      });
    };
  }, [shifts]); // Re-ejecutar cuando cambien los shifts

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gestión de Horarios</h2>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={publishWeekShifts}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              weekShifts.filter(s => !s.isPublished).length > 0
                ? 'bg-primary-600 hover:bg-primary-700 text-white'
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            }`}
            disabled={weekShifts.filter(s => !s.isPublished).length === 0}
          >
            <Save className="w-4 h-4 mr-2" />
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
        {/* Fechas de la semana y alerta de turnos pendientes */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
            {format(weekStart, 'd MMM', { locale: es })} - {format(weekEnd, 'd MMM yyyy', { locale: es })}
          </h3>
          {/* Alerta de turnos sin publicar */}
          {(() => {
            const unpublishedCount = weekShifts.filter(s => !s.isPublished).length;
            return unpublishedCount > 0 ? (
              <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">
                  {unpublishedCount} turno{unpublishedCount !== 1 ? 's' : ''} pendiente{unpublishedCount !== 1 ? 's' : ''} de publicación
                </span>
              </div>
            ) : null;
          })()}
        </div>

        {/* Todos los botones distribuidos */}
        <div className="flex items-center justify-between mb-4">
          {/* Lado izquierdo: Navegación de semanas */}
          <div className="flex items-center space-x-3">
          <button
            onClick={() => navigateWeek('prev')}
            className="px-4 py-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-lg transition-colors"
          >
            ← Anterior
          </button>
            <button
              onClick={() => setCurrentWeek(new Date())}
              className="px-4 py-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-lg transition-colors"
            >
              Esta Semana
          </button>
          <button
            onClick={() => navigateWeek('next')}
            className="px-4 py-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-lg transition-colors"
          >
            Siguiente →
          </button>
          </div>

          {/* Centro: Botones Repetir y Borrar Semana */}
          <div className="flex items-center space-x-3">
            <button
              onClick={repeatPreviousWeek}
              disabled={isCopyingShifts}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isCopyingShifts 
                  ? 'bg-white dark:bg-gray-700 opacity-50 cursor-not-allowed text-gray-500 dark:text-gray-400' 
                  : 'bg-primary-600 hover:bg-primary-700 text-white'
              }`}
              title={isCopyingShifts ? "Copiando turnos..." : "Copiar todos los turnos de la semana anterior"}
            >
              <Copy className={`w-4 h-4 mr-2 ${isCopyingShifts ? 'animate-spin' : ''}`} />
              <span>{isCopyingShifts ? 'Copiando...' : 'Repetir'}</span>
            </button>
            
            <button
              onClick={deleteCurrentWeek}
              className="flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-red-600 hover:bg-red-700 text-white"
              title="Borrar todos los turnos de la semana actual"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              <span>Borrar Semana</span>
            </button>
          </div>

          {/* Lado derecho: Ver 24h y Borrador */}
          <div className="flex items-center space-x-3">
            {/* 24h Toggle */}
          <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={show24Hours}
                onChange={(e) => setShow24Hours(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                Ver 24h
              </span>
            </label>
          </div>
          
            {/* Botón de borrador */}
          <button
              onClick={() => setShowUnpublished(!showUnpublished)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showUnpublished 
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300' 
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {showUnpublished ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
              Borrador
          </button>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <div ref={scrollContainerRef} className="overflow-x-auto">
        <div className="min-w-full">
          {/* Header with hours */}
          <div 
            className="grid border-b border-gray-200 dark:border-gray-600" 
            style={{ 
              gridTemplateColumns: `${isMobile ? '60px' : (isCompactMode ? '100px' : '120px')} ${isMobile ? `repeat(${hours.length}, ${mobileHourColumnWidth}px)` : `repeat(${hours.length}, 1fr)`}`,
              minWidth: 'max-content'
            }}
          >
                <div className={`${isMobile ? 'p-1' : (isCompactMode ? 'p-2' : 'p-3')} font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 ${isMobile ? 'text-xs' : (isCompactMode ? 'text-sm' : '')} ${isMobile ? 'sticky left-0 z-20' : ''}`}>Día</div>
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
            {days.map((day) => {
              // Get employees working on this day
              const dayString = format(day, 'yyyy-MM-dd');
              const dayShifts = weekShifts.filter(shift => 
                shift.date === dayString
              );
              
              // Debug: Verificar consistencia entre cálculo de altura y renderizado
              console.log(`RENDER Day ${dayString}: Found ${dayShifts.length} shifts for rendering`);
              const employeesOnDay = Array.from(new Set(dayShifts.map(shift => shift.employeeId)));
              const isHolidayDay = isHoliday(dayString);
              const holiday = getHolidayForDate(dayString);

              return (
                  <div 
                    key={day.toISOString()} 
                    className="grid border-b border-gray-300 dark:border-gray-600 relative" 
                    style={{ 
                      gridTemplateColumns: `${isMobile ? '60px' : (isCompactMode ? '100px' : '120px')} ${isMobile ? `repeat(${hours.length}, ${mobileHourColumnWidth}px)` : `repeat(${hours.length}, 1fr)`}`, 
                      minHeight: collapsedDays.has(dayString) ? '32px' : `${calculateCompactCellHeight(dayString)}px`,
                      minWidth: 'max-content',
                      height: isDayInCompactMode(dayString) ? `${calculateCompactCellHeight(dayString)}px` : 'auto'
                    }}
                  >
                  {/* Day and employees */}
                        <div className={`${collapsedDays.has(dayString) ? 'p-1' : (isMobile ? 'p-1' : (isCompactMode ? 'p-2' : 'p-3'))} border-r border-gray-200 dark:border-gray-600 ${
                          isHolidayDay 
                            ? 'bg-orange-50 dark:bg-orange-900/20' 
                            : 'bg-gray-50 dark:bg-gray-700'
                        } ${isMobile ? 'sticky left-0 z-20' : ''}`}>
                    <div className={`font-medium ${collapsedDays.has(dayString) ? 'mb-0' : (isMobile ? 'mb-0' : 'mb-2')} ${
                      isHolidayDay
                        ? 'text-orange-700 dark:text-orange-300'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {isMobile ? (
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1">
                          <div className="text-xs font-semibold">
                            {format(day, 'EEE', { locale: es })}
                            </div>
                            <button
                              onClick={() => toggleDayCollapse(dayString)}
                              className="text-xs hover:bg-gray-200 dark:hover:bg-gray-600 rounded px-1"
                              title={collapsedDays.has(dayString) ? "Expandir día" : "Colapsar día"}
                            >
                              {collapsedDays.has(dayString) ? '+' : '-'}
                            </button>
                          </div>
                          <div className="text-sm font-bold">
                            {format(day, 'd', { locale: es })}
                          </div>
                          {isHolidayDay && (
                            <div className="text-xs">🎉</div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>
                          {format(day, 'EEE d', { locale: es })}
                          {isHolidayDay && (
                            <span className="ml-2 text-xs">🎉</span>
                          )}
                          </span>
                          <button
                            onClick={() => toggleDayCollapse(dayString)}
                            className="text-sm hover:bg-gray-200 dark:hover:bg-gray-600 rounded px-1"
                            title={collapsedDays.has(dayString) ? "Expandir día" : "Colapsar día"}
                          >
                            {collapsedDays.has(dayString) ? '+' : '-'}
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Solo mostrar nombres de empleados en desktop y si no está colapsado */}
                    {!isMobile && !collapsedDays.has(dayString) && employeesOnDay.map(employeeId => {
                      const employee = employees.find(emp => emp.id === employeeId);
                      const isOnVacation = employee ? isEmployeeOnVacation(employee.id, format(day, 'yyyy-MM-dd')) : false;
                      return employee ? (
                        <div key={employeeId} className={`text-xs mb-1 flex items-center gap-1 ${
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
                        style={{ 
                          minHeight: collapsedDays.has(dayString) ? '32px' : `${calculateCompactCellHeight(dayString)}px`, 
                          height: isDayInCompactMode(dayString) ? `${calculateCompactCellHeight(dayString)}px` : '100%' 
                        }}
                        title={isHolidayDay ? `Feriado: ${holiday?.name}` : ''}
                      >
                        {/* Hour line - solo mostrar si no está colapsado */}
                        {!collapsedDays.has(dayString) && (
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
                        )}
                        
                      </div>
                    );
                  })}

                  {/* Holiday block for this day */}
                  {isHolidayDay && (
                    <div
                      className="absolute rounded text-xs holiday-block"
                      style={{
                        left: `${getDayColumnWidth()}px`, // Start after the day column
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

                  {/* Shift bars for this day */}
                  {(() => {
                    let globalShiftIndex = 0;
                    return employeesOnDay.map((employeeId, empIndex) => {
                      const employeeShifts = groupedShifts[dayString]?.[employeeId] || [];
                      
                      // Sin outlines - barras completamente limpias
                      
                      return employeeShifts.map((shift, shiftIndex) => {
                        const currentIndex = globalShiftIndex++;
                      const employee = employees.find(emp => emp.id === shift.employeeId);
                      const shiftStartHour = parseInt(shift.startTime.split(':')[0]);
                      const shiftStartMinute = parseInt(shift.startTime.split(':')[1]);
                      const shiftEndHour = parseInt(shift.endTime.split(':')[0]);
                      const shiftEndMinute = parseInt(shift.endTime.split(':')[1]);
                      
                      // Calculate position and width based on the hour grid
                      const shiftStartTimeInHours = shiftStartHour + (shiftStartMinute / 60);
                      const shiftEndTimeInHours = shiftEndHour + (shiftEndMinute / 60);
                      const durationInHours = shiftEndTimeInHours - shiftStartTimeInHours;
                      
                      // Position relative to the hour columns using dynamic pixel widths
                      const dayColumnWidth = getDayColumnWidth();
                      const hourDivisor = isMobile ? 2 : 1;
                      
                      // En desktop con 1fr, calcular posición usando las funciones corregidas
                      let left, width;
                      if (!isMobile) {
                        // Usar las funciones timeToPosition para mantener consistencia
                        left = timeToPosition(shiftStartTimeInHours, startHour, endHour) + 2;
                        const rightPosition = timeToPosition(shiftEndTimeInHours, startHour, endHour);
                        width = rightPosition - left - 4;
                        
                        // Calcular availableWidth para validaciones
                        const containerWidth = scrollContainerRef.current?.offsetWidth || 800;
                        const availableWidth = containerWidth - dayColumnWidth;
                        
                        // Validar que la barra no se salga del día - límites más estrictos
                        const maxLeft = dayColumnWidth + availableWidth - 6; // Margen adicional
                        const minLeft = dayColumnWidth + 2;
                        
                        // Asegurar que left esté dentro de los límites
                        left = Math.max(minLeft, Math.min(left, maxLeft - 20)); // 20px mínimo de ancho
                        
                        // Asegurar que width no exceda los límites
                        if (left + width > maxLeft) {
                          width = Math.max(20, maxLeft - left); // Ancho mínimo de 20px
                        }
                        
                        // Validar ancho mínimo
                        if (width < 20) {
                          width = 20;
                        }
                      } else {
                        // En móvil: calcular posición exacta basada en horas reales
                        const columnWidth = mobileHourColumnWidth; // 57px por columna
                        
                        // Calcular posición exacta dentro de la columna de 2 horas
                        const startHourInColumn = shiftStartTimeInHours - Math.floor(shiftStartTimeInHours / 2) * 2;
                        const endHourInColumn = shiftEndTimeInHours - Math.floor(shiftEndTimeInHours / 2) * 2;
                        
                        // Encontrar la columna de inicio (cada columna representa 2 horas)
                        const startColumnIndex = Math.floor(shiftStartTimeInHours / 2) - Math.floor(startHour / 2);
                        const endColumnIndex = Math.floor(shiftEndTimeInHours / 2) - Math.floor(startHour / 2);
                        
                        // Calcular posición exacta dentro de la columna
                        const startPositionInColumn = (startHourInColumn / 2) * columnWidth;
                        const endPositionInColumn = (endHourInColumn / 2) * columnWidth;
                        
                        // Calcular left y width
                        left = dayColumnWidth + (startColumnIndex * columnWidth) + startPositionInColumn + 2;
                        width = ((endColumnIndex - startColumnIndex) * columnWidth) + (endPositionInColumn - startPositionInColumn) - 4;
                        
                        // Validar que la barra no se salga del día en móvil - límites más estrictos
                        const totalColumns = Math.ceil((endHour - startHour + 1) / 2);
                        const maxLeft = dayColumnWidth + (totalColumns * columnWidth) - 6; // Margen adicional
                        const minLeft = dayColumnWidth + 2;
                        
                        // Asegurar que left esté dentro de los límites
                        left = Math.max(minLeft, Math.min(left, maxLeft - 20)); // 20px mínimo de ancho
                        
                        // Asegurar que width no exceda los límites
                        if (left + width > maxLeft) {
                          width = Math.max(20, maxLeft - left); // Ancho mínimo de 20px
                        }
                        
                        // Validar ancho mínimo
                        if (width < 20) {
                          width = 20;
                        }
                      }
                      
                      // Validar conflictos del turno
                      const conflictValidation = validateShiftConflicts(shift);
                      const hasConflict = conflictValidation.hasConflict;
                      const conflictType = conflictValidation.conflictType;
                      
                        // Sin bordes ni outlines - barras completamente limpias
                        let opacity = 1;
                      
                      // Calcular posición vertical usando función inteligente
                      const dayInCompactMode = isDayInCompactMode(dayString);
                      const barHeight = collapsedDays.has(dayString) ? 8 : (dayInCompactMode ? 20 : 32);
                      const spacing = dayInCompactMode ? 2 : 35; // Espaciado entre barras
                      
                      // Calcular posición basada en la barra anterior
                      let baseTop = isHolidayDay ? 55 : 15; // Posición inicial
                      
                      if (dayInCompactMode) {
                        // En modo compacto, calcular posición acumulativa
                        for (let i = 0; i < currentIndex; i++) {
                          baseTop += barHeight + spacing; // Altura de la barra anterior + espaciado
                        }
                      } else {
                        // En modo normal, usar el cálculo original
                        baseTop += currentIndex * spacing;
                      }
                      
                      // Debug: Log para verificar el espaciado
                      if (currentIndex === 0) {
                        console.log(`Day: ${dayString} - Global Compact: ${isCompactMode}, Day Collapsed: ${collapsedDays.has(dayString)}, Day In Compact: ${dayInCompactMode}, barHeight: ${barHeight}, spacing: ${spacing}, baseTop: ${baseTop}`);
                      }
                      const top = baseTop;
                      
                      return (
                              <div
                                key={shift.id}
                                data-shift-id={shift.id}
                                className="gantt-bar absolute rounded text-xs shift-bar select-none"
                          style={{
                            left: `${left}px`,
                            width: `${width}px`,
                            top: `${top}px`,
                            height: `${barHeight}px`, // Altura calculada dinámicamente
                            zIndex: 5,
                            backgroundColor: employee?.color || '#3B82F6',
                            touchAction: 'none',
                            opacity: opacity
                          }}
                          title={`${employee?.name} - ${shift.startTime} a ${shift.endTime} (${formatHours(shift.hours)})${!shift.isPublished ? ' - Sin publicar' : ''}${hasConflict ? ` - CONFLICTO: ${conflictType}` : ''}`}
                          onMouseDown={collapsedDays.has(dayString) ? undefined : (e) => startDrag(e, shift)}
                          onDoubleClick={collapsedDays.has(dayString) ? undefined : (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            openEditShiftModal(shift);
                          }}
                        >
                          {/* Contenido de texto de la barra */}
                            <div className="flex items-center justify-between h-full text-white font-medium text-xs overflow-hidden px-1">
                                  {(() => {
                              // Usar valores temporales si estamos en drag/resize, sino usar valores originales
                              const currentStartTime = (draggedElement?.dataset.shiftId === shift.id || resizingElement?.dataset.shiftId === shift.id) 
                                ? (tempStartTime || shift.startTime) 
                                : shift.startTime;
                              const currentEndTime = (draggedElement?.dataset.shiftId === shift.id || resizingElement?.dataset.shiftId === shift.id) 
                                ? (tempEndTime || shift.endTime) 
                                : shift.endTime;
                              
                              // Redondear tiempos para visualización
                              const displayStartTime = roundTimeForDisplay(currentStartTime);
                              const displayEndTime = roundTimeForDisplay(currentEndTime);
                              const currentHours = (draggedElement?.dataset.shiftId === shift.id || resizingElement?.dataset.shiftId === shift.id) 
                                ? (tempHours || shift.hours) 
                                : shift.hours;
                              const currentWidth = (draggedElement?.dataset.shiftId === shift.id || resizingElement?.dataset.shiftId === shift.id) 
                                ? (tempWidth || width) 
                                : width;
                              
                              // Si el día está colapsado, mostrar solo barra finita
                              if (collapsedDays.has(dayString)) {
                                return <div className="w-1 h-1 bg-white rounded-full"></div>;
                              }
                              
                              // Simplificar contenido basado en el ancho de la barra
                              if (currentWidth < 60) {
                                return <div className="w-1 h-1 bg-white rounded-full"></div>;
                              } else if (currentWidth < 100) {
                                return <span>{employee?.name.split(' ').map(n => n[0]).join('')}</span>;
                              } else {
                                    return (
                                      <>
                                    <div className="text-left">
                                      <div className="font-semibold text-xs">{employee?.name}</div>
                                      <div className="text-xs opacity-90">{displayStartTime} - {displayEndTime}</div>
                                          </div>
                                    <div className="text-right text-xs opacity-75">
                                      {formatHours(currentHours)}
                                          </div>
                                      </>
                                    );
                              }
                                  })()}
                                </div>
                          
                          {/* Handles dentro de la barra, exactamente como en el ejemplo HTML */}
                          {!collapsedDays.has(dayString) && (
                            <>
                              <div className="resize-handle resize-handle-left"></div>
                              <div className="resize-handle resize-handle-right"></div>
                            </>
                          )}
                        </div>
                      );
                    });
                    });
                  })()}

                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Shift Creation Modal */}
      {showShiftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-200 dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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

      {/* Coverage Problems Panel */}
      {(() => {
        const coverageProblems = detectCoverageProblems(weekShifts, employees, storeSchedule);
        return (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Problemas de Cobertura</h3>
            
            {coverageProblems.length === 0 ? (
              <div className="text-center py-4">
                <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">No se detectaron problemas de cobertura</p>
              </div>
            ) : (
              <div className="space-y-1">
                {coverageProblems.map((problem, index) => {
                  const getProblemIcon = () => {
                    switch (problem.type) {
                      case 'gap':
                        return <Clock className="w-4 h-4 text-red-500" />;
                      case 'unavailable':
                        return <X className="w-4 h-4 text-red-500" />;
                      case 'overtime':
                        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
                      case 'empty_day':
                        return <AlertTriangle className="w-4 h-4 text-red-500" />;
                      default:
                        return <AlertTriangle className="w-4 h-4 text-red-500" />;
                    }
                  };

                  const getProblemTitle = () => {
                    switch (problem.type) {
                      case 'gap':
                        return 'Hueco';
                      case 'unavailable':
                        return 'Conflicto';
                      case 'overtime':
                        return 'Jornada excesiva';
                      case 'empty_day':
                        return 'Sin turnos';
                      default:
                        return 'Problema';
                    }
                  };

                  return (
                    <div 
                      key={index}
                      className="flex items-center p-2 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                    >
                      <div className="flex-shrink-0 mr-2">
                        {getProblemIcon()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-red-800 dark:text-red-200">
                            {getProblemTitle()}
                          </span>
                          <span className="text-xs text-red-600 dark:text-red-400 ml-2">
                            {problem.day} - {problem.time}
                          </span>
                        </div>
                        <p className="text-xs text-red-600 dark:text-red-400 truncate">
                          {problem.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

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