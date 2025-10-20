import api from '../lib/api';

export interface MemoryResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface CoreInformationResponse {
  coreInformation: string;
}

/**
 * Add core information to user's profile
 */
export const addCoreInformation = async (coreInformation: string): Promise<MemoryResponse> => {
  try {
    const apiInstance = await api();
    const response = await apiInstance.post('/memory/add-core', {
      coreInformation,
    });
    return {
      success: true,
      message: response.data.message || 'Core information added successfully',
      data: response.data.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || 'Failed to add core information',
    };
  }
};

/**
 * Add contextual memory to user's memory store
 */
export const addContextualMemory = async (contextualMemory: string): Promise<MemoryResponse> => {
  try {
    const apiInstance = await api();
    const response = await apiInstance.post('/memory/add-contextual', {
      contextualMemory,
    });
    return {
      success: true,
      message: response.data.message || 'Contextual memory added successfully',
      data: response.data.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || 'Failed to add contextual memory',
    };
  }
};

/**
 * Get user's current core information
 */
export const getCoreInformation = async (): Promise<CoreInformationResponse | null> => {
  try {
    const apiInstance = await api();
    const response = await apiInstance.get('/memory/core-information');
    return response.data.data;
  } catch (error: any) {
    console.error('Failed to get core information:', error);
    return null;
  }
};
