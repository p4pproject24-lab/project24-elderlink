jest.mock('firebase/app', () => ({ initializeApp: jest.fn(() => ({})), getApps: jest.fn(() => [{}]) }));
jest.mock('firebase/auth', () => ({ getReactNativePersistence: jest.fn(() => ({})), initializeAuth: jest.fn(() => ({ app: {} })) }));
jest.mock('@react-native-async-storage/async-storage', () => ({ __esModule: true, default: {} }));

describe('firebase module', () => {
  it('exports auth instance without throwing', async () => {
    const mod = require('../firebase');
    expect(mod.auth).toBeTruthy();
  });
});


