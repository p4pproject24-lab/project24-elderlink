describe('ttsService', () => {
  beforeEach(() => { jest.resetModules(); jest.clearAllMocks(); });

  it('speaks and stops with expo-speech mock', async () => {
    jest.doMock('expo-speech', () => ({ speak: jest.fn(async (_t: string, opts: any) => { opts.onStart?.(); opts.onDone?.(); }), stop: jest.fn(async () => {}) }));
    const { ttsService } = require('../ttsService');
    await ttsService.speak('hello', { onStart: jest.fn(), onDone: jest.fn() });
    await ttsService.stop();
    expect(ttsService.isSpeaking()).toBe(false);
  });

  it('handles speak error path', async () => {
    jest.doMock('expo-speech', () => ({ speak: jest.fn(async () => { throw new Error('x'); }), stop: jest.fn(async () => {}) }));
    const { ttsService } = require('../ttsService');
    await expect(ttsService.speak('boom')).rejects.toBeTruthy();
    expect(ttsService.isSpeaking()).toBe(false);
  });

  it('stop and getAvailableVoices handle missing module', async () => {
    jest.doMock('expo-speech', () => { throw new Error('no module'); });
    const { ttsService } = require('../ttsService');
    await ttsService.stop();
    const voices = await ttsService.getAvailableVoices();
    expect(Array.isArray(voices)).toBe(true);
    expect(await ttsService.getCurrentLanguage()).toBe('en-US');
  });

  it('fires onError and clears speaking state', async () => {
    jest.doMock('expo-speech', () => ({ speak: jest.fn(async (_t: string, opts: any) => { opts.onStart?.(); opts.onError?.({ error: 'bad' }); throw new Error('bad'); }), stop: jest.fn(async () => {}) }));
    const { ttsService } = require('../ttsService');
    const onError = jest.fn();
    await expect(ttsService.speak('x', { onError })).rejects.toBeTruthy();
    expect(ttsService.isSpeaking()).toBe(false);
  });

  it('uses web TTS fallback when expo-speech missing', async () => {
    jest.doMock('expo-speech', () => { throw new Error('no module'); });
    // @ts-ignore
    global.window = {
      speechSynthesis: {
        speak: (utterance: any) => { utterance.onstart?.(); setTimeout(() => utterance.onend?.(), 0); },
        cancel: () => {},
        getVoices: () => [{ name: 'v' }],
      },
      SpeechSynthesisUtterance: function(this: any, _t: string) { this.onend = null; this.onerror = null; this.onstart = null; },
    } as any;
    const { ttsService } = require('../ttsService');
    await ttsService.speak('hello', { onStart: jest.fn(), onDone: jest.fn() });
    await ttsService.stop();
    const voices = await ttsService.getAvailableVoices();
    expect(voices.length).toBe(1);
  });

  it('getAvailableVoices returns [] on expo-speech error', async () => {
    jest.doMock('expo-speech', () => ({ getAvailableVoicesAsync: jest.fn(async () => { throw new Error('fail'); }), speak: jest.fn(async () => {}), stop: jest.fn(async () => {}) }));
    const { ttsService } = require('../ttsService');
    const voices = await ttsService.getAvailableVoices();
    expect(voices).toEqual([]);
  });

  it('stop catches error without throwing', async () => {
    jest.doMock('expo-speech', () => ({ speak: jest.fn(async () => {}), stop: jest.fn(async () => { throw new Error('stop fail'); }) }));
    const { ttsService } = require('../ttsService');
    await ttsService.stop();
    expect(ttsService.isSpeaking()).toBe(false);
  });

  it('speak throws when Speech module not available', async () => {
    jest.doMock('expo-speech', () => { throw new Error('no module'); });
    // Ensure no web fallback
    // @ts-ignore
    global.window = {} as any;
    const { ttsService } = require('../ttsService');
    await expect(ttsService.speak('x')).rejects.toBeTruthy();
  });
});


