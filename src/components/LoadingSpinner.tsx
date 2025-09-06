import React from 'react';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

type LoadingState = 'loading' | 'success' | 'error' | 'idle';

interface LoadingSpinnerProps {
  state?: LoadingState;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  className?: string;
  showMessage?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  state = 'loading',
  size = 'md',
  message,
  className = '',
  showMessage = true,
}) => {
  const renderIcon = () => {
    switch (state) {
      case 'loading':
        return (
          <Loader2 
            className={`${sizeClasses[size]} animate-spin text-blue-600 dark:text-blue-400`} 
          />
        );
      case 'success':
        return (
          <CheckCircle2 
            className={`${sizeClasses[size]} text-green-600 dark:text-green-400`} 
          />
        );
      case 'error':
        return (
          <AlertCircle 
            className={`${sizeClasses[size]} text-red-600 dark:text-red-400`} 
          />
        );
      default:
        return null;
    }
  };

  const getDefaultMessage = () => {
    switch (state) {
      case 'loading':
        return 'Loading...';
      case 'success':
        return 'Success!';
      case 'error':
        return 'Something went wrong';
      default:
        return '';
    }
  };

  if (state === 'idle') {
    return null;
  }

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      {renderIcon()}
      {showMessage && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {message || getDefaultMessage()}
        </span>
      )}
    </div>
  );
};

export default LoadingSpinner;
export { LoadingSpinner };

// Full page loading overlay
export const LoadingOverlay: React.FC<{
  isVisible: boolean;
  message?: string;
}> = ({ isVisible, message = 'Loading...' }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col items-center space-y-4">
        <LoadingSpinner size="lg" message={message} />
      </div>
    </div>
  );
};

// Skeleton loader for content
export const SkeletonLoader: React.FC<{
  lines?: number;
  className?: string;
}> = ({ lines = 3, className = '' }) => {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`h-4 bg-gray-200 dark:bg-gray-700 rounded ${
            index === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
};