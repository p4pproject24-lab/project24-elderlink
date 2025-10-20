import { useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { weatherService, WeatherData, LocationData } from '../services/weatherService';

export function useWeather() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access location was denied');
        setLoading(false);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      const data = await weatherService.getWeatherData(location.coords.latitude, location.coords.longitude);
      setWeatherData(data.weather);
      setLocationData(data.location);
    } catch (e: any) {
      setError('Unable to get weather/location data');
      setWeatherData(null);
      setLocationData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    weatherData,
    locationData,
    loading,
    error,
    refresh: fetchWeather,
  };
} 