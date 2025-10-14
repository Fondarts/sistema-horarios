import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEmployees } from '../contexts/EmployeeContext';
import { LogOut, Calendar, Users, Home, BarChart3, FileText, Plane, CalendarDays, Maximize2, Minimize2 } from 'lucide-react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useCompactMode } from '../contexts/CompactModeContext';
import { EmployeeManagement } from './EmployeeManagement';
import ScheduleManagement from './ScheduleManagement';
import { StoreSettings } from './StoreSettings';
import { Statistics } from './Statistics';
import { ExportTools } from './ExportTools';
import { VacationManagement } from './VacationManagement';
import { HolidayIntegration } from './HolidayIntegration';
import { ThemeToggle } from './ThemeToggle';
import { BirthdayNotification } from './BirthdayNotification';
import { NotificationCenter } from './NotificationCenter';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { Logo } from './Logo';
import { CompactModeDebug } from './CompactModeDebug';
import { HamburgerMenu } from './HamburgerMenu';

type TabType = 'schedule' | 'employees' | 'settings' | 'statistics' | 'export' | 'vacations' | 'holidays';

export function ManagerDashboard() {
  const { currentEmployee, logout } = useAuth();
  const { employees } = useEmployees();
  const { isCompactMode, toggleCompactMode, isMobile } = useCompactMode();
  const [activeTab, setActiveTab] = useState<TabType>('schedule');
  const [showBirthdayNotification, setShowBirthdayNotification] = useState(true);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  const tabs = [
    { id: 'schedule' as TabType, label: 'Horarios', icon: Calendar },
    { id: 'employees' as TabType, label: 'Empleados', icon: Users },
    { id: 'vacations' as TabType, label: 'Vacaciones', icon: Plane },
    { id: 'holidays' as TabType, label: 'Feriados', icon: CalendarDays },
    { id: 'settings' as TabType, label: 'Tienda', icon: Home },
    { id: 'statistics' as TabType, label: 'Estadísticas', icon: BarChart3 },
    { id: 'export' as TabType, label: 'Exportar', icon: FileText },
  ];

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
      action: () => setActiveTab('vacations'),
      description: 'Ir a pestaña Vacaciones'
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
      case 'vacations':
        return <VacationManagement />;
      case 'holidays':
        return <HolidayIntegration />;
      case 'settings':
        return <StoreSettings />;
      case 'statistics':
        return <Statistics />;
      case 'export':
        return <ExportTools />;
      default:
        return <ScheduleManagement />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <CompactModeDebug />
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Logo />
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Panel de Administración de Horarios
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Bienvenido, {currentEmployee?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Menú hamburguesa - solo visible en móvil */}
              <HamburgerMenu 
                activeTab={activeTab}
                onTabChange={setActiveTab}
                isManager={true}
              />
              
              <NotificationCenter 
                employees={employees}
                currentEmployee={currentEmployee}
                isManager={true}
              />
              <KeyboardShortcuts 
                currentTab={activeTab}
                isManager={true}
              />
              {/* Botón de modo compacto - solo visible en desktop */}
              {!isMobile && (
                <button
                  onClick={toggleCompactMode}
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:text-gray-100"
                  title={isCompactMode ? 'Modo normal' : 'Modo compacto'}
                >
                  {isCompactMode ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
                </button>
              )}
              <ThemeToggle />
              <button
                onClick={logout}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:text-gray-100"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Cerrar Sesión
              </button>
            </div>
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


