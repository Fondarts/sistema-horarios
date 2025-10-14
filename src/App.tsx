import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { EmployeeProvider } from './contexts/EmployeeContext';
import { ScheduleProvider } from './contexts/ScheduleContext';
import { VacationProvider } from './contexts/VacationContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { NotificationStackProvider } from './contexts/NotificationStackContext';
import { HolidayProvider } from './contexts/HolidayContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { CompactModeProvider } from './contexts/CompactModeContext';
import { StoreProvider } from './contexts/StoreContext';
import { AppRouter } from './components/AppRouter';
import { NotificationStack } from './components/NotificationStack';

function App() {
  return (
    <ThemeProvider>
      <CompactModeProvider>
        <StoreProvider>
          <EmployeeProvider>
            <AuthProvider>
              <HolidayProvider>
                <NotificationProvider>
                  <NotificationStackProvider>
                    <ScheduleProvider>
                      <VacationProvider>
                        <AppRouter />
                        <NotificationStack />
                      </VacationProvider>
                    </ScheduleProvider>
                  </NotificationStackProvider>
                </NotificationProvider>
              </HolidayProvider>
            </AuthProvider>
          </EmployeeProvider>
        </StoreProvider>
      </CompactModeProvider>
    </ThemeProvider>
  );
}

export default App;


