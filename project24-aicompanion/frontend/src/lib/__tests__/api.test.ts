jest.mock('axios', () => {
  const create = jest.fn((cfg: any) => {
    const interceptors: any = { request: { use: jest.fn() }, response: { use: jest.fn() } };
    const instance: any = {
      defaults: { baseURL: cfg.baseURL, headers: cfg.headers },
      interceptors,
      get: jest.fn(async (url: string, config?: any) => ({ url, config })),
    };
    (instance as any).__interceptors = interceptors; // expose for test to invoke
    return instance;
  });
  return { __esModule: true, default: { create }, create };
});

jest.mock('firebase/auth', () => ({ getAuth: () => ({ currentUser: null }) }));
jest.mock('../../utils/networkUtils', () => ({ getCurrentNetworkConfig: jest.fn(async () => ({ backendUrl: 'http://backend:8080' })) }));

describe('api', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('initializes with dynamic baseURL in dev and applies auth header when user present', async () => {
    const fa = require('firebase/auth');
    fa.getAuth = () => ({ currentUser: { getIdToken: async () => 'tok' } });
    const axios = require('axios');
    const apiMod = require('../api');
    const api = await apiMod.default();
    expect(axios.create).toHaveBeenCalled();
    const instance: any = api as any;
    const config: any = { url: '/x', headers: {} };
    const interceptor = instance.__interceptors.request.use.mock.calls[0][0];
    const out = await interceptor(config);
    expect(out.headers.Authorization).toBe('Bearer tok');
  });

  it('request interceptor tolerates missing user for all endpoints (no auth header)', async () => {
    const fa = require('firebase/auth');
    fa.getAuth = () => ({ currentUser: null });
    const apiMod = require('../api');
    const api = await apiMod.default();
    const instance: any = api as any;
    const interceptor = instance.__interceptors.request.use.mock.calls[0][0];
    const cfg1 = await interceptor({ url: '/auth/login', headers: {} });
    const cfg2 = await interceptor({ url: '/other', headers: {} });
    expect(cfg1.headers.Authorization).toBeUndefined();
    expect(cfg2.headers.Authorization).toBeUndefined();
  });

  it('response interceptor rejects on 401', async () => {
    const apiMod = require('../api');
    const api = await apiMod.default();
    const instance: any = api as any;
    const errorHandler = instance.__interceptors.response.use.mock.calls[0][1];
    await expect(errorHandler({ response: { status: 401 } })).rejects.toBeTruthy();
  });

  it('falls back to env URL when network config fails', async () => {
    const utils = require('../../utils/networkUtils');
    utils.getCurrentNetworkConfig.mockRejectedValueOnce(new Error('cfg fail'));
    process.env.EXPO_PUBLIC_API_URL = 'http://env-fallback:8080';
    const axios = require('axios');
    const apiMod = require('../api');
    const api = await apiMod.default();
    const createdCfg = (axios.create as jest.Mock).mock.calls[0][0];
    expect(createdCfg.baseURL).toBe('http://env-fallback:8080');
  });

  it('returns the same axios instance on repeated calls (singleton)', async () => {
    const apiMod = require('../api');
    const a1 = await apiMod.default();
    const a2 = await apiMod.default();
    expect(a1).toBe(a2);
  });

  it('sets default headers on instance creation', async () => {
    const axios = require('axios');
    const apiMod = require('../api');
    await apiMod.default();
    const createdCfg = (axios.create as jest.Mock).mock.calls[0][0];
    expect(createdCfg.headers['Content-Type']).toBe('application/json');
  });

  it('request interceptor sets headers object when missing', async () => {
    const fa = require('firebase/auth');
    fa.getAuth = () => ({ currentUser: { getIdToken: async () => 'tok2' } });
    const apiMod = require('../api');
    const api = await apiMod.default();
    const instance: any = api as any;
    const interceptor = instance.__interceptors.request.use.mock.calls[0][0];
    const out = await interceptor({ url: '/x' }); // no headers
    expect(out.headers.Authorization).toBe('Bearer tok2');
  });

  it('request interceptor catch branch when token retrieval throws (auth URL passes)', async () => {
    const fa = require('firebase/auth');
    fa.getAuth = () => ({ currentUser: { getIdToken: async () => { throw new Error('boom'); } } });
    const apiMod = require('../api');
    const api = await apiMod.default();
    const instance: any = api as any;
    const interceptor = instance.__interceptors.request.use.mock.calls[0][0];
    const out = await interceptor({ url: '/auth/refresh' });
    expect(out.headers?.Authorization).toBeUndefined();
  });

  it('response interceptor passes through non-401 errors', async () => {
    const apiMod = require('../api');
    const api = await apiMod.default();
    const instance: any = api as any;
    const errorHandler = instance.__interceptors.response.use.mock.calls[0][1];
    await expect(errorHandler({ response: { status: 500 } })).rejects.toBeTruthy();
  });

  it('response interceptor handles missing response object', async () => {
    const apiMod = require('../api');
    const api = await apiMod.default();
    const instance: any = api as any;
    const errorHandler = instance.__interceptors.response.use.mock.calls[0][1];
    await expect(errorHandler({})).rejects.toBeTruthy();
  });

  it('uses production URL when __DEV__ is false', async () => {
    jest.resetModules();
    const originalDev = (global as any).__DEV__;
    (global as any).__DEV__ = false;
    const axios = require('axios');
    const apiMod = require('../api');
    await apiMod.default();
    const createdCfg = (axios.create as jest.Mock).mock.calls[0][0];
    expect(createdCfg.baseURL).toBe('https://your-production-url.com');
    (global as any).__DEV__ = originalDev;
  });

  it('exposes setAuthToken and clearAuthToken functions', async () => {
    const apiMod = require('../api');
    apiMod.setAuthToken('abc');
    apiMod.clearAuthToken();
    // no assertion needed; calling ensures function coverage
    expect(typeof apiMod.setAuthToken).toBe('function');
    expect(typeof apiMod.clearAuthToken).toBe('function');
  });
});


