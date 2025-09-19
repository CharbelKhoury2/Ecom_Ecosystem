/**
 * SMS Notification Provider
 * Handles SMS notifications using Twilio with rate limiting and cost management
 */

import { NotificationProvider, NotificationPayload, NotificationResult, NotificationPreferences } from '../notificationService';

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
  maxDailyCost: number; // Maximum daily spend in USD
  maxHourlySMS: number; // Maximum SMS per hour per user
  costPerSMS: number; // Cost per SMS in USD
}

interface SMSRateLimit {
  userId: string;
  count: number;
  resetTime: number;
  dailyCost: number;
  dailyResetTime: number;
}

class SMSProvider implements NotificationProvider {
  private config: TwilioConfig;
  private rateLimits: Map<string, SMSRateLimit> = new Map();
  private twilioClient: any; // Twilio client instance

  constructor() {
    this.config = {
      accountSid: import.meta.env.VITE_TWILIO_ACCOUNT_SID || '',
      authToken: import.meta.env.VITE_TWILIO_AUTH_TOKEN || '',
      fromNumber: import.meta.env.VITE_TWILIO_FROM_NUMBER || '',
      maxDailyCost: parseFloat(import.meta.env.VITE_SMS_MAX_DAILY_COST || '50'), // $50 default
      maxHourlySMS: parseInt(import.meta.env.VITE_SMS_MAX_HOURLY_COUNT || '10'), // 10 SMS per hour
      costPerSMS: parseFloat(import.meta.env.VITE_SMS_COST_PER_MESSAGE || '0.0075') // $0.0075 per SMS
    };

    this.initializeTwilioClient();
  }

  private initializeTwilioClient() {
    try {
      // Note: In a real implementation, you would install and import Twilio
      // npm install twilio
      // const twilio = require('twilio');
      // this.twilioClient = twilio(this.config.accountSid, this.config.authToken);
      
      // For now, we'll mock the Twilio client
      this.twilioClient = {
        messages: {
          create: async (options: any) => {
            // Mock Twilio response
            console.log('Mock SMS sent:', options);
            return {
              sid: `SM${Date.now()}`,
              status: 'sent',
              to: options.to,
              from: options.from,
              body: options.body
            };
          }
        }
      };
    } catch (error) {
      console.error('Failed to initialize Twilio client:', error);
    }
  }

  async send(payload: NotificationPayload, preferences: NotificationPreferences): Promise<NotificationResult> {
    try {
      // Check if SMS is enabled for this user
      if (!preferences.sms?.enabled) {
        return {
          success: false,
          error: 'SMS notifications are disabled for this user',
          provider: 'sms'
        };
      }

      // Check if phone number is verified
      if (!preferences.sms?.verified) {
        return {
          success: false,
          error: 'Phone number is not verified',
          provider: 'sms'
        };
      }

      // Check if notification type is allowed
      if (!preferences.sms.types.includes(payload.type)) {
        return {
          success: false,
          error: `SMS notifications not enabled for type: ${payload.type}`,
          provider: 'sms'
        };
      }

      // Check if severity level is allowed
      if (!preferences.sms.severities.includes(payload.severity)) {
        return {
          success: false,
          error: `SMS notifications not enabled for severity: ${payload.severity}`,
          provider: 'sms'
        };
      }

      // Check rate limits
      const rateLimitCheck = this.checkRateLimit(payload.userId);
      if (!rateLimitCheck.allowed) {
        return {
          success: false,
          error: rateLimitCheck.reason,
          provider: 'sms'
        };
      }

      // Format SMS message
      const smsBody = this.formatSMSMessage(payload);
      
      // Send SMS via Twilio
      const result = await this.twilioClient.messages.create({
        body: smsBody,
        from: this.config.fromNumber,
        to: preferences.sms.phoneNumber
      });

      // Update rate limits
      this.updateRateLimit(payload.userId);

      // Log the notification
      await this.logNotification(payload, preferences, result);

      return {
        success: true,
        messageId: result.sid,
        provider: 'sms',
        cost: this.config.costPerSMS
      };

    } catch (error) {
      console.error('SMS notification failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown SMS error',
        provider: 'sms'
      };
    }
  }

  private checkRateLimit(userId: string): { allowed: boolean; reason?: string } {
    const now = Date.now();
    const rateLimit = this.rateLimits.get(userId);

    if (!rateLimit) {
      // First SMS for this user
      return { allowed: true };
    }

    // Check daily cost limit
    if (now > rateLimit.dailyResetTime) {
      // Reset daily counters
      rateLimit.dailyCost = 0;
      rateLimit.dailyResetTime = this.getNextDayResetTime();
    }

    if (rateLimit.dailyCost + this.config.costPerSMS > this.config.maxDailyCost) {
      return {
        allowed: false,
        reason: `Daily SMS cost limit exceeded ($${this.config.maxDailyCost})`
      };
    }

    // Check hourly rate limit
    if (now > rateLimit.resetTime) {
      // Reset hourly counter
      rateLimit.count = 0;
      rateLimit.resetTime = now + (60 * 60 * 1000); // 1 hour from now
    }

    if (rateLimit.count >= this.config.maxHourlySMS) {
      const resetIn = Math.ceil((rateLimit.resetTime - now) / (60 * 1000));
      return {
        allowed: false,
        reason: `Hourly SMS limit exceeded. Resets in ${resetIn} minutes`
      };
    }

    return { allowed: true };
  }

