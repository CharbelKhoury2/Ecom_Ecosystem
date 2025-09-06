/**
 * Real-time alert system for monitoring data changes and triggering notifications
 */

import { useEffect, useCallback, useRef } from 'react';
import { useNotifications } from '../components/NotificationSystem';
import { performanceMonitor } from './performance';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  condition: AlertCondition;
  actions: AlertAction[];
  cooldown?: number; // Minimum time between alerts in milliseconds
  lastTriggered?: number;
}

export interface AlertCondition {
  type: 'threshold' | 'change' | 'pattern' | 'anomaly';
  field: string;
  operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'percentage_change';
  value: number | string;
  timeWindow?: number; // Time window in milliseconds for comparison
}

export interface AlertAction {
  type: 'notification' | 'email' | 'webhook' | 'log';
  config: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    persistent?: boolean;
    webhookUrl?: string;
    emailRecipients?: string[];
  };
}

export interface DataPoint {
  timestamp: number;
  [key: string]: unknown;
}

export interface AlertEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  data: Record<string, unknown>;
  acknowledged: boolean;
}

class RealTimeAlertSystem {
  private rules: Map<string, AlertRule> = new Map();
  private dataHistory: Map<string, DataPoint[]> = new Map();
  private alertHistory: AlertEvent[] = [];
  private subscribers: Set<(event: AlertEvent) => void> = new Set();
  private maxHistorySize = 1000;
  private maxAlertHistory = 500;

