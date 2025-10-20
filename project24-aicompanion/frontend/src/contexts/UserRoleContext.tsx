import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { useAuthContext } from './AuthContext';
import { setUserRole } from '../services/authService';

interface UserRoleContextType {
  role: string;
  setRole: (role: string) => void;
  loading: boolean;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export const UserRoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading, refresh } = useAuthContext();
  const [role, setRoleState] = useState<string>('NONE');

  React.useEffect(() => {
    if (user && user.role) {
      console.log('[UserRoleContext] Setting role to:', user.role, 'for user:', user.id);
      setRoleState(user.role);
    } else {
      // Reset role when user is null (logout) or has no role
      console.log('[UserRoleContext] Resetting role to NONE, user:', user?.id || 'null');
      setRoleState('NONE');
    }
  }, [user]);

  // Optionally, implement setRole to update backend and refresh user
  const setRole = useCallback(async (newRole: string) => {
    setRoleState(newRole);
    try {
      await setUserRole(newRole);
      await refresh();
    } catch (error) {
      setRoleState('NONE');
      // You could add error handling logic here
    }
  }, [refresh]);

  const value = useMemo(() => ({
    role,
    setRole,
    loading: authLoading,
  }), [role, setRole, authLoading]);

  return (
    <UserRoleContext.Provider value={value}>
      {children}
    </UserRoleContext.Provider>
  );
};

export function useUserRoleContext() {
  const ctx = useContext(UserRoleContext);
  if (!ctx) throw new Error('useUserRoleContext must be used within a UserRoleProvider');
  return ctx;
}
