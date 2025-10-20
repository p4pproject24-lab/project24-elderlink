import { act, renderHook } from '@testing-library/react-native';
import { useWeather } from '../useWeather';

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({ coords: { latitude: 1, longitude: 2 } }),
}));

jest.mock('../../services/weatherService', () => ({
  weatherService: {
    getWeatherData: jest.fn().mockResolvedValue({ weather: { temp: 70 }, location: { city: 'X' } })
  }
}));

describe('useWeather', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches weather with granted permission', async () => {
    const { result } = renderHook(() => useWeather());
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.weatherData).toEqual({ temp: 70 });
    expect(result.current.locationData).toEqual({ city: 'X' });
    expect(result.current.error).toBeNull();
  });

  it('handles denied permission', async () => {
    const Location = require('expo-location');
    Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
    const { result } = renderHook(() => useWeather());
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.error).toBe('Permission to access location was denied');
  });

  it('handles failures in fetching data', async () => {
    const Location = require('expo-location');
    const svc = require('../../services/weatherService').weatherService;
    Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
    Location.getCurrentPositionAsync.mockRejectedValueOnce(new Error('loc fail'));
    const { result } = renderHook(() => useWeather());
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.error).toBe('Unable to get weather/location data');
    expect(result.current.weatherData).toBeNull();
    expect(result.current.locationData).toBeNull();
    expect(svc.getWeatherData).not.toHaveBeenCalled();
  });
});


