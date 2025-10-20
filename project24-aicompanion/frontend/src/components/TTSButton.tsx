import React, { useCallback, useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTTSContext } from '../contexts/TTSContext';
import { colors, ThemeMode } from '../theme';

interface TTSButtonProps {
  text: string;
  size?: number;
  color?: string;
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
}

export const TTSButton: React.FC<TTSButtonProps> = ({
  text,
  size = 24,
  color,
  style,
  onPress,
  disabled = false,
}) => {
  const colorScheme = useColorScheme();
  const theme: ThemeMode = colorScheme === 'dark' ? 'dark' : 'light';
  const palette = colors[theme];
  const { speak, stop, isCurrentTextSpeaking } = useTTSContext();
  
  const isThisTextSpeaking = isCurrentTextSpeaking(text);
  
  // Check if TTS is available by trying to access the service
  const [isTTSAvailable, setIsTTSAvailable] = useState(true);
  
  useEffect(() => {
    const checkTTSAvailability = async () => {
      try {
        // Avoid dynamic import in tests; require synchronously
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { ttsService } = require('../services/ttsService');
        await ttsService.getCurrentLanguage();
        setIsTTSAvailable(true);
      } catch (error) {
        console.warn('[TTSButton] TTS not available:', error);
        setIsTTSAvailable(false);
      }
    };
    
    checkTTSAvailability();
  }, []);
  
  const handlePress = useCallback(async () => {
    if (disabled || !isTTSAvailable) return;
    
    try {
      if (isThisTextSpeaking) {
        // If this text is currently speaking, stop it
        await stop();
      } else {
        // Stop any currently playing speech first
        await stop();
        // Then speak this text
        await speak(text);
      }
      
      // Call the optional onPress callback
      onPress?.();
    } catch (error) {
      console.error('[TTSButton] Error handling press:', error);
    }
  }, [text, isThisTextSpeaking, speak, stop, onPress, disabled, isTTSAvailable]);

  // Determine icon and color
  const getIconName = () => {
    return isThisTextSpeaking ? 'stop-circle' : 'volume-high';
  };

  const getIconColor = () => {
    if (disabled || !isTTSAvailable) {
      return colors.light.textSecondary;
    }
    return isThisTextSpeaking ? colors.light.error : (color || colors.light.primary);
  };



    return (
    <TouchableOpacity testID="tts-button"
      key={`${isThisTextSpeaking}`}
      style={[
        styles.button,
        {
          width: size + 16,
          height: size + 16,
          opacity: (disabled || !isTTSAvailable) ? 0.5 : 1,
          backgroundColor: isThisTextSpeaking ? 'rgba(239, 68, 68, 0.1)' : palette.cardHighlight,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        },
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || !isTTSAvailable}
      activeOpacity={0.7}
    >
      <Ionicons
        name={getIconName() as any}
        size={size}
        color={getIconColor()}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
  },
});
