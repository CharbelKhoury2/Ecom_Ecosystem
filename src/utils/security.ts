/**
 * Security utilities for input validation, sanitization, and protection
 */

import { performanceMonitor } from './performance';

// Common validation patterns
export const VALIDATION_PATTERNS = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^[+]?[1-9][\d]{0,15}$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  alphanumericWithSpaces: /^[a-zA-Z0-9\s]+$/,
  numeric: /^\d+$/,
  decimal: /^\d+(\.\d+)?$/,
  hexColor: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  sqlInjection: /('|(--|;|(\||\|)|(\*|\*))/i,
  xss: /<script[^>]*>.*?<\/script>/gi,
};

// Security error types
export class SecurityError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'SecurityError';
  }
}

export class ValidationError extends SecurityError {
  constructor(field: string, message: string) {
    super(`Validation failed for ${field}: ${message}`, 'VALIDATION_ERROR');
  }
}

export class SanitizationError extends SecurityError {
  constructor(message: string) {
    super(message, 'SANITIZATION_ERROR');
  }
}

/**
 * Input validation utilities
 */
export class InputValidator {
  private static logValidation(field: string, success: boolean, error?: string) {
    performanceMonitor.trackInteraction('input-validation', {
      field,
      success,
      error,
    });
  }

  /**
   * Validate email address
   */
  static validateEmail(email: string): boolean {
    const isValid = VALIDATION_PATTERNS.email.test(email.trim());
    this.logValidation('email', isValid, isValid ? undefined : 'Invalid email format');
    return isValid;
  }

  /**
   * Validate phone number
   */
  static validatePhone(phone: string): boolean {
    const cleaned = phone.replace(/[\s\-()]/g, '');
    const isValid = VALIDATION_PATTERNS.phone.test(cleaned);
    this.logValidation('phone', isValid, isValid ? undefined : 'Invalid phone format');
    return isValid;
  }

  /**
   * Validate URL
   */
  static validateUrl(url: string): boolean {
    const isValid = VALIDATION_PATTERNS.url.test(url.trim());
    this.logValidation('url', isValid, isValid ? undefined : 'Invalid URL format');
    return isValid;
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): { isValid: boolean; score: number; feedback: string[] } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Password must be at least 8 characters long');
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one uppercase letter');
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one lowercase letter');
    }

    // Number check
    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one number');
    }

    // Special character check
    if (/[@$!%*?&]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one special character (@$!%*?&)');
    }

    // Common patterns check
    const commonPatterns = ['123456', 'password', 'qwerty', 'abc123'];
    if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
      score -= 1;
      feedback.push('Password contains common patterns');
    }

    const isValid = score >= 4 && feedback.length === 0;
    this.logValidation('password', isValid, isValid ? undefined : feedback.join(', '));

    return {
      isValid,
      score: Math.max(0, score),
      feedback,
    };
  }

  /**
   * Validate string length
   */
  static validateLength(value: string, min: number, max: number, fieldName: string): boolean {
    const length = value.trim().length;
    const isValid = length >= min && length <= max;
    
    if (!isValid) {
      const error = length < min 
        ? `${fieldName} must be at least ${min} characters`
        : `${fieldName} must not exceed ${max} characters`;
      this.logValidation(fieldName, false, error);
    } else {
      this.logValidation(fieldName, true);
    }
    
    return isValid;
  }

  /**
   * Validate numeric range
   */
  static validateRange(value: number, min: number, max: number, fieldName: string): boolean {
    const isValid = value >= min && value <= max;
    
    if (!isValid) {
      const error = `${fieldName} must be between ${min} and ${max}`;
      this.logValidation(fieldName, false, error);
    } else {
      this.logValidation(fieldName, true);
    }
    
    return isValid;
  }

  /**
   * Validate against custom pattern
   */
  static validatePattern(value: string, pattern: RegExp, fieldName: string, errorMessage?: string): boolean {
    const isValid = pattern.test(value);
    
    if (!isValid) {
      const error = errorMessage || `${fieldName} format is invalid`;
      this.logValidation(fieldName, false, error);
    } else {
      this.logValidation(fieldName, true);
    }
    
    return isValid;
  }

  /**
   * Check for potential SQL injection
   */
  static checkSqlInjection(input: string): boolean {
    const hasSqlInjection = VALIDATION_PATTERNS.sqlInjection.test(input);
    if (hasSqlInjection) {
      this.logValidation('sql-injection-check', false, 'Potential SQL injection detected');
    }
    return hasSqlInjection;
  }

  /**
   * Check for potential XSS
   */
  static checkXss(input: string): boolean {
    const hasXss = VALIDATION_PATTERNS.xss.test(input);
    if (hasXss) {
      this.logValidation('xss-check', false, 'Potential XSS detected');
    }
    return hasXss;
  }
}

/**
 * Input sanitization utilities
 */
export class InputSanitizer {
  /**
   * Sanitize HTML content
   */
  static sanitizeHtml(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Sanitize for SQL (basic escaping)
   */
  static sanitizeSql(input: string): string {
    return input.replace(/'/g, "''");
  }

  /**
   * Remove potentially dangerous characters
   */
  static removeDangerousChars(input: string): string {
    return input.replace(/[<>"'&\\]/g, '');
  }

  /**
   * Sanitize filename
   */
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 255);
  }

  /**
   * Sanitize URL
   */
  static sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new SanitizationError('Invalid URL protocol');
      }
      return urlObj.toString();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      throw new SanitizationError('Invalid URL format');
    }
  }

  /**
   * Trim and normalize whitespace
   */
  static normalizeWhitespace(input: string): string {
    return input.trim().replace(/\s+/g, ' ');
  }

  /**
   * Remove null bytes and control characters
   */
  static removeControlChars(input: string): string {
    // Remove control characters by filtering out characters with codes 0-31 and 127
    return input.split('').filter(char => {
      const code = char.charCodeAt(0);
      return code > 31 && code !== 127;
    }).join('');
  }
}

