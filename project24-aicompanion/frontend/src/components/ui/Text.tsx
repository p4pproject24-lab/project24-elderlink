import React from 'react';
import { Text as RNText, TextProps, StyleProp, TextStyle } from 'react-native';
import { useColorScheme } from 'react-native';
import { useTypography, ThemeMode, FontSizeScale } from '../../theme';

export type TextVariant = 'heading1' | 'heading2' | 'body' | 'caption' | 'button' | 'input';

interface Props extends TextProps {
  variant?: TextVariant;
  scale?: FontSizeScale;
  style?: StyleProp<TextStyle>;
}

const Text: React.FC<Props> = ({ variant = 'body', scale = 'medium', style, ...rest }) => {
  const colorScheme = useColorScheme();
  const theme: ThemeMode = colorScheme === 'dark' ? 'dark' : 'light';
  const typography = useTypography(theme, scale);
  return (
    <RNText style={[typography[variant], style]} {...rest} />
  );
};

export default Text; 