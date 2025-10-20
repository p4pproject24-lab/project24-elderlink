import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { AvatarPreloaderProvider, useAvatarPreloader } from '../AvatarPreloaderContext';

jest.mock('../../hooks/useAvatarCache', () => ({
  useAvatarCache: () => ({ avatars: [{ id: 'a1' }], preloadImages: jest.fn().mockResolvedValue(undefined) })
}));

const Consumer = () => {
  const { isPreloaded, preloadProgress } = useAvatarPreloader();
  return null;
};

describe('AvatarPreloaderContext', () => {
  it('preloads avatars on startup', async () => {
    render(
      <AvatarPreloaderProvider>
        <Consumer />
      </AvatarPreloaderProvider>
    );
    await waitFor(() => expect(require('../../hooks/useAvatarCache').useAvatarCache().preloadImages).toBeDefined());
  });
});


