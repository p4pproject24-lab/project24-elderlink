import { act, renderHook } from '@testing-library/react-native';
import { useGames } from '../useGames';

let mockFirebaseUser: any = { uid: 'u1' };
jest.mock('firebase/auth', () => ({ getAuth: () => ({ currentUser: mockFirebaseUser }) }));
jest.mock('../../services/gameService', () => ({
  __esModule: true,
  default: {
    getUserGameSessions: jest.fn().mockResolvedValue([{ id: 's1' }]),
    generateGamePreview: jest.fn().mockResolvedValue({ id: 'p1', description: 'desc' }),
    createGameSession: jest.fn().mockResolvedValue({ id: 's2' }),
    getGameSession: jest.fn().mockResolvedValue({ id: 's1' }),
    getGameMessages: jest.fn().mockResolvedValue([{ id: 'm1', gameSessionId: 's1', userId: 'u1', text: 'hi', fromUser: true, timestamp: 't' }]),
    sendGameMessage: jest.fn().mockResolvedValue('ai response'),
    deleteGameSession: jest.fn().mockResolvedValue(undefined),
  }
}));

describe('useGames', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFirebaseUser = { uid: 'u1' };
  });

  it('early returns when no user id', async () => {
    mockFirebaseUser = null;
    const { result } = renderHook(() => useGames());
    await act(async () => {
      await result.current.loadSessions();
      const preview = await result.current.generatePreview();
      const session = await result.current.createSession({ title: 't', description: 'd' } as any);
      expect(preview).toBeNull();
      expect(session).toBeNull();
    });
  });

  it('loads sessions and messages, and handles session load', async () => {
    const { result } = renderHook(() => useGames());
    const GameService = require('../../services/gameService').default;
    await act(async () => {
      await result.current.loadSessions();
      await result.current.loadSession('s1');
      await result.current.loadMessages('s1');
    });
    expect(GameService.getUserGameSessions).toHaveBeenCalledWith('u1');
    expect(GameService.getGameSession).toHaveBeenCalledWith('s1');
    expect(GameService.getGameMessages).toHaveBeenCalledWith('s1');
  });

  it('creates session, sends message, and deletes session', async () => {
    const { result } = renderHook(() => useGames());
    const GameService = require('../../services/gameService').default;
    await act(async () => {
      const session = await result.current.createSession({ title: 't', description: 'd' } as any);
      const response = await result.current.sendMessage('s1', 'hello');
      await result.current.deleteSession('s1');
      expect(session?.id).toBe('s2');
      expect(response).toBe('ai response');
    });
    expect(GameService.createGameSession).toHaveBeenCalled();
    expect(GameService.sendGameMessage).toHaveBeenCalled();
    expect(GameService.deleteGameSession).toHaveBeenCalled();
  });

  it('handles errors for key operations', async () => {
    const GameService = require('../../services/gameService').default;
    GameService.getUserGameSessions.mockRejectedValueOnce(new Error('x'));
    GameService.generateGamePreview.mockRejectedValueOnce(new Error('x'));
    GameService.createGameSession.mockRejectedValueOnce(new Error('x'));
    GameService.getGameSession.mockRejectedValueOnce(new Error('x'));
    GameService.getGameMessages.mockRejectedValueOnce(new Error('x'));
    GameService.sendGameMessage.mockRejectedValueOnce(new Error('x'));
    GameService.deleteGameSession.mockRejectedValueOnce(new Error('x'));

    const { result } = renderHook(() => useGames());
    await act(async () => {
      await result.current.loadSessions();
      await result.current.generatePreview();
      await result.current.createSession({ title: 't', description: 'd' } as any);
      await result.current.loadSession('s1');
      await result.current.loadMessages('s1');
      await result.current.sendMessage('s1', 'hello');
      await result.current.deleteSession('s1');
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});
