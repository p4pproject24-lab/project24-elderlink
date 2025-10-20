import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useHeyGen } from '../useHeyGen';

jest.mock('../../services/heygenService', () => ({
  getHeyGenSessionToken: jest.fn().mockResolvedValue({ data: 'tok' }),
  createHeyGenSession: jest.fn().mockResolvedValue({ data: { id: 's1' } }),
  startHeyGenSession: jest.fn().mockResolvedValue(undefined),
  sendHeyGenTask: jest.fn().mockResolvedValue(undefined),
}));

describe('useHeyGen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches session token and sets state', async () => {
    const { result } = renderHook(() => useHeyGen());
    await act(async () => {
      await result.current.fetchSessionToken();
    });
    expect(result.current.token).toBe('tok');
    expect(result.current.tokenError).toBeNull();
  });

  it('creates session and starts it', async () => {
    const { result } = renderHook(() => useHeyGen());
    await act(async () => {
      await result.current.createSessionAction({} as any);
    });
    expect((result.current.session as any)?.id).toBe('s1');
    await act(async () => {
      await result.current.startSessionAction({} as any);
    });
    expect((result.current.startedSession as any)?.id).toBe('s1');
  });

  it('handles errors for token/create/start', async () => {
    const svc = require('../../services/heygenService');
    svc.getHeyGenSessionToken.mockRejectedValueOnce(new Error('tok fail'));
    svc.createHeyGenSession.mockRejectedValueOnce(new Error('create fail'));
    svc.startHeyGenSession.mockRejectedValueOnce(new Error('start fail'));
    const { result } = renderHook(() => useHeyGen());
    await act(async () => {
      await result.current.fetchSessionToken();
      await result.current.createSessionAction({} as any);
      await result.current.startSessionAction({} as any);
    });
    expect(result.current.tokenError).toBe('tok fail');
    expect(result.current.sessionError).toBe('create fail');
    expect(result.current.startError).toBe('start fail');
  });

  it('sends task successfully', async () => {
    const svc = require('../../services/heygenService');
    const { result } = renderHook(() => useHeyGen());
    await act(async () => {
      await result.current.sendTaskAction('sid', 'hello', 'talk');
    });
    expect(svc.sendHeyGenTask).toHaveBeenCalledWith('sid', 'hello', 'talk');
  });

  it('handles create/start without token/session branches', async () => {
    const { result } = renderHook(() => useHeyGen());
    await act(async () => {
      // clear token and try create (service returns session regardless)
      result.current.token = null as any;
      await result.current.createSessionAction({} as any);
      // clear session and try start
      result.current.setSession(null as any);
      await result.current.startSessionAction({} as any);
    });
    // After create with service success earlier, session would have been set; we nullified it before start
    expect((result.current.session as any)?.id ?? null).toBeNull();
    // starting with null session should keep startedSession null
    expect(result.current.startedSession).toBeNull();
  });

  it('token fetch error branch sets tokenError', async () => {
    const svc = require('../../services/heygenService');
    svc.getHeyGenSessionToken.mockRejectedValueOnce(new Error('tok err'));
    const { result } = renderHook(() => useHeyGen());
    await act(async () => {
      await result.current.fetchSessionToken();
    });
    expect(result.current.tokenError).toBe('tok err');
  });

  it('reflects errors in state for token/create/start', async () => {
    const svc = require('../../services/heygenService');
    svc.getHeyGenSessionToken.mockRejectedValueOnce(new Error('tok fail'));
    const { result } = renderHook(() => useHeyGen());
    await act(async () => { await result.current.fetchSessionToken(); });
    expect(result.current.tokenError).toBe('tok fail');

    svc.createHeyGenSession.mockRejectedValueOnce(new Error('create fail'));
    await act(async () => { await result.current.createSessionAction({} as any); });
    expect(result.current.sessionError).toBe('create fail');

    svc.startHeyGenSession.mockRejectedValueOnce(new Error('start fail'));
    await act(async () => { await result.current.startSessionAction({} as any); });
    expect(result.current.startError).toBe('start fail');
  });

  it('reflects null data responses gracefully', async () => {
    const svc = require('../../services/heygenService');
    svc.createHeyGenSession.mockResolvedValueOnce({ data: null });
    const { result } = renderHook(() => useHeyGen());
    await act(async () => {
      await result.current.createSessionAction({} as any);
    });
    expect(result.current.session).toBeNull();
  });

  it('handles start error branch and preserves startedSession as null', async () => {
    const svc = require('../../services/heygenService');
    const { result } = renderHook(() => useHeyGen());
    await act(async () => {
      await result.current.createSessionAction({} as any);
    });
    svc.startHeyGenSession.mockRejectedValueOnce(new Error('start fail'));
    await act(async () => {
      await result.current.startSessionAction({} as any);
    });
    expect(result.current.startError).toBe('start fail');
    expect(result.current.startedSession).toBeNull();
  });

  it('create error after a previous success updates error without clearing session', async () => {
    const svc = require('../../services/heygenService');
    const { result } = renderHook(() => useHeyGen());
    await act(async () => {
      await result.current.createSessionAction({} as any);
    });
    expect((result.current.session as any)?.id).toBe('s1');
    svc.createHeyGenSession.mockRejectedValueOnce(new Error('create again fail'));
    await act(async () => {
      await result.current.createSessionAction({} as any);
    });
    expect(result.current.sessionError).toBe('create again fail');
    // existing session remains
    expect((result.current.session as any)?.id).toBe('s1');
  });

  it('multiple sequential start attempts keep startedSession in sync', async () => {
    const { result } = renderHook(() => useHeyGen());
    await act(async () => {
      await result.current.createSessionAction({} as any);
    });
    await waitFor(() => expect((result.current.session as any)?.id).toBe('s1'));
    await act(async () => { await result.current.startSessionAction({} as any); });
    expect((result.current.startedSession as any)?.id).toBe('s1');
    await act(async () => { await result.current.startSessionAction({} as any); });
    expect((result.current.startedSession as any)?.id).toBe('s1');
  });

  it('maps startedSession from existing session on start', async () => {
    const { result } = renderHook(() => useHeyGen());
    await act(async () => {
      await result.current.createSessionAction({} as any);
    });
    // ensure session state has updated before starting
    await waitFor(() => expect((result.current.session as any)?.id).toBe('s1'));
    await act(async () => {
      await result.current.startSessionAction({} as any);
    });
    expect((result.current.startedSession as any)?.id).toBe('s1');
  });

  it('sendTaskAction uses default taskType when omitted', async () => {
    const svc = require('../../services/heygenService');
    const { result } = renderHook(() => useHeyGen());
    await act(async () => {
      await result.current.sendTaskAction('sid', 'hello');
    });
    expect(svc.sendHeyGenTask).toHaveBeenCalledWith('sid', 'hello', 'talk');
  });
});


