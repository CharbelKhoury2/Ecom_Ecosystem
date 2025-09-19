/**
 * User Experience Enhancement Service
 * Handles PWA capabilities, accessibility, theming, keyboard shortcuts, and internationalization
 */

import { supabase } from '../lib/supabase';

// PWA Interfaces
export interface PWAConfig {
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
  orientation: 'portrait' | 'landscape' | 'any';
  startUrl: string;
  scope: string;
  icons: PWAIcon[];
}

export interface PWAIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: 'any' | 'maskable' | 'monochrome';
}

export interface InstallPrompt {
  isAvailable: boolean;
  isInstalled: boolean;
  canPrompt: boolean;
  lastPrompted?: number;
  installCount: number;
}

export interface OfflineCapability {
  isOnline: boolean;
  lastOnline: number;
  pendingSync: number;
  cachedPages: string[];
  cacheSize: number;
}

// Accessibility Interfaces
export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusIndicators: boolean;
  colorBlindSupport: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
}

export interface AccessibilityAudit {
  id: string;
  timestamp: number;
  url: string;
  issues: AccessibilityIssue[];
  score: number;
  level: 'A' | 'AA' | 'AAA';
}

export interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  rule: string;
  description: string;
  element: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  suggestion: string;
}

// Theme Interfaces
export interface ThemeConfig {
  id: string;
  name: string;
  type: 'light' | 'dark' | 'auto';
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  fonts: {
    primary: string;
    secondary: string;
    monospace: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
  accessibility: AccessibilitySettings;
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
    sound: boolean;
  };
  dashboard: {
    layout: 'grid' | 'list';
    density: 'compact' | 'comfortable' | 'spacious';
    widgets: string[];
  };
}

// Keyboard Shortcuts Interfaces
export interface KeyboardShortcut {
  id: string;
  key: string;
  modifiers: ('ctrl' | 'alt' | 'shift' | 'meta')[];
  action: string;
  description: string;
  category: string;
  isGlobal: boolean;
  isEnabled: boolean;
}

export interface ShortcutCategory {
  id: string;
  name: string;
  description: string;
  shortcuts: KeyboardShortcut[];
}

// Internationalization Interfaces
export interface Language {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  isEnabled: boolean;
  completeness: number; // 0-1
}

export interface Translation {
  key: string;
  value: string;
  language: string;
  namespace: string;
  context?: string;
  pluralForm?: number;
}

export interface LocalizationConfig {
  defaultLanguage: string;
  fallbackLanguage: string;
  supportedLanguages: string[];
  dateFormats: Record<string, string>;
  numberFormats: Record<string, Intl.NumberFormatOptions>;
  currencyFormats: Record<string, Intl.NumberFormatOptions>;
}

class UXService {
  private pwaConfig: PWAConfig;
  private installPrompt: InstallPrompt;
  private offlineCapability: OfflineCapability;
  private accessibilitySettings: AccessibilitySettings;
  private currentTheme: ThemeConfig;
  private userPreferences: UserPreferences;
  private keyboardShortcuts: Map<string, KeyboardShortcut> = new Map();
  private translations: Map<string, Map<string, string>> = new Map();
  private currentLanguage: string = 'en';
  private serviceWorker: ServiceWorker | null = null;

  constructor() {
    this.initializePWA();
    this.initializeAccessibility();
    this.initializeThemes();
    this.initializeKeyboardShortcuts();
    this.initializeInternationalization();
    this.loadUserPreferences();
    this.setupEventListeners();
  }

