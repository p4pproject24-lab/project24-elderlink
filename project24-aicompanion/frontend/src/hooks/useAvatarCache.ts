import { useState, useEffect, useCallback, useRef } from 'react';
import { getHeyGenAvatarList, clearAvatarCache } from '../services/heygenService';
import { Image } from 'react-native';

interface Avatar {
  id: string;
  gender: string;
  preview_image_url: string;
}

interface UseAvatarCacheReturn {
  avatars: Avatar[];
  loading: boolean;
  error: string | null;
  refresh: (forceRefresh?: boolean) => Promise<void>;
  clearCache: () => Promise<void>;
  lastUpdated: Date | null;
  preloadImages: () => Promise<void>;
}

// Global cache to persist across app session
let globalAvatarCache: Avatar[] = [];
let globalLastUpdated: Date | null = null;
let globalLoading = false;
let globalError: string | null = null;

export const useAvatarCache = (): UseAvatarCacheReturn => {
  const [avatars, setAvatars] = useState<Avatar[]>(globalAvatarCache);
  const [loading, setLoading] = useState(globalLoading);
  const [error, setError] = useState<string | null>(globalError);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(globalLastUpdated);
  const isInitialized = useRef(false);

  const loadAvatars = useCallback(async (forceRefresh: boolean = false) => {
    // If we already have cached data and not forcing refresh, use it immediately
    if (!forceRefresh && globalAvatarCache.length > 0) {
      setAvatars(globalAvatarCache);
      setLastUpdated(globalLastUpdated);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      globalLoading = true;
      setLoading(true);
      setError(null);
      
      const startTime = Date.now();
      const avatarList = await getHeyGenAvatarList(forceRefresh);
      const loadTime = Date.now() - startTime;
      
      console.log(`[useAvatarCache] Loaded ${avatarList.length} avatars in ${loadTime}ms (${forceRefresh ? 'fresh' : 'cached'})`);
      
      // Update global cache
      globalAvatarCache = avatarList;
      globalLastUpdated = new Date();
      globalLoading = false;
      globalError = null;
      
      setAvatars(avatarList);
      setLastUpdated(globalLastUpdated);
      setLoading(false);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load avatars';
      console.error('[useAvatarCache] Error loading avatars:', errorMessage);
      globalError = errorMessage;
      globalLoading = false;
      setError(errorMessage);
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async (forceRefresh: boolean = false) => {
    await loadAvatars(forceRefresh);
  }, [loadAvatars]);

  const clearCache = useCallback(async () => {
    try {
      await clearAvatarCache();
      console.log('[useAvatarCache] Cache cleared');
      
      // Clear global cache
      globalAvatarCache = [];
      globalLastUpdated = null;
      globalError = null;
      
      setAvatars([]);
      setLastUpdated(null);
      setError(null);
      
      // Reload avatars after clearing cache
      await loadAvatars(true);
    } catch (err) {
      console.error('[useAvatarCache] Error clearing cache:', err);
      setError('Failed to clear cache');
    }
  }, [loadAvatars]);

  const preloadImages = useCallback(async () => {
    if (avatars.length === 0) return;
    
    console.log('[useAvatarCache] Preloading avatar images...');
    const preloadPromises = avatars.slice(0, 8).map(avatar => {
      return new Promise<void>((resolve) => {
        Image.prefetch(avatar.preview_image_url)
          .then(() => {
            console.log(`[useAvatarCache] Preloaded image for avatar: ${avatar.id}`);
            resolve();
          })
          .catch(() => {
            console.warn(`[useAvatarCache] Failed to preload image for avatar: ${avatar.id}`);
            resolve(); // Don't fail the entire preload
          });
      });
    });
    
    await Promise.all(preloadPromises);
    console.log('[useAvatarCache] Avatar image preloading completed');
  }, [avatars]);

  // Initial load only once per app session
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      loadAvatars(false); // Use cache first
    }
  }, [loadAvatars]);

  return {
    avatars,
    loading,
    error,
    refresh,
    clearCache,
    lastUpdated,
    preloadImages,
  };
};
