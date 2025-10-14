import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Store } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface StoreContextType {
  stores: Store[];
  currentStore: Store | null;
  setCurrentStore: (storeId: string) => void;
  createStore: (store: Omit<Store, 'id' | 'employees' | 'shifts' | 'storeSchedule' | 'settings'>) => Promise<void>;
  updateStore: (storeId: string, updates: Partial<Store>) => Promise<void>;
  deleteStore: (storeId: string) => Promise<void>;
  isLoading: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStoreState] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStores = () => {
      setIsLoading(true);
      const savedStores = localStorage.getItem('horarios_stores');
      if (savedStores) {
        try {
          const parsedStores = JSON.parse(savedStores);
          // Validar que parsedStores es un array
          if (Array.isArray(parsedStores)) {
            setStores(parsedStores);
            const savedCurrentStoreId = localStorage.getItem('horarios_current_store_id');
            if (savedCurrentStoreId) {
              const foundStore = parsedStores.find((s: Store) => s.id === savedCurrentStoreId);
              setCurrentStoreState(foundStore || null);
            } else if (parsedStores.length > 0) {
              setCurrentStoreState(parsedStores[0]);
              localStorage.setItem('horarios_current_store_id', parsedStores[0].id);
            }
          } else {
            // Si no es un array, crear uno nuevo
            console.warn('Stores data is not an array, creating default store');
            const defaultStore: Store = {
              id: uuidv4(),
              name: 'Mi Tienda Principal',
              address: 'Calle Falsa 123',
              phone: '123-456-7890',
              email: 'contacto@mitienda.com',
              employees: [],
              shifts: [],
              storeSchedule: [],
              settings: {}
            };
            setStores([defaultStore]);
            setCurrentStoreState(defaultStore);
            localStorage.setItem('horarios_stores', JSON.stringify([defaultStore]));
            localStorage.setItem('horarios_current_store_id', defaultStore.id);
          }
        } catch (error) {
          console.error('Error parsing stores data:', error);
          // Crear tienda por defecto en caso de error
          const defaultStore: Store = {
            id: uuidv4(),
            name: 'Mi Tienda Principal',
            address: 'Calle Falsa 123',
            phone: '123-456-7890',
            email: 'contacto@mitienda.com',
            employees: [],
            shifts: [],
            storeSchedule: [],
            settings: {}
          };
          setStores([defaultStore]);
          setCurrentStoreState(defaultStore);
          localStorage.setItem('horarios_stores', JSON.stringify([defaultStore]));
          localStorage.setItem('horarios_current_store_id', defaultStore.id);
        }
      } else {
        // Crear una tienda por defecto si no hay ninguna
        const defaultStore: Store = {
          id: uuidv4(),
          name: 'Mi Tienda Principal',
          address: 'Calle Falsa 123',
          phone: '123-456-7890',
          email: 'contacto@mitienda.com',
          employees: [],
          shifts: [],
          storeSchedule: [],
          settings: {}
        };
        setStores([defaultStore]);
        setCurrentStoreState(defaultStore);
        localStorage.setItem('horarios_stores', JSON.stringify([defaultStore]));
        localStorage.setItem('horarios_current_store_id', defaultStore.id);
      }
      setIsLoading(false);
    };
    loadStores();
  }, []);

  useEffect(() => {
    if (stores.length > 0) {
      localStorage.setItem('horarios_stores', JSON.stringify(stores));
    }
  }, [stores]);

  const setCurrentStore = (storeId: string) => {
    const store = stores.find(s => s.id === storeId);
    if (store) {
      setCurrentStoreState(store);
      localStorage.setItem('horarios_current_store_id', storeId);
    }
  };

  const createStore = async (newStoreData: Omit<Store, 'id' | 'employees' | 'shifts' | 'storeSchedule' | 'settings'>) => {
    const newStore: Store = {
      id: uuidv4(),
      employees: [],
      shifts: [],
      storeSchedule: [],
      settings: {},
      ...newStoreData
    };
    setStores(prev => [...prev, newStore]);
    setCurrentStore(newStore.id); // Establecer la nueva tienda como actual
  };

  const updateStore = async (storeId: string, updates: Partial<Store>) => {
    setStores(prev => prev.map(store =>
      store.id === storeId ? { ...store, ...updates } : store
    ));
  };

  const deleteStore = async (storeId: string) => {
    setStores(prev => prev.filter(store => store.id !== storeId));
    if (currentStore?.id === storeId) {
      // Si la tienda actual es eliminada, seleccionar la primera disponible o null
      const remainingStores = stores.filter(store => store.id !== storeId);
      if (remainingStores.length > 0) {
        setCurrentStore(remainingStores[0].id);
      } else {
        setCurrentStoreState(null);
        localStorage.removeItem('horarios_current_store_id');
      }
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
