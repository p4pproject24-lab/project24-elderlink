import api from '../lib/api';
import type {
  GameSession,
  GameMessage,
  GamePreview,
  CreateGameRequest,
  SendGameMessageRequest,
} from '../types/Game';

export class GameService {
  /**
   * Generate a game preview without creating a session
   */
  static async generateGamePreview(userId: string): Promise<GamePreview> {
    const apiInstance = await api();
    const response = await apiInstance.post('/games/preview', null, {
      params: { userId },
    });
    return response.data;
  }

  /**
   * Create a new game session
   */
  static async createGameSession(
    userId: string,
    request: CreateGameRequest
  ): Promise<GameSession> {
    const apiInstance = await api();
    const response = await apiInstance.post('/games/create', request, {
      params: { userId },
    });
    return response.data;
  }

  /**
   * Get all game sessions for a user
   */
  static async getUserGameSessions(userId: string): Promise<GameSession[]> {
    const apiInstance = await api();
    const response = await apiInstance.get('/games/sessions', {
      params: { userId },
    });
    return response.data;
  }

  /**
   * Get a specific game session
   */
  static async getGameSession(sessionId: string): Promise<GameSession> {
    const apiInstance = await api();
    const response = await apiInstance.get(`/games/sessions/${sessionId}`);
    return response.data;
  }

  /**
   * Send a message in a game session and get AI response
   */
  static async sendGameMessage(
    sessionId: string,
    userId: string,
    request: SendGameMessageRequest
  ): Promise<string> {
    const apiInstance = await api();
    const response = await apiInstance.post(
      `/games/sessions/${sessionId}/message`,
      request,
      {
        params: { userId },
      }
    );
    return response.data;
  }

  /**
   * Get messages for a game session
   */
  static async getGameMessages(
    sessionId: string,
    page: number = 0,
    size: number = 50
  ): Promise<GameMessage[]> {
    const apiInstance = await api();
    const response = await apiInstance.get(`/games/sessions/${sessionId}/messages`, {
      params: { page, size },
    });
    return response.data;
  }

  /**
   * Delete a game session and all its messages
   */
  static async deleteGameSession(sessionId: string): Promise<void> {
    const apiInstance = await api();
    await apiInstance.delete(`/games/sessions/${sessionId}`);
  }
}

export default GameService;
