import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { HistoryActionType, HistoryEntry } from '../components/HistoryManagement';

/**
 * Servicio para registrar cambios en el historial
 */
export class HistoryService {
  /**
   * Registra una entrada en el historial
   */
  static async logAction(
    action: HistoryActionType,
    entityType: string,
    entityId: string,
    userId: string,
    options?: {
      entityName?: string;
      changes?: Record<string, { old: any; new: any }>;
      details?: string;
    }
  ): Promise<void> {
    try {
      const historyRef = collection(db, 'history');
      
      const entry: Omit<HistoryEntry, 'id'> = {
        action,
        entityType,
        entityId,
        userId,
        timestamp: Timestamp.now(),
        ...options
      };

      await addDoc(historyRef, entry);
    } catch (error) {
      console.error('Error logging history entry:', error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }

  /**
   * Registra la creación de un turno
   */
  static async logShiftCreated(shiftId: string, userId: string, employeeName?: string): Promise<void> {
    await this.logAction('shift_created', 'shift', shiftId, userId, {
      entityName: employeeName,
      details: `Turno creado${employeeName ? ` para ${employeeName}` : ''}`
    });
  }

  /**
   * Registra la modificación de un turno
   */
  static async logShiftUpdated(
    shiftId: string, 
    userId: string, 
    changes: Record<string, { old: any; new: any }>,
    employeeName?: string
  ): Promise<void> {
    await this.logAction('shift_updated', 'shift', shiftId, userId, {
      entityName: employeeName,
      changes,
      details: `Turno modificado${employeeName ? ` de ${employeeName}` : ''}`
    });
  }

  /**
   * Registra la eliminación de un turno
   */
  static async logShiftDeleted(shiftId: string, userId: string, employeeName?: string): Promise<void> {
    await this.logAction('shift_deleted', 'shift', shiftId, userId, {
      entityName: employeeName,
      details: `Turno eliminado${employeeName ? ` de ${employeeName}` : ''}`
    });
  }

  /**
   * Registra la creación de un empleado
   */
  static async logEmployeeCreated(employeeId: string, userId: string, employeeName: string): Promise<void> {
    await this.logAction('employee_created', 'employee', employeeId, userId, {
      entityName: employeeName,
      details: `Empleado creado: ${employeeName}`
    });
  }

  /**
   * Registra la modificación de un empleado
   */
  static async logEmployeeUpdated(
    employeeId: string, 
    userId: string, 
    changes: Record<string, { old: any; new: any }>,
    employeeName: string
  ): Promise<void> {
    await this.logAction('employee_updated', 'employee', employeeId, userId, {
      entityName: employeeName,
      changes,
      details: `Empleado modificado: ${employeeName}`
    });
  }

  /**
   * Registra la eliminación de un empleado
   */
  static async logEmployeeDeleted(employeeId: string, userId: string, employeeName: string): Promise<void> {
    await this.logAction('employee_deleted', 'employee', employeeId, userId, {
      entityName: employeeName,
      details: `Empleado eliminado: ${employeeName}`
    });
  }

  /**
   * Registra la modificación del horario de una tienda
   */
  static async logStoreScheduleUpdated(storeId: string, userId: string, storeName?: string): Promise<void> {
    await this.logAction('store_schedule_updated', 'store', storeId, userId, {
      entityName: storeName,
      details: `Horario de tienda modificado${storeName ? `: ${storeName}` : ''}`
    });
  }

  /**
   * Registra la creación de una ausencia
   */
  static async logAbsenceCreated(absenceId: string, userId: string, employeeName?: string): Promise<void> {
    await this.logAction('absence_created', 'absence', absenceId, userId, {
      entityName: employeeName,
      details: `Ausencia creada${employeeName ? ` para ${employeeName}` : ''}`
    });
  }

  /**
   * Registra la aprobación de una ausencia
   */
  static async logAbsenceApproved(absenceId: string, userId: string, employeeName?: string): Promise<void> {
    await this.logAction('absence_approved', 'absence', absenceId, userId, {
      entityName: employeeName,
      details: `Ausencia aprobada${employeeName ? ` de ${employeeName}` : ''}`
    });
  }

  /**
   * Registra el rechazo de una ausencia
   */
  static async logAbsenceRejected(absenceId: string, userId: string, employeeName?: string): Promise<void> {
    await this.logAction('absence_rejected', 'absence', absenceId, userId, {
      entityName: employeeName,
      details: `Ausencia rechazada${employeeName ? ` de ${employeeName}` : ''}`
    });
  }

  /**
   * Registra la eliminación de una ausencia
   */
  static async logAbsenceDeleted(absenceId: string, userId: string, employeeName?: string): Promise<void> {
    await this.logAction('absence_deleted', 'absence', absenceId, userId, {
      entityName: employeeName,
      details: `Ausencia eliminada${employeeName ? ` de ${employeeName}` : ''}`
    });
  }

  /**
   * Registra la creación de una tienda
   */
  static async logStoreCreated(storeId: string, userId: string, storeName: string): Promise<void> {
    await this.logAction('store_created', 'store', storeId, userId, {
      entityName: storeName,
      details: `Tienda creada: ${storeName}`
    });
  }

  /**
   * Registra la modificación de una tienda
   */
  static async logStoreUpdated(
    storeId: string, 
    userId: string, 
    changes: Record<string, { old: any; new: any }>,
    storeName: string
  ): Promise<void> {
    await this.logAction('store_updated', 'store', storeId, userId, {
      entityName: storeName,
      changes,
      details: `Tienda modificada: ${storeName}`
    });
  }

  /**
   * Registra la eliminación de una tienda
   */
  static async logStoreDeleted(storeId: string, userId: string, storeName: string): Promise<void> {
    await this.logAction('store_deleted', 'store', storeId, userId, {
      entityName: storeName,
      details: `Tienda eliminada: ${storeName}`
    });
  }

  /**
   * Registra la actualización de configuración de empresa
   */
  static async logCompanySettingsUpdated(userId: string): Promise<void> {
    await this.logAction('company_settings_updated', 'company_settings', 'main', userId, {
      details: 'Configuración de empresa actualizada'
    });
  }

  /**
   * Registra la actualización de permisos
   */
  static async logPermissionsUpdated(userId: string): Promise<void> {
    await this.logAction('permissions_updated', 'permissions', 'main', userId, {
      details: 'Permisos actualizados'
    });
  }
}
