import { act, renderHook } from '@testing-library/react-native';
import { useLocationTracking } from '../useLocationTracking';

jest.useFakeTimers();

const mockStartTracking = jest.fn();
const mockStopTracking = jest.fn();
let mockActive = false;

jest.mock('../../services/locationTrackingService', () => ({
  locationTrackingService: {
    isActive: () => mockActive,
    startTracking: () => { mockActive = true; mockStartTracking(); },
    stopTracking: () => { mockActive = false; mockStopTracking(); },
  }
}));

describe('useLocationTracking', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    mockStartTracking.mockClear();
    mockStopTracking.mockClear();
    mockActive = false;
  });

  it('polls isActive on interval and updates state', () => {
    const { result, unmount } = renderHook(() => useLocationTracking());
    expect(result.current.isActive).toBe(false);
    act(() => { jest.advanceTimersByTime(1000); });
    expect(result.current.isActive).toBe(false);
    act(() => { result.current.startTracking(); });
    expect(mockStartTracking).toHaveBeenCalled();
    expect(result.current.isActive).toBe(true);
    act(() => { jest.advanceTimersByTime(1000); });
    expect(result.current.isActive).toBe(true);
    act(() => { result.current.stopTracking(); });
    expect(mockStopTracking).toHaveBeenCalled();
    expect(result.current.isActive).toBe(false);
    act(() => {
      unmount();
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });
  });
});


