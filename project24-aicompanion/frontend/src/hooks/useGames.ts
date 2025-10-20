import { useState, useCallback } from 'react';
import { getAuth } from 'firebase/auth';
import GameService from '../services/gameService';
import type {
  GameSession,
  GameMessage,
  GamePreview,
  CreateGameRequest,
} from '../types/Game';

export const useGames = () => {
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null);
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUserId = useCallback(() => {
    const auth = getAuth();
    return auth.currentUser?.uid;
  }, []);

  const loadSessions = useCallback(async () => {
    const userId = getUserId();
    if (!userId) return;

    setLoading(true);
    setError(null);
    try {
      const userSessions = await GameService.getUserGameSessions(userId);
      setSessions(userSessions);
    } catch (err) {
      setError('Failed to load game sessions');
      console.error('Error loading sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [getUserId]);

  const generatePreview = useCallback(async (): Promise<GamePreview | null> => {
    const userId = getUserId();
    if (!userId) return null;

    setLoading(true);
    setError(null);
    try {
      const preview = await GameService.generateGamePreview(userId);
      return preview;
    } catch (err) {
      setError('Failed to generate game preview');
      console.error('Error generating preview:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getUserId]);

  const createSession = useCallback(async (request: CreateGameRequest) => {
    const userId = getUserId();
    if (!userId) return null;

    setLoading(true);
    setError(null);
    try {
      const session = await GameService.createGameSession(userId, request);
      setSessions(prev => [session, ...prev]);
      return session;
    } catch (err) {
      setError('Failed to create game session');
      console.error('Error creating session:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getUserId]);

  const loadSession = useCallback(async (sessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const session = await GameService.getGameSession(sessionId);
      setCurrentSession(session);
      return session;
    } catch (err) {
      setError('Failed to load game session');
      console.error('Error loading session:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (sessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const sessionMessages = await GameService.getGameMessages(sessionId);
      setMessages(sessionMessages);
    } catch (err) {
      setError('Failed to load messages');
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (sessionId: string, message: string) => {
    const userId = getUserId();
    if (!userId) return null;

    // Add user message immediately
    const userMessage: GameMessage = {
      id: Date.now().toString(),
      gameSessionId: sessionId,
      userId,
      text: message,
      fromUser: true,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setError(null);
    
    try {
      const response = await GameService.sendGameMessage(sessionId, userId, {
        message,
      });

      // Add the AI response
      const aiMessage: GameMessage = {
        id: (Date.now() + 1).toString(),
        gameSessionId: sessionId,
        userId,
        text: response,
        fromUser: false,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, aiMessage]);
      return response;
    } catch (err) {
      setError('Failed to send message');
      console.error('Error sending message:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getUserId]);

  const deleteSession = useCallback(async (sessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      await GameService.deleteGameSession(sessionId);
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setMessages([]);
      }
    } catch (err) {
      setError('Failed to delete game session');
      console.error('Error deleting session:', err);
    } finally {
      setLoading(false);
    }
  }, [currentSession]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    sessions,
    currentSession,
    messages,
    loading,
    error,
    loadSessions,
    generatePreview,
    createSession,
    loadSession,
    loadMessages,
    sendMessage,
    deleteSession,
    clearError,
  };
};
