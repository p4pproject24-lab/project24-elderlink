import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { TTSButton } from './TTSButton';
import { colors } from '../theme';

interface TTSWrapperProps {
  text: string;
  children: React.ReactNode;
  buttonSize?: number;
  buttonColor?: string;
  buttonPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  style?: ViewStyle;
  showButton?: boolean;
  onTTSStart?: () => void;
  onTTSStop?: () => void;
}

export const TTSWrapper: React.FC<TTSWrapperProps> = ({
  text,
  children,
  buttonSize = 20,
  buttonColor,
  buttonPosition = 'top-right',
  style,
  showButton = true,
  onTTSStart,
  onTTSStop,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      position: 'absolute',
      zIndex: 10,
    };

    // Calculate proper spacing based on button size
    const spacing = Math.max(12, buttonSize * 0.3); // At least 12px, or 30% of button size
    
    // Use separate padding for top and right
    // Account for Card component padding (24px)
    const topPadding = 20;
    const rightPadding = 8;

    switch (buttonPosition) {
      case 'top-right':
        return { ...baseStyle, top: topPadding, right: rightPadding };
      case 'top-left':
        return { ...baseStyle, top: topPadding, left: rightPadding };
      case 'bottom-right':
        return { ...baseStyle, bottom: topPadding, right: rightPadding };
      case 'bottom-left':
        return { ...baseStyle, bottom: topPadding, left: rightPadding };
      default:
        return { ...baseStyle, top: topPadding, right: rightPadding };
    }
  };

  const handleTTSStart = () => {
    onTTSStart?.();
  };

  const handleTTSStop = () => {
    onTTSStop?.();
  };

  return (
    <View style={[styles.container, style]}>
      {children}
      {showButton && (
        <TTSButton
          text={text}
          size={buttonSize}
          color={buttonColor}
          style={getButtonStyle()}
          onPress={handleTTSStart}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
});
