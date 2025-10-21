import React, { useState } from 'react';
import { useSchedule } from '../contexts/ScheduleContext';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useDateFormat } from '../contexts/DateFormatContext';
import { useEmployees } from '../contexts/EmployeeContext';
import { useCompactMode } from '../contexts/CompactModeContext';
import { BarChart3, TrendingUp, Users, ChevronLeft, ChevronRight, AlertTriangle, Calendar, CalendarDays, RefreshCw } from 'lucide-react';
import { Statistics as StatisticsType, Shift, Employee } from '../types';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, subDays, startOfYear, endOfYear, addYears, subYears, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

// Función para formatear horas decimales a formato "Xh Ym"
const formatHours = (decimalHours: number): string => {
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
};

// Función para convertir tiempo a minutos
const timeToMinutes = (time: string | undefined): number => {
  if (!time || typeof time !== 'string') {
    return 0;
  }
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Función para convertir minutos a tiempo
const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};


export function Statistics() {
  const { shifts, storeSchedule } = useSchedule();
  const { employees } = useEmployees();
  const { currentStore, updateStore } = useStore();
  const { isMobile } = useCompactMode();
  const { t } = useLanguage();
  const { formatDate } = useDateFormat();
  
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(new Date());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [employeeOrder, setEmployeeOrder] = useState<string[]>(() => {
    const saved = (currentStore?.settings as any)?.employeeOrder as string[] | undefined;
    return saved && saved.length > 0 ? saved : employees.map(emp => emp.id);
  });

  // Sincronizar cuando cambie la tienda o la lista de empleados
  React.useEffect(() => {
    const saved = (currentStore?.settings as any)?.employeeOrder as string[] | undefined;
    if (saved && saved.length > 0) {
      setEmployeeOrder(saved);
    } else {
      setEmployeeOrder(employees.map(emp => emp.id));
    }
  }, [currentStore?.id, (currentStore?.settings as any)?.employeeOrder, employees.map(e => e.id).join(',')]);

  // Calcular estadísticas básicas (semanal)
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 }); // Lunes
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 }); // Domingo

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedWeek(prev => subWeeks(prev, 1));
    } else {
      setSelectedWeek(prev => addWeeks(prev, 1));
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    } else {
      setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    }
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedYear(prev => subYears(prev, 1));
    } else {
      setSelectedYear(prev => addYears(prev, 1));
    }
  };

  const weeklyShifts = shifts.filter(shift => {
    const shiftDate = new Date(shift.date);
    return shiftDate >= weekStart && 
           shiftDate <= weekEnd &&
           shift.isPublished;
  });

  // Calcular estadísticas anuales
  const yearStart = startOfYear(selectedYear);
  const yearEnd = endOfYear(selectedYear);
  
  const yearlyShifts = shifts.filter(shift => {
    const shiftDate = new Date(shift.date);
    return shiftDate >= yearStart && 
           shiftDate <= yearEnd &&
           shift.isPublished;
  });

  // Estadísticas mensuales para el año seleccionado
  const monthlyStats = eachMonthOfInterval({ start: yearStart, end: yearEnd }).map(month => {
    const monthStart = month;
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    
    const monthShifts = yearlyShifts.filter(shift => {
      const shiftDate = new Date(shift.date);
      return shiftDate >= monthStart && shiftDate <= monthEnd;
    });

    // Calcular horas extras por empleado por semana en este mes
    const employeeWeeklyHours = new Map<string, Map<string, number>>(); // employeeId -> weekKey -> hours
    monthShifts.forEach(shift => {
      const shiftDate = new Date(shift.date);
      const weekStart = startOfWeek(shiftDate, { weekStartsOn: 1 });
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      
      if (!employeeWeeklyHours.has(shift.employeeId)) {
        employeeWeeklyHours.set(shift.employeeId, new Map());
      }
      
      const employeeWeeks = employeeWeeklyHours.get(shift.employeeId)!;
      const current = employeeWeeks.get(weekKey) || 0;
      employeeWeeks.set(weekKey, current + shift.hours);
    });

    const totalExtraHours = Array.from(employeeWeeklyHours.entries()).reduce((total, [employeeId, weeklyHoursMap]) => {
      const employee = employees.find(emp => emp.id === employeeId);
      if (employee) {
        const monthlyExtraHours = Array.from(weeklyHoursMap.values()).reduce((weekTotal, weeklyHours) => {
          const extraHours = Math.max(0, weeklyHours - employee.weeklyLimit);
          return weekTotal + extraHours;
        }, 0);
        return total + monthlyExtraHours;
      }
      return total;
    }, 0);

    // Calcular rotación de personal (contrataciones y desvinculaciones reales)
    const calculateStaffRotation = () => {
      // Obtener empleados del mes anterior
      const previousMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1);
      const previousMonthEnd = new Date(month.getFullYear(), month.getMonth(), 0);
      const previousMonthShifts = yearlyShifts.filter(shift => {
        const shiftDate = new Date(shift.date);
        return shiftDate >= previousMonth && shiftDate <= previousMonthEnd;
      });
      
      const currentMonthEmployees = new Set(monthShifts.map(shift => shift.employeeId));
      const previousMonthEmployees = new Set(previousMonthShifts.map(shift => shift.employeeId));
      
      // Solo considerar como "nuevos" a empleados que nunca trabajaron antes
      const allShiftsBeforeThisMonth = yearlyShifts.filter(shift => {
        const shiftDate = new Date(shift.date);
        return shiftDate < monthStart;
      });
      const employeesWhoWorkedBefore = new Set(allShiftsBeforeThisMonth.map(shift => shift.employeeId));
      
      // Empleados realmente nuevos (nunca trabajaron antes)
      const trulyNewEmployees = Array.from(currentMonthEmployees).filter(id => !employeesWhoWorkedBefore.has(id));
      
      // Empleados que se desvincularon (trabajaron antes pero no en este mes)
      // Solo si no tienen turnos futuros programados
      const allShiftsAfterThisMonth = yearlyShifts.filter(shift => {
        const shiftDate = new Date(shift.date);
        return shiftDate > monthEnd;
      });
      const employeesWhoWorkAfter = new Set(allShiftsAfterThisMonth.map(shift => shift.employeeId));
      
      const departedEmployees = Array.from(employeesWhoWorkedBefore).filter(id => 
        !currentMonthEmployees.has(id) && !employeesWhoWorkAfter.has(id)
      );
      
      const changes = [];
      if (trulyNewEmployees.length > 0) {
        changes.push(`+${trulyNewEmployees.length} nuevo${trulyNewEmployees.length > 1 ? 's' : ''}`);
      }
      if (departedEmployees.length > 0) {
        changes.push(`-${departedEmployees.length} se fue${departedEmployees.length > 1 ? 'ron' : ''}`);
      }
      
      return changes.length > 0 ? changes.join(', ') : null;
    };

    const staffRotation = calculateStaffRotation();

    return {
      month: format(month, 'MMM yyyy', { locale: es }),
      shifts: monthShifts.length,
      totalHours: monthShifts.reduce((total, shift) => total + shift.hours, 0),
      uniqueEmployees: new Set(monthShifts.map(shift => shift.employeeId)).size,
      extraHours: totalExtraHours,
      staffRotation: staffRotation
    };
  });

  // Calcular estadísticas mensuales (para la pestaña mensual)
  const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
  const monthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
  
  const monthlyShifts = shifts.filter(shift => {
    const shiftDate = new Date(shift.date);
    return shiftDate >= monthStart && 
           shiftDate <= monthEnd &&
           shift.isPublished;
  });

  // Estadísticas semanales para el mes seleccionado
  const weeklyStatsForMonth = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 }).map(week => {
    const weekStart = week;
    const weekEnd = endOfWeek(week, { weekStartsOn: 1 });
    
    const weekShifts = monthlyShifts.filter(shift => {
      const shiftDate = new Date(shift.date);
      return shiftDate >= weekStart && shiftDate <= weekEnd;
    });

    // Calcular horas extras por empleado en esta semana
    const employeeWeeklyHours = new Map<string, number>();
    weekShifts.forEach(shift => {
      const current = employeeWeeklyHours.get(shift.employeeId) || 0;
      employeeWeeklyHours.set(shift.employeeId, current + shift.hours);
    });

    const totalExtraHours = Array.from(employeeWeeklyHours.entries()).reduce((total, [employeeId, weeklyHours]) => {
      const employee = employees.find(emp => emp.id === employeeId);
      if (employee) {
        const extraHours = Math.max(0, weeklyHours - employee.weeklyLimit);
        return total + extraHours;
      }
      return total;
    }, 0);

    // Calcular rotación de personal (contrataciones y desvinculaciones reales)
    const calculateStaffRotation = () => {
      // Obtener empleados de la semana anterior
      const previousWeekStart = subDays(weekStart, 7);
      const previousWeekEnd = subDays(weekEnd, 7);
      
      // Buscar empleados que trabajaron en la semana anterior
      const previousWeekShifts = monthlyShifts.filter(shift => {
        const shiftDate = new Date(shift.date);
        return shiftDate >= previousWeekStart && shiftDate <= previousWeekEnd;
      });
      
      // Buscar empleados que trabajaron en esta semana
      const currentWeekShifts = weekShifts;
      
      const currentWeekEmployees = new Set(currentWeekShifts.map(shift => shift.employeeId));
      const previousWeekEmployees = new Set(previousWeekShifts.map(shift => shift.employeeId));
      
      // Solo considerar como "nuevos" a empleados que nunca trabajaron antes (no solo en la semana anterior)
      // Esto requiere verificar si el empleado tiene turnos en un período más amplio
      const allShiftsBeforeThisWeek = monthlyShifts.filter(shift => {
        const shiftDate = new Date(shift.date);
        return shiftDate < weekStart;
      });
      const employeesWhoWorkedBefore = new Set(allShiftsBeforeThisWeek.map(shift => shift.employeeId));
      
      // Empleados realmente nuevos (nunca trabajaron antes)
      const trulyNewEmployees = Array.from(currentWeekEmployees).filter(id => !employeesWhoWorkedBefore.has(id));
      
      // Empleados que se desvincularon (trabajaron antes pero no en esta semana)
      // Solo si no tienen turnos futuros programados
      const allShiftsAfterThisWeek = monthlyShifts.filter(shift => {
        const shiftDate = new Date(shift.date);
        return shiftDate > weekEnd;
      });
      const employeesWhoWorkAfter = new Set(allShiftsAfterThisWeek.map(shift => shift.employeeId));
      
      const departedEmployees = Array.from(employeesWhoWorkedBefore).filter(id => 
        !currentWeekEmployees.has(id) && !employeesWhoWorkAfter.has(id)
      );
      
      const changes = [];
      if (trulyNewEmployees.length > 0) {
        changes.push(`+${trulyNewEmployees.length} nuevo${trulyNewEmployees.length > 1 ? 's' : ''}`);
      }
      if (departedEmployees.length > 0) {
        changes.push(`-${departedEmployees.length} se fue${departedEmployees.length > 1 ? 'ron' : ''}`);
      }
      
      return changes.length > 0 ? changes.join(', ') : null;
    };

    const staffRotation = calculateStaffRotation();

    return {
      week: format(weekStart, 'd MMM', { locale: es }) + ' - ' + format(weekEnd, 'd MMM', { locale: es }),
      shifts: weekShifts.length,
      totalHours: weekShifts.reduce((total, shift) => total + shift.hours, 0),
      uniqueEmployees: new Set(weekShifts.map(shift => shift.employeeId)).size,
      extraHours: totalExtraHours,
      staffRotation: staffRotation
    };
  });

  // Función para reordenar empleados
  const reorderEmployees = async (startIndex: number, endIndex: number) => {
    const newOrder = Array.from(employeeOrder);
    const [removed] = newOrder.splice(startIndex, 1);
    newOrder.splice(endIndex, 0, removed);
    setEmployeeOrder(newOrder);
    // Persistir en servidor por tienda
    if (currentStore?.id) {
      try {
        await updateStore(currentStore.id, {
          settings: {
            ...(currentStore.settings || {}),
            employeeOrder: newOrder
          }
        });
      } catch (e) {
        console.error('Error saving employee order', e);
      }
    }
  };

  // Funciones de drag & drop
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      reorderEmployees(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Obtener empleados en el orden personalizado
  const orderedEmployees = employeeOrder
    .map(id => employees.find(emp => emp.id === id))
    .filter(Boolean) as Employee[];

  const employeeStats: StatisticsType[] = orderedEmployees.map(employee => {
    const employeeShifts = weeklyShifts.filter(s => s.employeeId === employee.id);
    const assignedHours = employeeShifts.reduce((total, shift) => total + shift.hours, 0);
    
    // Calcular días desde último fin de semana completamente libre (sábado Y domingo sin turnos)
    const calculateDaysSinceLastWeekendOff = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalizar a medianoche
      
      // Obtener todos los turnos del empleado (no solo de esta semana)
      const allEmployeeShifts = shifts.filter(s => s.employeeId === employee.id && s.isPublished);
      
      console.log(`=== Calculando para ${employee.name} ===`);
      console.log(`Hoy: ${today.toISOString().split('T')[0]}`);
      console.log(`Total turnos: ${allEmployeeShifts.length}`);
      console.log(`Fechas de turnos:`, Array.from(allEmployeeShifts.map(shift => shift.date)));
      console.log(`Turnos recientes (últimos 10):`, allEmployeeShifts.slice(0, 10).map(shift => `${formatDate(new Date(shift.date))}`));
      
      if (allEmployeeShifts.length === 0) {
        console.log(`Sin turnos, retornando 0`);
        return 0; // Si no tiene turnos, no hay días desde último fin de semana
      }
      
      // Crear un Set de fechas con turnos para búsqueda rápida
      const shiftDates = new Set(allEmployeeShifts.map(shift => shift.date));
      
      // Verificar fines de semana recientes específicamente usando date-fns
      console.log(`Verificando fines de semana recientes:`);
      for (let i = 0; i < 4; i++) {
        // Calcular el domingo de la semana i hacia atrás usando date-fns
        const sunday = endOfWeek(subWeeks(today, i), { weekStartsOn: 1 }); // Lunes = 1, Domingo = 0
        const saturday = subDays(sunday, 1);
        
        const saturdayStr = format(saturday, 'yyyy-MM-dd');
        const sundayStr = format(sunday, 'yyyy-MM-dd');
        
        const hasShiftOnSaturday = shiftDates.has(saturdayStr);
        const hasShiftOnSunday = shiftDates.has(sundayStr);
        
        console.log(`  Semana ${i + 1}: ${saturdayStr} (Sáb) - ${sundayStr} (Dom): Sábado=${hasShiftOnSaturday ? 'SÍ' : 'NO'}, Domingo=${hasShiftOnSunday ? 'SÍ' : 'NO'}`);
      }
      
      // Buscar hacia atrás día por día hasta encontrar un fin de semana completamente libre
      for (let daysBack = 0; daysBack < 90; daysBack++) {
        const checkDate = subDays(today, daysBack);
        
        // Si llegamos a un domingo, verificar el fin de semana completo
        if (checkDate.getDay() === 0) { // Domingo
          const sunday = checkDate;
          const saturday = subDays(sunday, 1);
          
          const saturdayStr = format(saturday, 'yyyy-MM-dd');
          const sundayStr = format(sunday, 'yyyy-MM-dd');
          
          // Verificar si tiene turnos en sábado o domingo
          const hasShiftOnSaturday = shiftDates.has(saturdayStr);
          const hasShiftOnSunday = shiftDates.has(sundayStr);
          
          console.log(`Revisando fin de semana ${saturdayStr} - ${sundayStr}: Sábado=${hasShiftOnSaturday ? 'SÍ' : 'NO'}, Domingo=${hasShiftOnSunday ? 'SÍ' : 'NO'}`);
          
          // Si NO tiene turnos ni el sábado ni el domingo, es un fin de semana completamente libre
          if (!hasShiftOnSaturday && !hasShiftOnSunday) {
            console.log(`¡Fin de semana libre encontrado! ${saturdayStr} - ${sundayStr}, días desde entonces: ${daysBack}`);
            return daysBack; // Retornar los días desde ese domingo
          }
        }
      }
      
      // Si no encontramos ningún fin de semana completamente libre en 3 meses,
      // buscar el último fin de semana que trabajó
      for (let daysBack = 0; daysBack < 90; daysBack++) {
        const checkDate = subDays(today, daysBack);
        
        // Si llegamos a un domingo, verificar si trabajó ese fin de semana
        if (checkDate.getDay() === 0) { // Domingo
          const sunday = checkDate;
          const saturday = subDays(sunday, 1);
          
          const saturdayStr = format(saturday, 'yyyy-MM-dd');
          const sundayStr = format(sunday, 'yyyy-MM-dd');
          
          // Verificar si tiene turnos en sábado o domingo
          const hasShiftOnSaturday = shiftDates.has(saturdayStr);
          const hasShiftOnSunday = shiftDates.has(sundayStr);
          
          // Si trabajó al menos uno de los dos días, retornar los días desde ese domingo
          if (hasShiftOnSaturday || hasShiftOnSunday) {
            console.log(`Último fin de semana trabajado: ${saturdayStr} - ${sundayStr}, días desde entonces: ${daysBack}`);
            return daysBack;
          }
        }
      }
      
      return 0; // Si no encuentra nada en 3 meses
    };
    
    const daysSinceLastWeekendOff = calculateDaysSinceLastWeekendOff();
    
    // Calcular día más ocupado
    const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // Domingo a Sábado
    employeeShifts.forEach(shift => {
      const dayOfWeek = new Date(shift.date).getDay();
      dayCounts[dayOfWeek] += shift.hours;
    });
    const busiestDay = dayCounts.indexOf(Math.max(...dayCounts));

    const extraHours = Math.max(0, assignedHours - employee.weeklyLimit);

    // Calcular consistencia horaria (frecuencia de cambios en horarios de turnos)
    const calculateEmployeeRotation = () => {
      // Obtener todos los turnos del empleado en las últimas 4 semanas
      const fourWeeksAgo = subDays(new Date(), 28);
      const recentShifts = shifts.filter(s => 
        s.employeeId === employee.id && 
        s.isPublished && 
        new Date(s.date) >= fourWeeksAgo
      ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      if (recentShifts.length <= 1) return 0;

      // Contar cambios en horarios (diferentes combinaciones de startTime-endTime)
      const scheduleChanges = new Set<string>();
      recentShifts.forEach(shift => {
        const scheduleKey = `${shift.startTime}-${shift.endTime}`;
        scheduleChanges.add(scheduleKey);
      });

      // Calcular consistencia horaria (número de horarios únicos / total de turnos)
      // Menor porcentaje = mayor consistencia, mayor porcentaje = menor consistencia
      const rotationFrequency = (scheduleChanges.size / recentShifts.length) * 100;
      
      return Math.round(rotationFrequency);
    };

    const employeeRotation = calculateEmployeeRotation();

    return {
      employeeId: employee.id,
      employeeName: employee.name,
      weeklyAssignedHours: assignedHours,
      weeklyLimit: employee.weeklyLimit,
      extraHours: extraHours,
      daysSinceLastWeekendOff: daysSinceLastWeekendOff,
      busiestDayOfWeek: busiestDay,
      employeeRotation: employeeRotation,
      coverageIssues: [] // Placeholder
    };
  });

  const daysOfWeek = [
    t('sunday'), t('monday'), t('tuesday'), t('wednesday'), 
    t('thursday'), t('friday'), t('saturday')
  ];


  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('statistics')}</h2>
        <p className="text-gray-600 dark:text-gray-400">{t('coverageAndWorkloadMetrics')}</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className={`-mb-px flex ${isMobile ? 'space-x-2' : 'space-x-8'}`}>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'weekly'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Calendar className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} inline mr-1`} />
            {isMobile ? 'Semanal' : 'Vista Semanal'}
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'monthly'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Calendar className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} inline mr-1`} />
            {isMobile ? 'Mensual' : 'Vista Mensual'}
          </button>
          <button
            onClick={() => setActiveTab('yearly')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'yearly'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <CalendarDays className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} inline mr-1`} />
            {isMobile ? 'Anual' : 'Vista Anual'}
          </button>
        </nav>
      </div>

      {/* Weekly View */}
      {activeTab === 'weekly' && (
        <>
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
            ← {t('previous')}
          </button>
          <button
            onClick={() => navigateWeek('next')}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm rounded transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
          >
            {t('next')} →
          </button>
          <button
            onClick={() => setSelectedWeek(new Date())}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm rounded transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
          >
            {t('thisWeek')}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-3' : 'grid-cols-1 md:grid-cols-5'}`}>
        <div className="card">
          <div className={`${isMobile ? 'text-center' : 'flex items-center'}`}>
            <Users className={`${isMobile ? 'w-6 h-6 mx-auto mb-2' : 'w-8 h-8 mr-3'} text-primary-600`} />
            <div>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400`}>{t('activeEmployees')}</p>
              <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900 dark:text-gray-100`}>{employees.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className={`${isMobile ? 'text-center' : 'flex items-center'}`}>
            <BarChart3 className={`${isMobile ? 'w-6 h-6 mx-auto mb-2' : 'w-8 h-8 mr-3'} text-green-600`} />
            <div>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400`}>{t('shiftsThisWeek')}</p>
              <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900 dark:text-gray-100`}>{weeklyShifts.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className={`${isMobile ? 'text-center' : 'flex items-center'}`}>
            <TrendingUp className={`${isMobile ? 'w-6 h-6 mx-auto mb-2' : 'w-8 h-8 mr-3'} text-blue-600`} />
            <div>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400`}>{t('totalHours')}</p>
              <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900 dark:text-gray-100`}>
                {formatHours(weeklyShifts.reduce((total, shift) => total + shift.hours, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className={`${isMobile ? 'text-center' : 'flex items-center'}`}>
            <AlertTriangle className={`${isMobile ? 'w-6 h-6 mx-auto mb-2' : 'w-8 h-8 mr-3'} text-red-600`} />
            <div>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400`}>Horas Extras</p>
              <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-red-600`}>
                {formatHours(employeeStats.reduce((total, stat) => total + stat.extraHours, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className={`${isMobile ? 'text-center' : 'flex items-center'}`}>
            <RefreshCw className={`${isMobile ? 'w-6 h-6 mx-auto mb-2' : 'w-8 h-8 mr-3'} text-purple-600`} />
            <div>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400`}>Consistencia Promedio</p>
              <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-purple-600`}>
                {employeeStats.length > 0 ? Math.round(employeeStats.reduce((total, stat) => total + stat.employeeRotation, 0) / employeeStats.length) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Statistics */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">{t('statisticsByEmployee')}</h3>
        
        {isMobile ? (
          // Vista móvil con tarjetas
          <div className="space-y-4">
            {employeeStats.map((stat, index) => {
              const utilization = (stat.weeklyAssignedHours / stat.weeklyLimit) * 100;
              const isNearLimit = utilization > 90;
              const isOverLimit = utilization > 100;

              return (
                <div key={stat.employeeId} className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
                  {/* Header del empleado */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-50">{stat.employeeName}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatHours(stat.weeklyAssignedHours)} / {formatHours(stat.weeklyLimit)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${isOverLimit ? 'text-red-600' : isNearLimit ? 'text-yellow-600' : 'text-green-600'}`}>
                        {Math.round(utilization)}%
                      </div>
                      {stat.extraHours > 0 && (
                        <div className="text-xs text-red-600">
                          +{formatHours(stat.extraHours)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Métricas adicionales */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Día más ocupado:</span>
                      <div className="font-medium text-gray-900 dark:text-gray-50">
                        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][stat.busiestDayOfWeek]}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Sin descanso:</span>
                      <div className="font-medium text-gray-900 dark:text-gray-50">
                        {stat.daysSinceLastWeekendOff} días
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500 dark:text-gray-400">Consistencia:</span>
                      <div className="font-medium text-gray-900 dark:text-gray-50">
                        {stat.employeeRotation}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Vista de escritorio con tabla
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('employee')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('assignedHours')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('weeklyCap')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('utilization')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Horas Extras
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('busiestDay')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('daysWithoutWeekend')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Consistencia Horaria
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-200 dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {employeeStats.map((stat, index) => {
                const utilization = (stat.weeklyAssignedHours / stat.weeklyLimit) * 100;
                const isNearLimit = utilization > 90;
                const isOverLimit = utilization > 100;
                const isDragging = draggedIndex === index;

                return (
                  <tr 
                    key={stat.employeeId}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`cursor-move transition-colors ${
                      isDragging ? 'opacity-50 bg-blue-100 dark:bg-blue-900' : 
                      'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="mr-2 text-gray-400 dark:text-gray-500 cursor-move">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                          </svg>
                        </div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">{stat.employeeName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900 dark:text-gray-100">{formatHours(stat.weeklyAssignedHours)}</span>
                        {isOverLimit && (
                          <AlertTriangle className="w-4 h-4 text-red-500 ml-2" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {stat.weeklyLimit}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className={`h-2 rounded-full ${
                              isOverLimit ? 'bg-red-500' : 
                              isNearLimit ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          />
                        </div>
                        <span className={`text-sm ${
                          isOverLimit ? 'text-red-600' : 
                          isNearLimit ? 'text-yellow-600' : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {utilization.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-sm ${stat.extraHours > 0 ? 'text-red-600 font-semibold' : 'text-gray-900 dark:text-gray-100'}`}>
                          {formatHours(stat.extraHours)}
                        </span>
                        {stat.extraHours > 0 && (
                          <AlertTriangle className="w-4 h-4 text-red-500 ml-2" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {daysOfWeek[stat.busiestDayOfWeek]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {stat.daysSinceLastWeekendOff} {t('days')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      <div className="flex items-center">
                        <span className={`text-sm ${stat.employeeRotation > 50 ? 'text-red-600 font-semibold' : stat.employeeRotation > 30 ? 'text-orange-600' : 'text-green-600'}`}>
                          {stat.employeeRotation}%
                        </span>
                        {stat.employeeRotation > 50 && (
                          <AlertTriangle className="w-4 h-4 text-red-500 ml-2" />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        )}
      </div>
        </>
      )}

      {/* Monthly View */}
      {activeTab === 'monthly' && (
        <>
          {/* Month Navigation */}
          <div className="card">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {format(monthStart, 'MMMM yyyy', { locale: es })}
              </h3>
            </div>

            <div className="flex justify-center items-center space-x-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm rounded transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
              >
                ← {t('previous')}
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm rounded transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
              >
                {t('next')} →
              </button>
              <button
                onClick={() => setSelectedMonth(new Date())}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm rounded transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
              >
                Este Mes
              </button>
            </div>
          </div>

          {/* Monthly Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="card">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-primary-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Empleados Activos</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {new Set(monthlyShifts.map(shift => shift.employeeId)).size}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <BarChart3 className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Turnos del Mes</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{monthlyShifts.length}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Horas Totales</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatHours(monthlyShifts.reduce((total, shift) => total + shift.hours, 0))}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Promedio Semanal</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatHours(monthlyShifts.reduce((total, shift) => total + shift.hours, 0) / 4)}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Horas Extras</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatHours(monthlyShifts.reduce((total, shift) => {
                      const employee = employees.find(emp => emp.id === shift.employeeId);
                      if (!employee) return total;
                      
                      // Calcular horas extras por semana, no por turno
                      const shiftDate = new Date(shift.date);
                      const weekStart = startOfWeek(shiftDate, { weekStartsOn: 1 });
                      const weekEnd = endOfWeek(shiftDate, { weekStartsOn: 1 });
                      
                      // Obtener todos los turnos del empleado en esa semana
                      const weekShifts = monthlyShifts.filter(s => {
                        const sDate = new Date(s.date);
                        return s.employeeId === shift.employeeId && 
                               sDate >= weekStart && sDate <= weekEnd;
                      });
                      
                      const weeklyHours = weekShifts.reduce((sum, s) => sum + s.hours, 0);
                      const weeklyExtraHours = Math.max(0, weeklyHours - employee.weeklyLimit);
                      
                      // Solo contar las horas extras de la primera vez que procesamos esta semana
                      const isFirstShiftOfWeek = weekShifts[0]?.id === shift.id;
                      return total + (isFirstShiftOfWeek ? weeklyExtraHours : 0);
                    }, 0))}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Breakdown for the Month */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Desglose Semanal del Mes</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Semana
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Turnos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Horas Totales
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Empleados Activos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Promedio por Empleado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Horas Extras
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Rotación de Personal
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-200 dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {weeklyStatsForMonth.map((stat, index) => (
                    <tr key={index} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {stat.week}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {stat.shifts}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatHours(stat.totalHours)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {stat.uniqueEmployees}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {stat.uniqueEmployees > 0 ? formatHours(stat.totalHours / stat.uniqueEmployees) : '0h'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatHours(stat.extraHours || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {stat.staffRotation ? (
                          <div className="flex flex-wrap gap-1">
                            {stat.staffRotation.split(', ').map((change, index) => {
                              const isNew = change.startsWith('+');
                              const isDeparture = change.startsWith('-');
                              return (
                                <span
                                  key={index}
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    isNew 
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                      : isDeparture 
                                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                  }`}
                                >
                                  {change}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">Sin cambios</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Yearly View */}
      {activeTab === 'yearly' && (
        <>
          {/* Year Navigation */}
          <div className="card">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {format(yearStart, 'yyyy', { locale: es })}
              </h3>
            </div>

            <div className="flex justify-center items-center space-x-2">
              <button
                onClick={() => navigateYear('prev')}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm rounded transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
              >
                ← {t('previous')}
              </button>
              <button
                onClick={() => navigateYear('next')}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm rounded transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
              >
                {t('next')} →
              </button>
              <button
                onClick={() => setSelectedYear(new Date())}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm rounded transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
              >
                Este Año
              </button>
            </div>
          </div>

          {/* Yearly Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="card">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-primary-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Empleados Activos</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {new Set(yearlyShifts.map(shift => shift.employeeId)).size}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <BarChart3 className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Turnos del Año</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{yearlyShifts.length}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Horas Totales</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatHours(yearlyShifts.reduce((total, shift) => total + shift.hours, 0))}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <CalendarDays className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Promedio Mensual</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatHours(yearlyShifts.reduce((total, shift) => total + shift.hours, 0) / 12)}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Horas Extras</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatHours(yearlyShifts.reduce((total, shift) => {
                      const employee = employees.find(emp => emp.id === shift.employeeId);
                      if (!employee) return total;
                      
                      // Calcular horas extras por semana, no por turno
                      const shiftDate = new Date(shift.date);
                      const weekStart = startOfWeek(shiftDate, { weekStartsOn: 1 });
                      const weekEnd = endOfWeek(shiftDate, { weekStartsOn: 1 });
                      
                      // Obtener todos los turnos del empleado en esa semana
                      const weekShifts = yearlyShifts.filter(s => {
                        const sDate = new Date(s.date);
                        return s.employeeId === shift.employeeId && 
                               sDate >= weekStart && sDate <= weekEnd;
                      });
                      
                      const weeklyHours = weekShifts.reduce((sum, s) => sum + s.hours, 0);
                      const weeklyExtraHours = Math.max(0, weeklyHours - employee.weeklyLimit);
                      
                      // Solo contar las horas extras de la primera vez que procesamos esta semana
                      const isFirstShiftOfWeek = weekShifts[0]?.id === shift.id;
                      return total + (isFirstShiftOfWeek ? weeklyExtraHours : 0);
                    }, 0))}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Breakdown */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Desglose Mensual</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Mes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Turnos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Horas Totales
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Empleados Activos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Promedio por Empleado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Horas Extras
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Rotación de Personal
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-200 dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {monthlyStats.map((stat, index) => (
                    <tr key={index} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {stat.month}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {stat.shifts}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatHours(stat.totalHours)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {stat.uniqueEmployees}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {stat.uniqueEmployees > 0 ? formatHours(stat.totalHours / stat.uniqueEmployees) : '0h'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatHours(stat.extraHours || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {stat.staffRotation ? (
                          <div className="flex flex-wrap gap-1">
                            {stat.staffRotation.split(', ').map((change, index) => {
                              const isNew = change.startsWith('+');
                              const isDeparture = change.startsWith('-');
                              return (
                                <span
                                  key={index}
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    isNew 
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                      : isDeparture 
                                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                  }`}
                                >
                                  {change}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">Sin cambios</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </div>
  );
}