  /**
   * Add an alert rule
   */
  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Remove an alert rule
   */
  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  /**
   * Update an alert rule
   */
  updateRule(ruleId: string, updates: Partial<AlertRule>): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      this.rules.set(ruleId, { ...rule, ...updates });
    }
  }

  /**
   * Get all alert rules
   */
  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Process new data and check for alerts
   */
  processData(dataSource: string, data: DataPoint): void {
    const startTime = performance.now();

    // Store data in history
    if (!this.dataHistory.has(dataSource)) {
      this.dataHistory.set(dataSource, []);
    }
    
    const history = this.dataHistory.get(dataSource)!;
    history.push(data);
    
    // Limit history size
    if (history.length > this.maxHistorySize) {
      history.splice(0, history.length - this.maxHistorySize);
    }

    // Check all rules against this data
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;
      
      // Check cooldown
      if (rule.lastTriggered && rule.cooldown) {
        const timeSinceLastTrigger = Date.now() - rule.lastTriggered;
        if (timeSinceLastTrigger < rule.cooldown) continue;
      }

      if (this.evaluateRule(rule, dataSource, data, history)) {
        this.triggerAlert(rule, data);
      }
    }

    const endTime = performance.now();
    performanceMonitor.recordMetric('alert-processing', endTime - startTime, {
      dataSource,
      rulesChecked: this.rules.size,
      historySize: history.length,
    });
  }

  /**
   * Evaluate if a rule should trigger an alert
   */
  private evaluateRule(
    rule: AlertRule,
    dataSource: string,
    currentData: DataPoint,
    history: DataPoint[]
  ): boolean {
    const { condition } = rule;
    const currentValue = currentData[condition.field];

    if (currentValue === undefined || currentValue === null) {
      return false;
    }

    switch (condition.type) {
      case 'threshold':
        return this.evaluateThreshold(condition, currentValue);
      
      case 'change':
        return this.evaluateChange(condition, currentValue, history);
      
      case 'pattern':
        return this.evaluatePattern(condition, history);
      
      case 'anomaly':
        return this.evaluateAnomaly(condition, currentValue, history);
      
      default:
        return false;
    }
  }

  /**
   * Evaluate threshold conditions
   */
  private evaluateThreshold(condition: AlertCondition, value: unknown): boolean {
    const numValue = Number(value);
    const threshold = Number(condition.value);

    if (isNaN(numValue) || isNaN(threshold)) return false;

    switch (condition.operator) {
      case 'greater_than':
        return numValue > threshold;
      case 'less_than':
        return numValue < threshold;
      case 'equals':
        return numValue === threshold;
      case 'not_equals':
        return numValue !== threshold;
      default:
        return false;
    }
  }

  /**
   * Evaluate change conditions
   */
  private evaluateChange(condition: AlertCondition, currentValue: unknown, history: DataPoint[]): boolean {
    if (history.length < 2) return false;

    const timeWindow = condition.timeWindow || 300000; // 5 minutes default
    const cutoffTime = Date.now() - timeWindow;
    const relevantHistory = history.filter(point => point.timestamp >= cutoffTime);

    if (relevantHistory.length < 2) return false;

    const previousValue = relevantHistory[relevantHistory.length - 2][condition.field];
    const currentNum = Number(currentValue);
    const previousNum = Number(previousValue);

    if (isNaN(currentNum) || isNaN(previousNum) || previousNum === 0) return false;

    if (condition.operator === 'percentage_change') {
      const percentageChange = Math.abs((currentNum - previousNum) / previousNum) * 100;
      return percentageChange > Number(condition.value);
    }

    return false;
  }

  /**
   * Evaluate pattern conditions (simplified)
   */
  private evaluatePattern(condition: AlertCondition, history: DataPoint[]): boolean {
    // This is a simplified pattern detection
    // In a real implementation, you might use more sophisticated algorithms
    const timeWindow = condition.timeWindow || 900000; // 15 minutes default
    const cutoffTime = Date.now() - timeWindow;
    const relevantHistory = history.filter(point => point.timestamp >= cutoffTime);

    if (relevantHistory.length < 3) return false;

    // Check for consistent trend
    const values = relevantHistory.map(point => Number(point[condition.field])).filter(v => !isNaN(v));
    if (values.length < 3) return false;

    // Simple trend detection: all values increasing or decreasing
    const isIncreasing = values.every((val, i) => i === 0 || val > values[i - 1]);
    const isDecreasing = values.every((val, i) => i === 0 || val < values[i - 1]);

    return isIncreasing || isDecreasing;
  }

  /**
   * Evaluate anomaly conditions (simplified)
   */
  private evaluateAnomaly(condition: AlertCondition, currentValue: unknown, history: DataPoint[]): boolean {
    const timeWindow = condition.timeWindow || 3600000; // 1 hour default
    const cutoffTime = Date.now() - timeWindow;
    const relevantHistory = history.filter(point => point.timestamp >= cutoffTime);

    if (relevantHistory.length < 10) return false; // Need sufficient data

    const values = relevantHistory.map(point => Number(point[condition.field])).filter(v => !isNaN(v));
    if (values.length < 10) return false;

    // Calculate mean and standard deviation
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    const currentNum = Number(currentValue);
    if (isNaN(currentNum)) return false;

    // Check if current value is more than N standard deviations from mean
    const threshold = Number(condition.value) || 2; // Default to 2 standard deviations
    const deviation = Math.abs(currentNum - mean) / stdDev;

    return deviation > threshold;
  }

  /**
   * Trigger an alert
   */
  private triggerAlert(rule: AlertRule, data: DataPoint): void {
    const alertEvent: AlertEvent = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      ruleName: rule.name,
      timestamp: Date.now(),
      severity: rule.actions[0]?.config.severity || 'medium',
      message: rule.actions[0]?.config.message || `Alert triggered for rule: ${rule.name}`,
      data: { ...data },
      acknowledged: false,
    };

    // Add to alert history
    this.alertHistory.unshift(alertEvent);
    if (this.alertHistory.length > this.maxAlertHistory) {
      this.alertHistory = this.alertHistory.slice(0, this.maxAlertHistory);
    }

    // Update rule's last triggered time
    rule.lastTriggered = Date.now();

    // Execute alert actions
    rule.actions.forEach(action => {
      this.executeAlertAction(action, alertEvent);
    });

    // Notify subscribers
    this.subscribers.forEach(callback => {
      try {
        callback(alertEvent);
      } catch (error) {
        console.error('Error in alert subscriber:', error);
      }
    });

    // Track alert performance
    performanceMonitor.trackInteraction('alert-triggered', {
      ruleId: rule.id,
      severity: alertEvent.severity,
      actionCount: rule.actions.length,
    });
  }

  /**
   * Execute an alert action
   */
  private executeAlertAction(action: AlertAction, event: AlertEvent): void {
    switch (action.type) {
      case 'notification':
        // This will be handled by the React hook
        break;
      
      case 'log':
        console.log(`[ALERT] ${event.severity.toUpperCase()}: ${event.message}`, event.data);
        break;
      
      case 'webhook':
        if (action.config.webhookUrl) {
          this.sendWebhook(action.config.webhookUrl, event);
        }
        break;
      
      case 'email':
        // Email functionality would be implemented here
        console.log('Email alert would be sent to:', action.config.emailRecipients);
        break;
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhook(url: string, event: AlertEvent): Promise<void> {
    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alert: event,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to send webhook:', error);
    }
  }

  /**
   * Subscribe to alert events
   */
  subscribe(callback: (event: AlertEvent) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit?: number): AlertEvent[] {
    return limit ? this.alertHistory.slice(0, limit) : [...this.alertHistory];
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alertHistory.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  /**
   * Clear alert history
   */
  clearAlertHistory(): void {
    this.alertHistory = [];
  }
}

// Global alert system instance
export const alertSystem = new RealTimeAlertSystem();

/**
 * React hook for real-time alerts
 */
export function useRealTimeAlerts() {
  const { addNotification } = useNotifications();
  const alertSystemRef = useRef(alertSystem);

  // Subscribe to alert events
  useEffect(() => {
    const unsubscribe = alertSystemRef.current.subscribe((event) => {
      // Find notification action
      const rule = alertSystemRef.current.getRules().find(r => r.id === event.ruleId);
      const notificationAction = rule?.actions.find(a => a.type === 'notification');
      
      if (notificationAction) {
        const notificationType = {
          low: 'info' as const,
          medium: 'warning' as const,
          high: 'error' as const,
          critical: 'error' as const,
        }[event.severity];

        addNotification({
          type: notificationType,
          title: notificationAction.config.title,
          message: notificationAction.config.message,
          persistent: notificationAction.config.persistent,
          action: {
            label: 'View Details',
            onClick: () => {
              console.log('Alert details:', event);
              // You could open a modal or navigate to an alert details page
            },
          },
        });
      }
    });

    return unsubscribe;
  }, [addNotification]);

  const addRule = useCallback((rule: AlertRule) => {
    alertSystemRef.current.addRule(rule);
  }, []);

  const removeRule = useCallback((ruleId: string) => {
    alertSystemRef.current.removeRule(ruleId);
  }, []);

  const processData = useCallback((dataSource: string, data: DataPoint) => {
    alertSystemRef.current.processData(dataSource, data);
  }, []);

  const getAlertHistory = useCallback((limit?: number) => {
    return alertSystemRef.current.getAlertHistory(limit);
  }, []);

  const acknowledgeAlert = useCallback((alertId: string) => {
    alertSystemRef.current.acknowledgeAlert(alertId);
  }, []);

  return {
    addRule,
    removeRule,
    processData,
    getAlertHistory,
    acknowledgeAlert,
    getRules: () => alertSystemRef.current.getRules(),
  };
}

export default {
  alertSystem,
  useRealTimeAlerts,
};