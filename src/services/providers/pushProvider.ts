/**
 * Push Notification Provider
 * Handles browser push notifications using the Web Push API
 */

import { NotificationProvider, NotificationPayload, NotificationResult, NotificationPreferences } from '../notificationService';

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface PushConfig {
  vapidPublicKey: string;
  vapidPrivateKey: string;
  vapidSubject: string;
}

class PushProvider implements NotificationProvider {
  private config: PushConfig;
  private subscriptions: Map<string, PushSubscription> = new Map();

  constructor() {
    this.config = {
      vapidPublicKey: import.meta.env.VITE_VAPID_PUBLIC_KEY || '',
      vapidPrivateKey: import.meta.env.VITE_VAPID_PRIVATE_KEY || '',
      vapidSubject: import.meta.env.VITE_VAPID_SUBJECT || 'mailto:admin@ecompilot.com'
    };
  }

  async send(payload: NotificationPayload, preferences: NotificationPreferences): Promise<NotificationResult> {
    try {
      // Check if push notifications are enabled
      if (!preferences.push?.enabled) {
        return {
          success: false,
          error: 'Push notifications are disabled for this user',
          provider: 'push'
        };
      }

      // Check if notification type is allowed
      if (!preferences.push.types.includes(payload.type)) {
        return {
          success: false,
          error: `Push notifications not enabled for type: ${payload.type}`,
          provider: 'push'
        };
      }

      // Check if severity level is allowed
      if (!preferences.push.severities.includes(payload.severity)) {
        return {
          success: false,
          error: `Push notifications not enabled for severity: ${payload.severity}`,
          provider: 'push'
        };
      }

      // Check if browser supports push notifications
      if (!this.isPushSupported()) {
        return {
          success: false,
          error: 'Push notifications are not supported in this browser',
          provider: 'push'
        };
      }

      // Get user's push subscription
      const subscription = await this.getUserSubscription(payload.userId);
      if (!subscription) {
        return {
          success: false,
          error: 'User has not subscribed to push notifications',
          provider: 'push'
        };
      }

      // Send push notification
      const pushPayload = this.formatPushPayload(payload);
      await this.sendPushNotification(subscription, pushPayload);

      return {
        success: true,
        provider: 'push',
        messageId: `push_${Date.now()}`
      };

    } catch (error) {
      console.error('Push notification failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown push notification error',
        provider: 'push'
      };
    }
  }

