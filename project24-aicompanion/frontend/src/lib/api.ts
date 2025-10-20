import axios, { AxiosInstance } from 'axios';
import { getAuth } from 'firebase/auth';
import type { AxiosRequestHeaders } from 'axios';
import { getCurrentNetworkConfig } from '../utils/networkUtils';

// Set your production URL here when ready to deploy
const PROD_URL = 'https://your-production-url.com';

// Initialize API with dynamic base URL
let apiInstance: AxiosInstance | null = null;

async function initializeAPI(): Promise<AxiosInstance> {
  if (apiInstance) return apiInstance;

  let baseURL: string;

  if (__DEV__) {
    // In development, use dynamic network configuration
    try {
      const networkConfig = await getCurrentNetworkConfig();
      baseURL = networkConfig.backendUrl;
      console.log('[API] Using dynamic base URL:', baseURL);
    } catch (error) {
      console.error('[API] Failed to get network config, using fallback:', error);
      baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';
    }
  } else {
    // In production, use production URL
    baseURL = PROD_URL;
  }

  apiInstance = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Setup interceptors
  apiInstance.interceptors.request.use(
    async (config: any) => {
      try {
        const user = getAuth().currentUser;
        if (user) {
          const token = await user.getIdToken(); // This will auto-refresh if needed
          if (!config.headers) config.headers = {} as AxiosRequestHeaders;
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (e) {
        console.warn('Could not refresh Firebase token', e);
        // For auth endpoints, don't fail the request
        if (!config.url?.includes('/auth/')) {
          throw new Error('Authentication required');
        }
      }
      console.log('[API] Request:', config.method?.toUpperCase(), config.url, 'Headers:', config.headers);
      return config;
    }
  );

  // Setup response interceptor
  apiInstance.interceptors.response.use(
    (response: any) => response,
    async (error: any) => {
      if (error.response?.status === 401) {
        // Clear any stored auth state
        clearAuthToken();
        // You might want to trigger a logout here
        console.log('[API] 401 Unauthorized - clearing auth state');
      }
      return Promise.reject(error);
    }
  );

  return apiInstance;
}

// Auth token management
let authToken: string | null = null;

export const setAuthToken = (token: string) => {
  authToken = token;
};

export const clearAuthToken = () => {
  authToken = null;
};

// Export a function that returns the initialized API
async function getAPI(): Promise<AxiosInstance> {
  if (!apiInstance) {
    await initializeAPI();
  }
  return apiInstance!;
}

export default getAPI;