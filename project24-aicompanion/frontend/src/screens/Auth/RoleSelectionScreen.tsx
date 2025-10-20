import React from 'react';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Card from '../../components/ui/Card';
import Text from '../../components/ui/Text';
import Button from '../../components/ui/Button';
import { spacing, colors } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useIconSizes } from '../../theme/iconSizes';
import { useColorScheme } from 'react-native';
import Header from '../../components/ui/Header';
import { useRole } from '../../hooks/useRole';
import { View } from 'react-native';

type AuthStackParamList = {
  Main: undefined;
  Login: undefined;
  RoleSelection: undefined;
  ElderlyHome: undefined;
  CaregiverHome: undefined;
};

const RoleSelectionScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const iconSizes = useIconSizes('large');
  const colorScheme = useColorScheme();
  const palette = colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const cardStyle = {
    borderWidth: 4,
    borderColor: palette.border,
    marginBottom: spacing.sm,
    backgroundColor: palette.card,
  };
  const { setRole, loading } = useRole();

  const handleSelectRole = async (role: 'ELDERLY' | 'CAREGIVER') => {
    await setRole(role);
    // No manual navigation needed; AppNavigator will handle it based on the updated role.
  };

  return (
    <ScreenContainer
      scrollable
      header={
        <View style={{ marginTop: spacing.xl }}>
          <View style={{ alignItems: 'center' }}>
            <Text variant="heading1" style={{ textAlign: 'center', marginBottom: spacing.xs }}>
              Let's get started
            </Text>
            <Text variant="heading2" style={{ textAlign: 'center', color: palette.textSecondary }}>
              What describes you best?
            </Text>
          </View>
        </View>
      }
    >
      <View style={{ marginTop: spacing.xl }}>
        <Card style={cardStyle}>
          <Ionicons name="hand-left-outline" size={iconSizes.xl} color="#22c55e" style={{ alignSelf: 'center', marginBottom: spacing.lg }} />
          <Text variant="heading2" style={{ textAlign: 'center', marginBottom: spacing.sm }}>
            I want to receive care from someone I trust.
          </Text>
          <Text variant="body" style={{ textAlign: 'center', color: '#64748b', marginBottom: spacing.xl }}>
            Connect with your loved ones or trusted contacts and let them support your wellbeing from home.
          </Text>
          <Button
            title="Join as Care Recipient"
            onPress={() => handleSelectRole('ELDERLY')}
            accessibilityLabel="Select Care Recipient"
            variant="primary"
            disabled={loading}
          />
        </Card>
        <Card style={cardStyle}>
          <Ionicons name="medkit-outline" size={iconSizes.xl} color="#22c55e" style={{ alignSelf: 'center', marginBottom: spacing.lg }} />
          <Text variant="heading2" style={{ textAlign: 'center', marginBottom: spacing.sm }}>
            I want to care for my loved ones.
          </Text>
          <Text variant="body" style={{ textAlign: 'center', color: '#64748b', marginBottom: spacing.xl }}>
            Support and monitor your family members' health and wellbeing, all from one place.
          </Text>
          <Button
            title="Join as Caregiver"
            onPress={() => handleSelectRole('CAREGIVER')}
            accessibilityLabel="Select Caregiver"
            variant="primary"
            disabled={loading}
          />
        </Card>
      </View>
    </ScreenContainer>
  );
};

export default RoleSelectionScreen; 