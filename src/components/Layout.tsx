import { NavLink, Outlet } from 'react-router-dom';
import { 
  BarChart3, 
  MessageCircle, 
  AlertTriangle, 
  Settings,
  TrendingUp,
  LogOut,
  User,
  Moon,
  Sun,
  Monitor,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from './AuthProvider';
import { AuthModal } from './AuthModal';
import { useTheme } from '../contexts/ThemeContext';
import { useState } from 'react';

const Layout: React.FC = () => {
  const { user, signOut } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', icon: BarChart3, label: 'Dashboard' },
    { path: '/copilot', icon: MessageCircle, label: 'Neo AI' },
    { path: '/alerts', icon: AlertTriangle, label: 'Alerts' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

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
        {/* Mobile menu button */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>
        </div>

        {/* Mobile overlay */}
        {isMobileMenuOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700
          transition-transform duration-300 ease-in-out
        `}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  EcomPilot OS
                </h1>
              </div>
              
              {/* Theme toggle */}
              <button
                onClick={cycleTheme}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
                title={`Current theme: ${theme}`}
              >
                {getThemeIcon()}
              </button>
            </div>
          </div>
          
          <nav className="mt-6 flex-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-6 py-3 text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-600 dark:border-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* User Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-3 px-2">
                  <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {user.email}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-3 px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md w-full transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center space-x-3 px-2 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md w-full transition-colors"
              >
                <User className="h-4 w-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 pt-16 lg:pt-0">
            <div className="min-h-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
};

export default Layout;