# 🖥️ Admin Dashboard: MongoDB Migration Guide

**Target**: React Admin Dashboard  
**Current**: Firebase SDK  
**Migration To**: MongoDB REST API + JWT

---

## 🎯 MIGRATION OVERVIEW

### What Needs to Change:

1. **Remove Firebase SDK** - Remove `firebase` package
2. **API Client** - Create axios-based API client
3. **Authentication** - JWT instead of Firebase Auth
4. **API Calls** - Update all endpoints to `/mongodb` routes

### What Stays the Same:

1. **React Components** - No UI changes needed
2. **Business Logic** - Same workflows
3. **Features** - All features remain
4. **User Experience** - Identical admin experience

---

## 📝 STEP-BY-STEP MIGRATION

### Step 1: Install Dependencies

```bash
cd admin-dashboard

# Install axios if not present
npm install axios

# Install jwt-decode for token handling
npm install jwt-decode

# OPTIONAL: Remove firebase
# npm uninstall firebase
# (Or keep it if you use it for other features)
```

### Step 2: Create API Client

**File**: `src/services/mongoApi.js` (NEW FILE)

```javascript
import axios from 'axios';

const API_BASE_URL = 'https://mixillo-backend-52242135857.europe-west1.run.app/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle 401 & refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_BASE_URL}/auth/mongodb/refresh`, {
          refreshToken,
        });
        
        const { token } = response.data.data;
        localStorage.setItem('jwt_token', token);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// API Methods
export const mongoApi = {
  // Authentication
  login: async (identifier, password) => {
    const response = await apiClient.post('/auth/mongodb/login', {
      identifier,
      password,
    });
    
    if (response.data.success) {
      const { token, refreshToken } = response.data.data;
      localStorage.setItem('jwt_token', token);
      localStorage.setItem('refresh_token', refreshToken);
    }
    
    return response.data;
  },
  
  logout: async () => {
    try {
      await apiClient.post('/auth/mongodb/logout');
    } finally {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('refresh_token');
    }
  },
  
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/mongodb/me');
    return response.data;
  },
  
  // Users
  getUsers: async (params = {}) => {
    const response = await apiClient.get('/users/mongodb', { params });
    return response.data;
  },
  
  getUser: async (userId) => {
    const response = await apiClient.get(`/users/mongodb/${userId}`);
    return response.data;
  },
  
  updateUser: async (userId, data) => {
    const response = await apiClient.put(`/users/mongodb/${userId}`, data);
    return response.data;
  },
  
  // Content
  getContent: async (params = {}) => {
    const response = await apiClient.get('/content/mongodb', { params });
    return response.data;
  },
  
  deleteContent: async (contentId) => {
    const response = await apiClient.delete(`/content/mongodb/${contentId}`);
    return response.data;
  },
  
  // Products
  getProducts: async (params = {}) => {
    const response = await apiClient.get('/products/mongodb', { params });
    return response.data;
  },
  
  approveProduct: async (productId) => {
    const response = await apiClient.put(`/products/mongodb/${productId}`, {
      status: 'active',
      isPublished: true
    });
    return response.data;
  },
  
  // Orders
  getOrders: async (params = {}) => {
    const response = await apiClient.get('/orders/mongodb', { params });
    return response.data;
  },
  
  updateOrderStatus: async (orderId, status, note) => {
    const response = await apiClient.put(`/orders/mongodb/${orderId}/status`, {
      status,
      note
    });
    return response.data;
  },
  
  // Wallets
  getWallet: async (userId) => {
    const response = await apiClient.get(`/wallets/mongodb/${userId}`);
    return response.data;
  },
  
  addFunds: async (userId, amount, description) => {
    const response = await apiClient.post(`/wallets/mongodb/${userId}/add-funds`, {
      amount,
      description
    });
    return response.data;
  },
  
  // Moderation
  getModerationQueue: async () => {
    const response = await apiClient.get('/moderation/mongodb/queue');
    return response.data;
  },
  
  // Analytics
  getAnalytics: async (params = {}) => {
    const response = await apiClient.get('/analytics/mongodb', { params });
    return response.data;
  },
  
  // ... Add more methods as needed
};

export default mongoApi;
```

### Step 3: Update Login Component

**File**: `src/pages/Login.js` or similar

**Before (Firebase)**:
```javascript
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

const handleLogin = async (email, password) => {
  await signInWithEmailAndPassword(auth, email, password);
};
```

**After (MongoDB)**:
```javascript
import { mongoApi } from '../services/mongoApi';

const handleLogin = async (email, password) => {
  const result = await mongoApi.login(email, password);
  if (result.success) {
    // User logged in, tokens stored
    // Redirect to dashboard
  }
};
```

### Step 4: Update Protected Routes

**Before (Firebase)**:
```javascript
import { onAuthStateChanged } from 'firebase/auth';

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      setIsAuthenticated(true);
    } else {
      navigate('/login');
    }
  });
  
  return unsubscribe;
}, []);
```

**After (MongoDB)**:
```javascript
import { mongoApi } from '../services/mongoApi';

useEffect(() => {
  const checkAuth = async () => {
    const token = localStorage.getItem('jwt_token');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      const response = await mongoApi.getCurrentUser();
      if (response.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      navigate('/login');
    }
  };
  
  checkAuth();
}, []);
```

---

## 🔄 MIGRATION CHECKLIST

### Phase 1: Authentication (Critical)
- [ ] Create `mongoApi.js` service
- [ ] Update Login page
- [ ] Update Logout function
- [ ] Test authentication flow
- [ ] Handle token refresh

### Phase 2: User Management
- [ ] Update Users list page
- [ ] Update User details page
- [ ] Update User edit function
- [ ] Test user CRUD operations

### Phase 3: Content Management
- [ ] Update Content list
- [ ] Update Content moderation
- [ ] Update Content deletion
- [ ] Test content operations

### Phase 4: E-commerce
- [ ] Update Products page
- [ ] Update Orders page
- [ ] Update Stores page
- [ ] Update Product approval workflow

### Phase 5: Other Features
- [ ] Wallets management
- [ ] Gifts management
- [ ] Analytics dashboard
- [ ] Settings page

---

## ⏱️ ESTIMATED TIMELINE

| Task | Time | Dependencies |
|------|------|--------------|
| Create API client | 2 hours | None |
| Update authentication | 4 hours | API client |
| Update users pages | 1 day | Auth |
| Update content pages | 1 day | Auth |
| Update e-commerce | 2 days | Auth |
| Update other features | 2 days | Auth |
| Testing | 3 days | All above |
| **TOTAL** | **1-2 weeks** | Sequential |

---

## 🧪 TESTING GUIDE

### Test Scenarios:

1. **Login**: Admin login with email & password
2. **User Management**: View, edit, ban users
3. **Content Moderation**: Approve/reject content
4. **Product Approval**: Approve seller products
5. **Order Management**: View & update order status
6. **Wallet Management**: Add funds, view transactions
7. **Analytics**: View charts & metrics

### Test Data:
Use MongoDB endpoints to create test data:
- Test users
- Test content
- Test products
- Test orders

---

## 🚀 DEPLOYMENT

### Build & Deploy:
```bash
cd admin-dashboard

# Update environment variables
# Add REACT_APP_USE_MONGODB=true

npm run build

# Deploy to your hosting (Vercel/Netlify/etc.)
npm run deploy
```

---

## 📞 SUPPORT

All MongoDB endpoints are documented in:
- `backend/INTEGRATE_MONGODB_ROUTES.md`
- API health endpoints for testing
- Comprehensive error handling

---

**Admin Dashboard ready for MongoDB migration!** 🎯


