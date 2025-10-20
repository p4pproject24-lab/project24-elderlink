import { mockApi } from './apiMock';

describe('mapService', () => {
  beforeEach(() => { jest.resetModules(); jest.clearAllMocks(); });

  it('create and get locations', async () => {
    mockApi({ 'post /locations': { ok: true }, 'get /locations?userId=u1&page=0&size=10': [{ id: 1 }] });
    const { mapService } = require('../mapService');
    await mapService.createLocation({ userId: 'u1', latitude: 1, longitude: 2 });
    const list = await mapService.getLocations('u1');
    expect(list.length).toBe(1);
  });
});


