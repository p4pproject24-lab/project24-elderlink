import React from 'react';
import { TextInput as RNTextInput, TextInputProps, StyleProp, View, ViewStyle } from 'react-native';
import { useColorScheme } from 'react-native';
import { colors, spacing, metrics, ThemeMode } from '../../theme';
import Text from './Text';

interface Props extends TextInputProps {
  containerStyle?: StyleProp<ViewStyle>;
  error?: string;
}

const TextInput: React.FC<Props> = ({ containerStyle, error, style, ...rest }) => {
  const colorScheme = useColorScheme();
  const theme: ThemeMode = colorScheme === 'dark' ? 'dark' : 'light';
  const palette = colors[theme];
  return (
    <View style={containerStyle}>
      <RNTextInput
        style={[
          {
            backgroundColor: palette.surface,
            color: palette.textPrimary,
            borderRadius: metrics.borderRadius,
            borderWidth: 1,
            borderColor: error ? palette.error : palette.border,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
            marginBottom: spacing.md,
            // fontSize is now controlled by parent via style
          },
          style,
        ]}
        placeholderTextColor={palette.textSecondary}
        {...rest}
      />
      {!!error && (
        <Text style={{ color: palette.error, fontSize: 12, marginTop: -spacing.xs, marginBottom: spacing.xs }}>
          {error}
        </Text>
      )}
    </View>
  );
};

export default TextInput; 