import React from 'react';
import { Image, View, useColorScheme, Dimensions, StatusBar } from 'react-native';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Text from '../../components/ui/Text';
import Button from '../../components/ui/Button';
import { spacing, metrics, colors } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { useAuthContext } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useIconSizes } from '../../theme';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Modern Google Sign-In Button Component
const GoogleSignInButton = () => {
  const { signInWithGoogle, loading, error, user, response } = useFirebaseAuth();
  const { refresh } = useAuthContext();
  const [localError, setLocalError] = React.useState<string | null>(null);
  const colorScheme = useColorScheme();
  const palette = colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const handleGoogleLogin = async () => {
    setLocalError(null);
    try {
      await signInWithGoogle();
      await refresh();
    } catch (e: any) {
      setLocalError(e.message || 'Sign-in failed');
    }
  };

  React.useEffect(() => {
    if (user) {
      // Log user info after sign in
    } else if (response && response.type !== 'success') {
    }
  }, [user, response]);

  return (
    <View style={{ width: '100%' }}>
      <Button
        title={loading ? 'Signing in...' : 'Continue with Google'}
        onPress={handleGoogleLogin}
        variant="secondary"
        fullWidth
        loading={loading}
        style={{
          height: 56,
          borderRadius: 16,
          backgroundColor: palette.surface,
          borderColor: palette.border,
          borderWidth: 1.5,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: palette.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 8,
        }}
        disabled={loading}
        accessibilityLabel="Continue with Google"
        icon={
          <Image
            source={require('../../assets/images/googlelogo.png')}
            style={{ width: 24, height: 24, marginRight: spacing.md }}
            resizeMode="contain"
          />
        }
      />
      {(error || localError) && (
        <View style={{ 
          marginTop: spacing.md, 
          padding: spacing.md, 
          backgroundColor: palette.error + '10', 
          borderRadius: 12,
          borderWidth: 1,
          borderColor: palette.error + '20'
        }}>
          <Text variant="body" style={{ color: palette.error, textAlign: 'center', fontSize: 14 }}>
            {error || localError}
          </Text>
        </View>
      )}
    </View>
  );
};

type AuthStackParamList = {
  Main: undefined;
  Login: undefined;
  RoleSelection: undefined;
  ElderlyHome: undefined;
  CaregiverHome: undefined;
};

const MainScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const colorScheme = useColorScheme();
  const palette = colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <ScreenContainer>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Hero Section with Logo */}
      <View style={{ 
        flex: 1, 
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xxl * 2,
        paddingBottom: spacing.xl,
      }}>
        {/* App Logo */}
        <View style={{
          width: 120,
          height: 120,
          borderRadius: 30,
          backgroundColor: palette.primary + '15',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: spacing.xxl,
          shadowColor: palette.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 16,
          elevation: 12,
          // Ensure no overflow
          overflow: 'hidden',
        }}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
            }}
            resizeMode="cover"
          />
        </View>

        {/* App Name */}
        <Text variant="heading1" style={{ 
          textAlign: 'center', 
          marginBottom: spacing.md,
          color: palette.primary,
          fontWeight: '700',
          fontSize: 36,
          letterSpacing: -0.5,
          // Ensure text is properly positioned and not clipped
          includeFontPadding: false,
          textAlignVertical: 'center',
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
        }}>
          ElderLink
        </Text>

        {/* Tagline */}
        <Text variant="body" style={{ 
          textAlign: 'center', 
          color: palette.textSecondary, 
          marginBottom: spacing.xxl,
          fontSize: 18,
          lineHeight: 26,
          maxWidth: width * 0.8,
        }}>
          Your AI-powered companion for elderly care and family connection
        </Text>

        {/* Feature Highlights */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          width: '100%',
          marginBottom: spacing.xxl * 2,
          paddingHorizontal: spacing.lg,
        }}>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: palette.primary + '20',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: spacing.sm,
            }}>
              <Ionicons name="heart" size={24} color={palette.primary} />
            </View>
            <Text style={{ 
              fontSize: 12, 
              color: palette.textSecondary, 
              textAlign: 'center',
              fontWeight: '500'
            }}>
              AI Companion
            </Text>
          </View>

          <View style={{ alignItems: 'center', flex: 1 }}>
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: palette.success + '20',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: spacing.sm,
            }}>
              <Ionicons name="shield-checkmark" size={24} color={palette.success} />
            </View>
            <Text style={{ 
              fontSize: 12, 
              color: palette.textSecondary, 
              textAlign: 'center',
              fontWeight: '500'
            }}>
              Safety First
            </Text>
          </View>

          <View style={{ alignItems: 'center', flex: 1 }}>
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: palette.accent + '20',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: spacing.sm,
            }}>
              <Ionicons name="people" size={24} color={palette.accent} />
            </View>
            <Text style={{ 
              fontSize: 12, 
              color: palette.textSecondary, 
              textAlign: 'center',
              fontWeight: '500'
            }}>
              Family Connect
            </Text>
          </View>
        </View>
      </View>

      {/* Sign In Section */}
      <View style={{ 
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.xxl * 2,
      }}>
        <GoogleSignInButton />
        
        {/* Terms and Privacy */}
        <Text style={{ 
          textAlign: 'center', 
          color: palette.textSecondary, 
          marginTop: spacing.xl,
          fontSize: 12,
          lineHeight: 18,
        }}>
          By continuing, you agree to our{' '}
          <Text style={{ color: palette.primary, fontWeight: '600' }}>
            Terms of Service
          </Text>
          {' '}and{' '}
          <Text style={{ color: palette.primary, fontWeight: '600' }}>
            Privacy Policy
          </Text>
        </Text>
      </View>
    </ScreenContainer>
  );
};

export default MainScreen; 