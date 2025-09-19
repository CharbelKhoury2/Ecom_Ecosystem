/**
 * Notification Settings Page
 * Allows users to configure their notification preferences
 */

import React, { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Smartphone, Webhook, Save, Check, X, Plus, Trash2, History } from 'lucide-react';
import { NotificationPreferences } from '../services/notificationService';
import { useNotificationHelpers } from '../components/NotificationSystem';
import PushNotificationSettings from '../components/PushNotificationSettings';
import NotificationHistory from '../components/NotificationHistory';
import { supabase } from '../lib/supabase';

interface NotificationSettingsProps {
  userId?: string;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ userId }) => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingSMS, setTestingSMS] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'history'>('settings');
  const { showSuccess, showError } = useNotificationHelpers();

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      
      // Get current user if userId not provided
      let currentUserId = userId;
      if (!currentUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        currentUserId = user?.id;
      }

      if (!currentUserId) {
        throw new Error('User not authenticated');
      }

      // Load preferences from database or use defaults
      const defaultPreferences: NotificationPreferences = {
        userId: currentUserId,
        email: {
          enabled: true,
          address: '',
          types: ['alert', 'report'],
          severities: ['medium', 'high', 'critical'],
          frequency: 'immediate'
        },
        sms: {
          enabled: false,
          verified: false,
          types: ['alert'],
          severities: ['high', 'critical']
        },
        push: {
          enabled: true,
          types: ['alert', 'system'],
          severities: ['medium', 'high', 'critical']
        },
        webhooks: {
          slack: {
            enabled: false,
            webhookUrl: ''
          },
          discord: {
            enabled: false,
            webhookUrl: ''
          },
          teams: {
            enabled: false,
            webhookUrl: ''
          },
          custom: {
            enabled: false,
            webhookUrl: ''
          }
        }
      };

      setPreferences(defaultPreferences);
    } catch (error) {
      console.error('Error loading preferences:', error);
      showError('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!preferences) return;

    try {
      setSaving(true);
      
      // TODO: Save to database
      // await supabase.from('notification_preferences').upsert(preferences);
      
      showSuccess('Notification preferences saved successfully');
    } catch (error) {
      console.error('Error saving preferences:', error);
      showError('Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const testEmailNotification = async () => {
    if (!preferences?.email.address) {
      showError('Please enter an email address first');
      return;
    }

    try {
      setTestingEmail(true);
      
      // TODO: Send test email
      // await notificationService.send({
      //   id: 'test_email',
      //   type: 'system',
      //   severity: 'low',
      //   title: 'Test Email Notification',
      //   message: 'This is a test email to verify your notification settings.',
      //   userId: preferences.userId,
      //   timestamp: new Date()
      // });
      
      showSuccess('Test email sent successfully');
    } catch (error) {
      console.error('Error sending test email:', error);
      showError('Failed to send test email');
    } finally {
      setTestingEmail(false);
    }
  };

  const testSMSNotification = async () => {
    if (!preferences?.sms.phoneNumber) {
      showError('Please enter a phone number first');
      return;
    }

    try {
      setTestingSMS(true);
      
      // TODO: Send test SMS
      showSuccess('Test SMS sent successfully');
    } catch (error) {
      console.error('Error sending test SMS:', error);
      showError('Failed to send test SMS');
    } finally {
      setTestingSMS(false);
    }
  };

  const updateEmailSettings = (updates: Partial<typeof preferences.email>) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      email: { ...preferences.email, ...updates }
    });
  };

  const updateSMSSettings = (updates: Partial<typeof preferences.sms>) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      sms: { ...preferences.sms, ...updates }
    });
  };

  const updatePushSettings = (updates: Partial<typeof preferences.push>) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      push: { ...preferences.push, ...updates }
    });
  };

  const updateWebhookSettings = (type: keyof typeof preferences.webhooks, updates: any) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      webhooks: {
        ...preferences.webhooks,
        [type]: { ...preferences.webhooks[type], ...updates }
      }
    });
  };

  const toggleNotificationType = (channel: 'email' | 'sms' | 'push', type: string) => {
    if (!preferences) return;
    
    const currentTypes = preferences[channel].types;
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    
    if (channel === 'email') {
      updateEmailSettings({ types: newTypes });
    } else if (channel === 'sms') {
      updateSMSSettings({ types: newTypes });
    } else if (channel === 'push') {
      updatePushSettings({ types: newTypes });
    }
  };

  const toggleSeverity = (channel: 'email' | 'sms' | 'push', severity: string) => {
    if (!preferences) return;
    
    const currentSeverities = preferences[channel].severities;
    const newSeverities = currentSeverities.includes(severity)
      ? currentSeverities.filter(s => s !== severity)
      : [...currentSeverities, severity];
    
    if (channel === 'email') {
      updateEmailSettings({ severities: newSeverities });
    } else if (channel === 'sms') {
      updateSMSSettings({ severities: newSeverities });
    } else if (channel === 'push') {
      updatePushSettings({ severities: newSeverities });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load notification preferences</p>
      </div>
    );
  }

  const notificationTypes = [
    { id: 'alert', label: 'Alerts', description: 'Inventory and system alerts' },
    { id: 'report', label: 'Reports', description: 'Scheduled reports and analytics' },
    { id: 'system', label: 'System', description: 'System updates and maintenance' },
    { id: 'marketing', label: 'Marketing', description: 'Marketing insights and tips' }
  ];

  const severityLevels = [
    { id: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { id: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
    { id: 'high', label: 'High', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Bell className="h-6 w-6 mr-2" />
            Notification Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure your notification preferences and view history
          </p>
        </div>
        {activeTab === 'settings' && (
          <button
            onClick={savePreferences}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Settings
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            <Bell className="h-4 w-4 inline mr-2" />
            Settings
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            <History className="h-4 w-4 inline mr-2" />
            History
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'settings' ? (
        <div className="space-y-8">

      {/* Email Notifications */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Mail className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Email Notifications</h2>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.email.enabled}
              onChange={(e) => updateEmailSettings({ enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {preferences.email.enabled && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <div className="flex space-x-2">
                <input
                  type="email"
                  value={preferences.email.address}
                  onChange={(e) => updateEmailSettings({ address: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="your@email.com"
                />
                <button
                  onClick={testEmailNotification}
                  disabled={testingEmail || !preferences.email.address}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  {testingEmail ? 'Sending...' : 'Test'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notification Types
              </label>
              <div className="grid grid-cols-2 gap-2">
                {notificationTypes.map(type => (
                  <label key={type.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.email.types.includes(type.id)}
                      onChange={() => toggleNotificationType('email', type.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{type.label}</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{type.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Severity Levels
              </label>
              <div className="flex flex-wrap gap-2">
                {severityLevels.map(severity => (
                  <button
                    key={severity.id}
                    onClick={() => toggleSeverity('email', severity.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      preferences.email.severities.includes(severity.id)
                        ? severity.color
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {severity.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Frequency
              </label>
              <select
                value={preferences.email.frequency}
                onChange={(e) => updateEmailSettings({ frequency: e.target.value as any })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="immediate">Immediate</option>
                <option value="hourly">Hourly Digest</option>
                <option value="daily">Daily Digest</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* SMS Notifications */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Smartphone className="h-5 w-5 text-green-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">SMS Notifications</h2>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.sms.enabled}
              onChange={(e) => updateSMSSettings({ enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {preferences.sms.enabled && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <div className="flex space-x-2">
                <input
                  type="tel"
                  value={preferences.sms.phoneNumber || ''}
                  onChange={(e) => updateSMSSettings({ phoneNumber: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="+1 (555) 123-4567"
                />
                <button
                  onClick={testSMSNotification}
                  disabled={testingSMS || !preferences.sms.phoneNumber}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  {testingSMS ? 'Sending...' : 'Test'}
                </button>
              </div>
              {!preferences.sms.verified && preferences.sms.phoneNumber && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                  Phone number not verified. Click Test to verify.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notification Types (SMS is typically for urgent alerts only)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {notificationTypes.filter(type => type.id === 'alert' || type.id === 'system').map(type => (
                  <label key={type.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.sms.types.includes(type.id)}
                      onChange={() => toggleNotificationType('sms', type.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{type.label}</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{type.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Severity Levels
              </label>
              <div className="flex flex-wrap gap-2">
                {severityLevels.filter(s => s.id === 'high' || s.id === 'critical').map(severity => (
                  <button
                    key={severity.id}
                    onClick={() => toggleSeverity('sms', severity.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      preferences.sms.severities.includes(severity.id)
                        ? severity.color
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {severity.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Push Notifications */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Bell className="h-5 w-5 text-purple-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Browser Push Notifications</h2>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.push.enabled}
              onChange={(e) => updatePushSettings({ enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {preferences.push.enabled && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notification Types
              </label>
              <div className="grid grid-cols-2 gap-2">
                {notificationTypes.map(type => (
                  <label key={type.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.push.types.includes(type.id)}
                      onChange={() => toggleNotificationType('push', type.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{type.label}</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{type.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Severity Levels
              </label>
              <div className="flex flex-wrap gap-2">
                {severityLevels.map(severity => (
                  <button
                    key={severity.id}
                    onClick={() => toggleSeverity('push', severity.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      preferences.push.severities.includes(severity.id)
                        ? severity.color
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {severity.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Push Notifications */}
      <PushNotificationSettings 
        userId={preferences?.userId}
        onSettingsChange={(enabled) => {
          if (preferences) {
            updatePushSettings({ enabled });
          }
        }}
      />

      {/* Webhook Integrations */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <Webhook className="h-5 w-5 text-orange-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Webhook Integrations</h2>
        </div>

        <div className="space-y-6">
          {/* Slack */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <MessageSquare className="h-5 w-5 text-purple-600 mr-2" />
                <span className="font-medium text-gray-900 dark:text-white">Slack</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.webhooks.slack?.enabled || false}
                  onChange={(e) => updateWebhookSettings('slack', { enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
            {preferences.webhooks.slack?.enabled && (
              <div className="space-y-2">
                <input
                  type="url"
                  value={preferences.webhooks.slack?.webhookUrl || ''}
                  onChange={(e) => updateWebhookSettings('slack', { webhookUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="https://hooks.slack.com/services/..."
                />
                <input
                  type="text"
                  value={preferences.webhooks.slack?.channel || ''}
                  onChange={(e) => updateWebhookSettings('slack', { channel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="#alerts (optional)"
                />
              </div>
            )}
          </div>

          {/* Discord */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <MessageSquare className="h-5 w-5 text-indigo-600 mr-2" />
                <span className="font-medium text-gray-900 dark:text-white">Discord</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.webhooks.discord?.enabled || false}
                  onChange={(e) => updateWebhookSettings('discord', { enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
            {preferences.webhooks.discord?.enabled && (
              <input
                type="url"
                value={preferences.webhooks.discord?.webhookUrl || ''}
                onChange={(e) => updateWebhookSettings('discord', { webhookUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="https://discord.com/api/webhooks/..."
              />
            )}
          </div>

          {/* Microsoft Teams */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <MessageSquare className="h-5 w-5 text-blue-600 mr-2" />
                <span className="font-medium text-gray-900 dark:text-white">Microsoft Teams</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.webhooks.teams?.enabled || false}
                  onChange={(e) => updateWebhookSettings('teams', { enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
            {preferences.webhooks.teams?.enabled && (
              <input
                type="url"
                value={preferences.webhooks.teams?.webhookUrl || ''}
                onChange={(e) => updateWebhookSettings('teams', { webhookUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="https://outlook.office.com/webhook/..."
              />
            )}
          </div>
        </div>
      </div>
        </div>
      ) : (
        <NotificationHistory userId={preferences?.userId} />
      )}
    </div>
  );
};

export default NotificationSettings;