import { useState } from 'react';
import { askAiChat, askAiChatAvatar, askGameAvatar, fetchChatHistory, askAutoAvatar } from '../services/aiChatService';
import {
  AiChatAskRequest,
  AiChatAskResponse,
  AiChatAskAvatarRequest,
  AiChatAskAvatarResponse,
} from '../types/AiChat';
import { ApiResponse } from '../types/ApiResponse';

export function useAiChat(userId: string) {
  // Text-only AI chat
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<AiChatAskResponse | null>(null);

  // AI chat with avatar audio
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarResponse, setAvatarResponse] = useState<AiChatAskAvatarResponse | null>(null);

  const sendAiMessage = async (payload: AiChatAskRequest) => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await askAiChat(userId, payload);
      const data: AiChatAskResponse | null =
        typeof res.data === 'string'
          ? { text: res.data }
          : res.data || null;
      setAiResponse(data);
    } catch (e: any) {
      setAiError(e?.message || 'Failed to get AI response');
    } finally {
      setAiLoading(false);
    }
  };

  const sendAiAvatarMessage = async (payload: AiChatAskAvatarRequest) => {
    setAvatarLoading(true);
    setAvatarError(null);
    try {
      const res: ApiResponse<AiChatAskAvatarResponse> = await askAiChatAvatar(userId, payload);
      setAvatarResponse(res.data || null);
    } catch (e: any) {
      setAvatarError(e?.message || 'Failed to get AI avatar response');
    } finally {
      setAvatarLoading(false);
    }
  };

  const sendGameAvatarMessage = async (payload: {
    message: string;
    gameSessionId: string;
    sessionId: string;
    location?: any;
  }) => {
    setAvatarLoading(true);
    setAvatarError(null);
    try {
      const res: ApiResponse<AiChatAskAvatarResponse> = await askGameAvatar(userId, payload);
      setAvatarResponse(res.data || null);
    } catch (e: any) {
      setAvatarError(e?.message || 'Failed to get AI game avatar response');
    } finally {
      setAvatarLoading(false);
    }
  };

  const sendAutoAvatarMessage = async (payload: {
    sessionId: string;
    location?: any;
  }) => {
    setAvatarLoading(true);
    setAvatarError(null);
    try {
      const res: ApiResponse<AiChatAskAvatarResponse> = await askAutoAvatar(userId, payload);
      setAvatarResponse(res.data || null);
    } catch (e: any) {
      setAvatarError(e?.message || 'Failed to get AI auto-start response');
    } finally {
      setAvatarLoading(false);
    }
  };

  // Fetch paginated chat history for infinite scroll
  const getChatHistory = async (page = 0) => {
    try {
      const messages = await fetchChatHistory(userId, page);
      return messages;
    } catch (e) {
      return [];
    }
  };

  return {
    aiLoading,
    aiError,
    aiResponse,
    sendAiMessage,
    avatarLoading,
    avatarError,
    avatarResponse,
    sendAiAvatarMessage,
    sendGameAvatarMessage,
    sendAutoAvatarMessage,
    getChatHistory, // expose for infinite scroll
  };
} 