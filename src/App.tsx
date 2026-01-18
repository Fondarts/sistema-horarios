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
import { LanguageProvider } from './contexts/LanguageContext';
import { CountryProvider } from './contexts/CountryContext';
import { DateFormatProvider } from './contexts/DateFormatContext';
import { CompanySettingsProvider } from './contexts/CompanySettingsContext';
import { AppRouter } from './components/AppRouter';
import { NotificationStack } from './components/NotificationStack';
import { ThemeColorInjector } from './components/ThemeColorInjector';

function App() {
  return (
    <LanguageProvider>
      <CountryProvider>
        <DateFormatProvider>
          <ThemeProvider>
        <CompactModeProvider>
          <StoreProvider>
            <CompanySettingsProvider>
              <ThemeColorInjector />
              <EmployeeProvider>
                <AuthProvider>
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
                </AuthProvider>
              </EmployeeProvider>
            </CompanySettingsProvider>
          </StoreProvider>
        </CompactModeProvider>
      </ThemeProvider>
      </DateFormatProvider>
      </CountryProvider>
    </LanguageProvider>
  );
}

export default App;


