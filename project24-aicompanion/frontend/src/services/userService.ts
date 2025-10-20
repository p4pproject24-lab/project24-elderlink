import api from '../lib/api';
import { ApiResponse } from '../types/ApiResponse';
import * as FileSystem from 'expo-file-system';

export interface UpdateUserProfileDTO {
  fullName: string;
  address: string;
  dateOfBirth: string;
  phoneNumber: string;
  profileImageUrl?: string;
  bloodType?: string;
  gender?: string;
  // ElderlyStage2 fields
  dailyLife?: string;
  relationships?: string;
  medicalNeeds?: string;
  hobbies?: string;
  anythingElse?: string;
}

export const updateUserProfile = async (profile: UpdateUserProfileDTO): Promise<ApiResponse> => {
  const apiInstance = await api();
  const res = await apiInstance.put<ApiResponse>('/users/profile', profile);
  return res.data;
};

export const convertImageToBase64 = async (uri: string): Promise<string> => {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    // Get the file extension to determine the MIME type
    const extension = uri.split('.').pop()?.toLowerCase() || 'jpeg';
    const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Error converting image to Base64:', error);
    throw new Error('Failed to convert image to Base64');
  }
};

export const getFavorites = async (userId: string) => {
  const apiInstance = await api();
  const res = await apiInstance.get(`/users/favorites?userId=${userId}`);
  return res.data;
};

export const toggleFavorite = async (userId: string, targetUserId: string, type: 'caregiver' | 'elderly') => {
  const apiInstance = await api();
  const res = await apiInstance.post(`/users/favorites/toggle?userId=${userId}&targetUserId=${targetUserId}&type=${type}`);
  return res.data;
};

export const getProfileFlowStatus = async (): Promise<any> => {
  try {
    const apiInstance = await api();
    const response = await apiInstance.get('/users/profile-flow/status');
    return response.data;
  } catch (error) {
    console.error('Error getting profile flow status:', error);
    throw error;
  }
};

export const updateProfileStep = async (step: number): Promise<any> => {
  try {
    const apiInstance = await api();
    const response = await apiInstance.put(`/users/profile-flow/step?step=${step}`);
    return response.data;
  } catch (error) {
    console.error('Error updating profile step:', error);
    throw error;
  }
};

export const goBackToStep = async (step: number): Promise<any> => {
  try {
    const apiInstance = await api();
    const response = await apiInstance.put(`/users/profile-flow/step/back?step=${step}`);
    return response.data;
  } catch (error) {
    console.error('Error going back to step:', error);
    throw error;
  }
};

export const completeProfileFlow = async (): Promise<any> => {
  try {
    const apiInstance = await api();
    const response = await apiInstance.post('/users/profile-flow/complete');
    return response.data;
  } catch (error) {
    console.error('Error completing profile flow:', error);
    throw error;
  }
};

export const shouldShowProfileFlow = async (): Promise<boolean> => {
  try {
    const apiInstance = await api();
    const response = await apiInstance.get('/users/profile-flow/should-show');
    return response.data.shouldShow;
  } catch (error) {
    console.error('Error checking if should show profile flow:', error);
    return true; // Default to showing profile flow on error
  }
}; 