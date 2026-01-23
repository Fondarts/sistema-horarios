import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../contexts/StoreContext';
import { usePermissions } from '../hooks/usePermissions';
import { isIT } from '../utils/rolePermissions';
import LoginScreen from './LoginScreen';
import { ManagerDashboard } from './ManagerDashboard';
import EmployeeDashboard from './EmployeeDashboard';
import TimeClockApp from './TimeClockApp';
import { StoreSelector } from './StoreSelector';
import { LoadingSpinner } from './LoadingSpinner';

export function AppRouter() {
  const { currentEmployee, isLoading, isManager, isDistrictManager } = useAuth();
  const { currentStore, setCurrentStore } = useStore();
  const permissions = usePermissions();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!currentEmployee) {
    return <LoginScreen />;
  }

  // Usuarios IT siempre ven el ManagerDashboard, independientemente de permisos de tienda
  if (currentEmployee && isIT(currentEmployee.role)) {
    return <ManagerDashboard />;
  }

  // Si tiene permiso de tiendas y no ha seleccionado una tienda, mostrar selector
  if (permissions.stores?.read && !currentStore) {
    return (
      <StoreSelector 
        onStoreSelect={(storeId) => {
          setCurrentStore(storeId);
        }} 
      />
    );
  }

  // Si tiene permiso de tiendas y ya seleccionó una tienda, mostrar dashboard
  if (permissions.stores?.read && currentStore) {
    return <ManagerDashboard />;
  }
  
  // Si es encargado de distrito (sin permiso stores pero con isDistrictManager) y no ha seleccionado una tienda
  if (isDistrictManager && !currentStore) {
    return (
      <StoreSelector 
        onStoreSelect={(storeId) => {
          setCurrentStore(storeId);
        }} 
      />
    );
  }

  // Si es encargado de distrito y ya seleccionó una tienda
  if (isDistrictManager && currentStore) {
    return <ManagerDashboard />;
  }

  // Usuarios normales (empleados y encargados)
  // Los empleados ven la app de fichado, los encargados ven el dashboard de manager
  return isManager ? <ManagerDashboard /> : <TimeClockApp />;
}


