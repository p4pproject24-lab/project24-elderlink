import { useState, useCallback, useEffect, useRef } from 'react';
import { ttsService, TTSSpeechOptions } from '../services/ttsService';

interface UseTTSReturn {
  isSpeaking: boolean;
  currentText: string;
  speak: (text: string, options?: TTSSpeechOptions) => Promise<void>;
  stop: () => Promise<void>;
  isCurrentTextSpeaking: (text: string) => boolean;
}

// Global state to track which text is currently being spoken
let globalCurrentText = '';
let globalIsSpeaking = false;

export function useTTS(): UseTTSReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const speak = useCallback(async (text: string, options?: TTSSpeechOptions) => {
    try {
      // If the same text is already being spoken, stop it
      if (globalCurrentText === text && globalIsSpeaking) {
        await ttsService.stop();
        return;
      }

      // Stop any currently playing speech
      await ttsService.stop();

      // Update global state immediately
      globalCurrentText = text;
      globalIsSpeaking = true;

      // Update local state immediately
      if (mountedRef.current) {
        setCurrentText(text);
        setIsSpeaking(true);
      }

      // Use English only
      const ttsOptions = {
        ...options,
        language: options?.language || 'en-US',
        onStart: () => {
          options?.onStart?.();
        },
        onDone: () => {
          // Only reset state if this is the current text (not from a previous stop)
          if (globalCurrentText === text) {
            if (mountedRef.current) {
              setIsSpeaking(false);
              setCurrentText('');
            }
            globalIsSpeaking = false;
            globalCurrentText = '';
          }
          options?.onDone?.();
        },
        onError: (error: any) => {
          // Only reset state if this is the current text (not from a previous stop)
          if (globalCurrentText === text) {
            if (mountedRef.current) {
              setIsSpeaking(false);
              setCurrentText('');
            }
            globalIsSpeaking = false;
            globalCurrentText = '';
          }
          options?.onError?.(error);
        },
      };

      // Start speaking with callbacks
      await ttsService.speak(text, ttsOptions);
    } catch (error) {
      console.error('[useTTS] Error speaking:', error);
      if (mountedRef.current) {
        setIsSpeaking(false);
        setCurrentText('');
      }
      globalIsSpeaking = false;
      globalCurrentText = '';
      throw error;
    }
  }, []);

  const stop = useCallback(async () => {
    try {
      await ttsService.stop();
      // Update global state immediately
      globalIsSpeaking = false;
      globalCurrentText = '';
      // Update local state
      if (mountedRef.current) {
        setIsSpeaking(false);
        setCurrentText('');
      }
    } catch (error) {
      console.error('[useTTS] Error stopping:', error);
      // Even if there's an error, reset the state
      globalIsSpeaking = false;
      globalCurrentText = '';
      if (mountedRef.current) {
        setIsSpeaking(false);
        setCurrentText('');
      }
    }
  }, []);

  const isCurrentTextSpeaking = useCallback((text: string) => {
    const result = globalCurrentText === text && globalIsSpeaking;
    return result;
  }, []);

  return {
    isSpeaking,
    currentText,
    speak,
    stop,
    isCurrentTextSpeaking,
  };
}
