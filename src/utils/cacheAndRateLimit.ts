import { CopilotContext } from './copilotContext';

// In-memory cache for context data
interface CacheEntry {
  data: CopilotContext;
  timestamp: number;
  ttl: number;
}

// Rate limiting tracker
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class CopilotCache {
  private cache = new Map<string, CacheEntry>();
  private rateLimits = new Map<string, RateLimitEntry>();
  private readonly CACHE_TTL = 30 * 1000; // 30 seconds
  private readonly RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
  private readonly RATE_LIMIT_MAX_CALLS = 5; // 5 calls per minute

  /**
   * Get cached context data if available and not expired
   */
  get(workspace_id: string): CopilotContext | null {
    const entry = this.cache.get(workspace_id);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.timestamp + entry.ttl) {
      // Cache expired, remove it
      this.cache.delete(workspace_id);
      return null;
    }

    return entry.data;
  }

  /**
   * Set context data in cache with TTL
   */
  set(workspace_id: string, data: CopilotContext): void {
    const now = Date.now();
    this.cache.set(workspace_id, {
      data,
      timestamp: now,
      ttl: this.CACHE_TTL
    });

    // Clean up expired entries periodically
    this.cleanupExpiredEntries();
  }

  /**
   * Check if workspace is within rate limit
   */
  checkRateLimit(workspace_id: string): { allowed: boolean; resetTime?: number } {
    const now = Date.now();
    const entry = this.rateLimits.get(workspace_id);

    if (!entry || now > entry.resetTime) {
      // No entry or window expired, create new one
      this.rateLimits.set(workspace_id, {
        count: 1,
        resetTime: now + this.RATE_LIMIT_WINDOW
      });
      return { allowed: true };
    }

    if (entry.count >= this.RATE_LIMIT_MAX_CALLS) {
      return { 
        allowed: false, 
        resetTime: entry.resetTime 
      };
    }

    // Increment count
    entry.count++;
    return { allowed: true };
  }

  /**
   * Get rate limit status for workspace
   */
  getRateLimitStatus(workspace_id: string): {
    remaining: number;
    resetTime: number;
    limit: number;
  } {
    const now = Date.now();
    const entry = this.rateLimits.get(workspace_id);

    if (!entry || now > entry.resetTime) {
      return {
        remaining: this.RATE_LIMIT_MAX_CALLS - 1,
        resetTime: now + this.RATE_LIMIT_WINDOW,
        limit: this.RATE_LIMIT_MAX_CALLS
      };
    }

    return {
      remaining: Math.max(0, this.RATE_LIMIT_MAX_CALLS - entry.count),
      resetTime: entry.resetTime,
      limit: this.RATE_LIMIT_MAX_CALLS
    };
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    
    // Clean up cache
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key);
      }
    }

    // Clean up rate limits
    for (const [key, entry] of this.rateLimits.entries()) {
      if (now > entry.resetTime) {
        this.rateLimits.delete(key);
      }
    }
  }

  /**
   * Clear all cache and rate limit data (for testing)
   */
  clear(): void {
    this.cache.clear();
    this.rateLimits.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    cacheSize: number;
    rateLimitEntries: number;
    cacheHitRate?: number;
  } {
    return {
      cacheSize: this.cache.size,
      rateLimitEntries: this.rateLimits.size
    };
  }
}

// Singleton instance
export const copilotCache = new CopilotCache();

/**
 * Rate limit error class
 */
export class RateLimitError extends Error {
  constructor(
    public resetTime: number,
    public remaining: number = 0
  ) {
    super('Rate limit exceeded');
    this.name = 'RateLimitError';
  }
}

/**
 * Middleware function to check rate limits
 */
export function checkRateLimit(workspace_id: string): void {
  const result = copilotCache.checkRateLimit(workspace_id);
  
  if (!result.allowed) {
    throw new RateLimitError(result.resetTime || Date.now() + 60000);
  }
}

/**
 * Get cached context or return null if not available/expired
 */
export function getCachedContext(workspace_id: string): CopilotContext | null {
  return copilotCache.get(workspace_id);
}

/**
 * Cache context data
 */
export function setCachedContext(workspace_id: string, context: CopilotContext): void {
  copilotCache.set(workspace_id, context);
}

/**
 * Get rate limit headers for HTTP responses
 */
export function getRateLimitHeaders(workspace_id: string): Record<string, string> {
  const status = copilotCache.getRateLimitStatus(workspace_id);
  
  return {
    'X-RateLimit-Limit': status.limit.toString(),
    'X-RateLimit-Remaining': status.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(status.resetTime / 1000).toString()
  };
}