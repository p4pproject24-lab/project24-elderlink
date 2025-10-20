import { mockApi } from './apiMock';

describe('memoryService', () => {
  beforeEach(() => { jest.resetModules(); jest.clearAllMocks(); });

  it('add core/contextual and get core information', async () => {
    mockApi({
      'post /memory/add-core': { message: 'ok', data: { id: 1 } },
      'post /memory/add-contextual': { message: 'ok', data: { id: 2 } },
      'get /memory/core-information': { data: { coreInformation: 'x' } },
    });
    const svc = require('../memoryService');
    expect((await svc.addCoreInformation('c')).success).toBe(true);
    expect((await svc.addContextualMemory('m')).success).toBe(true);
    expect((await svc.getCoreInformation())?.coreInformation).toBe('x');
  });

  it('handles API errors gracefully', async () => {
    const api = mockApi();
    api.post.mockRejectedValueOnce({ response: { data: { message: 'bad' } } });
    const svc = require('../memoryService');
    const res = await svc.addCoreInformation('c');
    expect(res.success).toBe(false);
    // getCoreInformation error path
    api.get.mockRejectedValueOnce(new Error('fail'));
    const core = await svc.getCoreInformation();
    expect(core).toBeNull();
    // addContextualMemory error distinct message
    api.post.mockRejectedValueOnce({});
    const res2 = await svc.addContextualMemory('z');
    expect(res2.success).toBe(false);
    expect(typeof res2.message).toBe('string');
  });

  it('picks server error message for contextual and default for core', async () => {
    const api = mockApi();
    const svc = require('../memoryService');
    api.post.mockRejectedValueOnce({ response: { data: { message: 'ctx fail' } } });
    const ctx = await svc.addContextualMemory('m');
    expect(ctx.message).toBe('ctx fail');

    api.post.mockRejectedValueOnce({});
    const core = await svc.addCoreInformation('m');
    expect(core.success).toBe(false);
    expect(core.message).toBe('Failed to add core information');
  });
});


