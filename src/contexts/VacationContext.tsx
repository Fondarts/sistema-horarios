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

export interface VacationRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

interface VacationContextType {
  vacationRequests: VacationRequest[];
  addVacationRequest: (request: Omit<VacationRequest, 'id' | 'requestedAt'>) => Promise<void>;
  updateVacationRequest: (id: string, updates: Partial<VacationRequest>) => Promise<void>;
  deleteVacationRequest: (id: string) => Promise<void>;
  approveVacationRequest: (id: string, approvedBy: string) => Promise<void>;
  rejectVacationRequest: (id: string, approvedBy: string) => Promise<void>;
  isLoading: boolean;
}

const VacationContext = createContext<VacationContextType | undefined>(undefined);

export function VacationProvider({ children }: { children: ReactNode }) {
  const [vacationRequests, setVacationRequests] = useState<VacationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar solicitudes de vacaciones desde Firebase
  useEffect(() => {
    const vacationRequestsRef = collection(db, 'vacationRequests');
    const q = query(vacationRequestsRef, orderBy('requestedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData: VacationRequest[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        requestsData.push({
          id: doc.id,
          ...data,
          requestedAt: data.requestedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          approvedAt: data.approvedAt?.toDate?.()?.toISOString() || undefined
        } as VacationRequest);
      });
      setVacationRequests(requestsData);
      setIsLoading(false);
    }, (error) => {
      console.error('Error loading vacation requests:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addVacationRequest = async (requestData: Omit<VacationRequest, 'id' | 'requestedAt'>) => {
    try {
      const newRequest = {
        ...requestData,
        requestedAt: new Date()
      };

      await addDoc(collection(db, 'vacationRequests'), newRequest);
    } catch (error) {
      console.error('Error adding vacation request:', error);
      throw error;
    }
  };

  const updateVacationRequest = async (id: string, updates: Partial<VacationRequest>) => {
    try {
      const requestRef = doc(db, 'vacationRequests', id);
      await updateDoc(requestRef, updates);
    } catch (error) {
      console.error('Error updating vacation request:', error);
      throw error;
    }
  };

  const deleteVacationRequest = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'vacationRequests', id));
    } catch (error) {
      console.error('Error deleting vacation request:', error);
      throw error;
    }
  };

  const approveVacationRequest = async (id: string, approvedBy: string) => {
    try {
      const requestRef = doc(db, 'vacationRequests', id);
      await updateDoc(requestRef, {
        status: 'approved',
        approvedBy,
        approvedAt: new Date()
      });
    } catch (error) {
      console.error('Error approving vacation request:', error);
      throw error;
    }
  };

  const rejectVacationRequest = async (id: string, approvedBy: string) => {
    try {
      const requestRef = doc(db, 'vacationRequests', id);
      await updateDoc(requestRef, {
        status: 'rejected',
        approvedBy,
        approvedAt: new Date()
      });
    } catch (error) {
      console.error('Error rejecting vacation request:', error);
      throw error;
    }
  };

  return (
    <VacationContext.Provider value={{
      vacationRequests,
      addVacationRequest,
      updateVacationRequest,
      deleteVacationRequest,
      approveVacationRequest,
      rejectVacationRequest,
      isLoading
    }}>
      {children}
    </VacationContext.Provider>
  );
}

export function useVacation() {
  const context = useContext(VacationContext);
  if (context === undefined) {
    throw new Error('useVacation must be used within a VacationProvider');
  }
  return context;
}
