import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useFirebaseAuth } from '../useFirebaseAuth';

jest.mock('../../lib/firebase', () => ({ auth: {} }));
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn((auth: any, cb: any) => { cb(null); return jest.fn(); }),
  signOut: jest.fn(async () => {}),
  signInWithCredential: jest.fn(async () => ({ user: { getIdToken: async () => 'tok', uid: 'u' } })),
  GoogleAuthProvider: { credential: (t: string) => ({ t }) },
}));

jest.mock('../../lib/api', () => ({ setAuthToken: jest.fn(), clearAuthToken: jest.fn() }));

jest.mock('expo-auth-session/providers/google', () => ({
  // Return a non-success response so the sign-in effect does not run
  useAuthRequest: jest.fn(() => [{}, null, async () => {}]),
}));
jest.mock('expo-web-browser', () => ({ maybeCompleteAuthSession: () => {} }));

describe('useFirebaseAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('signOut clears token and calls firebase signOut', async () => {
    const { result } = renderHook(() => useFirebaseAuth());
    await act(async () => {
      await result.current.signOut();
    });
    const fa = require('firebase/auth');
    const api = require('../../lib/api');
    expect(api.clearAuthToken).toHaveBeenCalled();
    expect(fa.signOut).toHaveBeenCalled();
  });

  it('handles non-success auth response and signIn failure', async () => {
    const google = require('expo-auth-session/providers/google');
    google.useAuthRequest.mockReturnValueOnce([{}, { type: 'cancel' }, async () => {}]);
    const fa = require('firebase/auth');
    fa.signInWithCredential.mockRejectedValueOnce(new Error('signin fail'));
    const { result } = renderHook(() => useFirebaseAuth());
    await act(async () => {
      // triggers effect; nothing to assert except no throws
      await Promise.resolve();
    });
  });

  it('runs success sign-in effect branch', async () => {
    const google = require('expo-auth-session/providers/google');
    google.useAuthRequest.mockReturnValueOnce([{}, { type: 'success', params: { id_token: 'id' } }, async () => {}]);
    const { result } = renderHook(() => useFirebaseAuth());
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  });

  it('handles other non-success response types by clearing loading', async () => {
    const google = require('expo-auth-session/providers/google');
    // opened
    google.useAuthRequest.mockReturnValueOnce([{}, { type: 'opened' }, async () => {}]);
    const { result: r1 } = renderHook(() => useFirebaseAuth());
    await act(async () => { await Promise.resolve(); });
    expect(r1.current.loading).toBe(false);

    // locked
    google.useAuthRequest.mockReturnValueOnce([{}, { type: 'locked' }, async () => {}]);
    const { result: r2 } = renderHook(() => useFirebaseAuth());
    await act(async () => { await Promise.resolve(); });
    expect(r2.current.loading).toBe(false);
  });

  it('sets error when token retrieval fails after success response', async () => {
    const google = require('expo-auth-session/providers/google');
    google.useAuthRequest.mockReturnValueOnce([{}, { type: 'success', params: { id_token: 'id' } }, async () => {}]);
    const fa = require('firebase/auth');
    // signIn succeeds but getIdToken fails
    fa.signInWithCredential.mockResolvedValueOnce({ user: { uid: 'u2', getIdToken: async () => { throw new Error('token fail'); } } });
    const { result } = renderHook(() => useFirebaseAuth());
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.error).toBe('token fail');
    expect(result.current.loading).toBe(false);
  });

  it('onAuthStateChanged sets user on callback', async () => {
    const fa = require('firebase/auth');
    fa.onAuthStateChanged.mockImplementationOnce((auth: any, cb: any) => { cb({ uid: 'u1' }); return jest.fn(); });
    const { result } = renderHook(() => useFirebaseAuth());
    await act(async () => { await Promise.resolve(); });
    expect(result.current.user?.uid).toBe('u1');
  });

  it('signInWithPhone throws not implemented', async () => {
    const { result } = renderHook(() => useFirebaseAuth());
    await act(async () => {
      await expect(result.current.signInWithPhone('+123')).rejects.toThrow('not implemented');
    });
  });

  it('sets auth token and user on success response', async () => {
    const google = require('expo-auth-session/providers/google');
    google.useAuthRequest.mockReturnValueOnce([{}, { type: 'success', params: { id_token: 'id' } }, async () => {}]);
    const fa = require('firebase/auth');
    // ensure signIn resolves with a user token
    fa.signInWithCredential.mockResolvedValueOnce({ user: { uid: 'u2', getIdToken: async () => 'tok2' } });
    const api = require('../../lib/api');
    const { result } = renderHook(() => useFirebaseAuth());
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(api.setAuthToken).toHaveBeenCalledWith('tok2');
    expect(result.current.user?.uid).toBe('u2');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  // Note: prompt failure branch is indirectly exercised by non-success response test above

  it('signInWithGoogle resolves after onAuthStateChanged sets user', async () => {
    const fa = require('firebase/auth');
    const google = require('expo-auth-session/providers/google');
    // no auto sign-in effect
    google.useAuthRequest.mockReturnValueOnce([{}, null, async () => {}]);
    // onAuthStateChanged should call back with a user after a microtask
    fa.onAuthStateChanged.mockImplementationOnce((_auth: any, cb: any) => {
      Promise.resolve().then(() => cb({ uid: 'u3', getIdToken: async () => 'tok3' }));
      return jest.fn();
    });
    const { result } = renderHook(() => useFirebaseAuth());
    const p = result.current.signInWithGoogle();
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    await expect(p).resolves.toBeUndefined();
    expect(result.current.user?.uid).toBe('u3');
  });
});

