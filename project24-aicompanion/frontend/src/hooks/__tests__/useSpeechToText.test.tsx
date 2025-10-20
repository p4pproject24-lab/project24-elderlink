import { act, renderHook } from '@testing-library/react-native';
import { useSpeechToText } from '../useSpeechToText';

jest.mock('@react-native-voice/voice', () => ({
  __esModule: true,
  default: {
    start: jest.fn(async () => {}),
    stop: jest.fn(async () => {}),
    destroy: jest.fn(async () => {}),
    removeAllListeners: jest.fn(async () => {}),
    onSpeechStart: undefined as any,
    onSpeechEnd: undefined as any,
    onSpeechResults: undefined as any,
    onSpeechPartialResults: undefined as any,
    onSpeechError: undefined as any,
  }
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => {}),
  }
}));

describe('useSpeechToText', () => {
  beforeEach(() => jest.clearAllMocks());

  it('starts and stops listening, handles events', async () => {
    const { result, unmount } = renderHook(() => useSpeechToText('en-GB'));
    await act(async () => {
      await result.current.startListening();
    });
    const voice = (require('@react-native-voice/voice').default);
    expect(voice.start).toHaveBeenCalled();

    // simulate partial and final results
    act(() => {
      voice.onSpeechPartialResults?.({ value: ['hel'] });
      voice.onSpeechResults?.({ value: ['hello'] });
    });
    expect(result.current.input).toBe('hello');

    await act(async () => {
      await result.current.stopListening();
    });
    expect(voice.stop).toHaveBeenCalled();

    unmount();
  });

  it('handles start/stop errors and benign speech errors', async () => {
    const voice = (require('@react-native-voice/voice').default);
    voice.start.mockRejectedValueOnce(new Error('Could not start'));
    const { result, unmount } = renderHook(() => useSpeechToText('en-US'));
    await act(async () => {
      await result.current.startListening();
    });
    expect(result.current.error).toBe('Could not start');

    // benign error should be suppressed
    act(() => {
      voice.onSpeechError?.({ error: { message: 'no match' } });
    });
    expect(result.current.error).toBeNull();

    // stop error
    voice.stop.mockRejectedValueOnce(new Error('stop fail'));
    await act(async () => {
      await result.current.stopListening();
    });
    expect(result.current.error).toBe('stop fail');
    unmount();
  });

  it('saveLanguagePreference error is caught and does not update selection', async () => {
    const storage = require('@react-native-async-storage/async-storage').default;
    const { result } = renderHook(() => useSpeechToText('en-US'));
    storage.setItem.mockRejectedValueOnce(new Error('save fail'));
    await act(async () => {
      await result.current.saveLanguagePreference('ja-JP');
    });
    // selection remains unchanged due to error
    expect(result.current.selectedLanguage).toBe('en-US');
  });

  it('toggles listening via onSpeechStart/onSpeechEnd events', () => {
    const voice = (require('@react-native-voice/voice').default);
    const { result, unmount } = renderHook(() => useSpeechToText('en-US'));
    expect(result.current.isListening).toBe(false);
    act(() => {
      voice.onSpeechStart?.();
    });
    expect(result.current.isListening).toBe(true);
    act(() => {
      voice.onSpeechEnd?.();
    });
    expect(result.current.isListening).toBe(false);
    unmount();
  });

  it('loads saved language or falls back on storage error and saves preference', async () => {
    const storage = require('@react-native-async-storage/async-storage').default;
    storage.getItem.mockResolvedValueOnce('fr-FR');
    const { result, unmount, rerender } = renderHook(({ loc }) => useSpeechToText(loc as any), { initialProps: { loc: 'en-US' } as any });
    await act(async () => { await Promise.resolve(); });
    expect(result.current.selectedLanguage).toBe('fr-FR');

    // trigger error path
    storage.getItem.mockRejectedValueOnce(new Error('read fail'));
    rerender({ loc: 'de-DE' } as any);
    await act(async () => { await Promise.resolve(); });
    expect(result.current.selectedLanguage).toBe('de-DE');

    await act(async () => {
      await result.current.saveLanguagePreference('es-ES');
    });
    expect(storage.setItem).toHaveBeenCalled();
    expect(result.current.selectedLanguage).toBe('es-ES');
    unmount();
  });

  it('sets error for non-benign speech errors', () => {
    const voice = (require('@react-native-voice/voice').default);
    const { result } = renderHook(() => useSpeechToText('en-US'));
    act(() => {
      voice.onSpeechError?.({ error: { message: 'microphone denied' } });
    });
    expect(result.current.error).toBe('microphone denied');
  });
});

