/**
 * Enhanced notification system with multiple channels and improved UX
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Bell, Settings, Volume2, VolumeX } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'warning' | 'info';
type NotificationChannel = 'toast' | 'banner' | 'modal' | 'sound';
type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

interface NotificationAction {
  label: string;
  onClick: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

interface EnhancedNotification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  actions?: NotificationAction[];
  metadata?: Record<string, unknown>;
  timestamp: number;
  read?: boolean;
  category?: string;
}

interface NotificationSettings {
  soundEnabled: boolean;
  toastEnabled: boolean;
  bannerEnabled: boolean;
  priorityFilter: NotificationPriority;
  categoryFilters: string[];
}

interface EnhancedNotificationContextType {
  notifications: EnhancedNotification[];
  unreadCount: number;
  settings: NotificationSettings;
  addNotification: (notification: Omit<EnhancedNotification, 'id' | 'timestamp'>) => string;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
}

const EnhancedNotificationContext = createContext<EnhancedNotificationContextType | undefined>(undefined);

export const useEnhancedNotifications = () => {
  const context = useContext(EnhancedNotificationContext);
  if (!context) {
    throw new Error('useEnhancedNotifications must be used within an EnhancedNotificationProvider');
  }
  return context;
};

interface EnhancedNotificationProviderProps {
  children: React.ReactNode;
  maxNotifications?: number;
  defaultSettings?: Partial<NotificationSettings>;
}

export const EnhancedNotificationProvider: React.FC<EnhancedNotificationProviderProps> = ({ 
  children, 
  maxNotifications = 10,
  defaultSettings = {}
}) => {
  const [notifications, setNotifications] = useState<EnhancedNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    soundEnabled: true,
    toastEnabled: true,
    bannerEnabled: true,
    priorityFilter: 'low',
    categoryFilters: [],
    ...defaultSettings
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('notification-settings');
    if (savedSettings) {
      try {
        setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
      } catch (error) {
        console.warn('Failed to load notification settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('notification-settings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const playNotificationSound = useCallback((priority: NotificationPriority) => {
    if (!settings.soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different tones for different priorities
      const frequencies = {
        low: 440,
        medium: 554,
        high: 659,
        critical: 880
      };
      
      oscillator.frequency.setValueAtTime(frequencies[priority], audioContext.currentTime);
      oscillator.type = priority === 'critical' ? 'sawtooth' : 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }, [settings.soundEnabled]);

  const shouldShowNotification = useCallback((notification: EnhancedNotification) => {
    // Check priority filter
    const priorityLevels = { low: 0, medium: 1, high: 2, critical: 3 };
    if (priorityLevels[notification.priority] < priorityLevels[settings.priorityFilter]) {
      return false;
    }
    
    // Check category filter
    if (notification.category && settings.categoryFilters.includes(notification.category)) {
      return false;
    }
    
    return true;
  }, [settings]);

  const addNotification = useCallback((notification: Omit<EnhancedNotification, 'id' | 'timestamp'>) => {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: EnhancedNotification = {
      ...notification,
      id,
      timestamp: Date.now(),
      duration: notification.duration ?? (notification.priority === 'critical' ? 0 : 5000),
      channels: notification.channels || ['toast'],
      priority: notification.priority || 'medium'
    };

    if (!shouldShowNotification(newNotification)) {
      return id;
    }

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      return updated.slice(0, maxNotifications);
    });

    // Play sound if enabled and sound channel is requested
    if (newNotification.channels.includes('sound')) {
      playNotificationSound(newNotification.priority);
    }

    // Auto-remove notification after duration (unless persistent)
    if (!notification.persistent && newNotification.duration! > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    // Browser notification for high priority
    if (newNotification.priority === 'critical' || newNotification.priority === 'high') {
      requestBrowserNotification(newNotification);
    }

    return id;
  }, [maxNotifications, shouldShowNotification, playNotificationSound]);

  const requestBrowserNotification = useCallback((notification: EnhancedNotification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'critical'
      });
    } else if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          requestBrowserNotification(notification);
        }
      });
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <EnhancedNotificationContext.Provider value={{
      notifications,
      unreadCount,
      settings,
      addNotification,
      removeNotification,
      markAsRead,
      markAllAsRead,
      clearAll,
      updateSettings,
    }}>
      {children}
      <NotificationContainer />
      <NotificationCenter />
    </EnhancedNotificationContext.Provider>
  );
};

// Toast notifications container
const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification, markAsRead, settings } = useEnhancedNotifications();
  
  const toastNotifications = notifications.filter(n => 
    n.channels.includes('toast') && settings.toastEnabled
  );

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toastNotifications.slice(0, 5).map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onRemove={() => removeNotification(notification.id)}
          onRead={() => markAsRead(notification.id)}
        />
      ))}
    </div>
  );
};

// Banner notifications
const BannerNotifications: React.FC = () => {
  const { notifications, removeNotification, settings } = useEnhancedNotifications();
  
  const bannerNotifications = notifications.filter(n => 
    n.channels.includes('banner') && 
    settings.bannerEnabled && 
    (n.priority === 'critical' || n.priority === 'high')
  );

  if (bannerNotifications.length === 0) return null;

  const notification = bannerNotifications[0];

  return (
    <div className={`w-full p-4 ${
      notification.type === 'error' ? 'bg-red-600' :
      notification.type === 'warning' ? 'bg-yellow-600' :
      notification.type === 'success' ? 'bg-green-600' :
      'bg-blue-600'
    } text-white`}>
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          {getNotificationIcon(notification.type, 'text-white')}
          <div>
            <p className="font-medium">{notification.title}</p>
            {notification.message && (
              <p className="text-sm opacity-90">{notification.message}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {notification.actions?.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className="px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-sm font-medium transition-colors"
            >
              {action.label}
            </button>
          ))}
          
          <button
            onClick={() => removeNotification(notification.id)}
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Notification center (dropdown)
const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    settings, 
    markAllAsRead, 
    clearAll, 
    updateSettings,
    removeNotification 
  } = useEnhancedNotifications();

  return (
    <div className="fixed top-4 left-4 z-50">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute top-12 left-0 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 dark:text-white">Notifications</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <Settings className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>
            
            {/* Settings Panel */}
            {showSettings && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.soundEnabled}
                      onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Sound notifications</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.toastEnabled}
                      onChange={(e) => updateSettings({ toastEnabled: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Toast notifications</span>
                  </label>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Priority filter:</span>
                    <select
                      value={settings.priorityFilter}
                      onChange={(e) => updateSettings({ priorityFilter: e.target.value as NotificationPriority })}
                      className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800"
                    >
                      <option value="low">All</option>
                      <option value="medium">Medium+</option>
                      <option value="high">High+</option>
                      <option value="critical">Critical only</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRemove={() => removeNotification(notification.id)}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={clearAll}
                className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                Clear all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Individual notification components
interface NotificationToastProps {
  notification: EnhancedNotification;
  onRemove: () => void;
  onRead: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onRemove, onRead }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!notification.read) {
      const timer = setTimeout(() => onRead(), 1000);
      return () => clearTimeout(timer);
    }
  }, [notification.read, onRead]);

  const handleRemove = () => {
    setIsLeaving(true);
    setTimeout(onRemove, 300);
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${getNotificationColorClasses(notification.type)}
        border rounded-lg shadow-lg p-4 backdrop-blur-sm
        ${notification.priority === 'critical' ? 'ring-2 ring-red-500 ring-opacity-50' : ''}
      `}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              {notification.title}
            </h4>
            <div className="flex items-center space-x-1">
              {!notification.read && (
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
              )}
              <button
                onClick={handleRemove}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {notification.message && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {notification.message}
            </p>
          )}
          
          {notification.actions && notification.actions.length > 0 && (
            <div className="mt-3 flex space-x-2">
              {notification.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`text-sm font-medium px-3 py-1 rounded transition-colors ${
                    action.style === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                    action.style === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' :
                    'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface NotificationItemProps {
  notification: EnhancedNotification;
  onRemove: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onRemove }) => {
  return (
    <div className={`p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
      !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
    }`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getNotificationIcon(notification.type, 'w-4 h-4')}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {notification.title}
              </p>
              {notification.message && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {notification.message}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {new Date(notification.timestamp).toLocaleString()}
              </p>
            </div>
            
            <div className="flex items-center space-x-1">
              {!notification.read && (
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
              )}
              <button
                onClick={onRemove}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions
function getNotificationIcon(type: NotificationType, className: string = 'w-5 h-5') {
  const iconClass = `${className} ${
    type === 'success' ? 'text-green-600' :
    type === 'error' ? 'text-red-600' :
    type === 'warning' ? 'text-yellow-600' :
    'text-blue-600'
  }`;

  switch (type) {
    case 'success':
      return <CheckCircle className={iconClass} />;
    case 'error':
      return <AlertCircle className={iconClass} />;
    case 'warning':
      return <AlertTriangle className={iconClass} />;
    case 'info':
      return <Info className={iconClass} />;
  }
}

function getNotificationColorClasses(type: NotificationType): string {
  switch (type) {
    case 'success':
      return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
    case 'error':
      return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
    case 'warning':
      return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
    case 'info':
      return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
  }
}

// Convenience hooks
export const useEnhancedNotificationHelpers = () => {
  const { addNotification } = useEnhancedNotifications();

  return {
    showSuccess: (title: string, message?: string, options?: Partial<EnhancedNotification>) => 
      addNotification({ 
        type: 'success', 
        title, 
        message, 
        priority: 'medium',
        channels: ['toast'],
        ...options 
      }),
    
    showError: (title: string, message?: string, options?: Partial<EnhancedNotification>) => 
      addNotification({ 
        type: 'error', 
        title, 
        message, 
        priority: 'high',
        channels: ['toast', 'sound'],
        ...options 
      }),
    
    showWarning: (title: string, message?: string, options?: Partial<EnhancedNotification>) => 
      addNotification({ 
        type: 'warning', 
        title, 
        message, 
        priority: 'medium',
        channels: ['toast'],
        ...options 
      }),
    
    showInfo: (title: string, message?: string, options?: Partial<EnhancedNotification>) => 
      addNotification({ 
        type: 'info', 
        title, 
        message, 
        priority: 'low',
        channels: ['toast'],
        ...options 
      }),
      
    showCritical: (title: string, message?: string, options?: Partial<EnhancedNotification>) => 
      addNotification({ 
        type: 'error', 
        title, 
        message, 
        priority: 'critical',
        channels: ['toast', 'banner', 'sound'],
        persistent: true,
        ...options 
      }),
  };
};

export { BannerNotifications };