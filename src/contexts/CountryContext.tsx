import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Country = 'AR' | 'UY' | 'CL' | 'CO' | 'PE' | 'MX' | 'ES' | 'US';

interface CountryContextType {
  country: Country;
  setCountry: (country: Country) => void;
}

const CountryContext = createContext<CountryContextType | undefined>(undefined);

export function useCountry() {
  const context = useContext(CountryContext);
  if (context === undefined) {
    throw new Error('useCountry must be used within a CountryProvider');
  }
  return context;
}

interface CountryProviderProps {
  children: ReactNode;
}

export function CountryProvider({ children }: CountryProviderProps) {
  const [country, setCountryState] = useState<Country>('ES'); // Default to Spain

  // Load country from localStorage on mount
  useEffect(() => {
    const savedCountry = localStorage.getItem('selectedCountry') as Country;
    if (savedCountry) {
      setCountryState(savedCountry);
    }
  }, []);

  const setCountry = (newCountry: Country) => {
    setCountryState(newCountry);
    localStorage.setItem('selectedCountry', newCountry);
  };

  return (
    <CountryContext.Provider value={{ country, setCountry }}>
      {children}
    </CountryContext.Provider>
  );
}
