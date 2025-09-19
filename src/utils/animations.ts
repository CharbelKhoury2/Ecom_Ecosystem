/**
 * Animation Utilities and Configurations
 * Provides reusable animation presets and utilities for the entire application
 */

import { Variants, Transition } from 'framer-motion';
import { gsap } from 'gsap';

// Animation duration constants
export const ANIMATION_DURATION = {
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  slower: 0.8,
  slowest: 1.2
};

// Easing functions
export const EASING = {
  easeInOut: [0.4, 0, 0.2, 1],
  easeOut: [0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
  elastic: [0.175, 0.885, 0.32, 1.275]
};

// Page transition variants
export const pageTransition: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: ANIMATION_DURATION.normal,
      ease: EASING.easeOut
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: {
      duration: ANIMATION_DURATION.fast,
      ease: EASING.easeIn
    }
  }
};

// Slide transitions
export const slideTransition: Variants = {
  slideInLeft: {
    initial: { x: -100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -100, opacity: 0 }
  },
  slideInRight: {
    initial: { x: 100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 100, opacity: 0 }
  },
  slideInUp: {
    initial: { y: 100, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 100, opacity: 0 }
  },
  slideInDown: {
    initial: { y: -100, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -100, opacity: 0 }
  }
};

// Fade transitions
export const fadeTransition: Variants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  fadeInScale: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
  },
  fadeInBlur: {
    initial: { opacity: 0, filter: 'blur(10px)' },
    animate: { opacity: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, filter: 'blur(10px)' }
  }
};

// Card animations
export const cardAnimations: Variants = {
  hover: {
    scale: 1.02,
    y: -4,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    transition: {
      duration: ANIMATION_DURATION.fast,
      ease: EASING.easeOut
    }
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: ANIMATION_DURATION.fast
    }
  },
  initial: {
    scale: 1,
    y: 0,
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
  }
};

// Button animations
export const buttonAnimations: Variants = {
  hover: {
    scale: 1.05,
    transition: {
      duration: ANIMATION_DURATION.fast,
      ease: EASING.easeOut
    }
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: ANIMATION_DURATION.fast
    }
  },
  loading: {
    scale: [1, 1.05, 1],
    transition: {
      duration: ANIMATION_DURATION.slow,
      repeat: Infinity,
      ease: EASING.easeInOut
    }
  }
};

// List item stagger animation
export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

export const staggerItem: Variants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_DURATION.normal,
      ease: EASING.easeOut
    }
  }
};

// Modal animations
export const modalAnimations: Variants = {
  backdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  modal: {
    initial: {
      opacity: 0,
      scale: 0.8,
      y: 50
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: ANIMATION_DURATION.normal,
        ease: EASING.bounce
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 50,
      transition: {
        duration: ANIMATION_DURATION.fast,
        ease: EASING.easeIn
      }
    }
  }
};

// Notification animations
export const notificationAnimations: Variants = {
  slideInRight: {
    initial: { x: 400, opacity: 0 },
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        duration: ANIMATION_DURATION.normal,
        ease: EASING.easeOut
      }
    },
    exit: {
      x: 400,
      opacity: 0,
      transition: {
        duration: ANIMATION_DURATION.fast,
        ease: EASING.easeIn
      }
    }
  },
  slideInTop: {
    initial: { y: -100, opacity: 0 },
    animate: {
      y: 0,
      opacity: 1,
      transition: {
        duration: ANIMATION_DURATION.normal,
        ease: EASING.bounce
      }
    },
    exit: {
      y: -100,
      opacity: 0,
      transition: {
        duration: ANIMATION_DURATION.fast,
        ease: EASING.easeIn
      }
    }
  }
};

// Chart animations
export const chartAnimations = {
  bar: {
    initial: { scaleY: 0, originY: 1 },
    animate: { scaleY: 1 },
    transition: { duration: ANIMATION_DURATION.slow, ease: EASING.easeOut }
  },
  line: {
    initial: { pathLength: 0 },
    animate: { pathLength: 1 },
    transition: { duration: ANIMATION_DURATION.slower, ease: EASING.easeInOut }
  },
  pie: {
    initial: { scale: 0, rotate: -90 },
    animate: { scale: 1, rotate: 0 },
    transition: { duration: ANIMATION_DURATION.slow, ease: EASING.bounce }
  }
};

