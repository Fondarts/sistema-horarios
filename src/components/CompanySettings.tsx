import React, { useState } from 'react';
import { Settings, Upload, Image as ImageIcon, Palette, Building2, Sun, Moon, CheckCircle, X } from 'lucide-react';
import { useCompanySettings } from '../contexts/CompanySettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { isIT } from '../utils/rolePermissions';
import { useLanguage } from '../contexts/LanguageContext';
import { CompanySettings as CompanySettingsType } from '../types';
import { HistoryService } from '../services/historyService';

export function CompanySettings() {
  const { settings, updateSettings, isLoading } = useCompanySettings();
  const { currentEmployee } = useAuth();
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  const [logoFileLight, setLogoFileLight] = useState<File | null>(null);
  const [logoPreviewLight, setLogoPreviewLight] = useState<string | null>(null);
  const [logoFileDark, setLogoFileDark] = useState<File | null>(null);
  const [logoPreviewDark, setLogoPreviewDark] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Estado para los colores realmente aplicados en la página
  const [appliedColors, setAppliedColors] = useState({
    primaryLight: '#3B82F6',
    secondaryLight: '#10B981',
    accentLight: '#F59E0B',
    primaryDark: '#60A5FA',
    secondaryDark: '#34D399',
    accentDark: '#FBBF24'
  });

  // Obtener colores realmente aplicados desde CSS variables
  React.useEffect(() => {
    const root = document.documentElement;
    const getComputedColor = (varName: string, fallback: string) => {
      const computed = getComputedStyle(root).getPropertyValue(varName).trim();
      return computed || fallback;
    };

    // Obtener colores del modo claro
    // Color Principal = Fondo
    const primaryLight = getComputedColor('--color-bg-primary', settings?.primaryColorLight ?? settings?.primaryColor ?? '#F9FAFB');
    // Color Secundario = Texto
    const secondaryLight = getComputedColor('--color-text-primary', settings?.secondaryColorLight ?? settings?.secondaryColor ?? '#1F2937');
    // Color de Acento = Hover/Selecciones
    const accentLight = getComputedColor('--color-accent', settings?.accentColorLight ?? settings?.accentColor ?? '#3B82F6');

    // Obtener colores del modo oscuro
    // Color Principal = Fondo
    const primaryDark = getComputedColor('--color-bg-primary', settings?.primaryColorDark ?? settings?.primaryColor ?? '#1F2937');
    // Color Secundario = Texto
    const secondaryDark = getComputedColor('--color-text-primary', settings?.secondaryColorDark ?? settings?.secondaryColor ?? '#F9FAFB');
    // Color de Acento = Hover/Selecciones
    const accentDark = getComputedColor('--color-accent', settings?.accentColorDark ?? settings?.accentColor ?? '#FBBF24');

    setAppliedColors({
      primaryLight,
      secondaryLight,
      accentLight,
      primaryDark,
      secondaryDark,
      accentDark
    });
  }, [settings, theme]);

  // Obtener colores según el tema actual
  const getCurrentColors = () => {
    if (theme === 'dark') {
      return {
        primary: appliedColors.primaryDark,
        secondary: appliedColors.secondaryDark,
        accent: appliedColors.accentDark
      };
    } else {
      return {
        primary: appliedColors.primaryLight,
        secondary: appliedColors.secondaryLight,
        accent: appliedColors.accentLight
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
    companyName: settings?.companyName || ''
  });

  // Verificar permisos
  const canEdit = currentEmployee && isIT(currentEmployee.role);

  React.useEffect(() => {
    if (settings) {
      // Usar los valores guardados directamente, sin fallback a valores por defecto
      // para que se muestren los colores reales guardados
      setFormData({
        primaryColorLight: settings.primaryColorLight ?? settings.primaryColor ?? '#3B82F6',
        secondaryColorLight: settings.secondaryColorLight ?? settings.secondaryColor ?? '#10B981',
        accentColorLight: settings.accentColorLight ?? settings.accentColor ?? '#F59E0B',
        primaryColorDark: settings.primaryColorDark ?? settings.primaryColor ?? '#60A5FA',
        secondaryColorDark: settings.secondaryColorDark ?? settings.secondaryColor ?? '#34D399',
        accentColorDark: settings.accentColorDark ?? settings.accentColor ?? '#FBBF24',
        companyName: settings.companyName ?? ''
      });
      // Actualizar logoPreview solo si no hay un logoFile pendiente (para no sobrescribir cambios no guardados)
      if (!logoFileLight) {
        // Solo restaurar el logo guardado si no se ha marcado explícitamente para eliminar
        if (logoPreviewLight === undefined) {
          if (settings.logoUrlLight || settings.logoUrl) {
            setLogoPreviewLight(settings.logoUrlLight || settings.logoUrl || null);
          } else {
            setLogoPreviewLight(null);
          }
        }
        // Si logoPreviewLight es null, mantenerlo así (marcado para eliminación)
      }
      if (!logoFileDark) {
        // Solo restaurar el logo guardado si no se ha marcado explícitamente para eliminar
        // Si logoPreviewDark es null, significa que se marcó para eliminar, no restaurar
        if (logoPreviewDark === undefined) {
          if (settings.logoUrlDark) {
            setLogoPreviewDark(settings.logoUrlDark);
          } else {
            setLogoPreviewDark(null);
          }
        }
        // Si logoPreviewDark es null, mantenerlo así (marcado para eliminación)
      }
    }
  }, [settings, theme]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>, mode: 'light' | 'dark') => {
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

      if (mode === 'light') {
        setLogoFileLight(file);
        const reader = new FileReader();
        reader.onload = (event) => {
          setLogoPreviewLight(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setLogoFileDark(file);
        const reader = new FileReader();
        reader.onload = (event) => {
          setLogoPreviewDark(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Función para comprimir imagen (más agresiva para que quepa en Firestore)
  const compressImage = (file: File, maxWidth: number = 400, quality: number = 0.6): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Redimensionar si es necesario
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No se pudo crear el contexto del canvas'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Error al comprimir la imagen'));
                return;
              }
              // Convertir a base64 para guardar en Firestore
              const reader = new FileReader();
              reader.onload = () => {
                const base64 = reader.result as string;
                // Verificar que el tamaño sea menor a 1MB (límite de Firestore)
                if (base64.length > 1000000) {
                  // Si aún es muy grande, comprimir más
                  const smallerCanvas = document.createElement('canvas');
                  smallerCanvas.width = Math.max(200, width * 0.7);
                  smallerCanvas.height = Math.max(200, height * 0.7);
                  const smallerCtx = smallerCanvas.getContext('2d');
                  if (smallerCtx) {
                    smallerCtx.drawImage(img, 0, 0, smallerCanvas.width, smallerCanvas.height);
                    smallerCanvas.toBlob(
                      (smallerBlob) => {
                        if (!smallerBlob) {
                          reject(new Error('Error al comprimir la imagen'));
                          return;
                        }
                        const smallerReader = new FileReader();
                        smallerReader.onload = () => {
                          resolve(smallerReader.result as string);
                        };
                        smallerReader.onerror = () => reject(new Error('Error al leer la imagen comprimida'));
                        smallerReader.readAsDataURL(smallerBlob);
                      },
                      file.type,
                      0.5
                    );
                  } else {
                    reject(new Error('No se pudo crear el contexto del canvas'));
                  }
                } else {
                  resolve(base64);
                }
              };
              reader.onerror = () => reject(new Error('Error al leer la imagen comprimida'));
              reader.readAsDataURL(blob);
            },
            file.type,
            quality
          );
        };
        img.onerror = () => reject(new Error('Error al cargar la imagen'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canEdit) {
      alert('Solo el personal de IT puede modificar la configuración de la empresa');
      return;
    }

    // Verificar que el usuario esté autenticado
    if (!currentEmployee) {
      alert('Debes estar autenticado para guardar la configuración');
      return;
    }

    try {
      // Determinar qué logos usar: si hay nuevos logos, comprimirlos; si no, mantener los existentes
      let logoUrlLight: string | undefined = settings?.logoUrlLight || settings?.logoUrl;
      let logoUrlDark: string | undefined = settings?.logoUrlDark;
      
      // Procesar logo para modo claro
      if (logoFileLight) {
        try {
          const compressedBase64 = await compressImage(logoFileLight);
          if (compressedBase64.length > 1000000) {
            throw new Error('La imagen del logo claro es demasiado grande incluso después de comprimirla. Por favor, usa una imagen más pequeña.');
          }
          console.log('Logo claro comprimido exitosamente:', { size: compressedBase64.length });
          logoUrlLight = compressedBase64;
        } catch (compressError: any) {
          console.error('Error al comprimir el logo claro:', compressError);
          const errorMessage = compressError?.message || 'Error desconocido';
          throw new Error(`Error al procesar el logo claro: ${errorMessage}. Por favor, intenta con una imagen más pequeña.`);
        }
      } else if (!logoPreviewLight && (settings?.logoUrlLight || settings?.logoUrl)) {
        // Si se eliminó el preview (logoPreviewLight es null) y había un logo guardado, eliminarlo
        logoUrlLight = undefined;
      } else if (!logoPreviewLight && !settings?.logoUrlLight && !settings?.logoUrl) {
        // Si no hay preview ni logo guardado, mantener undefined
        logoUrlLight = undefined;
      }
      
      // Procesar logo para modo oscuro
      if (logoFileDark) {
        try {
          const compressedBase64 = await compressImage(logoFileDark);
          if (compressedBase64.length > 1000000) {
            throw new Error('La imagen del logo oscuro es demasiado grande incluso después de comprimirla. Por favor, usa una imagen más pequeña.');
          }
          console.log('Logo oscuro comprimido exitosamente:', { size: compressedBase64.length });
          logoUrlDark = compressedBase64;
        } catch (compressError: any) {
          console.error('Error al comprimir el logo oscuro:', compressError);
          const errorMessage = compressError?.message || 'Error desconocido';
          throw new Error(`Error al procesar el logo oscuro: ${errorMessage}. Por favor, intenta con una imagen más pequeña.`);
        }
      } else if (!logoPreviewDark && settings?.logoUrlDark) {
        // Si se eliminó el preview y había un logo guardado, eliminarlo
        logoUrlDark = undefined;
      } else if (!logoPreviewDark && !settings?.logoUrlDark) {
        // Si no hay preview ni logo guardado, mantener undefined
        logoUrlDark = undefined;
      }
      // Si no hay cambios en el logo, mantener el existente (logoUrl ya tiene el valor correcto)

      // Construir updates sin campos undefined o vacíos
      const updates: Partial<CompanySettingsType> = {
        updatedBy: currentEmployee!.id
      };
      
      // Manejar logos: si tienen valor, guardarlos; si son undefined, eliminarlos del documento
      // Siempre actualizar logoUrlLight si hay cambios
      if (logoUrlLight !== (settings?.logoUrlLight || settings?.logoUrl)) {
        updates.logoUrlLight = logoUrlLight; // Puede ser string o undefined
      }
      // Siempre actualizar logoUrlDark si hay cambios o si se eliminó
      if (logoUrlDark !== settings?.logoUrlDark) {
        updates.logoUrlDark = logoUrlDark; // Puede ser string o undefined (undefined elimina el campo)
      }
      
      // Agregar colores (siempre deben tener valor)
      updates.primaryColorLight = formData.primaryColorLight;
      updates.secondaryColorLight = formData.secondaryColorLight;
      updates.accentColorLight = formData.accentColorLight;
      updates.primaryColorDark = formData.primaryColorDark;
      updates.secondaryColorDark = formData.secondaryColorDark;
      updates.accentColorDark = formData.accentColorDark;
      
      // Agregar companyName solo si tiene valor
      if (formData.companyName && formData.companyName.trim()) {
        updates.companyName = formData.companyName.trim();
      }
      // Si companyName está vacío, no lo incluimos en updates (se mantendrá el valor anterior o undefined)
      
      await updateSettings(updates);
      
      // Registrar en historial
      await HistoryService.logCompanySettingsUpdated(currentEmployee!.id);

      // Actualizar los previews de los logos después de guardar
      if (logoUrlLight) {
        setLogoPreviewLight(logoUrlLight);
      } else {
        setLogoPreviewLight(null);
      }
      if (logoUrlDark) {
        setLogoPreviewDark(logoUrlDark);
      } else {
        setLogoPreviewDark(null);
      }
      
      setLogoFileLight(null);
      setLogoFileDark(null);
      setShowSuccessModal(true);
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
      {/* Modal de éxito */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-2">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Configuración guardada
                </h3>
              </div>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              La configuración se ha guardado exitosamente.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

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
                        Colores - Modo Claro
                      </label>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Principal (Fondo)</label>
                          <div
                            className="w-full h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600"
                            style={{ backgroundColor: appliedColors.primaryLight }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Secundario (Texto)</label>
                          <div
                            className="w-full h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600"
                            style={{ backgroundColor: appliedColors.secondaryLight }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Acento (Hover/Selección)</label>
                          <div
                            className="w-full h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600"
                            style={{ backgroundColor: appliedColors.accentLight }}
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
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Principal (Fondo)</label>
                          <div
                            className="w-full h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600"
                            style={{ backgroundColor: appliedColors.primaryDark }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Secundario (Texto)</label>
                          <div
                            className="w-full h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600"
                            style={{ backgroundColor: appliedColors.secondaryDark }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Acento (Hover/Selección)</label>
                          <div
                            className="w-full h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600"
                            style={{ backgroundColor: appliedColors.accentDark }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Logo Modo Claro */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    <ImageIcon className="w-4 h-4" />
                    <Sun className="w-4 h-4" />
                    <span>Logo de la Empresa - Modo Claro</span>
                  </label>
                  <div className="flex items-center space-x-4">
                    {/* Mostrar preview si hay logoPreviewLight (string) o si hay logo guardado Y no se ha marcado para eliminar */}
                    {(logoPreviewLight || (settings?.logoUrlLight && logoPreviewLight !== null) || (settings?.logoUrl && logoPreviewLight !== null)) && (
                      <div className="relative">
                        <img
                          src={logoPreviewLight || settings?.logoUrlLight || settings?.logoUrl || ''}
                          alt="Preview del logo modo claro"
                          className="h-20 w-auto border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white p-2"
                          onError={(e) => {
                            console.error('Error loading logo image');
                            setLogoPreviewLight(null);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            // Establecer a null para marcar para eliminación
                            setLogoPreviewLight(null);
                            setLogoFileLight(null);
                            const fileInput = document.getElementById('logo-upload-light') as HTMLInputElement;
                            if (fileInput) fileInput.value = '';
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          title="Eliminar logo"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    <div className="flex flex-col space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleLogoChange(e, 'light')}
                        className="hidden"
                        id="logo-upload-light"
                      />
                      <label
                        htmlFor="logo-upload-light"
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer inline-flex items-center space-x-2"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Cargar Logo</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Logo Modo Oscuro */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    <ImageIcon className="w-4 h-4" />
                    <Moon className="w-4 h-4" />
                    <span>Logo de la Empresa - Modo Oscuro</span>
                  </label>
                  <div className="flex items-center space-x-4">
                    {/* Mostrar preview si hay logoPreviewDark (string) o si hay logo guardado Y no se ha marcado para eliminar (logoPreviewDark !== null) */}
                    {(logoPreviewDark || (settings?.logoUrlDark && logoPreviewDark !== null)) && (
                      <div className="relative">
                        <img
                          src={logoPreviewDark || settings?.logoUrlDark || ''}
                          alt="Preview del logo modo oscuro"
                          className="h-20 w-auto border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-800 p-2"
                          onError={(e) => {
                            console.error('Error loading logo image');
                            setLogoPreviewDark(null);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            // Establecer a null para marcar para eliminación (el preview desaparecerá)
                            setLogoPreviewDark(null);
                            setLogoFileDark(null);
                            const fileInput = document.getElementById('logo-upload-dark') as HTMLInputElement;
                            if (fileInput) fileInput.value = '';
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          title="Eliminar logo"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    <div className="flex flex-col space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleLogoChange(e, 'dark')}
                        className="hidden"
                        id="logo-upload-dark"
                      />
                      <label
                        htmlFor="logo-upload-dark"
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer inline-flex items-center space-x-2"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Cargar Logo</span>
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
                        Color Principal (Fondo)
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
                        Color Secundario (Texto)
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
                        Color de Acento (Hover/Selección)
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
                        Color Principal (Fondo)
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
                        Color Secundario (Texto)
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
                        Color de Acento (Hover/Selección)
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
