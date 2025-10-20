export interface AiChatAskRequest {
    message: string;
    location?: any;
  }
  
  export interface AiChatAskResponse {
    text: string;
  }
  
  export interface AiChatAskAvatarRequest {
    message: string;
    sessionId: string;
    voiceId?: string;
    location?: any;
  }
  
  export interface AiChatAskAvatarResponse {
    text: string;
    duration_ms?: number;
    task_id?: string;
    audio?: {
      sessionId: string;
      audioData: string;
      audioFormat: string;
      sampleRate: number;
      status: string;
      message: string;
    };
  } 