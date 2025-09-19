/**
 * Advanced Caching Service
 * Implements multi-layer caching with Redis-like functionality, query optimization, and intelligent cache invalidation
 */

export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  tags: string[];
  size: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalSize: number;
  entryCount: number;
  memoryUsage: number;
}

export interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  maxMemory: number;
  evictionPolicy: 'lru' | 'lfu' | 'ttl' | 'random';
  compressionEnabled: boolean;
  persistToDisk: boolean;
}

class CachingService {
  private cache = new Map<string, CacheEntry>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalSize: 0,
    entryCount: 0,
    memoryUsage: 0
  };
  
  private config: CacheConfig = {
    maxSize: 1000,
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxMemory: 50 * 1024 * 1024, // 50MB
    evictionPolicy: 'lru',
    compressionEnabled: true,
    persistToDisk: false
  };
  
  private cleanupInterval: NodeJS.Timeout | null = null;
  private listeners: Map<string, ((key: string, data: unknown) => void)[]> = new Map();

  constructor(config?: Partial<CacheConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    this.startCleanupInterval();
    this.loadFromPersistentStorage();
  }

  /**
   * Set cache entry with advanced options
   */
  public set<T>(
    key: string, 
    data: T, 
    options: {
      ttl?: number;
      tags?: string[];
      priority?: number;
    } = {}
  ): void {
    const now = Date.now();
    const ttl = options.ttl || this.config.defaultTTL;
    const tags = options.tags || [];
    
    // Compress data if enabled
    const processedData = this.config.compressionEnabled ? this.compress(data) : data;
    const size = this.calculateSize(processedData);
    
    // Check memory limits
    if (this.stats.memoryUsage + size > this.config.maxMemory) {
      this.evictToFreeMemory(size);
    }
    
    // Check size limits
    if (this.cache.size >= this.config.maxSize) {
      this.evictEntries(1);
    }
    
    const entry: CacheEntry<T> = {
      data: processedData,
      timestamp: now,
      ttl,
      accessCount: 0,
      lastAccessed: now,
      tags,
      size
    };
    
    // Remove old entry if exists
    if (this.cache.has(key)) {
      const oldEntry = this.cache.get(key)!;
      this.stats.memoryUsage -= oldEntry.size;
      this.stats.entryCount--;
    }
    
    this.cache.set(key, entry);
    this.stats.memoryUsage += size;
    this.stats.entryCount++;
    this.stats.totalSize = this.cache.size;
    
    // Persist to disk if enabled
    if (this.config.persistToDisk) {
      this.persistToDisk(key, entry);
    }
    
    // Notify listeners
    this.notifyListeners('set', key, data);
  }

  /**
   * Get cache entry with automatic decompression
   */
  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
    
    const now = Date.now();
    
    // Check if expired
    if (now - entry.timestamp > entry.ttl) {
      this.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
    
    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;
    
    this.stats.hits++;
    this.updateHitRate();
    
    // Decompress data if needed
    const data = this.config.compressionEnabled ? this.decompress(entry.data) : entry.data;
    
    // Notify listeners
    this.notifyListeners('get', key, data);
    
    return data as T;
  }

  /**
   * Delete cache entry
   */
  public delete(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    this.cache.delete(key);
    this.stats.memoryUsage -= entry.size;
    this.stats.entryCount--;
    this.stats.totalSize = this.cache.size;
    
    // Remove from persistent storage
    if (this.config.persistToDisk) {
      this.removeFromDisk(key);
    }
    
    // Notify listeners
    this.notifyListeners('delete', key, null);
    
    return true;
  }

  /**
   * Check if key exists and is not expired
   */
  public has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Clear all cache entries
   */
  public clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalSize: 0,
      entryCount: 0,
      memoryUsage: 0
    };
    
    if (this.config.persistToDisk) {
      this.clearPersistentStorage();
    }
    
    // Notify listeners
    this.notifyListeners('clear', '', null);
  }

  /**
   * Invalidate cache entries by tags
   */
  public invalidateByTags(tags: string[]): number {
    let invalidated = 0;
    
    this.cache.forEach((entry, key) => {
      if (entry.tags.some(tag => tags.includes(tag))) {
        this.delete(key);
        invalidated++;
      }
    });
    
    return invalidated;
  }

  /**
   * Get cache statistics
   */
  public getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache configuration
   */
  public getConfig(): CacheConfig {
    return { ...this.config };
  }

  /**
   * Update cache configuration
   */
  public updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get all cache keys
   */
  public keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache entries by pattern
   */
  public getByPattern(pattern: RegExp): Map<string, unknown> {
    const results = new Map<string, unknown>();
    
    this.cache.forEach((entry, key) => {
      if (pattern.test(key)) {
        const data = this.config.compressionEnabled ? this.decompress(entry.data) : entry.data;
        results.set(key, data);
      }
    });
    
    return results;
  }

  /**
   * Memoize function with caching
   */
  public memoize<TArgs extends unknown[], TReturn>(
    fn: (...args: TArgs) => TReturn,
    keyGenerator?: (...args: TArgs) => string,
    ttl?: number
  ): (...args: TArgs) => TReturn {
    return (...args: TArgs): TReturn => {
      const key = keyGenerator ? keyGenerator(...args) : `memoized:${JSON.stringify(args)}`;
      
      let result = this.get<TReturn>(key);
      
      if (result === null) {
        result = fn(...args);
        this.set(key, result, { ttl });
      }
      
      return result;
    };
  }

  /**
   * Cache with automatic refresh
   */
  public async getOrRefresh<T>(
    key: string,
    refreshFn: () => Promise<T>,
    options: {
      ttl?: number;
      refreshThreshold?: number;
      tags?: string[];
    } = {}
  ): Promise<T> {
    const entry = this.cache.get(key);
    const now = Date.now();
    const refreshThreshold = options.refreshThreshold || 0.8;
    
    if (entry) {
      const age = now - entry.timestamp;
      const shouldRefresh = age > (entry.ttl * refreshThreshold);
      
      if (!shouldRefresh) {
        // Update access stats
        entry.accessCount++;
        entry.lastAccessed = now;
        this.stats.hits++;
        this.updateHitRate();
        
        const data = this.config.compressionEnabled ? this.decompress(entry.data) : entry.data;
        return data as T;
      }
    }
    
    // Refresh data
    try {
      const freshData = await refreshFn();
      this.set(key, freshData, options);
      return freshData;
    } catch (error) {
      // Return stale data if refresh fails and we have it
      if (entry) {
        const data = this.config.compressionEnabled ? this.decompress(entry.data) : entry.data;
        return data as T;
      }
      throw error;
    }
  }

  /**
   * Batch operations
   */
  public mset(entries: Array<{ key: string; data: unknown; options?: { ttl?: number; tags?: string[] } }>): void {
    entries.forEach(({ key, data, options }) => {
      this.set(key, data, options);
    });
  }

  public mget(keys: string[]): Map<string, unknown> {
    const results = new Map<string, unknown>();
    
    keys.forEach(key => {
      const data = this.get(key);
      if (data !== null) {
        results.set(key, data);
      }
    });
    
    return results;
  }

  /**
   * Add cache event listener
   */
  public on(event: string, callback: (key: string, data: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    this.listeners.get(event)!.push(callback);
    
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Evict entries based on policy
   */
  private evictEntries(count: number): void {
    const entries = Array.from(this.cache.entries());
    
    switch (this.config.evictionPolicy) {
      case 'lru':
        entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
        break;
      case 'lfu':
        entries.sort((a, b) => a[1].accessCount - b[1].accessCount);
        break;
      case 'ttl':
        entries.sort((a, b) => (a[1].timestamp + a[1].ttl) - (b[1].timestamp + b[1].ttl));
        break;
      case 'random':
        entries.sort(() => Math.random() - 0.5);
        break;
    }
    
    for (let i = 0; i < count && i < entries.length; i++) {
      this.delete(entries[i][0]);
    }
  }

  /**
   * Evict entries to free memory
   */
  private evictToFreeMemory(requiredSize: number): void {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed); // LRU
    
    let freedMemory = 0;
    let i = 0;
    
    while (freedMemory < requiredSize && i < entries.length) {
      const [key, entry] = entries[i];
      freedMemory += entry.size;
      this.delete(key);
      i++;
    }
  }

  /**
   * Start cleanup interval for expired entries
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 60000); // Every minute
  }

  /**
   * Cleanup expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    });
    
    expiredKeys.forEach(key => this.delete(key));
  }

  /**
   * Calculate size of data
   */
  private calculateSize(data: unknown): number {
    return JSON.stringify(data).length * 2; // Rough estimate
  }

  /**
   * Compress data (placeholder implementation)
   */
  private compress(data: unknown): unknown {
    // In a real implementation, you would use a compression library
    return data;
  }

  /**
   * Decompress data (placeholder implementation)
   */
  private decompress(data: unknown): unknown {
    // In a real implementation, you would use a decompression library
    return data;
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Notify event listeners
   */
  private notifyListeners(event: string, key: string, data: unknown): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(key, data);
        } catch (error) {
          console.error('Cache listener error:', error);
        }
      });
    }
  }

  /**
   * Persist to disk (placeholder implementation)
   */
  private persistToDisk(key: string, entry: CacheEntry): void {
    // In a real implementation, you would use IndexedDB or localStorage
    try {
      localStorage.setItem(`cache:${key}`, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to persist cache entry:', error);
    }
  }

  /**
   * Remove from disk (placeholder implementation)
   */
  private removeFromDisk(key: string): void {
    try {
      localStorage.removeItem(`cache:${key}`);
    } catch (error) {
      console.warn('Failed to remove cache entry from disk:', error);
    }
  }

  /**
   * Load from persistent storage
   */
  private loadFromPersistentStorage(): void {
    if (!this.config.persistToDisk) return;
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cache:')) {
          const cacheKey = key.substring(6);
          const entryData = localStorage.getItem(key);
          if (entryData) {
            const entry = JSON.parse(entryData) as CacheEntry;
            this.cache.set(cacheKey, entry);
            this.stats.memoryUsage += entry.size;
            this.stats.entryCount++;
          }
        }
      }
      this.stats.totalSize = this.cache.size;
    } catch (error) {
      console.warn('Failed to load cache from persistent storage:', error);
    }
  }

  /**
   * Clear persistent storage
   */
  private clearPersistentStorage(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cache:')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear persistent storage:', error);
    }
  }

  /**
   * Destroy cache service
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
    this.listeners.clear();
  }
}

// Create singleton instance
export const cachingService = new CachingService();
export default cachingService;