import axios, { AxiosError } from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true, // ✅ IMPORTANT: Send cookies with every request
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor (optional - for logging)
api.interceptors.request.use(
  (config) => {
    // You can add custom headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor (handle errors globally)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle specific error cases
    if (error.response) {
      const status = error.response.status;
      
      // Handle 401 Unauthorized (token expired, not logged in)
      if (status === 401) {
        // Clear auth state and redirect to login
        // We'll handle this in the auth store
        console.warn('Unauthorized - redirecting to login');
      }
      
      // Handle 403 Forbidden (insufficient permissions)
      if (status === 403) {
        console.warn('Access forbidden');
      }
      
      // Handle 429 Too Many Requests (rate limited)
      if (status === 429) {
        console.warn('Rate limit exceeded');
      }
      
      // Handle 500 Server Error
      if (status >= 500) {
        console.error('Server error occurred');
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('No response from server');
    } else {
      // Something else happened
      console.error('Request error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;