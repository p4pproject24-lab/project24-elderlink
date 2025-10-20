import React from 'react';
import { View } from 'react-native';
import Text from '../../components/ui/Text';
import { spacing, colors, metrics } from '../../theme';
import { useColorScheme } from 'react-native';

const CaregiverStage2Content: React.FC = () => {
  const colorScheme = useColorScheme();
  const palette = colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <View style={{ width: '100%', alignItems: 'center' }}>
      <View style={{ width: spacing.xxl * 5.5, height: spacing.xxl * 5.5, backgroundColor: palette.border, borderRadius: metrics.cardRadius, marginBottom: spacing.lg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: palette.textSecondary }}>[QR Scanner Here]</Text>
      </View>
      <Text style={{ marginBottom: spacing.lg, textAlign: 'center', color: palette.textSecondary }}>
        Use your camera to scan the QR code from the elderly user's device to sync.
      </Text>
    </View>
  );
};

export default CaregiverStage2Content; 