/**
 * Email Notification Provider
 * Handles SMTP email sending with HTML templates
 */

// Note: nodemailer is server-side only, using fetch API for client-side email sending
// import nodemailer from 'nodemailer';
import { NotificationProvider, NotificationPayload, NotificationPreferences, NotificationResult } from '../notificationService';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

class EmailProvider implements NotificationProvider {
  name = 'email';
  type = 'email' as const;
  private transporter: any | null = null;
  private config: SMTPConfig;

  constructor() {
    this.config = {
      host: import.meta.env.VITE_SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(import.meta.env.VITE_SMTP_PORT || '587'),
      secure: import.meta.env.VITE_SMTP_SECURE === 'true',
      auth: {
        user: import.meta.env.VITE_SMTP_USER || '',
        pass: import.meta.env.VITE_SMTP_PASS || ''
      }
    };

    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    if (!this.isConfigured()) {
      console.warn('📧 Email provider not configured - missing SMTP credentials');
      return;
    }

    try {
      // Mock transporter for client-side - in production, this would call your email API
    this.transporter = {
      sendMail: async (options: any) => {
        console.log('Email would be sent:', options);
        // In production, make API call to your backend email service
        return { messageId: 'mock-' + Date.now() };
      }
    };
      console.log('📧 Email provider initialized successfully');
    } catch (error) {
      console.error('📧 Failed to initialize email provider:', error);
    }
  }

  isConfigured(): boolean {
    return !!(this.config.auth.user && this.config.auth.pass && this.config.host);
  }

