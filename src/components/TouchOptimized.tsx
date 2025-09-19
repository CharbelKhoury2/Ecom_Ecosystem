/**
 * Touch-Optimized Components
 * Provides mobile-first components with touch gestures, haptic feedback, and accessibility
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { ChevronDown, ChevronUp, MoreHorizontal, X } from 'lucide-react';

// Touch-optimized Button
interface TouchButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  haptic?: boolean;
  className?: string;
}

export const TouchButton: React.FC<TouchButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  haptic = true,
  className = ''
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    if (disabled || loading) return;
    
    // Haptic feedback
    if (haptic && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    onClick?.();
  };

  const baseClasses = 'relative inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 select-none touch-manipulation';
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm min-h-[40px]',
    md: 'px-6 py-3 text-base min-h-[48px]',
    lg: 'px-8 py-4 text-lg min-h-[56px]'
  };
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-lg hover:shadow-xl',
    secondary: 'bg-slate-200 text-slate-900 hover:bg-slate-300 active:bg-slate-400 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-lg hover:shadow-xl',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800'
  };
  
  const disabledClasses = 'opacity-50 cursor-not-allowed';

  return (
    <motion.button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${disabled ? disabledClasses : ''} ${className}`}
      onClick={handleClick}
      disabled={disabled || loading}
      onTapStart={() => setIsPressed(true)}
      onTap={() => setIsPressed(false)}
      onTapCancel={() => setIsPressed(false)}
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.02 }}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </motion.button>
  );
};

// Swipeable Card
interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: {
    icon: React.ReactNode;
    label: string;
    color: string;
  };
  rightAction?: {
    icon: React.ReactNode;
    label: string;
    color: string;
  };
  className?: string;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  className = ''
}) => {
  const x = useMotionValue(0);
  const background = useTransform(
    x,
    [-150, -75, 0, 75, 150],
    ['#ef4444', '#f87171', '#ffffff', '#10b981', '#059669']
  );
  
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    
    if (info.offset.x > threshold && onSwipeRight) {
      onSwipeRight();
    } else if (info.offset.x < -threshold && onSwipeLeft) {
      onSwipeLeft();
    }
    
    x.set(0);
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Background Actions */}
      <div className="absolute inset-0 flex items-center justify-between px-6">
        {leftAction && (
          <div className="flex items-center gap-2 text-white">
            {leftAction.icon}
            <span className="font-medium">{leftAction.label}</span>
          </div>
        )}
        
        {rightAction && (
          <div className="flex items-center gap-2 text-white">
            {rightAction.icon}
            <span className="font-medium">{rightAction.label}</span>
          </div>
        )}
      </div>
      
      {/* Card Content */}
      <motion.div
        className={`relative bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 ${className}`}
        style={{ x, background }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
      >
        {children}
      </motion.div>
    </div>
  );
};

// Pull to Refresh
interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  refreshThreshold?: number;
  className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  refreshThreshold = 80,
  className = ''
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handlePanStart = () => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      // Only allow pull to refresh when at the top
    }
  };
  
  const handlePan = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (containerRef.current && containerRef.current.scrollTop === 0 && info.delta.y > 0) {
      setPullDistance(Math.min(info.offset.y, refreshThreshold * 1.5));
    }
  };
  
  const handlePanEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (pullDistance >= refreshThreshold && !isRefreshing) {
      setIsRefreshing(true);
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
  };
  
  const refreshProgress = Math.min(pullDistance / refreshThreshold, 1);
  
  return (
    <div className={`relative ${className}`}>
      {/* Pull to Refresh Indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 z-10"
        style={{
          height: pullDistance,
          opacity: refreshProgress
        }}
      >
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <motion.div
            animate={{
              rotate: isRefreshing ? 360 : refreshProgress * 180
            }}
            transition={{
              duration: isRefreshing ? 1 : 0,
              repeat: isRefreshing ? Infinity : 0,
              ease: 'linear'
            }}
          >
            <ChevronDown size={20} />
          </motion.div>
          <span className="text-sm font-medium">
            {isRefreshing ? 'Refreshing...' : pullDistance >= refreshThreshold ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      </motion.div>
      
      {/* Content */}
      <motion.div
        ref={containerRef}
        className="overflow-auto"
        style={{
          paddingTop: pullDistance
        }}
        onPanStart={handlePanStart}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
      >
        {children}
      </motion.div>
    </div>
  );
};

// Touch-optimized Modal
interface TouchModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
  position?: 'center' | 'bottom';
}

export const TouchModal: React.FC<TouchModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  position = 'center'
}) => {
  const y = useMotionValue(0);
  
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 100 && info.velocity.y > 500) {
      onClose();
    }
  };
  
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'max-w-full'
  };
  
  const positionClasses = {
    center: 'items-center justify-center',
    bottom: 'items-end justify-center'
  };
  
  if (!isOpen) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: position === 'bottom' ? 100 : 0 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: position === 'bottom' ? 100 : 0 }}
        drag={position === 'bottom' ? 'y' : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ y }}
        className={`w-full ${sizeClasses[size]} bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden ${position === 'bottom' ? 'rounded-b-none' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle for bottom modals */}
        {position === 'bottom' && (
          <div className="flex justify-center py-3">
            <div className="w-12 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
          </div>
        )}
        
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {title}
            </h2>
            <TouchButton
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="!p-2 !min-h-0"
            >
              <X size={20} />
            </TouchButton>
          </div>
        )}
        
        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Touch-optimized Accordion
interface TouchAccordionProps {
  items: {
    id: string;
    title: string;
    content: React.ReactNode;
    icon?: React.ReactNode;
  }[];
  allowMultiple?: boolean;
  className?: string;
}

export const TouchAccordion: React.FC<TouchAccordionProps> = ({
  items,
  allowMultiple = false,
  className = ''
}) => {
  const [openItems, setOpenItems] = useState<string[]>([]);
  
  const toggleItem = (itemId: string) => {
    setOpenItems(prev => {
      if (allowMultiple) {
        return prev.includes(itemId)
          ? prev.filter(id => id !== itemId)
          : [...prev, itemId];
      } else {
        return prev.includes(itemId) ? [] : [itemId];
      }
    });
  };
  
  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((item) => {
        const isOpen = openItems.includes(item.id);
        
        return (
          <div key={item.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <TouchButton
              variant="ghost"
              className="w-full !justify-between !rounded-none p-4 text-left"
              onClick={() => toggleItem(item.id)}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span className="font-medium">{item.title}</span>
              </div>
              
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown size={20} />
              </motion.div>
            </TouchButton>
            
            <motion.div
              initial={false}
              animate={{
                height: isOpen ? 'auto' : 0,
                opacity: isOpen ? 1 : 0
              }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-4 pt-0 border-t border-slate-200 dark:border-slate-700">
                {item.content}
              </div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
};

export default {
  TouchButton,
  SwipeableCard,
  PullToRefresh,
  TouchModal,
  TouchAccordion
};