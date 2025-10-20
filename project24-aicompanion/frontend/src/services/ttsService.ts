// Web-based TTS fallback
let Speech: any = null;

// Try to use Web Speech API as fallback
const createWebTTS = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    return {
      speak: (text: string, options: any = {}) => {
        return new Promise<void>((resolve, reject) => {
          try {
            const utterance = new (window as any).SpeechSynthesisUtterance(text);
            utterance.lang = options.language || 'en-US';
            utterance.rate = options.rate || 0.9;
            utterance.pitch = options.pitch || 1.0;
            
            utterance.onend = () => {
              options.onDone?.();
              resolve();
            };
            
            utterance.onerror = (error: any) => {
              options.onError?.(error);
              reject(error);
            };
            
            utterance.onstart = () => {
              options.onStart?.();
            };
            
            (window as any).speechSynthesis.speak(utterance);
          } catch (error) {
            reject(error);
          }
        });
      },
      stop: () => {
        return new Promise<void>((resolve) => {
          (window as any).speechSynthesis.cancel();
          resolve();
        });
      },
      getAvailableVoicesAsync: () => {
        return Promise.resolve((window as any).speechSynthesis.getVoices() || []);
      }
    };
  }
  return null;
};

try {
  // Try expo-speech first
  Speech = require('expo-speech');
  console.log('[TTS] expo-speech loaded successfully:', !!Speech);
} catch (error) {
  console.warn('[TTS] expo-speech not available, trying web fallback:', error);
  // Fallback to web TTS
  Speech = createWebTTS();
  if (Speech) {
    console.log('[TTS] Web TTS fallback loaded successfully');
  } else {
    console.warn('[TTS] No TTS available');
  }
}

// English-only TTS service

export interface TTSService {
  speak: (text: string, options?: TTSSpeechOptions) => Promise<void>;
  stop: () => Promise<void>;
  isSpeaking: () => boolean;
  getAvailableVoices: () => Promise<any[]>;
  getCurrentLanguage: () => Promise<string>;
}

export interface TTSSpeechOptions {
  voice?: string;
  rate?: number;
  pitch?: number;
  language?: string;
  onStart?: () => void;
  onDone?: () => void;
  onError?: (error: string) => void;
}

class TTSServiceImpl implements TTSService {
  private isCurrentlySpeaking = false;
  private currentText = '';

  async speak(text: string, options: TTSSpeechOptions = {}): Promise<void> {
    try {
      // Check if Speech module is available
      if (!Speech) {
        throw new Error('Speech module not available');
      }

      // Stop any currently playing speech
      await this.stop();

      this.currentText = text;
      this.isCurrentlySpeaking = true;

      // Use English only
      const language = options.language || 'en-US';

      const speechOptions: any = {
        voice: options.voice,
        rate: options.rate || 0.9,
        pitch: options.pitch || 1.0,
        language: language,
        onStart: () => {
          console.log('[TTS] Started speaking in', language + ':', text.substring(0, 50) + '...');
          options.onStart?.();
        },
        onDone: () => {
          console.log('[TTS] Finished speaking');
          this.isCurrentlySpeaking = false;
          this.currentText = '';
          options.onDone?.();
        },
        onError: (error: any) => {
          console.error('[TTS] Error:', error);
          this.isCurrentlySpeaking = false;
          this.currentText = '';
          options.onError?.(error.error || 'Speech synthesis failed');
        },
      };

      await Speech.speak(text, speechOptions);
    } catch (error) {
      console.error('[TTS] Error starting speech:', error);
      this.isCurrentlySpeaking = false;
      this.currentText = '';
      throw error;
    }
  }

  async getCurrentLanguage(): Promise<string> {
    return 'en-US';
  }

  async stop(): Promise<void> {
    try {
      if (!Speech) {
        console.warn('[TTS] Speech module not available for stop');
        return;
      }
      await Speech.stop();
      this.isCurrentlySpeaking = false;
      this.currentText = '';
      console.log('[TTS] Stopped speaking');
    } catch (error) {
      console.error('[TTS] Error stopping speech:', error);
    }
  }

  isSpeaking(): boolean {
    return this.isCurrentlySpeaking;
  }

  async getAvailableVoices(): Promise<any[]> {
    try {
      if (!Speech) {
        console.warn('[TTS] Speech module not available for getting voices');
        return [];
      }
      return await Speech.getAvailableVoicesAsync();
    } catch (error) {
      console.error('[TTS] Error getting available voices:', error);
      return [];
    }
  }
}

// Create a singleton instance
export const ttsService = new TTSServiceImpl();
