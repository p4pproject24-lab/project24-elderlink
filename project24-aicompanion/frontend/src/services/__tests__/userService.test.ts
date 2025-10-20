import { mockApi } from './apiMock';

jest.mock('expo-file-system', () => ({ readAsStringAsync: jest.fn(async () => 'BASE64'), EncodingType: { Base64: 'base64' } }));

describe('userService', () => {
  beforeEach(() => { jest.resetModules(); jest.clearAllMocks(); });

  it('updateUserProfile and favorites', async () => {
    mockApi({
      'put /users/profile': { status: 200 },
      'get /users/favorites?userId=u1': ['f1'],
      'post /users/favorites/toggle?userId=u1&targetUserId=u2&type=elderly': { ok: true },
      'get /users/profile-flow/status': { ok: true },
      'put /users/profile-flow/step?step=2': { ok: true },
      'put /users/profile-flow/step/back?step=1': { ok: true },
      'post /users/profile-flow/complete': { ok: true },
      'get /users/profile-flow/should-show': { shouldShow: false },
    });
    const svc = require('../userService');
    await svc.updateUserProfile({ fullName: 'A', address: 'B', dateOfBirth: 'C', phoneNumber: 'D' });
    expect((await svc.getFavorites('u1')).length).toBe(1);
    await svc.toggleFavorite('u1', 'u2', 'elderly');
    expect(await svc.getProfileFlowStatus()).toBeTruthy();
    await svc.updateProfileStep(2);
    await svc.goBackToStep(1);
    await svc.completeProfileFlow();
    expect(await svc.shouldShowProfileFlow()).toBe(false);
  });

  it('convertImageToBase64 picks mime type by extension', async () => {
    const svc = require('../userService');
    const png = await svc.convertImageToBase64('file:///x.png');
    expect(png.startsWith('data:image/png;base64,')).toBe(true);
    const jpg = await svc.convertImageToBase64('file:///x.jpg');
    expect(jpg.startsWith('data:image/jpeg;base64,')).toBe(true);
  });
});


