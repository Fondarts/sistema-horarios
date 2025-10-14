import React, { useState } from 'react';
import { HelpCircle, X, Keyboard } from 'lucide-react';

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

  const shortcuts: Shortcut[] = [
    // Atajos generales
    {
      key: 'Ctrl + /',
      description: 'Mostrar/ocultar ayuda de atajos',
      category: 'General'
    },
    {
      key: 'Ctrl + D',
      description: 'Alternar modo oscuro',
      category: 'General'
    },
    {
      key: 'Escape',
      description: 'Cerrar modales y paneles',
      category: 'General'
    },
    {
      key: 'Ctrl + B',
      description: 'Abrir centro de notificaciones',
      category: 'General'
    },
  ];

  // Atajos específicos para administradores
  if (isManager) {
    shortcuts.push(
      // Navegación entre pestañas
      {
        key: 'Ctrl + 1',
        description: 'Ir a pestaña Horarios',
        category: 'Navegación'
      },
      {
        key: 'Ctrl + 2',
        description: 'Ir a pestaña Empleados',
        category: 'Navegación'
      },
      {
        key: 'Ctrl + 3',
        description: 'Ir a pestaña Configuración',
        category: 'Navegación'
      },
      {
        key: 'Ctrl + 4',
        description: 'Ir a pestaña Estadísticas',
        category: 'Navegación'
      },
      {
        key: 'Ctrl + 5',
        description: 'Ir a pestaña Exportar',
        category: 'Navegación'
      }
    );

    // Atajos para ScheduleManagement
    if (currentTab === 'schedule') {
      shortcuts.push(
        {
          key: 'Ctrl + N',
          description: 'Crear nuevo turno',
          category: 'Horarios'
        },
        {
          key: 'Ctrl + S',
          description: 'Guardar horarios',
          category: 'Horarios'
        },
        {
          key: 'Ctrl + P',
          description: 'Publicar horarios',
          category: 'Horarios'
        },
        {
          key: '← / →',
          description: 'Navegar entre semanas',
          category: 'Horarios'
        },
        {
          key: '+ / -',
          description: 'Zoom in/out',
          category: 'Horarios'
        },
        {
          key: 'R',
          description: 'Resetear zoom',
          category: 'Horarios'
        }
      );
    }

    // Atajos para EmployeeManagement
    if (currentTab === 'employees') {
      shortcuts.push(
        {
          key: 'Ctrl + N',
          description: 'Agregar nuevo empleado',
          category: 'Empleados'
        },
        {
          key: 'Ctrl + F',
          description: 'Buscar empleados',
          category: 'Empleados'
        },
        {
          key: 'Enter',
          description: 'Guardar empleado',
          category: 'Empleados'
        },
        {
          key: 'Escape',
          description: 'Cancelar edición',
          category: 'Empleados'
        }
      );
    }

    // Atajos para Statistics
    if (currentTab === 'statistics') {
      shortcuts.push(
        {
          key: 'Ctrl + R',
          description: 'Refrescar estadísticas',
          category: 'Estadísticas'
        },
        {
          key: 'Ctrl + E',
          description: 'Exportar estadísticas',
          category: 'Estadísticas'
        }
      );
    }
  } else {
    // Atajos para empleados
    shortcuts.push(
      {
        key: '← / →',
        description: 'Navegar entre semanas',
        category: 'Horarios'
      },
      {
        key: 'Ctrl + R',
        description: 'Refrescar horarios',
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
        title="Atajos de teclado"
      >
        <HelpCircle className="w-5 h-5" />
      </button>

      {/* Panel de atajos */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Keyboard className="w-5 h-5 text-blue-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Atajos de Teclado
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
              Presiona <kbd className="px-1 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-700 rounded">Ctrl + /</kbd> para mostrar/ocultar esta ayuda
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
