import React from 'react';
import { TouchableOpacity, ViewStyle, StyleProp, ActivityIndicator, View } from 'react-native';
import { useColorScheme } from 'react-native';
import { colors, metrics, spacing, ThemeMode } from '../../theme';
import Text from './Text';
import type { ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary';

interface Props {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  icon?: ReactNode;
}

const Button: React.FC<Props> = ({
  title,
  onPress,
  variant = 'primary',
  fullWidth = true,
  style,
  loading = false,
  disabled = false,
  accessibilityLabel,
  icon,
}) => {
  const colorScheme = useColorScheme();
  const theme: ThemeMode = colorScheme === 'dark' ? 'dark' : 'light';
  const palette = colors[theme];
  const backgroundColor =
    variant === 'primary' ? palette.primary : palette.surface;
  const textColor = variant === 'primary' ? palette.surface : palette.primary;
  const borderColor = variant === 'secondary' ? palette.primary : 'transparent';

  return (
    <TouchableOpacity
      style={[
        {
          backgroundColor,
          borderRadius: metrics.buttonRadius,
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.xl,
          alignItems: 'center',
          justifyContent: 'center',
          width: fullWidth ? '100%' : undefined,
          opacity: disabled ? 0.6 : 1,
          flexDirection: 'row',
          borderWidth: variant === 'secondary' ? 2 : 0,
          borderColor,
          ...metrics.shadow[theme],
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      activeOpacity={0.85}
    >
      {icon && <View style={{ marginRight: spacing.md }}>{icon}</View>}
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text variant="button" style={{ color: textColor, fontWeight: 700 }}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default Button; 