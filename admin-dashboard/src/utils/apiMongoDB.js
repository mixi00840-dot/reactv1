/**
 * MongoDB API Client for Admin Dashboard
 * LONG-TERM SOLUTION - Comprehensive API client with all endpoints
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://mixillo-backend-52242135857.europe-west1.run.app/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - Add JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mongodb_jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`🔵 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle 401 & refresh token
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.error(`❌ API Error: ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url} - ${error.response?.status || 'Network Error'}`, error.response?.data);

    // If 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('mongodb_refresh_token');
        
        if (!refreshToken) {
          console.warn('No refresh token found, redirecting to login');
          // No refresh token, redirect to login
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        console.log('Attempting to refresh token...');
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { token } = response.data.data;
        localStorage.setItem('mongodb_jwt_token', token);
        console.log('Token refreshed successfully, retrying original request');

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError.response?.data || refreshError.message);
        // Refresh failed - logout user
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // If 403, user doesn't have permission
    if (error.response?.status === 403) {
      console.error('Access denied - insufficient permissions');
    }

    return Promise.reject(error);
  }
);

// Generic HTTP methods for backward compatibility
const httpMethods = {
  get: async (url, config = {}) => {
    // Remove leading /api if present
    const cleanUrl = url.startsWith('/api/') ? url.substring(4) : url;
    const response = await apiClient.get(cleanUrl, config);
    return response.data;
  },
  
  post: async (url, data = {}, config = {}) => {
    const cleanUrl = url.startsWith('/api/') ? url.substring(4) : url;
    const response = await apiClient.post(cleanUrl, data, config);
    return response.data;
  },
  
  put: async (url, data = {}, config = {}) => {
    const cleanUrl = url.startsWith('/api/') ? url.substring(4) : url;
    const response = await apiClient.put(cleanUrl, data, config);
    return response.data;
  },
  
  patch: async (url, data = {}, config = {}) => {
    const cleanUrl = url.startsWith('/api/') ? url.substring(4) : url;
    const response = await apiClient.patch(cleanUrl, data, config);
    return response.data;
  },
  
  delete: async (url, config = {}) => {
    const cleanUrl = url.startsWith('/api/') ? url.substring(4) : url;
    const response = await apiClient.delete(cleanUrl, config);
    return response.data;
  }
};

// API Methods
const mongoAPI = {
  // Generic HTTP methods (for backward compatibility with old api.get() pattern)
  ...httpMethods,
  
  // ==========================================
  // AUTHENTICATION
  // ==========================================
  
  auth: {
    login: async (identifier, password) => {
      const response = await apiClient.post('/auth/mongodb/login', {
        identifier,
        password,
      });

      if (response.data.success) {
        const { token, refreshToken, user } = response.data.data;
        localStorage.setItem('mongodb_jwt_token', token);
        localStorage.setItem('mongodb_refresh_token', refreshToken);
        localStorage.setItem('mongodb_user', JSON.stringify(user));
        return response.data;
      }

      throw new Error(response.data.message || 'Login failed');
    },

    logout: async () => {
      try {
        await apiClient.post('/auth/mongodb/logout');
      } finally {
        localStorage.removeItem('mongodb_jwt_token');
        localStorage.removeItem('mongodb_refresh_token');
        localStorage.removeItem('mongodb_user');
      }
    },

    getCurrentUser: async () => {
      const response = await apiClient.get('/auth/mongodb/me');
      return response.data;
    },
  },

  // ==========================================
  // USERS
  // ==========================================
  
  users: {
    getAll: async (params = {}) => {
      const response = await apiClient.get('/admin/users', { params });
      return response.data;
    },

    getById: async (userId) => {
      const response = await apiClient.get(`/users/${userId}`);
      return response.data;
    },

    updateStatus: async (userId, status, reason) => {
      const response = await apiClient.put(`/admin/users/${userId}/status`, {
        status,
        reason,
      });
      return response.data;
    },

    search: async (query) => {
      const response = await apiClient.get('/users/search', {
        params: { q: query },
      });
      return response.data;
    },
  },

  // ==========================================
  // CONTENT
  // ==========================================
  
  content: {
    getAll: async (params = {}) => {
      const response = await apiClient.get('/content', { params });
      return response.data;
    },

    getById: async (contentId) => {
      const response = await apiClient.get(`/content/${contentId}`);
      return response.data;
    },

    approve: async (contentId) => {
      const response = await apiClient.post(`/moderation/content/${contentId}/approve`);
      return response.data;
    },

    reject: async (contentId, reason) => {
      const response = await apiClient.post(`/moderation/content/${contentId}/reject`, {
        reason,
      });
      return response.data;
    },

    delete: async (contentId) => {
      const response = await apiClient.delete(`/content/${contentId}`);
      return response.data;
    },
  },

  // ==========================================
  // PRODUCTS
  // ==========================================
  
  products: {
    getAll: async (params = {}) => {
      const response = await apiClient.get('/products', { params });
      return response.data;
    },

    getById: async (productId) => {
      const response = await apiClient.get(`/products/${productId}`);
      return response.data;
    },

    approve: async (productId) => {
      const response = await apiClient.put(`/products/${productId}`, {
        status: 'active',
        isPublished: true,
      });
      return response.data;
    },

    reject: async (productId, reason) => {
      const response = await apiClient.put(`/products/${productId}`, {
        status: 'rejected',
        rejectionReason: reason,
      });
      return response.data;
    },
  },

  // ==========================================
  // ORDERS
  // ==========================================
  
  orders: {
    getAll: async (params = {}) => {
      const response = await apiClient.get('/orders/admin/all', { params });
      return response.data;
    },

    getById: async (orderId) => {
      const response = await apiClient.get(`/orders/admin/${orderId}`);
      return response.data;
    },

    updateStatus: async (orderId, status, note) => {
      const response = await apiClient.put(`/orders/admin/${orderId}/status`, {
        status,
        note,
      });
      return response.data;
    },

    getStats: async () => {
      const response = await apiClient.get('/orders/admin/stats');
      return response.data;
    },
  },

  // ==========================================
  // STORES
  // ==========================================
  
  stores: {
    getAll: async (params = {}) => {
      const response = await apiClient.get('/stores', { params });
      return response.data;
    },

    getById: async (storeId) => {
      const response = await apiClient.get(`/stores/${storeId}`);
      return response.data;
    },
  },

  // ==========================================
  // SELLER APPLICATIONS
  // ==========================================
  
  sellerApplications: {
    getPending: async (params = {}) => {
      const response = await apiClient.get('/admin/seller-applications', {
        params: { status: 'pending', ...params },
      });
      return response.data;
    },

    approve: async (applicationId) => {
      const response = await apiClient.post(
        `/admin/seller-applications/${applicationId}/approve`
      );
      return response.data;
    },

    reject: async (applicationId, reason) => {
      const response = await apiClient.post(
        `/admin/seller-applications/${applicationId}/reject`,
        { reason }
      );
      return response.data;
    },
  },

  // ==========================================
  // WALLETS
  // ==========================================
  
  wallets: {
    getWallet: async (userId) => {
      const response = await apiClient.get(`/wallets/${userId}`);
      return response.data;
    },

    getBalance: async (userId) => {
      const response = await apiClient.get(`/wallets/${userId}/balance`);
      return response.data;
    },

    getTransactions: async (userId, params = {}) => {
      const response = await apiClient.get(`/wallets/${userId}/transactions`, { params });
      return response.data;
    },

    addFunds: async (userId, amount, description) => {
      const response = await apiClient.post(`/wallets/${userId}/add-funds`, {
        amount,
        description,
      });
      return response.data;
    },
  },

  // ==========================================
  // ANALYTICS
  // ==========================================
  
  analytics: {
    getDashboard: async (params = {}) => {
      const response = await apiClient.get('/api/admin/dashboard', { params });
      return response.data;
    },

    getOverview: async (params = {}) => {
      const response = await apiClient.get('/analytics/overview', { params });
      return response.data;
    },

    getContentAnalytics: async (contentId) => {
      if (contentId) {
        const response = await apiClient.get(`/analytics/content/${contentId}`);
        return response.data;
      } else {
        // Get all content analytics
        const response = await apiClient.get('/analytics/content');
        return response.data;
      }
    },
  },

  // ==========================================
  // MODERATION
  // ==========================================
  
  moderation: {
    getQueue: async (params = {}) => {
      const response = await apiClient.get('/moderation/queue', { params });
      return response.data;
    },

    getReports: async (params = {}) => {
      const response = await apiClient.get('/moderation/reports', { params });
      return response.data;
    },

    resolveReport: async (reportId, actionTaken, reviewNotes) => {
      const response = await apiClient.put(`/moderation/reports/${reportId}/resolve`, {
        actionTaken,
        reviewNotes,
      });
      return response.data;
    },
  },

  // ==========================================
  // STORIES
  // ==========================================
  
  stories: {
    getAll: async (params = {}) => {
      const response = await apiClient.get('/stories', { params });
      return response.data;
    },

    delete: async (storyId) => {
      const response = await apiClient.delete(`/stories/${storyId}`);
      return response.data;
    },
  },

  // ==========================================
  // NOTIFICATIONS
  // ==========================================
  
  notifications: {
    getAll: async (params = {}) => {
      const response = await apiClient.get('/notifications', { params });
      return response.data;
    },
  },

  // ==========================================
  // SETTINGS
  // ==========================================
  
  settings: {
    getAll: async (params = {}) => {
      const response = await apiClient.get('/settings', { params });
      return response.data;
    },

    getPublic: async () => {
      const response = await apiClient.get('/settings/mongodb/public');
      return response.data;
    },

    update: async (key, value, options = {}) => {
      const response = await apiClient.put(`/settings/mongodb/${key}`, {
        value,
        ...options,
      });
      return response.data;
    },
  },

  // ==========================================
  // GIFTS
  // ==========================================
  
  gifts: {
    getAll: async (params = {}) => {
      const response = await apiClient.get('/gifts/mongodb', { params });
      return response.data;
    },

    getPopular: async () => {
      const response = await apiClient.get('/gifts/mongodb/popular');
      return response.data;
    },
  },

  // ==========================================
  // CATEGORIES
  // ==========================================
  
  categories: {
    getAll: async (params = {}) => {
      const response = await apiClient.get('/categories/mongodb', { params });
      return response.data;
    },

    create: async (categoryData) => {
      const response = await apiClient.post('/categories/mongodb', categoryData);
      return response.data;
    },

    update: async (categoryId, categoryData) => {
      const response = await apiClient.put(`/categories/mongodb/${categoryId}`, categoryData);
      return response.data;
    },

    delete: async (categoryId) => {
      const response = await apiClient.delete(`/categories/mongodb/${categoryId}`);
      return response.data;
    },
  },

  // ==========================================
  // SOUNDS
  // ==========================================
  
  sounds: {
    getAll: async (params = {}) => {
      const response = await apiClient.get('/sounds/mongodb', { params });
      return response.data;
    },

    getTrending: async () => {
      const response = await apiClient.get('/sounds/mongodb/trending');
      return response.data;
    },
  },
};

export default mongoAPI;
