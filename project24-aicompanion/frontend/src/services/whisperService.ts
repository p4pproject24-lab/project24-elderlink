import api from '../lib/api';
import { getCurrentNetworkConfig } from '../utils/networkUtils';

let WHISPER_API_URL: string | null = null;

async function getWhisperURL(): Promise<string> {
  if (!WHISPER_API_URL) {
    try {
      const networkConfig = await getCurrentNetworkConfig();
      WHISPER_API_URL = networkConfig.whisperUrl;
    } catch (error) {
      console.error('[WhisperService] Failed to get network config:', error);
      WHISPER_API_URL = process.env.EXPO_PUBLIC_WHISPER_API_URL || 'http://localhost:8001';
    }
  }
  return WHISPER_API_URL;
}

export interface WhisperTranscriptionResponse {
  text: string;
  language: string;
  confidence?: number;
}

export interface SupportedLanguagesResponse {
  languages: Record<string, string>;
  total_count: number;
  note: string;
}

export const whisperService = {
  /**
   * Transcribe audio file using Whisper with automatic language detection
   */
  async transcribeAudio(audioFile: File, language?: string): Promise<WhisperTranscriptionResponse> {
    const whisperURL = await getWhisperURL();
    const formData = new FormData();
    formData.append('file', audioFile);
    
    if (language) {
      formData.append('language', language);
    }

    const response = await fetch(`${whisperURL}/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Whisper API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  },

  /**
   * Transcribe base64 audio data using Whisper (for React Native)
   */
  async transcribeAudioBase64(audioData: string, filename: string): Promise<WhisperTranscriptionResponse> {
    const whisperURL = await getWhisperURL();
    const response = await fetch(`${whisperURL}/transcribe-base64`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_data: audioData,
        filename: filename,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Whisper API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  },

  /**
   * Get health status of the Whisper service
   */
  async getHealth(): Promise<{ status: string; service: string }> {
    const whisperURL = await getWhisperURL();
    const response = await fetch(`${whisperURL}/health`);
    
    if (!response.ok) {
      throw new Error(`Whisper health check failed: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Get list of supported languages
   */
  async getSupportedLanguages(): Promise<SupportedLanguagesResponse> {
    const whisperURL = await getWhisperURL();
    const response = await fetch(`${whisperURL}/supported-languages`);
    
    if (!response.ok) {
      throw new Error(`Failed to get supported languages: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Check if Whisper service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.getHealth();
      return true;
    } catch (error) {
      console.warn('[WhisperService] Service not available:', error);
      return false;
    }
  },
};
