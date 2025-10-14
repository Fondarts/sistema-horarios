import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Store {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  createdAt: string;
  isActive: boolean;
}

interface StoreContextType {
  currentStore: string | null;
  availableStores: Store[];
  stores: Record<string, Store>;
  isLoading: boolean;
  setCurrentStore: (storeId: string) => void;
  createStore: (storeData: Omit<Store, 'id' | 'createdAt'>) => Promise<string>;
  updateStore: (storeId: string, updates: Partial<Store>) => Promise<void>;
  deleteStore: (storeId: string) => Promise<void>;
  getStore: (storeId: string) => Store | null;
  getCurrentStoreData: () => Store | null;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [currentStore, setCurrentStoreState] = useState<string | null>(null);
  const [stores, setStores] = useState<Record<string, Store>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Cargar datos al inicializar
  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      setIsLoading(true);
      
      // Cargar desde localStorage
      const storedStores = localStorage.getItem('horarios_stores');
      const storedCurrentStore = localStorage.getItem('horarios_current_store');
      
      if (storedStores) {
        const parsedStores = JSON.parse(storedStores);
        setStores(parsedStores);
        
        // Si hay una tienda actual guardada, usarla
        if (storedCurrentStore && parsedStores[storedCurrentStore]) {
          setCurrentStoreState(storedCurrentStore);
        } else {
          // Si no hay tienda actual, usar la primera disponible
          const storeIds = Object.keys(parsedStores);
          if (storeIds.length > 0) {
            setCurrentStoreState(storeIds[0]);
          }
        }
      } else {
        // Si no hay tiendas, crear una tienda por defecto
        const defaultStore: Store = {
          id: 'default-store',
          name: 'Tienda Principal',
          address: 'Dirección principal',
          createdAt: new Date().toISOString(),
          isActive: true
        };
        
        const newStores = { [defaultStore.id]: defaultStore };
        setStores(newStores);
        setCurrentStoreState(defaultStore.id);
        
        // Guardar en localStorage
        localStorage.setItem('horarios_stores', JSON.stringify(newStores));
        localStorage.setItem('horarios_current_store', defaultStore.id);
      }
    } catch (error) {
      console.error('Error loading stores:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setCurrentStore = (storeId: string) => {
    if (stores[storeId]) {
      setCurrentStoreState(storeId);
      localStorage.setItem('horarios_current_store', storeId);
    }
  };

  const createStore = async (storeData: Omit<Store, 'id' | 'createdAt'>): Promise<string> => {
    const newStore: Store = {
      ...storeData,
      id: `store-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };

    const newStores = { ...stores, [newStore.id]: newStore };
    setStores(newStores);
    localStorage.setItem('horarios_stores', JSON.stringify(newStores));

    return newStore.id;
  };

  const updateStore = async (storeId: string, updates: Partial<Store>): Promise<void> => {
    if (stores[storeId]) {
      const updatedStore = { ...stores[storeId], ...updates };
      const newStores = { ...stores, [storeId]: updatedStore };
      setStores(newStores);
      localStorage.setItem('horarios_stores', JSON.stringify(newStores));
    }
  };

  const deleteStore = async (storeId: string): Promise<void> => {
    if (stores[storeId]) {
      const newStores = { ...stores };
      delete newStores[storeId];
      setStores(newStores);
      localStorage.setItem('horarios_stores', JSON.stringify(newStores));

      // Si la tienda eliminada era la actual, cambiar a otra
      if (currentStore === storeId) {
        const remainingStoreIds = Object.keys(newStores);
        if (remainingStoreIds.length > 0) {
          setCurrentStore(remainingStoreIds[0]);
        } else {
          setCurrentStoreState(null);
          localStorage.removeItem('horarios_current_store');
        }
      }
    }
  };

  const getStore = (storeId: string): Store | null => {
    return stores[storeId] || null;
  };

  const getCurrentStoreData = (): Store | null => {
    return currentStore ? stores[currentStore] || null : null;
  };

  const availableStores = Object.values(stores).filter(store => store.isActive);

  const value: StoreContextType = {
    currentStore,
    availableStores,
    stores,
    isLoading,
    setCurrentStore,
    createStore,
    updateStore,
    deleteStore,
    getStore,
    getCurrentStoreData
  };

  return (
    <StoreContext.Provider value={value}>
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
