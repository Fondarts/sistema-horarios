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
  const [screenSize, setScreenSize] = useState(() => {
    // Inicializar con el tamaño real de la pantalla si está disponible
    if (typeof window !== 'undefined') {
      return {
        width: window.innerWidth,
        height: window.innerHeight
      };
    }
    return {
      width: 1024,
      height: 768
    };
  });

  // Inicializar tamaño de pantalla en el cliente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateSize = () => {
        setScreenSize({
          width: window.innerWidth,
          height: window.innerHeight
        });
      };
      
      // Actualizar inmediatamente
      updateSize();
      
      // Escuchar cambios de tamaño
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }
  }, []);

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
    console.error('useCompactMode must be used within a CompactModeProvider');
    // Retornar valores por defecto en lugar de lanzar error
    return {
      isCompactMode: false,
      toggleCompactMode: () => {},
      isMobile: false,
      isTablet: false,
      isDesktop: true
    };
  }
  return context;
}
