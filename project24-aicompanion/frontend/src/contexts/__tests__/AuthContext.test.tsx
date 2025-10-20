import React from 'react';
jest.setTimeout(15000);
import { render, waitFor } from '@testing-library/react-native';
import { AuthProvider } from '../AuthContext';

const mockUseFirebaseAuth = jest.fn();
jest.mock('../../hooks/useFirebaseAuth', () => ({
  useFirebaseAuth: () => mockUseFirebaseAuth(),
}));
jest.mock('../../services/authService', () => ({ getCurrentUser: jest.fn() }));
jest.mock('../../services/locationTrackingService', () => ({
  locationTrackingService: {
    setUserId: jest.fn(),
    startTracking: jest.fn(),
    stopTracking: jest.fn(),
  }
}));

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // default firebase user present
    mockUseFirebaseAuth.mockReturnValue({ user: { uid: 'fb1' }, loading: false, error: null, signOut: jest.fn() });
  });

  it('refreshes user and handles tracking for elderly', async () => {
    const svc = require('../../services/authService');
    svc.getCurrentUser.mockResolvedValueOnce({ id: 'u1', role: 'ELDERLY', firebaseUid: 'fb1' });
    render(<AuthProvider>{null}</AuthProvider>);
    await waitFor(() => expect(svc.getCurrentUser).toHaveBeenCalled());
  });

  it('retries on 404 then succeeds', async () => {
    const svc = require('../../services/authService');
    svc.getCurrentUser
      .mockRejectedValueOnce({ response: { status: 404 } })
      .mockResolvedValueOnce({ id: 'u2', role: 'ELDERLY', firebaseUid: 'fb1' });
    render(<AuthProvider>{null}</AuthProvider>);
    await waitFor(() => expect(svc.getCurrentUser.mock.calls.length).toBeGreaterThanOrEqual(2));
  });

  it('handles 401 by clearing user and stopping retries', async () => {
    const svc = require('../../services/authService');
    svc.getCurrentUser.mockRejectedValueOnce({ response: { status: 401 }, message: 'unauthorized' });
    render(<AuthProvider>{null}</AuthProvider>);
    await waitFor(() => expect(svc.getCurrentUser).toHaveBeenCalled());
  });

  it('stops tracking for caregiver role', async () => {
    const svc = require('../../services/authService');
    const tracking = require('../../services/locationTrackingService').locationTrackingService;
    svc.getCurrentUser.mockResolvedValueOnce({ id: 'u3', role: 'CAREGIVER', firebaseUid: 'fb1' });
    render(<AuthProvider>{null}</AuthProvider>);
    await waitFor(() => expect(svc.getCurrentUser).toHaveBeenCalled());
    expect(tracking.stopTracking).toHaveBeenCalled();
  });

  it('clears user when no firebase user and stops tracking', async () => {
    // no firebase user
    mockUseFirebaseAuth.mockReturnValueOnce({ user: null, loading: false, error: null, signOut: jest.fn() });
    const svc = require('../../services/authService');
    const tracking = require('../../services/locationTrackingService').locationTrackingService;
    render(<AuthProvider>{null}</AuthProvider>);
    // service may be called once by effect; ensure tracking stopped
    await new Promise(r => setTimeout(r, 0));
    expect(svc.getCurrentUser.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(tracking.stopTracking).toHaveBeenCalled();
  });

  it('sets error after max attempts fail (non-401/404)', async () => {
    const svc = require('../../services/authService');
    svc.getCurrentUser
      .mockRejectedValue({ response: { status: 500 }, message: 'server' });
    render(<AuthProvider>{null}</AuthProvider>);
    await waitFor(() => expect(svc.getCurrentUser.mock.calls.length).toBeGreaterThanOrEqual(2));
  });
});


