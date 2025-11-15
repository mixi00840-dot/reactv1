import { mongoAPI } from './apiMongoDB';

/**
 * API wrapper with automatic retry logic
 * Handles network failures gracefully
 */

const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  retryOn: [408, 429, 500, 502, 503, 504], // Retry on these status codes
  backoffMultiplier: 2 // Exponential backoff
};

/**
 * Sleep utility
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Check if error is retryable
 */
const isRetryableError = (error, retryOn) => {
  if (!error.response) {
    // Network error (no response) - always retry
    return true;
  }
  
  return retryOn.includes(error.response.status);
};

/**
 * Wrap API call with retry logic
 */
export const withRetry = async (apiCall, config = {}) => {
  const { maxRetries, retryDelay, retryOn, backoffMultiplier } = {
    ...DEFAULT_RETRY_CONFIG,
    ...config
  };

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Check if error is retryable
      if (!isRetryableError(error, retryOn)) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = retryDelay * Math.pow(backoffMultiplier, attempt);
      
      console.log(`⚠️ Request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`);
      
      await sleep(delay);
    }
  }

  // All retries failed
  throw lastError;
};

/**
 * Enhanced API client with retry logic
 */
export const apiWithRetry = {
  // Auth
  login: (identifier, password) => 
    withRetry(() => mongoAPI.auth.login(identifier, password)),
  
  register: (data) => 
    withRetry(() => mongoAPI.auth.register(data)),
  
  // Users
  getUsers: (params) => 
    withRetry(() => mongoAPI.users.getAll(params)),
  
  getUser: (id) => 
    withRetry(() => mongoAPI.users.getById(id)),
  
  createUser: (data) => 
    withRetry(() => mongoAPI.admin.createUser(data)),
  
  updateUser: (id, data) => 
    withRetry(() => mongoAPI.users.update(id, data)),
  
  // Content
  getContent: (params) => 
    withRetry(() => mongoAPI.content.getAll(params)),
  
  approveContent: (id) => 
    withRetry(() => mongoAPI.moderation.approveContent(id)),
  
  // Analytics
  getDashboardStats: () => 
    withRetry(() => mongoAPI.admin.getDashboardStats()),
  
  getAnalytics: (params) => 
    withRetry(() => mongoAPI.analytics.getOverview(params)),
  
  // Generic methods
  get: (url, config) => 
    withRetry(() => mongoAPI.get(url, config)),
  
  post: (url, data, config) => 
    withRetry(() => mongoAPI.post(url, data, config)),
  
  put: (url, data, config) => 
    withRetry(() => mongoAPI.put(url, data, config)),
  
  delete: (url, config) => 
    withRetry(() => mongoAPI.delete(url, config))
};

export default apiWithRetry;