/**
 * Rate limiting utilities
 */
export class RateLimiter {
  private static requests = new Map<string, { count: number; resetTime: number }>();
  private static defaultLimit = 100; // requests per window
  private static defaultWindow = 60000; // 1 minute

  /**
   * Check if request is within rate limit
   */
  static checkLimit(
    identifier: string,
    limit: number = this.defaultLimit,
    windowMs: number = this.defaultWindow
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const key = `${identifier}:${Math.floor(now / windowMs)}`;
    
    const current = this.requests.get(key) || { count: 0, resetTime: now + windowMs };
    
    if (now > current.resetTime) {
      // Reset window
      current.count = 0;
      current.resetTime = now + windowMs;
    }
    
    current.count++;
    this.requests.set(key, current);
    
    // Clean up old entries
    this.cleanup();
    
    const allowed = current.count <= limit;
    const remaining = Math.max(0, limit - current.count);
    
    // Log rate limit check
    performanceMonitor.trackInteraction('rate-limit-check', {
      identifier,
      allowed,
      count: current.count,
      limit,
    });
    
    return {
      allowed,
      remaining,
      resetTime: current.resetTime,
    };
  }

  /**
   * Clean up expired entries
   */
  private static cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.requests.entries()) {
      if (now > value.resetTime) {
        this.requests.delete(key);
      }
    }
  }

  /**
   * Reset rate limit for identifier
   */
  static reset(identifier: string): void {
    const keysToDelete = Array.from(this.requests.keys())
      .filter(key => key.startsWith(identifier + ':'));
    
    keysToDelete.forEach(key => this.requests.delete(key));
  }
}

/**
 * Audit logging utilities
 */
export interface AuditLogEntry {
  id: string;
  timestamp: number;
  userId?: string;
  action: string;
  resource: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  error?: string;
}

export class AuditLogger {
  private static logs: AuditLogEntry[] = [];
  private static maxLogs = 10000;

  /**
   * Log an audit event
   */
  static log(
    action: string,
    resource: string,
    details: Record<string, unknown> = {},
    userId?: string,
    success: boolean = true,
    error?: string
  ): void {
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      userId,
      action,
      resource,
      details,
      ipAddress: this.getClientIP(),
      userAgent: this.getUserAgent(),
      success,
      error,
    };

    this.logs.unshift(entry);
    
    // Limit log size
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUDIT]', entry);
    }

    // Track audit event
    performanceMonitor.trackInteraction('audit-log', {
      action,
      resource,
      success,
      userId: userId ? 'present' : 'absent',
    });
  }

  /**
   * Get audit logs
   */
  static getLogs(limit?: number, userId?: string, action?: string): AuditLogEntry[] {
    let filtered = this.logs;

    if (userId) {
      filtered = filtered.filter(log => log.userId === userId);
    }

    if (action) {
      filtered = filtered.filter(log => log.action === action);
    }

    return limit ? filtered.slice(0, limit) : filtered;
  }

  /**
   * Clear audit logs
   */
  static clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export audit logs
   */
  static exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Get client IP (simplified for browser environment)
   */
  private static getClientIP(): string {
    // In a real application, this would be handled server-side
    return 'client-ip';
  }

  /**
   * Get user agent
   */
  private static getUserAgent(): string {
    return typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
  }
}

/**
 * Content Security Policy utilities
 */
export class CSPHelper {
  /**
   * Generate CSP header value
   */
  static generateCSP(options: {
    defaultSrc?: string[];
    scriptSrc?: string[];
    styleSrc?: string[];
    imgSrc?: string[];
    connectSrc?: string[];
    fontSrc?: string[];
    objectSrc?: string[];
    mediaSrc?: string[];
    frameSrc?: string[];
  }): string {
    const directives: string[] = [];

    if (options.defaultSrc) {
      directives.push(`default-src ${options.defaultSrc.join(' ')}`);
    }

    if (options.scriptSrc) {
      directives.push(`script-src ${options.scriptSrc.join(' ')}`);
    }

    if (options.styleSrc) {
      directives.push(`style-src ${options.styleSrc.join(' ')}`);
    }

    if (options.imgSrc) {
      directives.push(`img-src ${options.imgSrc.join(' ')}`);
    }

    if (options.connectSrc) {
      directives.push(`connect-src ${options.connectSrc.join(' ')}`);
    }

    if (options.fontSrc) {
      directives.push(`font-src ${options.fontSrc.join(' ')}`);
    }

    if (options.objectSrc) {
      directives.push(`object-src ${options.objectSrc.join(' ')}`);
    }

    if (options.mediaSrc) {
      directives.push(`media-src ${options.mediaSrc.join(' ')}`);
    }

    if (options.frameSrc) {
      directives.push(`frame-src ${options.frameSrc.join(' ')}`);
    }

    return directives.join('; ');
  }

  /**
   * Get recommended CSP for the application
   */
  static getRecommendedCSP(): string {
    return this.generateCSP({
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://api.supabase.co'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    });
  }
}

export default {
  InputValidator,
  InputSanitizer,
  RateLimiter,
  AuditLogger,
  CSPHelper,
  VALIDATION_PATTERNS,
  SecurityError,
  ValidationError,
  SanitizationError,
};