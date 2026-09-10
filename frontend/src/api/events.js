import { apiClient } from './client';

export const eventsApi = {
  createEvent: async (data) => {
    const response = await apiClient.post('/events', data);
    return response.data;
  },

  joinEvent: async (pin_code) => {
    const response = await apiClient.post('/events/join', { pin_code });
    return response.data;
  },

  getEvents: async () => {
    const response = await apiClient.get('/events');
    return response.data;
  },

  getEventDetail: async (eventId) => {
    const response = await apiClient.get(`/events/${eventId}`);
    return response.data;
  },

  getEventMembers: async (eventId) => {
    const response = await apiClient.get(`/events/${eventId}/members`);
    return response.data;
  },

  removeMember: async (eventId, userId) => {
    const response = await apiClient.delete(`/events/${eventId}/members/${userId}`);
    return response.data;
  },
};
