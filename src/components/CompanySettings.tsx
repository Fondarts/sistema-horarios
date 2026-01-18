import React, { useState } from 'react';
import { Settings, Upload, Image as ImageIcon, Palette, Building2, Sun, Moon } from 'lucide-react';
import { useCompanySettings } from '../contexts/CompanySettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { isIT } from '../utils/rolePermissions';
import { useLanguage } from '../contexts/LanguageContext';

export function CompanySettings() {
  const { settings, updateSettings, isLoading } = useCompanySettings();
  const { currentEmployee } = useAuth();
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  // Obtener colores según el tema actual
  const getCurrentColors = () => {
    if (theme === 'dark') {
      return {
        primary: settings?.primaryColorDark || settings?.primaryColor || '#3B82F6',
        secondary: settings?.secondaryColorDark || settings?.secondaryColor || '#10B981',
        accent: settings?.accentColorDark || settings?.accentColor || '#F59E0B'
      };
    } else {
      return {
        primary: settings?.primaryColorLight || settings?.primaryColor || '#3B82F6',
        secondary: settings?.secondaryColorLight || settings?.secondaryColor || '#10B981',
        accent: settings?.accentColorLight || settings?.accentColor || '#F59E0B'
      };
    }
  };

  const currentColors = getCurrentColors();
  
  const [formData, setFormData] = useState({
    // Colores modo claro
    primaryColorLight: settings?.primaryColorLight || settings?.primaryColor || '#3B82F6',
    secondaryColorLight: settings?.secondaryColorLight || settings?.secondaryColor || '#10B981',
    accentColorLight: settings?.accentColorLight || settings?.accentColor || '#F59E0B',
    // Colores modo oscuro
    primaryColorDark: settings?.primaryColorDark || settings?.primaryColor || '#60A5FA',
    secondaryColorDark: settings?.secondaryColorDark || settings?.secondaryColor || '#34D399',
    accentColorDark: settings?.accentColorDark || settings?.accentColor || '#FBBF24',
    companyName: settings?.companyName || '',
    defaultTheme: settings?.defaultTheme || theme
  });

  // Verificar permisos
  const canEdit = currentEmployee && isIT(currentEmployee.role);

  React.useEffect(() => {
    if (settings) {
      setFormData({
        primaryColorLight: settings.primaryColorLight || settings.primaryColor || '#3B82F6',
        secondaryColorLight: settings.secondaryColorLight || settings.secondaryColor || '#10B981',
        accentColorLight: settings.accentColorLight || settings.accentColor || '#F59E0B',
        primaryColorDark: settings.primaryColorDark || settings.primaryColor || '#60A5FA',
        secondaryColorDark: settings.secondaryColorDark || settings.secondaryColor || '#34D399',
        accentColorDark: settings.accentColorDark || settings.accentColor || '#FBBF24',
        companyName: settings.companyName || '',
        defaultTheme: settings.defaultTheme || theme
      });
      if (settings.logoUrl) {
        setLogoPreview(settings.logoUrl);
      }
    }
  }, [settings, theme]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona una imagen válida');
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        alert('La imagen es demasiado grande. Máximo 2MB');
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canEdit) {
      alert('Solo el personal de IT puede modificar la configuración de la empresa');
      return;
    }

    try {
      // Determinar qué logo usar: si hay un nuevo logo, usar ese; si no, mantener el existente
      let logoUrl: string | undefined = settings?.logoUrl;
      
      if (logoFile && logoPreview) {
        // Si hay un nuevo logo seleccionado, usar ese
        logoUrl = logoPreview; // Guardamos como base64
      } else if (!logoPreview && !settings?.logoUrl) {
        // Si se eliminó el preview y no había logo guardado, eliminar el logo
        logoUrl = undefined;
      }
      // Si no hay cambios en el logo, mantener el existente (logoUrl ya tiene el valor correcto)

      const updates: Partial<CompanySettings> = {
        logoUrl: logoUrl,
        primaryColorLight: formData.primaryColorLight,
        secondaryColorLight: formData.secondaryColorLight,
        accentColorLight: formData.accentColorLight,
        primaryColorDark: formData.primaryColorDark,
        secondaryColorDark: formData.secondaryColorDark,
        accentColorDark: formData.accentColorDark,
        companyName: formData.companyName || undefined,
        defaultTheme: formData.defaultTheme,
        updatedBy: currentEmployee!.id
      };

      await updateSettings(updates);

      // Aplicar el tema por defecto si cambió
      if (formData.defaultTheme !== theme) {
        setTheme(formData.defaultTheme);
      }

      alert('Configuración guardada exitosamente');
      setLogoFile(null);
      // Mantener logoPreview para que se muestre después de guardar
    } catch (error) {
      console.error('Error saving company settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al guardar la configuración: ${errorMessage}. Por favor, intenta nuevamente.`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Configuración de Empresa
              </h2>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {!canEdit ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Solo el personal de IT puede modificar la configuración de la empresa
                </p>
                <div className="mt-4 space-y-4">
                  {settings?.logoUrl && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Logo Actual
                      </label>
                      <img
                        src={settings.logoUrl}
                        alt="Logo de la empresa"
                        className="h-20 w-auto mx-auto"
                      />
                    </div>
                  )}
                  {settings?.companyName && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nombre de la Empresa
                      </label>
                      <div className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700">
                        {settings.companyName}
                      </div>
                    </div>
                  )}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tema por Defecto: {settings?.defaultTheme === 'dark' ? 'Modo Oscuro' : 'Modo Claro'}
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Colores - Modo Claro
                      </label>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Principal</label>
                          <div
                            className="w-full h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600"
                            style={{ backgroundColor: settings?.primaryColorLight || settings?.primaryColor || '#3B82F6' }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Secundario</label>
                          <div
                            className="w-full h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600"
                            style={{ backgroundColor: settings?.secondaryColorLight || settings?.secondaryColor || '#10B981' }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Acento</label>
                          <div
                            className="w-full h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600"
                            style={{ backgroundColor: settings?.accentColorLight || settings?.accentColor || '#F59E0B' }}
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Colores - Modo Oscuro
                      </label>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Principal</label>
                          <div
                            className="w-full h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600"
                            style={{ backgroundColor: settings?.primaryColorDark || settings?.primaryColor || '#60A5FA' }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Secundario</label>
                          <div
                            className="w-full h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600"
                            style={{ backgroundColor: settings?.secondaryColorDark || settings?.secondaryColor || '#34D399' }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Acento</label>
                          <div
                            className="w-full h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600"
                            style={{ backgroundColor: settings?.accentColorDark || settings?.accentColor || '#FBBF24' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Logo */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    <ImageIcon className="w-4 h-4" />
                    <span>Logo de la Empresa</span>
                  </label>
                  <div className="flex items-center space-x-4">
                    {(logoPreview || settings?.logoUrl) && (
                      <div className="relative">
                        <img
                          src={logoPreview || settings?.logoUrl}
                          alt="Preview del logo"
                          className="h-20 w-auto border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                        />
                        {logoPreview && (
                          <button
                            type="button"
                            onClick={() => {
                              setLogoPreview(null);
                              setLogoFile(null);
                              // Limpiar el input file
                              const fileInput = document.getElementById('logo-upload') as HTMLInputElement;
                              if (fileInput) fileInput.value = '';
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                            title="Eliminar logo"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    )}
                    <div className="flex flex-col space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer inline-flex items-center space-x-2"
                      >
                        <Upload className="w-4 h-4" />
                        <span>{(logoPreview || settings?.logoUrl) ? 'Cambiar Logo' : 'Subir Logo'}</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Nombre de la Empresa */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    <Building2 className="w-4 h-4" />
                    <span>Nombre de la Empresa</span>
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ingrese el nombre de la empresa"
                  />
                </div>

                {/* Tema por Defecto */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {formData.defaultTheme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    <span>Tema por Defecto</span>
                  </label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, defaultTheme: 'light' }))}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                        formData.defaultTheme === 'light'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Sun className="w-4 h-4" />
                      <span>Modo Claro</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, defaultTheme: 'dark' }))}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                        formData.defaultTheme === 'dark'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Moon className="w-4 h-4" />
                      <span>Modo Oscuro</span>
                    </button>
                  </div>
                </div>

                {/* Paleta de Colores - Modo Claro */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    <Palette className="w-4 h-4" />
                    <Sun className="w-4 h-4" />
                    <span>Paleta de Colores - Modo Claro</span>
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Color Principal
                      </label>
                      <input
                        type="color"
                        value={formData.primaryColorLight}
                        onChange={(e) => setFormData(prev => ({ ...prev, primaryColorLight: e.target.value }))}
                        className="w-full h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Color Secundario
                      </label>
                      <input
                        type="color"
                        value={formData.secondaryColorLight}
                        onChange={(e) => setFormData(prev => ({ ...prev, secondaryColorLight: e.target.value }))}
                        className="w-full h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Color de Acento
                      </label>
                      <input
                        type="color"
                        value={formData.accentColorLight}
                        onChange={(e) => setFormData(prev => ({ ...prev, accentColorLight: e.target.value }))}
                        className="w-full h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Paleta de Colores - Modo Oscuro */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    <Palette className="w-4 h-4" />
                    <Moon className="w-4 h-4" />
                    <span>Paleta de Colores - Modo Oscuro</span>
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Color Principal
                      </label>
                      <input
                        type="color"
                        value={formData.primaryColorDark}
                        onChange={(e) => setFormData(prev => ({ ...prev, primaryColorDark: e.target.value }))}
                        className="w-full h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Color Secundario
                      </label>
                      <input
                        type="color"
                        value={formData.secondaryColorDark}
                        onChange={(e) => setFormData(prev => ({ ...prev, secondaryColorDark: e.target.value }))}
                        className="w-full h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Color de Acento
                      </label>
                      <input
                        type="color"
                        value={formData.accentColorDark}
                        onChange={(e) => setFormData(prev => ({ ...prev, accentColorDark: e.target.value }))}
                        className="w-full h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    Guardar Configuración
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
