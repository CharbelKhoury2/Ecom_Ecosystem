/**
 * Alert Notification Integration
 * Connects the existing alert system with the notification service
 */

import { notificationService, NotificationPayload } from './notificationService';
import { alertSystem, AlertEvent } from '../utils/realTimeAlerts';
import { supabase } from '../lib/supabase';

interface AlertData {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  sku?: string;
  product_title?: string;
  current_stock?: number;
  workspace_id: string;
  status: 'open' | 'acknowledged' | 'closed';
  created_at: string;
  updated_at: string;
}

class AlertNotificationIntegration {
  private initialized = false;

  /**
   * Initialize the integration
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Subscribe to real-time alert events
    alertSystem.subscribe(this.handleAlertEvent.bind(this));

    // Set up database triggers for alert changes
    this.setupDatabaseListeners();

    this.initialized = true;
    console.log('Alert notification integration initialized');
  }

  /**
   * Handle alert events from the real-time alert system
   */
  private async handleAlertEvent(event: AlertEvent): Promise<void> {
    try {
      const notification: NotificationPayload = {
        id: `alert_notification_${event.id}`,
        type: 'alert',
        severity: event.severity,
        title: event.ruleName,
        message: event.message,
        userId: 'system', // TODO: Get actual user ID from context
        timestamp: new Date(event.timestamp),
        data: {
          alertId: event.id,
          ruleId: event.ruleId,
          ...event.data
        }
      };

      // Send notification through the notification service
      await notificationService.queue(notification, undefined, {
        priority: this.mapSeverityToPriority(event.severity)
      });

      console.log(`Notification queued for alert: ${event.id}`);
    } catch (error) {
      console.error('Error handling alert event:', error);
    }
  }

  /**
   * Send notification for inventory alert
   */
  async sendInventoryAlertNotification(alert: AlertData): Promise<void> {
    try {
      const notification: NotificationPayload = {
        id: `inventory_alert_${alert.id}`,
        type: 'alert',
        severity: alert.severity,
        title: this.formatAlertTitle(alert),
        message: this.formatAlertMessage(alert),
        userId: 'system', // TODO: Get workspace users
        timestamp: new Date(),
        data: {
          alertId: alert.id,
          alertType: alert.type,
          sku: alert.sku,
          productTitle: alert.product_title,
          currentStock: alert.current_stock,
          workspaceId: alert.workspace_id
        }
      };

      // Send to all workspace users
      const workspaceUsers = await this.getWorkspaceUsers(alert.workspace_id);
      
      for (const userId of workspaceUsers) {
        const userNotification = { ...notification, userId };
        await notificationService.queue(userNotification, undefined, {
          priority: this.mapSeverityToPriority(alert.severity)
        });
      }

      console.log(`Inventory alert notification sent for alert: ${alert.id}`);
    } catch (error) {
      console.error('Error sending inventory alert notification:', error);
    }
  }

  /**
   * Send notification when alert is acknowledged
   */
  async sendAlertAcknowledgedNotification(alert: AlertData, acknowledgedBy: string): Promise<void> {
    try {
      const notification: NotificationPayload = {
        id: `alert_ack_${alert.id}`,
        type: 'system',
        severity: 'low',
        title: 'Alert Acknowledged',
        message: `Alert "${alert.title}" has been acknowledged`,
        userId: acknowledgedBy,
        timestamp: new Date(),
        data: {
          alertId: alert.id,
          alertType: alert.type,
          acknowledgedBy
        }
      };

      await notificationService.queue(notification, undefined, {
        priority: 'low'
      });

      console.log(`Alert acknowledgment notification sent for alert: ${alert.id}`);
    } catch (error) {
      console.error('Error sending alert acknowledgment notification:', error);
    }
  }

  /**
   * Send notification when alert is resolved/closed
   */
  async sendAlertResolvedNotification(alert: AlertData): Promise<void> {
    try {
      const notification: NotificationPayload = {
        id: `alert_resolved_${alert.id}`,
        type: 'system',
        severity: 'low',
        title: 'Alert Resolved',
        message: this.formatResolvedMessage(alert),
        userId: 'system',
        timestamp: new Date(),
        data: {
          alertId: alert.id,
          alertType: alert.type,
          sku: alert.sku,
          productTitle: alert.product_title
        }
      };

      // Send to all workspace users
      const workspaceUsers = await this.getWorkspaceUsers(alert.workspace_id);
      
      for (const userId of workspaceUsers) {
        const userNotification = { ...notification, userId };
        await notificationService.queue(userNotification, undefined, {
          priority: 'low'
        });
      }

      console.log(`Alert resolved notification sent for alert: ${alert.id}`);
    } catch (error) {
      console.error('Error sending alert resolved notification:', error);
    }
  }

