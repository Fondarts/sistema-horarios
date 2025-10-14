import React, { useState } from 'react';
import { Menu, X, Calendar, Users, Plane, CalendarDays, Home, BarChart3, FileText, Sun, Moon, HelpCircle, LogOut } from 'lucide-react';
import { useCompactMode } from '../contexts/CompactModeContext';
import { useTheme } from '../contexts/ThemeContext';
import { Logo } from './Logo';

interface HamburgerMenuProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isManager?: boolean;
  onShowKeyboardHelp?: () => void;
  onLogout?: () => void;
}

export function HamburgerMenu({ activeTab, onTabChange, isManager = false, onShowKeyboardHelp, onLogout }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isMobile } = useCompactMode();
  const { theme, toggleTheme } = useTheme();

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

  const handleThemeToggle = () => {
    toggleTheme();
    setIsOpen(false);
  };

  const handleKeyboardHelp = () => {
    if (onShowKeyboardHelp) {
      onShowKeyboardHelp();
    }
    setIsOpen(false);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
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
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Menú lateral */}
      <div 
        className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ marginLeft: '0 !important' }}
      >
        {/* Header del menú */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1"></div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Logo */}
          <div className="flex justify-start mb-3">
            <Logo size="small" />
          </div>
          
          {/* Título */}
          <div className="text-left">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Panel de Administración de Horarios
            </h3>
          </div>
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
                    <Icon className="w-5 h-5" style={{ marginRight: '12px' }} />
                    {tab.label}
                  </button>
                </li>
              );
            })}
          </ul>
          
          {/* Separador */}
          <div className="border-t border-gray-200 dark:border-gray-600 my-4"></div>
          
          {/* Botones de configuración */}
          <ul className="space-y-2">
            <li>
              <button
                onClick={handleThemeToggle}
                className="w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" style={{ marginRight: '12px' }} /> : <Moon className="w-5 h-5" style={{ marginRight: '12px' }} />}
                {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
              </button>
            </li>
            {onShowKeyboardHelp && (
              <li>
                <button
                  onClick={handleKeyboardHelp}
                  className="w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <HelpCircle className="w-5 h-5" style={{ marginRight: '12px' }} />
                  Atajos de Teclado
                </button>
              </li>
            )}
          </ul>
        </nav>
        
        {/* Footer con cerrar sesión */}
        {onLogout && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-3 rounded-lg text-left transition-colors text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <LogOut className="w-5 h-5" style={{ marginRight: '12px' }} />
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </>
  );
}
