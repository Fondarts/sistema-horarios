import React, { useState } from 'react';
import { HelpCircle, X, Keyboard } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export {};

interface KeyboardShortcutsProps {
  currentTab?: string;
  isManager?: boolean;
}

interface Shortcut {
  key: string;
  description: string;
  category: string;
}

export function KeyboardShortcuts({ currentTab, isManager = false }: KeyboardShortcutsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  const shortcuts: Shortcut[] = [
    // Atajos generales
    {
      key: 'Ctrl + /',
      description: t('showHideShortcutsHelp'),
      category: 'General'
    },
    {
      key: 'Ctrl + D',
      description: t('toggleDarkMode'),
      category: 'General'
    },
    {
      key: 'Escape',
      description: t('closeModalsAndPanels'),
      category: 'General'
    },
    {
      key: 'Ctrl + B',
      description: t('openNotificationCenter'),
      category: 'General'
    },
  ];

  // Atajos específicos para administradores
  if (isManager) {
    shortcuts.push(
      // Navegación entre pestañas
      {
        key: 'Ctrl + 1',
        description: t('goToScheduleTab'),
        category: 'Navegación'
      },
      {
        key: 'Ctrl + 2',
        description: t('goToEmployeesTab'),
        category: 'Navegación'
      },
      {
        key: 'Ctrl + 3',
        description: t('goToConfigurationTab'),
        category: 'Navegación'
      },
      {
        key: 'Ctrl + 4',
        description: t('goToStatisticsTab'),
        category: 'Navegación'
      },
      {
        key: 'Ctrl + 5',
        description: t('goToExportTab'),
        category: 'Navegación'
      }
    );

    // Atajos para ScheduleManagement
    if (currentTab === 'schedule') {
      shortcuts.push(
        {
          key: 'Ctrl + N',
          description: t('createNewShift'),
          category: 'Horarios'
        },
        {
          key: 'Ctrl + S',
          description: t('saveSchedules'),
          category: 'Horarios'
        },
        {
          key: 'Ctrl + P',
          description: t('publishSchedules'),
          category: 'Horarios'
        },
        {
          key: '← / →',
          description: t('navigateBetweenWeeks'),
          category: 'Horarios'
        },
        {
          key: '+ / -',
          description: t('zoomInOut'),
          category: 'Horarios'
        },
        {
          key: 'R',
          description: t('resetZoom'),
          category: 'Horarios'
        }
      );
    }

    // Atajos para EmployeeManagement
    if (currentTab === 'employees') {
      shortcuts.push(
        {
          key: 'Ctrl + N',
          description: t('addNewEmployee'),
          category: 'Empleados'
        },
        {
          key: 'Ctrl + F',
          description: t('searchEmployees'),
          category: 'Empleados'
        },
        {
          key: 'Enter',
          description: t('saveEmployee'),
          category: 'Empleados'
        },
        {
          key: 'Escape',
          description: t('cancelEdit'),
          category: 'Empleados'
        }
      );
    }

    // Atajos para Statistics
    if (currentTab === 'statistics') {
      shortcuts.push(
        {
          key: 'Ctrl + R',
          description: t('refreshStatistics'),
          category: 'Estadísticas'
        },
        {
          key: 'Ctrl + E',
          description: t('exportStatistics'),
          category: 'Estadísticas'
        }
      );
    }
  } else {
    // Atajos para empleados
    shortcuts.push(
      {
        key: '← / →',
        description: t('navigateBetweenWeeks'),
        category: 'Horarios'
      },
      {
        key: 'Ctrl + R',
        description: t('refreshSchedules'),
        category: 'Horarios'
      }
    );
  }

  // Agrupar atajos por categoría
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <div className="relative">
      {/* Botón de ayuda */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title={t('keyboardShortcuts')}
      >
        <HelpCircle className="w-5 h-5" />
      </button>

      {/* Panel de atajos */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-96 bg-gray-200 dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Keyboard className="w-5 h-5 text-blue-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {t('keyboardShortcuts')}
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto p-4">
            {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
              <div key={category} className="mb-6 last:mb-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 border-b border-gray-200 dark:border-gray-600 pb-1">
                  {category}
                </h4>
                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {shortcut.description}
                      </span>
                      <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded border border-gray-300 dark:border-gray-600">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {t('pressCtrlSlashToShowHideHelp')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
