import React from 'react';
import { X } from 'lucide-react';
import { useNotificationStack } from '../contexts/NotificationStackContext';

export function NotificationStack() {
  const { notifications, removeNotification } = useNotificationStack();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          className="bg-gray-200 dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 transform transition-all duration-300 ease-in-out"
          style={{
            transform: `translateY(${index * 8}px)`,
            zIndex: 50 - index,
            opacity: 1 - (index * 0.1),
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                {notification.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {notification.message}
              </p>
              {notification.component}
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
