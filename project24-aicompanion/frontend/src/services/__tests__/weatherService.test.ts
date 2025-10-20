import { mockApi } from './apiMock';

describe('weatherService', () => {
  it('getWeatherData returns weather and location', async () => {
    mockApi({ 'get /weather/info?latitude=1&longitude=2': { weather: { temperature: 1 }, location: { city: 'c' } } });
    const { weatherService } = require('../weatherService');
    const res = await weatherService.getWeatherData(1, 2);
    expect(res.weather.temperature).toBe(1);
    expect(res.location.city).toBe('c');
  });
});


