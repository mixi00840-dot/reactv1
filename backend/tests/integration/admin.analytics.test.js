const request = require('supertest');
const admin = require('firebase-admin');
const { generateTestToken, createTestAdmin, createTestUser, createTestProduct, createTestOrder, clearTestData } = require('../helpers/testHelpers');

let app;

describe('Admin Analytics & Dashboard API Tests', () => {
  let adminToken;
  let adminUser;

  beforeAll(async () => {
    app = require('../../src/server-simple');
    adminUser = await createTestAdmin();
    adminToken = generateTestToken(adminUser.id, 'admin');

    // Create test data for analytics
    await Promise.all([
      createTestUser({ status: 'active', role: 'user' }),
      createTestUser({ status: 'active', role: 'user' }),
      createTestUser({ status: 'banned', role: 'user' }),
      createTestProduct({ status: 'active', price: 99.99 }),
      createTestProduct({ status: 'active', price: 149.99 }),
      createTestOrder({ status: 'completed', totalAmount: 199.98 }),
      createTestOrder({ status: 'pending', totalAmount: 149.99 })
    ]);
  });

  afterAll(async () => {
    await clearTestData();
  });

  describe('GET /api/admin/dashboard', () => {
    it('should return dashboard overview statistics', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('stats');
      expect(response.body.stats).toHaveProperty('totalUsers');
      expect(response.body.stats).toHaveProperty('totalSellers');
      expect(response.body.stats).toHaveProperty('totalProducts');
      expect(response.body.stats).toHaveProperty('totalOrders');
      expect(response.body.stats).toHaveProperty('totalRevenue');
    });

    it('should include recent activity data', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ includeActivity: true });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('recentUsers');
      expect(response.body).toHaveProperty('recentOrders');
      expect(Array.isArray(response.body.recentUsers)).toBe(true);
      expect(Array.isArray(response.body.recentOrders)).toBe(true);
    });

    it('should calculate growth metrics', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.stats).toHaveProperty('userGrowth');
      expect(response.body.stats).toHaveProperty('revenueGrowth');
    });
  });

  describe('GET /api/admin/analytics/users', () => {
    it('should return user analytics', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ period: 'month' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalUsers');
      expect(response.body).toHaveProperty('newUsers');
      expect(response.body).toHaveProperty('activeUsers');
      expect(response.body).toHaveProperty('usersByRole');
      expect(response.body).toHaveProperty('usersByStatus');
    });

    it('should return user growth chart data', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/users/growth')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ period: 'week' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('chartData');
      expect(Array.isArray(response.body.chartData)).toBe(true);
    });

    it('should support different time periods', async () => {
      const periods = ['day', 'week', 'month', 'year'];
      
      for (const period of periods) {
        const response = await request(app)
          .get('/api/admin/analytics/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ period });

        expect(response.status).toBe(200);
      }
    });
  });

  describe('GET /api/admin/analytics/revenue', () => {
    it('should return revenue analytics', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/revenue')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ period: 'month' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalRevenue');
      expect(response.body).toHaveProperty('averageOrderValue');
      expect(response.body).toHaveProperty('revenueByDate');
      expect(Array.isArray(response.body.revenueByDate)).toBe(true);
    });

    it('should calculate revenue growth', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/revenue')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ period: 'month' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('growth');
      expect(typeof response.body.growth).toBe('number');
    });

    it('should support date range filtering', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get('/api/admin/analytics/revenue')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ startDate, endDate });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/admin/analytics/products', () => {
    it('should return product analytics', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/products')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalProducts');
      expect(response.body).toHaveProperty('activeProducts');
      expect(response.body).toHaveProperty('outOfStock');
      expect(response.body).toHaveProperty('lowStock');
    });

    it('should return top selling products', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/products/top-sellers')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('products');
      expect(Array.isArray(response.body.products)).toBe(true);
    });

    it('should return category distribution', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/products/categories')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('categories');
      expect(Array.isArray(response.body.categories)).toBe(true);
    });
  });

  describe('GET /api/admin/analytics/orders', () => {
    it('should return order analytics', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ period: 'month' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalOrders');
      expect(response.body).toHaveProperty('completedOrders');
      expect(response.body).toHaveProperty('pendingOrders');
      expect(response.body).toHaveProperty('cancelledOrders');
      expect(response.body).toHaveProperty('ordersByStatus');
    });

    it('should return order trends', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/orders/trends')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ period: 'month' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('chartData');
      expect(Array.isArray(response.body.chartData)).toBe(true);
    });

    it('should calculate conversion metrics', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/orders/conversion')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('conversionRate');
      expect(response.body).toHaveProperty('abandonmentRate');
    });
  });

  describe('GET /api/admin/analytics/sellers', () => {
    it('should return seller analytics', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/sellers')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalSellers');
      expect(response.body).toHaveProperty('activeSellers');
      expect(response.body).toHaveProperty('pendingApplications');
      expect(response.body).toHaveProperty('topSellers');
    });

    it('should return seller performance metrics', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/sellers/performance')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ limit: 20 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sellers');
      expect(Array.isArray(response.body.sellers)).toBe(true);
    });
  });

  describe('GET /api/admin/analytics/engagement', () => {
    it('should return engagement metrics', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/engagement')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ period: 'month' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('dailyActiveUsers');
      expect(response.body).toHaveProperty('monthlyActiveUsers');
      expect(response.body).toHaveProperty('averageSessionDuration');
      expect(response.body).toHaveProperty('returnRate');
    });
  });

  describe('GET /api/admin/analytics/export', () => {
    it('should export analytics data as CSV', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ 
          type: 'users',
          format: 'csv',
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
    });

    it('should export analytics data as JSON', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ 
          type: 'revenue',
          format: 'json'
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
    });
  });

  describe('Authorization', () => {
    it('should reject requests without admin token', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard');

      expect(response.status).toBe(401);
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    it('should reject requests from non-admin users', async () => {
      const regularUser = await createTestUser();
      const userToken = generateTestToken(regularUser.id, 'user');

      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });
});
