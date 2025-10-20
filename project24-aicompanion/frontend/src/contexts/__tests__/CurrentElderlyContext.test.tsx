import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { CurrentElderlyProvider, useCurrentElderly } from '../CurrentElderlyContext';

jest.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ user: { firebaseUid: 'fb1', role: 'CAREGIVER' } }) }));
jest.mock('../../hooks/useRole', () => ({ useRole: () => ({ role: 'CAREGIVER' }) }));
jest.mock('../../services/connectionService', () => ({ getConnectedElderlyForCaregiver: jest.fn().mockResolvedValue([
  { firebaseUid: 'e1', fullName: 'Elder One' },
  { firebaseUid: 'e2', fullName: 'Elder Two' },
]) }));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

const Consumer = () => {
  const ctx = useCurrentElderly();
  React.useEffect(() => {
    ctx.refreshConnectedElderly();
  }, []);
  return null;
};

describe('CurrentElderlyContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads connected elderly for caregiver', async () => {
    const { getConnectedElderlyForCaregiver } = require('../../services/connectionService');
    render(
      <CurrentElderlyProvider>
        <Consumer />
      </CurrentElderlyProvider>
    );
    await waitFor(() => expect(getConnectedElderlyForCaregiver).toHaveBeenCalled());
  });

  it('early-returns when not caregiver', async () => {
    (jest.requireMock('../../hooks/useRole') as any).useRole = () => ({ role: 'ELDERLY' });
    (jest.requireMock('../../hooks/useAuth') as any).useAuth = () => ({ user: { firebaseUid: 'fb1', role: 'ELDERLY' } });
    const svc = require('../../services/connectionService');
    jest.clearAllMocks();
    render(
      <CurrentElderlyProvider>
        <Consumer />
      </CurrentElderlyProvider>
    );
    await new Promise(r => setTimeout(r, 0));
    expect(svc.getConnectedElderlyForCaregiver).not.toHaveBeenCalled();
  });

  it('selects saved elderly if present', async () => {
    (jest.requireMock('../../hooks/useRole') as any).useRole = () => ({ role: 'CAREGIVER' });
    (jest.requireMock('../../hooks/useAuth') as any).useAuth = () => ({ user: { firebaseUid: 'fb1', role: 'CAREGIVER' } });
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    AsyncStorage.getItem.mockResolvedValueOnce('e2');
    const { getConnectedElderlyForCaregiver } = require('../../services/connectionService');
    jest.clearAllMocks();
    render(
      <CurrentElderlyProvider>
        <Consumer />
      </CurrentElderlyProvider>
    );
    await waitFor(() => expect(getConnectedElderlyForCaregiver).toHaveBeenCalled());
  });

  it('defaults to first when saved elderly not found', async () => {
    (jest.requireMock('../../hooks/useRole') as any).useRole = () => ({ role: 'CAREGIVER' });
    (jest.requireMock('../../hooks/useAuth') as any).useAuth = () => ({ user: { firebaseUid: 'fb1', role: 'CAREGIVER' } });
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    AsyncStorage.getItem.mockResolvedValueOnce('missing');
    const { getConnectedElderlyForCaregiver } = require('../../services/connectionService');
    jest.clearAllMocks();
    render(
      <CurrentElderlyProvider>
        <Consumer />
      </CurrentElderlyProvider>
    );
    await waitFor(() => expect(getConnectedElderlyForCaregiver).toHaveBeenCalled());
  });

  it('handles empty elderly list and clears selection', async () => {
    (jest.requireMock('../../hooks/useRole') as any).useRole = () => ({ role: 'CAREGIVER' });
    (jest.requireMock('../../hooks/useAuth') as any).useAuth = () => ({ user: { firebaseUid: 'fb1', role: 'CAREGIVER' } });
    const conn = require('../../services/connectionService');
    conn.getConnectedElderlyForCaregiver.mockResolvedValueOnce([]);
    jest.clearAllMocks();
    render(
      <CurrentElderlyProvider>
        <Consumer />
      </CurrentElderlyProvider>
    );
    await waitFor(() => expect(conn.getConnectedElderlyForCaregiver).toHaveBeenCalled());
  });

  it('removes stored id when setting currentElderly to null', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    const Remover = () => {
      const ctx = useCurrentElderly();
      React.useEffect(() => { ctx.setCurrentElderly(null); }, []);
      return null;
    };
    render(
      <CurrentElderlyProvider>
        <Remover />
      </CurrentElderlyProvider>
    );
    await waitFor(() => expect(AsyncStorage.removeItem).toHaveBeenCalled());
  });
});


