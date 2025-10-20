import { mockApi } from './apiMock';

jest.mock('@react-native-async-storage/async-storage', () => ({ __esModule: true, default: { getItem: jest.fn(async () => null), setItem: jest.fn(async () => {}), removeItem: jest.fn(async () => {}) } }));

describe('heygenService', () => {
  beforeEach(() => { jest.resetModules(); jest.clearAllMocks(); });

  it('session and task endpoints', async () => {
    mockApi({
      'get /heygen/session-token': { status: 200, data: 'tok' },
      'post /heygen/create-session': { status: 200, data: { id: 's1' } },
      'post /heygen/start-session': { status: 200, data: { id: 's1' } },
      'post /heygen/task': { duration_ms: 10, task_id: 't1' },
    });
    const svc = require('../heygenService');
    expect((await svc.getHeyGenSessionToken()).data).toBe('tok');
    expect((await svc.createHeyGenSession({})).data.id).toBe('s1');
    expect((await svc.startHeyGenSession({})).data.id).toBe('s1');
    const task = await svc.sendHeyGenTask('sid', 'hi');
    expect(task.task_id).toBe('t1');
  });

  it('avatar list caching and fallback', async () => {
    const storage = require('@react-native-async-storage/async-storage').default;
    const api = mockApi({ 'get /heygen/avatar-list': { avatars: [{ id: 'a1', gender: 'm', preview_image_url: 'u' }] } });
    const svc = require('../heygenService');
    const list = await svc.getHeyGenAvatarList(true);
    expect(list.length).toBe(1);
    // fallback to cache on API error
    storage.getItem.mockResolvedValueOnce(JSON.stringify({ avatars: list, timestamp: Date.now() }));
    storage.getItem.mockResolvedValueOnce(Date.now().toString());
    mockApi({});
    const list2 = await svc.getHeyGenAvatarList(false);
    expect(list2.length).toBe(1);
  });

  it('uses cached avatar list when cache is fresh; falls back to empty when no cache', async () => {
    const storage = require('@react-native-async-storage/async-storage').default;
    // Fresh cache
    const cache = { avatars: [{ id: 'a2', gender: 'f', preview_image_url: 'v' }], timestamp: Date.now() };
    storage.getItem.mockResolvedValueOnce(JSON.stringify(cache));
    storage.getItem.mockResolvedValueOnce(String(Date.now()));
    mockApi({});
    const svc = require('../heygenService');
    const list = await svc.getHeyGenAvatarList(false);
    expect(list[0].id).toBe('a2');

    // No cache returns [] on error
    storage.getItem.mockResolvedValueOnce(null);
    const listEmpty = await svc.getHeyGenAvatarList(false);
    expect(Array.isArray(listEmpty)).toBe(true);
  });

  it('getHeyGenAvatarDetails handles error', async () => {
    mockApi();
    const svc = require('../heygenService');
    const res = await svc.getHeyGenAvatarDetails('x');
    expect(res.previewImageUrl).toBeNull();
  });

  it('clearAvatarCache catches errors', async () => {
    const storage = require('@react-native-async-storage/async-storage').default;
    storage.removeItem.mockRejectedValueOnce(new Error('x'));
    const svc = require('../heygenService');
    await svc.clearAvatarCache();
    expect(storage.removeItem).toHaveBeenCalled();
  });

  it('preloadAvatarImages tolerates prefetch failure', async () => {
    jest.doMock('react-native', () => ({ Image: { prefetch: jest.fn(async () => { throw new Error('fail'); }) } }));
    const svc = require('../heygenService');
    await svc.preloadAvatarImages([{ id: 'a', gender: 'm', preview_image_url: 'u' }]);
  });
});


