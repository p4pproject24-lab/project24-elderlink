import React, { createContext, useContext, useMemo } from 'react';
import { useTTS } from '../hooks/useTTS';

interface TTSContextType {
  isSpeaking: boolean;
  currentText: string;
  speak: (text: string) => Promise<void>;
  stop: () => Promise<void>;
  isCurrentTextSpeaking: (text: string) => boolean;
}

const TTSContext = createContext<TTSContextType | undefined>(undefined);

interface TTSProviderProps {
  children: React.ReactNode;
}

export const TTSProvider: React.FC<TTSProviderProps> = ({ children }) => {
  const tts = useTTS();

  const contextValue: TTSContextType = useMemo(() => ({
    isSpeaking: tts.isSpeaking,
    currentText: tts.currentText,
    speak: tts.speak,
    stop: tts.stop,
    isCurrentTextSpeaking: tts.isCurrentTextSpeaking,
  }), [tts.isSpeaking, tts.currentText, tts.speak, tts.stop, tts.isCurrentTextSpeaking]);

  return (
    <TTSContext.Provider value={contextValue}>
      {children}
    </TTSContext.Provider>
  );
};

export const useTTSContext = (): TTSContextType => {
  const context = useContext(TTSContext);
  if (context === undefined) {
    throw new Error('useTTSContext must be used within a TTSProvider');
  }
  return context;
};
