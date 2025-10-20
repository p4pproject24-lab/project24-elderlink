export interface HeyGenSessionRequest {
  avatarId: string;
  version?: string;
  voice?: {
    voiceId?: string;
    rate?: number;
  };
  disableIdleTimeout?: boolean;
  activityIdleTimeout?: number;
}
  
  export interface HeyGenStartSessionRequest {
    sessionId: string;
  }
  
  export interface HeyGenAudioRequest {
    sessionId: string;
    audioData: string; // base64
    audioFormat?: string;
    sampleRate?: number;
  }
  
  export interface HeyGenTextToSpeechRequest {
    sessionId: string;
    text: string;
    voiceId: string;
    speed?: number;
    pitch?: number;
  }
  
  export interface HeyGenSessionResponse {
    sessionId: string;
    token: string;
    status: string;
    avatarId: string;
    version: string;
    url?: string; // LiveKit websocket URL for streaming
    accessToken?: string; // LiveKit access token
  }
  
  export interface HeyGenAudioResponse {
    sessionId: string;
    audioData: string; // base64
    audioFormat: string;
    sampleRate: number;
    status: string;
    message: string;
  } 