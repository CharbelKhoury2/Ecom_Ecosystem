/**
 * Reusable Animated Components
 * Provides pre-built animated components for consistent animations throughout the app
 */

import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useInView, useAnimation, HTMLMotionProps } from 'framer-motion';
import {
  pageTransition,
  fadeTransition,
  slideTransition,
  cardAnimations,
  buttonAnimations,
  staggerContainer,
  staggerItem,
  modalAnimations,
  notificationAnimations,
  createRippleEffect,
  animateNumber,
  getOptimizedAnimation,
  ANIMATION_DURATION
} from '../utils/animations';

// Page wrapper with transition
interface AnimatedPageProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedPage: React.FC<AnimatedPageProps> = ({ children, className = '' }) => {
  const { getVariants } = getOptimizedAnimation();
  
  return (
    <motion.div
      className={className}
      variants={getVariants(pageTransition)}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  );
};

// Animated card component
interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  hover?: boolean;
  className?: string;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({ 
  children, 
  hover = true, 
  className = '',
  ...props 
}) => {
  const { getVariants } = getOptimizedAnimation();
  
  return (
    <motion.div
      className={`${className} cursor-pointer`}
      variants={getVariants(cardAnimations)}
      initial="initial"
      whileHover={hover ? "hover" : undefined}
      whileTap={hover ? "tap" : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Animated button with ripple effect
interface AnimatedButtonProps extends HTMLMotionProps<'button'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  ripple?: boolean;
  className?: string;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  ripple = true,
  className = '',
  onClick,
  ...props
}) => {
  const { getVariants } = getOptimizedAnimation();
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const baseClasses = 'relative overflow-hidden font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (ripple && buttonRef.current) {
      createRippleEffect(event, buttonRef.current);
    }
    onClick?.(event);
  };
  
  return (
    <motion.button
      ref={buttonRef}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      variants={getVariants(buttonAnimations)}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      animate={loading ? "loading" : "initial"}
      onClick={handleClick}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <motion.div
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <span className="ml-2">Loading...</span>
        </div>
      ) : (
        children
      )}
    </motion.button>
  );
};

// Staggered list container
interface StaggeredListProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export const StaggeredList: React.FC<StaggeredListProps> = ({ 
  children, 
  className = '',
  staggerDelay = 0.1 
}) => {
  const { getVariants } = getOptimizedAnimation();
  
  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1
      }
    }
  };
  
  return (
    <motion.div
      className={className}
      variants={getVariants(containerVariants)}
      initial="initial"
      animate="animate"
    >
      {children}
    </motion.div>
  );
};

// Staggered list item
interface StaggeredItemProps {
  children: React.ReactNode;
  className?: string;
}

export const StaggeredItem: React.FC<StaggeredItemProps> = ({ children, className = '' }) => {
  const { getVariants } = getOptimizedAnimation();
  
  return (
    <motion.div
      className={className}
      variants={getVariants(staggerItem)}
    >
      {children}
    </motion.div>
  );
};