  private initializePWA() {
    this.pwaConfig = {
      name: 'Ecom Ecosystem',
      shortName: 'EcomEco',
      description: 'Advanced E-commerce Management Platform',
      themeColor: '#3B82F6',
      backgroundColor: '#FFFFFF',
      display: 'standalone',
      orientation: 'any',
      startUrl: '/',
      scope: '/',
      icons: [
        {
          src: '/icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/icons/icon-maskable-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable'
        }
      ]
    };

    this.installPrompt = {
      isAvailable: false,
      isInstalled: false,
      canPrompt: false,
      installCount: 0
    };

    this.offlineCapability = {
      isOnline: navigator.onLine,
      lastOnline: Date.now(),
      pendingSync: 0,
      cachedPages: [],
      cacheSize: 0
    };

    this.registerServiceWorker();
    this.setupPWAEventListeners();
  }

  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        this.serviceWorker = registration.active;
        
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                this.notifyUpdate();
              }
            });
          }
        });
        
        console.log('Service Worker registered successfully');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  private setupPWAEventListeners() {
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPrompt.isAvailable = true;
      this.installPrompt.canPrompt = true;
      (window as any).deferredPrompt = e;
    });

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      this.installPrompt.isInstalled = true;
      this.installPrompt.installCount++;
      console.log('PWA was installed');
    });

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.offlineCapability.isOnline = true;
      this.offlineCapability.lastOnline = Date.now();
      this.syncOfflineData();
    });

    window.addEventListener('offline', () => {
      this.offlineCapability.isOnline = false;
    });
  }

  private initializeAccessibility() {
    this.accessibilitySettings = {
      highContrast: false,
      largeText: false,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      screenReader: false,
      keyboardNavigation: true,
      focusIndicators: true,
      colorBlindSupport: 'none',
      fontSize: 'medium'
    };

    this.detectAccessibilityPreferences();
  }

  private detectAccessibilityPreferences() {
    // Detect system preferences
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      this.accessibilitySettings.highContrast = true;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.accessibilitySettings.reducedMotion = true;
    }

    // Detect screen reader
    if (navigator.userAgent.includes('NVDA') || navigator.userAgent.includes('JAWS')) {
      this.accessibilitySettings.screenReader = true;
    }
  }

  private initializeThemes() {
    const lightTheme: ThemeConfig = {
      id: 'light',
      name: 'Light Theme',
      type: 'light',
      colors: {
        primary: '#3B82F6',
        secondary: '#6B7280',
        background: '#FFFFFF',
        surface: '#F9FAFB',
        text: '#111827',
        textSecondary: '#6B7280',
        border: '#E5E7EB',
        accent: '#10B981',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6'
      },
      fonts: {
        primary: 'Inter, system-ui, sans-serif',
        secondary: 'Inter, system-ui, sans-serif',
        monospace: 'JetBrains Mono, Consolas, monospace'
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem'
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        full: '9999px'
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }
    };

    const darkTheme: ThemeConfig = {
      ...lightTheme,
      id: 'dark',
      name: 'Dark Theme',
      type: 'dark',
      colors: {
        primary: '#60A5FA',
        secondary: '#9CA3AF',
        background: '#111827',
        surface: '#1F2937',
        text: '#F9FAFB',
        textSecondary: '#9CA3AF',
        border: '#374151',
        accent: '#34D399',
        success: '#34D399',
        warning: '#FBBF24',
        error: '#F87171',
        info: '#60A5FA'
      }
    };

    // Detect system theme preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.currentTheme = prefersDark ? darkTheme : lightTheme;
  }

  private initializeKeyboardShortcuts() {
    const shortcuts: KeyboardShortcut[] = [
      {
        id: 'search',
        key: 'k',
        modifiers: ['ctrl'],
        action: 'openSearch',
        description: 'Open search',
        category: 'navigation',
        isGlobal: true,
        isEnabled: true
      },
      {
        id: 'dashboard',
        key: 'd',
        modifiers: ['ctrl', 'shift'],
        action: 'goToDashboard',
        description: 'Go to dashboard',
        category: 'navigation',
        isGlobal: true,
        isEnabled: true
      },
      {
        id: 'settings',
        key: ',',
        modifiers: ['ctrl'],
        action: 'openSettings',
        description: 'Open settings',
        category: 'navigation',
        isGlobal: true,
        isEnabled: true
      },
      {
        id: 'help',
        key: '?',
        modifiers: ['shift'],
        action: 'showHelp',
        description: 'Show help',
        category: 'help',
        isGlobal: true,
        isEnabled: true
      },
      {
        id: 'newOrder',
        key: 'n',
        modifiers: ['ctrl', 'shift'],
        action: 'createNewOrder',
        description: 'Create new order',
        category: 'actions',
        isGlobal: true,
        isEnabled: true
      },
      {
        id: 'save',
        key: 's',
        modifiers: ['ctrl'],
        action: 'save',
        description: 'Save current form',
        category: 'actions',
        isGlobal: false,
        isEnabled: true
      }
    ];

    shortcuts.forEach(shortcut => {
      this.keyboardShortcuts.set(shortcut.id, shortcut);
    });

    this.setupKeyboardEventListeners();
  }

  private setupKeyboardEventListeners() {
    document.addEventListener('keydown', (event) => {
      this.handleKeyboardShortcut(event);
    });
  }

  private handleKeyboardShortcut(event: KeyboardEvent) {
    const pressedKey = event.key.toLowerCase();
    const modifiers: string[] = [];
    
    if (event.ctrlKey) modifiers.push('ctrl');
    if (event.altKey) modifiers.push('alt');
    if (event.shiftKey) modifiers.push('shift');
    if (event.metaKey) modifiers.push('meta');

    for (const shortcut of this.keyboardShortcuts.values()) {
      if (!shortcut.isEnabled) continue;
      
      const keyMatches = shortcut.key.toLowerCase() === pressedKey;
      const modifiersMatch = this.arraysEqual(
        shortcut.modifiers.sort(),
        modifiers.sort()
      );

      if (keyMatches && modifiersMatch) {
        event.preventDefault();
        this.executeShortcutAction(shortcut.action);
        break;
      }
    }
  }

  private arraysEqual(a: string[], b: string[]): boolean {
    return a.length === b.length && a.every((val, i) => val === b[i]);
  }

  private executeShortcutAction(action: string) {
    switch (action) {
      case 'openSearch':
        this.triggerSearch();
        break;
      case 'goToDashboard':
        window.location.href = '/dashboard';
        break;
      case 'openSettings':
        window.location.href = '/settings';
        break;
      case 'showHelp':
        this.showHelpModal();
        break;
      case 'createNewOrder':
        window.location.href = '/orders/new';
        break;
      case 'save':
        this.triggerSave();
        break;
      default:
        console.log(`Unknown shortcut action: ${action}`);
    }
  }

  private initializeInternationalization() {
    // Load default translations
    const enTranslations = new Map([
      ['common.save', 'Save'],
      ['common.cancel', 'Cancel'],
      ['common.delete', 'Delete'],
      ['common.edit', 'Edit'],
      ['common.loading', 'Loading...'],
      ['nav.dashboard', 'Dashboard'],
      ['nav.orders', 'Orders'],
      ['nav.products', 'Products'],
      ['nav.customers', 'Customers'],
      ['nav.analytics', 'Analytics'],
      ['nav.settings', 'Settings']
    ]);

    const esTranslations = new Map([
      ['common.save', 'Guardar'],
      ['common.cancel', 'Cancelar'],
      ['common.delete', 'Eliminar'],
      ['common.edit', 'Editar'],
      ['common.loading', 'Cargando...'],
      ['nav.dashboard', 'Panel'],
      ['nav.orders', 'Pedidos'],
      ['nav.products', 'Productos'],
      ['nav.customers', 'Clientes'],
      ['nav.analytics', 'Analíticas'],
      ['nav.settings', 'Configuración']
    ]);

    this.translations.set('en', enTranslations);
    this.translations.set('es', esTranslations);
  }

  private async loadUserPreferences() {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.user.id)
          .single();

        if (preferences) {
          this.userPreferences = preferences.settings;
          this.applyUserPreferences();
        }
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error);
    }

    // Set default preferences if none exist
    if (!this.userPreferences) {
      this.userPreferences = {
        theme: 'auto',
        language: 'en',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        dateFormat: 'MM/dd/yyyy',
        numberFormat: 'en-US',
        accessibility: this.accessibilitySettings,
        notifications: {
          email: true,
          push: true,
          desktop: false,
          sound: true
        },
        dashboard: {
          layout: 'grid',
          density: 'comfortable',
          widgets: ['revenue', 'orders', 'customers', 'inventory']
        }
      };
    }
  }

  private applyUserPreferences() {
    // Apply theme
    this.setTheme(this.userPreferences.theme);
    
    // Apply language
    this.setLanguage(this.userPreferences.language);
    
    // Apply accessibility settings
    this.applyAccessibilitySettings(this.userPreferences.accessibility);
  }

  private setupEventListeners() {
    // Listen for theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (this.userPreferences.theme === 'auto') {
        this.setTheme('auto');
      }
    });

    // Listen for reduced motion changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.accessibilitySettings.reducedMotion = e.matches;
      this.applyAccessibilitySettings(this.accessibilitySettings);
    });
  }

  // PWA Methods
  async promptInstall(): Promise<boolean> {
    if (!this.installPrompt.canPrompt) return false;

    const deferredPrompt = (window as any).deferredPrompt;
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    this.installPrompt.canPrompt = false;
    this.installPrompt.lastPrompted = Date.now();
    
    if (outcome === 'accepted') {
      this.installPrompt.installCount++;
      return true;
    }
    
    return false;
  }

  generateManifest(): string {
    return JSON.stringify({
      name: this.pwaConfig.name,
      short_name: this.pwaConfig.shortName,
      description: this.pwaConfig.description,
      theme_color: this.pwaConfig.themeColor,
      background_color: this.pwaConfig.backgroundColor,
      display: this.pwaConfig.display,
      orientation: this.pwaConfig.orientation,
      start_url: this.pwaConfig.startUrl,
      scope: this.pwaConfig.scope,
      icons: this.pwaConfig.icons
    }, null, 2);
  }

  private notifyUpdate() {
    // Show update notification
    console.log('New version available');
    // In a real app, this would show a toast or modal
  }

  private async syncOfflineData() {
    if (this.offlineCapability.pendingSync > 0) {
      console.log(`Syncing ${this.offlineCapability.pendingSync} pending operations`);
      // Implement offline sync logic
      this.offlineCapability.pendingSync = 0;
    }
  }

  // Accessibility Methods
  async runAccessibilityAudit(url: string): Promise<AccessibilityAudit> {
    // Mock accessibility audit - in production, use tools like axe-core
    const issues: AccessibilityIssue[] = [
      {
        type: 'error',
        rule: 'color-contrast',
        description: 'Text has insufficient color contrast',
        element: 'button.secondary',
        impact: 'serious',
        suggestion: 'Increase contrast ratio to at least 4.5:1'
      },
      {
        type: 'warning',
        rule: 'alt-text',
        description: 'Image missing alternative text',
        element: 'img.product-image',
        impact: 'moderate',
        suggestion: 'Add descriptive alt text for screen readers'
      }
    ];

    const audit: AccessibilityAudit = {
      id: `audit_${Date.now()}`,
      timestamp: Date.now(),
      url,
      issues,
      score: 0.85,
      level: 'AA'
    };

    return audit;
  }

  updateAccessibilitySettings(settings: Partial<AccessibilitySettings>) {
    Object.assign(this.accessibilitySettings, settings);
    this.applyAccessibilitySettings(this.accessibilitySettings);
    this.saveUserPreferences();
  }

  private applyAccessibilitySettings(settings: AccessibilitySettings) {
    const root = document.documentElement;
    
    // Apply high contrast
    root.classList.toggle('high-contrast', settings.highContrast);
    
    // Apply large text
    root.classList.toggle('large-text', settings.largeText);
    
    // Apply reduced motion
    root.classList.toggle('reduced-motion', settings.reducedMotion);
    
    // Apply font size
    root.setAttribute('data-font-size', settings.fontSize);
    
    // Apply color blind support
    root.setAttribute('data-color-blind', settings.colorBlindSupport);
  }

  // Theme Methods
  setTheme(theme: 'light' | 'dark' | 'auto') {
    let actualTheme: 'light' | 'dark';
    
    if (theme === 'auto') {
      actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      actualTheme = theme;
    }
    
    document.documentElement.setAttribute('data-theme', actualTheme);
    
    // Update PWA theme color
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', 
        actualTheme === 'dark' ? '#111827' : '#FFFFFF'
      );
    }
    
    this.userPreferences.theme = theme;
    this.saveUserPreferences();
  }

  // Keyboard Shortcuts Methods
  getShortcutCategories(): ShortcutCategory[] {
    const categories = new Map<string, ShortcutCategory>();
    
    for (const shortcut of this.keyboardShortcuts.values()) {
      if (!categories.has(shortcut.category)) {
        categories.set(shortcut.category, {
          id: shortcut.category,
          name: this.capitalize(shortcut.category),
          description: `${this.capitalize(shortcut.category)} shortcuts`,
          shortcuts: []
        });
      }
      
      categories.get(shortcut.category)!.shortcuts.push(shortcut);
    }
    
    return Array.from(categories.values());
  }

  updateShortcut(id: string, updates: Partial<KeyboardShortcut>) {
    const shortcut = this.keyboardShortcuts.get(id);
    if (shortcut) {
      Object.assign(shortcut, updates);
    }
  }

  private triggerSearch() {
    const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  }

  private showHelpModal() {
    // Show keyboard shortcuts help modal
    console.log('Showing help modal');
  }

  private triggerSave() {
    const saveButton = document.querySelector('[data-save-button]') as HTMLButtonElement;
    if (saveButton) {
      saveButton.click();
    }
  }

  // Internationalization Methods
  setLanguage(languageCode: string) {
    this.currentLanguage = languageCode;
    document.documentElement.setAttribute('lang', languageCode);
    
    // Update direction for RTL languages
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    const direction = rtlLanguages.includes(languageCode) ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', direction);
    
    this.userPreferences.language = languageCode;
    this.saveUserPreferences();
  }

  translate(key: string, params?: Record<string, string>): string {
    const languageTranslations = this.translations.get(this.currentLanguage);
    let translation = languageTranslations?.get(key);
    
    // Fallback to English if translation not found
    if (!translation) {
      const englishTranslations = this.translations.get('en');
      translation = englishTranslations?.get(key) || key;
    }
    
    // Replace parameters
    if (params && translation) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation!.replace(`{{${param}}}`, value);
      });
    }
    
    return translation;
  }

  formatDate(date: Date, format?: string): string {
    const locale = this.userPreferences.language;
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    
    return new Intl.DateTimeFormat(locale, options).format(date);
  }

  formatNumber(number: number, options?: Intl.NumberFormatOptions): string {
    const locale = this.userPreferences.language;
    return new Intl.NumberFormat(locale, options).format(number);
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    const locale = this.userPreferences.language;
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency
    }).format(amount);
  }

  // Utility Methods
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private async saveUserPreferences() {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.user.id,
            settings: this.userPreferences,
            updated_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  }

  // Public API Methods
  getPWAStatus(): InstallPrompt {
    return { ...this.installPrompt };
  }

  getOfflineStatus(): OfflineCapability {
    return { ...this.offlineCapability };
  }

  getAccessibilitySettings(): AccessibilitySettings {
    return { ...this.accessibilitySettings };
  }

  getCurrentTheme(): ThemeConfig {
    return { ...this.currentTheme };
  }

  getUserPreferences(): UserPreferences {
    return { ...this.userPreferences };
  }

  getSupportedLanguages(): Language[] {
    return [
      {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        direction: 'ltr',
        isEnabled: true,
        completeness: 1.0
      },
      {
        code: 'es',
        name: 'Spanish',
        nativeName: 'Español',
        direction: 'ltr',
        isEnabled: true,
        completeness: 0.95
      },
      {
        code: 'fr',
        name: 'French',
        nativeName: 'Français',
        direction: 'ltr',
        isEnabled: false,
        completeness: 0.7
      },
      {
        code: 'de',
        name: 'German',
        nativeName: 'Deutsch',
        direction: 'ltr',
        isEnabled: false,
        completeness: 0.6
      }
    ];
  }

  getCurrentLanguage(): string {
    return this.currentLanguage;
  }
}

export const uxService = new UXService();
export default uxService;