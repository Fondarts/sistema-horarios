import { useEffect } from 'react';
import { useCompanySettings } from '../contexts/CompanySettingsContext';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Componente que inyecta los colores de CompanySettings como CSS variables
 * para que se apliquen dinámicamente a toda la aplicación
 */
export function ThemeColorInjector() {
  const { settings } = useCompanySettings();
  const { theme } = useTheme();

  useEffect(() => {
    if (!settings) return;

    const root = document.documentElement;

    // Función auxiliar para generar variaciones de color (más claro/más oscuro)
    const lightenColor = (color: string, percent: number): string => {
      const num = parseInt(color.replace('#', ''), 16);
      const r = (num >> 16) + Math.round(255 * percent);
      const g = (num >> 8 & 0x00FF) + Math.round(255 * percent);
      const b = (num & 0x0000FF) + Math.round(255 * percent);
      return '#' + (0x1000000 + (r < 255 ? r < 1 ? 0 : r : 255) * 0x10000 +
        (g < 255 ? g < 1 ? 0 : g : 255) * 0x100 +
        (b < 255 ? b < 1 ? 0 : b : 255)).toString(16).slice(1);
    };

    const darkenColor = (color: string, percent: number): string => {
      const num = parseInt(color.replace('#', ''), 16);
      const r = Math.round((num >> 16) * (1 - percent));
      const g = Math.round((num >> 8 & 0x00FF) * (1 - percent));
      const b = Math.round((num & 0x0000FF) * (1 - percent));
      return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
    };

    if (theme === 'dark') {
      // Colores para modo oscuro
      // Color Principal = Fondo
      const bgColor = settings.primaryColorDark ?? settings.primaryColor ?? '#1F2937';
      // Color Secundario = Tipografía
      const textColor = settings.secondaryColorDark ?? settings.secondaryColor ?? '#F9FAFB';
      // Color de Acento = Selecciones/Hover
      const accentColor = settings.accentColorDark ?? settings.accentColor ?? '#FBBF24';

      // Variables para fondo (tonalidades del color principal)
      root.style.setProperty('--color-bg-primary', bgColor);
      // Para recuadros/cards, usar una versión más clara del color principal
      root.style.setProperty('--color-bg-primary-light', lightenColor(bgColor, 0.25));
      root.style.setProperty('--color-bg-primary-lighter', lightenColor(bgColor, 0.7));
      root.style.setProperty('--color-bg-primary-dark', darkenColor(bgColor, 0.1));
      
      // Variables para texto (tonalidades del color secundario)
      root.style.setProperty('--color-text-primary', textColor);
      root.style.setProperty('--color-text-secondary', darkenColor(textColor, 0.2));
      root.style.setProperty('--color-text-muted', darkenColor(textColor, 0.4));
      
      // Variables para acento (hover, selecciones, etc.)
      root.style.setProperty('--color-accent', accentColor);
      root.style.setProperty('--color-accent-hover', lightenColor(accentColor, 0.1));
      root.style.setProperty('--color-accent-active', darkenColor(accentColor, 0.1));

      // Mantener compatibilidad con primary/secondary para botones y elementos interactivos
      root.style.setProperty('--color-primary-500', accentColor);
      root.style.setProperty('--color-primary-600', darkenColor(accentColor, 0.15));
      root.style.setProperty('--color-primary-700', darkenColor(accentColor, 0.25));
    } else {
      // Colores para modo claro
      // Color Principal = Fondo
      const bgColor = settings.primaryColorLight ?? settings.primaryColor ?? '#F9FAFB';
      // Color Secundario = Tipografía
      const textColor = settings.secondaryColorLight ?? settings.secondaryColor ?? '#1F2937';
      // Color de Acento = Selecciones/Hover
      const accentColor = settings.accentColorLight ?? settings.accentColor ?? '#3B82F6';

      // Variables para fondo (tonalidades del color principal)
      root.style.setProperty('--color-bg-primary', bgColor);
      // Para recuadros/cards, usar una versión más clara del color principal
      root.style.setProperty('--color-bg-primary-light', lightenColor(bgColor, 0.2));
      root.style.setProperty('--color-bg-primary-lighter', lightenColor(bgColor, 0.65));
      root.style.setProperty('--color-bg-primary-dark', darkenColor(bgColor, 0.05));
      
      // Variables para texto (tonalidades del color secundario)
      root.style.setProperty('--color-text-primary', textColor);
      root.style.setProperty('--color-text-secondary', lightenColor(textColor, 0.2));
      root.style.setProperty('--color-text-muted', lightenColor(textColor, 0.4));
      
      // Variables para acento (hover, selecciones, etc.)
      root.style.setProperty('--color-accent', accentColor);
      root.style.setProperty('--color-accent-hover', darkenColor(accentColor, 0.1));
      root.style.setProperty('--color-accent-active', darkenColor(accentColor, 0.2));

      // Mantener compatibilidad con primary/secondary para botones y elementos interactivos
      root.style.setProperty('--color-primary-500', accentColor);
      root.style.setProperty('--color-primary-600', darkenColor(accentColor, 0.15));
      root.style.setProperty('--color-primary-700', darkenColor(accentColor, 0.25));
    }
  }, [settings, theme]);

  return null; // Este componente no renderiza nada
}
