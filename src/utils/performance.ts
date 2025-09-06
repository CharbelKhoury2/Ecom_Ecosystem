/**
 * Performance monitoring and analytics utility
 * Tracks loading times, bundle sizes, and user interactions
 */

import React, { useEffect, useState } from 'react';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

interface NavigationTiming {
  pageLoadTime: number;
  domContentLoadedTime: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  /**
   * Initialize performance observers
   */
  private initializeObservers(): void {
    if (typeof window === 'undefined') return;

    // Observe paint metrics
    if ('PerformanceObserver' in window) {
      try {
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric(entry.name, entry.startTime, {
              entryType: entry.entryType,
            });
          }
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(paintObserver);

        // Observe largest contentful paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.recordMetric('largest-contentful-paint', lastEntry.startTime, {
            element: (lastEntry as PerformanceEntry & { element?: { tagName: string } }).element?.tagName,
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);

        // Observe layout shifts
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            const layoutShiftEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
            if (!layoutShiftEntry.hadRecentInput) {
              clsValue += layoutShiftEntry.value || 0;
            }
          }
          this.recordMetric('cumulative-layout-shift', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);

        // Observe first input delay
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const fidEntry = entry as PerformanceEntry & { processingStart?: number; name?: string };
            this.recordMetric('first-input-delay', (fidEntry.processingStart || 0) - entry.startTime, {
              inputType: fidEntry.name,
            });
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (error) {
        console.warn('Performance observer initialization failed:', error);
      }
    }
  }

  /**
   * Record a custom performance metric
   */
  recordMetric(name: string, value: number, metadata?: Record<string, unknown>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata,
    };
    this.metrics.push(metric);

    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * Get navigation timing metrics
   */
  getNavigationTiming(): NavigationTiming | null {
    if (typeof window === 'undefined' || !window.performance?.timing) {
      return null;
    }

    const timing = window.performance.timing;

    return {
      pageLoadTime: timing.loadEventEnd - timing.navigationStart,
      domContentLoadedTime: timing.domContentLoadedEventEnd - timing.navigationStart,
      firstContentfulPaint: this.getMetricValue('first-contentful-paint'),
      largestContentfulPaint: this.getMetricValue('largest-contentful-paint'),
      firstInputDelay: this.getMetricValue('first-input-delay'),
      cumulativeLayoutShift: this.getMetricValue('cumulative-layout-shift'),
    };
  }

  /**
   * Get the latest value for a specific metric
   */
  private getMetricValue(name: string): number | undefined {
    const metric = this.metrics
      .filter(m => m.name === name)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    return metric?.value;
  }

  /**
   * Measure function execution time
   */
  measureFunction<T extends unknown[], R>(
    fn: (...args: T) => R,
    name: string
  ): (...args: T) => R {
    return (...args: T): R => {
      const start = performance.now();
      const result = fn(...args);
      const end = performance.now();
      this.recordMetric(`function-${name}`, end - start);
      return result;
    };
  }

  /**
   * Measure async function execution time
   */
  measureAsyncFunction<T extends unknown[], R>(
    fn: (...args: T) => Promise<R>,
    name: string
  ): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
      const start = performance.now();
      try {
        const result = await fn(...args);
        const end = performance.now();
        this.recordMetric(`async-function-${name}`, end - start, { status: 'success' });
        return result;
      } catch (error) {
        const end = performance.now();
        this.recordMetric(`async-function-${name}`, end - start, { status: 'error' });
        throw error;
      }
    };
  }

  /**
   * Track user interactions
   */
  trackInteraction(action: string, metadata?: Record<string, unknown>): void {
    this.recordMetric(`interaction-${action}`, Date.now(), metadata);
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    navigation: NavigationTiming | null;
    metrics: PerformanceMetric[];
    averages: Record<string, number>;
  } {
    const averages: Record<string, number> = {};
    const metricGroups = this.metrics.reduce((groups, metric) => {
      if (!groups[metric.name]) groups[metric.name] = [];
      groups[metric.name].push(metric.value);
      return groups;
    }, {} as Record<string, number[]>);

    for (const [name, values] of Object.entries(metricGroups)) {
      averages[name] = values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    return {
      navigation: this.getNavigationTiming(),
      metrics: this.metrics.slice(-50), // Last 50 metrics
      averages,
    };
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): string {
    return JSON.stringify({
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...this.getSummary(),
    }, null, 2);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Cleanup observers
   */
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.clear();
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for performance monitoring
 */

export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState(performanceMonitor.getSummary());

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(performanceMonitor.getSummary());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    recordMetric: performanceMonitor.recordMetric.bind(performanceMonitor),
    trackInteraction: performanceMonitor.trackInteraction.bind(performanceMonitor),
    exportMetrics: performanceMonitor.exportMetrics.bind(performanceMonitor),
  };
}

/**
 * Performance decorator for components
 */
export function withPerformanceTracking<P extends Record<string, unknown>>(
  Component: React.ComponentType<P>,
  componentName: string
): React.ComponentType<P> {
  return function PerformanceTrackedComponent(props: P) {
    useEffect(() => {
      const start = performance.now();
      performanceMonitor.recordMetric(`component-mount-${componentName}`, start);

      return () => {
        const end = performance.now();
        performanceMonitor.recordMetric(`component-unmount-${componentName}`, end - start);
      };
    }, []);

    return React.createElement(Component, props);
  };
}

export default PerformanceMonitor;