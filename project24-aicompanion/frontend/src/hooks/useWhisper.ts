import { useState, useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { getCurrentNetworkConfig } from '../utils/networkUtils';

interface WhisperResponse {
  text: string;
  language: string;
  confidence?: number;
}

interface UseWhisperReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  transcribedText: string;
  detectedLanguage: string;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  reset: () => void;
}

let WHISPER_API_URL: string | null = null;

export function useWhisper(): UseWhisperReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const audioUriRef = useRef<string | null>(null);

  // Initialize Whisper API URL
  useEffect(() => {
    async function initWhisperURL() {
      if (!WHISPER_API_URL) {
        try {
          const networkConfig = await getCurrentNetworkConfig();
          WHISPER_API_URL = networkConfig.whisperUrl;
          console.log('[Whisper] Using API URL:', WHISPER_API_URL);
        } catch (error) {
          console.error('[Whisper] Failed to get network config:', error);
          WHISPER_API_URL = process.env.EXPO_PUBLIC_WHISPER_API_URL || 'http://localhost:8001';
        }
      }
    }
    initWhisperURL();
  }, []);

  const reset = useCallback(() => {
    setTranscribedText('');
    setDetectedLanguage('');
    setError(null);
    setIsTranscribing(false);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      reset();

      // Request permissions
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        throw new Error('Audio recording permission not granted');
      }

      // Configure audio recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        staysActiveInBackground: false,
        playThroughEarpieceAndroid: false,
      });

      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);
      console.log('[Whisper] Started recording');

    } catch (err: any) {
      console.error('[Whisper] Error starting recording:', err);
      setError(err.message || 'Failed to start recording');
      setIsRecording(false);
    }
  }, [reset]);

  const stopRecording = useCallback(async () => {
    try {
      if (!recordingRef.current) {
        throw new Error('No active recording');
      }

      console.log('[Whisper] Stopping recording...');
      
      // Stop recording
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      
      if (!uri) {
        throw new Error('Failed to get recording URI');
      }

      audioUriRef.current = uri;
      setIsRecording(false);
      setIsTranscribing(true);

      console.log('[Whisper] Recording stopped, starting transcription...');

      // Transcribe the audio and return the result
      const result = await transcribeAudio(uri);
      return result;

    } catch (err: any) {
      console.error('[Whisper] Error stopping recording:', err);
      setError(err.message || 'Failed to stop recording');
      setIsRecording(false);
      setIsTranscribing(false);
      return null;
    }
  }, []);

  const transcribeAudio = useCallback(async (audioUri: string): Promise<string | null> => {
    try {
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        throw new Error('Audio file not found');
      }

      // Read the file as base64
      const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log('[Whisper] Sending audio to Whisper API...');

      // Ensure we have the API URL
      if (!WHISPER_API_URL) {
        const networkConfig = await getCurrentNetworkConfig();
        WHISPER_API_URL = networkConfig.whisperUrl;
      }

      // Send to Whisper API with base64 data
      const response = await fetch(`${WHISPER_API_URL}/transcribe-base64`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio_data: base64Audio,
          filename: 'recording.wav'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Whisper API error: ${response.status} - ${errorText}`);
      }

      const result: WhisperResponse = await response.json();
      
      console.log('[Whisper] Transcription completed:', {
        text: result.text,
        language: result.language,
        confidence: result.confidence,
      });

      setTranscribedText(result.text);
      setDetectedLanguage(result.language);
      setIsTranscribing(false);

      return result.text;

    } catch (err: any) {
      console.error('[Whisper] Transcription error:', err);
      setError(err.message || 'Failed to transcribe audio');
      setIsTranscribing(false);
      return null;
    }
  }, []);

  return {
    isRecording,
    isTranscribing,
    transcribedText,
    detectedLanguage,
    error,
    startRecording,
    stopRecording,
    reset,
  };
}
