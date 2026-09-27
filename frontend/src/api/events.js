import { apiClient } from './client';

export const getPhotoUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) return path;
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
  const backendOrigin = apiBase.replace(/\/api\/v1\/?$/, '');
  return `${backendOrigin}${path.startsWith('/') ? '' : '/'}${path}`;
};

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

  // Milestone 2: Photo Upload & Gallery endpoints
  uploadPhoto: async (eventId, file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post(`/events/${eventId}/photos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  },

  getPhotos: async (eventId) => {
    const response = await apiClient.get(`/events/${eventId}/photos`);
    return response.data;
  },

  getMyPhotos: async (eventId) => {
    const response = await apiClient.get(`/events/${eventId}/photos/mine`);
    return response.data;
  },

  deletePhoto: async (eventId, photoId) => {
    const response = await apiClient.delete(`/events/${eventId}/photos/${photoId}`);
    return response.data;
  },
};
