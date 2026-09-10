import { apiClient } from './client';

export const authApi = {
  signup: async (data) => {
    const response = await apiClient.post('/auth/signup', data);
    return response.data;
  },

  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};
