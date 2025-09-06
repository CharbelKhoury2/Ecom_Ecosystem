/**
 * Optimized API hook that combines caching, performance monitoring, and error handling
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiCache } from '@/utils/cache';
import { performanceMonitor } from '@/utils/performance';

interface UseOptimizedApiOptions<T> {
  cacheKey: string;
  cacheTTL?: number;
  enableCache?: boolean;
  enablePerformanceTracking?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  dependencies?: React.DependencyList;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseOptimizedApiResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  clearCache: () => void;
  isStale: boolean;
  lastFetched: number | null;
}

export function useOptimizedApi<T>(
  apiCall: () => Promise<T>,
  options: UseOptimizedApiOptions<T>
): UseOptimizedApiResult<T> {
  const {
    cacheKey,
    cacheTTL = 5 * 60 * 1000, // 5 minutes default
    enableCache = true,
    enablePerformanceTracking = true,
    retryAttempts = 3,
    retryDelay = 1000,
    dependencies = [],
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const [isStale, setIsStale] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if cached data is stale
  const checkStaleData = useCallback(() => {
    if (!enableCache || !lastFetched) return false;
    return Date.now() - lastFetched > cacheTTL;
  }, [enableCache, lastFetched, cacheTTL]);

  // Clear cache for this key
  const clearCache = useCallback(() => {
    if (enableCache) {
      apiCache.delete(cacheKey);
      setIsStale(true);
    }
  }, [enableCache, cacheKey]);

  // Retry logic with exponential backoff
  const executeWithRetry = useCallback(async (
    fn: () => Promise<T>,
    attempt: number = 1
  ): Promise<T> => {
    if (attempt < retryAttempts) {
      try {
        return await fn();
      } catch (err) {
        const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
        
        return new Promise((resolve, reject) => {
          retryTimeoutRef.current = setTimeout(async () => {
            try {
              const result = await executeWithRetry(fn, attempt + 1);
              resolve(result);
            } catch (retryErr) {
              reject(retryErr);
            }
          }, delay);
        });
      }
    } else {
      return await fn();
    }
  }, [retryAttempts, retryDelay]);

  // Main fetch function
  const fetchData = useCallback(async (forceRefresh = false) => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear any pending retry
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // Check cache first (unless force refresh)
    if (!forceRefresh && enableCache) {
      const cached = apiCache.get<T>(cacheKey);
      if (cached !== null) {
        setData(cached);
        setError(null);
        setIsStale(checkStaleData());
        return;
      }
    }

    setLoading(true);
    setError(null);
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    const startTime = enablePerformanceTracking ? performance.now() : 0;

    try {
      // Execute API call with retry logic
      const result = await executeWithRetry(apiCall);
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      // Cache the result
      if (enableCache) {
        apiCache.set(cacheKey, result, cacheTTL);
      }

      // Update state
      setData(result);
      setLastFetched(Date.now());
      setIsStale(false);
      
      // Performance tracking
      if (enablePerformanceTracking) {
        const endTime = performance.now();
        performanceMonitor.recordMetric(`api-${cacheKey}`, endTime - startTime, {
          cached: false,
          success: true,
        });
      }

      // Success callback
      onSuccess?.(result);
      
    } catch (err) {
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      const error = err as Error;
      setError(error);
      
      // Performance tracking for errors
      if (enablePerformanceTracking) {
        const endTime = performance.now();
        performanceMonitor.recordMetric(`api-${cacheKey}`, endTime - startTime, {
          cached: false,
          success: false,
          error: error.message,
        });
      }

      // Error callback
      onError?.(error);
      
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [apiCall, cacheKey, cacheTTL, enableCache, enablePerformanceTracking, executeWithRetry, checkStaleData, onSuccess, onError]);

  // Refetch function
  const refetch = useCallback(() => fetchData(true), [fetchData]);

  // Effect to fetch data on mount and dependency changes
  useEffect(() => {
    fetchData();
    
    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  // Effect to check for stale data periodically
  useEffect(() => {
    if (!enableCache || !data) return;

    const interval = setInterval(() => {
      setIsStale(checkStaleData());
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [enableCache, data, checkStaleData]);

  return {
    data,
    loading,
    error,
    refetch,
    clearCache,
    isStale,
    lastFetched,
  };
}

/**
 * Hook for optimized mutation operations
 */
export function useOptimizedMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
    enablePerformanceTracking?: boolean;
    invalidateCache?: string[];
  }
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TData | null>(null);

  const mutate = useCallback(async (variables: TVariables) => {
    setLoading(true);
    setError(null);
    
    const startTime = options?.enablePerformanceTracking ? performance.now() : 0;

    try {
      const result = await mutationFn(variables);
      setData(result);
      
      // Invalidate specified cache keys
      if (options?.invalidateCache) {
        options.invalidateCache.forEach(key => apiCache.delete(key));
      }
      
      // Performance tracking
      if (options?.enablePerformanceTracking) {
        const endTime = performance.now();
        performanceMonitor.recordMetric('mutation', endTime - startTime, {
          success: true,
        });
      }

      options?.onSuccess?.(result, variables);
      return result;
      
    } catch (err) {
      const error = err as Error;
      setError(error);
      
      // Performance tracking for errors
      if (options?.enablePerformanceTracking) {
        const endTime = performance.now();
        performanceMonitor.recordMetric('mutation', endTime - startTime, {
          success: false,
          error: error.message,
        });
      }

      options?.onError?.(error, variables);
      throw error;
      
    } finally {
      setLoading(false);
    }
  }, [mutationFn, options]);

  return {
    mutate,
    loading,
    error,
    data,
    reset: () => {
      setData(null);
      setError(null);
    },
  };
}

export default useOptimizedApi;