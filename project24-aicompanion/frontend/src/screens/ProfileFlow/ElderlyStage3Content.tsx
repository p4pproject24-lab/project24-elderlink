import React from 'react';
import { View } from 'react-native';
import Text from '../../components/ui/Text';
import { spacing, colors, metrics } from '../../theme';
import { useColorScheme } from 'react-native';

const ElderlyStage3Content: React.FC = () => {
  const colorScheme = useColorScheme();
  const palette = colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <View style={{ width: '100%', alignItems: 'center' }}>
      <View style={{ width: spacing.xxl * 5.5, height: spacing.xxl * 5.5, backgroundColor: palette.border, borderRadius: metrics.cardRadius, marginBottom: spacing.lg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: palette.textSecondary }}>[QR Code Here]</Text>
      </View>
      <Text style={{ marginBottom: spacing.lg, textAlign: 'center', color: palette.textSecondary }}>
        Show this QR code to your caregiver so they can scan and sync with you.
      </Text>
    </View>
  );
};

export default ElderlyStage3Content; 