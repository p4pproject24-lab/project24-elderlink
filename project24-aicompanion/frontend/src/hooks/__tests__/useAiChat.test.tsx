import { act, renderHook } from '@testing-library/react-native';
import { useAiChat } from '../useAiChat';

jest.mock('../../services/aiChatService', () => ({
  askAiChat: jest.fn(async () => ({ data: 'hello' })),
  askAiChatAvatar: jest.fn(async () => ({ data: { audioUrl: 'u' } })),
  askGameAvatar: jest.fn(async () => ({ data: { audioUrl: 'g' } })),
  askAutoAvatar: jest.fn(async () => ({ data: { audioUrl: 'a' } })),
  fetchChatHistory: jest.fn(async () => ([{ id: 'm1' }] as any)),
}));

describe('useAiChat', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sends AI message and parses string data', async () => {
    const { result } = renderHook(() => useAiChat('u1'));
    await act(async () => {
      await result.current.sendAiMessage({ text: 'hi' } as any);
    });
    expect(result.current.aiLoading).toBe(false);
    expect(result.current.aiError).toBeNull();
    expect(result.current.aiResponse?.text).toBe('hello');
  });

  it('parses object data path', async () => {
    const svc = require('../../services/aiChatService');
    svc.askAiChat.mockResolvedValueOnce({ data: { text: 'object-path' } });
    const { result } = renderHook(() => useAiChat('u1'));
    await act(async () => {
      await result.current.sendAiMessage({ text: 'x' } as any);
    });
    expect(result.current.aiResponse?.text).toBe('object-path');
  });

  it('handles error on ai message', async () => {
    const svc = require('../../services/aiChatService');
    svc.askAiChat.mockRejectedValueOnce(new Error('x'));
    const { result } = renderHook(() => useAiChat('u1'));
    await act(async () => {
      await result.current.sendAiMessage({ text: 'hi' } as any);
    });
    expect(result.current.aiError).toBe('x');
  });

  it('avatar flows and chat history', async () => {
    const { result } = renderHook(() => useAiChat('u1'));
    await act(async () => {
      await result.current.sendAiAvatarMessage({} as any);
      await result.current.sendGameAvatarMessage({ message: 'm', gameSessionId: 's', sessionId: 'sid' } as any);
      await result.current.sendAutoAvatarMessage({ sessionId: 'sid' });
    });
    expect(result.current.avatarError).toBeNull();
    expect(result.current.avatarResponse).toEqual({ audioUrl: 'a' });

    await act(async () => {
      const msgs = await result.current.getChatHistory(0);
      expect(msgs.length).toBe(1);
    });

    const svc = require('../../services/aiChatService');
    svc.fetchChatHistory.mockRejectedValueOnce(new Error('e'));
    await act(async () => {
      const msgs = await result.current.getChatHistory(1);
      expect(msgs).toEqual([]);
    });
  });

  it('resets errors on subsequent success', async () => {
    const svc = require('../../services/aiChatService');
    const { result } = renderHook(() => useAiChat('u1'));
    await act(async () => {
      svc.askAiChat.mockRejectedValueOnce(new Error('ae'));
      await result.current.sendAiMessage({ text: 'x' } as any);
    });
    expect(result.current.aiError).toBe('ae');
    await act(async () => {
      svc.askAiChat.mockResolvedValueOnce({ data: 'ok' });
      await result.current.sendAiMessage({ text: 'y' } as any);
    });
    expect(result.current.aiError).toBeNull();

    await act(async () => {
      svc.askAiChatAvatar.mockRejectedValueOnce(new Error('ve'));
      await result.current.sendAiAvatarMessage({} as any);
    });
    expect(result.current.avatarError).toBe('ve');
    await act(async () => {
      svc.askAiChatAvatar.mockResolvedValueOnce({ data: { audioUrl: 'ok' } });
      await result.current.sendAiAvatarMessage({} as any);
    });
    expect(result.current.avatarError).toBeNull();
  });

  it('avatar error branches toggle correctly across calls', async () => {
    const svc = require('../../services/aiChatService');
    const { result } = renderHook(() => useAiChat('u1'));
    await act(async () => {
      svc.askGameAvatar.mockRejectedValueOnce(new Error('game err'));
      await result.current.sendGameAvatarMessage({ message: 'm', gameSessionId: 's', sessionId: 'sid' } as any);
    });
    expect(result.current.avatarError).toBe('game err');
    await act(async () => {
      svc.askGameAvatar.mockResolvedValueOnce({ data: { audioUrl: 'g2' } });
      await result.current.sendGameAvatarMessage({ message: 'm', gameSessionId: 's', sessionId: 'sid' } as any);
    });
    expect(result.current.avatarError).toBeNull();
    expect(result.current.avatarResponse).toEqual({ audioUrl: 'g2' });
  });

  it('auto avatar error branch then success clears error', async () => {
    const svc = require('../../services/aiChatService');
    const { result } = renderHook(() => useAiChat('u1'));
    await act(async () => {
      svc.askAutoAvatar.mockRejectedValueOnce(new Error('auto err'));
      await result.current.sendAutoAvatarMessage({ sessionId: 'sid' } as any);
    });
    expect(result.current.avatarError).toBe('auto err');
    await act(async () => {
      svc.askAutoAvatar.mockResolvedValueOnce({ data: { audioUrl: 'auto-ok' } });
      await result.current.sendAutoAvatarMessage({ sessionId: 'sid' } as any);
    });
    expect(result.current.avatarError).toBeNull();
    expect(result.current.avatarResponse).toEqual({ audioUrl: 'auto-ok' });
  });

  it('handles null data paths for ai and avatar responses', async () => {
    const svc = require('../../services/aiChatService');
    const { result } = renderHook(() => useAiChat('u1'));
    await act(async () => {
      svc.askAiChat.mockResolvedValueOnce({ data: null });
      await result.current.sendAiMessage({ text: 'z' } as any);
    });
    expect(result.current.aiResponse).toBeNull();

    await act(async () => {
      svc.askAiChatAvatar.mockResolvedValueOnce({ data: null });
      await result.current.sendAiAvatarMessage({} as any);
    });
    expect(result.current.avatarResponse).toBeNull();
  });
});