// Number counting animation
export const animateNumber = (from: number, to: number, duration: number = 1000): Promise<void> => {
  return new Promise((resolve) => {
    const obj = { value: from };
    gsap.to(obj, {
      value: to,
      duration: duration / 1000,
      ease: 'power2.out',
      onUpdate: () => {
        const elements = document.querySelectorAll('[data-animate-number]');
        elements.forEach((el) => {
          if (el.getAttribute('data-animate-number') === 'true') {
            el.textContent = Math.round(obj.value).toLocaleString();
          }
        });
      },
      onComplete: resolve
    });
  });
};

// Ripple effect animation
export const createRippleEffect = (event: React.MouseEvent, element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;
  
  const ripple = document.createElement('span');
  ripple.style.cssText = `
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    transform: scale(0);
    animation: ripple 0.6s linear;
    left: ${x}px;
    top: ${y}px;
    width: ${size}px;
    height: ${size}px;
    pointer-events: none;
  `;
  
  element.appendChild(ripple);
  
  setTimeout(() => {
    ripple.remove();
  }, 600);
};

// Parallax scroll effect
export const createParallaxEffect = (element: HTMLElement, speed: number = 0.5) => {
  const handleScroll = () => {
    const scrolled = window.pageYOffset;
    const parallax = scrolled * speed;
    element.style.transform = `translateY(${parallax}px)`;
  };
  
  window.addEventListener('scroll', handleScroll);
  
  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
};

// Intersection Observer animation trigger
export const createScrollTrigger = (
  element: HTMLElement,
  animation: () => void,
  options: IntersectionObserverInit = { threshold: 0.1 }
) => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animation();
        observer.unobserve(element);
      }
    });
  }, options);
  
  observer.observe(element);
  
  return observer;
};

// Reduced motion check
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Animation utilities
export const animationUtils = {
  // Create a spring transition
  spring: (stiffness: number = 300, damping: number = 30): Transition => ({
    type: 'spring',
    stiffness,
    damping
  }),
  
  // Create a tween transition
  tween: (duration: number = ANIMATION_DURATION.normal, ease: number[] = EASING.easeOut): Transition => ({
    type: 'tween',
    duration,
    ease
  }),
  
  // Create a delay
  delay: (delay: number): Transition => ({
    delay
  }),
  
  // Combine transitions
  combine: (...transitions: Transition[]): Transition => {
    return transitions.reduce((acc, transition) => ({ ...acc, ...transition }), {});
  }
};

// CSS animation classes
export const cssAnimations = {
  // Pulse animation
  pulse: 'animate-pulse',
  
  // Bounce animation
  bounce: 'animate-bounce',
  
  // Spin animation
  spin: 'animate-spin',
  
  // Ping animation
  ping: 'animate-ping',
  
  // Custom CSS animations
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  slideDown: 'animate-slide-down',
  slideLeft: 'animate-slide-left',
  slideRight: 'animate-slide-right',
  scaleIn: 'animate-scale-in',
  scaleOut: 'animate-scale-out'
};

// Performance optimized animation utilities
export const getOptimizedAnimation = () => {
  const isReducedMotion = prefersReducedMotion();
  
  const getTransition = (transition: Transition): Transition => {
    if (isReducedMotion) {
      return { duration: 0 };
    }
    return transition;
  };
  
  const getVariants = (variants: Variants): Variants => {
    if (isReducedMotion) {
      return {
        initial: variants.animate || {},
        animate: variants.animate || {},
        exit: variants.animate || {}
      };
    }
    return variants;
  };
  
  return {
    isReducedMotion,
    getTransition,
    getVariants
  };
};

// Legacy alias for backward compatibility
export const useOptimizedAnimation = getOptimizedAnimation;

export default {
  pageTransition,
  slideTransition,
  fadeTransition,
  cardAnimations,
  buttonAnimations,
  staggerContainer,
  staggerItem,
  modalAnimations,
  notificationAnimations,
  chartAnimations,
  animateNumber,
  createRippleEffect,
  createParallaxEffect,
  createScrollTrigger,
  prefersReducedMotion,
  animationUtils,
  cssAnimations,
  useOptimizedAnimation,
  ANIMATION_DURATION,
  EASING
};