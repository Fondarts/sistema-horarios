import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { EmployeeProvider } from './contexts/EmployeeContext';
import { ScheduleProvider } from './contexts/ScheduleContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppRouter } from './components/AppRouter';

function App() {
  return (
    <ThemeProvider>
      <EmployeeProvider>
        <AuthProvider>
          <ScheduleProvider>
            <AppRouter />
          </ScheduleProvider>
        </AuthProvider>
      </EmployeeProvider>
    </ThemeProvider>
  );
}

export default App;


