import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import DailySummaries from '../DailySummaries';

jest.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }));
jest.mock('../../hooks/useFirebaseAuth', () => ({ useFirebaseAuth: () => ({ user: { uid: 'u1' } }) }));
const mockGetAll = jest.fn();
jest.mock('../../services/dailySummaryService', () => ({
  dailySummaryService: {
    getAll: (...args: any[]) => mockGetAll(...args),
  },
}));
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ navigate: jest.fn() }) }));

describe.skip('DailySummaries', () => {
  beforeEach(() => {
    mockGetAll.mockReset();
    mockGetAll.mockResolvedValue([]);
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });
  it('renders empty state', async () => {
    const { getByText } = render(<DailySummaries />);
    await waitFor(() => expect(getByText('No summaries yet')).toBeTruthy());
  });

  it('renders list when data present', async () => {
    mockGetAll.mockImplementationOnce(async () => {
      return [
        { id: '1', date: new Date().toISOString(), scores: { mood: 8, sleep: 7 }, summary: 'Good day' },
      ];
    });
    const { getByText } = render(<DailySummaries />);
    await waitFor(() => expect(mockGetAll).toHaveBeenCalled());
    await act(async () => {
      await Promise.resolve();
    });
    expect(getByText('Good day')).toBeTruthy();
  });
});


