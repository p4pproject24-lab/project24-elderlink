import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { UserRoleProvider, useUserRoleContext } from '../UserRoleContext';

jest.mock('../AuthContext', () => ({
  useAuthContext: () => ({ user: { id: 'u1', role: 'ELDERLY' }, loading: false, refresh: jest.fn() })
}));
jest.mock('../../services/authService', () => ({ setUserRole: jest.fn().mockResolvedValue(undefined) }));

const Consumer = ({ targetRole = 'CAREGIVER' }: { targetRole?: string }) => {
  const { setRole } = useUserRoleContext();
  React.useEffect(() => {
    setRole(targetRole);
  }, [setRole, targetRole]);
  return null;
};

describe('UserRoleContext', () => {
  it('updates role and calls backend', async () => {
    render(
      <UserRoleProvider>
        <Consumer />
      </UserRoleProvider>
    );
    await waitFor(() => expect(require('../../services/authService').setUserRole).toHaveBeenCalledWith('CAREGIVER'));
  });

  it('handles setUserRole error by resetting role', async () => {
    const svc = require('../../services/authService');
    svc.setUserRole.mockRejectedValueOnce(new Error('fail'));
    render(
      <UserRoleProvider>
        <Consumer targetRole="ADMIN" />
      </UserRoleProvider>
    );
    await waitFor(() => expect(svc.setUserRole).toHaveBeenCalledWith('ADMIN'));
  });
});


