jest.useFakeTimers();

jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
jest.mock('@react-native-async-storage/async-storage', () => ({ __esModule: true, default: { getItem: jest.fn(async () => null), setItem: jest.fn(async () => {}) } }));

describe('networkUtils', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    // @ts-ignore
    global.fetch = jest.fn(async (url: string): Promise<any> => ({ ok: true, status: 200, json: async (): Promise<any> => ({}) }));
    delete process.env.EXPO_PUBLIC_API_URL;
    delete process.env.EXPO_PUBLIC_WHISPER_API_URL;
    delete process.env.EXPO_PUBLIC_MEMORY_API_URL;
    delete process.env.EXPO_PUBLIC_DOCKER_ENV;
  });

  it('uses explicit env URLs when provided', async () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://api';
    process.env.EXPO_PUBLIC_WHISPER_API_URL = 'http://w';
    process.env.EXPO_PUBLIC_MEMORY_API_URL = 'http://m';
    const utils = require('../networkUtils');
    const cfg = await utils.getNetworkConfig();
    expect(cfg.backendUrl).toBe('http://api');
    expect(cfg.whisperUrl).toBe('http://w');
    expect(cfg.memoryUrl).toBe('http://m');
  });

  it('falls back to detected host IP and saves cache', async () => {
    const storage = require('@react-native-async-storage/async-storage').default;
    const utils = require('../networkUtils');
    const cfg = await utils.getNetworkConfig();
    expect(cfg.backendUrl).toMatch(/http:\/\/.*:8080/);
    expect(storage.setItem).toHaveBeenCalled();
  });

  it('uses cache if present', async () => {
    const storage = require('@react-native-async-storage/async-storage').default;
    storage.getItem.mockResolvedValueOnce(JSON.stringify({ backendUrl: 'http://b', whisperUrl: 'http://w', memoryUrl: 'http://m' }));
    const utils = require('../networkUtils');
    const cfg = await utils.getNetworkConfig();
    expect(cfg.backendUrl).toBe('http://b');
  });

  it('uses Docker base when EXPO_PUBLIC_DOCKER_ENV=true', async () => {
    process.env.EXPO_PUBLIC_DOCKER_ENV = 'true';
    const utils = require('../networkUtils');
    const cfg = await utils.getNetworkConfig();
    expect(cfg.backendUrl).toBe('http://host.docker.internal:8080');
  });

  it('getCurrentNetworkConfig caches, and clearNetworkCache resets', async () => {
    const utils = require('../networkUtils');
    const cfg1 = await utils.getCurrentNetworkConfig();
    const cfg2 = await utils.getCurrentNetworkConfig();
    expect(cfg1).toBe(cfg2);
    utils.clearNetworkCache();
    const cfg3 = await utils.getCurrentNetworkConfig();
    expect(cfg3).not.toBe(cfg1);
  });

  it('testConnectivity covers success and failure branches', async () => {
    const utils = require('../networkUtils');
    // success path first
    const ok = await utils.testConnectivity();
    expect(ok.backend && ok.whisper && ok.memory).toBe(true);
    // make backend and whisper fail
    // @ts-ignore
    global.fetch = jest.fn(async (url: string): Promise<any> => ({ ok: false, status: 500, json: async (): Promise<any> => ({}) }));
    const fail = await utils.testConnectivity();
    expect(fail.backend || fail.whisper || fail.memory).toBe(false);
  });
});


