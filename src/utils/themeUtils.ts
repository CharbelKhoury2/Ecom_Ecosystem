// Theme persistence utilities
export type Theme = 'light' | 'dark' | 'system';

/**
 * Initialize theme on page load to prevent FOUC
 */
export const initializeTheme = (): void => {
  try {
    const theme = (localStorage.getItem('theme') as Theme) || 'system';
    applyTheme(theme);
  } catch (error) {
    console.warn('Failed to initialize theme:', error);
    applyTheme('system');
  }
};

/**
 * Apply theme to document
 */
export const applyTheme = (theme: Theme): void => {
  const root = document.documentElement;
  const isDark = getIsDark(theme);
  
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  
  // Update meta theme-color for mobile browsers
  updateMetaThemeColor(isDark);
  
  // Save to localStorage
  try {
    localStorage.setItem('theme', theme);
  } catch (error) {
    console.warn('Failed to save theme to localStorage:', error);
  }
};

/**
 * Get whether theme should be dark
 */
export const getIsDark = (theme: Theme): boolean => {
  if (theme === 'dark') {
    return true;
  } else if (theme === 'light') {
    return false;
  } else {
    // system theme
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
};

/**
 * Update meta theme-color for mobile browsers
 */
export const updateMetaThemeColor = (isDark: boolean): void => {
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', isDark ? '#1f2937' : '#3b82f6');
  }
};

/**
 * Get current theme from localStorage
 */
export const getStoredTheme = (): Theme => {
  try {
    return (localStorage.getItem('theme') as Theme) || 'system';
  } catch (error) {
    console.warn('Failed to get theme from localStorage:', error);
    return 'system';
  }
};

/**
 * Toggle between light and dark themes
 */
export const toggleTheme = (currentTheme: Theme): Theme => {
  if (currentTheme === 'light') {
    return 'dark';
  } else if (currentTheme === 'dark') {
    return 'light';
  } else {
    // If system, toggle to opposite of current system preference
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return systemPrefersDark ? 'light' : 'dark';
  }
};

/**
 * Listen for system theme changes
 */
export const watchSystemTheme = (callback: () => void): (() => void) => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleChange = () => callback();
  
  mediaQuery.addEventListener('change', handleChange);
  
  // Return cleanup function
  return () => mediaQuery.removeEventListener('change', handleChange);
};

/**
 * Force theme refresh
 */
export const refreshTheme = (): void => {
  const currentTheme = getStoredTheme();
  applyTheme(currentTheme);
};

/**
 * Debug theme state
 */
export const debugTheme = (): void => {
  const theme = getStoredTheme();
  const isDark = getIsDark(theme);
  const hasClass = document.documentElement.classList.contains('dark');
  
  console.log('Theme Debug Info:', {
    storedTheme: theme,
    calculatedIsDark: isDark,
    htmlHasDarkClass: hasClass,
    systemPrefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
    localStorage: localStorage.getItem('theme'),
    timestamp: new Date().toISOString()
  });
};

// Auto-initialize theme when module loads
if (typeof window !== 'undefined') {
  // Add a small delay to ensure DOM is ready
  setTimeout(initializeTheme, 0);
}