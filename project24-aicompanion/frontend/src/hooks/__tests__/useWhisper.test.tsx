import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useWhisper } from '../useWhisper';

jest.mock('expo-av', () => ({
  Audio: {
    requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
    setAudioModeAsync: jest.fn(async () => {}),
    Recording: {
      createAsync: jest.fn(async () => ({ recording: { stopAndUnloadAsync: jest.fn(async () => {}), getURI: () => 'file://x.wav' } })),
    },
    RecordingOptionsPresets: { HIGH_QUALITY: {} },
  }
}));

jest.mock('expo-file-system', () => ({
  getInfoAsync: jest.fn(async () => ({ exists: true })),
  readAsStringAsync: jest.fn(async () => 'BASE64'),
  EncodingType: { Base64: 'base64' },
}));

jest.mock('../../utils/networkUtils', () => ({ getCurrentNetworkConfig: jest.fn(async () => ({ whisperUrl: 'http://localhost:8001' })) }));
// ensure fetch resolves after a microtask
// @ts-ignore
global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ text: 'hi', language: 'en', confidence: 0.9 }) }));

describe('useWhisper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // mock fetch
    // @ts-ignore
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ text: 'hi', language: 'en', confidence: 0.9 }) }));
  });

  it('records and transcribes', async () => {
    const { result } = renderHook(() => useWhisper());
    await act(async () => {
      await result.current.startRecording();
      await result.current.stopRecording();
    });
    await waitFor(() => expect(result.current.transcribedText).toBe('hi'));
    expect(result.current.detectedLanguage).toBe('en');
  });

  it('handles permission denied and non-ok response branches', async () => {
    const av = require('expo-av');
    av.Audio.requestPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
    const { result } = renderHook(() => useWhisper());
    await act(async () => {
      await result.current.startRecording();
    });
    expect(result.current.error).toBe('Audio recording permission not granted');

    // make permissions ok, but response not ok
    av.Audio.requestPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
    // @ts-ignore
    global.fetch = jest.fn(async () => ({ ok: false, text: async () => 'nope' }));
    await act(async () => {
      await result.current.startRecording();
      await result.current.stopRecording();
    });
    expect(result.current.error).toContain('Whisper API error');
  });

  it('uses network config URL and handles fetch throw', async () => {
    const utils = require('../../utils/networkUtils');
    const { result } = renderHook(() => useWhisper());
    await act(async () => {
      await result.current.startRecording();
    });
    // cause fetch to throw
    // @ts-ignore
    global.fetch = jest.fn(async () => { throw new Error('network fail'); });
    await act(async () => {
      const text = await result.current.stopRecording();
      expect(text).toBeNull();
    });
    expect(result.current.error).toBe('network fail');
  });

  it('falls back to env WHISPER url when network config fails', async () => {
    const utils = require('../../utils/networkUtils');
    utils.getCurrentNetworkConfig.mockRejectedValueOnce(new Error('cfg err'));
    const { result } = renderHook(() => useWhisper());
    await act(async () => {
      await result.current.startRecording();
      // make fetch OK; we just want to ensure it proceeds
      // @ts-ignore
      global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ text: 'ok', language: 'en' }) }));
      await result.current.stopRecording();
    });
    expect(result.current.error).toBeNull();
  });

  it('stopRecording without active recording returns null and sets error', async () => {
    const { result } = renderHook(() => useWhisper());
    await act(async () => {
      const res = await result.current.stopRecording();
      expect(res).toBeNull();
    });
    expect(result.current.error).toBe('No active recording');
  });

  it('handles missing recording URI path', async () => {
    const av = require('expo-av');
    // set createAsync to return a recording with null URI
    av.Audio.Recording.createAsync.mockResolvedValueOnce({ recording: { stopAndUnloadAsync: jest.fn(async () => {}), getURI: () => null } });
    const { result } = renderHook(() => useWhisper());
    await act(async () => {
      await result.current.startRecording();
      const res = await result.current.stopRecording();
      expect(res).toBeNull();
    });
    expect(result.current.error).toBe('Failed to get recording URI');
  });

  it('handles file not found, config failure, and read failure branches', async () => {
    const fs = require('expo-file-system');
    const av = require('expo-av');
    const utils = require('../../utils/networkUtils');
    // make recording succeed
    const { result } = renderHook(() => useWhisper());
    await act(async () => {
      await result.current.startRecording();
    });
    // file missing
    fs.getInfoAsync.mockResolvedValueOnce({ exists: false });
    await act(async () => {
      const text = await result.current.stopRecording();
      expect(text).toBeNull();
    });

    // reset: start again
    av.Audio.requestPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
    await act(async () => { await result.current.startRecording(); });
    // config failure path
    utils.getCurrentNetworkConfig.mockRejectedValueOnce(new Error('cfg fail'));
    // then readAsString fails
    fs.getInfoAsync.mockResolvedValueOnce({ exists: true });
    fs.readAsStringAsync.mockRejectedValueOnce(new Error('read fail'));
    await act(async () => {
      const text = await result.current.stopRecording();
      expect(text).toBeNull();
    });
    expect(result.current.error).toBe('read fail');
  });
});

