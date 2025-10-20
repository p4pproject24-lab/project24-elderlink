import { useWindowDimensions } from 'react-native';

export type FontSizeScale = 'small' | 'medium' | 'large';

export function useFontSizes(scale: FontSizeScale = 'medium') {
  const { width } = useWindowDimensions();
  // Use width as a proxy for device size
  const base = width < 360 ? 13 : width < 600 ? 15 : 16;
  const ratio = scale === 'small' ? 0.92 : scale === 'large' ? 1.12 : 1;
  return {
    heading1: base * 1.6 * ratio,
    heading2: base * 1.3 * ratio,
    body: base * 1.0 * ratio,
    caption: base * 0.85 * ratio,
    input: base * 1.0 * ratio,
    button: base * 1.05 * ratio,
  };
} 