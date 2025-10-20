import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TTSButton } from '../TTSButton';
import * as RN from 'react-native';

// Mock TTS context
const mockSpeak = jest.fn(async () => {});
const mockStop = jest.fn(async () => {});
jest.mock('../../contexts/TTSContext', () => ({
  useTTSContext: () => ({
    speak: mockSpeak,
    stop: mockStop,
    isCurrentTextSpeaking: (_t: string) => false,
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

// Mock ttsService import in availability check
jest.mock('../../services/ttsService', () => ({
  ttsService: {
    getCurrentLanguage: jest.fn(async () => 'en-US'),
  },
}));

// Mock dynamic import used in TTSButton to return our mocked module
jest.mock('../TTSButton', () => jest.requireActual('../TTSButton'));

describe('TTSButton', () => {
  it('renders and invokes TTS then onPress after press', async () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<TTSButton text="Hello" onPress={onPress} />);
    const btn = getByTestId('tts-button');
    await fireEvent.press(btn);
    expect(mockSpeak).toHaveBeenCalledWith('Hello');
    expect(onPress).toHaveBeenCalled();
  });

  it('handles disabled state and dark theme branch', () => {
    jest.spyOn(RN, 'useColorScheme').mockReturnValue('dark' as any);
    const { getByTestId } = render(<TTSButton text="Hello" disabled />);
    const btn = getByTestId('tts-button');
    fireEvent.press(btn);
    // when disabled we do not call speak; ensure stop/speak were not invoked
    expect(mockSpeak).toHaveBeenCalledTimes(0);
    expect(mockStop).toHaveBeenCalledTimes(0);
  });
});