// Animated modal
interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export const AnimatedModal: React.FC<AnimatedModalProps> = ({ 
  isOpen, 
  onClose, 
  children, 
  className = '' 
}) => {
  const { getVariants } = getOptimizedAnimation();
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            variants={getVariants(modalAnimations.backdrop)}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className={`bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto ${className}`}
              variants={getVariants(modalAnimations.modal)}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

// Animated notification
interface AnimatedNotificationProps {
  isVisible: boolean;
  type?: 'success' | 'error' | 'warning' | 'info';
  position?: 'top' | 'bottom' | 'top-right' | 'bottom-right';
  children: React.ReactNode;
  className?: string;
}

export const AnimatedNotification: React.FC<AnimatedNotificationProps> = ({
  isVisible,
  type = 'info',
  position = 'top-right',
  children,
  className = ''
}) => {
  const { getVariants } = getOptimizedAnimation();
  
  const typeClasses = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-black',
    info: 'bg-blue-500 text-white'
  };
  
  const positionClasses = {
    'top': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom': 'bottom-4 left-1/2 transform -translate-x-1/2',
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4'
  };
  
  const animationVariant = position.includes('top') ? 'slideInTop' : 'slideInRight';
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed z-50 px-4 py-3 rounded-lg shadow-lg ${typeClasses[type]} ${positionClasses[position]} ${className}`}
          variants={getVariants(notificationAnimations[animationVariant])}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Animated counter
interface AnimatedCounterProps {
  from?: number;
  to: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  from = 0,
  to,
  duration = 1000,
  className = '',
  prefix = '',
  suffix = '',
  decimals = 0
}) => {
  const [count, setCount] = useState(from);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  
  useEffect(() => {
    if (isInView) {
      const startTime = Date.now();
      const startValue = from;
      const endValue = to;
      const totalChange = endValue - startValue;
      
      const updateCount = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out)
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = startValue + (totalChange * easedProgress);
        
        setCount(currentValue);
        
        if (progress < 1) {
          requestAnimationFrame(updateCount);
        }
      };
      
      requestAnimationFrame(updateCount);
    }
  }, [isInView, from, to, duration]);
  
  return (
    <span ref={ref} className={className}>
      {prefix}{count.toFixed(decimals)}{suffix}
    </span>
  );
};

// Animated progress bar
interface AnimatedProgressProps {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
  showValue?: boolean;
  animated?: boolean;
}

export const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  value,
  max = 100,
  className = '',
  barClassName = '',
  showValue = false,
  animated = true
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  
  return (
    <div ref={ref} className={`relative ${className}`}>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <motion.div
          className={`h-full bg-blue-600 rounded-full ${barClassName}`}
          initial={{ width: 0 }}
          animate={isInView ? { width: `${percentage}%` } : { width: 0 }}
          transition={{ 
            duration: animated ? ANIMATION_DURATION.slow : 0,
            ease: 'easeOut'
          }}
        />
      </div>
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
          <AnimatedCounter to={percentage} suffix="%" decimals={1} />
        </div>
      )}
    </div>
  );
};

// Animated icon with rotation
interface AnimatedIconProps {
  children: React.ReactNode;
  hover?: boolean;
  rotation?: number;
  scale?: number;
  className?: string;
}

export const AnimatedIcon: React.FC<AnimatedIconProps> = ({
  children,
  hover = true,
  rotation = 0,
  scale = 1.1,
  className = ''
}) => {
  const { getVariants } = getOptimizedAnimation();
  
  const iconVariants = {
    initial: { rotate: 0, scale: 1 },
    hover: { 
      rotate: rotation, 
      scale: scale,
      transition: { duration: ANIMATION_DURATION.fast }
    }
  };
  
  return (
    <motion.div
      className={`inline-block ${className}`}
      variants={getVariants(iconVariants)}
      initial="initial"
      whileHover={hover ? "hover" : undefined}
    >
      {children}
    </motion.div>
  );
};

// Animated slide-in component
interface SlideInProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  className?: string;
}

export const SlideIn: React.FC<SlideInProps> = ({
  children,
  direction = 'up',
  delay = 0,
  className = ''
}) => {
  const { getVariants } = getOptimizedAnimation();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  
  const directionMap = {
    left: 'slideInLeft',
    right: 'slideInRight',
    up: 'slideInUp',
    down: 'slideInDown'
  };
  
  const variants = slideTransition[directionMap[direction]];
  
  return (
    <motion.div
      ref={ref}
      className={className}
      variants={getVariants(variants)}
      initial="initial"
      animate={isInView ? "animate" : "initial"}
      transition={{ delay, duration: ANIMATION_DURATION.normal }}
    >
      {children}
    </motion.div>
  );
};

// Animated fade-in component
interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = ANIMATION_DURATION.normal,
  className = ''
}) => {
  const { getVariants } = getOptimizedAnimation();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  
  return (
    <motion.div
      ref={ref}
      className={className}
      variants={getVariants(fadeTransition.fadeIn)}
      initial="initial"
      animate={isInView ? "animate" : "initial"}
      transition={{ delay, duration }}
    >
      {children}
    </motion.div>
  );
};

export default {
  AnimatedPage,
  AnimatedCard,
  AnimatedButton,
  StaggeredList,
  StaggeredItem,
  AnimatedModal,
  AnimatedNotification,
  AnimatedCounter,
  AnimatedProgress,
  AnimatedIcon,
  SlideIn,
  FadeIn
};