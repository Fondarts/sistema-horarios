import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserAvatar({ size = 'md', className = '' }: UserAvatarProps) {
  const { currentEmployee } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    // Cargar imagen de perfil desde localStorage si existe
    const loadImage = () => {
      if (currentEmployee?.id) {
        const savedImage = localStorage.getItem(`user_profile_image_${currentEmployee.id}`);
        setProfileImage(savedImage);
      } else {
        setProfileImage(null);
      }
    };

    loadImage();

    // Escuchar cambios en localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (currentEmployee?.id && e.key === `user_profile_image_${currentEmployee.id}`) {
        setProfileImage(e.newValue);
      }
    };

    // Escuchar evento personalizado para cambios en el mismo tab
    const handleCustomStorageChange = () => {
      loadImage();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userProfileImageUpdated', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userProfileImageUpdated', handleCustomStorageChange);
    };
  }, [currentEmployee?.id]);

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  if (profileImage) {
    return (
      <img
        src={profileImage}
        alt="Usuario"
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center ${className}`}>
      <User className={`${iconSizeClasses[size]} text-gray-500 dark:text-gray-400`} />
    </div>
  );
}
