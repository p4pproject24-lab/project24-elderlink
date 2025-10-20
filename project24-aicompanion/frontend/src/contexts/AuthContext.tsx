import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getCurrentUser } from '../services/authService';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { UserResponse } from '../types/UserResponse';
import { locationTrackingService } from '../services/locationTrackingService';

interface AuthContextType {
  user: UserResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    user: firebaseUser,
    loading: firebaseLoading,
    error: firebaseError,
    signInWithGoogle,
    signInWithPhone,
    signOut,
  } = useFirebaseAuth();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    let attempts = 0;
    const maxAttempts = 5;
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
    while (attempts < maxAttempts) {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
        setLoading(false);
        return;
    } catch (e: any) {
        attempts++;
        // If unauthorized or not found, retry
        if (attempts < maxAttempts && (e?.response?.status === 401 || e?.response?.status === 404)) {
          await delay(500);
          continue;
        }
        // If it's a 401 error, clear user state and stop retrying
        if (e?.response?.status === 401) {
          setUser(null);
          setError('Authentication failed - please sign in again');
          setLoading(false);
          return;
        }
      setUser(null);
      setError(e.message || 'Failed to fetch user');
      setLoading(false);
        return;
      }
    }
    // If all attempts fail
    setUser(null);
    setError('Failed to fetch user after multiple attempts');
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!firebaseLoading && firebaseUser) {
      console.log('[AuthContext] Firebase user detected, refreshing user data');
      refresh();
    } else if (!firebaseLoading && !firebaseUser) {
      // Clear user state when Firebase user is null (logout)
      console.log('[AuthContext] Firebase user null, clearing user state');
      setUser(null);
      setError(null);
      setLoading(false);
    }
  }, [firebaseUser, firebaseLoading, refresh]);

  // Handle location tracking based on authentication state - only for elderly users
  useEffect(() => {
    if (firebaseUser?.uid && user && !loading) {
      // Only start tracking for elderly users
      if (user.role === 'ELDERLY') {
        console.log('[AuthContext] Elderly user authenticated, setting up location tracking for user:', firebaseUser.uid);
        locationTrackingService.setUserId(firebaseUser.uid);
        
        // Add a small delay to ensure authentication token is properly set
        setTimeout(() => {
          locationTrackingService.startTracking();
        }, 1000);
      } else {
        // For caregivers, ensure location tracking is stopped
        console.log('[AuthContext] Caregiver user authenticated, stopping location tracking');
        locationTrackingService.stopTracking();
      }
    } else if (!firebaseUser?.uid) {
      // Stop tracking when no Firebase user
      console.log('[AuthContext] Stopping location tracking - no Firebase user');
      locationTrackingService.stopTracking();
    } else if (firebaseUser?.uid && !user && !loading) {
      // Stop tracking if Firebase user exists but user data failed to load
      console.log('[AuthContext] Stopping location tracking - user data failed to load');
      locationTrackingService.stopTracking();
    }

    // Cleanup function to stop tracking when component unmounts
    return () => {
      locationTrackingService.stopTracking();
    };
  }, [firebaseUser?.uid, user, loading]);

  return (
    <AuthContext.Provider value={{ user, loading, error, refresh, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within an AuthProvider');
  return ctx;
}
