/**
 * Notification Service Architecture
 * Supports multiple notification providers (email, SMS, webhooks, push)
 */

import EmailProvider from './providers/emailProvider';
import SMSProvider from './providers/smsProvider';
import WebhookProvider from './providers/webhookProvider';
import PushProvider from './providers/pushProvider';

export interface NotificationPayload {
  id: string;
  type: 'alert' | 'report' | 'system' | 'marketing';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  data?: Record<string, any>;
  userId?: string;
  workspaceId?: string;
  timestamp: Date;
  expiresAt?: Date;
}

export interface NotificationPreferences {
  userId: string;
  email: {
    enabled: boolean;
    address: string;
    types: string[];
    severities: string[];
    frequency: 'immediate' | 'hourly' | 'daily';
  };
  sms: {
    enabled: boolean;
    phoneNumber?: string;
    verified: boolean;
    types: string[];
    severities: string[];
  };
  push: {
    enabled: boolean;
    types: string[];
    severities: string[];
  };
  webhooks: {
    slack?: {
      enabled: boolean;
      webhookUrl: string;
      channel?: string;
    };
    discord?: {
      enabled: boolean;
      webhookUrl: string;
    };
    teams?: {
      enabled: boolean;
      webhookUrl: string;
    };
    custom?: {
      enabled: boolean;
      webhookUrl: string;
      headers?: Record<string, string>;
    };
  };
}

export interface NotificationProvider {
  name: string;
  type: 'email' | 'sms' | 'webhook' | 'push';
  send(payload: NotificationPayload, preferences: NotificationPreferences): Promise<NotificationResult>;
  isConfigured(): boolean;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
  timestamp: Date;
}

export interface NotificationLog {
  id: string;
  notificationId: string;
  userId?: string;
  provider: string;
  type: string;
  status: 'sent' | 'failed' | 'pending' | 'delivered' | 'read';
  result: NotificationResult;
  createdAt: Date;
  updatedAt: Date;
}

class NotificationService {
  private providers: Map<string, NotificationProvider> = new Map();
  private notificationQueue: NotificationPayload[] = [];
  private processing = false;
  private logs: NotificationLog[] = [];

  constructor() {
    this.registerProvider(new EmailProvider());
    this.registerProvider(new SMSProvider());
    this.registerProvider(new WebhookProvider());
    this.registerProvider(new PushProvider());
    
    this.startQueueProcessor();
  }

  /**
   * Register a notification provider
   */
  registerProvider(provider: NotificationProvider): void {
    this.providers.set(provider.name, provider);
    console.log(`📧 Registered notification provider: ${provider.name}`);
  }

  /**
   * Send notification through all applicable providers
   */
  async send(payload: NotificationPayload): Promise<NotificationResult[]> {
    const preferences = await this.getUserPreferences(payload.userId);
    if (!preferences) {
      console.warn(`No notification preferences found for user: ${payload.userId}`);
      return [];
    }

    const results: NotificationResult[] = [];
    const applicableProviders = this.getApplicableProviders(payload, preferences);

    for (const provider of applicableProviders) {
      try {
        const result = await provider.send(payload, preferences);
        results.push(result);
        
        // Log the notification
        await this.logNotification(payload, provider.name, result);
      } catch (error) {
        const errorResult: NotificationResult = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          provider: provider.name,
          timestamp: new Date()
        };
        results.push(errorResult);
        await this.logNotification(payload, provider.name, errorResult);
      }
    }

