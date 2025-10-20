import { useWindowDimensions } from 'react-native';

export type IconSizeScale = 'small' | 'medium' | 'large';

export function useIconSizes(scale: IconSizeScale = 'medium') {
  const { width } = useWindowDimensions();
  // Use width as a proxy for device size
  const base = width < 360 ? 18 : width < 600 ? 22 : 24;
  const ratio = scale === 'small' ? 0.85 : scale === 'large' ? 1.18 : 1;
  return {
    xs: base * 0.7 * ratio,
    sm: base * 0.85 * ratio,
    md: base * 1.0 * ratio,
    lg: base * 1.25 * ratio,
    xl: base * 1.5 * ratio,
  };
} 