import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { useLocation } from 'react-router-dom';

export const DiagnosticOverlay: React.FC = () => {
  const { user, loading, isDemoMode } = useAuth();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    console.log('DiagnosticOverlay mounted');
    console.log('Current location:', location.pathname);
    console.log('User:', user);
    console.log('Loading:', loading);
    console.log('Demo mode:', isDemoMode);
  }, [user, loading, isDemoMode, location]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 right-0 z-[9999] bg-black/80 text-white p-4 m-4 rounded-lg text-sm max-w-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Debug Info</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-white hover:text-gray-300"
        >
          ×
        </button>
      </div>
      <div className="space-y-1">
        <div>Path: {location.pathname}</div>
        <div>Loading: {loading ? 'Yes' : 'No'}</div>
        <div>User: {user ? 'Authenticated' : 'Not authenticated'}</div>
        <div>Demo Mode: {isDemoMode ? 'Yes' : 'No'}</div>
        <div>User Email: {user?.email || 'None'}</div>
      </div>
      <div className="mt-2 pt-2 border-t border-gray-600">
        <div className="text-xs text-gray-300">
          If you see this, React is working!
        </div>
      </div>
    </div>
  );
};