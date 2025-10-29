import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 180000,
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = localStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log('No token found');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const feedService = {
  getPersonalizedFeed: async (userId, type = 'all') => {
    try {
      console.log('Fetching personalized feed for user:', userId, 'type:', type);
      
      const response = await api.get('/feed', {
        params: { 
          userId,
          type
        }
      });
      
      console.log('Feed response:', response.data?.length || 0, 'posts');
      
      return { 
        success: true, 
        data: response.data 
      };
    } catch (error) {
      console.error('Feed fetch error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch feed',
        data: []
      };
    }
  },

  getFeedStats: async (userId) => {
    try {
      const response = await api.get('/feed/stats', {
        params: { userId }
      });
      
      return { 
        success: true, 
        data: response.data 
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }
};