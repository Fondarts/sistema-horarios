import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../contexts/StoreContext';
import LoginScreen from './LoginScreen';
import { ManagerDashboard } from './ManagerDashboard';
import EmployeeDashboard from './EmployeeDashboard';
import { StoreSelector } from './StoreSelector';
import { LoadingSpinner } from './LoadingSpinner';

export function AppRouter() {
  const { currentEmployee, isLoading, isManager, isDistrictManager } = useAuth();
  const { currentStore, setCurrentStore } = useStore();
  const [selectedStore, setSelectedStore] = useState<string | null>(null);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!currentEmployee) {
    return <LoginScreen />;
  }

  // Si es encargado de distrito y no ha seleccionado una tienda
  if (isDistrictManager && !selectedStore) {
    return (
      <StoreSelector 
        onStoreSelect={(storeId) => {
          setSelectedStore(storeId);
          setCurrentStore(storeId);
        }} 
      />
    );
  }

  // Si es encargado de distrito y ya seleccionó una tienda
  if (isDistrictManager && selectedStore) {
    return <ManagerDashboard />;
  }

  // Usuarios normales (empleados y encargados)
  return isManager ? <ManagerDashboard /> : <EmployeeDashboard />;
}


