import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'es' | 'en' | 'pt' | 'it' | 'de' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Cargar idioma desde localStorage o usar español por defecto
    const savedLanguage = localStorage.getItem('horarios_language') as Language;
    return savedLanguage || 'es';
  });

  // Función para cambiar idioma y guardarlo en localStorage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('horarios_language', lang);
  };

  // Función para obtener traducciones
  const t = (key: string): string => {
    try {
      // Importar dinámicamente el archivo de traducción
      const translations = require(`../locales/${language}.ts`);
      const translation = translations[language];
      
      // Navegar por las claves anidadas (ej: "daysOfWeek.monday")
      const keys = key.split('.');
      let result = translation;
      
      for (const k of keys) {
        if (result && typeof result === 'object' && k in result) {
          result = result[k];
        } else {
          // Si no se encuentra la traducción, devolver la clave
          return key;
        }
      }
      
      return typeof result === 'string' ? result : key;
    } catch (error) {
      console.warn(`Translation not found for key: ${key} in language: ${language}`);
      return key;
    }
  };

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      t
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
