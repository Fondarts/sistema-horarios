import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { EmployeeProvider } from './contexts/EmployeeContext';
import { ScheduleProvider } from './contexts/ScheduleContext';
import { VacationProvider } from './contexts/VacationContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppRouter } from './components/AppRouter';

function App() {
  return (
    <ThemeProvider>
      <EmployeeProvider>
        <AuthProvider>
          <NotificationProvider>
            <ScheduleProvider>
              <VacationProvider>
                <AppRouter />
              </VacationProvider>
            </ScheduleProvider>
          </NotificationProvider>
        </AuthProvider>
      </EmployeeProvider>
    </ThemeProvider>
  );
}

export default App;


