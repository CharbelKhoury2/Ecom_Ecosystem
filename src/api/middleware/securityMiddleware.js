import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import winston from 'winston';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import validator from 'validator';

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'ecom-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", 'https://*.supabase.co', 'wss://*.supabase.co'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Compression middleware
export const compressionMiddleware = compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024
});

// Request logging middleware
export const requestLogger = morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  },
  skip: (req, res) => {
    // Skip logging for health checks and static assets
    return req.url === '/health' || req.url.startsWith('/static/');
  }
});

// Rate limiting middleware
export const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests') => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Rate limit exceeded',
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url,
        method: req.method
      });
      
      res.status(429).json({
        error: 'Rate limit exceeded',
        message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    },
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.url === '/health';
    }
  });
};

// Speed limiting middleware (progressive delay)
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per windowMs without delay
  delayMs: 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // Maximum delay of 20 seconds
  skipFailedRequests: false,
  skipSuccessfulRequests: false,
  onLimitReached: (req, res, options) => {
    logger.warn('Speed limit reached', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method
    });
  }
});

// Specific rate limits for different endpoints
export const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many authentication attempts, please try again later'
);

export const apiRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  1000, // 1000 requests
  'API rate limit exceeded'
);

export const strictRateLimit = createRateLimit(
  60 * 1000, // 1 minute
  10, // 10 requests
  'Strict rate limit exceeded'
);

// JWT Authentication middleware
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Please provide a valid access token'
      });
    }

    // Verify JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      logger.warn('Invalid token attempt', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        token: token.substring(0, 10) + '...'
      });
      
      return res.status(403).json({
        error: 'Invalid token',
        message: 'The provided token is invalid or expired'
      });
    }

    // Add user to request object
    req.user = user;
    
    // Log successful authentication
    logger.info('User authenticated', {
      userId: user.id,
      email: user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    next();
  } catch (error) {
    logger.error('Authentication error', {
      error: error.message,
      stack: error.stack,
      ip: req.ip
    });
    
    res.status(500).json({
      error: 'Authentication failed',
      message: 'An error occurred during authentication'
    });
  }
};

// Role-based authorization middleware
export const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Please authenticate first'
        });
      }

      // Get user role from database
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', req.user.id)
        .single();

      if (error || !userProfile) {
        logger.error('Failed to get user role', {
          userId: req.user.id,
          error: error?.message
        });
        
        return res.status(500).json({
          error: 'Authorization failed',
          message: 'Could not verify user permissions'
        });
      }

      const userRole = userProfile.role;
      const allowedRoles = Array.isArray(roles) ? roles : [roles];

      if (!allowedRoles.includes(userRole)) {
        logger.warn('Unauthorized access attempt', {
          userId: req.user.id,
          userRole,
          requiredRoles: allowedRoles,
          url: req.url,
          method: req.method
        });
        
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: 'You do not have permission to access this resource'
        });
      }

      req.userRole = userRole;
      next();
    } catch (error) {
      logger.error('Authorization error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id
      });
      
      res.status(500).json({
        error: 'Authorization failed',
        message: 'An error occurred during authorization'
      });
    }
  };
};

// Input validation middleware
export const validateInput = (schema) => {
  return (req, res, next) => {
    try {
      const errors = [];
      
      // Validate request body
      if (schema.body) {
        for (const [field, rules] of Object.entries(schema.body)) {
          const value = req.body[field];
          
          if (rules.required && (value === undefined || value === null || value === '')) {
            errors.push(`${field} is required`);
            continue;
          }
          
          if (value !== undefined && value !== null && value !== '') {
            // Type validation
            if (rules.type === 'email' && !validator.isEmail(value)) {
              errors.push(`${field} must be a valid email`);
            }
            
            if (rules.type === 'url' && !validator.isURL(value)) {
              errors.push(`${field} must be a valid URL`);
            }
            
            if (rules.type === 'uuid' && !validator.isUUID(value)) {
              errors.push(`${field} must be a valid UUID`);
            }
            
            if (rules.type === 'number' && !validator.isNumeric(value.toString())) {
              errors.push(`${field} must be a number`);
            }
            
            // Length validation
            if (rules.minLength && value.length < rules.minLength) {
              errors.push(`${field} must be at least ${rules.minLength} characters`);
            }
            
            if (rules.maxLength && value.length > rules.maxLength) {
              errors.push(`${field} must be no more than ${rules.maxLength} characters`);
            }
            
            // Pattern validation
            if (rules.pattern && !rules.pattern.test(value)) {
              errors.push(`${field} format is invalid`);
            }
            
            // Custom validation
            if (rules.custom && !rules.custom(value)) {
              errors.push(`${field} validation failed`);
            }
          }
        }
      }
      
      // Validate query parameters
      if (schema.query) {
        for (const [field, rules] of Object.entries(schema.query)) {
          const value = req.query[field];
          
          if (rules.required && !value) {
            errors.push(`Query parameter ${field} is required`);
          }
          
          if (value && rules.type === 'number' && !validator.isNumeric(value)) {
            errors.push(`Query parameter ${field} must be a number`);
          }
        }
      }
      
      if (errors.length > 0) {
        logger.warn('Input validation failed', {
          errors,
          body: req.body,
          query: req.query,
          ip: req.ip,
          url: req.url
        });
        
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Request data is invalid',
          details: errors
        });
      }
      
      next();
    } catch (error) {
      logger.error('Validation middleware error', {
        error: error.message,
        stack: error.stack
      });
      
      res.status(500).json({
        error: 'Validation error',
        message: 'An error occurred during validation'
      });
    }
  };
};

