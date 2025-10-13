import React, { useState, useRef, useEffect } from 'react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { Eye, EyeOff, Save } from 'lucide-react';
import { useSchedule } from '../contexts/ScheduleContext';
import { useEmployees } from '../contexts/EmployeeContext';
import { Shift } from '../types';

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
    endTime: '17:00'
  });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [draggedShift, setDraggedShift] = useState<Shift | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
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

  const { startHour, endHour } = getStoreHoursRange();
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

  // Filtrar turnos de la semana actual
  const weekShifts = shifts.filter(shift => {
    const shiftDate = new Date(shift.date);
    return shiftDate >= weekStart && shiftDate <= weekEnd && 
           (showUnpublished || shift.isPublished);
  });

  const handleMouseDown = (e: React.MouseEvent, shift: Shift) => {
    setDraggedShift(shift);
    setDragStart({ x: e.clientX, y: e.clientY });
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedShift || !ganttRef.current) return;

    const rect = ganttRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calcular nueva posición basada en la grilla
    const dayWidth = rect.width / 7;
    const hourHeight = rect.height / 24;

    const newDayIndex = Math.floor(x / dayWidth);
    const newHour = Math.floor(y / hourHeight);

    if (newDayIndex >= 0 && newDayIndex < 7 && newHour >= 0 && newHour < 24) {
      const newDate = addDays(weekStart, newDayIndex);
      const newStartTime = `${newHour.toString().padStart(2, '0')}:00`;
      const newEndTime = `${(newHour + draggedShift.hours).toString().padStart(2, '0')}:00`;

      // Actualizar turno en tiempo real
      updateShift(draggedShift.id, {
        date: format(newDate, 'yyyy-MM-dd'),
        startTime: newStartTime,
        endTime: newEndTime
      });
    }
  };

  const handleMouseUp = () => {
    setDraggedShift(null);
  };

  const createShift = (employeeId: string, date: string, hour: number) => {
    const startTime = `${hour.toString().padStart(2, '0')}:00`;
    const endTime = `${(hour + 8).toString().padStart(2, '0')}:00`;
    
    const errors = addShift({
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
      endTime: '17:00'
    });
    setShowShiftModal(true);
  };

  const openEditShiftModal = (shift: Shift) => {
    setModalEmployee(employees.find(emp => emp.id === shift.employeeId) || null);
    setEditingShift(shift);
    setShiftForm({
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime
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
      endTime: '17:00'
    });
  };

  const handleCreateOrUpdateShift = () => {
    if (!modalEmployee) return;

    const startHour = parseInt(shiftForm.startTime.split(':')[0]);
    const endHour = parseInt(shiftForm.endTime.split(':')[0]);
    const hours = endHour - startHour;

    if (editingShift) {
      // Actualizar turno existente
      updateShift(editingShift.id, {
        date: shiftForm.date,
        startTime: shiftForm.startTime,
        endTime: shiftForm.endTime,
        hours: hours
      });
    } else {
      // Crear nuevo turno
      const errors = addShift({
        employeeId: modalEmployee.id,
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

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 0.5));
  };

  const resetZoom = () => {
    setZoomLevel(1);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => addDays(prev, direction === 'next' ? 7 : -7));
  };

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
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Header with hours */}
          <div className="grid border-b border-gray-200" style={{ gridTemplateColumns: `200px repeat(${hours.length}, 60px)` }}>
            <div className="p-3 font-medium text-gray-700 bg-gray-50">Día / Empleado</div>
            {hours.map((hour) => (
              <div key={hour} className="p-2 text-center border-l border-gray-200 bg-gray-50" style={{ width: '60px' }}>
                <div className="text-xs text-gray-600">
                  {hour}:00
                </div>
              </div>
            ))}
          </div>

          {/* Gantt Grid */}
          <div
            ref={ganttRef}
            className="relative"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {weekDays.map((day) => {
              // Get employees working on this day
              const dayShifts = weekShifts.filter(shift => 
                shift.date === format(day, 'yyyy-MM-dd')
              );
              const employeesOnDay = Array.from(new Set(dayShifts.map(shift => shift.employeeId)));
              
              return (
                <div key={day.toISOString()} className="grid border-b border-gray-100 relative" style={{ 
                  gridTemplateColumns: `200px repeat(${hours.length}, 60px)`, 
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
                  {hours.map((hour) => (
                    <div key={`${day.toISOString()}-${hour}`} className="relative border-r border-gray-200" style={{ height: '120px', width: '60px' }}>
                      {/* Hour line */}
                      <div className="absolute w-full border-t border-gray-100" style={{ top: '50%' }}>
                        <div className="text-xs text-gray-400 px-1">
                          {hour}:00
                        </div>
                      </div>
                    </div>
                  ))}

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
                    
                    // Position relative to the hour columns using fixed pixel widths
                    // The grid has 200px for day/employee + hour columns (60px each)
                    // Calculate position based on the actual shift start time relative to the visible range
                    const left = 200 + ((shiftStartTimeInHours - startHour) * 60); // 200px + (actual shift time - visible start time) * 60px
                    const width = durationInHours * 60; // hours * 60px
                    const top = shiftIndex * 35 + 5;
                    
                    return (
                      <div
                        key={shift.id}
                        className="absolute rounded cursor-move text-white text-xs p-1"
                        style={{
                          left: `${left}px`,
                          width: `${width}px`,
                          top: `${top}px`,
                          height: '32px',
                          zIndex: 10,
                          backgroundColor: employee?.color || '#3B82F6'
                        }}
                        onMouseDown={(e) => handleMouseDown(e, shift)}
                        onDoubleClick={() => openEditShiftModal(shift)}
                      >
                        <div className="font-medium text-xs truncate">
                          {employee?.name}
                        </div>
                        <div className="text-xs opacity-90 truncate">
                          {shift.startTime}-{shift.endTime}
                        </div>
                        <div className="text-xs opacity-75 truncate">
                          {shift.hours}h
                        </div>
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
      {showShiftModal && modalEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingShift ? 'Editar Turno' : 'Crear Turno'} - {modalEmployee.name}
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
                    Hora de inicio
                  </label>
                  <input
                    type="time"
                    value={shiftForm.startTime}
                    onChange={(e) => setShiftForm(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora de fin
                  </label>
                  <input
                    type="time"
                    value={shiftForm.endTime}
                    onChange={(e) => setShiftForm(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
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