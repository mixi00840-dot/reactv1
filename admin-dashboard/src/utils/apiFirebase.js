import axios from 'axios';
import { auth } from '../firebase';

/**
 * Centralized API client with Firebase Authentication integration
 * Automatically attaches Firebase ID tokens to all requests
 */
const api = axios.create({
  baseURL:
    process.env.REACT_APP_API_URL ||
    (typeof window !== 'undefined' && window.__API_BASE_URL__) ||
    'https://mixillo-backend-52242135857.europe-west1.run.app',
  withCredentials: false
});

/**
 * Request interceptor - Attach Firebase ID token
 * Firebase automatically refreshes expired tokens
 */
api.interceptors.request.use(
  async (config) => {
    try {
      // Get current Firebase user
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        // Get fresh ID token (Firebase handles caching and auto-refresh)
        const idToken = await currentUser.getIdToken(false); // Don't force refresh unless needed
        
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${idToken}`;
      }
    } catch (error) {
      console.error('Error getting Firebase ID token:', error);
      // Continue with request even if token retrieval fails
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Unwrap response and handle errors
 */
api.interceptors.response.use(
  (response) => {
    // Unwrap common payload shape { success, data }
    return response?.data?.data ?? response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized - token might be expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Force refresh the Firebase ID token
        const currentUser = auth.currentUser;
        if (currentUser) {
          const newToken = await currentUser.getIdToken(true); // Force refresh
          
          // Update the failed request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          // Retry the request
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Let the error propagate to trigger logout
      }
    }
    
    // Normalize network/server errors
    const message = error?.response?.data?.message || error.message || 'Request failed';
    const status = error?.response?.status;
    const normalized = new Error(message);
    normalized.status = status;
    normalized.response = error.response;
    
    throw normalized;
  }
);

export default api;
