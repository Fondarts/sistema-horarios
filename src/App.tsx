import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { EmployeeProvider } from './contexts/EmployeeContext';
import { ScheduleProvider } from './contexts/ScheduleContext';
import { VacationProvider } from './contexts/VacationContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { HolidayProvider } from './contexts/HolidayContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { CompactModeProvider } from './contexts/CompactModeContext';
import { AppRouter } from './components/AppRouter';

function App() {
  return (
    <ThemeProvider>
      <CompactModeProvider>
        <EmployeeProvider>
          <AuthProvider>
            <HolidayProvider>
              <NotificationProvider>
                <ScheduleProvider>
                  <VacationProvider>
                    <AppRouter />
                  </VacationProvider>
                </ScheduleProvider>
              </NotificationProvider>
            </HolidayProvider>
          </AuthProvider>
        </EmployeeProvider>
      </CompactModeProvider>
    </ThemeProvider>
  );
}

export default App;


