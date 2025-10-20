import React from 'react';
import { render } from '@testing-library/react-native';
import { TTSProvider, useTTSContext } from '../TTSContext';

jest.mock('../../hooks/useTTS', () => ({
  useTTS: () => ({
    isSpeaking: false,
    currentText: '',
    speak: jest.fn(),
    stop: jest.fn(),
    isCurrentTextSpeaking: jest.fn().mockReturnValue(false),
  })
}));

const Consumer = () => {
  const ctx = useTTSContext();
  return null;
};

describe('TTSContext', () => {
  it('provides TTS values', () => {
    render(
      <TTSProvider>
        <Consumer />
      </TTSProvider>
    );
  });
});


