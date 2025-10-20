jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(async () => ({ coords: { latitude: 1, longitude: 2 } })),
  reverseGeocodeAsync: jest.fn(async () => ([{ city: 'c' }])),
}));

describe('locationService', () => {
  it('getLocationAndAddress returns coords and address', async () => {
    const svc = require('../locationService');
    const res = await svc.getLocationAndAddress();
    expect(res?.coords.latitude).toBe(1);
    expect(res?.address?.city).toBe('c');
  });

  it('returns null when permission denied', async () => {
    const el = require('expo-location');
    el.requestForegroundPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
    const svc = require('../locationService');
    const res = await svc.getLocationAndAddress();
    expect(res).toBeNull();
  });
});