  private updateRateLimit(userId: string): void {
    const now = Date.now();
    let rateLimit = this.rateLimits.get(userId);

    if (!rateLimit) {
      rateLimit = {
        userId,
        count: 0,
        resetTime: now + (60 * 60 * 1000), // 1 hour from now
        dailyCost: 0,
        dailyResetTime: this.getNextDayResetTime()
      };
      this.rateLimits.set(userId, rateLimit);
    }

    rateLimit.count += 1;
    rateLimit.dailyCost += this.config.costPerSMS;
  }

  private getNextDayResetTime(): number {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }

  private formatSMSMessage(payload: NotificationPayload): string {
    // Keep SMS messages short and concise
    const severityEmoji = this.getSeverityEmoji(payload.severity);
    const typePrefix = this.getTypePrefix(payload.type);
    
    // Limit message to 160 characters for single SMS
    const maxLength = 140; // Leave room for emojis and formatting
    let message = `${severityEmoji} ${typePrefix}: ${payload.title}`;
    
    if (message.length < maxLength) {
      const remainingLength = maxLength - message.length - 3; // -3 for " - "
      if (payload.message.length <= remainingLength) {
        message += ` - ${payload.message}`;
      } else {
        message += ` - ${payload.message.substring(0, remainingLength - 3)}...`;
      }
    }

    return message;
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

  private getTypePrefix(type: string): string {
    switch (type) {
      case 'alert': return 'ALERT';
      case 'report': return 'REPORT';
      case 'system': return 'SYSTEM';
      case 'marketing': return 'INFO';
      default: return 'NOTIFICATION';
    }
  }

  private async logNotification(
    payload: NotificationPayload,
    preferences: NotificationPreferences,
    result: any
  ): Promise<void> {
    try {
      const logEntry = {
        id: `sms_${Date.now()}`,
        notificationId: payload.id,
        provider: 'sms',
        recipient: preferences.sms?.phoneNumber,
        status: result.status,
        messageId: result.sid,
        cost: this.config.costPerSMS,
        timestamp: new Date(),
        payload: {
          title: payload.title,
          type: payload.type,
          severity: payload.severity
        }
      };

      // TODO: Store in database
      console.log('SMS notification logged:', logEntry);
    } catch (error) {
      console.error('Failed to log SMS notification:', error);
    }
  }

  // Verify phone number with Twilio
  async verifyPhoneNumber(phoneNumber: string, code?: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!code) {
        // Send verification code
        // In a real implementation, you would use Twilio Verify API
        // const verification = await this.twilioClient.verify.services(VERIFY_SERVICE_SID)
        //   .verifications.create({ to: phoneNumber, channel: 'sms' });
        
        console.log(`Mock verification code sent to ${phoneNumber}`);
        return {
          success: true,
          message: 'Verification code sent successfully'
        };
      } else {
        // Verify the code
        // const verificationCheck = await this.twilioClient.verify.services(VERIFY_SERVICE_SID)
        //   .verificationChecks.create({ to: phoneNumber, code });
        
        // Mock verification - accept any 6-digit code
        const isValidCode = /^\d{6}$/.test(code);
        
        return {
          success: isValidCode,
          message: isValidCode ? 'Phone number verified successfully' : 'Invalid verification code'
        };
      }
    } catch (error) {
      console.error('Phone verification error:', error);
      return {
        success: false,
        message: 'Verification failed. Please try again.'
      };
    }
  }

  // Get SMS usage statistics
  async getUsageStats(userId: string): Promise<{
    hourlySent: number;
    dailyCost: number;
    remainingHourly: number;
    remainingDailyCost: number;
  }> {
    const rateLimit = this.rateLimits.get(userId);
    
    if (!rateLimit) {
      return {
        hourlySent: 0,
        dailyCost: 0,
        remainingHourly: this.config.maxHourlySMS,
        remainingDailyCost: this.config.maxDailyCost
      };
    }

    const now = Date.now();
    
    // Reset counters if needed
    if (now > rateLimit.resetTime) {
      rateLimit.count = 0;
    }
    
    if (now > rateLimit.dailyResetTime) {
      rateLimit.dailyCost = 0;
    }

    return {
      hourlySent: rateLimit.count,
      dailyCost: rateLimit.dailyCost,
      remainingHourly: Math.max(0, this.config.maxHourlySMS - rateLimit.count),
      remainingDailyCost: Math.max(0, this.config.maxDailyCost - rateLimit.dailyCost)
    };
  }
}

export default SMSProvider;