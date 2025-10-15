import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp
} from 'firebase/firestore';

export interface Notification {
  id: string;
  userId: string;
  type: 'vacation_approved' | 'vacation_rejected' | 'vacation_modified' | 'schedule_change' | 'birthday' | 'absence_request' | 'absence_approved' | 'absence_rejected';
  title: string;
  message: string;
  data?: any; // Datos adicionales específicos del tipo de notificación
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar notificaciones desde Firebase
  useEffect(() => {
    // En una app real, esto debería filtrar por el usuario actual
    // Por ahora cargamos todas las notificaciones
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsData: Notification[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        notificationsData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          readAt: data.readAt?.toDate?.()?.toISOString() || undefined
        } as Notification);
      });
      setNotifications(notificationsData);
      setIsLoading(false);
    }, (error) => {
      console.error('Error loading notifications:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addNotification = async (notificationData: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
    try {
      const newNotification = {
        ...notificationData,
        isRead: false,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'notifications'), newNotification);
    } catch (error) {
      console.error('Error adding notification:', error);
      throw error;
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        isRead: true,
        readAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      const updatePromises = unreadNotifications.map(notification => 
        markAsRead(notification.id)
      );
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      isLoading
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
