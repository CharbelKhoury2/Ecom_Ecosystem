import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { debugTheme, refreshTheme } from '../utils/themeUtils';

const ThemeDebugger: React.FC = () => {
  const { theme, isDark, toggleTheme, systemTheme } = useTheme();

  const handleTestTheme = () => {
    debugTheme();
  };

  const handleRefreshTheme = () => {
    refreshTheme();
    console.log('Theme refreshed');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="text-sm space-y-2">
        <div>Theme: {theme}</div>
        <div>Is Dark: {isDark ? 'Yes' : 'No'}</div>
        <div>System Theme: {systemTheme ? 'Yes' : 'No'}</div>
        <div>HTML Class: {document.documentElement.classList.contains('dark') ? 'dark' : 'light'}</div>
        <div className="space-x-2 space-y-1">
          <button
            onClick={toggleTheme}
            className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
          >
            Toggle Theme
          </button>
          <button
            onClick={handleTestTheme}
            className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
          >
            Debug
          </button>
          <button
            onClick={handleRefreshTheme}
            className="px-3 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeDebugger;