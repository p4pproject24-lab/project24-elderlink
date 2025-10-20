import api from '../lib/api';

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  condition: string;
  description: string;
  icon: string;
  windSpeed: number;
  windDir: string;
  pressure: number;
  cloud: number;
  uv: number;
  isDay: number;
  lastUpdated: string;
}

export interface LocationData {
  city: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  tz_id: string;
  localtime: string;
}

export const weatherService = {
  getWeatherData: async (latitude: number, longitude: number) => {
    const apiInstance = await api();
    const response = await apiInstance.get(`/weather/info?latitude=${latitude}&longitude=${longitude}`);
    return response.data as { weather: WeatherData; location: LocationData };
  },
}; 