    return results;
  }

  /**
   * Queue notification for batch processing
   */
  async queue(
    payload: NotificationPayload,
    options?: {
      priority?: 'low' | 'medium' | 'high' | 'critical';
      scheduledFor?: Date;
    }
  ): Promise<{ success: boolean; queueId?: string; error?: string }> {
    try {
      this.notificationQueue.push(payload);
      const queueId = `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return { success: true, queueId };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get applicable providers based on user preferences and notification type
   */
  private getApplicableProviders(
    payload: NotificationPayload,
    preferences: NotificationPreferences
  ): NotificationProvider[] {
    const applicable: NotificationProvider[] = [];

    for (const [name, provider] of this.providers) {
      if (!provider.isConfigured()) continue;

      switch (provider.type) {
        case 'email':
          if (this.shouldSendEmail(payload, preferences)) {
            applicable.push(provider);
          }
          break;
        case 'sms':
          if (this.shouldSendSMS(payload, preferences)) {
            applicable.push(provider);
          }
          break;
        case 'webhook':
          if (this.shouldSendWebhook(payload, preferences, name)) {
            applicable.push(provider);
          }
          break;
        case 'push':
          if (this.shouldSendPush(payload, preferences)) {
            applicable.push(provider);
          }
          break;
      }
    }

    return applicable;
  }

  private shouldSendEmail(payload: NotificationPayload, prefs: NotificationPreferences): boolean {
    return prefs.email.enabled &&
           prefs.email.types.includes(payload.type) &&
           prefs.email.severities.includes(payload.severity);
  }

  private shouldSendSMS(payload: NotificationPayload, prefs: NotificationPreferences): boolean {
    return prefs.sms.enabled &&
           prefs.sms.verified &&
           prefs.sms.types.includes(payload.type) &&
           prefs.sms.severities.includes(payload.severity);
  }

  private shouldSendWebhook(payload: NotificationPayload, prefs: NotificationPreferences, providerName: string): boolean {
    const webhookType = providerName.toLowerCase();
    const webhook = prefs.webhooks[webhookType as keyof typeof prefs.webhooks];
    return webhook?.enabled || false;
  }

  private shouldSendPush(payload: NotificationPayload, prefs: NotificationPreferences): boolean {
    return prefs.push.enabled &&
           prefs.push.types.includes(payload.type) &&
           prefs.push.severities.includes(payload.severity);
  }

  /**
   * Get user notification preferences
   */
  private async getUserPreferences(userId?: string): Promise<NotificationPreferences | null> {
    if (!userId) return null;

    // TODO: Implement database lookup
    // For now, return default preferences
    return {
      userId,
      email: {
        enabled: true,
        address: 'user@example.com',
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
  }

  /**
   * Check if any webhooks are enabled
   */
  private hasEnabledWebhooks(preferences: NotificationPreferences): boolean {
    return !!(preferences.webhooks?.slack?.enabled ||
             preferences.webhooks?.discord?.enabled ||
             preferences.webhooks?.teams?.enabled ||
             preferences.webhooks?.custom?.enabled);
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    return {
      queueLength: this.notificationQueue.length,
      isProcessing: this.processing
    };
  }

  /**
   * Clear notification logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Log notification attempt
   */
  private async logNotification(
    payload: NotificationPayload,
    provider: string,
    result: NotificationResult
  ): Promise<void> {
    const log: NotificationLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      notificationId: payload.id,
      userId: payload.userId,
      provider,
      type: payload.type,
      status: result.success ? 'sent' : 'failed',
      result,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.logs.push(log);
    
    // TODO: Persist to database
    console.log(`📝 Logged notification: ${log.id}`);
  }

  /**
   * Start queue processor for batch notifications
   */
  private startQueueProcessor(): void {
    setInterval(async () => {
      if (this.processing || this.notificationQueue.length === 0) return;

      this.processing = true;
      const batch = this.notificationQueue.splice(0, 10); // Process 10 at a time

      for (const payload of batch) {
        try {
          await this.send(payload);
        } catch (error) {
          console.error('Error processing queued notification:', error);
        }
      }

      this.processing = false;
    }, 5000); // Process every 5 seconds
  }

  /**
   * Get notification logs
   */
  getLogs(userId?: string, limit = 50): NotificationLog[] {
    let logs = this.logs;
    
    if (userId) {
      logs = logs.filter(log => log.userId === userId);
    }

    return logs
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get provider status
   */
  getProviderStatus(): Array<{ name: string; type: string; configured: boolean }> {
    return Array.from(this.providers.values()).map(provider => ({
      name: provider.name,
      type: provider.type,
      configured: provider.isConfigured()
    }));
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;