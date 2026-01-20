// Tipos principales del sistema

export type UserRole = 'encargado' | 'empleado' | 'distrito'; // DEPRECATED: usar EmployeeRole
export type EmployeeRole = 'region' | 'distrito' | 'encargado' | 'empleado' | 'it';

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  name: string;
}

export interface Employee {
  id: string;
  name: string; // Nombre completo del empleado
  username: string; // Usuario único para login
  password: string; // Contraseña para login
  weeklyLimit: number; // horas semanales
  unavailableTimes: UnavailableTime[];
  birthday: string; // formato YYYY-MM-DD
  isActive: boolean;
  color: string; // color hexadecimal para las barras del empleado
  role: EmployeeRole; // rol del empleado (region | distrito | encargado | empleado | it)
  isManager?: boolean; // para compatibilidad con el sistema multitiendas
  storeId?: string; // ID de la tienda a la que pertenece el empleado
  monthlyHoursLimit?: number; // límite mensual de horas
  unavailableHours?: UnavailableTime[]; // horas no disponibles (alias para compatibilidad)
  vacationDaysPerYear?: number; // días de vacaciones por año
  startDate?: string; // fecha de inicio en la empresa (formato YYYY-MM-DD)
  terminationDate?: string; // fecha de baja (formato YYYY-MM-DD)
  // Campos para traspasos
  transferHistory?: EmployeeTransfer[]; // historial de traspasos
  currentTransfer?: EmployeeTransfer; // traspaso actual si es temporal
  // Campos legacy para compatibilidad (se pueden remover después)
  pin?: string; // DEPRECATED: usar username/password
}

export interface EmployeeTransfer {
  id: string;
  employeeId: string;
  fromStoreId: string;
  toStoreId: string;
  transferDate: string; // formato YYYY-MM-DD
  returnDate?: string; // formato YYYY-MM-DD (solo para traspasos temporales)
  isTemporary: boolean;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface UnavailableTime {
  id: string;
  dayOfWeek: number; // 0 = Domingo, 1 = Lunes, etc.
  startTime: string; // formato HH:MM
  endTime: string; // formato HH:MM
}

export interface TimeRange {
  id: string;
  openTime: string; // formato HH:MM
  closeTime: string; // formato HH:MM
}

export interface StoreSchedule {
  id: string;
  dayOfWeek: number; // 0 = Domingo, 1 = Lunes, etc.
  isOpen: boolean;
  timeRanges: TimeRange[]; // Array de rangos de horarios
  // Mantener compatibilidad con versión anterior
  openTime?: string; // formato HH:MM (DEPRECATED)
  closeTime?: string; // formato HH:MM (DEPRECATED)
}

export interface StoreException {
  id: string;
  date: string; // formato YYYY-MM-DD
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
  reason?: string; // ej: "Feriado", "Mantenimiento"
  isHolidayException?: boolean; // Marca para identificar excepciones de feriados
}

export interface Store {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive?: boolean; // Indica si la tienda está activa
  employees?: Employee[]; // Opcional, para simulación o datos agregados
  shifts?: Shift[];       // Opcional, para simulación o datos agregados
  storeSchedule?: StoreSchedule[];
  settings?: Record<string, any>; // Para futuras configuraciones específicas de la tienda
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
  storeId?: string; // ID de la tienda a la que pertenece el turno
  breakDuration?: number; // duración del descanso en minutos (ej: 30, 60)
}

export interface ValidationError {
  type: 'conflict' | 'schedule' | 'limit' | 'availability';
  message: string;
  shiftId?: string;
}

export interface Statistics {
  employeeId: string;
  employeeName: string;
  weeklyAssignedHours: number;
  weeklyLimit: number;
  extraHours: number;
  daysSinceLastWeekendOff: number;
  busiestDayOfWeek: number;
  employeeRotation: number;
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

// Configuración de empresa (solo modificable por IT)
export interface CompanySettings {
  id: string;
  logoUrl?: string; // DEPRECATED: usar logoUrlLight/logoUrlDark
  logoUrlLight?: string; // URL del logo para modo claro
  logoUrlDark?: string; // URL del logo para modo oscuro
  // Colores para modo claro
  primaryColorLight?: string; // Color principal de la paleta modo claro (hex)
  secondaryColorLight?: string; // Color secundario de la paleta modo claro (hex)
  accentColorLight?: string; // Color de acento de la paleta modo claro (hex)
  // Colores para modo oscuro
  primaryColorDark?: string; // Color principal de la paleta modo oscuro (hex)
  secondaryColorDark?: string; // Color secundario de la paleta modo oscuro (hex)
  accentColorDark?: string; // Color de acento de la paleta modo oscuro (hex)
  // Compatibilidad con versiones anteriores
  primaryColor?: string; // DEPRECATED: usar primaryColorLight/Dark
  secondaryColor?: string; // DEPRECATED: usar secondaryColorLight/Dark
  accentColor?: string; // DEPRECATED: usar accentColorLight/Dark
  companyName?: string; // Nombre de la empresa
  defaultTheme?: 'light' | 'dark'; // Tema por defecto de la aplicación
  updatedAt: string;
  updatedBy: string; // ID del usuario IT que lo actualizó
}


