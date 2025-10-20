import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getProfileFlowStatus, updateProfileStep, goBackToStep } from '../services/userService';

interface ProfileFlowStepContextType {
  step: number;
  setStep: (step: number) => void;
  goBack: (step: number) => void;
  resetStep: () => void;
  loading: boolean;
  profileFlowCompleted: boolean;
  hasConnections: boolean;
}

const ProfileFlowStepContext = createContext<ProfileFlowStepContextType | undefined>(undefined);

export const ProfileFlowStepProvider = ({ children }: { children: ReactNode }) => {
  const [step, setStepState] = useState(1);
  const [loading, setLoading] = useState(true);
  const [profileFlowCompleted, setProfileFlowCompleted] = useState(false);
  const [hasConnections, setHasConnections] = useState(false);
  const { user } = useAuth();

  // Load profile flow status from backend
  useEffect(() => {
    const loadProfileFlowStatus = async () => {
      if (!user) {
        setStepState(1);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const status = await getProfileFlowStatus();
        console.log('[ProfileFlowStepContext] Loaded status:', status);
        
        // Use highest step reached for initial step, not current step
        setStepState(status.highestStepReached || 1);
        setProfileFlowCompleted(status.flowCompleted || false);
        setHasConnections(status.hasConnections || false);
      } catch (error) {
        console.error('[ProfileFlowStepContext] Error loading profile flow status:', error);
        setStepState(1);
      } finally {
        setLoading(false);
      }
    };

    loadProfileFlowStatus();
  }, [user?.id]);

  // Update step in backend when going forward
  const setStep = async (newStep: number) => {
    setStepState(newStep);
    
    if (user) {
      try {
        await updateProfileStep(newStep);
        console.log('[ProfileFlowStepContext] Updated step to:', newStep);
      } catch (error) {
        console.error('[ProfileFlowStepContext] Error updating step:', error);
      }
    }
  };

  // Go back to a step without affecting highest step reached
  const goBack = async (newStep: number) => {
    setStepState(newStep);
    
    if (user) {
      try {
        await goBackToStep(newStep);
        console.log('[ProfileFlowStepContext] Went back to step:', newStep);
      } catch (error) {
        console.error('[ProfileFlowStepContext] Error going back to step:', error);
      }
    }
  };

  const resetStep = () => {
    setStepState(1);
    if (user) {
      updateProfileStep(1).catch(error => {
        console.error('[ProfileFlowStepContext] Error resetting step:', error);
      });
    }
  };

  return (
    <ProfileFlowStepContext.Provider value={{ 
      step, 
      setStep, 
      goBack,
      resetStep, 
      loading, 
      profileFlowCompleted, 
      hasConnections 
    }}>
      {children}
    </ProfileFlowStepContext.Provider>
  );
};

export const useProfileFlowStep = () => {
  const context = useContext(ProfileFlowStepContext);
  if (!context) {
    throw new Error('useProfileFlowStep must be used within a ProfileFlowStepProvider');
  }
  return context;
}; 