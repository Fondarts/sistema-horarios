import React, { useState } from 'react';
import { Menu, X, Calendar, Users, Plane, CalendarDays, Home, BarChart3, FileText } from 'lucide-react';
import { useCompactMode } from '../contexts/CompactModeContext';

interface HamburgerMenuProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isManager?: boolean;
}

export function HamburgerMenu({ activeTab, onTabChange, isManager = false }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isMobile } = useCompactMode();

  const managerTabs = [
    { id: 'schedule', label: 'Horarios', icon: Calendar },
    { id: 'employees', label: 'Empleados', icon: Users },
    { id: 'vacations', label: 'Vacaciones', icon: Plane },
    { id: 'holidays', label: 'Feriados', icon: CalendarDays },
    { id: 'settings', label: 'Tienda', icon: Home },
    { id: 'statistics', label: 'Estadísticas', icon: BarChart3 },
    { id: 'export', label: 'Exportar', icon: FileText },
  ];

  const employeeTabs = [
    { id: 'schedule', label: 'Mis Horarios', icon: Calendar },
    { id: 'vacations', label: 'Mis Vacaciones', icon: Plane },
  ];

  const tabs = isManager ? managerTabs : employeeTabs;

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    setIsOpen(false);
  };

  // Solo mostrar en móvil
  if (!isMobile) {
    return null;
  }

  return (
    <>
      {/* Botón hamburguesa */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        aria-label="Abrir menú"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Menú lateral */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header del menú */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {isManager ? 'Administración' : 'Mi Panel'}
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de opciones */}
        <nav className="p-4">
          <ul className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => handleTabClick(tab.id)}
                    className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {tab.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
}
