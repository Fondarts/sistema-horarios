import React, { useState, useEffect } from 'react';
import { X, Globe, MapPin, Save, RotateCcw } from 'lucide-react';

interface ConfigurationProps {
  onClose: () => void;
}

interface AppConfig {
  language: string;
  country: string;
}

const LANGUAGES = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

const COUNTRIES = [
  { name: 'Alemania', code: 'DE', flag: '🇩🇪' },
  { name: 'Argentina', code: 'AR', flag: '🇦🇷' },
  { name: 'Bolivia', code: 'BO', flag: '🇧🇴' },
  { name: 'Brasil', code: 'BR', flag: '🇧🇷' },
  { name: 'Chile', code: 'CL', flag: '🇨🇱' },
  { name: 'Colombia', code: 'CO', flag: '🇨🇴' },
  { name: 'Costa Rica', code: 'CR', flag: '🇨🇷' },
  { name: 'Cuba', code: 'CU', flag: '🇨🇺' },
  { name: 'Ecuador', code: 'EC', flag: '🇪🇨' },
  { name: 'El Salvador', code: 'SV', flag: '🇸🇻' },
  { name: 'España', code: 'ES', flag: '🇪🇸' },
  { name: 'Estados Unidos', code: 'US', flag: '🇺🇸' },
  { name: 'Francia', code: 'FR', flag: '🇫🇷' },
  { name: 'Guatemala', code: 'GT', flag: '🇬🇹' },
  { name: 'Honduras', code: 'HN', flag: '🇭🇳' },
  { name: 'Italia', code: 'IT', flag: '🇮🇹' },
  { name: 'México', code: 'MX', flag: '🇲🇽' },
  { name: 'Nicaragua', code: 'NI', flag: '🇳🇮' },
  { name: 'Panamá', code: 'PA', flag: '🇵🇦' },
  { name: 'Paraguay', code: 'PY', flag: '🇵🇾' },
  { name: 'Perú', code: 'PE', flag: '🇵🇪' },
  { name: 'República Dominicana', code: 'DO', flag: '🇩🇴' },
  { name: 'Uruguay', code: 'UY', flag: '🇺🇾' },
  { name: 'Venezuela', code: 'VE', flag: '🇻🇪' },
];

export function Configuration({ onClose }: ConfigurationProps) {
  const [config, setConfig] = useState<AppConfig>({
    language: 'es',
    country: 'España'
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Cargar configuración guardada al montar el componente
  useEffect(() => {
    const savedConfig = localStorage.getItem('appConfig');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
      } catch (error) {
        console.error('Error loading app configuration:', error);
      }
    }
  }, []);

  // Detectar cambios en la configuración
  useEffect(() => {
    const savedConfig = localStorage.getItem('appConfig');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setHasChanges(
          config.language !== parsedConfig.language ||
          config.country !== parsedConfig.country
        );
      } catch (error) {
        setHasChanges(true);
      }
    } else {
      setHasChanges(true);
    }
  }, [config]);

  const handleLanguageChange = (language: string) => {
    setConfig(prev => ({ ...prev, language }));
  };

  const handleCountryChange = (country: string) => {
    setConfig(prev => ({ ...prev, country }));
  };

  const handleSave = () => {
    localStorage.setItem('appConfig', JSON.stringify(config));
    setHasChanges(false);
    // Aquí podrías agregar lógica para recargar la aplicación con la nueva configuración
    console.log('Configuration saved:', config);
  };

  const handleReset = () => {
    const defaultConfig = {
      language: 'es',
      country: 'España'
    };
    setConfig(defaultConfig);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Configuración de la Aplicación
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Language Selection */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Idioma de la Aplicación
              </h3>
            </div>
            <div className="relative">
              <select
                value={config.language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Country Selection */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                País para Feriados Nacionales
              </h3>
            </div>
            <div className="relative">
              <select
                value={config.country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {/* Countries list without codes */}
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.name}>
                    {country.flag} {country.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Esta configuración se utiliza para obtener los feriados nacionales de tu país.
            </p>
          </div>

          {/* Current Configuration Summary */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              Configuración Actual
            </h4>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <div><strong>Idioma:</strong> {LANGUAGES.find(l => l.code === config.language)?.name}</div>
              <div><strong>País:</strong> {config.country}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Restaurar por Defecto
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                hasChanges
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
