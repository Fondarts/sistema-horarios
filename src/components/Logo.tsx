import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export function Logo() {
  const { isDark } = useTheme();
  
  return (
    <div className="flex items-center">
      <img
        src={isDark ? '/images/Miin_Dark.webp' : '/images/Miin_Light.webp'}
        alt="Miin Logo"
        className="h-8 w-auto"
      />
    </div>
  );
}
