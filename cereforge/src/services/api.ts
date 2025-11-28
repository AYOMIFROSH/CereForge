import axios, { AxiosError } from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true, // ✅ Send cookies with every request
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// ✅ PERFORMANCE: Track if we're already refreshing to avoid duplicate requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // ✅ PERFORMANCE: No need to manually add tokens
    // Cookies are sent automatically via withCredentials
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with smart 401 handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Handle specific error cases
    if (error.response) {
      const status = error.response.status;
      
      // ✅ CRITICAL: Handle 401 Unauthorized
      if (status === 401) {
        // ✅ PERFORMANCE: Try token refresh first (if not already refreshing)
        if (!originalRequest._retry && !isRefreshing) {
          originalRequest._retry = true;
          
          // ✅ Prevent multiple simultaneous refresh attempts
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            }).then(() => {
              return api(originalRequest);
            }).catch(err => {
              return Promise.reject(err);
            });
          }

          isRefreshing = true;

          try {
            // ✅ Try to refresh the token
            await api.post('/auth/refresh');
            
            isRefreshing = false;
            processQueue(null, 'token_refreshed');
            
            // ✅ Retry the original request with new token
            return api(originalRequest);
          } catch (refreshError) {
            // ✅ Refresh failed - force logout
            isRefreshing = false;
            processQueue(refreshError as Error, null);
            
            // ✅ Redirect to login (only if not already there)
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
            
            return Promise.reject(refreshError);
          }
        }
        
       
      }
      
      // Handle 403 Forbidden (insufficient permissions)
      if (status === 403) {
        console.warn('Access forbidden - insufficient permissions');
      }
      
      // Handle 429 Too Many Requests (rate limited)
      if (status === 429) {
        console.warn('Rate limit exceeded - please try again later');
      }
      
      // Handle 500 Server Error
      if (status >= 500) {
        console.error('Server error occurred');
      }
    } else if (error.request) {
      // Request made but no response received (network error)
      console.error('Network error - no response from server');
    } else {
      // Something else happened
      console.error('Request error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;