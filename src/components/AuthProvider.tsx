import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: any }>;
  isDemoMode: boolean;
}

// Demo user configuration
const DEMO_CREDENTIALS = {
  email: 'demo@ecompilot.com',
  password: 'demo123'
};

const DEMO_USER = {
  id: 'demo-user-id',
  email: 'demo@ecompilot.com',
  user_metadata: {
    first_name: 'Demo',
    last_name: 'User',
    role: 'admin'
  },
  app_metadata: {
    role: 'admin'
  },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
} as User;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Check for demo mode in localStorage
    const demoMode = localStorage.getItem('demo_mode') === 'true';
    if (demoMode) {
      setUser(DEMO_USER);
      setIsDemoMode(true);
      setLoading(false);
      console.log('Demo mode activated from localStorage');
      return;
    }

    // Auto-activate demo mode if no user session exists (for testing)
    const autoDemo = localStorage.getItem('auto_demo_disabled') !== 'true';
    if (autoDemo) {
      console.log('Auto-activating demo mode for testing...');
      localStorage.setItem('demo_mode', 'true');
      setUser(DEMO_USER);
      setIsDemoMode(true);
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Don't override demo mode with Supabase auth changes
      if (!isDemoMode) {
        setUser(session?.user ?? null);
        setSession(session);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [isDemoMode]);

  // Additional effect to handle demo mode persistence
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'demo_mode') {
        const demoMode = e.newValue === 'true';
        if (demoMode && !isDemoMode) {
          setUser(DEMO_USER);
          setIsDemoMode(true);
          setLoading(false);
        } else if (!demoMode && isDemoMode) {
          setUser(null);
          setIsDemoMode(false);
          setSession(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isDemoMode]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    
    // Check for demo credentials
    if (email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
      try {
        localStorage.setItem('demo_mode', 'true');
        setUser(DEMO_USER);
        setIsDemoMode(true);
        setLoading(false);
        console.log('Demo mode activated successfully');
        return { error: null };
      } catch (err) {
        console.error('Failed to set demo mode:', err);
        setLoading(false);
        return { error: { message: 'Failed to activate demo mode' } };
      }
    }

    // Regular Supabase authentication
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(false);
      return { error };
    } catch (err) {
      setLoading(false);
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    return { error };
  };

  const signOut = async () => {
    try {
      // Handle demo mode logout
      if (isDemoMode) {
        localStorage.removeItem('demo_mode');
        setUser(null);
        setIsDemoMode(false);
        setSession(null);
        console.log('Demo mode deactivated');
        return;
      }

      // Regular Supabase logout
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const resetPassword = async (email: string) => {
    // Demo user cannot reset password
    if (email === DEMO_CREDENTIALS.email) {
      return { error: { message: 'Demo account password cannot be reset. Use demo123 to login.' } };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    isDemoMode,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}