import { useState, useEffect, useCallback } from 'react';
import Voice from '@react-native-voice/voice';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SPEECH_LANGUAGE_KEY = 'speech_language_preference';

export function useSpeechToText(locale?: string) {
  const [isListening, setIsListening] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en-US');

  // Load saved language preference on mount
  useEffect(() => {
    const loadLanguagePreference = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(SPEECH_LANGUAGE_KEY);
        if (savedLanguage) {
          setSelectedLanguage(savedLanguage);
        } else if (locale) {
          // Use passed locale if no saved preference
          setSelectedLanguage(locale);
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
        // Fallback to default
        setSelectedLanguage(locale || 'en-US');
      }
    };
    
    loadLanguagePreference();
  }, [locale]);

  // Save language preference
  const saveLanguagePreference = async (language: string) => {
    try {
      await AsyncStorage.setItem(SPEECH_LANGUAGE_KEY, language);
      setSelectedLanguage(language);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  // Start listening
  const startListening = useCallback(async () => {
    setError(null);
    setInput('');
    try {
      await Voice.start(selectedLanguage);
      setIsListening(true);
    } catch (e: any) {
      setError(e?.message || 'Could not start speech recognition');
      setIsListening(false);
    }
  }, [selectedLanguage]);

  // Stop listening
  const stopListening = useCallback(async () => {
    try {
      await Voice.stop();
    } catch (e: any) {
      setError(e?.message || 'Could not stop speech recognition');
    }
    setIsListening(false);
  }, []);

  // Reset input
  const reset = useCallback(() => {
    setInput('');
    setError(null);
  }, []);

  useEffect(() => {
    Voice.onSpeechStart = () => setIsListening(true);
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechResults = (e) => {
      if (e.value && e.value.length > 0) {
        setInput(e.value[0]);
      }
    };
    Voice.onSpeechPartialResults = (e) => {
      if (e.value && e.value.length > 0) {
        setInput(e.value[0]);
      }
    };
    Voice.onSpeechError = (e) => {
      const msg = e.error?.message || 'Speech recognition error';
      // Suppress common benign errors
      if (
        msg.toLowerCase().includes('no match') ||
        msg.toLowerCase().includes('timeout') ||
        msg.toLowerCase().includes('no speech')
      ) {
        setError(null);
      } else {
        setError(msg);
      }
      setIsListening(false);
    };
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  return {
    isListening,
    input,
    error,
    selectedLanguage,
    startListening,
    stopListening,
    reset,
    setInput, // expose for manual input changes
    saveLanguagePreference, // expose for language selection
  };
} 