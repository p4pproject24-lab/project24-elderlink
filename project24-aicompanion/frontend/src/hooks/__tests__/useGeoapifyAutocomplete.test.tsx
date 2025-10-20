import { act, renderHook } from '@testing-library/react-native';
import { useGeoapifyAutocomplete } from '../useGeoapifyAutocomplete';

jest.useFakeTimers();

jest.mock('../../services/geoapifyService', () => ({
  fetchAddressSuggestions: jest.fn().mockResolvedValue({ results: [{ name: 'A' }] })
}));

describe('useGeoapifyAutocomplete', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('early returns for short queries', () => {
    const { result, unmount } = renderHook(() => useGeoapifyAutocomplete('ab'));
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    unmount();
  });

  it('fetches suggestions after debounce and handles success', async () => {
    const { result, unmount } = renderHook(() => useGeoapifyAutocomplete('abcd'));
    expect(result.current.loading).toBe(true);
    await act(async () => {
      jest.runAllTimers();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.suggestions).toEqual([{ name: 'A' }]);
    expect(result.current.loading).toBe(false);
    act(() => {
      unmount();
      jest.runOnlyPendingTimers();
    });
  });

  it('handles error from service', async () => {
    const svc = require('../../services/geoapifyService');
    svc.fetchAddressSuggestions.mockRejectedValueOnce(new Error('boom'));
    const { result, unmount } = renderHook(() => useGeoapifyAutocomplete('abcd'));
    await act(async () => {
      jest.runAllTimers();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.error).toBe('boom');
    expect(result.current.suggestions).toEqual([]);
    act(() => {
      unmount();
      jest.runOnlyPendingTimers();
    });
  });
});


