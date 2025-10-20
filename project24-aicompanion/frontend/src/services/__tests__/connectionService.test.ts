import { mockApi } from './apiMock';

jest.mock('sockjs-client', () => jest.fn(() => ({ })), { virtual: true });
class MockClient {
  public onConnect?: () => void;
  constructor(public cfg: any) {}
  activate() { this.cfg.onConnect?.(); }
  subscribe(_topic: string, cb: any) { cb({ body: JSON.stringify({ ok: true }) }); }
}
jest.mock('@stomp/stompjs', () => ({ Client: MockClient }));

describe('connectionService', () => {
  beforeEach(() => { jest.resetModules(); jest.clearAllMocks(); });

  it('REST endpoints', async () => {
    mockApi({
      'post /connections/request?caregiverId=c1&elderlyId=e1': { ok: true },
      'get /connections/pending?elderlyId=e1': [{ id: 1 }],
      'post /connections/approve?connectionId=cid': { ok: true },
      'post /connections/reject?connectionId=cid': { ok: true },
      'get /connections/caregiver-list?elderlyId=e1': [{ id: 'c' }],
      'get /connections/elderly-list?caregiverId=c1': [{ id: 'e' }],
    });
    const svc = require('../connectionService');
    await svc.sendConnectionRequest('c1', 'e1');
    await svc.getPendingRequestsForElderly('e1');
    await svc.approveConnection('cid');
    await svc.rejectConnection('cid');
    await svc.getLinkedCaregiversForElderly('e1');
    await svc.getConnectedElderlyForCaregiver('c1');
  });

  it('websocket helpers', async () => {
    mockApi();
    const svc = require('../connectionService');
    const msgs: any[] = [];
    const c1 = await svc.connectElderlyConnectionRequestsWebSocket('e1', (m: any) => msgs.push(m));
    const c2 = await svc.connectCaregiverConnectionApprovalsWebSocket('c1', (m: any) => msgs.push(m));
    expect(msgs.length).toBeGreaterThan(0);
  });
});


