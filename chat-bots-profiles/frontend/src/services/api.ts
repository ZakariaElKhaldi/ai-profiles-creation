import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for handling auth tokens if needed
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token to headers if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for handling common errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle API errors (e.g., 401, 403, 500)
    if (error.response) {
      // Log error details for debugging
      console.error('API Error:', error.response.status, error.response.data);
      
      // You can handle specific error codes here
      if (error.response.status === 401) {
        // Unauthorized - redirect to login or refresh token
        console.log('Unauthorized access');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient; 