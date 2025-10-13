import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Calendar, Users, Settings, BarChart3, FileText } from 'lucide-react';
import { EmployeeManagement } from './EmployeeManagement';
import ScheduleManagement from './ScheduleManagement';
import { StoreSettings } from './StoreSettings';
import { Statistics } from './Statistics';
import { ExportTools } from './ExportTools';

type TabType = 'schedule' | 'employees' | 'settings' | 'statistics' | 'export';

export function ManagerDashboard() {
  const { currentEmployee, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('schedule');

  const tabs = [
    { id: 'schedule' as TabType, label: 'Horarios', icon: Calendar },
    { id: 'employees' as TabType, label: 'Empleados', icon: Users },
    { id: 'settings' as TabType, label: 'Configuración', icon: Settings },
    { id: 'statistics' as TabType, label: 'Estadísticas', icon: BarChart3 },
    { id: 'export' as TabType, label: 'Exportar', icon: FileText },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'schedule':
        return <ScheduleManagement />;
      case 'employees':
        return <EmployeeManagement />;
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-primary-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Panel de Administración
                </h1>
                <p className="text-sm text-gray-600">
                  Bienvenido, {user?.name}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
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
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
}


