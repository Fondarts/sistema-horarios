// Tipos principales del sistema

export type UserRole = 'encargado' | 'empleado';

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  name: string;
}

export interface Employee {
  id: string;
  name: string;
  monthlyLimit: number; // horas mensuales
  unavailableTimes: UnavailableTime[];
  birthday: string; // formato YYYY-MM-DD
  isActive: boolean;
  color: string; // color hexadecimal para las barras del empleado
}

export interface UnavailableTime {
  id: string;
  dayOfWeek: number; // 0 = Domingo, 1 = Lunes, etc.
  startTime: string; // formato HH:MM
  endTime: string; // formato HH:MM
}

export interface StoreSchedule {
  id: string;
  dayOfWeek: number; // 0 = Domingo, 1 = Lunes, etc.
  isOpen: boolean;
  openTime?: string; // formato HH:MM
  closeTime?: string; // formato HH:MM
}

export interface StoreException {
  id: string;
  date: string; // formato YYYY-MM-DD
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
  reason?: string; // ej: "Feriado", "Mantenimiento"
}

export interface Shift {
  id: string;
  employeeId: string;
  date: string; // formato YYYY-MM-DD
  startTime: string; // formato HH:MM
  endTime: string; // formato HH:MM
  hours: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ValidationError {
  type: 'conflict' | 'schedule' | 'limit' | 'availability';
  message: string;
  shiftId?: string;
}

export interface Statistics {
  employeeId: string;
  employeeName: string;
  monthlyAssignedHours: number;
  monthlyLimit: number;
  daysSinceLastWeekendOff: number;
  busiestDayOfWeek: number;
  coverageIssues: CoverageIssue[];
}

export interface CoverageIssue {
  date: string;
  timeSlot: string;
  requiredCoverage: number;
  actualCoverage: number;
}

export interface Template {
  id: string;
  name: string;
  shifts: Omit<Shift, 'id' | 'isPublished' | 'createdAt' | 'updatedAt'>[];
  createdAt: string;
}

// Estados de la aplicación
export interface AppState {
  isOnline: boolean;
  pendingSync: boolean;
  lastSyncTime?: string;
}

// Configuración del Gantt
export interface GanttConfig {
  snapInterval: number; // minutos
  zoomLevel: 'daily' | 'weekly';
  startDate: string;
  endDate: string;
}


