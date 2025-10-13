import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { EmployeeProvider } from './contexts/EmployeeContext';
import { ScheduleProvider } from './contexts/ScheduleContext';
import { AppRouter } from './components/AppRouter';

function App() {
  return (
    <AuthProvider>
      <EmployeeProvider>
        <ScheduleProvider>
          <AppRouter />
        </ScheduleProvider>
      </EmployeeProvider>
    </AuthProvider>
  );
}

export default App;


