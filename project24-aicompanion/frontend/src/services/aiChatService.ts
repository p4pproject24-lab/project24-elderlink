import api from '../lib/api';
import { ApiResponse } from '../types/ApiResponse';
import {
  AiChatAskRequest,
  AiChatAskResponse,
  AiChatAskAvatarRequest,
  AiChatAskAvatarResponse,
} from '../types/AiChat';

export const askAiChat = async (
  userId: string,
  payload: AiChatAskRequest
): Promise<ApiResponse<AiChatAskResponse | string>> => {
  // /memory/ask returns just a string, so wrap it in { text }
  const apiInstance = await api();
  const res = await apiInstance.post<string>(`/memory/ask?userId=${userId}`, payload);
  return {
    status: 200,
    message: 'AI response',
    data: typeof res.data === 'string' ? { text: res.data } : res.data,
    timestamp: new Date().toISOString(),
  };
};

export const askAiChatAvatar = async (
  userId: string,
  payload: AiChatAskAvatarRequest
): Promise<ApiResponse<AiChatAskAvatarResponse>> => {
  const apiInstance = await api();
  const res = await apiInstance.post<ApiResponse<AiChatAskAvatarResponse>>(
    `/memory/ask-avatar?userId=${userId}`,
    payload
  );
  return res.data;
};

export const askGameAvatar = async (
  userId: string,
  payload: {
    message: string;
    gameSessionId: string;
    sessionId: string;
    location?: any;
  }
): Promise<ApiResponse<AiChatAskAvatarResponse>> => {
  const apiInstance = await api();
  const res = await apiInstance.post<ApiResponse<AiChatAskAvatarResponse>>(
    `/memory/ask-game-avatar?userId=${userId}`,
    payload
  );
  return res.data;
};

export const askAutoAvatar = async (
  userId: string,
  payload: {
    sessionId: string;
    location?: any;
  }
): Promise<ApiResponse<AiChatAskAvatarResponse>> => {
  const apiInstance = await api();
  const res = await apiInstance.post<ApiResponse<AiChatAskAvatarResponse>>(
    `/memory/ask-auto-avatar?userId=${userId}`,
    payload
  );
  return res.data;
};

// Fetch paginated chat history for infinite scroll
export const fetchChatHistory = async (
  userId: string,
  page: number = 0
): Promise<any[]> => {
  const apiInstance = await api();
  const res = await apiInstance.get(`/memory/chats?userId=${userId}&page=${page}`);
  return res.data;
}; 

export const introduceUser = async (
  userId: string,
  introText: string
): Promise<ApiResponse<string>> => {
  const apiInstance = await api();
  const res = await apiInstance.post<string>(`/memory/introduce?userId=${userId}`, introText);
  return {
    status: 200,
    message: 'Introduction stored successfully',
    data: res.data,
    timestamp: new Date().toISOString(),
  };
}; 