import React from 'react';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

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
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 
              className={`${sizeClasses[size]} text-blue-600 dark:text-blue-400`} 
            />
          </motion.div>
        );
      case 'success':
        return (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, ease: 'backOut' }}
          >
            <CheckCircle2 
              className={`${sizeClasses[size]} text-green-600 dark:text-green-400`} 
            />
          </motion.div>
        );
      case 'error':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.5 }}
          >
            <AlertCircle 
              className={`${sizeClasses[size]} text-red-600 dark:text-red-400`} 
            />
          </motion.div>
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
    <motion.div 
      className={`flex items-center justify-center space-x-2 ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {renderIcon()}
      {showMessage && (
        <motion.span 
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {message || getDefaultMessage()}
        </motion.span>
      )}
    </motion.div>
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
interface SkeletonLoaderProps {
  lines?: number;
  className?: string;
  width?: 'full' | 'half' | 'quarter' | 'three-quarters';
  height?: 'auto' | 'medium' | 'tall';
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  lines = 3, 
  className = '',
  width = 'full',
  height = 'auto'
}) => {
  const widthClass = width === 'full' ? 'w-full' : width === 'half' ? 'w-1/2' : width === 'quarter' ? 'w-1/4' : 'w-3/4';
  const heightClass = height === 'auto' ? 'h-4' : height === 'tall' ? 'h-8' : 'h-6';

  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <motion.div 
          key={index}
          className={`bg-gray-200 dark:bg-gray-700 rounded ${widthClass} ${heightClass} animate-shimmer`}
          style={{
            width: index === lines - 1 ? '75%' : '100%' // Last line is shorter
          }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
        />
      ))}
    </div>
  );
};

// Enhanced skeleton components
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <motion.div 
    className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
  >
    <div className="animate-shimmer space-y-4">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="w-24 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded-full" />
    </div>
  </motion.div>
);

export const SkeletonChart: React.FC<{ className?: string }> = ({ className = '' }) => (
  <motion.div 
    className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
  >
    <div className="animate-shimmer space-y-4">
      <div className="flex items-center justify-between">
        <div className="w-40 h-6 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  </motion.div>
);

export const SkeletonTable: React.FC<{ rows?: number; className?: string }> = ({ 
  rows = 5, 
  className = '' 
}) => (
  <motion.div 
    className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
  >
    <div className="animate-shimmer">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <motion.div 
          key={rowIndex}
          className="border-b border-gray-100 dark:border-gray-700 p-4"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: rowIndex * 0.05, duration: 0.2 }}
        >
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, colIndex) => (
              <div 
                key={colIndex} 
                className="h-4 bg-gray-200 dark:bg-gray-700 rounded"
                style={{ width: colIndex === 3 ? '60%' : '100%' }}
              />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  </motion.div>
);