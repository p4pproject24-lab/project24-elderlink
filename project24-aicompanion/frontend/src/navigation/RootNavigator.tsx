import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { useRole } from '../hooks/useRole';
import { useProfileFlowStep } from '../contexts/ProfileFlowStepContext';
import { shouldShowProfileFlow } from '../services/userService';
import MainScreen from '../screens/Auth/MainScreen';
import RoleSelectionScreen from '../screens/Auth/RoleSelectionScreen';
import ProfileFlowScreen from '../screens/ProfileFlow/ProfileFlowScreen';
import AppNavigator from './AppNavigator';

const Stack = createNativeStackNavigator();

export type RootStackParamList = {
  ProfileFlow: undefined;
  AppTabs: undefined;
};

const RootNavigator: React.FC = () => {
  const { user, loading } = useAuth();
  const { role } = useRole();
  const { profileFlowCompleted, hasConnections, loading: profileFlowLoading } = useProfileFlowStep();
  const [shouldShowProfile, setShouldShowProfile] = useState(true);
  const [checkingProfileFlow, setCheckingProfileFlow] = useState(false);

  // Check if profile flow should be shown
  useEffect(() => {
    const checkProfileFlow = async () => {
      if (!user || !role || role === 'NONE') {
        setShouldShowProfile(true);
        return;
      }

      try {
        setCheckingProfileFlow(true);
        const shouldShow = await shouldShowProfileFlow();
        setShouldShowProfile(shouldShow);
        console.log('[RootNavigator] Should show profile flow:', shouldShow);
      } catch (error) {
        console.error('[RootNavigator] Error checking profile flow:', error);
        setShouldShowProfile(true); // Default to showing profile flow on error
      } finally {
        setCheckingProfileFlow(false);
      }
    };

    checkProfileFlow();
  }, [user?.id, role, profileFlowCompleted, hasConnections]);

  if (loading || profileFlowLoading || checkingProfileFlow) {
    // Optionally show a splash/loading screen here
    return null;
  }

  if (!user) {
    // Not authenticated: show main screen (login/Google/phone)
    return (
      <Stack.Navigator key="auth" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainScreen} />
      </Stack.Navigator>
    );
  }

  if (!role || role === 'NONE') {
    // Authenticated but no role: show role selection
    return (
      <Stack.Navigator key="role-selection" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      </Stack.Navigator>
    );
  }

  // Authenticated and has a role: show both screens but control initial route
  // Use user ID and role as key to force re-render when switching accounts
  const navigatorKey = `${user.id}-${role}`;
  return (
    <Stack.Navigator 
      key={navigatorKey} 
      screenOptions={{ headerShown: false }}
      initialRouteName={shouldShowProfile ? "ProfileFlow" : "AppTabs"}
    >
      <Stack.Screen name="ProfileFlow" component={ProfileFlowScreen} />
      <Stack.Screen name="AppTabs" component={AppNavigator} />
    </Stack.Navigator>
  );
};

export default RootNavigator; 