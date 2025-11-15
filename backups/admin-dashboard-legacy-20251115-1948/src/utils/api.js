import axios from 'axios';

// Centralized API client with sane defaults and consistent response shape
const api = axios.create({
  baseURL:
    process.env.REACT_APP_API_URL ||
    (typeof window !== 'undefined' && window.__API_BASE_URL__) ||
    'https://mixillo-backend-52242135857.europe-west1.run.app',
  withCredentials: false
});

// Attach Authorization header from localStorage if present
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Unwrap common payload shape { success, data }
api.interceptors.response.use(
  (response) => {
    return response?.data?.data ?? response.data;
  },
  (error) => {
    // Normalize network/server errors
    const message = error?.response?.data?.message || error.message || 'Request failed';
    const status = error?.response?.status;
    const normalized = new Error(message);
    normalized.status = status;
    throw normalized;
  }
);

export default api;
