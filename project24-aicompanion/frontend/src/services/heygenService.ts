import api from '../lib/api';
import {
  HeyGenSessionRequest,
  HeyGenStartSessionRequest,
  HeyGenSessionResponse,
} from '../types/HeyGen';
import { ApiResponse } from '../types/ApiResponse';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache keys
const AVATAR_LIST_CACHE_KEY = 'heygen_avatar_list_cache';
const AVATAR_LIST_CACHE_TIMESTAMP_KEY = 'heygen_avatar_list_cache_timestamp';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Avatar cache interface
interface CachedAvatarList {
  avatars: Array<{ id: string; gender: string; preview_image_url: string; default_voice?: string }>;
  timestamp: number;
}

export const getHeyGenSessionToken = async (): Promise<ApiResponse<string>> => {
  const apiInstance = await api();
  const res = await apiInstance.get<ApiResponse<string>>('/heygen/session-token');
  return res.data;
};

export const createHeyGenSession = async (
  payload: HeyGenSessionRequest
): Promise<ApiResponse<HeyGenSessionResponse>> => {
  const apiInstance = await api();
  const res = await apiInstance.post<ApiResponse<HeyGenSessionResponse>>('/heygen/create-session', payload);
  return res.data;
};

export const startHeyGenSession = async (
  payload: HeyGenStartSessionRequest
): Promise<ApiResponse<HeyGenSessionResponse>> => {
  const apiInstance = await api();
  const res = await apiInstance.post<ApiResponse<HeyGenSessionResponse>>('/heygen/start-session', payload);
  return res.data;
};

// New: Send a task (text) to the avatar for live speech
export const sendHeyGenTask = async (
  sessionId: string,
  text: string,
  taskType: string = 'talk'
): Promise<{ duration_ms?: number; task_id?: string }> => {
  const apiInstance = await api();
  const res = await apiInstance.post('/heygen/task', { sessionId, text, taskType });
  return {
    duration_ms: res.data?.duration_ms,
    task_id: res.data?.task_id,
  };
};

export const stopHeyGenSession = async (sessionId: string): Promise<void> => {
  const apiInstance = await api();
  await apiInstance.post('/heygen/stop-session', { sessionId });
};

// Get the streaming URL for the avatar session
export const getHeyGenStreamingUrl = (sessionId: string, token: string): string => {
  // This URL format is based on HeyGen's streaming API
  // You may need to adjust this based on the actual HeyGen API documentation
  return `https://api.heygen.com/v1/streaming/play?session_id=${sessionId}&token=${token}`;
};

// Fetch avatar details (including preview image) via backend proxy
export const getHeyGenAvatarDetails = async (avatarId: string): Promise<{ previewImageUrl: string | null }> => {
  try {
    const apiInstance = await api();
    const res = await apiInstance.get(`/heygen/avatar-details?avatarId=${avatarId}`);
    return { previewImageUrl: res.data?.previewImageUrl || null };
  } catch {
    return { previewImageUrl: null };
  }
}; 

// Enhanced avatar list fetching with caching
export const getHeyGenAvatarList = async (forceRefresh: boolean = false): Promise<Array<{ id: string; gender: string; preview_image_url: string; default_voice?: string }>> => {
  try {
    // Check cache first (unless force refresh is requested)
    if (!forceRefresh) {
      const cachedData = await AsyncStorage.getItem(AVATAR_LIST_CACHE_KEY);
      const cachedTimestamp = await AsyncStorage.getItem(AVATAR_LIST_CACHE_TIMESTAMP_KEY);
      
      if (cachedData && cachedTimestamp) {
        const cache: CachedAvatarList = JSON.parse(cachedData);
        const timestamp = parseInt(cachedTimestamp);
        const now = Date.now();
        
        // If cache is still valid (less than 24 hours old)
        if (now - timestamp < CACHE_DURATION) {
          console.log('[HeyGenService] Using cached avatar list');
          return cache.avatars;
        }
      }
    }
    
    // Fetch fresh data from API
    console.log('[HeyGenService] Fetching fresh avatar list from API');
    const apiInstance = await api();
    const res = await apiInstance.get('/heygen/avatar-list');
    const avatars = res.data.avatars || [];
    
    // Cache the new data
    const cacheData: CachedAvatarList = {
      avatars,
      timestamp: Date.now()
    };
    
    await AsyncStorage.setItem(AVATAR_LIST_CACHE_KEY, JSON.stringify(cacheData));
    await AsyncStorage.setItem(AVATAR_LIST_CACHE_TIMESTAMP_KEY, Date.now().toString());
    
    console.log('[HeyGenService] Cached fresh avatar list');
    return avatars;
  } catch (error) {
    console.error('[HeyGenService] Error fetching avatar list:', error);
    
    // Try to return cached data as fallback
    try {
      const cachedData = await AsyncStorage.getItem(AVATAR_LIST_CACHE_KEY);
      if (cachedData) {
        const cache: CachedAvatarList = JSON.parse(cachedData);
        console.log('[HeyGenService] Using cached avatar list as fallback');
        return cache.avatars;
      }
    } catch (cacheError) {
      console.error('[HeyGenService] Error reading cached avatar list:', cacheError);
    }
    
    return [];
  }
};

// Clear avatar cache (useful for debugging or when cache becomes stale)
export const clearAvatarCache = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(AVATAR_LIST_CACHE_KEY);
    await AsyncStorage.removeItem(AVATAR_LIST_CACHE_TIMESTAMP_KEY);
    console.log('[HeyGenService] Avatar cache cleared');
  } catch (error) {
    console.error('[HeyGenService] Error clearing avatar cache:', error);
  }
};

// Preload avatar preview images for better performance
export const preloadAvatarImages = async (avatars: Array<{ id: string; gender: string; preview_image_url: string; default_voice?: string }>): Promise<void> => {
  console.log('[HeyGenService] Preloading avatar images...');
  
  // Preload first 8 avatars for better performance
  const avatarsToPreload = avatars.slice(0, 8);
  
  const preloadPromises = avatarsToPreload.map(async (avatar) => {
    try {
      // Use Image.prefetch for better caching
      const { Image } = await import('react-native');
      await Image.prefetch(avatar.preview_image_url);
      console.log(`[HeyGenService] Preloaded image for avatar: ${avatar.id}`);
    } catch (error) {
      console.warn(`[HeyGenService] Failed to preload image for avatar: ${avatar.id}`, error);
    }
  });
  
  await Promise.all(preloadPromises);
  console.log('[HeyGenService] Avatar image preloading completed');
}; 