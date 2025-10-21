import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEmployees } from '../contexts/EmployeeContext';
import { useStore } from '../contexts/StoreContext';
import { LogOut, Calendar, Users, Home, BarChart3, FileText, CalendarDays, Settings, Building2, UserX } from 'lucide-react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useCompactMode } from '../contexts/CompactModeContext';
import { EmployeeManagement } from './EmployeeManagement';
import ScheduleManagement from './ScheduleManagement';
import { StoreSettings } from './StoreSettings';
import { Statistics } from './Statistics';
import { ExportTools } from './ExportTools';
import { AbsenceManagement } from './AbsenceManagement';
import { HolidayIntegration } from './HolidayIntegration';
import { ThemeToggle } from './ThemeToggle';
import { BirthdayNotification } from './BirthdayNotification';
import { NotificationCenter } from './NotificationCenter';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { Logo } from './Logo';
import { HamburgerMenu } from './HamburgerMenu';
import { ConfigurationModal } from './ConfigurationModal';
import { useLanguage } from '../contexts/LanguageContext';

type TabType = 'schedule' | 'employees' | 'settings' | 'statistics' | 'export' | 'absences' | 'holidays' | 'configuration';

export function ManagerDashboard() {
  const { currentEmployee, logout, isDistrictManager } = useAuth();
  const { employees } = useEmployees();
  const { currentStore, setCurrentStore } = useStore();
  const { isCompactMode, toggleCompactMode, isMobile } = useCompactMode();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('schedule');
  const [showBirthdayNotification, setShowBirthdayNotification] = useState(true);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  const tabs = [
    { id: 'schedule' as TabType, label: t('schedule'), icon: Calendar },
    { id: 'employees' as TabType, label: t('employees'), icon: Users },
    { id: 'absences' as TabType, label: t('vacations'), icon: UserX },
    { id: 'holidays' as TabType, label: t('holidays'), icon: CalendarDays },
    { id: 'settings' as TabType, label: t('store'), icon: Home },
    { id: 'statistics' as TabType, label: t('statistics'), icon: BarChart3 },
    { id: 'export' as TabType, label: t('export'), icon: FileText },
  ];

  // Función para volver al selector de tiendas (solo para encargados de distrito)
  const handleBackToStoreSelector = () => {
    // Limpiar la tienda seleccionada para volver al selector
    localStorage.removeItem('horarios_current_store_id');
    // Limpiar el estado de la tienda actual - esto hará que AppRouter muestre el selector
    setCurrentStore('');
  };

  // Atajos de teclado
  useKeyboardShortcuts([
    {
      key: '/',
      ctrlKey: true,
      action: () => setShowKeyboardHelp(!showKeyboardHelp),
      description: 'Mostrar/ocultar ayuda de atajos'
    },
    {
      key: '1',
      ctrlKey: true,
      action: () => setActiveTab('schedule'),
      description: 'Ir a pestaña Horarios'
    },
    {
      key: '2',
      ctrlKey: true,
      action: () => setActiveTab('employees'),
      description: 'Ir a pestaña Empleados'
    },
    {
      key: '3',
      ctrlKey: true,
      action: () => setActiveTab('absences'),
      description: 'Ir a pestaña Vacaciones y Ausencias'
    },
    {
      key: '4',
      ctrlKey: true,
      action: () => setActiveTab('holidays'),
      description: 'Ir a pestaña Feriados'
    },
    {
      key: '5',
      ctrlKey: true,
      action: () => setActiveTab('settings'),
      description: 'Ir a pestaña Tienda'
    },
    {
      key: '6',
      ctrlKey: true,
      action: () => setActiveTab('statistics'),
      description: 'Ir a pestaña Estadísticas'
    },
    {
      key: '7',
      ctrlKey: true,
      action: () => setActiveTab('export'),
      description: 'Ir a pestaña Exportar'
    }
  ]);

  const renderContent = () => {
    switch (activeTab) {
      case 'schedule':
        return <ScheduleManagement />;
      case 'employees':
        return <EmployeeManagement />;
      case 'absences':
        return <AbsenceManagement />;
      case 'holidays':
        return <HolidayIntegration />;
      case 'settings':
        return <StoreSettings />;
      case 'statistics':
        return <Statistics />;
      case 'export':
        return <ExportTools />;
      case 'configuration':
        return (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-4xl mx-auto p-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {t('configuration')}
                    </h2>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <ConfigurationModal 
                    isOpen={true}
                    onClose={() => {}}
                    isEmployeeDashboard={false}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <ScheduleManagement />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              {/* Solo mostrar logo y título en desktop */}
              {!isMobile ? (
                <>
                  <Logo />
                  <div className="ml-4">
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {t('scheduleAdministrationPanel')}
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('welcome')}, {currentEmployee?.name}
                      {isDistrictManager && currentStore && (
                        <span className="ml-2 text-blue-600 dark:text-blue-400">
                          • {currentStore.name}
                        </span>
                      )}
                    </p>
                  </div>
                </>
              ) : (
                /* En móvil solo mostrar saludo */
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t('welcome')}, {currentEmployee?.name}
                  </h1>
                  {isDistrictManager && currentStore && (
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      {currentStore.name}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <NotificationCenter 
                employees={employees}
                currentEmployee={currentEmployee}
                isManager={true}
              />
              
              {/* Solo mostrar en desktop */}
              {!isMobile && (
                <>
                  <KeyboardShortcuts 
                    currentTab={activeTab}
                    isManager={true}
                  />
                  <button
                    onClick={() => setActiveTab('configuration')}
                    className="flex items-center text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:text-gray-100"
                    title={t('configuration')}
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  <ThemeToggle />
                </>
              )}
              
              {/* Botón de volver al selector de tiendas - solo para encargados de distrito */}
              {isDistrictManager && !isMobile && (
                <button
                  onClick={handleBackToStoreSelector}
                  className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                  title={t('back')}
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  {t('store')}
                </button>
              )}
              
              {/* Botón de cerrar sesión - solo visible en desktop */}
              {!isMobile && (
                <button
                  onClick={logout}
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:text-gray-100"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  {t('logout')}
                </button>
              )}
              
            </div>
            
            {/* Menú hamburguesa - solo visible en móvil */}
            <HamburgerMenu 
              activeTab={activeTab}
              onTabChange={(tab) => {
                setActiveTab(tab as TabType);
              }}
              isManager={true}
              onShowKeyboardHelp={() => setShowKeyboardHelp(true)}
              onLogout={logout}
              onBackToStoreSelector={isDistrictManager ? handleBackToStoreSelector : undefined}
            />
          </div>
        </div>
      </header>

      {/* Navigation Tabs - solo visible en desktop */}
      {!isMobile && (
        <nav className="bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>

      {/* Birthday Notification */}
      {showBirthdayNotification && (
        <BirthdayNotification 
          employees={employees}
          onClose={() => setShowBirthdayNotification(false)}
        />
      )}

    </div>
  );
}


