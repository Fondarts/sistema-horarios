import React, { useState } from 'react';
import { X, Settings, Globe, Flag } from 'lucide-react';

interface ConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConfigurationModal({ isOpen, onClose }: ConfigurationModalProps) {
  const [language, setLanguage] = useState('es');
  const [country, setCountry] = useState('AR');

  const languages = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' }
  ];

  const countries = [
    { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
    { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
    { code: 'CL', name: 'Chile', flag: '🇨🇱' },
    { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
    { code: 'PE', name: 'Perú', flag: '🇵🇪' },
    { code: 'MX', name: 'México', flag: '🇲🇽' },
    { code: 'ES', name: 'España', flag: '🇪🇸' },
    { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' }
  ];

  const handleSave = () => {
    // Aquí se guardarían las configuraciones
    console.log('Configuración guardada:', { language, country });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Configuración
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Idioma */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <Globe className="w-4 h-4" />
              <span>Idioma de la aplicación</span>
            </label>
            <div className="grid grid-cols-1 gap-2">
              {languages.map((lang) => (
                <label
                  key={lang.code}
                  className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    language === lang.code
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="language"
                    value={lang.code}
                    checked={language === lang.code}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="sr-only"
                  />
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="text-gray-900 dark:text-gray-100">{lang.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* País */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <Flag className="w-4 h-4" />
              <span>País (para feriados)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {countries.map((countryOption) => (
                <label
                  key={countryOption.code}
                  className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                    country === countryOption.code
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="country"
                    value={countryOption.code}
                    checked={country === countryOption.code}
                    onChange={(e) => setCountry(e.target.value)}
                    className="sr-only"
                  />
                  <span className="text-lg">{countryOption.flag}</span>
                  <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
                    {countryOption.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
