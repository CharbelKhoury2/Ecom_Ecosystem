// Security middleware for API endpoints

// Rate limiting configuration
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // Max requests per window

// API key validation
export function validateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  // For development, allow requests without API key
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  
  if (!apiKey || apiKey !== process.env.API_SECRET_KEY) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid API key required'
    });
  }
  
  next();
}

// Rate limiting middleware
export function rateLimit(req, res, next) {
  const clientId = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  
  // Clean up old entries
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.windowStart > RATE_LIMIT_WINDOW) {
      rateLimitStore.delete(key);
    }
  }
  
  // Get or create rate limit data for this client
  let clientData = rateLimitStore.get(clientId);
  if (!clientData || now - clientData.windowStart > RATE_LIMIT_WINDOW) {
    clientData = {
      count: 0,
      windowStart: now
    };
    rateLimitStore.set(clientId, clientData);
  }
  
  // Check rate limit
  clientData.count++;
  if (clientData.count > RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Max ${RATE_LIMIT_MAX_REQUESTS} requests per minute.`,
      retryAfter: Math.ceil((RATE_LIMIT_WINDOW - (now - clientData.windowStart)) / 1000)
    });
  }
  
  // Add rate limit headers
  res.set({
    'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS,
    'X-RateLimit-Remaining': Math.max(0, RATE_LIMIT_MAX_REQUESTS - clientData.count),
    'X-RateLimit-Reset': new Date(clientData.windowStart + RATE_LIMIT_WINDOW).toISOString()
  });
  
  next();
}

// Input validation middleware
export function validateInput(schema) {
  return (req, res, next) => {
    try {
      // Basic validation for common fields
      if (schema.requireUserId && !req.body.userId && !req.query.userId) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'userId is required'
        });
      }
      
      if (schema.requireShopifyCredentials) {
        const hasEnvCredentials = process.env.SHOPIFY_SHOP_DOMAIN && process.env.SHOPIFY_ACCESS_TOKEN;
        const hasUserCredentials = req.body.userId;
        
        if (!hasEnvCredentials && !hasUserCredentials) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Shopify credentials not configured and no userId provided'
          });
        }
      }
      
      // Validate numeric parameters
      if (schema.numericFields) {
        for (const field of schema.numericFields) {
          const value = req.query[field] || req.body[field];
          if (value !== undefined && (isNaN(value) || value < 0)) {
            return res.status(400).json({
              error: 'Bad Request',
              message: `${field} must be a valid positive number`
            });
          }
        }
      }
      
      next();
    } catch (error) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid input data'
      });
    }
  };
}

// Error handling middleware
export function handleErrors(error, req, res, next) {
  console.error('API Error:', {
    url: req.url,
    method: req.method,
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  
  // Shopify API specific errors
  if (error.message.includes('Shopify API error')) {
    return res.status(502).json({
      error: 'Shopify API Error',
      message: 'Failed to communicate with Shopify API',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
  
  // Database errors
  if (error.message.includes('Database error') || error.code === 'PGRST') {
    return res.status(503).json({
      error: 'Database Error',
      message: 'Database operation failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
  
  // Authentication errors
  if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
    return res.status(401).json({
      error: 'Authentication Error',
      message: 'Authentication failed'
    });
  }
  
  // Default error response
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
}

// Sanitize sensitive data from logs
export function sanitizeForLogging(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const sanitized = { ...data };
  const sensitiveFields = [
    'password', 'token', 'accessToken', 'access_token',
    'apiKey', 'api_key', 'secret', 'clientSecret',
    'authorization', 'cookie', 'session'
  ];
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  }
  
  return sanitized;
}

// CORS configuration for API endpoints
export function configureCORS(req, res, next) {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://your-domain.com' // Add your production domain
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
}

// Request logging middleware
export function logRequests(req, res, next) {
  const startTime = Date.now();
  
  // Log request
  console.log('API Request:', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    body: sanitizeForLogging(req.body),
    query: sanitizeForLogging(req.query)
  });
  
  // Log response when finished
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    console.log('API Response:', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    originalSend.call(this, data);
  };
  
  next();
}