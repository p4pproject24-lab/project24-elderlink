jest.mock('../../utils/networkUtils', () => ({ getCurrentNetworkConfig: jest.fn(async () => ({ whisperUrl: 'http://w' })) }));

describe('whisperService', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    // @ts-ignore
    global.fetch = jest.fn(async (url: string, init?: any): Promise<any> => {
      if (String(url).endsWith('/transcribe')) {
        return { ok: true, json: async () => ({ text: 'hello', language: 'en' }), text: async () => 'err' };
      }
      if (String(url).endsWith('/transcribe-base64')) {
        return { ok: true, json: async () => ({ text: 'b64', language: 'en' }), text: async () => 'err' };
      }
      return { ok: true, json: async (): Promise<any> => ({ status: 'ok', service: 'whisper' }), text: async (): Promise<string> => 'err' };
    });
  });

  it('health and supportedLanguages work', async () => {
    const { whisperService } = require('../whisperService');
    const h = await whisperService.getHealth();
    expect(h.status).toBe('ok');
    const lang = await whisperService.getSupportedLanguages();
    expect(lang).toBeTruthy();
  });

  it('isAvailable handles failure gracefully', async () => {
    const net = require('../../utils/networkUtils');
    net.getCurrentNetworkConfig.mockRejectedValueOnce(new Error('cfg'));
    // @ts-ignore
    global.fetch = jest.fn(async (): Promise<any> => ({ ok: false, status: 500, text: async (): Promise<string> => 'bad' }));
    const { whisperService } = require('../whisperService');
    const avail = await whisperService.isAvailable();
    expect(avail).toBe(false);
  });

  it('transcribe success and error paths', async () => {
    const { whisperService } = require('../whisperService');
    const file: any = new (class extends Blob {})();
    const t1 = await whisperService.transcribeAudio(file);
    expect(t1.text).toBe('hello');
    const t2 = await whisperService.transcribeAudioBase64('abc', 'f.wav');
    expect(t2.text).toBe('b64');

    // error responses
    // @ts-ignore
    global.fetch = jest.fn(async (url: string): Promise<any> => ({ ok: false, status: 500, text: async (): Promise<string> => 'bad' }));
    await expect(whisperService.transcribeAudio(file)).rejects.toBeTruthy();
    await expect(whisperService.transcribeAudioBase64('abc', 'f.wav')).rejects.toBeTruthy();
    await expect(whisperService.getSupportedLanguages()).rejects.toBeTruthy();
    await expect(whisperService.getHealth()).rejects.toBeTruthy();
  });
});


