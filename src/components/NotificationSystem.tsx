/**
 * Notification System Component
 * Provides notification context and helper functions
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { Bell } from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import { NotificationPayload } from '../services/notificationService';

interface NotificationContextType {
  unreadCount: number;
  showNotificationCenter: boolean;
  toggleNotificationCenter: () => void;
  addNotification: (notification: NotificationPayload) => void;
  markAsRead: (notificationId: string) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);

  // Load initial unread count
  useEffect(() => {
    loadUnreadCount();
    
    // Set up real-time notification listener
    // TODO: Implement WebSocket or Server-Sent Events for real-time notifications
    const interval = setInterval(() => {
      // Poll for new notifications
      checkForNewNotifications();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      // TODO: Load from API
      // const response = await fetch('/api/notifications/unread-count');
      // const data = await response.json();
      // setUnreadCount(data.count);
      
      // Mock data for now
      setUnreadCount(3);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const checkForNewNotifications = async () => {
    try {
      // TODO: Check for new notifications from API
      // const response = await fetch('/api/notifications/recent');
      // const newNotifications = await response.json();
      
      // For now, simulate occasional new notifications
      if (Math.random() < 0.1) { // 10% chance
        const mockNotification: NotificationPayload = {
          id: `notification_${Date.now()}`,
          type: 'alert',
          severity: 'medium',
          title: 'New Alert',
          message: 'A new alert has been generated',
          userId: 'current_user',
          timestamp: new Date()
        };
        
        addNotification(mockNotification);
      }
    } catch (error) {
      console.error('Error checking for new notifications:', error);
    }
  };

  const toggleNotificationCenter = () => {
    setShowNotificationCenter(prev => !prev);
  };

  const addNotification = (notification: NotificationPayload) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Show toast notification for immediate feedback
    const toastMessage = `${notification.title}: ${notification.message}`;
    
    switch (notification.severity) {
      case 'critical':
      case 'high':
        toast.error(toastMessage, {
          duration: 8000,
          action: {
            label: 'View',
            onClick: () => setShowNotificationCenter(true)
          }
        });
        break;
      case 'medium':
        toast.warning(toastMessage, {
          duration: 5000,
          action: {
            label: 'View',
            onClick: () => setShowNotificationCenter(true)
          }
        });
        break;
      case 'low':
        toast.info(toastMessage, {
          duration: 3000,
          action: {
            label: 'View',
            onClick: () => setShowNotificationCenter(true)
          }
        });
        break;
      default:
        toast(toastMessage, {
          duration: 4000,
          action: {
            label: 'View',
            onClick: () => setShowNotificationCenter(true)
          }
        });
    }
  };

  const markAsRead = (notificationId: string) => {
    setUnreadCount(prev => Math.max(0, prev - 1));
    // TODO: Update in API
  };

  const showSuccess = (message: string) => {
    toast.success(message, {
      duration: 3000
    });
  };

  const showError = (message: string) => {
    toast.error(message, {
      duration: 5000
    });
  };

  const showWarning = (message: string) => {
    toast.warning(message, {
      duration: 4000
    });
  };

  const showInfo = (message: string) => {
    toast.info(message, {
      duration: 3000
    });
  };

  const contextValue: NotificationContextType = {
    unreadCount,
    showNotificationCenter,
    toggleNotificationCenter,
    addNotification,
    markAsRead,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationCenter
        isOpen={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
        onOpenSettings={() => {
          // TODO: Navigate to notification settings
          console.log('Open notification settings');
        }}
      />
    </NotificationContext.Provider>
  );
};

export const useNotificationHelpers = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationHelpers must be used within a NotificationProvider');
  }
  return context;
};

// Notification Bell Component for Header
interface NotificationBellProps {
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ className = '' }) => {
  const { unreadCount, toggleNotificationCenter } = useNotificationHelpers();

  return (
    <button
      onClick={toggleNotificationCenter}
      className={`relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors ${className}`}
      title="Notifications"
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

// Hook for components that need notification functionality
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationProvider;