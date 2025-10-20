import api from '../lib/api';

export const mapService = {
  createLocation: async (location: { userId: string; latitude: number; longitude: number; timestamp?: string }) => {
    const apiInstance = await api();
    const response = await apiInstance.post('/locations', location);
    return response.data;
  },
  getLocations: async (userId: string, page: number = 0, size: number = 10) => {
    const apiInstance = await api();
    const response = await apiInstance.get(`/locations?userId=${userId}&page=${page}&size=${size}`);
    return response.data;
  },
}; 