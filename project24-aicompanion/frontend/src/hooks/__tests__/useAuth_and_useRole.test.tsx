import React from 'react';
import { renderHook } from '@testing-library/react-native';
import { useAuth } from '../useAuth';
import { useRole } from '../useRole';

jest.mock('../../contexts/AuthContext', () => ({ useAuthContext: jest.fn(() => ({ user: { id: 'u1' } })) }));
jest.mock('../../contexts/UserRoleContext', () => ({ useUserRoleContext: jest.fn(() => ({ role: 'ELDERLY' })) }));

describe('useAuth and useRole wrappers', () => {
  it('returns value from AuthContext', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user?.id).toBe('u1');
  });

  it('returns value from UserRoleContext', () => {
    const { result } = renderHook(() => useRole());
    expect(result.current.role).toBe('ELDERLY');
  });
});


