import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Store } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';

interface StoreContextType {
  stores: Store[];
  currentStore: Store | null;
  setCurrentStore: (storeId: string) => void;
  createStore: (store: Omit<Store, 'id' | 'employees' | 'shifts' | 'storeSchedule' | 'settings'>) => Promise<void>;
  updateStore: (storeId: string, updates: Partial<Store>) => Promise<void>;
  deleteStore: (storeId: string) => Promise<void>;
  getAllStores: () => Promise<Store[]>;
  isLoading: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStoreState] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStores = async () => {
      setIsLoading(true);
      
      try {
        // Cargar tiendas desde Firebase
        const storesRef = collection(db, 'stores');
        const q = query(storesRef, orderBy('name'));
        
        const unsubscribe = onSnapshot(q, async (snapshot) => {
          const storesData: Store[] = [];
          snapshot.forEach((doc) => {
            storesData.push({ id: doc.id, ...doc.data() } as Store);
          });
          
          setStores(storesData);
          
          // Si no hay tiendas, crear una por defecto
          // Solo si no estamos en proceso de borrado (verificar localStorage)
          const isClearingData = localStorage.getItem('isClearingData') === 'true';
          if (storesData.length === 0 && !isClearingData) {
            const defaultStore: Omit<Store, 'id'> = {
              name: 'Mi Tienda Principal',
              address: 'Calle Falsa 123',
              phone: '123-456-7890',
              email: 'contacto@mitienda.com',
              isActive: true,
              employees: [],
              shifts: [],
              storeSchedule: [],
              settings: {}
            };
            
            try {
              const docRef = await addDoc(storesRef, defaultStore);
              // No seleccionar automáticamente la tienda por defecto
              // Permitir que los encargados de distrito vean el selector
            } catch (error) {
              console.error('Error creating default store:', error);
            }
          } else {
            // Verificar si es district manager desde localStorage
            const currentEmployee = localStorage.getItem('currentEmployee');
            let isDistrictManager = false;
            
            if (currentEmployee) {
              try {
                const employee = JSON.parse(currentEmployee);
                isDistrictManager = employee.username === 'admin' || employee.username === 'distrito';
              } catch (error) {
                console.error('Error parsing currentEmployee:', error);
              }
            }
            
            if (!isDistrictManager) {
              // Solo para usuarios normales (empleados/encargados), usar la tienda guardada
              const savedCurrentStoreId = localStorage.getItem('horarios_current_store_id');
              if (savedCurrentStoreId) {
                const foundStore = storesData.find((s: Store) => s.id === savedCurrentStoreId);
                if (foundStore) {
                  setCurrentStoreState(foundStore);
                }
              }
            }
            // Los district managers siempre verán el selector de tiendas
          }
          
          setIsLoading(false);
        }, (error) => {
          console.error('Error loading stores:', error);
          setIsLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error setting up stores listener:', error);
        setIsLoading(false);
      }
    };
    
    loadStores();
  }, []);

  // Ya no necesitamos sincronizar con localStorage, Firebase maneja todo

  const setCurrentStore = (storeId: string) => {
    if (storeId === '') {
      // Limpiar la tienda actual
      setCurrentStoreState(null);
      localStorage.removeItem('horarios_current_store_id');
      return;
    }
    
    const store = stores.find(s => s.id === storeId);
    if (store) {
      setCurrentStoreState(store);
      localStorage.setItem('horarios_current_store_id', storeId);
    }
  };

  const createStore = async (newStoreData: Omit<Store, 'id' | 'employees' | 'shifts' | 'storeSchedule' | 'settings'>) => {
    try {
      const storesRef = collection(db, 'stores');
      const storeToCreate = {
        ...newStoreData,
        isActive: true,
        employees: [],
        shifts: [],
        storeSchedule: [],
        settings: {}
      };
      
      const docRef = await addDoc(storesRef, storeToCreate);
      setCurrentStore(docRef.id); // Establecer la nueva tienda como actual
    } catch (error) {
      console.error('Error creating store:', error);
      throw error;
    }
  };

  const updateStore = async (storeId: string, updates: Partial<Store>) => {
    try {
      const storeRef = doc(db, 'stores', storeId);
      await updateDoc(storeRef, updates);
    } catch (error) {
      console.error('Error updating store:', error);
      throw error;
    }
  };

  const deleteStore = async (storeId: string) => {
    try {
      const storeRef = doc(db, 'stores', storeId);
      await deleteDoc(storeRef);
      
      // Si la tienda actual es eliminada, seleccionar la primera disponible
      if (currentStore?.id === storeId) {
        const remainingStores = stores.filter(store => store.id !== storeId);
        if (remainingStores.length > 0) {
          setCurrentStore(remainingStores[0].id);
        } else {
          setCurrentStoreState(null);
          localStorage.removeItem('horarios_current_store_id');
        }
      }
    } catch (error) {
      console.error('Error deleting store:', error);
      throw error;
    }
  };

  const getAllStores = async (): Promise<Store[]> => {
    try {
      const storesRef = collection(db, 'stores');
      const q = query(storesRef, orderBy('name'));
      const snapshot = await getDocs(q);
      
      const storesData: Store[] = [];
      snapshot.forEach((doc) => {
        storesData.push({ id: doc.id, ...doc.data() } as Store);
      });
      
      return storesData;
    } catch (error) {
      console.error('Error getting all stores:', error);
      throw error;
    }
  };

  return (
    <StoreContext.Provider value={{
      stores,
      currentStore,
      setCurrentStore,
      createStore,
      updateStore,
      deleteStore,
      getAllStores,
      isLoading
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
