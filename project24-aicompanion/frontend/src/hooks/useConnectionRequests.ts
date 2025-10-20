import { useCallback } from 'react';
import {
  sendConnectionRequest,
  getPendingRequestsForElderly,
  approveConnection,
  rejectConnection,
  connectElderlyConnectionRequestsWebSocket,
  connectCaregiverConnectionApprovalsWebSocket,
} from '../services/connectionService';

export function useConnectionRequests() {
  // API wrappers
  const sendRequest = useCallback(sendConnectionRequest, []);
  const getPending = useCallback(getPendingRequestsForElderly, []);
  const approve = useCallback(approveConnection, []);
  const reject = useCallback(rejectConnection, []);

  // WebSocket helpers
  const subscribeElderly = useCallback(connectElderlyConnectionRequestsWebSocket, []);
  const subscribeCaregiver = useCallback(connectCaregiverConnectionApprovalsWebSocket, []);

  return {
    sendConnectionRequest: sendRequest,
    getPendingRequestsForElderly: getPending,
    approveConnection: approve,
    rejectConnection: reject,
    subscribeElderlyConnectionRequests: subscribeElderly,
    subscribeCaregiverConnectionApprovals: subscribeCaregiver,
  };
} 