  /**
   * Check if push notifications are supported
   */
  private isPushSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Request permission for push notifications
   */
  async requestPermission(): Promise<{ granted: boolean; subscription?: PushSubscription }> {
    try {
      if (!this.isPushSupported()) {
        throw new Error('Push notifications are not supported');
      }

      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        return { granted: false };
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.config.vapidPublicKey)
      });

      // Convert subscription to our format
      const pushSubscription: PushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        }
      };

      return {
        granted: true,
        subscription: pushSubscription
      };

    } catch (error) {
      console.error('Error requesting push permission:', error);
      return { granted: false };
    }
  }

  /**
   * Subscribe user to push notifications
   */
  async subscribeUser(userId: string): Promise<{ success: boolean; subscription?: PushSubscription; error?: string }> {
    try {
      const result = await this.requestPermission();
      
      if (!result.granted || !result.subscription) {
        return {
          success: false,
          error: 'Permission denied or subscription failed'
        };
      }

      // Store subscription
      this.subscriptions.set(userId, result.subscription);
      
      // TODO: Save subscription to database
      // await this.saveSubscriptionToDatabase(userId, result.subscription);

      return {
        success: true,
        subscription: result.subscription
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Unsubscribe user from push notifications
   */
  async unsubscribeUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Remove from local storage
      this.subscriptions.delete(userId);
      
      // TODO: Remove from database
      // await this.removeSubscriptionFromDatabase(userId);

      // Unsubscribe from service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            await subscription.unsubscribe();
          }
        }
      }

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get user's push subscription
   */
  private async getUserSubscription(userId: string): Promise<PushSubscription | null> {
    // First check local cache
    const cachedSubscription = this.subscriptions.get(userId);
    if (cachedSubscription) {
      return cachedSubscription;
    }

    // TODO: Load from database
    // const dbSubscription = await this.loadSubscriptionFromDatabase(userId);
    // if (dbSubscription) {
    //   this.subscriptions.set(userId, dbSubscription);
    //   return dbSubscription;
    // }

    return null;
  }

  /**
   * Format notification payload for push
   */
  private formatPushPayload(payload: NotificationPayload): string {
    const pushData = {
      title: payload.title,
      body: payload.message,
      icon: '/icon-192x192.png', // TODO: Add app icon
      badge: '/badge-72x72.png', // TODO: Add badge icon
      tag: payload.id,
      data: {
        id: payload.id,
        type: payload.type,
        severity: payload.severity,
        timestamp: payload.timestamp.toISOString(),
        url: this.getNotificationUrl(payload)
      },
      actions: this.getNotificationActions(payload),
      requireInteraction: payload.severity === 'critical' || payload.severity === 'high',
      silent: false,
      vibrate: this.getVibrationPattern(payload.severity)
    };

    return JSON.stringify(pushData);
  }

  /**
   * Get notification URL based on type
   */
  private getNotificationUrl(payload: NotificationPayload): string {
    const baseUrl = process.env.VITE_APP_URL || 'http://localhost:5173';
    
    switch (payload.type) {
      case 'alert':
        return `${baseUrl}/alerts`;
      case 'report':
        return `${baseUrl}/reports`;
      case 'system':
        return `${baseUrl}/settings`;
      default:
        return baseUrl;
    }
  }

  /**
   * Get notification actions based on type and severity
   */
  private getNotificationActions(payload: NotificationPayload): Array<Record<string, string>> {
    const actions = [];

    if (payload.type === 'alert') {
      actions.push({
        action: 'view',
        title: 'View Alert',
        icon: '/icons/view.png'
      });
      
      if (payload.severity === 'high' || payload.severity === 'critical') {
        actions.push({
          action: 'acknowledge',
          title: 'Acknowledge',
          icon: '/icons/check.png'
        });
      }
    } else {
      actions.push({
        action: 'view',
        title: 'View',
        icon: '/icons/view.png'
      });
    }

    actions.push({
      action: 'dismiss',
      title: 'Dismiss',
      icon: '/icons/close.png'
    });

    return actions;
  }

  /**
   * Get vibration pattern based on severity
   */
  private getVibrationPattern(severity: string): number[] {
    switch (severity) {
      case 'critical':
        return [200, 100, 200, 100, 200]; // Urgent pattern
      case 'high':
        return [200, 100, 200]; // Important pattern
      case 'medium':
        return [200]; // Single vibration
      case 'low':
        return []; // No vibration
      default:
        return [100];
    }
  }

  /**
   * Send push notification to subscription
   */
  private async sendPushNotification(subscription: PushSubscription, payload: string): Promise<void> {
    // In a real implementation, this would be done on the server
    // using a library like web-push
    
    // For client-side demo, we'll simulate the push
    console.log('Simulating push notification:', {
      endpoint: subscription.endpoint,
      payload: JSON.parse(payload)
    });

    // Show notification directly (for demo purposes)
    if ('Notification' in window && Notification.permission === 'granted') {
      const data = JSON.parse(payload);
      new Notification(data.title, {
        body: data.body,
        icon: data.icon,
        tag: data.tag,
        data: data.data,
        requireInteraction: data.requireInteraction,
        silent: data.silent,
        vibrate: data.vibrate
      });
    }
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Check if user is subscribed
   */
  async isUserSubscribed(userId: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    return subscription !== null;
  }

  /**
   * Get push notification status
   */
  async getStatus(): Promise<{
    supported: boolean;
    permission: NotificationPermission;
    subscribed: boolean;
  }> {
    const supported = this.isPushSupported();
    const permission = supported ? Notification.permission : 'denied';
    
    let subscribed = false;
    if (supported && permission === 'granted') {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          subscribed = subscription !== null;
        }
      } catch (error) {
        console.error('Error checking subscription status:', error);
      }
    }

    return {
      supported,
      permission,
      subscribed
    };
  }
}

export default PushProvider;