// SQL injection protection
export const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Remove potential SQL injection patterns
      return obj.replace(/[';"\\]/g, '');
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    
    return obj;
  };
  
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  
  next();
};

// XSS protection
export const xssProtection = (req, res, next) => {
  const escapeHtml = (str) => {
    if (typeof str !== 'string') return str;
    
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  };
  
  const sanitizeObject = (obj) => {
    if (typeof obj === 'string') {
      return escapeHtml(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  };
  
  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  
  next();
};

// CSRF protection
export const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET requests and API endpoints with proper authentication
  if (req.method === 'GET' || req.path.startsWith('/api/')) {
    return next();
  }
  
  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;
  
  if (!token || !sessionToken || token !== sessionToken) {
    logger.warn('CSRF token validation failed', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method
    });
    
    return res.status(403).json({
      error: 'CSRF token validation failed',
      message: 'Invalid or missing CSRF token'
    });
  }
  
  next();
};

// Request size limiting
export const requestSizeLimit = (limit = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    const maxSize = parseSize(limit);
    
    if (contentLength > maxSize) {
      logger.warn('Request size limit exceeded', {
        contentLength,
        maxSize,
        ip: req.ip,
        url: req.url
      });
      
      return res.status(413).json({
        error: 'Request too large',
        message: `Request size exceeds limit of ${limit}`
      });
    }
    
    next();
  };
};

// IP whitelist/blacklist
export const ipFilter = (options = {}) => {
  const { whitelist = [], blacklist = [] } = options;
  
  return (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    
    // Check blacklist first
    if (blacklist.length > 0 && blacklist.includes(clientIp)) {
      logger.warn('Blocked IP attempt', {
        ip: clientIp,
        userAgent: req.get('User-Agent'),
        url: req.url
      });
      
      return res.status(403).json({
        error: 'Access denied',
        message: 'Your IP address is not allowed'
      });
    }
    
    // Check whitelist if configured
    if (whitelist.length > 0 && !whitelist.includes(clientIp)) {
      logger.warn('Non-whitelisted IP attempt', {
        ip: clientIp,
        userAgent: req.get('User-Agent'),
        url: req.url
      });
      
      return res.status(403).json({
        error: 'Access denied',
        message: 'Your IP address is not whitelisted'
      });
    }
    
    next();
  };
};

// Security event logging
export const logSecurityEvent = (eventType, severity = 'medium') => {
  return (req, res, next) => {
    logger.warn('Security event', {
      type: eventType,
      severity,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    });
    
    next();
  };
};

// Error handling middleware
export const securityErrorHandler = (err, req, res, next) => {
  logger.error('Security middleware error', {
    error: err.message,
    stack: err.stack,
    ip: req.ip,
    url: req.url,
    method: req.method,
    userId: req.user?.id
  });
  
  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  } else {
    res.status(500).json({
      error: 'Internal server error',
      message: err.message,
      stack: err.stack
    });
  }
};

// Helper function to parse size strings
function parseSize(size) {
  if (typeof size === 'number') return size;
  
  const units = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024
  };
  
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)$/);
  if (!match) throw new Error('Invalid size format');
  
  const [, value, unit] = match;
  return parseFloat(value) * units[unit];
}

// Export all middleware as a bundle
export const securityMiddlewareBundle = {
  headers: securityHeaders,
  compression: compressionMiddleware,
  logging: requestLogger,
  rateLimit: apiRateLimit,
  speedLimit: speedLimiter,
  auth: authenticateToken,
  sanitize: sanitizeInput,
  xss: xssProtection,
  errorHandler: securityErrorHandler
};

export default {
  securityHeaders,
  compressionMiddleware,
  requestLogger,
  createRateLimit,
  speedLimiter,
  authRateLimit,
  apiRateLimit,
  strictRateLimit,
  authenticateToken,
  requireRole,
  validateInput,
  sanitizeInput,
  xssProtection,
  csrfProtection,
  requestSizeLimit,
  ipFilter,
  logSecurityEvent,
  securityErrorHandler,
  securityMiddlewareBundle
};