import api from '../lib/api';

export interface DailySummary {
  id?: string;
  userId: string;
  date: string;
  summary: string;
  scores: {
    health: number;
    exercise: number;
    mental: number;
    social: number;
    productivity: number;
    [key: string]: number;
  };
  analysis: string;
  createdAt?: string;
  updatedAt?: string;
}

const getTimezoneOffsetMinutes = () => -new Date().getTimezoneOffset();

export const dailySummaryService = {
  getAll: async (userId: string) => {
    console.log(`Fetching all summaries for Firebase UID: ${userId}`);
    const apiInstance = await api();
    const res = await apiInstance.get(`/daily-summaries/${userId}`);
    console.log(`Found ${res.data.length} summaries`);
    return res.data as DailySummary[];
  },
  getByDate: async (userId: string, date: string) => {
    console.log(`Fetching summary for Firebase UID: ${userId}, date: ${date}`);
    const apiInstance = await api();
    const res = await apiInstance.get(`/daily-summaries/${userId}/${date}`);
    console.log('Summary response:', res.data);
    return res.data as DailySummary;
  },
  generate: async (userId: string, date: string) => {
    const timezoneOffsetMinutes = getTimezoneOffsetMinutes();
    const apiInstance = await api();
    const res = await apiInstance.post(`/daily-summaries/${userId}/generate`, { date, timezoneOffsetMinutes });
    console.log('Generated summary response:', res.data);
    return res.data as DailySummary;
  },
  canGenerate: async (userId: string, date: string) => {
    const timezoneOffsetMinutes = getTimezoneOffsetMinutes();
    const apiInstance = await api();
    const res = await apiInstance.get(`/daily-summaries/${userId}/can-generate/${date}?timezoneOffsetMinutes=${timezoneOffsetMinutes}`);
    console.log('Can generate response:', res.data);
    return res.data as { canGenerate: boolean; exists: boolean; date: string };
  },
  delete: async (userId: string, date: string) => {
    console.log(`Deleting summary for Firebase UID: ${userId}, date: ${date}`);
    const apiInstance = await api();
    return apiInstance.delete(`/daily-summaries/${userId}/${date}`);
  },
}; 