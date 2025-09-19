/**
 * Webhook Notification Provider
 * Handles webhook notifications for Slack, Discord, Microsoft Teams, and custom endpoints
 */

import { NotificationProvider, NotificationPayload, NotificationResult, NotificationPreferences } from '../notificationService';

interface WebhookConfig {
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

interface SlackMessage {
  text?: string;
  blocks?: any[];
  attachments?: any[];
  channel?: string;
  username?: string;
  icon_emoji?: string;
}

interface DiscordMessage {
  content?: string;
  embeds?: any[];
  username?: string;
  avatar_url?: string;
}

interface TeamsMessage {
  '@type': string;
  '@context': string;
  summary: string;
  themeColor: string;
  sections: any[];
}

class WebhookProvider implements NotificationProvider {
  private config: WebhookConfig;

  constructor() {
    this.config = {
      timeout: 10000, // 10 seconds
      retryAttempts: 3,
      retryDelay: 1000 // 1 second
    };
  }

  async send(payload: NotificationPayload, preferences: NotificationPreferences): Promise<NotificationResult> {
    const results: NotificationResult[] = [];

    // Send to enabled webhook integrations
    if (preferences.webhooks?.slack?.enabled && preferences.webhooks.slack.webhookUrl) {
      const slackResult = await this.sendSlackNotification(payload, preferences.webhooks.slack);
      results.push(slackResult);
    }

    if (preferences.webhooks?.discord?.enabled && preferences.webhooks.discord.webhookUrl) {
      const discordResult = await this.sendDiscordNotification(payload, preferences.webhooks.discord);
      results.push(discordResult);
    }

    if (preferences.webhooks?.teams?.enabled && preferences.webhooks.teams.webhookUrl) {
      const teamsResult = await this.sendTeamsNotification(payload, preferences.webhooks.teams);
      results.push(teamsResult);
    }

    if (preferences.webhooks?.custom?.enabled && preferences.webhooks.custom.webhookUrl) {
      const customResult = await this.sendCustomWebhook(payload, preferences.webhooks.custom);
      results.push(customResult);
    }

    // Return combined result
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    if (totalCount === 0) {
      return {
        success: false,
        error: 'No webhook integrations enabled',
        provider: 'webhook'
      };
    }

    return {
      success: successCount > 0,
      provider: 'webhook',
      messageId: `webhook_${Date.now()}`,
      details: {
        sent: successCount,
        total: totalCount,
        results
      }
    };
  }

  private async sendSlackNotification(
    payload: NotificationPayload,
    config: { webhookUrl: string; channel?: string }
  ): Promise<NotificationResult> {
    try {
      const message = this.formatSlackMessage(payload, config.channel);
      
      const response = await this.sendWebhookRequest(config.webhookUrl, message);
      
      return {
        success: response.ok,
        provider: 'slack',
        messageId: `slack_${Date.now()}`,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
      };
    } catch (error) {
      return {
        success: false,
        provider: 'slack',
        error: error instanceof Error ? error.message : 'Unknown Slack webhook error'
      };
    }
  }

  private async sendDiscordNotification(
    payload: NotificationPayload,
    config: { webhookUrl: string }
  ): Promise<NotificationResult> {
    try {
      const message = this.formatDiscordMessage(payload);
      
      const response = await this.sendWebhookRequest(config.webhookUrl, message);
      
      return {
        success: response.ok,
        provider: 'discord',
        messageId: `discord_${Date.now()}`,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
      };
    } catch (error) {
      return {
        success: false,
        provider: 'discord',
        error: error instanceof Error ? error.message : 'Unknown Discord webhook error'
      };
    }
  }

  private async sendTeamsNotification(
    payload: NotificationPayload,
    config: { webhookUrl: string }
  ): Promise<NotificationResult> {
    try {
      const message = this.formatTeamsMessage(payload);
      
      const response = await this.sendWebhookRequest(config.webhookUrl, message);
      
      return {
        success: response.ok,
        provider: 'teams',
        messageId: `teams_${Date.now()}`,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
      };
    } catch (error) {
      return {
        success: false,
        provider: 'teams',
        error: error instanceof Error ? error.message : 'Unknown Teams webhook error'
      };
    }
  }

  private async sendCustomWebhook(
    payload: NotificationPayload,
    config: { webhookUrl: string; format?: 'json' | 'slack' | 'discord' }
  ): Promise<NotificationResult> {
    try {
      let message: any;
      
      switch (config.format) {
        case 'slack':
          message = this.formatSlackMessage(payload);
          break;
        case 'discord':
          message = this.formatDiscordMessage(payload);
          break;
        default:
          message = this.formatGenericMessage(payload);
      }
      
      const response = await this.sendWebhookRequest(config.webhookUrl, message);
      
      return {
        success: response.ok,
        provider: 'custom',
        messageId: `custom_${Date.now()}`,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
      };
    } catch (error) {
      return {
        success: false,
        provider: 'custom',
        error: error instanceof Error ? error.message : 'Unknown custom webhook error'
      };
    }
  }

