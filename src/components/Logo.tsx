import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface LogoProps {
  size?: 'small' | 'large';
}

export function Logo({ size = 'small' }: LogoProps) {
  const { theme } = useTheme();
  
  const sizeClass = size === 'large' ? 'h-16' : 'h-10';
  
  return (
    <div className="flex items-center">
      <img
        src={theme === 'dark' ? '/images/Miin_Dark.webp' : '/images/Miin_Light.webp'}
        alt="Miin Logo"
        className={`${sizeClass} w-auto`}
      />
    </div>
  );
}
