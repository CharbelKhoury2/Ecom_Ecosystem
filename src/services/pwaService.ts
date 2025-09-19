/**
 * PWA Service
 * Handles Progressive Web App functionality including service worker registration,
 * offline detection, push notifications, and app installation
 */

export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: unknown;
  actions?: {
    action: string;
    title: string;
    icon?: string;
  }[];
}

export interface PWAUpdateInfo {
  available: boolean;
  waiting: ServiceWorker | null;
}

class PWAService {
  private registration: ServiceWorkerRegistration | null = null;
  private installPrompt: PWAInstallPrompt | null = null;
  private updateAvailable = false;
  private waitingWorker: ServiceWorker | null = null;
  
  // Event listeners
  private onlineListeners: (() => void)[] = [];
  private offlineListeners: (() => void)[] = [];
  private updateListeners: ((info: PWAUpdateInfo) => void)[] = [];
  private installListeners: ((canInstall: boolean) => void)[] = [];

  constructor() {
    this.init();
  }

  /**
   * Initialize PWA service
   */
  private async init() {
    if (typeof window === 'undefined') return;

    // Register service worker
    await this.registerServiceWorker();

    // Setup offline/online detection
    this.setupNetworkDetection();

    // Setup install prompt handling
    this.setupInstallPrompt();

    // Setup notification permission
    this.setupNotifications();

    // Add manifest link if not present
    this.ensureManifestLink();
  }

  /**
   * Register service worker
   */
  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered successfully');

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New update available
              this.updateAvailable = true;
              this.waitingWorker = newWorker;
              this.notifyUpdateListeners();
            }
          });
        }
      });

      // Handle controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  /**
   * Setup network detection
   */
  private setupNetworkDetection(): void {
    window.addEventListener('online', () => {
      console.log('App is online');
      this.onlineListeners.forEach(listener => listener());
    });

    window.addEventListener('offline', () => {
      console.log('App is offline');
      this.offlineListeners.forEach(listener => listener());
    });
  }

  /**
   * Setup install prompt handling
   */
  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPrompt = e as unknown as PWAInstallPrompt;
      this.notifyInstallListeners(true);
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.installPrompt = null;
      this.notifyInstallListeners(false);
    });
  }

  /**
   * Setup notifications
   */
  private setupNotifications(): void {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      // Request permission if not already granted
      if (Notification.permission === 'default') {
        this.requestNotificationPermission();
      }
    }
  }

  /**
   * Ensure manifest link is present
   */
  private ensureManifestLink(): void {
    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = '/manifest.json';
      document.head.appendChild(link);
    }
  }

  /**
   * Check if app is online
   */
  public isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Check if app is offline
   */
  public isOffline(): boolean {
    return !navigator.onLine;
  }

  /**
   * Check if PWA can be installed
   */
  public canInstall(): boolean {
    return this.installPrompt !== null;
  }

  /**
   * Check if update is available
   */
  public isUpdateAvailable(): boolean {
    return this.updateAvailable;
  }

  /**
   * Install PWA
   */
  public async installApp(): Promise<boolean> {
    if (!this.installPrompt) {
      console.warn('Install prompt not available');
      return false;
    }

    try {
      await this.installPrompt.prompt();
      const choiceResult = await this.installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        this.installPrompt = null;
        return true;
      } else {
        console.log('User dismissed the install prompt');
        return false;
      }
    } catch (error) {
      console.error('Error during app installation:', error);
      return false;
    }
  }

  /**
   * Apply pending update
   */
  public async applyUpdate(): Promise<void> {
    if (!this.waitingWorker) {
      console.warn('No waiting worker available');
      return;
    }

    this.waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  }

  /**
   * Request notification permission
   */
  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
  }

  /**
   * Show notification
   */
  public async showNotification(options: NotificationOptions): Promise<void> {
    if (!this.registration) {
      console.warn('Service Worker not registered');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      await this.registration.showNotification(options.title, {
        body: options.body,
        icon: options.icon || '/icons/icon-192x192.png',
        badge: options.badge || '/icons/badge-72x72.png',
        tag: options.tag,
        data: options.data,
        actions: options.actions,
        vibrate: [100, 50, 100],
        requireInteraction: false
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  /**
   * Cache URLs for offline access
   */
  public async cacheUrls(urls: string[]): Promise<void> {
    if (!this.registration || !this.registration.active) {
      console.warn('Service Worker not active');
      return;
    }

    this.registration.active.postMessage({
      type: 'CACHE_URLS',
      urls
    });
  }

  /**
   * Clear all caches
   */
  public async clearCaches(): Promise<void> {
    if (!('caches' in window)) {
      console.warn('Cache API not supported');
      return;
    }

    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('All caches cleared');
    } catch (error) {
      console.error('Error clearing caches:', error);
    }
  }

  /**
   * Get cache size
   */
  public async getCacheSize(): Promise<number> {
    if (!('caches' in window)) {
      return 0;
    }

    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        for (const request of requests) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            totalSize += blob.size;
          }
        }
      }

      return totalSize;
    } catch (error) {
      console.error('Error calculating cache size:', error);
      return 0;
    }
  }

  /**
   * Add online listener
   */
  public onOnline(callback: () => void): () => void {
    this.onlineListeners.push(callback);
    return () => {
      const index = this.onlineListeners.indexOf(callback);
      if (index > -1) {
        this.onlineListeners.splice(index, 1);
      }
    };
  }

  /**
   * Add offline listener
   */
  public onOffline(callback: () => void): () => void {
    this.offlineListeners.push(callback);
    return () => {
      const index = this.offlineListeners.indexOf(callback);
      if (index > -1) {
        this.offlineListeners.splice(index, 1);
      }
    };
  }

  /**
   * Add update listener
   */
  public onUpdate(callback: (info: PWAUpdateInfo) => void): () => void {
    this.updateListeners.push(callback);
    return () => {
      const index = this.updateListeners.indexOf(callback);
      if (index > -1) {
        this.updateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Add install listener
   */
  public onInstallPrompt(callback: (canInstall: boolean) => void): () => void {
    this.installListeners.push(callback);
    return () => {
      const index = this.installListeners.indexOf(callback);
      if (index > -1) {
        this.installListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify update listeners
   */
  private notifyUpdateListeners(): void {
    const info: PWAUpdateInfo = {
      available: this.updateAvailable,
      waiting: this.waitingWorker
    };
    this.updateListeners.forEach(listener => listener(info));
  }

  /**
   * Notify install listeners
   */
  private notifyInstallListeners(canInstall: boolean): void {
    this.installListeners.forEach(listener => listener(canInstall));
  }

  /**
   * Get PWA info
   */
  public getInfo() {
    return {
      isOnline: this.isOnline(),
      canInstall: this.canInstall(),
      updateAvailable: this.isUpdateAvailable(),
      notificationPermission: 'Notification' in window ? Notification.permission : 'unsupported',
      serviceWorkerSupported: 'serviceWorker' in navigator,
      cacheSupported: 'caches' in window
    };
  }
}

// Create singleton instance
export const pwaService = new PWAService();
export default pwaService;