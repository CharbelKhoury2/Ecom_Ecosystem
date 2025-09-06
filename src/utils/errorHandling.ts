/**
 * Enhanced error handling utility for the e-commerce platform
 * Provides centralized error management, logging, and recovery mechanisms
 */

import { useNotificationHelpers } from '../components/NotificationSystem';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp?: number;
  metadata?: Record<string, unknown>;
}

export interface ErrorRecoveryOptions {
  retry?: () => Promise<void> | void;
  fallback?: () => void;
  redirect?: string;
  showNotification?: boolean;
  logError?: boolean;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly context: ErrorContext;
  public readonly recoverable: boolean;
  public readonly severity: 'low' | 'medium' | 'high' | 'critical';

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    context: ErrorContext = {},
    recoverable: boolean = true,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.context = { ...context, timestamp: Date.now() };
    this.recoverable = recoverable;
    this.severity = severity;
  }
}

export class NetworkError extends AppError {
  constructor(message: string, context: ErrorContext = {}) {
    super(message, 'NETWORK_ERROR', context, true, 'medium');
    this.name = 'NetworkError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context: ErrorContext = {}) {
    super(message, 'VALIDATION_ERROR', context, true, 'low');
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, context: ErrorContext = {}) {
    super(message, 'AUTH_ERROR', context, false, 'high');
    this.name = 'AuthenticationError';
  }
}

export class DataError extends AppError {
  constructor(message: string, context: ErrorContext = {}) {
    super(message, 'DATA_ERROR', context, true, 'medium');
    this.name = 'DataError';
  }
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private errorQueue: Array<{ error: AppError; context: ErrorContext }> = [];
  private isProcessing = false;

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  async logError(error: AppError, context: ErrorContext = {}): Promise<void> {
    const errorEntry = {
      error,
      context: { ...error.context, ...context }
    };

    this.errorQueue.push(errorEntry);
    
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    this.isProcessing = true;

    while (this.errorQueue.length > 0) {
      const errorEntry = this.errorQueue.shift();
      if (errorEntry) {
        await this.sendErrorToServer(errorEntry);
      }
    }

    this.isProcessing = false;
  }

  private async sendErrorToServer(errorEntry: { error: AppError; context: ErrorContext }): Promise<void> {
    try {
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.group(`🚨 ${errorEntry.error.severity.toUpperCase()} ERROR`);
        console.error('Message:', errorEntry.error.message);
        console.error('Code:', errorEntry.error.code);
        console.error('Context:', errorEntry.context);
        console.error('Stack:', errorEntry.error.stack);
        console.groupEnd();
      }

      // Send to error tracking service (implement based on your service)
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: errorEntry.error.message,
          code: errorEntry.error.code,
          severity: errorEntry.error.severity,
          context: errorEntry.context,
          stack: errorEntry.error.stack,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: Date.now()
        })
      });
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  }
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private logger: ErrorLogger;
  private retryAttempts = new Map<string, number>();
  private maxRetries = 3;

  constructor() {
    this.logger = ErrorLogger.getInstance();
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  async handleError(
    error: Error | AppError,
    context: ErrorContext = {},
    options: ErrorRecoveryOptions = {}
  ): Promise<void> {
    const appError = error instanceof AppError ? error : this.convertToAppError(error, context);
    
    // Log the error
    if (options.logError !== false) {
      await this.logger.logError(appError, context);
    }

    // Show notification if requested
    if (options.showNotification !== false) {
      this.showErrorNotification(appError, options);
    }

    // Handle recovery
    await this.attemptRecovery(appError, options);
  }

  private convertToAppError(error: Error, context: ErrorContext): AppError {
    if (error.message.includes('fetch')) {
      return new NetworkError(error.message, context);
    }
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      return new AuthenticationError(error.message, context);
    }
    return new AppError(error.message, 'UNKNOWN_ERROR', context);
  }

  private showErrorNotification(error: AppError, options: ErrorRecoveryOptions): void {
    // This would be called from a component context where notifications are available
    const message = this.getUserFriendlyMessage(error);
    
    // Store notification data for components to pick up
    window.dispatchEvent(new CustomEvent('app-error', {
      detail: {
        type: error.severity === 'critical' ? 'error' : 'warning',
        title: this.getErrorTitle(error),
        message,
        action: options.retry ? {
          label: 'Retry',
          onClick: options.retry
        } : undefined
      }
    }));
  }

  private getUserFriendlyMessage(error: AppError): string {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return 'Please check your internet connection and try again.';
      case 'AUTH_ERROR':
        return 'Please log in again to continue.';
      case 'VALIDATION_ERROR':
        return 'Please check your input and try again.';
      case 'DATA_ERROR':
        return 'There was an issue loading your data. Please refresh the page.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  private getErrorTitle(error: AppError): string {
    switch (error.severity) {
      case 'critical':
        return 'Critical Error';
      case 'high':
        return 'Error';
      case 'medium':
        return 'Warning';
      case 'low':
        return 'Notice';
      default:
        return 'Error';
    }
  }

  private async attemptRecovery(error: AppError, options: ErrorRecoveryOptions): Promise<void> {
    if (!error.recoverable) {
      if (options.redirect) {
        window.location.href = options.redirect;
      } else if (error instanceof AuthenticationError) {
        window.location.href = '/login';
      }
      return;
    }

    if (options.retry) {
      const retryKey = `${error.code}-${error.context.component || 'unknown'}`;
      const attempts = this.retryAttempts.get(retryKey) || 0;

      if (attempts < this.maxRetries) {
        this.retryAttempts.set(retryKey, attempts + 1);
        
        // Exponential backoff
        const delay = Math.pow(2, attempts) * 1000;
        setTimeout(async () => {
          try {
            await options.retry!();
            this.retryAttempts.delete(retryKey);
          } catch (retryError) {
            await this.handleError(retryError as Error, error.context, {
              ...options,
              retry: attempts + 1 < this.maxRetries ? options.retry : undefined
            });
          }
        }, delay);
      } else if (options.fallback) {
        options.fallback();
      }
    } else if (options.fallback) {
      options.fallback();
    }
  }

  clearRetryAttempts(component?: string): void {
    if (component) {
      for (const [key] of this.retryAttempts) {
        if (key.includes(component)) {
          this.retryAttempts.delete(key);
        }
      }
    } else {
      this.retryAttempts.clear();
    }
  }
}

