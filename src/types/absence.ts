// Tipos para el sistema de ausencias
export type AbsenceType = 
  | 'vacation'        // Vacaciones
  | 'sickness'        // Enfermedad
  | 'personal'        // Permisos personales
  | 'unjustified'     // Ausencias no justificadas
  | 'special';        // Licencias especiales

export type AbsenceStatus = 
  | 'pending'         // Pendiente de aprobación
  | 'approved'        // Aprobado
  | 'rejected';       // Rechazado

export interface AbsenceRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  storeId: string;
  type: AbsenceType;
  startDate: string;
  endDate: string;
  reason: string;
  status: AbsenceStatus;
  medicalCertificate?: string; // URL del archivo en Firebase Storage
  approvedBy?: string; // ID del manager que aprobó/rechazó
  approvedAt?: string; // Fecha de aprobación/rechazo
  rejectionReason?: string; // Motivo del rechazo
  createdAt: string;
  updatedAt: string;
}

export interface AbsenceStats {
  totalAbsences: number;
  absencesByType: Record<AbsenceType, number>;
  absencesByStatus: Record<AbsenceStatus, number>;
  pendingApprovals: number;
  averageAbsencesPerEmployee: number;
}

export interface EmployeeAbsenceStats {
  employeeId: string;
  employeeName: string;
  totalAbsences: number;
  absencesByType: Record<AbsenceType, number>;
  lastAbsenceDate?: string;
  absenceRate: number; // Porcentaje de días ausentes
}

// Configuración para upload de archivos
export interface FileUploadConfig {
  maxSize: number; // en bytes (5MB)
  allowedTypes: string[]; // ['application/pdf', 'image/jpeg', 'image/png']
  allowedExtensions: string[]; // ['.pdf', '.jpg', '.jpeg', '.png']
}

export const FILE_UPLOAD_CONFIG: FileUploadConfig = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png']
};

// Labels para UI
export const ABSENCE_TYPE_LABELS: Record<AbsenceType, string> = {
  vacation: 'Vacaciones',
  sickness: 'Enfermedad',
  personal: 'Permiso Personal',
  unjustified: 'Ausencia No Justificada',
  special: 'Licencia Especial'
};

export const ABSENCE_STATUS_LABELS: Record<AbsenceStatus, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado'
};

// Colores para UI
export const ABSENCE_TYPE_COLORS: Record<AbsenceType, string> = {
  vacation: 'bg-blue-100 text-blue-800',
  sickness: 'bg-red-100 text-red-800',
  personal: 'bg-yellow-100 text-yellow-800',
  unjustified: 'bg-gray-100 text-gray-800',
  special: 'bg-purple-100 text-purple-800'
};

export const ABSENCE_STATUS_COLORS: Record<AbsenceStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};
