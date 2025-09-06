/**
 * Enhanced API client with error handling, retry logic, and caching
 */

import { AppError, NetworkError, AuthenticationError, DataError } from './errorHandling';
import { apiCache } from './cache';
import { performanceMonitor } from './performance';

export interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  cache?: boolean;
  cacheTTL?: number;
  cacheKey?: string;
  validateResponse?: (data: unknown) => boolean;
  transformResponse?: (data: unknown) => unknown;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  headers: Headers;
  cached?: boolean;
  requestId: string;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private requestInterceptors: Array<(config: ApiRequestConfig) => ApiRequestConfig | Promise<ApiRequestConfig>> = [];
  private responseInterceptors: Array<(response: ApiResponse) => ApiResponse | Promise<ApiResponse>> = [];
  private errorInterceptors: Array<(error: ApiError) => ApiError | Promise<ApiError>> = [];

  constructor(baseURL: string = '', defaultHeaders: Record<string, string> = {}) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders
    };
  }

  // Interceptor methods
  addRequestInterceptor(interceptor: (config: ApiRequestConfig) => ApiRequestConfig | Promise<ApiRequestConfig>) {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: (response: ApiResponse) => ApiResponse | Promise<ApiResponse>) {
    this.responseInterceptors.push(interceptor);
  }

  addErrorInterceptor(interceptor: (error: ApiError) => ApiError | Promise<ApiError>) {
    this.errorInterceptors.push(interceptor);
  }

  async request<T = unknown>(
    endpoint: string,
    config: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const requestId = this.generateRequestId();
    const startTime = performance.now();

    try {
      // Apply request interceptors
      let finalConfig = { ...config };
      for (const interceptor of this.requestInterceptors) {
        finalConfig = await interceptor(finalConfig);
      }

      // Check cache first
      if (finalConfig.cache !== false && (finalConfig.method === 'GET' || !finalConfig.method)) {
        const cacheKey = finalConfig.cacheKey || this.generateCacheKey(endpoint, finalConfig);
        const cachedResponse = apiCache.get<T>(cacheKey);
        
        if (cachedResponse) {
          performanceMonitor.recordMetric(`api-${endpoint}-cache-hit`, performance.now() - startTime);
          return {
            data: cachedResponse,
            status: 200,
            headers: new Headers(),
            cached: true,
            requestId
          };
        }
      }

      // Make the actual request
      const response = await this.makeRequest(endpoint, finalConfig, requestId);
      
      // Apply response interceptors
      let finalResponse = response;
      for (const interceptor of this.responseInterceptors) {
        finalResponse = await interceptor(finalResponse);
      }

      // Cache successful GET requests
      if (finalConfig.cache !== false && 
          (finalConfig.method === 'GET' || !finalConfig.method) && 
          response.status >= 200 && response.status < 300) {
        const cacheKey = finalConfig.cacheKey || this.generateCacheKey(endpoint, finalConfig);
        const ttl = finalConfig.cacheTTL || 5 * 60 * 1000; // 5 minutes default
        apiCache.set(cacheKey, finalResponse.data, ttl);
      }

      performanceMonitor.recordMetric(`api-${endpoint}-success`, performance.now() - startTime);
      return finalResponse;

    } catch (error) {
      performanceMonitor.recordMetric(`api-${endpoint}-error`, performance.now() - startTime);
      
      let apiError = this.convertToApiError(error, endpoint, requestId);
      
      // Apply error interceptors
      for (const interceptor of this.errorInterceptors) {
        apiError = await interceptor(apiError);
      }
      
      throw this.convertToAppError(apiError, endpoint);
    }
  }

  private async makeRequest(
    endpoint: string,
    config: ApiRequestConfig,
    requestId: string
  ): Promise<ApiResponse> {
    const url = this.buildURL(endpoint);
    const headers = { ...this.defaultHeaders, ...config.headers };
    const timeout = config.timeout || 30000; // 30 seconds default
    const retries = config.retries || 3;
    const retryDelay = config.retryDelay || 1000;

    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const fetchOptions: RequestInit = {
          method: config.method || 'GET',
          headers,
          signal: controller.signal
        };

        if (config.body && config.method !== 'GET') {
          fetchOptions.body = typeof config.body === 'string' 
            ? config.body 
            : JSON.stringify(config.body);
        }

        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        let data: unknown;
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else if (contentType?.includes('text/')) {
          data = await response.text();
        } else {
          data = await response.blob();
        }

        // Validate response if validator provided
        if (config.validateResponse && !config.validateResponse(data)) {
          throw new Error('Response validation failed');
        }

        // Transform response if transformer provided
        if (config.transformResponse) {
          data = config.transformResponse(data);
        }

        return {
          data,
          status: response.status,
          headers: response.headers,
          requestId
        };

      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (this.isNonRetryableError(error as Error)) {
          break;
        }

        // Don't retry on last attempt
        if (attempt === retries) {
          break;
        }

        // Wait before retry with exponential backoff
        const delay = retryDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  private isNonRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('400') || // Bad Request
      message.includes('401') || // Unauthorized
      message.includes('403') || // Forbidden
      message.includes('404') || // Not Found
      message.includes('422')    // Unprocessable Entity
    );
  }

  private convertToApiError(error: unknown, endpoint: string, requestId: string): ApiError {
    if (error instanceof Error) {
      const statusMatch = error.message.match(/HTTP (\d+)/);
      const status = statusMatch ? parseInt(statusMatch[1]) : undefined;
      
      return {
        message: error.message,
        status,
        code: this.getErrorCode(error.message, status),
        details: {
          endpoint,
          requestId,
          timestamp: Date.now()
        }
      };
    }
    
    return {
      message: 'Unknown error occurred',
      code: 'UNKNOWN_ERROR',
      details: { endpoint, requestId }
    };
  }

  private convertToAppError(apiError: ApiError, endpoint: string): AppError {
    const context = {
      component: 'ApiClient',
      action: endpoint,
      metadata: apiError.details
    };

    if (apiError.status === 401) {
      return new AuthenticationError(apiError.message, context);
    }
    
    if (apiError.status && apiError.status >= 500) {
      return new NetworkError(apiError.message, context);
    }
    
    if (apiError.status && apiError.status >= 400 && apiError.status < 500) {
      return new DataError(apiError.message, context);
    }
    
    if (apiError.message.includes('fetch') || apiError.message.includes('network')) {
      return new NetworkError(apiError.message, context);
    }
    
    return new AppError(apiError.message, apiError.code || 'API_ERROR', context);
  }

  private getErrorCode(message: string, status?: number): string {
    if (status) {
      if (status === 401) return 'UNAUTHORIZED';
      if (status === 403) return 'FORBIDDEN';
      if (status === 404) return 'NOT_FOUND';
      if (status >= 500) return 'SERVER_ERROR';
      if (status >= 400) return 'CLIENT_ERROR';
    }
    
    if (message.includes('timeout')) return 'TIMEOUT';
    if (message.includes('network')) return 'NETWORK_ERROR';
    if (message.includes('abort')) return 'ABORTED';
    
    return 'API_ERROR';
  }

  private buildURL(endpoint: string): string {
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    
    const base = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL;
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    return `${base}${path}`;
  }

  private generateCacheKey(endpoint: string, config: ApiRequestConfig): string {
    const url = this.buildURL(endpoint);
    const method = config.method || 'GET';
    const bodyHash = config.body ? this.hashObject(config.body) : '';
    
    return `${method}:${url}:${bodyHash}`;
  }

  private hashObject(obj: unknown): string {
    return btoa(JSON.stringify(obj)).slice(0, 16);
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Convenience methods
  async get<T = unknown>(endpoint: string, config: Omit<ApiRequestConfig, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T = unknown>(endpoint: string, body?: unknown, config: Omit<ApiRequestConfig, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body });
  }

  async put<T = unknown>(endpoint: string, body?: unknown, config: Omit<ApiRequestConfig, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body });
  }

  async patch<T = unknown>(endpoint: string, body?: unknown, config: Omit<ApiRequestConfig, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body });
  }

  async delete<T = unknown>(endpoint: string, config: Omit<ApiRequestConfig, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

// Create default API client instance
export const apiClient = new ApiClient();

// Setup default interceptors
apiClient.addRequestInterceptor(async (config) => {
  // Add authentication token if available
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`
    };
  }
  
  return config;
});

apiClient.addResponseInterceptor(async (response) => {
  // Log successful requests in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`✅ API Success: ${response.requestId}`, response);
  }
  
  return response;
});

apiClient.addErrorInterceptor(async (error) => {
  // Log errors in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`❌ API Error:`, error);
  }
  
  // Handle token expiration
  if (error.status === 401) {
    localStorage.removeItem('auth_token');
    // Redirect to login if not already there
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }
  
  return error;
});

export default apiClient;