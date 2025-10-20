import { mockApi } from './apiMock';

describe('authService', () => {
  beforeEach(() => { jest.resetModules(); jest.clearAllMocks(); });

  it('getCurrentUser returns user', async () => {
    mockApi({ 'get /auth/me': { data: { user: { id: 'u1' } } } });
    const svc = require('../authService');
    const user = await svc.getCurrentUser();
    expect(user.id).toBe('u1');
  });

  it('setUserRole calls API', async () => {
    const api = mockApi();
    const svc = require('../authService');
    await svc.setUserRole('ELDERLY');
    expect(api.put).toHaveBeenCalledWith('/auth/role', { role: 'ELDERLY' });
  });
});


