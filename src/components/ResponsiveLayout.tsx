/**
 * Responsive Layout Component
 * Provides adaptive layout that works seamlessly across desktop, tablet, and mobile devices
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  ShoppingBag, 
  BarChart3, 
  Users, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import MobileNavigation from './MobileNavigation';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  path: string;
  children?: NavigationItem[];
}

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
  { 
    id: 'products', 
    label: 'Products', 
    icon: ShoppingBag, 
    path: '/products',
    children: [
      { id: 'products-list', label: 'All Products', icon: ShoppingBag, path: '/products' },
      { id: 'products-add', label: 'Add Product', icon: ShoppingBag, path: '/products/add' },
      { id: 'products-categories', label: 'Categories', icon: ShoppingBag, path: '/products/categories' }
    ]
  },
  { 
    id: 'analytics', 
    label: 'Analytics', 
    icon: BarChart3, 
    path: '/analytics',
    children: [
      { id: 'analytics-overview', label: 'Overview', icon: BarChart3, path: '/analytics' },
      { id: 'analytics-sales', label: 'Sales', icon: BarChart3, path: '/analytics/sales' },
      { id: 'analytics-customers', label: 'Customers', icon: BarChart3, path: '/analytics/customers' }
    ]
  },
  { id: 'customers', label: 'Customers', icon: Users, path: '/customers' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }
];

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  title,
  subtitle,
  actions
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      
      // Auto-collapse sidebar on tablet
      if (width < 1024) {
        setSidebarCollapsed(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    // Auto-expand parent items based on current route
    const currentPath = location.pathname;
    const newExpanded: string[] = [];
    
    navigationItems.forEach(item => {
      if (item.children) {
        const hasActiveChild = item.children.some(child => 
          currentPath === child.path || currentPath.startsWith(child.path + '/')
        );
        if (hasActiveChild) {
          newExpanded.push(item.id);
        }
      }
    });
    
    setExpandedItems(newExpanded);
  }, [location.pathname]);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Mobile layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <MobileNavigation />
        
        {/* Main Content */}
        <main className="pt-16 pb-20 px-4">
          {(title || subtitle || actions) && (
            <div className="mb-6">
              {title && (
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  {subtitle}
                </p>
              )}
              {actions && (
                <div className="flex flex-wrap gap-2">
                  {actions}
                </div>
              )}
            </div>
          )}
          
          <div className="space-y-4">
            {children}
          </div>
        </main>
      </div>
    );
  }

  // Desktop/Tablet layout
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarCollapsed ? 80 : 280
        }}
        className="hidden md:flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 relative z-10"
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold">E</span>
            </div>
            
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="min-w-0"
                >
                  <h2 className="font-semibold text-slate-900 dark:text-white truncate">
                    Ecom Ecosystem
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    Advanced Platform
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.path);
              const isExpanded = expandedItems.includes(item.id);
              const hasChildren = item.children && item.children.length > 0;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      if (hasChildren && !sidebarCollapsed) {
                        toggleExpanded(item.id);
                      } else {
                        navigate(item.path);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    
                    <AnimatePresence>
                      {!sidebarCollapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="font-medium truncate"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    
                    {hasChildren && !sidebarCollapsed && (
                      <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        className="ml-auto"
                      >
                        <ChevronRight size={16} />
                      </motion.div>
                    )}
                  </button>
                  
                  {/* Submenu */}
                  {hasChildren && !sidebarCollapsed && (
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.ul
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-2 ml-6 space-y-1 overflow-hidden"
                        >
                          {item.children?.map((child) => {
                            const ChildIcon = child.icon;
                            const isChildActive = isActiveRoute(child.path);
                            
                            return (
                              <li key={child.id}>
                                <button
                                  onClick={() => navigate(child.path)}
                                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                                    isChildActive
                                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300'
                                  }`}
                                >
                                  <ChildIcon size={16} />
                                  <span className="font-medium truncate">{child.label}</span>
                                </button>
                              </li>
                            );
                          })}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Toggle */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            {!sidebarCollapsed && (
              <span className="text-sm font-medium">Collapse</span>
            )}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        {(title || subtitle || actions) && (
          <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                {title && (
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white truncate">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-slate-600 dark:text-slate-400 mt-1 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-3 ml-4">
                {actions}
                
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                  {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
              </div>
            </div>
          </header>
        )}

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ResponsiveLayout;