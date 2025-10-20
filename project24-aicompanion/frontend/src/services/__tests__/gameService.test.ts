import { mockApi } from './apiMock';

describe('GameService', () => {
  beforeEach(() => { jest.resetModules(); jest.clearAllMocks(); });

  it('covers major GameService methods', async () => {
    mockApi({
      'post /games/preview': { id: 'p' },
      'post /games/create': { id: 's' },
      'get /games/sessions': [{ id: '1' }],
      'get /games/sessions/abc': { id: 'abc' },
      'post /games/sessions/abc/message': 'ok',
      'get /games/sessions/abc/messages': [{ id: 'm1' }],
      'delete /games/sessions/abc': {},
    });
    const GameService = require('../gameService').default;
    expect((await GameService.generateGamePreview('u1')).id).toBe('p');
    expect((await GameService.createGameSession('u1', {})).id).toBe('s');
    expect((await GameService.getUserGameSessions('u1')).length).toBe(1);
    expect((await GameService.getGameSession('abc')).id).toBe('abc');
    expect(await GameService.sendGameMessage('abc', 'u1', { message: 'm' })).toBe('ok');
    expect((await GameService.getGameMessages('abc')).length).toBe(1);
    await GameService.deleteGameSession('abc');
  });
});


