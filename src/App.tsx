import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { EmployeeProvider } from './contexts/EmployeeContext';
import { ScheduleProvider } from './contexts/ScheduleContext';
import { VacationProvider } from './contexts/VacationContext';
import { AbsenceProvider } from './contexts/AbsenceContext';
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
        <EmployeeProvider>
          <AuthProvider>
            <StoreProvider>
              <HolidayProvider>
                <NotificationProvider>
                  <NotificationStackProvider>
                    <ScheduleProvider>
                      <VacationProvider>
                        <AbsenceProvider>
                          <AppRouter />
                          <NotificationStack />
                        </AbsenceProvider>
                      </VacationProvider>
                    </ScheduleProvider>
                  </NotificationStackProvider>
                </NotificationProvider>
              </HolidayProvider>
            </StoreProvider>
          </AuthProvider>
        </EmployeeProvider>
      </CompactModeProvider>
    </ThemeProvider>
  );
}

export default App;


