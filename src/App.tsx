import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'sonner';
import { AuthProvider } from './components/AuthProvider';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './components/NotificationSystem';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import { AnimatedPage } from './components/AnimatedComponents';

import { alertNotificationIntegration } from './services/alertNotificationIntegration';
import { pwaService } from './services/pwaService';
// import ThemeDebugger from './components/ThemeDebugger';

// Lazy load pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Copilot = lazy(() => import('./pages/Copilot'));
const Alerts = lazy(() => import('./pages/Alerts'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const Reports = lazy(() => import('./pages/Reports'));
const ReportBuilder = lazy(() => import('./pages/ReportBuilder'));
const CustomDashboard = lazy(() => import('./pages/CustomDashboard'));
const BusinessIntelligence = lazy(() => import('./pages/BusinessIntelligence'));
const NotificationSettings = lazy(() => import('./pages/NotificationSettings'));
const AnimationShowcase = lazy(() => import('./pages/AnimationShowcase'));

// Animated Routes Component
function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route 
          path="/login" 
          element={
            <AnimatedPage>
              <Login />
            </AnimatedPage>
          } 
        />
        <Route 
          path="/signup" 
          element={
            <AnimatedPage>
              <Signup />
            </AnimatedPage>
          } 
        />
        <Route 
          path="/forgot-password" 
          element={
            <AnimatedPage>
              <ForgotPassword />
            </AnimatedPage>
          } 
        />
        <Route 
          path="/reset-password" 
          element={
            <AnimatedPage>
              <ResetPassword />
            </AnimatedPage>
          } 
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AnimatedPage>
                <Dashboard />
              </AnimatedPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/custom-dashboard"
          element={
            <ProtectedRoute>
              <AnimatedPage>
                <CustomDashboard />
              </AnimatedPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/alerts"
          element={
            <ProtectedRoute>
              <AnimatedPage>
                <Alerts />
              </AnimatedPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/copilot"
          element={
            <ProtectedRoute>
              <AnimatedPage>
                <Copilot />
              </AnimatedPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <AnimatedPage>
                <Reports />
              </AnimatedPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/report-builder"
          element={
            <ProtectedRoute>
              <AnimatedPage>
                <ReportBuilder />
              </AnimatedPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/business-intelligence"
          element={
            <ProtectedRoute>
              <AnimatedPage>
                <BusinessIntelligence />
              </AnimatedPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AnimatedPage>
                <Settings />
              </AnimatedPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notification-settings"
          element={
            <ProtectedRoute>
              <AnimatedPage>
                <NotificationSettings />
              </AnimatedPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/user-management"
          element={
            <ProtectedRoute>
              <AnimatedPage>
                <UserManagement />
              </AnimatedPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/animation-showcase"
          element={
            <ProtectedRoute>
              <AnimatedPage>
                <AnimationShowcase />
              </AnimatedPage>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  useEffect(() => {
    alertNotificationIntegration.initialize();
    // PWA service auto-initializes in constructor
    console.log('PWA Service info:', pwaService.getInfo());
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>
            <Router>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                {/* <DiagnosticOverlay /> */}
                <Layout>
                  <Suspense fallback={<LoadingSpinner />}>
                    <AnimatedRoutes />
                  </Suspense>
                </Layout>
                <Toaster position="top-right" richColors toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#1f2937',
                    color: '#f9fafb',
                    border: '1px solid #374151'
                  }
                }} />
                {/* <ThemeDebugger /> */}
              </div>
            </Router>
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;