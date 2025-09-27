import React, { createContext, useContext, useEffect, useState } from 'react';
import { applyTheme, getIsDark, getStoredTheme, watchSystemTheme, toggleTheme as utilToggleTheme } from '../utils/themeUtils';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  toggleTheme: () => void;
  systemTheme: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system';
    return getStoredTheme();
  });

  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return getIsDark(getStoredTheme());
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updateTheme = () => {
      const shouldBeDark = getIsDark(theme);
      setIsDark(shouldBeDark);
      applyTheme(theme);
    };

    updateTheme();

    // Listen for system theme changes
    const cleanup = watchSystemTheme(() => {
      if (theme === 'system') {
        updateTheme();
      }
    });

    return cleanup;
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = utilToggleTheme(theme);
    setTheme(newTheme);
  };

  const systemTheme = theme === 'system';

  const value = {
    theme,
    setTheme,
    isDark,
    toggleTheme,
    systemTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};