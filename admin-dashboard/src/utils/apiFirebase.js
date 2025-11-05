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
      // Wait for auth to be ready
      await auth.authStateReady();
      
      // Get current Firebase user
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        // Always get a fresh ID token to ensure it's valid
        // Force refresh if token might be expired (check every 5 minutes)
        const tokenResult = await currentUser.getIdTokenResult();
        const tokenAge = Date.now() - tokenResult.issuedAtTime;
        const shouldRefresh = tokenAge > 5 * 60 * 1000; // Refresh if older than 5 minutes
        
        const idToken = await currentUser.getIdToken(shouldRefresh);
        
        // Validate token format (should have 3 parts separated by dots)
        if (!idToken || typeof idToken !== 'string' || idToken.split('.').length !== 3) {
          console.error('Invalid token format received from Firebase');
          throw new Error('Invalid token format');
        }
        
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${idToken}`;
      } else {
        // No user logged in - clear any cached token
        delete config.headers?.Authorization;
        console.warn('No Firebase user logged in, request will be unauthenticated');
      }
    } catch (error) {
      console.error('Error getting Firebase ID token:', error);
      // Clear any invalid token
      delete config.headers?.Authorization;
      
      // If no user is logged in, don't send token
      // This will result in 401, which will trigger logout
      if (!auth.currentUser) {
        console.warn('No Firebase user logged in, request will be unauthenticated');
      }
      
      // If it's an auth error and user exists, force re-authentication
      if (auth.currentUser && (error.code === 'auth/id-token-expired' || error.code === 'auth/invalid-user-token')) {
        console.warn('Token expired or invalid, user may need to re-login');
      }
      
      // Don't block the request - let backend handle 401
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
    
    // Handle 401 Unauthorized - token might be expired or invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Wait for auth to be ready
        await auth.authStateReady();
        
        // Force refresh the Firebase ID token
        const currentUser = auth.currentUser;
        if (currentUser) {
          // Force a fresh token retrieval
          const newToken = await currentUser.getIdToken(true); // Force refresh
          
          // Validate token format
          if (!newToken || typeof newToken !== 'string' || newToken.split('.').length !== 3) {
            throw new Error('Invalid token format after refresh');
          }
          
          // Update the failed request with new token
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          // Retry the request
          return api(originalRequest);
        } else {
          // No user - redirect to login
          console.warn('No user available for token refresh');
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(new Error('Authentication required'));
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        
        // If refresh fails, sign out and redirect to login
        if (typeof window !== 'undefined' && auth.currentUser) {
          try {
            await auth.signOut();
            window.location.href = '/login';
          } catch (signOutError) {
            console.error('Sign out error:', signOutError);
          }
        }
        
        // If refresh fails, clear auth header and let error propagate
        delete originalRequest.headers?.Authorization;
        
        // If it's a persistent auth error, might need to logout
        if (refreshError.code === 'auth/id-token-expired' || 
            refreshError.code === 'auth/invalid-user-token' ||
            refreshError.message?.includes('kid')) {
          console.error('Token cannot be refreshed, user may need to re-login');
        }
      }
    }
    
    // Handle specific Firebase token errors
    if (error.response?.data?.message?.includes('kid') || 
        error.response?.data?.code === 'INVALID_TOKEN') {
      console.error('Invalid token format error from backend:', error.response?.data?.message);
      // Don't retry - token format is wrong
      originalRequest._retry = true; // Prevent infinite retry
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
