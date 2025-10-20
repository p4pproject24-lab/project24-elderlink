import api from '../lib/api';
import { UserResponse } from '../types/UserResponse';

/**
 * Fetches the current authenticated user's details.
 *
 * @async
 * @function getCurrentUser
 * @returns {Promise<UserResponse>} The current user's data.
 * @throws {Error} Throws an error if the API request fails.
 */
export const getCurrentUser = async (): Promise<UserResponse> => {
  const apiInstance = await api();
  const res = await apiInstance.get('/auth/me');
  return res.data.data.user as UserResponse;
}; 

/**
 * Updates the current authenticated user's role.
 *
 * @async
 * @function setUserRole
 * @param {string} role - The new role to set ('ELDERLY' or 'CAREGIVER').
 * @returns {Promise<void>} Resolves when the role is updated.
 * @throws {Error} Throws an error if the API request fails.
 */
export const setUserRole = async (role: string): Promise<void> => {
  const apiInstance = await api();
  await apiInstance.put('/auth/role', { role });
}; 