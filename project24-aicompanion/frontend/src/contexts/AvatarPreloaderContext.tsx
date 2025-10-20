import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAvatarCache } from '../hooks/useAvatarCache';

interface AvatarPreloaderContextType {
  isPreloaded: boolean;
  preloadProgress: number;
}

const AvatarPreloaderContext = createContext<AvatarPreloaderContextType | undefined>(undefined);

export const AvatarPreloaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPreloaded, setIsPreloaded] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const { avatars, preloadImages } = useAvatarCache();

  useEffect(() => {
    const preloadAvatarsOnStartup = async () => {
      if (avatars.length > 0 && !isPreloaded) {
        console.log('[AvatarPreloader] Starting avatar preload...');
        setPreloadProgress(0);
        
        try {
          await preloadImages();
          setPreloadProgress(100);
          setIsPreloaded(true);
          console.log('[AvatarPreloader] Avatar preload completed');
        } catch (error) {
          console.error('[AvatarPreloader] Error preloading avatars:', error);
          setIsPreloaded(true); // Mark as complete even if there's an error
        }
      }
    };

    preloadAvatarsOnStartup();
  }, [avatars, preloadImages, isPreloaded]);

  return (
    <AvatarPreloaderContext.Provider value={{ isPreloaded, preloadProgress }}>
      {children}
    </AvatarPreloaderContext.Provider>
  );
};

export const useAvatarPreloader = () => {
  const context = useContext(AvatarPreloaderContext);
  if (!context) {
    throw new Error('useAvatarPreloader must be used within an AvatarPreloaderProvider');
  }
  return context;
};
