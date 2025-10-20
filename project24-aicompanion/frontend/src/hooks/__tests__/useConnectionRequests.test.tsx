import { renderHook, act } from '@testing-library/react-native';
import { useConnectionRequests } from '../useConnectionRequests';

jest.mock('../../services/connectionService', () => ({
  sendConnectionRequest: jest.fn(async () => ({} as any)),
  getPendingRequestsForElderly: jest.fn(async () => ([{ id: 'r1' }] as any)),
  approveConnection: jest.fn(async () => ({} as any)),
  rejectConnection: jest.fn(async () => ({} as any)),
  connectElderlyConnectionRequestsWebSocket: jest.fn(() => ({ close: jest.fn() })),
  connectCaregiverConnectionApprovalsWebSocket: jest.fn(() => ({ close: jest.fn() })),
}));

describe('useConnectionRequests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates to service functions', async () => {
    const { result } = renderHook(() => useConnectionRequests());
    await act(async () => {
      await result.current.sendConnectionRequest('e1' as any, 'c1' as any);
      await result.current.getPendingRequestsForElderly('e1' as any);
      await result.current.approveConnection('id1' as any);
      await result.current.rejectConnection('id2' as any);
    });
    const svc = require('../../services/connectionService');
    expect(svc.sendConnectionRequest).toHaveBeenCalled();
    expect(svc.getPendingRequestsForElderly).toHaveBeenCalledWith('e1');
    expect(svc.approveConnection).toHaveBeenCalledWith('id1');
    expect(svc.rejectConnection).toHaveBeenCalledWith('id2');

    act(() => {
      const es = result.current.subscribeElderlyConnectionRequests('e1' as any, () => {});
      const cs = result.current.subscribeCaregiverConnectionApprovals('c1' as any, () => {});
      const svc = require('../../services/connectionService');
      expect(svc.connectElderlyConnectionRequestsWebSocket).toHaveBeenCalledWith('e1', expect.any(Function));
      expect(svc.connectCaregiverConnectionApprovalsWebSocket).toHaveBeenCalledWith('c1', expect.any(Function));
    });
  });
});

