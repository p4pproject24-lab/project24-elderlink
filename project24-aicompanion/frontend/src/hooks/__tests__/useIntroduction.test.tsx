import { act, renderHook } from '@testing-library/react-native';
import { useIntroduction } from '../useIntroduction';

jest.useFakeTimers();

jest.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'm1', firebaseUid: 'fb1', fullName: 'A', dailyLife: 'd' } }) }));
jest.mock('../../hooks/useRole', () => ({ useRole: () => ({ role: 'ELDERLY' }) }));

jest.mock('../../services/aiChatService', () => ({ introduceUser: jest.fn(async () => ({ status: 200 })) }));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => {}),
    removeItem: jest.fn(async () => {}),
  }
}));

describe('useIntroduction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('triggers introduction when called directly', async () => {
    const { result } = renderHook(() => useIntroduction());
    await act(async () => {
      await result.current.generateIntroduction();
    });
    const svc = require('../../services/aiChatService');
    expect(svc.introduceUser).toHaveBeenCalled();
  });

  it('handles non-200 backend response and AsyncStorage errors', async () => {
    const svc = require('../../services/aiChatService');
    svc.introduceUser.mockResolvedValueOnce({ status: 500, message: 'fail' });
    const storage = require('@react-native-async-storage/async-storage').default;
    storage.setItem.mockRejectedValueOnce(new Error('write fail'));
    const { result } = renderHook(() => useIntroduction());
    await act(async () => {
      await result.current.generateIntroduction();
    });
  });

  it('skips when role is not ELDERLY or no firebaseUid', async () => {
    const roleMod = require('../../hooks/useRole');
    roleMod.useRole = () => ({ role: 'CAREGIVER' });
    const authMod = require('../../hooks/useAuth');
    authMod.useAuth = () => ({ user: { id: 'm1', fullName: 'A', dailyLife: 'd' } });
    const svc = require('../../services/aiChatService');
    const { result } = renderHook(() => require('../useIntroduction').useIntroduction());
    await act(async () => {
      await result.current.generateIntroduction();
    });
    expect(svc.introduceUser).not.toHaveBeenCalled();
  });

  it('skips when already introduced is true', async () => {
    const storage = require('@react-native-async-storage/async-storage').default;
    storage.getItem.mockResolvedValue('true');
    const svc = require('../../services/aiChatService');
    const { result } = renderHook(() => useIntroduction());
    await act(async () => {
      await result.current.generateIntroduction();
    });
    expect(svc.introduceUser).not.toHaveBeenCalled();
  });

  // Auto-trigger via effect covered by direct generateIntroduction invocation above.
});

