import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserResponse } from '../types/UserResponse';
import { getConnectedElderlyForCaregiver } from '../services/connectionService';
import { useAuth } from '../hooks/useAuth';
import { useRole } from '../hooks/useRole';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CurrentElderlyContextType {
  currentElderly: UserResponse | null;
  connectedElderly: UserResponse[];
  setCurrentElderly: (elderly: UserResponse | null) => void;
  loading: boolean;
  refreshConnectedElderly: () => Promise<void>;
}

const CurrentElderlyContext = createContext<CurrentElderlyContextType | undefined>(undefined);

export const useCurrentElderly = () => {
  const context = useContext(CurrentElderlyContext);
  if (context === undefined) {
    throw new Error('useCurrentElderly must be used within a CurrentElderlyProvider');
  }
  return context;
};

interface CurrentElderlyProviderProps {
  children: ReactNode;
}

export const CurrentElderlyProvider: React.FC<CurrentElderlyProviderProps> = ({ children }) => {
  const [currentElderly, setCurrentElderly] = useState<UserResponse | null>(null);
  const [connectedElderly, setConnectedElderly] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { role } = useRole();

  const loadConnectedElderly = async () => {
    console.log('[CurrentElderlyContext] loadConnectedElderly called');
    console.log('[CurrentElderlyContext] user?.firebaseUid:', user?.firebaseUid);
    console.log('[CurrentElderlyContext] role:', role);
    console.log('[CurrentElderlyContext] user?.role:', user?.role);
    
    // Check both role from context and user.role
    const isCaregiver = role === 'CAREGIVER' || user?.role === 'CAREGIVER';
    
    if (!user?.firebaseUid || !isCaregiver) {
      console.log('[CurrentElderlyContext] Early return - missing firebaseUid or not caregiver');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('[CurrentElderlyContext] Calling getConnectedElderlyForCaregiver with:', user.firebaseUid);
      const elderly = await getConnectedElderlyForCaregiver(user.firebaseUid);
      console.log('[CurrentElderlyContext] Received elderly data:', elderly);
      setConnectedElderly(elderly);
      
      // Load the previously selected elderly user from storage
      const savedElderlyId = await AsyncStorage.getItem('currentElderlyId');
      console.log('[CurrentElderlyContext] Saved elderly ID:', savedElderlyId);
      
      if (savedElderlyId && elderly.length > 0) {
        const savedElderly = elderly.find((e: UserResponse) => e.firebaseUid === savedElderlyId);
        if (savedElderly) {
          console.log('[CurrentElderlyContext] Setting saved elderly:', savedElderly.fullName);
          setCurrentElderly(savedElderly);
        } else {
          // If saved elderly is not in the list anymore, default to first one
          console.log('[CurrentElderlyContext] Saved elderly not found, defaulting to first:', elderly[0]?.fullName);
          setCurrentElderly(elderly[0] || null);
        }
      } else if (elderly.length > 0) {
        // Default to first elderly user if no saved preference
        console.log('[CurrentElderlyContext] No saved elderly, defaulting to first:', elderly[0]?.fullName);
        setCurrentElderly(elderly[0]);
      } else {
        console.log('[CurrentElderlyContext] No elderly users found');
        setCurrentElderly(null);
      }
    } catch (error) {
      console.error('[CurrentElderlyContext] Error loading connected elderly:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetCurrentElderly = async (elderly: UserResponse | null) => {
    setCurrentElderly(elderly);
    if (elderly) {
      await AsyncStorage.setItem('currentElderlyId', elderly.firebaseUid);
    } else {
      await AsyncStorage.removeItem('currentElderlyId');
    }
  };

  const refreshConnectedElderly = async () => {
    await loadConnectedElderly();
  };

  useEffect(() => {
    console.log('[CurrentElderlyContext] useEffect triggered');
    console.log('[CurrentElderlyContext] user?.firebaseUid:', user?.firebaseUid);
    console.log('[CurrentElderlyContext] role:', role);
    console.log('[CurrentElderlyContext] user?.role:', user?.role);
    
    // Only load if we have both firebaseUid and role is CAREGIVER
    if (user?.firebaseUid && (role === 'CAREGIVER' || user?.role === 'CAREGIVER')) {
      loadConnectedElderly();
    } else {
      console.log('[CurrentElderlyContext] Not loading - missing firebaseUid or not caregiver');
      setLoading(false);
    }
  }, [user?.firebaseUid, role, user?.role]);

  const value: CurrentElderlyContextType = {
    currentElderly,
    connectedElderly,
    setCurrentElderly: handleSetCurrentElderly,
    loading,
    refreshConnectedElderly,
  };

  return (
    <CurrentElderlyContext.Provider value={value}>
      {children}
    </CurrentElderlyContext.Provider>
  );
}; 