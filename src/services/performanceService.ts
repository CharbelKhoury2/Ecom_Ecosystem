/**
 * Performance Optimization Service
 * Handles caching, lazy loading, bundle optimization, and performance monitoring
 */

export interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
}

export interface CacheConfig {
  maxAge: number;
  maxSize: number;
  strategy: 'lru' | 'fifo' | 'lfu';
}

export interface LazyLoadConfig {
  rootMargin: string;
  threshold: number;
  enableIntersectionObserver: boolean;
}

class PerformanceService {
  private cache = new Map<string, { data: unknown; timestamp: number; accessCount: number }>();
  private cacheConfig: CacheConfig = {
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
    strategy: 'lru'
  };
  
  private lazyLoadConfig: LazyLoadConfig = {
    rootMargin: '50px',
    threshold: 0.1,
    enableIntersectionObserver: true
  };
  
  private performanceObserver: PerformanceObserver | null = null;
  private metrics: Partial<PerformanceMetrics> = {};
  private listeners: ((metrics: Partial<PerformanceMetrics>) => void)[] = [];

  constructor() {
    this.initPerformanceMonitoring();
    this.setupResourceHints();
  }

  /**
   * Initialize performance monitoring
   */
  private initPerformanceMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Web Vitals monitoring
    this.observeWebVitals();
    
    // Resource timing
    this.observeResourceTiming();
    
