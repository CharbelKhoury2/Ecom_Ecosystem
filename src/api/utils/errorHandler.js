// Enhanced error handling utilities for Shopify integration

// Shopify API error codes and their meanings
const SHOPIFY_ERROR_CODES = {
  401: 'Unauthorized - Invalid access token',
  402: 'Payment Required - Shop is frozen',
  403: 'Forbidden - Insufficient permissions',
  404: 'Not Found - Resource does not exist',
  406: 'Not Acceptable - Invalid request format',
  422: 'Unprocessable Entity - Invalid data',
  423: 'Locked - Shop is locked',
  429: 'Too Many Requests - Rate limit exceeded',
  500: 'Internal Server Error - Shopify server error',
  502: 'Bad Gateway - Shopify service unavailable',
  503: 'Service Unavailable - Shopify maintenance'
};

// Rate limit information from Shopify headers
function parseRateLimitHeaders(headers) {
  return {
    callLimit: headers['x-shopify-shop-api-call-limit'],
    bucketSize: headers['x-shopify-api-request-id'],
    retryAfter: headers['retry-after']
  };
}

// Enhanced Shopify error handler
export class ShopifyErrorHandler {
  static handleShopifyError(error, context = {}) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      context,
      originalError: error.message
    };

    // Handle fetch/network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        ...errorInfo,
        type: 'NETWORK_ERROR',
        message: 'Failed to connect to Shopify API',
        statusCode: 503,
        retryable: true,
        suggestion: 'Check internet connection and Shopify service status'
      };
    }

    // Handle HTTP response errors
    if (error.response) {
      const { status, statusText, headers } = error.response;
      const rateLimitInfo = parseRateLimitHeaders(headers);
      
      const errorDetails = {
        ...errorInfo,
        type: 'SHOPIFY_API_ERROR',
        statusCode: status,
        statusText,
        message: SHOPIFY_ERROR_CODES[status] || `Shopify API error: ${statusText}`,
        rateLimitInfo
      };

      // Handle specific error cases
      switch (status) {
        case 401:
          return {
            ...errorDetails,
            retryable: false,
            suggestion: 'Verify Shopify access token and permissions'
          };
        
        case 403:
          return {
            ...errorDetails,
            retryable: false,
            suggestion: 'Check API permissions and scopes for your Shopify app'
          };
        
        case 404:
          return {
            ...errorDetails,
            retryable: false,
            suggestion: 'Verify the resource exists and the endpoint URL is correct'
          };
        
        case 422:
          return {
            ...errorDetails,
            retryable: false,
            suggestion: 'Check request data format and required fields'
          };
        
        case 429:
          const retryAfter = headers['retry-after'] || 2;
          return {
            ...errorDetails,
            retryable: true,
            retryAfter: parseInt(retryAfter),
            suggestion: `Rate limit exceeded. Retry after ${retryAfter} seconds`
          };
        
        case 500:
        case 502:
        case 503:
          return {
            ...errorDetails,
            retryable: true,
            suggestion: 'Shopify service issue. Try again later'
          };
        
        default:
          return {
            ...errorDetails,
            retryable: status >= 500,
            suggestion: 'Check Shopify API documentation for this error code'
          };
      }
    }

    // Handle configuration errors
    if (error.message.includes('not configured') || error.message.includes('missing')) {
      return {
        ...errorInfo,
        type: 'CONFIGURATION_ERROR',
        message: 'Shopify configuration incomplete',
        statusCode: 500,
        retryable: false,
        suggestion: 'Check environment variables: SHOPIFY_SHOP_DOMAIN, SHOPIFY_ACCESS_TOKEN'
      };
    }

    // Handle validation errors
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return {
        ...errorInfo,
        type: 'VALIDATION_ERROR',
        message: 'Invalid data provided',
        statusCode: 400,
        retryable: false,
        suggestion: 'Check input data format and required fields'
      };
    }

    // Default error handling
    return {
      ...errorInfo,
      type: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
      statusCode: 500,
      retryable: false,
      suggestion: 'Contact support if the issue persists'
    };
  }

  // Retry logic with exponential backoff
  static async retryOperation(operation, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const errorDetails = this.handleShopifyError(error, { attempt });
        
        // Don't retry if error is not retryable
        if (!errorDetails.retryable || attempt === maxRetries) {
          throw error;
        }
        
        // Calculate delay with exponential backoff
        const delay = errorDetails.retryAfter 
          ? errorDetails.retryAfter * 1000 
          : baseDelay * Math.pow(2, attempt - 1);
        
        console.log(`Retrying operation in ${delay}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  // Create standardized error response
  static createErrorResponse(error, context = {}) {
    const errorDetails = this.handleShopifyError(error, context);
    
    return {
      success: false,
      error: {
        type: errorDetails.type,
        message: errorDetails.message,
        statusCode: errorDetails.statusCode,
        timestamp: errorDetails.timestamp,
        suggestion: errorDetails.suggestion,
        retryable: errorDetails.retryable,
        ...(errorDetails.retryAfter && { retryAfter: errorDetails.retryAfter })
      },
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          originalError: errorDetails.originalError,
          context: errorDetails.context
        }
      })
    };
  }
}

// Wrapper for Shopify API calls with error handling
export async function safeShopifyCall(operation, context = {}) {
  try {
    return await ShopifyErrorHandler.retryOperation(operation);
  } catch (error) {
    const errorResponse = ShopifyErrorHandler.createErrorResponse(error, context);
    console.error('Shopify API call failed:', errorResponse);
    throw error;
  }
}

// Middleware for handling Shopify API errors in Express routes
export function shopifyErrorMiddleware(error, req, res, next) {
  if (error.message && error.message.includes('Shopify')) {
    const errorResponse = ShopifyErrorHandler.createErrorResponse(error, {
      url: req.url,
      method: req.method,
      userId: req.body.userId || req.query.userId
    });
    
    return res.status(errorResponse.error.statusCode).json(errorResponse);
  }
  
  next(error);
}

// Health check for Shopify integration
export async function checkShopifyHealth() {
  try {
    const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    
    if (!shopDomain || !accessToken) {
      return {
        status: 'unhealthy',
        message: 'Shopify credentials not configured',
        timestamp: new Date().toISOString()
      };
    }
    
    // Simple API call to test connectivity
    const response = await fetch(`https://${shopDomain}/admin/api/2024-01/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      return {
        status: 'healthy',
        message: 'Shopify API connection successful',
        timestamp: new Date().toISOString()
      };
    } else {
      return {
        status: 'unhealthy',
        message: `Shopify API error: ${response.status} ${response.statusText}`,
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: `Shopify health check failed: ${error.message}`,
      timestamp: new Date().toISOString()
    };
  }
}