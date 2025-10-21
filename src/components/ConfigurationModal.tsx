import React, { useState } from 'react';
import { X, Settings, Globe, Flag, Calendar } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCountry, Country } from '../contexts/CountryContext';
import { useDateFormat, DateFormat } from '../contexts/DateFormatContext';
import { useAuth } from '../contexts/AuthContext';

interface ConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEmployeeDashboard?: boolean;
}

export function ConfigurationModal({ isOpen, onClose, isEmployeeDashboard = false }: ConfigurationModalProps) {
  const { language, setLanguage, t } = useLanguage();
  const { country, setCountry } = useCountry();
  const { dateFormat, setDateFormat } = useDateFormat();
  const { currentEmployee } = useAuth();

  const languages = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' }
  ];

  const countries = [
    { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
    { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
    { code: 'CL', name: 'Chile', flag: '🇨🇱' },
    { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
    { code: 'PE', name: 'Perú', flag: '🇵🇪' },
    { code: 'MX', name: 'México', flag: '🇲🇽' },
    { code: 'ES', name: 'España', flag: '🇪🇸' },
    { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
    { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
    { code: 'DE', name: 'Alemania', flag: '🇩🇪' },
    { code: 'GB', name: 'Inglaterra', flag: '🇬🇧' },
    { code: 'IT', name: 'Italia', flag: '🇮🇹' },
    { code: 'FR', name: 'Francia', flag: '🇫🇷' },
    { code: 'AD', name: 'Andorra', flag: '🇦🇩' }
  ];

  const dateFormats = [
    { code: 'dd/mm/yyyy' as DateFormat, name: t('dateFormatDDMMYYYY') },
    { code: 'mm/dd/yyyy' as DateFormat, name: t('dateFormatMMDDYYYY') },
    { code: 'yyyy/mm/dd' as DateFormat, name: t('dateFormatYYYYMMDD') }
  ];

  const handleSave = () => {
    // El idioma, país y formato de fecha ya se guardan automáticamente en sus respectivos contextos
    console.log('Configuración guardada:', { language, country, dateFormat });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="space-y-6">
      {/* Idioma */}
      <div>
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          <Globe className="w-4 h-4" />
          <span>{t('language')}</span>
        </label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as 'es' | 'en' | 'pt' | 'it' | 'de' | 'fr')}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* País - Solo para encargados y encargados de distrito, pero NO desde dashboard de empleado */}
      {(() => {
        console.log('ConfigurationModal Debug:', {
          isEmployeeDashboard,
          currentEmployeeRole: currentEmployee?.role,
          shouldShowCountry: !isEmployeeDashboard && (currentEmployee?.role === 'encargado' || currentEmployee?.role === 'distrito')
        });
        return !isEmployeeDashboard && (currentEmployee?.role === 'encargado' || currentEmployee?.role === 'distrito');
      })() && (
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            <Flag className="w-4 h-4" />
            <span>{t('country')}</span>
          </label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value as Country)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {countries.map((countryOption) => (
              <option key={countryOption.code} value={countryOption.code}>
                {countryOption.flag} {countryOption.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Formato de Fecha */}
      <div>
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          <Calendar className="w-4 h-4" />
          <span>{t('dateFormat')}</span>
        </label>
        <select
          value={dateFormat}
          onChange={(e) => setDateFormat(e.target.value as DateFormat)}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {dateFormats.map((format) => (
            <option key={format.code} value={format.code}>
              {format.name}
            </option>
          ))}
        </select>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleSave}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          {t('save')}
        </button>
      </div>
    </div>
  );
}