// React hook for error handling
export function useErrorHandler() {
  const errorHandler = ErrorHandler.getInstance();
  const { showError, showWarning } = useNotificationHelpers();

  const handleError = async (
    error: Error | AppError,
    context: ErrorContext = {},
    options: ErrorRecoveryOptions = {}
  ) => {
    const appError = error instanceof AppError ? error : new AppError(error.message, 'UNKNOWN_ERROR', context);
    
    // Show notification using the notification system
    if (options.showNotification !== false) {
      const message = getUserFriendlyMessage(appError);
      if (appError.severity === 'critical' || appError.severity === 'high') {
        showError(getErrorTitle(appError), message, {
          action: options.retry ? {
            label: 'Retry',
            onClick: options.retry
          } : undefined
        });
      } else {
        showWarning(getErrorTitle(appError), message);
      }
    }

    await errorHandler.handleError(error, context, options);
  };

  return {
    handleError,
    clearRetryAttempts: errorHandler.clearRetryAttempts.bind(errorHandler)
  };
}

// Utility functions
function getUserFriendlyMessage(error: AppError): string {
  switch (error.code) {
    case 'NETWORK_ERROR':
      return 'Please check your internet connection and try again.';
    case 'AUTH_ERROR':
      return 'Please log in again to continue.';
    case 'VALIDATION_ERROR':
      return 'Please check your input and try again.';
    case 'DATA_ERROR':
      return 'There was an issue loading your data. Please refresh the page.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

function getErrorTitle(error: AppError): string {
  switch (error.severity) {
    case 'critical':
      return 'Critical Error';
    case 'high':
      return 'Error';
    case 'medium':
      return 'Warning';
    case 'low':
      return 'Notice';
    default:
      return 'Error';
  }
}

// Global error handler setup
export function setupGlobalErrorHandling(): void {
  const errorHandler = ErrorHandler.getInstance();

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorHandler.handleError(
      new AppError(
        event.reason?.message || 'Unhandled promise rejection',
        'UNHANDLED_PROMISE',
        { source: 'global' },
        true,
        'medium'
      )
    );
  });

  // Handle global JavaScript errors
  window.addEventListener('error', (event) => {
    errorHandler.handleError(
      new AppError(
        event.message || 'Global JavaScript error',
        'GLOBAL_ERROR',
        {
          source: 'global',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        },
        true,
        'high'
      )
    );
  });
}