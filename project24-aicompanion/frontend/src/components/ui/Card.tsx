import React from 'react';
import { View, StyleProp, ViewStyle, useColorScheme } from 'react-native';
import { colors, metrics, spacing, ThemeMode } from '../../theme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  highlight?: boolean;
}

const Card: React.FC<Props> = ({ children, style, highlight = false }) => {
  const colorScheme = useColorScheme();
  const theme: ThemeMode = colorScheme === 'dark' ? 'dark' : 'light';
  const palette = colors[theme];
  return (
    <View
      style={[
        {
          backgroundColor: highlight ? palette.cardHighlight : palette.card,
          borderRadius: metrics.cardRadius,
          padding: spacing.xl,
          marginVertical: spacing.md,
          ...metrics.shadow[theme],
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export default Card; 