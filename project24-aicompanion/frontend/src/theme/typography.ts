import { colors, ThemeMode } from './colors';
import { useFontSizes, FontSizeScale } from './fontSizes';
import { Platform, TextStyle } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export function useTypography(theme: ThemeMode = 'light', scale: FontSizeScale = 'medium') {
  const fontSizes = useFontSizes(scale);
  const palette = colors[theme];
  return {
    heading1: {
      fontFamily,
      fontSize: fontSizes.heading1,
      fontWeight: 700 as TextStyle['fontWeight'],
      color: palette.textPrimary,
      lineHeight: fontSizes.heading1 * 1.2,
    },
    heading2: {
      fontFamily,
      fontSize: fontSizes.heading2,
      fontWeight: 600 as TextStyle['fontWeight'],
      color: palette.textPrimary,
      lineHeight: fontSizes.heading2 * 1.2,
    },
    body: {
      fontFamily,
      fontSize: fontSizes.body,
      fontWeight: 400 as TextStyle['fontWeight'],
      color: palette.textPrimary,
      lineHeight: fontSizes.body * 1.4,
    },
    caption: {
      fontFamily,
      fontSize: fontSizes.caption,
      fontWeight: 400 as TextStyle['fontWeight'],
      color: palette.textSecondary,
      lineHeight: fontSizes.caption * 1.3,
    },
    button: {
      fontFamily,
      fontSize: fontSizes.button,
      fontWeight: 600 as TextStyle['fontWeight'],
      color: palette.surface,
      lineHeight: fontSizes.button * 1.2,
      textAlign: 'center',
    },
    input: {
      fontFamily,
      fontSize: fontSizes.input,
      fontWeight: 400 as TextStyle['fontWeight'],
      color: palette.textPrimary,
      lineHeight: fontSizes.input * 1.3,
    },
  };
} 