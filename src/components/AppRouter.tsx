import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LoginScreen } from './LoginScreen';
import { ManagerDashboard } from './ManagerDashboard';
import { EmployeeDashboard } from './EmployeeDashboard';
import { LoadingSpinner } from './LoadingSpinner';

export function AppRouter() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  return user.role === 'encargado' ? <ManagerDashboard /> : <EmployeeDashboard />;
}


