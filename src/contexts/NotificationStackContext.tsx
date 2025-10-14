import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Notification {
  id: string;
  type: 'birthday' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number; // en milisegundos, undefined = no auto-hide
  component?: ReactNode;
}

interface NotificationStackContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationStackContext = createContext<NotificationStackContextType | undefined>(undefined);

export function NotificationStackProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>): string => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove si tiene duración
    if (notification.duration) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration);
    }

    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationStackContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAll
    }}>
      {children}
    </NotificationStackContext.Provider>
  );
}

export function useNotificationStack() {
  const context = useContext(NotificationStackContext);
  if (context === undefined) {
    throw new Error('useNotificationStack must be used within a NotificationStackProvider');
  }
  return context;
}