  async send(payload: NotificationPayload, preferences: NotificationPreferences): Promise<NotificationResult> {
    if (!this.transporter) {
      return {
        success: false,
        error: 'Email provider not configured',
        provider: this.name,
        timestamp: new Date()
      };
    }

    try {
      const template = this.getTemplate(payload);
      const mailOptions = {
        from: `"Ecom Ecosystem" <${this.config.auth.user}>`,
        to: preferences.email.address,
        subject: template.subject,
        text: template.text,
        html: template.html
      };

      const info = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: info.messageId,
        provider: this.name,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error',
        provider: this.name,
        timestamp: new Date()
      };
    }
  }

  private getTemplate(payload: NotificationPayload): EmailTemplate {
    const baseTemplate = this.getBaseTemplate();
    
    switch (payload.type) {
      case 'alert':
        return this.getAlertTemplate(payload, baseTemplate);
      case 'report':
        return this.getReportTemplate(payload, baseTemplate);
      case 'system':
        return this.getSystemTemplate(payload, baseTemplate);
      default:
        return this.getDefaultTemplate(payload, baseTemplate);
    }
  }

  private getBaseTemplate(): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{{TITLE}}</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8fafc;
            }
            .container {
                background: white;
                border-radius: 8px;
                padding: 30px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #e2e8f0;
            }
            .logo {
                font-size: 24px;
                font-weight: bold;
                color: #2563eb;
                margin-bottom: 10px;
            }
            .alert-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                margin-bottom: 20px;
            }
            .alert-critical { background: #fee2e2; color: #dc2626; }
            .alert-high { background: #fef3c7; color: #d97706; }
            .alert-medium { background: #dbeafe; color: #2563eb; }
            .alert-low { background: #f0fdf4; color: #16a34a; }
            .content {
                margin: 20px 0;
            }
            .button {
                display: inline-block;
                padding: 12px 24px;
                background: #2563eb;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                margin: 20px 0;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
                font-size: 14px;
                color: #64748b;
                text-align: center;
            }
            .data-table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }
            .data-table th,
            .data-table td {
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid #e2e8f0;
            }
            .data-table th {
                background: #f8fafc;
                font-weight: 600;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🛒 Ecom Ecosystem</div>
                <div>{{SUBTITLE}}</div>
            </div>
            {{CONTENT}}
            <div class="footer">
                <p>This email was sent from your Ecom Ecosystem dashboard.</p>
                <p><a href="{{UNSUBSCRIBE_URL}}">Unsubscribe</a> | <a href="{{DASHBOARD_URL}}">View Dashboard</a></p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private getAlertTemplate(payload: NotificationPayload, baseTemplate: string): EmailTemplate {
    const severityClass = `alert-${payload.severity}`;
    const severityIcon = {
      critical: '🚨',
      high: '⚠️',
      medium: '📊',
      low: 'ℹ️'
    }[payload.severity];

    const content = `
      <div class="alert-badge ${severityClass}">
        ${severityIcon} ${payload.severity.toUpperCase()} ALERT
      </div>
      <h2>${payload.title}</h2>
      <div class="content">
        <p>${payload.message}</p>
        ${payload.data ? this.formatDataTable(payload.data) : ''}
      </div>
      <a href="{{DASHBOARD_URL}}/alerts" class="button">View All Alerts</a>
    `;

    const html = baseTemplate
      .replace('{{TITLE}}', `Alert: ${payload.title}`)
      .replace('{{SUBTITLE}}', 'Alert Notification')
      .replace('{{CONTENT}}', content)
      .replace('{{DASHBOARD_URL}}', import.meta.env.VITE_APP_URL || 'http://localhost:5173')
      .replace('{{UNSUBSCRIBE_URL}}', `${import.meta.env.VITE_APP_URL}/settings/notifications`);

    return {
      subject: `${severityIcon} [${payload.severity.toUpperCase()}] ${payload.title}`,
      html,
      text: `${payload.title}\n\n${payload.message}\n\nSeverity: ${payload.severity}\n\nView dashboard: ${import.meta.env.VITE_APP_URL}`
    };
  }

  private getReportTemplate(payload: NotificationPayload, baseTemplate: string): EmailTemplate {
    const content = `
      <h2>📊 ${payload.title}</h2>
      <div class="content">
        <p>${payload.message}</p>
        ${payload.data ? this.formatDataTable(payload.data) : ''}
      </div>
      <a href="{{DASHBOARD_URL}}/reports" class="button">View Full Report</a>
    `;

    const html = baseTemplate
      .replace('{{TITLE}}', `Report: ${payload.title}`)
      .replace('{{SUBTITLE}}', 'Scheduled Report')
      .replace('{{CONTENT}}', content)
      .replace('{{DASHBOARD_URL}}', import.meta.env.VITE_APP_URL || 'http://localhost:5173')
      .replace('{{UNSUBSCRIBE_URL}}', `${import.meta.env.VITE_APP_URL}/settings/notifications`);

    return {
      subject: `📊 Report: ${payload.title}`,
      html,
      text: `Report: ${payload.title}\n\n${payload.message}\n\nView dashboard: ${import.meta.env.VITE_APP_URL}`
    };
  }

  private getSystemTemplate(payload: NotificationPayload, baseTemplate: string): EmailTemplate {
    const content = `
      <h2>🔧 ${payload.title}</h2>
      <div class="content">
        <p>${payload.message}</p>
      </div>
      <a href="{{DASHBOARD_URL}}" class="button">Go to Dashboard</a>
    `;

    const html = baseTemplate
      .replace('{{TITLE}}', `System: ${payload.title}`)
      .replace('{{SUBTITLE}}', 'System Notification')
      .replace('{{CONTENT}}', content)
      .replace('{{DASHBOARD_URL}}', import.meta.env.VITE_APP_URL || 'http://localhost:5173')
      .replace('{{UNSUBSCRIBE_URL}}', `${import.meta.env.VITE_APP_URL}/settings/notifications`);

    return {
      subject: `🔧 System: ${payload.title}`,
      html,
      text: `System: ${payload.title}\n\n${payload.message}\n\nView dashboard: ${import.meta.env.VITE_APP_URL}`
    };
  }

  private getDefaultTemplate(payload: NotificationPayload, baseTemplate: string): EmailTemplate {
    const content = `
      <h2>${payload.title}</h2>
      <div class="content">
        <p>${payload.message}</p>
      </div>
      <a href="{{DASHBOARD_URL}}" class="button">Go to Dashboard</a>
    `;

    const html = baseTemplate
      .replace('{{TITLE}}', payload.title)
      .replace('{{SUBTITLE}}', 'Notification')
      .replace('{{CONTENT}}', content)
      .replace('{{DASHBOARD_URL}}', import.meta.env.VITE_APP_URL || 'http://localhost:5173')
      .replace('{{UNSUBSCRIBE_URL}}', `${import.meta.env.VITE_APP_URL}/settings/notifications`);

    return {
      subject: payload.title,
      html,
      text: `${payload.title}\n\n${payload.message}\n\nView dashboard: ${import.meta.env.VITE_APP_URL}`
    };
  }

  private formatDataTable(data: Record<string, any>): string {
    const rows = Object.entries(data)
      .map(([key, value]) => `
        <tr>
          <td><strong>${this.formatKey(key)}</strong></td>
          <td>${this.formatValue(value)}</td>
        </tr>
      `)
      .join('');

    return `
      <table class="data-table">
        <thead>
          <tr>
            <th>Property</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }

  private formatKey(key: string): string {
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  private formatValue(value: any): string {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toLocaleString();
    if (value instanceof Date) return value.toLocaleDateString();
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  }
}

export default EmailProvider;