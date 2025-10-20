import api from '../lib/api';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

export const sendConnectionRequest = async (caregiverId: string, elderlyId: string) => {
  const apiInstance = await api();
  const response = await apiInstance.post(`/connections/request?caregiverId=${encodeURIComponent(caregiverId)}&elderlyId=${encodeURIComponent(elderlyId)}`);
  return response.data;
};

export const getPendingRequestsForElderly = async (elderlyId: string) => {
  const apiInstance = await api();
  const response = await apiInstance.get(`/connections/pending?elderlyId=${encodeURIComponent(elderlyId)}`);
  return response.data;
};

export const approveConnection = async (connectionId: string) => {
  const apiInstance = await api();
  const response = await apiInstance.post(`/connections/approve?connectionId=${encodeURIComponent(connectionId)}`);
  return response.data;
};

export const rejectConnection = async (connectionId: string) => {
  const apiInstance = await api();
  const response = await apiInstance.post(`/connections/reject?connectionId=${encodeURIComponent(connectionId)}`);
  return response.data;
};

export const getLinkedCaregiversForElderly = async (elderlyId: string) => {
  const apiInstance = await api();
  const response = await apiInstance.get(`/connections/caregiver-list?elderlyId=${encodeURIComponent(elderlyId)}`);
  return response.data;
};

export const getConnectedElderlyForCaregiver = async (caregiverId: string) => {
  console.log('[connectionService] getConnectedElderlyForCaregiver called with:', caregiverId);
  try {
  const apiInstance = await api();
  const response = await apiInstance.get(`/connections/elderly-list?caregiverId=${encodeURIComponent(caregiverId)}`);
    console.log('[connectionService] API response:', response.data);
  return response.data;
  } catch (error) {
    console.error('[connectionService] Error fetching connected elderly:', error);
    throw error;
  }
};

export async function connectElderlyConnectionRequestsWebSocket(elderlyId: string, onMessage: (msg: any) => void) {
  const apiInstance = await api();
  const backendWsUrl = `${apiInstance.defaults.baseURL}/ws`;
  const client = new Client({
    webSocketFactory: () => new SockJS(backendWsUrl),
    reconnectDelay: 5000,
    onConnect: () => {
      const topic = `/topic/elderly-${elderlyId}`;
      console.log('Subscribing to topic:', topic);
      client.subscribe(topic, (message: any) => {
        try {
          const body = JSON.parse(message.body);
          onMessage(body);
        } catch (e) {
          onMessage(message.body);
        }
      });
    },
  });
  client.activate();
  return client;
}

export async function connectCaregiverConnectionApprovalsWebSocket(caregiverId: string, onMessage: (msg: any) => void) {
  const apiInstance = await api();
  const backendWsUrl = `${apiInstance.defaults.baseURL}/ws`;
  const client = new Client({
    webSocketFactory: () => new SockJS(backendWsUrl),
    reconnectDelay: 5000,
    onConnect: () => {
      const topic = `/topic/caregiver-${caregiverId}`;
      console.log('Caregiver subscribing to topic:', topic);
      client.subscribe(topic, (message: any) => {
        try {
          const body = JSON.parse(message.body);
          onMessage(body);
        } catch (e) {
          onMessage(message.body);
        }
      });
    },
  });
  client.activate();
  return client;
} 