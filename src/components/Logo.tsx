import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useCompanySettings } from '../contexts/CompanySettingsContext';

interface LogoProps {
  size?: 'small' | 'large';
}

export function Logo({ size = 'small' }: LogoProps) {
  const { theme } = useTheme();
  const { settings } = useCompanySettings();
  
  const sizeClass = size === 'large' ? 'h-16' : 'h-10';
  
  // Obtener el logo según el tema: si hay logo específico, usarlo; si no, usar el otro; si no hay ninguno, mostrar nombre
  const logoSrc = theme === 'dark' 
    ? (settings?.logoUrlDark || settings?.logoUrlLight || settings?.logoUrl)
    : (settings?.logoUrlLight || settings?.logoUrlDark || settings?.logoUrl);
  
  // Si no hay logo, mostrar el nombre de la empresa
  if (!logoSrc) {
    const companyName = settings?.companyName || 'Miin Korean Cosmetics';
    return (
      <div className="flex items-center">
        <span className={`${sizeClass === 'h-16' ? 'text-2xl' : 'text-lg'} font-bold text-gray-900 dark:text-gray-100`}>
          {companyName}
        </span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center">
      <img
        src={logoSrc}
        alt="Logo de la empresa"
        className={`${sizeClass} w-auto`}
        onError={(e) => {
          // Si el logo falla al cargar, mostrar el nombre de la empresa
          const target = e.target as HTMLImageElement;
          const parent = target.parentElement;
          if (parent) {
            const companyName = settings?.companyName || 'Miin Korean Cosmetics';
            parent.innerHTML = `<span class="${sizeClass === 'h-16' ? 'text-2xl' : 'text-lg'} font-bold text-gray-900 dark:text-gray-100">${companyName}</span>`;
          }
        }}
      />
    </div>
  );
}
