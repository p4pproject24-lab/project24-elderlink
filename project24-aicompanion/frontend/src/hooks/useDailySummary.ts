import { useState, useCallback } from 'react';
import { dailySummaryService, DailySummary } from '../services/dailySummaryService';

export function useDailySummary(userId: string | undefined, date: string) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [canGenerate, setCanGenerate] = useState(false);
  const [exists, setExists] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const [canGen, summaryData] = await Promise.all([
        dailySummaryService.canGenerate(userId, date),
        dailySummaryService.getByDate(userId, date).catch(() => null),
      ]);
      setCanGenerate(canGen.canGenerate);
      setExists(canGen.exists);
      setSummary(summaryData);
    } catch (e: any) {
      setError('Failed to load daily summary.');
    } finally {
      setLoading(false);
    }
  }, [userId, date]);

  const generateSummary = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const newSummary = await dailySummaryService.generate(userId, date);
      setSummary(newSummary);
      setExists(true);
      setCanGenerate(false);
      return newSummary;
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to generate summary.');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [userId, date]);

  return {
    summary,
    loading,
    error,
    canGenerate,
    exists,
    fetchSummary,
    generateSummary,
  };
} 