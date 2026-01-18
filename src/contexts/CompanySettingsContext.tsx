import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CompanySettings } from '../types';
import { db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

interface CompanySettingsContextType {
  settings: CompanySettings | null;
  updateSettings: (updates: Partial<CompanySettings>) => Promise<void>;
  isLoading: boolean;
}

const CompanySettingsContext = createContext<CompanySettingsContextType | undefined>(undefined);

export function CompanySettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const settingsRef = doc(db, 'companySettings', 'main');
    
    // Escuchar cambios en tiempo real
    const unsubscribe = onSnapshot(
      settingsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setSettings(snapshot.data() as CompanySettings);
        } else {
          // Crear configuración por defecto si no existe
          const defaultSettings: CompanySettings = {
            id: 'main',
            logoUrl: undefined,
            primaryColorLight: '#3B82F6', // Azul por defecto modo claro
            secondaryColorLight: '#10B981', // Verde por defecto modo claro
            accentColorLight: '#F59E0B', // Amarillo por defecto modo claro
            primaryColorDark: '#60A5FA', // Azul más claro para modo oscuro
            secondaryColorDark: '#34D399', // Verde más claro para modo oscuro
            accentColorDark: '#FBBF24', // Amarillo más claro para modo oscuro
            companyName: undefined,
            defaultTheme: 'light',
            updatedAt: new Date().toISOString(),
            updatedBy: ''
          };
          setSettings(defaultSettings);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('Error loading company settings:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateSettings = async (updates: Partial<CompanySettings>) => {
    try {
      const settingsRef = doc(db, 'companySettings', 'main');
      const currentData = await getDoc(settingsRef);
      
      // Filtrar campos undefined ya que Firestore no los acepta
      const filteredUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );
      
      const updatedSettings: CompanySettings = {
        id: 'main',
        ...(currentData.exists() ? currentData.data() : {}),
        ...filteredUpdates,
        updatedAt: new Date().toISOString()
      } as CompanySettings;

      await setDoc(settingsRef, updatedSettings, { merge: true });
    } catch (error) {
      console.error('Error updating company settings:', error);
      throw error;
    }
  };

  return (
    <CompanySettingsContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </CompanySettingsContext.Provider>
  );
}

export function useCompanySettings() {
  const context = useContext(CompanySettingsContext);
  if (context === undefined) {
    throw new Error('useCompanySettings must be used within a CompanySettingsProvider');
  }
  return context;
}