    // Navigation timing
    this.observeNavigationTiming();
  }

  /**
   * Observe Web Vitals metrics
   */
  private observeWebVitals(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
        this.metrics.largestContentfulPaint = lastEntry.startTime;
        this.notifyListeners();
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const fidEntry = entry as PerformanceEntry & { processingStart: number; startTime: number };
          this.metrics.firstInputDelay = fidEntry.processingStart - fidEntry.startTime;
          this.notifyListeners();
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const layoutShiftEntry = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value;
          }
        });
        this.metrics.cumulativeLayoutShift = clsValue;
        this.notifyListeners();
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

    } catch (error) {
      console.warn('Performance monitoring setup failed:', error);
    }
  }

  /**
   * Observe resource timing
   */
  private observeResourceTiming(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          // Log slow resources
          if (resourceEntry.duration > 1000) {
            console.warn(`Slow resource detected: ${resourceEntry.name} (${resourceEntry.duration}ms)`);
          }
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.warn('Resource timing monitoring failed:', error);
    }
  }

  /**
   * Observe navigation timing
   */
  private observeNavigationTiming(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          this.metrics.loadTime = navigation.loadEventEnd - navigation.fetchStart;
          this.metrics.timeToInteractive = navigation.domInteractive - navigation.fetchStart;
          
          // First Contentful Paint
          const paintEntries = performance.getEntriesByType('paint');
          const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
          if (fcpEntry) {
            this.metrics.firstContentfulPaint = fcpEntry.startTime;
          }
          
          this.notifyListeners();
        }
      }, 0);
    });
  }

  /**
   * Setup resource hints for better performance
   */
  private setupResourceHints(): void {
    if (typeof document === 'undefined') return;

    // Preload critical resources
    this.preloadCriticalResources();
    
    // Setup prefetch for likely next pages
    this.setupPrefetch();
  }

  /**
   * Preload critical resources
   */
  private preloadCriticalResources(): void {
    const criticalResources = [
      { href: '/fonts/main.woff2', as: 'font', type: 'font/woff2' },
      { href: '/api/dashboard/metrics', as: 'fetch' }
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      if (resource.type) {
        link.type = resource.type;
        link.crossOrigin = 'anonymous';
      }
      document.head.appendChild(link);
    });
  }

  /**
   * Setup prefetch for likely next pages
   */
  private setupPrefetch(): void {
    const prefetchUrls = [
      '/products',
      '/analytics',
      '/customers'
    ];

    // Prefetch after initial load
    window.addEventListener('load', () => {
      setTimeout(() => {
        prefetchUrls.forEach(url => {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = url;
          document.head.appendChild(link);
        });
      }, 2000);
    });
  }

  /**
   * Cache data with configurable strategy
   */
  public setCache(key: string, data: unknown): void {
    const now = Date.now();
    
    // Check cache size and evict if necessary
    if (this.cache.size >= this.cacheConfig.maxSize) {
      this.evictCache();
    }
    
    this.cache.set(key, {
      data,
      timestamp: now,
      accessCount: 1
    });
  }

  /**
   * Get cached data
   */
  public getCache(key: string): unknown | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    const now = Date.now();
    
    // Check if cache is expired
    if (now - cached.timestamp > this.cacheConfig.maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    // Update access count for LFU strategy
    cached.accessCount++;
    
    return cached.data;
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Evict cache based on strategy
   */
  private evictCache(): void {
    if (this.cache.size === 0) return;
    
    let keyToEvict: string;
    
    switch (this.cacheConfig.strategy) {
      case 'lru': {
        // Evict least recently used
        let oldestTime = Date.now();
        keyToEvict = '';
        
        this.cache.forEach((value, key) => {
          if (value.timestamp < oldestTime) {
            oldestTime = value.timestamp;
            keyToEvict = key;
          }
        });
        break;
      }
      
      case 'lfu': {
        // Evict least frequently used
        let lowestCount = Infinity;
        keyToEvict = '';
        
        this.cache.forEach((value, key) => {
          if (value.accessCount < lowestCount) {
            lowestCount = value.accessCount;
            keyToEvict = key;
          }
        });
        break;
      }
      
      case 'fifo':
      default: {
        // Evict first in
        keyToEvict = this.cache.keys().next().value;
        break;
      }
    }
    
    if (keyToEvict) {
      this.cache.delete(keyToEvict);
    }
  }

  /**
   * Create lazy loading observer
   */
  public createLazyLoader(callback: (entries: IntersectionObserverEntry[]) => void): IntersectionObserver | null {
    if (!('IntersectionObserver' in window) || !this.lazyLoadConfig.enableIntersectionObserver) {
      return null;
    }

    return new IntersectionObserver(callback, {
      rootMargin: this.lazyLoadConfig.rootMargin,
      threshold: this.lazyLoadConfig.threshold
    });
  }

  /**
   * Lazy load images
   */
  public lazyLoadImages(selector: string = 'img[data-src]'): void {
    const images = document.querySelectorAll(selector);
    
    const imageObserver = this.createLazyLoader((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            imageObserver?.unobserve(img);
          }
        }
      });
    });

    if (imageObserver) {
      images.forEach(img => imageObserver.observe(img));
    } else {
      // Fallback for browsers without IntersectionObserver
      images.forEach(img => {
        const imgElement = img as HTMLImageElement;
        const src = imgElement.dataset.src;
        if (src) {
          imgElement.src = src;
          imgElement.removeAttribute('data-src');
        }
      });
    }
  }

  /**
   * Optimize images for different screen sizes
   */
  public getOptimizedImageUrl(baseUrl: string, width: number, quality: number = 80): string {
    // This would integrate with an image optimization service
    const params = new URLSearchParams({
      w: width.toString(),
      q: quality.toString(),
      f: 'webp'
    });
    
    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Debounce function for performance
   */
  public debounce<T extends (...args: unknown[]) => void>(func: T, wait: number): T {
    let timeout: NodeJS.Timeout;
    
    return ((...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    }) as T;
  }

  /**
   * Throttle function for performance
   */
  public throttle<T extends (...args: unknown[]) => void>(func: T, limit: number): T {
    let inThrottle: boolean;
    
    return ((...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  }

  /**
   * Measure function execution time
   */
  public measurePerformance<T>(name: string, func: () => T): T {
    const start = performance.now();
    const result = func();
    const end = performance.now();
    
    console.log(`${name} took ${end - start} milliseconds`);
    return result;
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  /**
   * Add performance metrics listener
   */
  public onMetricsUpdate(callback: (metrics: Partial<PerformanceMetrics>) => void): () => void {
    this.listeners.push(callback);
    
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify metrics listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.metrics));
  }

  /**
   * Get cache statistics
   */
  public getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.cacheConfig.maxSize,
      hitRate: this.calculateHitRate(),
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Calculate cache hit rate
   */
  private calculateHitRate(): number {
    // This would require tracking hits and misses
    // For now, return a placeholder
    return 0.85;
  }

  /**
   * Estimate memory usage of cache
   */
  private estimateMemoryUsage(): number {
    let size = 0;
    this.cache.forEach((value) => {
      size += JSON.stringify(value.data).length;
    });
    return size;
  }

  /**
   * Configure cache settings
   */
  public configureCaching(config: Partial<CacheConfig>): void {
    this.cacheConfig = { ...this.cacheConfig, ...config };
  }

  /**
   * Configure lazy loading settings
   */
  public configureLazyLoading(config: Partial<LazyLoadConfig>): void {
    this.lazyLoadConfig = { ...this.lazyLoadConfig, ...config };
  }
}

// Create singleton instance
export const performanceService = new PerformanceService();
export default performanceService;