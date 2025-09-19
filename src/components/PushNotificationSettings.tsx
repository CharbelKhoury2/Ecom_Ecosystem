/**
 * Push Notification Settings Component
 * Allows users to enable/disable push notifications and manage preferences
 */

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Check, X, AlertCircle, Settings } from 'lucide-react';
import PushProvider from '../services/providers/pushProvider';
import { useNotificationHelpers } from './NotificationSystem';

interface PushNotificationSettingsProps {
  userId?: string;
  onSettingsChange?: (enabled: boolean) => void;
}

const PushNotificationSettings: React.FC<PushNotificationSettingsProps> = ({
  userId = 'current_user',
  onSettingsChange
}) => {
  const [pushProvider] = useState(() => new PushProvider());
  const [status, setStatus] = useState({
    supported: false,
    permission: 'default' as NotificationPermission,
    subscribed: false
  });
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const { showSuccess, showError, showWarning } = useNotificationHelpers();

  useEffect(() => {
    checkPushStatus();
  }, []);

  const checkPushStatus = async () => {
    try {
      setLoading(true);
      const currentStatus = await pushProvider.getStatus();
      setStatus(currentStatus);
    } catch (error) {
      console.error('Error checking push status:', error);
      showError('Failed to check push notification status');
    } finally {
      setLoading(false);
    }
  };

  const handleEnablePush = async () => {
    try {
      setSubscribing(true);
      
      const result = await pushProvider.subscribeUser(userId);
      
      if (result.success) {
        showSuccess('Push notifications enabled successfully!');
        await checkPushStatus();
        onSettingsChange?.(true);
      } else {
        showError(result.error || 'Failed to enable push notifications');
      }
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      showError('Failed to enable push notifications');
    } finally {
      setSubscribing(false);
    }
  };

  const handleDisablePush = async () => {
    try {
      setSubscribing(true);
      
      const result = await pushProvider.unsubscribeUser(userId);
      
      if (result.success) {
        showSuccess('Push notifications disabled successfully');
        await checkPushStatus();
        onSettingsChange?.(false);
      } else {
        showError(result.error || 'Failed to disable push notifications');
      }
    } catch (error) {
      console.error('Error disabling push notifications:', error);
      showError('Failed to disable push notifications');
    } finally {
      setSubscribing(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      if (!status.subscribed) {
        showWarning('Please enable push notifications first');
        return;
      }

      // Create a test notification
      const testPayload = {
        id: `test_push_${Date.now()}`,
        type: 'system' as const,
        severity: 'low' as const,
        title: 'Test Push Notification',
        message: 'This is a test push notification from EcomPilot OS',
        userId,
        timestamp: new Date()
      };

      const testPreferences = {
        userId,
        push: {
          enabled: true,
          types: ['system'],
          severities: ['low', 'medium', 'high', 'critical']
        }
      };

      const result = await pushProvider.send(testPayload, testPreferences as any);
      
      if (result.success) {
        showSuccess('Test notification sent! Check your browser notifications.');
      } else {
        showError(result.error || 'Failed to send test notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      showError('Failed to send test notification');
    }
  };

  const getStatusColor = () => {
    if (!status.supported) return 'text-gray-500';
    if (status.permission === 'denied') return 'text-red-500';
    if (status.subscribed) return 'text-green-500';
    return 'text-yellow-500';
  };

  const getStatusText = () => {
    if (!status.supported) return 'Not Supported';
    if (status.permission === 'denied') return 'Permission Denied';
    if (status.subscribed) return 'Enabled';
    if (status.permission === 'granted') return 'Permission Granted';
    return 'Disabled';
  };

  const getStatusIcon = () => {
    if (!status.supported || status.permission === 'denied') {
      return <BellOff className="h-5 w-5" />;
    }
    if (status.subscribed) {
      return <Bell className="h-5 w-5 text-green-500" />;
    }
    return <Bell className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {getStatusIcon()}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white ml-2">
            Browser Push Notifications
          </h3>
        </div>
        <div className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </div>
      </div>

      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
        Receive real-time notifications directly in your browser, even when the app is closed.
      </p>

      {/* Browser Support Check */}
      {!status.supported && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 mb-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Browser Not Supported
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Your browser doesn't support push notifications. Please use a modern browser like Chrome, Firefox, or Safari.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Permission Denied */}
      {status.supported && status.permission === 'denied' && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-4">
          <div className="flex items-center">
            <X className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                Permission Denied
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Push notifications have been blocked. Please enable them in your browser settings and refresh the page.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Enabled Status */}
      {status.subscribed && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4 mb-4">
          <div className="flex items-center">
            <Check className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
                Push Notifications Enabled
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                You'll receive real-time notifications for alerts and important updates.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {status.supported && status.permission !== 'denied' && (
          <>
            {!status.subscribed ? (
              <button
                onClick={handleEnablePush}
                disabled={subscribing}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {subscribing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Bell className="h-4 w-4 mr-2" />
                )}
                {subscribing ? 'Enabling...' : 'Enable Push Notifications'}
              </button>
            ) : (
              <button
                onClick={handleDisablePush}
                disabled={subscribing}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {subscribing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <BellOff className="h-4 w-4 mr-2" />
                )}
                {subscribing ? 'Disabling...' : 'Disable Push Notifications'}
              </button>
            )}

            {status.subscribed && (
              <button
                onClick={handleTestNotification}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <Settings className="h-4 w-4 mr-2" />
                Send Test Notification
              </button>
            )}
          </>
        )}
      </div>

      {/* Browser Instructions */}
      {status.supported && status.permission === 'default' && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            How to Enable Push Notifications:
          </h4>
          <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
            <li>Click "Enable Push Notifications" above</li>
            <li>Allow notifications when prompted by your browser</li>
            <li>You'll start receiving real-time alerts and updates</li>
          </ol>
        </div>
      )}

      {/* Feature List */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          What you'll receive:
        </h4>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
          <li className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
            Critical inventory alerts (out of stock, low stock)
          </li>
          <li className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
            System notifications and updates
          </li>
          <li className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
            Report completion notifications
          </li>
          <li className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
            Important security alerts
          </li>
        </ul>
      </div>
    </div>
  );
};

export default PushNotificationSettings;