jest.useFakeTimers();

jest.mock('firebase/auth', () => {
  const mockGetAuth = jest.fn(() => ({ currentUser: { uid: 'u' } }));
  return { getAuth: mockGetAuth, __esModule: true, default: {} };
});
jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(async () => ({ coords: { latitude: 1, longitude: 2 } })),
  Accuracy: { Balanced: 1 },
}));

jest.mock('../mapService', () => ({ mapService: { createLocation: jest.fn(async () => ({})) } }));

describe('locationTrackingService', () => {
  beforeEach(() => { jest.resetModules(); jest.clearAllMocks(); });

  it('starts and stops tracking, performs update', async () => {
    const { locationTrackingService } = require('../locationTrackingService');
    locationTrackingService.setUserId('u1');
    locationTrackingService.startTracking();
    expect(locationTrackingService.isActive()).toBe(true);
    // run scheduled interval once
    jest.runOnlyPendingTimers();
    locationTrackingService.stopTracking();
    expect(locationTrackingService.isActive()).toBe(false);
  });

  it('skips when not authenticated and stops on 401', async () => {
    const { locationTrackingService } = require('../locationTrackingService');
    // not authenticated
    const fa = require('firebase/auth');
    fa.getAuth.mockReturnValueOnce({ currentUser: null });
    locationTrackingService.setUserId('u1');
    locationTrackingService.startTracking();
    expect(locationTrackingService.isActive()).toBe(false);

    // 401 stop branch
    const map = require('../mapService');
    map.mapService.createLocation.mockRejectedValueOnce({ response: { status: 401 } });
    fa.getAuth.mockReturnValue({ currentUser: { uid: 'u' } });
    locationTrackingService.setUserId('u1');
    locationTrackingService.startTracking();
    // allow async updateLocation to run and handle 401
    await Promise.resolve();
    await Promise.resolve();
    jest.runOnlyPendingTimers();
    await Promise.resolve();
    expect(locationTrackingService.isActive()).toBe(false);
  });

  it('does not start when userId is missing and when already tracking', async () => {
    const { locationTrackingService } = require('../locationTrackingService');
    // no userId set
    locationTrackingService.stopTracking();
    locationTrackingService.startTracking();
    expect(locationTrackingService.isActive()).toBe(false);

    // set user and start
    locationTrackingService.setUserId('u1');
    locationTrackingService.startTracking();
    expect(locationTrackingService.isActive()).toBe(true);
    // call start again - should be ignored
    locationTrackingService.startTracking();
    expect(locationTrackingService.isActive()).toBe(true);
    locationTrackingService.stopTracking();
  });

  it('updateLocation permission not granted branch', async () => {
    const { locationTrackingService } = require('../locationTrackingService');
    const el = require('expo-location');
    const fa = require('firebase/auth');
    fa.getAuth.mockReturnValue({ currentUser: { uid: 'u' } });
    locationTrackingService.setUserId('u1');
    // deny permissions for this run
    el.getForegroundPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
    locationTrackingService.startTracking();
    jest.runOnlyPendingTimers();
    await Promise.resolve();
    expect(locationTrackingService.isActive()).toBe(true);
    locationTrackingService.stopTracking();
  });
});


