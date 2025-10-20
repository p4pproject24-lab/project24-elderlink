import { act, renderHook } from '@testing-library/react-native';
import { useDailySummary } from '../useDailySummary';

jest.mock('../../services/dailySummaryService', () => ({
  dailySummaryService: {
    canGenerate: jest.fn().mockResolvedValue({ canGenerate: true, exists: false }),
    getByDate: jest.fn().mockResolvedValue({ id: 's1' }),
    generate: jest.fn().mockResolvedValue({ id: 's2' }),
  }
}));

describe('useDailySummary', () => {
  const date = '2025-01-01';
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('early returns when no userId', async () => {
    const { result } = renderHook(() => useDailySummary(undefined, date));
    await act(async () => {
      await result.current.fetchSummary();
      const gen = await result.current.generateSummary();
      expect(gen).toBeUndefined();
    });
  });

  it('fetches summary and flags', async () => {
    const { result } = renderHook(() => useDailySummary('u1', date));
    const svc = require('../../services/dailySummaryService').dailySummaryService;
    await act(async () => {
      await result.current.fetchSummary();
    });
    expect(svc.canGenerate).toHaveBeenCalledWith('u1', date);
    expect(svc.getByDate).toHaveBeenCalledWith('u1', date);
    expect(result.current.canGenerate).toBe(true);
    expect(result.current.exists).toBe(false);
    expect(result.current.summary).toEqual({ id: 's1' });
  });

  it('handles getByDate failure gracefully', async () => {
    const svc = require('../../services/dailySummaryService').dailySummaryService;
    svc.getByDate.mockRejectedValueOnce(new Error('x'));
    const { result } = renderHook(() => useDailySummary('u1', date));
    await act(async () => {
      await result.current.fetchSummary();
    });
    expect(result.current.summary).toEqual(null);
    expect(result.current.error).toBeNull();
  });

  it('generates summary and updates state', async () => {
    const { result } = renderHook(() => useDailySummary('u1', date));
    const svc = require('../../services/dailySummaryService').dailySummaryService;
    await act(async () => {
      const newSum = await result.current.generateSummary();
      expect(newSum).toEqual({ id: 's2' });
    });
    expect(svc.generate).toHaveBeenCalledWith('u1', date);
    expect(result.current.exists).toBe(true);
    expect(result.current.canGenerate).toBe(false);
  });

  it('sets error on generate failure', async () => {
    const svc = require('../../services/dailySummaryService').dailySummaryService;
    svc.generate.mockRejectedValueOnce({ response: { data: { error: 'boom' } } });
    const { result } = renderHook(() => useDailySummary('u1', date));
    await act(async () => {
      await expect(result.current.generateSummary()).rejects.toBeTruthy();
    });
    expect(result.current.error).toBe('boom');
  });
});


