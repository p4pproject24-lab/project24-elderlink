import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { introduceUser } from '../services/aiChatService';
import { useAuth } from './useAuth';
import { useRole } from './useRole';

export function useIntroduction() {
  const { user } = useAuth();
  const { role } = useRole();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isGeneratingRef = useRef(false);
  const hasIntroducedRef = useRef(false);

  // Check if introduction has already been done for this user
  const getIntroductionKey = () => `introduction_${user?.firebaseUid}`;
  
  const hasIntroduced = async () => {
    if (!user?.firebaseUid) return false;
    try {
      const value = await AsyncStorage.getItem(getIntroductionKey());
      return value === 'true';
    } catch (error) {
      console.error('[useIntroduction] Error reading from AsyncStorage:', error);
      return false;
    }
  };

  const setIntroduced = async () => {
    if (user?.firebaseUid) {
      try {
        await AsyncStorage.setItem(getIntroductionKey(), 'true');
        hasIntroducedRef.current = true;
      } catch (error) {
        console.error('[useIntroduction] Error writing to AsyncStorage:', error);
      }
    }
  };

  const generateIntroduction = async () => {
    const hasIntroducedValue = await hasIntroduced();
    if (!user?.firebaseUid || role !== 'ELDERLY' || hasIntroducedValue || isGeneratingRef.current) {
      console.log('[useIntroduction] Skipping introduction:', {
        hasFirebaseUid: !!user?.firebaseUid,
        role,
        hasIntroduced: hasIntroducedValue,
        isGenerating: isGeneratingRef.current
      });
      return;
    }

    // Set the flag immediately to prevent race conditions
    await setIntroduced();
    isGeneratingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Build comprehensive introduction text from user's profile information
      const introText = buildIntroductionText(user);
      
      // Use Firebase UID for consistency
      console.log('[useIntroduction] Sending introduction with firebaseUid:', user.firebaseUid, 'mongoId:', user.id);
      console.log('[useIntroduction] Introduction text:', introText);
      
      const response = await introduceUser(user.firebaseUid, introText);
      
      console.log('[useIntroduction] Backend response:', response);
      
      if (response.status === 200) {
        console.log('Introduction stored successfully');
      } else {
        console.error('[useIntroduction] Backend returned non-200 status:', response.status, response.message);
        setError('Failed to store introduction');
        // Reset the flag if it failed
        try {
          await AsyncStorage.removeItem(getIntroductionKey());
          hasIntroducedRef.current = false;
        } catch (error) {
          console.error('[useIntroduction] Error removing from AsyncStorage:', error);
        }
      }
    } catch (err: any) {
      console.error('Error storing introduction:', err);
      console.error('[useIntroduction] Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.message || 'Failed to store introduction');
      // Reset the flag if it failed
      try {
        await AsyncStorage.removeItem(getIntroductionKey());
        hasIntroducedRef.current = false;
      } catch (error) {
        console.error('[useIntroduction] Error removing from AsyncStorage:', error);
      }
    } finally {
      setLoading(false);
      isGeneratingRef.current = false;
    }
  };

  const buildIntroductionText = (user: any): string => {
    const parts: string[] = [];
    
    // Basic information
    if (user.fullName) {
      parts.push(`My name is ${user.fullName}.`);
    }
    
    if (user.address) {
      parts.push(`I live in ${user.address}.`);
    }
    
    if (user.dateOfBirth) {
      parts.push(`I was born on ${user.dateOfBirth}.`);
    }
    
    // ElderlyStage2 information
    if (user.dailyLife) {
      parts.push(`About my daily life: ${user.dailyLife}`);
    }
    
    if (user.relationships) {
      parts.push(`My relationships and support network: ${user.relationships}`);
    }
    
    if (user.medicalNeeds) {
      parts.push(`My medical needs and medications: ${user.medicalNeeds}`);
    }
    
    if (user.hobbies) {
      parts.push(`My hobbies and interests: ${user.hobbies}`);
    }
    
    if (user.anythingElse) {
      parts.push(`Additional information about me: ${user.anythingElse}`);
    }
    
    // Add a personal touch
    parts.push("I'm looking forward to having you as my AI companion to help me with daily activities, reminders, and to keep me company.");
    
    return parts.join(' ');
  };

  // Auto-generate introduction when elderly user has completed profile setup
  useEffect(() => {
    // Check if user has completed ElderlyStage2 (has any of the ElderlyStage2 fields)
    const hasCompletedProfile = user?.dailyLife || user?.relationships || user?.medicalNeeds || user?.hobbies || user?.anythingElse;
    
    const checkAndGenerate = async () => {
      const hasIntroducedValue = await hasIntroduced();
      
      console.log('[useIntroduction] Debug info:', {
        userId: user?.id,
        firebaseUid: user?.firebaseUid,
        role,
        hasIntroduced: hasIntroducedValue,
        hasCompletedProfile,
        isGenerating: isGeneratingRef.current,
        dailyLife: user?.dailyLife,
        relationships: user?.relationships,
        medicalNeeds: user?.medicalNeeds,
        hobbies: user?.hobbies,
        anythingElse: user?.anythingElse,
      });
      
      if (user?.firebaseUid && role === 'ELDERLY' && !hasIntroducedValue && hasCompletedProfile && !isGeneratingRef.current) {
        console.log('Triggering introduction for elderly user with completed profile');
        // Add a small delay to ensure user data is fully loaded and prevent race conditions
        const timeoutId = setTimeout(() => {
          // Double-check the conditions after the delay
          generateIntroduction();
        }, 1500);
        
        // Cleanup timeout if component unmounts or dependencies change
        return () => clearTimeout(timeoutId);
      }
    };
    
    checkAndGenerate();
  }, [user?.firebaseUid, role, user?.dailyLife, user?.relationships, user?.medicalNeeds, user?.hobbies, user?.anythingElse]);

  return {
    hasIntroduced: hasIntroducedRef.current,
    loading,
    error,
    generateIntroduction,
  };
} 