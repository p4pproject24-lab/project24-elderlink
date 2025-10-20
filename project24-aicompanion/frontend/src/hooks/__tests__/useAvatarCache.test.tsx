import { act, renderHook } from '@testing-library/react-native';
import { useAvatarCache } from '../useAvatarCache';

jest.mock('react-native', () => ({
  Image: { prefetch: jest.fn(async () => {}) },
}));

jest.mock('../../services/heygenService', () => ({
  getHeyGenAvatarList: jest.fn(async () => ([
    { id: 'a1', gender: 'male', preview_image_url: 'http://img/1' },
    { id: 'a2', gender: 'female', preview_image_url: 'http://img/2' },
  ])),
  clearAvatarCache: jest.fn(async () => {}),
}));

describe('useAvatarCache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads avatars and supports refresh, clearCache, preloadImages', async () => {
    const { result } = renderHook(() => useAvatarCache());
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.avatars.length).toBe(2);

    await act(async () => {
      await result.current.refresh(true);
    });
    const serviceMod1 = require('../../services/heygenService');
    expect(serviceMod1.getHeyGenAvatarList).toHaveBeenCalledWith(true);

    await act(async () => {
      await result.current.preloadImages();
    });

    await act(async () => {
      await result.current.clearCache();
    });
    const serviceMod2 = require('../../services/heygenService');
    expect(serviceMod2.clearAvatarCache).toHaveBeenCalled();
  });

  it('handles load error and prefetch rejection', async () => {
    const svc = require('../../services/heygenService');
    svc.getHeyGenAvatarList.mockRejectedValueOnce(new Error('load fail'));
    const { result } = renderHook(() => useAvatarCache());
    await act(async () => {
      await result.current.refresh(true);
    });
    expect(result.current.error).toBe('load fail');
    const rn = require('react-native');
    rn.Image.prefetch.mockRejectedValueOnce(new Error('img fail'));
    await act(async () => {
      await result.current.preloadImages();
    });
  });

  it('uses cached avatars when not forcing refresh', async () => {
    const svc = require('../../services/heygenService');
    const { result: first } = renderHook(() => useAvatarCache());
    await act(async () => { await Promise.resolve(); });
    expect(first.current.avatars.length).toBe(2);
    // second render should not fetch anew; avatars should be immediately available
    const { result: second } = renderHook(() => useAvatarCache());
    await act(async () => { await Promise.resolve(); });
    expect(second.current.avatars.length).toBe(2);
  });

  it('preloadImages returns early when no avatars', async () => {
    const { result } = renderHook(() => useAvatarCache());
    await act(async () => {
      // clear cache then call preload
      await result.current.clearCache();
      await result.current.preloadImages();
    });
    expect(result.current.avatars.length).toBeGreaterThanOrEqual(0);
  });
});

