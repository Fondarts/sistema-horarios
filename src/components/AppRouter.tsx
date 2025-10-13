import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginScreen from './LoginScreen';
import { ManagerDashboard } from './ManagerDashboard';
import EmployeeDashboard from './EmployeeDashboard';
import { LoadingSpinner } from './LoadingSpinner';

export function AppRouter() {
  const { currentEmployee, isLoading, isManager } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!currentEmployee) {
    return <LoginScreen />;
  }

  return isManager ? <ManagerDashboard /> : <EmployeeDashboard />;
}


