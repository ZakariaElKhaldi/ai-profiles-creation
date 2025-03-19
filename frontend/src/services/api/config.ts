import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,  // Important for CORS with credentials
});

// Add request interceptor for CORS headers
api.interceptors.request.use((config) => {
  config.headers['Access-Control-Allow-Origin'] = window.location.origin;
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error:', error.response.data);
      return Promise.reject({
        message: error.response.data.detail || 'An error occurred',
        status: error.response.status,
        data: error.response.data,
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Network Error:', error.request);
      return Promise.reject({
        message: 'Network error occurred',
        status: 0,
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request Error:', error.message);
      return Promise.reject({
        message: error.message,
        status: 0,
      });
    }
  }
); 