  /**
   * Send bulk notification for multiple alerts
   */
  async sendBulkAlertNotification(alerts: AlertData[], action: 'created' | 'acknowledged' | 'resolved'): Promise<void> {
    try {
      if (alerts.length === 0) return;

      const workspaceId = alerts[0].workspace_id;
      const notification: NotificationPayload = {
        id: `bulk_alert_${action}_${Date.now()}`,
        type: 'system',
        severity: 'medium',
        title: this.formatBulkTitle(alerts.length, action),
        message: this.formatBulkMessage(alerts, action),
        userId: 'system',
        timestamp: new Date(),
        data: {
          alertIds: alerts.map(a => a.id),
          action,
          count: alerts.length,
          workspaceId
        }
      };

      // Send to all workspace users
      const workspaceUsers = await this.getWorkspaceUsers(workspaceId);
      
      for (const userId of workspaceUsers) {
        const userNotification = { ...notification, userId };
        await notificationService.queue(userNotification, undefined, {
          priority: 'medium'
        });
      }

      console.log(`Bulk alert notification sent for ${alerts.length} alerts`);
    } catch (error) {
      console.error('Error sending bulk alert notification:', error);
    }
  }

  /**
   * Set up database listeners for alert changes
   */
  private setupDatabaseListeners(): void {
    // Listen for new alerts
    supabase
      .channel('alerts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'alerts'
      }, (payload) => {
        this.handleDatabaseAlertChange('INSERT', payload.new as AlertData);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'alerts'
      }, (payload) => {
        this.handleDatabaseAlertChange('UPDATE', payload.new as AlertData, payload.old as AlertData);
      })
      .subscribe();
  }

  /**
   * Handle database alert changes
   */
  private async handleDatabaseAlertChange(
    event: 'INSERT' | 'UPDATE',
    newAlert: AlertData,
    oldAlert?: AlertData
  ): Promise<void> {
    try {
      if (event === 'INSERT') {
        // New alert created
        await this.sendInventoryAlertNotification(newAlert);
      } else if (event === 'UPDATE' && oldAlert) {
        // Alert updated
        if (oldAlert.status === 'open' && newAlert.status === 'acknowledged') {
          // Alert was acknowledged
          await this.sendAlertAcknowledgedNotification(newAlert, 'system'); // TODO: Get actual user
        } else if (oldAlert.status !== 'closed' && newAlert.status === 'closed') {
          // Alert was resolved
          await this.sendAlertResolvedNotification(newAlert);
        }
      }
    } catch (error) {
      console.error('Error handling database alert change:', error);
    }
  }

  /**
   * Get users for a workspace
   */
  private async getWorkspaceUsers(workspaceId: string): Promise<string[]> {
    try {
      // TODO: Implement actual workspace user lookup
      // For now, return a default user
      return ['system'];
    } catch (error) {
      console.error('Error getting workspace users:', error);
      return ['system'];
    }
  }

  /**
   * Format alert title
   */
  private formatAlertTitle(alert: AlertData): string {
    switch (alert.type) {
      case 'Low Stock':
        return `Low Stock Alert: ${alert.product_title || alert.sku}`;
      case 'Out of Stock':
        return `Out of Stock Alert: ${alert.product_title || alert.sku}`;
      default:
        return alert.title || alert.type;
    }
  }

  /**
   * Format alert message
   */
  private formatAlertMessage(alert: AlertData): string {
    switch (alert.type) {
      case 'Low Stock':
        return `${alert.product_title || alert.sku} is running low on stock (${alert.current_stock || 0} units remaining)`;
      case 'Out of Stock':
        return `${alert.product_title || alert.sku} is out of stock`;
      default:
        return alert.message || `Alert: ${alert.type}`;
    }
  }

  /**
   * Format resolved message
   */
  private formatResolvedMessage(alert: AlertData): string {
    switch (alert.type) {
      case 'Low Stock':
      case 'Out of Stock':
        return `Stock levels for ${alert.product_title || alert.sku} have been restored`;
      default:
        return `Alert "${alert.title || alert.type}" has been resolved`;
    }
  }

  /**
   * Format bulk notification title
   */
  private formatBulkTitle(count: number, action: string): string {
    switch (action) {
      case 'created':
        return `${count} New Alert${count > 1 ? 's' : ''}`;
      case 'acknowledged':
        return `${count} Alert${count > 1 ? 's' : ''} Acknowledged`;
      case 'resolved':
        return `${count} Alert${count > 1 ? 's' : ''} Resolved`;
      default:
        return `${count} Alert${count > 1 ? 's' : ''} Updated`;
    }
  }

  /**
   * Format bulk notification message
   */
  private formatBulkMessage(alerts: AlertData[], action: string): string {
    const types = [...new Set(alerts.map(a => a.type))];
    const typeText = types.length === 1 ? types[0] : `${types.length} different types`;
    
    switch (action) {
      case 'created':
        return `${alerts.length} new alerts have been generated (${typeText})`;
      case 'acknowledged':
        return `${alerts.length} alerts have been acknowledged (${typeText})`;
      case 'resolved':
        return `${alerts.length} alerts have been resolved (${typeText})`;
      default:
        return `${alerts.length} alerts have been updated (${typeText})`;
    }
  }

  /**
   * Map severity to priority
   */
  private mapSeverityToPriority(severity: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (severity) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      default: return 'medium';
    }
  }
}

// Export singleton instance
export const alertNotificationIntegration = new AlertNotificationIntegration();
export default AlertNotificationIntegration;