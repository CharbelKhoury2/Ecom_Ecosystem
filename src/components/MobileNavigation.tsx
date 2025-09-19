/**
 * Mobile Navigation Component
 * Provides mobile-first navigation with touch gestures, PWA features, and responsive design
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { 
  Home, 
  ShoppingBag, 
  BarChart3, 
  Users, 
  Settings, 
  Menu, 
  X, 
  Wifi, 
  WifiOff,
  Download,
  RefreshCw,
  Bell,
  Search
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { pwaService } from '../services/pwaService';
import { toast } from 'sonner';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  path: string;
  badge?: number;
}

const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
  { id: 'products', label: 'Products', icon: ShoppingBag, path: '/products' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { id: 'customers', label: 'Customers', icon: Users, path: '/customers' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }
];

export const MobileNavigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [canInstall, setCanInstall] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Setup PWA listeners
    const unsubscribeOnline = pwaService.onOnline(() => {
      setIsOnline(true);
      toast.success('Back online!');
    });

    const unsubscribeOffline = pwaService.onOffline(() => {
      setIsOnline(false);
      toast.error('You are offline');
    });

    const unsubscribeInstall = pwaService.onInstallPrompt((canInstall) => {
      setCanInstall(canInstall);
    });

    const unsubscribeUpdate = pwaService.onUpdate((info) => {
      setUpdateAvailable(info.available);
      if (info.available) {
        toast.info('App update available!', {
          action: {
            label: 'Update',
            onClick: () => handleUpdate()
          }
        });
      }
    });

    return () => {
      unsubscribeOnline();
      unsubscribeOffline();
      unsubscribeInstall();
      unsubscribeUpdate();
    };
  }, []);

  useEffect(() => {
    // Close menu when route changes
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    // Focus search input when opened
    if (showSearch && searchRef.current) {
      searchRef.current.focus();
    }
  }, [showSearch]);

  const handleInstallApp = async () => {
    const success = await pwaService.installApp();
    if (success) {
      toast.success('App installed successfully!');
    }
  };

  const handleUpdate = async () => {
    await pwaService.applyUpdate();
    toast.success('App updated! Reloading...');
  };

  const handlePanEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Close menu on swipe left
    if (info.offset.x < -100 && info.velocity.x < -500) {
      setIsOpen(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setShowSearch(false);
    }
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOpen(true)}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="font-semibold text-white">Ecom</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Connection Status */}
            <div className={`p-1.5 rounded-full ${
              isOnline ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
            </div>

            {/* Search Button */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
              aria-label="Search"
            >
              <Search size={16} />
            </button>

            {/* Notifications */}
            <button
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors relative"
              aria-label="Notifications"
            >
              <Bell size={16} />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-slate-700 bg-slate-800/50"
            >
              <form onSubmit={handleSearch} className="p-4">
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, orders, customers..."
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            drag="x"
            dragConstraints={{ left: -300, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handlePanEnd}
            className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-80 max-w-[85vw] bg-slate-900 border-r border-slate-700 overflow-y-auto"
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">E</span>
                </div>
                <div>
                  <h2 className="font-semibold text-white">Ecom Ecosystem</h2>
                  <p className="text-xs text-slate-400">Advanced E-commerce Platform</p>
                </div>
              </div>
              
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* PWA Actions */}
            <div className="p-4 border-b border-slate-700 space-y-2">
              {canInstall && (
                <button
                  onClick={handleInstallApp}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <Download size={18} />
                  <span className="font-medium">Install App</span>
                </button>
              )}
              
              {updateAvailable && (
                <button
                  onClick={handleUpdate}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                >
                  <RefreshCw size={18} />
                  <span className="font-medium">Update Available</span>
                </button>
              )}
            </div>

            {/* Navigation Items */}
            <nav className="p-4">
              <ul className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActiveRoute(item.path);
                  
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => navigate(item.path)}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <Icon size={20} />
                        <span className="font-medium">{item.label}</span>
                        {item.badge && (
                          <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Connection Status */}
            <div className="p-4 border-t border-slate-700">
              <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                isOnline ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
              }`}>
                {isOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
                <span className="text-sm font-medium">
                  {isOnline ? 'Online' : 'Offline Mode'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation for Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700">
        <div className="flex items-center justify-around px-2 py-2">
          {navigationItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.path);
            
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'text-blue-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs font-medium">{item.label}</span>
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Spacer for fixed navigation */}
      <div className="lg:hidden h-16"></div>
      <div className="lg:hidden h-16"></div>
    </>
  );
};

export default MobileNavigation;