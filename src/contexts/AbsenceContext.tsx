import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { useNotifications } from './NotificationContext';
import { useStore } from './StoreContext';
import { AbsenceRequest, AbsenceType, AbsenceStatus, AbsenceStats, EmployeeAbsenceStats } from '../types/absence';
import { LocalFileStorage } from '../services/localFileStorage';

interface AbsenceContextType {
  absenceRequests: AbsenceRequest[];
  addAbsenceRequest: (request: Omit<AbsenceRequest, 'id' | 'createdAt' | 'updatedAt'>, file?: File) => Promise<void>;
  updateAbsenceRequest: (id: string, updates: Partial<AbsenceRequest>) => Promise<void>;
  deleteAbsenceRequest: (id: string) => Promise<void>;
  approveAbsenceRequest: (id: string, approvedBy: string) => Promise<void>;
  rejectAbsenceRequest: (id: string, approvedBy: string, rejectionReason?: string) => Promise<void>;
  getAbsenceStats: () => AbsenceStats;
  getEmployeeAbsenceStats: (employeeId: string) => EmployeeAbsenceStats;
  getAbsencesByType: (type: AbsenceType) => AbsenceRequest[];
  getAbsencesByStatus: (status: AbsenceStatus) => AbsenceRequest[];
  getPendingApprovals: () => AbsenceRequest[];
  isLoading: boolean;
}

const AbsenceContext = createContext<AbsenceContextType | undefined>(undefined);

export function AbsenceProvider({ children }: { children: ReactNode }) {
  const [absenceRequests, setAbsenceRequests] = useState<AbsenceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addNotification } = useNotifications();
  const { currentStore } = useStore();

  // Cargar solicitudes de ausencias desde Firebase
  useEffect(() => {
    if (!currentStore) {
      setIsLoading(false);
      return;
    }

    const absenceRequestsRef = collection(db, 'absenceRequests');
    const q = query(
      absenceRequestsRef, 
      where('storeId', '==', currentStore.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData: AbsenceRequest[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        requestsData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          approvedAt: data.approvedAt?.toDate?.()?.toISOString() || undefined
        } as AbsenceRequest);
      });
      // Ordenar por fecha de creación (más reciente primero)
      requestsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAbsenceRequests(requestsData);
      setIsLoading(false);
    }, (error) => {
      console.error('Error loading absence requests:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentStore]);

  const addAbsenceRequest = async (
    requestData: Omit<AbsenceRequest, 'id' | 'createdAt' | 'updatedAt'>, 
    file?: File
  ) => {
    try {
      console.log('Iniciando addAbsenceRequest con datos:', requestData);
      const now = new Date();
      let medicalCertificateUrl: string | undefined;

      // Si hay archivo, guardarlo localmente
      if (file) {
        console.log('Archivo detectado:', file.name, 'guardando localmente');
        try {
          const tempAbsenceId = `temp-${Date.now()}`;
          const fileId = await LocalFileStorage.saveFile(file, tempAbsenceId, requestData.employeeId);
          medicalCertificateUrl = `local-file:${fileId}`;
          console.log('Archivo guardado localmente con ID:', fileId);
        } catch (error) {
          console.error('Error al guardar archivo localmente:', error);
          throw error;
        }
      }

      const newRequest = {
        ...requestData,
        ...(medicalCertificateUrl && { medicalCertificate: medicalCertificateUrl }),
        createdAt: now,
        updatedAt: now
      };

      console.log('Creando documento en Firestore con:', newRequest);
      const docRef = await addDoc(collection(db, 'absenceRequests'), newRequest);
      console.log('Documento creado con ID:', docRef.id);
      
      // Actualizar el archivo con el ID real de la ausencia
      if (file && medicalCertificateUrl && medicalCertificateUrl.startsWith('local-file:')) {
        console.log('Actualizando archivo con ID real de ausencia');
        try {
          const oldFileId = medicalCertificateUrl.replace('local-file:', '');
          const newFileId = await LocalFileStorage.saveFile(file, docRef.id, requestData.employeeId);
          
          // Eliminar archivo temporal
          LocalFileStorage.deleteFile(oldFileId);
          
          // Actualizar con el nuevo ID
          await updateDoc(docRef, {
            medicalCertificate: `local-file:${newFileId}`,
            updatedAt: new Date()
          });
          console.log('Archivo actualizado con ID real:', newFileId);
        } catch (error) {
          console.error('Error al actualizar archivo:', error);
        }
      }

      // Enviar notificación al manager
      console.log('Enviando notificación al manager');
      await addNotification({
        userId: 'manager', // Se enviará a todos los managers
        type: 'absence_request',
        title: 'Nueva Solicitud de Ausencia',
        message: `${requestData.employeeName} ha solicitado una ausencia de tipo "${requestData.type}" del ${new Date(requestData.startDate).toLocaleDateString('es-ES')} al ${new Date(requestData.endDate).toLocaleDateString('es-ES')}.`,
        data: {
          absenceRequestId: docRef.id,
          employeeId: requestData.employeeId,
          employeeName: requestData.employeeName,
          type: requestData.type,
          startDate: requestData.startDate,
          endDate: requestData.endDate
        }
      });
      console.log('Solicitud de ausencia creada exitosamente');
    } catch (error) {
      console.error('Error adding absence request:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  };

  const updateAbsenceRequest = async (id: string, updates: Partial<AbsenceRequest>) => {
    try {
      const requestRef = doc(db, 'absenceRequests', id);
      await updateDoc(requestRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating absence request:', error);
      throw error;
    }
  };

  const deleteAbsenceRequest = async (id: string) => {
    try {
      const request = absenceRequests.find(r => r.id === id);
      
      // Eliminar archivo médico si existe
      if (request?.medicalCertificate && request.medicalCertificate.startsWith('local-file:')) {
        const fileId = request.medicalCertificate.replace('local-file:', '');
        LocalFileStorage.deleteFile(fileId);
      }
      
      await deleteDoc(doc(db, 'absenceRequests', id));
    } catch (error) {
      console.error('Error deleting absence request:', error);
      throw error;
    }
  };

  const approveAbsenceRequest = async (id: string, approvedBy: string) => {
    try {
      const requestRef = doc(db, 'absenceRequests', id);
      const request = absenceRequests.find(r => r.id === id);
      
      await updateDoc(requestRef, {
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date()
      });

      // Enviar notificación al empleado
      if (request) {
        await addNotification({
          userId: request.employeeId,
          type: 'absence_approved',
          title: 'Ausencia Aprobada',
          message: `Tu solicitud de ausencia de tipo "${request.type}" del ${new Date(request.startDate).toLocaleDateString('es-ES')} al ${new Date(request.endDate).toLocaleDateString('es-ES')} ha sido aprobada por ${approvedBy}.`,
          data: {
            absenceRequestId: id,
            type: request.type,
            startDate: request.startDate,
            endDate: request.endDate,
            approvedBy
          }
        });
      }
    } catch (error) {
      console.error('Error approving absence request:', error);
      throw error;
    }
  };

  const rejectAbsenceRequest = async (id: string, approvedBy: string, rejectionReason?: string) => {
    try {
      const requestRef = doc(db, 'absenceRequests', id);
      const request = absenceRequests.find(r => r.id === id);
      
      await updateDoc(requestRef, {
        status: 'rejected',
        approvedBy,
        approvedAt: new Date(),
        rejectionReason,
        updatedAt: new Date()
      });

      // Enviar notificación al empleado
      if (request) {
        await addNotification({
          userId: request.employeeId,
          type: 'absence_rejected',
          title: 'Ausencia Rechazada',
          message: `Tu solicitud de ausencia de tipo "${request.type}" del ${new Date(request.startDate).toLocaleDateString('es-ES')} al ${new Date(request.endDate).toLocaleDateString('es-ES')} ha sido rechazada por ${approvedBy}.${rejectionReason ? ` Motivo: ${rejectionReason}` : ''}`,
          data: {
            absenceRequestId: id,
            type: request.type,
            startDate: request.startDate,
            endDate: request.endDate,
            approvedBy,
            rejectionReason
          }
        });
      }
    } catch (error) {
      console.error('Error rejecting absence request:', error);
      throw error;
    }
  };

  const getAbsenceStats = (): AbsenceStats => {
    const totalAbsences = absenceRequests.length;
    const absencesByType: Record<AbsenceType, number> = {
      vacation: 0,
      sickness: 0,
      personal: 0,
      unjustified: 0,
      special: 0
    };
    const absencesByStatus: Record<AbsenceStatus, number> = {
      pending: 0,
      approved: 0,
      rejected: 0
    };

    absenceRequests.forEach(request => {
      absencesByType[request.type]++;
      absencesByStatus[request.status]++;
    });

    const pendingApprovals = absencesByStatus.pending;
    const uniqueEmployees = new Set(absenceRequests.map(r => r.employeeId)).size;
    const averageAbsencesPerEmployee = uniqueEmployees > 0 ? totalAbsences / uniqueEmployees : 0;

    return {
      totalAbsences,
      absencesByType,
      absencesByStatus,
      pendingApprovals,
      averageAbsencesPerEmployee
    };
  };

  const getEmployeeAbsenceStats = (employeeId: string): EmployeeAbsenceStats => {
    const employeeAbsences = absenceRequests.filter(r => r.employeeId === employeeId);
    const totalAbsences = employeeAbsences.length;
    
    const absencesByType: Record<AbsenceType, number> = {
      vacation: 0,
      sickness: 0,
      personal: 0,
      unjustified: 0,
      special: 0
    };

    let lastAbsenceDate: string | undefined;
    let totalDaysAbsent = 0;

    employeeAbsences.forEach(request => {
      absencesByType[request.type]++;
      
      if (!lastAbsenceDate || request.startDate > lastAbsenceDate) {
        lastAbsenceDate = request.startDate;
      }

      // Calcular días de ausencia
      const startDate = new Date(request.startDate);
      const endDate = new Date(request.endDate);
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      totalDaysAbsent += daysDiff;
    });

    const employeeName = employeeAbsences[0]?.employeeName || 'Empleado';
    
    // Calcular tasa de ausentismo (días ausentes / días trabajados estimados)
    // Asumiendo 30 días por mes y 12 meses
    const estimatedWorkingDays = 30 * 12; // 360 días
    const absenceRate = estimatedWorkingDays > 0 ? (totalDaysAbsent / estimatedWorkingDays) * 100 : 0;

    return {
      employeeId,
      employeeName,
      totalAbsences,
      absencesByType,
      lastAbsenceDate,
      absenceRate
    };
  };

  const getAbsencesByType = (type: AbsenceType): AbsenceRequest[] => {
    return absenceRequests.filter(request => request.type === type);
  };

  const getAbsencesByStatus = (status: AbsenceStatus): AbsenceRequest[] => {
    return absenceRequests.filter(request => request.status === status);
  };

  const getPendingApprovals = (): AbsenceRequest[] => {
    return absenceRequests.filter(request => request.status === 'pending');
  };

  return (
    <AbsenceContext.Provider value={{
      absenceRequests,
      addAbsenceRequest,
      updateAbsenceRequest,
      deleteAbsenceRequest,
      approveAbsenceRequest,
      rejectAbsenceRequest,
      getAbsenceStats,
      getEmployeeAbsenceStats,
      getAbsencesByType,
      getAbsencesByStatus,
      getPendingApprovals,
      isLoading
    }}>
      {children}
    </AbsenceContext.Provider>
  );
}

export function useAbsence() {
  const context = useContext(AbsenceContext);
  if (context === undefined) {
    throw new Error('useAbsence must be used within an AbsenceProvider');
  }
  return context;
}
