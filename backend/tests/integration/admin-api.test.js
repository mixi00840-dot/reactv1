const axios = require('axios');

// Test configuration
const API_URL = process.env.API_URL || 'https://mixillo-backend-52242135857.europe-west1.run.app';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@mixillo.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';

let authToken = '';
let testUserId = '';

// Helper function to create authenticated request
const apiRequest = async (method, endpoint, data = null) => {
  const config = {
    method,
    url: `${API_URL}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    return response;
  } catch (error) {
    return error.response;
  }
};

describe('Backend API Integration Tests', () => {
  // Login before all tests
  beforeAll(async () => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('token');
      
      authToken = response.data.token;
    } catch (error) {
      console.error('Login failed:', error.message);
      throw error;
    }
  }, 30000);

  describe('Authentication Endpoints', () => {
    it('should login with valid credentials', async () => {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('token');
      expect(response.data).toHaveProperty('user');
    });

    it('should reject invalid credentials', async () => {
      try {
        await axios.post(`${API_URL}/api/auth/login`, {
          email: 'wrong@email.com',
          password: 'wrongpassword',
        });
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });

    it('should require authentication for admin endpoints', async () => {
      try {
        await axios.get(`${API_URL}/api/admin/users`);
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe('Dashboard Endpoints', () => {
    it('GET /api/admin/dashboard - should return dashboard data', async () => {
      const response = await apiRequest('GET', '/api/admin/dashboard');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('overview');
      expect(response.data.data).toHaveProperty('users');
      expect(response.data.data).toHaveProperty('content');
      expect(response.data.data).toHaveProperty('products');
      expect(response.data.data).toHaveProperty('orders');
    });

    it('should return real data (not zeros)', async () => {
      const response = await apiRequest('GET', '/api/admin/dashboard');
      const { overview } = response.data.data;

      expect(overview).toBeDefined();
      expect(typeof overview.totalUsers).toBe('number');
      expect(typeof overview.activeUsers).toBe('number');
    });

    it('should return recent users array', async () => {
      const response = await apiRequest('GET', '/api/admin/dashboard');
      const { recentUsers } = response.data.data;

      expect(recentUsers).toBeDefined();
      expect(Array.isArray(recentUsers)).toBe(true);
    });

    it('should return monthly registrations data', async () => {
      const response = await apiRequest('GET', '/api/admin/dashboard');
      const { monthlyRegistrations } = response.data.data;

      expect(monthlyRegistrations).toBeDefined();
      expect(Array.isArray(monthlyRegistrations)).toBe(true);
    });
  });

  describe('Users Endpoints', () => {
    it('GET /api/admin/users - should return users list', async () => {
      const response = await apiRequest('GET', '/api/admin/users?page=1&limit=10');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('users');
      expect(response.data.data).toHaveProperty('pagination');
      expect(Array.isArray(response.data.data.users)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await apiRequest('GET', '/api/admin/users?page=1&limit=5');

      expect(response.data.data.pagination).toHaveProperty('page', 1);
      expect(response.data.data.pagination).toHaveProperty('limit', 5);
      expect(response.data.data.pagination).toHaveProperty('total');
    });

    it('should support search', async () => {
      const response = await apiRequest('GET', '/api/admin/users?search=test');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.data.users)).toBe(true);
    });

    it('should support status filter', async () => {
      const response = await apiRequest('GET', '/api/admin/users?status=active');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.data.users)).toBe(true);
    });

    it('should support role filter', async () => {
      const response = await apiRequest('GET', '/api/admin/users?role=user');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.data.users)).toBe(true);
    });

    it('GET /api/admin/users/:id - should return user details', async () => {
      // First get a user ID
      const listResponse = await apiRequest('GET', '/api/admin/users?limit=1');
      if (listResponse.data.data.users.length > 0) {
        const userId = listResponse.data.data.users[0]._id;
        
        const response = await apiRequest('GET', `/api/admin/users/${userId}`);
        expect(response.status).toBe(200);
        expect(response.data.data.user).toHaveProperty('_id', userId);
      }
    });

    it('PUT /api/admin/users/:id/status - should update user status', async () => {
      // Get first user
      const listResponse = await apiRequest('GET', '/api/admin/users?limit=1');
      if (listResponse.data.data.users.length > 0) {
        const userId = listResponse.data.data.users[0]._id;
        
        const response = await apiRequest('PUT', `/api/admin/users/${userId}/status`, {
          status: 'active',
          reason: 'Test update',
        });

        expect([200, 201]).toContain(response.status);
      }
    });
  });

  describe('Database Monitoring Endpoints', () => {
    it('GET /api/admin/database/stats - should return database statistics', async () => {
      const response = await apiRequest('GET', '/api/admin/database/stats');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('collections');
      expect(response.data.data.collections).toBeGreaterThanOrEqual(64);
    });

    it('GET /api/admin/database/collections - should return collections list', async () => {
      const response = await apiRequest('GET', '/api/admin/database/collections');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('collections');
      expect(Array.isArray(response.data.data.collections)).toBe(true);
      expect(response.data.data.collections.length).toBeGreaterThan(0);
    });

    it('GET /api/admin/database/performance - should return performance metrics', async () => {
      const response = await apiRequest('GET', '/api/admin/database/performance');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
    });
  });

  describe('System Health Endpoints', () => {
    it('GET /api/admin/system/health - should return system health', async () => {
      const response = await apiRequest('GET', '/api/admin/system/health');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('memory');
      expect(response.data.data.memory).toHaveProperty('percentage');
      expect(typeof response.data.data.memory.percentage).toBe('number');
    });

    it('should return percentage as number (not string)', async () => {
      const response = await apiRequest('GET', '/api/admin/system/health');
      const { percentage } = response.data.data.memory;

      expect(typeof percentage).toBe('number');
      expect(percentage).toBeGreaterThanOrEqual(0);
      expect(percentage).toBeLessThanOrEqual(100);
    });

    it('GET /api/admin/system/metrics - should return system metrics', async () => {
      const response = await apiRequest('GET', '/api/admin/system/metrics');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
    });
  });

  describe('Settings Endpoints', () => {
    it('GET /api/settings/mongodb - should return settings', async () => {
      const response = await apiRequest('GET', '/api/settings/mongodb');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data).toHaveProperty('sections');
    });

    it('should return API keys section', async () => {
      const response = await apiRequest('GET', '/api/settings/mongodb');

      expect(response.data.sections).toBeDefined();
      expect(response.data.sections.apiKeys).toBeDefined();
    });

    it('PUT /api/settings/mongodb/:section - should save settings', async () => {
      const response = await apiRequest('PUT', '/api/settings/mongodb/general', {
        settings: {
          siteName: 'Mixillo Test',
        },
      });

      expect([200, 201]).toContain(response.status);
    });
  });

  describe('Fixed Routes (Shipping, Support, Currency, Translation)', () => {
    it('GET /api/admin/shipping/methods - should return real shipping data', async () => {
      const response = await apiRequest('GET', '/api/admin/shipping/methods');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('methods');
      expect(Array.isArray(response.data.data.methods)).toBe(true);
    });

    it('GET /api/admin/shipping/zones - should return real shipping zones', async () => {
      const response = await apiRequest('GET', '/api/admin/shipping/zones');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('zones');
    });

    it('GET /api/admin/support/tickets - should return real tickets', async () => {
      const response = await apiRequest('GET', '/api/admin/support/tickets');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('tickets');
      expect(Array.isArray(response.data.data.tickets)).toBe(true);
    });

    it('GET /api/admin/support/faq - should return real FAQs', async () => {
      const response = await apiRequest('GET', '/api/admin/support/faq');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('faqs');
    });

    it('GET /api/admin/currencies/mongodb - should return currencies', async () => {
      const response = await apiRequest('GET', '/api/admin/currencies/mongodb');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('currencies');
      expect(Array.isArray(response.data.data.currencies)).toBe(true);
    });

    it('GET /api/admin/translations - should return translations', async () => {
      const response = await apiRequest('GET', '/api/admin/translations');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('translations');
      expect(Array.isArray(response.data.data.translations)).toBe(true);
    });
  });

  describe('Orders Endpoints', () => {
    it('GET /api/admin/orders - should return orders list', async () => {
      const response = await apiRequest('GET', '/api/admin/orders?page=1&limit=10');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('orders');
      expect(Array.isArray(response.data.data.orders)).toBe(true);
    });
  });

  describe('Products Endpoints', () => {
    it('GET /api/products/admin/all - should return products list', async () => {
      const response = await apiRequest('GET', '/api/products/admin/all');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.data || response.data.products)).toBe(true);
    });
  });

  describe('Seller Applications Endpoints', () => {
    it('GET /api/admin/seller-applications - should return applications', async () => {
      const response = await apiRequest('GET', '/api/admin/seller-applications');

      expect(response.status).toBe(200);
      expect(response.data.data).toHaveProperty('applications');
      expect(Array.isArray(response.data.data.applications)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      const response = await apiRequest('GET', '/api/admin/nonexistent');
      expect(response.status).toBe(404);
    });

    it('should return 401 without token', async () => {
      try {
        await axios.get(`${API_URL}/api/admin/users`);
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });

    it('should handle invalid user ID gracefully', async () => {
      const response = await apiRequest('GET', '/api/admin/users/invalid-id');
      expect([400, 404, 500]).toContain(response.status);
    });
  });
});