  private formatSlackMessage(payload: NotificationPayload, channel?: string): SlackMessage {
    const color = this.getSeverityColor(payload.severity);
    const emoji = this.getSeverityEmoji(payload.severity);
    
    return {
      channel,
      username: 'Ecom Ecosystem',
      icon_emoji: ':bell:',
      attachments: [
        {
          color,
          title: `${emoji} ${payload.title}`,
          text: payload.message,
          fields: [
            {
              title: 'Type',
              value: payload.type.charAt(0).toUpperCase() + payload.type.slice(1),
              short: true
            },
            {
              title: 'Severity',
              value: payload.severity.charAt(0).toUpperCase() + payload.severity.slice(1),
              short: true
            },
            {
              title: 'Time',
              value: payload.timestamp.toLocaleString(),
              short: true
            }
          ],
          footer: 'Ecom Ecosystem Notifications',
          ts: Math.floor(payload.timestamp.getTime() / 1000)
        }
      ]
    };
  }

  private formatDiscordMessage(payload: NotificationPayload): DiscordMessage {
    const color = this.getSeverityColorHex(payload.severity);
    const emoji = this.getSeverityEmoji(payload.severity);
    
    return {
      username: 'Ecom Ecosystem',
      avatar_url: 'https://via.placeholder.com/64x64/4F46E5/FFFFFF?text=E',
      embeds: [
        {
          title: `${emoji} ${payload.title}`,
          description: payload.message,
          color: parseInt(color.replace('#', ''), 16),
          fields: [
            {
              name: 'Type',
              value: payload.type.charAt(0).toUpperCase() + payload.type.slice(1),
              inline: true
            },
            {
              name: 'Severity',
              value: payload.severity.charAt(0).toUpperCase() + payload.severity.slice(1),
              inline: true
            },
            {
              name: 'Time',
              value: payload.timestamp.toLocaleString(),
              inline: true
            }
          ],
          footer: {
            text: 'Ecom Ecosystem Notifications'
          },
          timestamp: payload.timestamp.toISOString()
        }
      ]
    };
  }

  private formatTeamsMessage(payload: NotificationPayload): TeamsMessage {
    const color = this.getSeverityColorHex(payload.severity);
    const emoji = this.getSeverityEmoji(payload.severity);
    
    return {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      summary: payload.title,
      themeColor: color.replace('#', ''),
      sections: [
        {
          activityTitle: `${emoji} ${payload.title}`,
          activitySubtitle: `${payload.type.charAt(0).toUpperCase() + payload.type.slice(1)} - ${payload.severity.charAt(0).toUpperCase() + payload.severity.slice(1)}`,
          activityImage: 'https://via.placeholder.com/64x64/4F46E5/FFFFFF?text=E',
          facts: [
            {
              name: 'Type:',
              value: payload.type.charAt(0).toUpperCase() + payload.type.slice(1)
            },
            {
              name: 'Severity:',
              value: payload.severity.charAt(0).toUpperCase() + payload.severity.slice(1)
            },
            {
              name: 'Time:',
              value: payload.timestamp.toLocaleString()
            }
          ],
          text: payload.message
        }
      ]
    };
  }

  private formatGenericMessage(payload: NotificationPayload): Record<string, unknown> {
    return {
      id: payload.id,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      severity: payload.severity,
      timestamp: payload.timestamp.toISOString(),
      userId: payload.userId
    };
  }

  private async sendWebhookRequest(url: string, payload: any): Promise<Response> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Ecom-Ecosystem-Notifications/1.0'
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok || response.status < 500) {
          // Don't retry for client errors (4xx)
          return response;
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < this.config.retryAttempts) {
          await this.delay(this.config.retryDelay * attempt); // Exponential backoff
        }
      }
    }
    
    throw lastError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'good';
      case 'low': return '#36a64f';
      default: return '#808080';
    }
  }

  private getSeverityColorHex(severity: string): string {
    switch (severity) {
      case 'critical': return '#DC2626';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  }

  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '📢';
      case 'low': return 'ℹ️';
      default: return '📋';
    }
  }

  // Test webhook connectivity
  async testWebhook(url: string, type: 'slack' | 'discord' | 'teams' | 'custom' = 'custom'): Promise<{
    success: boolean;
    message: string;
    responseTime?: number;
  }> {
    const startTime = Date.now();
    
    try {
      const testPayload: NotificationPayload = {
        id: 'test_webhook',
        type: 'system',
        severity: 'low',
        title: 'Webhook Test',
        message: 'This is a test notification to verify webhook connectivity.',
        userId: 'test_user',
        timestamp: new Date()
      };

      let message: any;
      switch (type) {
        case 'slack':
          message = this.formatSlackMessage(testPayload);
          break;
        case 'discord':
          message = this.formatDiscordMessage(testPayload);
          break;
        case 'teams':
          message = this.formatTeamsMessage(testPayload);
          break;
        default:
          message = this.formatGenericMessage(testPayload);
      }

      const response = await this.sendWebhookRequest(url, message);
      const responseTime = Date.now() - startTime;

      return {
        success: response.ok,
        message: response.ok ? 'Webhook test successful' : `HTTP ${response.status}: ${response.statusText}`,
        responseTime
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown webhook error',
        responseTime
      };
    }
  }
}

export default WebhookProvider;