export interface GameSession {
  id: string;
  userId: string;
  title: string;
  description: string;
  gameType: string;
  userDescription?: string;
  createdAt: string;
  lastActivityAt: string;
}

export interface GameMessage {
  id: string;
  gameSessionId: string;
  userId: string;
  text: string;
  fromUser: boolean;
  timestamp: string;
}

export interface GamePreview {
  title: string;
  description: string;
}

export interface CreateGameRequest {
  gameType: 'generated' | 'custom';
  userDescription: string;
}

export interface SendGameMessageRequest {
  message: string;
}

export interface GameSessionListResponse {
  sessions: GameSession[];
}

export interface GameMessagesResponse {
  messages: GameMessage[];
}
