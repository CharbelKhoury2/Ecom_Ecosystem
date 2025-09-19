import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Bot,
  AlertTriangle,
  Settings,
  Menu,
  X,
  Sun,
  Moon,
  Monitor,
  LogOut,
  User,
  TrendingUp,
  FileText,
  Grid,
  Brain,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from './AuthProvider';
import { usePermissions } from '../hooks/usePermissions';
import { PermissionGuard, AdminOnly } from './PermissionGuard';
import { NotificationBell } from './NotificationSystem';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut, isDemoMode } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const permissions = usePermissions();

  // Check if current route is an auth page
  const isAuthPage = ['/login', '/signup', '/forgot-password', '/reset-password'].includes(location.pathname);

  // If it's an auth page, render without sidebar
  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {children}
      </div>
    );
  }

  // Animation variants
  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    },
    closed: {
      x: "-100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  const navItemVariants = {
    open: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      opacity: 0,
      x: -20
    }
  };

  const overlayVariants = {
    open: {
      opacity: 1,
      transition: { duration: 0.3 }
    },
    closed: {
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  const navItems = [
    { path: '/', icon: BarChart3, label: 'Dashboard', permission: 'dashboard:view' },
    { path: '/custom-dashboard', icon: Grid, label: 'Custom Dashboard', permission: 'dashboard:edit' },
    { path: '/copilot', icon: Bot, label: 'AI Copilot', permission: 'copilot:view' },
    { path: '/business-intelligence', icon: Brain, label: 'Business Intelligence', permission: 'analytics:view' },
    { path: '/alerts', icon: AlertTriangle, label: 'Alerts', permission: 'alerts:view' },
    { path: '/reports', icon: FileText, label: 'Reports', permission: 'reports:view' },
    { path: '/animation-showcase', icon: Sparkles, label: 'Animation Showcase', permission: null },
    { path: '/settings', icon: Settings, label: 'Settings', permission: 'settings:view' },
  ];

  // Filter navigation items based on user permissions
  const filteredNavItems = navItems.filter(item => {
    if (!item.permission) return true;
    const [resource, action] = item.permission.split(':');
    return permissions.can(resource, action);
  });

  const handleSignOut = async () => {
    await signOut();
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Modern Mobile menu button */}
        <motion.div 
          className="lg:hidden fixed top-6 left-6 z-50"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-3 rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50"
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence mode="wait">
              {isMobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>

        {/* Mobile overlay - Temporarily disabled for debugging */}
        {/* <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setIsMobileMenuOpen(false)}
              variants={overlayVariants}
              initial="closed"
              animate="open"
              exit="closed"
            />
          )}
        </AnimatePresence> */}

        {/* Modern Sidebar */}
        <motion.div 
          className={`lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl border-r border-gray-200/50 dark:border-gray-700/50 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
          variants={sidebarVariants}
          initial={false}
          animate={isMobileMenuOpen ? "open" : "closed"}
        >
          <motion.div 
            className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <motion.div 
                className="flex items-center space-x-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <motion.div
                  className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg"
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <TrendingUp className="h-6 w-6 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white font-display">
                    EcomPilot OS
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Analytics Dashboard
                  </p>
                </div>
              </motion.div>
              
              <motion.div 
                className="flex items-center space-x-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                {/* Notification Bell - Temporarily disabled */}
                {/* <NotificationBell className="" /> */}
                
                {/* Theme toggle */}
                <motion.button
                  onClick={cycleTheme}
                  className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
                  title={`Current theme: ${theme}`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <motion.div
                    key={theme}
                    initial={{ rotate: -180, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {getThemeIcon()}
                  </motion.div>
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
          
          <motion.nav 
            className="mt-6 flex-1"
            variants={{
              open: {
                transition: {
                  staggerChildren: 0.05,
                  delayChildren: 0.1
                }
              }
            }}
          >
            {filteredNavItems.map((item, index) => (
              <motion.div
                key={item.path}
                variants={navItemVariants}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to={item.path}
                  className={`flex items-center mx-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 relative overflow-hidden group ${
                    location.pathname === item.path
                      ? 'text-white bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/80'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {location.pathname === item.path && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl"
                      layoutId="activeNavItem"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30
                      }}
                    />
                  )}
                  <motion.div
                    className="relative z-10 flex items-center w-full"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div
                      className={`p-2 rounded-lg mr-3 transition-all duration-300 ${
                        location.pathname === item.path
                          ? 'bg-white/20'
                          : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30'
                      }`}
                      whileHover={{ rotate: 12, scale: 1.1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <item.icon className="h-4 w-4" />
                    </motion.div>
                    <span className="flex-1">{item.label}</span>
                    {location.pathname === item.path && (
                      <motion.div
                        className="w-2 h-2 bg-white rounded-full"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 }}
                      />
                    )}
                  </motion.div>
                </Link>
              </motion.div>
            ))}
            
            {/* Admin-only navigation */}
            <AdminOnly>
              <motion.div 
                className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.3 }}
              >
                <motion.p 
                  className="px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.3 }}
                >
                  Administration
                </motion.p>
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    to="/admin/users"
                    className={`flex items-center px-6 py-3 text-sm font-medium transition-all duration-200 relative overflow-hidden ${
                      location.pathname === '/admin/users'
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-600 dark:border-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {location.pathname === '/admin/users' && (
                      <motion.div
                        className="absolute inset-0 bg-blue-50 dark:bg-blue-900/20"
                        layoutId="activeNavItem"
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30
                        }}
                      />
                    )}
                    <motion.div
                      className="relative z-10 flex items-center"
                      whileHover={{ scale: 1.05 }}
                    >
                      <motion.div
                        whileHover={{ rotate: location.pathname === '/admin/users' ? 0 : 12 }}
                        transition={{ duration: 0.2 }}
                      >
                        <User className="mr-3 h-5 w-5" />
                      </motion.div>
                      User Management
                    </motion.div>
                  </Link>
                </motion.div>
              </motion.div>
            </AdminOnly>
          </motion.nav>

          {/* User Section */}
          <motion.div 
            className="border-t border-gray-200 dark:border-gray-700 p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.3 }}
          >
            {user ? (
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.3 }}
              >
                <motion.div 
                  className="flex items-center space-x-3 px-2"
                  whileHover={{ scale: 1.02 }}
                >
                  <motion.div 
                    className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <User className="h-5 w-5 text-white" />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {user.user_metadata?.full_name || user.email}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {permissions.getRoleInfo()?.displayName || 'User'}
                      </div>
                      {isDemoMode && (
                        <motion.span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.5, duration: 0.3 }}
                          whileHover={{ scale: 1.05 }}
                        >
                          Demo
                        </motion.span>
                      )}
                    </div>
                  </div>
                </motion.div>
                <motion.button
                  onClick={handleSignOut}
                  className="flex items-center space-x-3 px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md w-full transition-colors"
                  whileHover={{ scale: 1.02, x: 2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    whileHover={{ rotate: 15 }}
                    transition={{ duration: 0.2 }}
                  >
                    <LogOut className="h-4 w-4" />
                  </motion.div>
                  <span>Sign Out</span>
                </motion.button>
              </motion.div>
            ) : (
              <motion.button
                onClick={() => navigate('/login')}
                className="flex items-center space-x-3 px-2 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md w-full transition-colors"
                whileHover={{ scale: 1.02, x: 2 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.3 }}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                >
                  <User className="h-4 w-4" />
                </motion.div>
                <span>Sign In</span>
              </motion.button>
            )}
          </motion.div>
        </motion.div>

        {/* Modern Main Content */}
        <motion.div 
          className="flex-1 flex flex-col overflow-hidden lg:ml-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.main 
            className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-blue-950/30 pt-20 lg:pt-0 relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
              <div className="w-full h-full bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.3)_1px,transparent_0)] bg-[length:40px_40px]" />
            </div>
            
            <motion.div 
              className="relative min-h-full p-6 lg:p-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              {children}
            </motion.div>
          </motion.main>
        </motion.div>
      </div>
    </>
  );
};

export default Layout;