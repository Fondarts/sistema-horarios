import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CompactModeContextType {
  isCompactMode: boolean;
  toggleCompactMode: () => void;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

const CompactModeContext = createContext<CompactModeContextType | undefined>(undefined);

export function CompactModeProvider({ children }: { children: ReactNode }) {
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });

  // Detectar tamaño de pantalla
  const isMobile = screenSize.width < 768;
  const isTablet = screenSize.width >= 768 && screenSize.width < 1024;
  const isDesktop = screenSize.width >= 1024;

  // Auto-activar modo compacto en móviles
  useEffect(() => {
    if (isMobile) {
      setIsCompactMode(true);
    }
  }, [isMobile]);

  // Escuchar cambios de tamaño de ventana
  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleCompactMode = () => {
    setIsCompactMode(prev => !prev);
  };

  return (
    <CompactModeContext.Provider value={{
      isCompactMode,
      toggleCompactMode,
      isMobile,
      isTablet,
      isDesktop
    }}>
      {children}
    </CompactModeContext.Provider>
  );
}

export function useCompactMode() {
  const context = useContext(CompactModeContext);
  if (context === undefined) {
    throw new Error('useCompactMode must be used within a CompactModeProvider');
  }
  return context;
}
