const request = require('supertest');
const admin = require('firebase-admin');
const { generateTestToken, createTestAdmin, createTestOrder, clearTestData } = require('../helpers/testHelpers');

let app;

describe('Admin Orders API Tests', () => {
  let adminToken;
  let adminUser;
  let testOrder;

  beforeAll(async () => {
    app = require('../../src/server-simple');
    adminUser = await createTestAdmin();
    adminToken = generateTestToken(adminUser.id, 'admin');
    testOrder = await createTestOrder();
  });

  afterAll(async () => {
    await clearTestData();
  });

  describe('GET /api/admin/orders', () => {
    it('should return list of orders', async () => {
      const response = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('orders');
      expect(response.body).toHaveProperty('totalOrders');
      expect(Array.isArray(response.body.orders)).toBe(true);
    });

    it('should filter orders by status', async () => {
      const response = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ status: 'pending' });

      expect(response.status).toBe(200);
      response.body.orders.forEach(order => {
        expect(order.status).toBe('pending');
      });
    });

    it('should filter orders by date range', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ startDate, endDate });

      expect(response.status).toBe(200);
    });

    it('should search orders by order number', async () => {
      const response = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ search: 'ORD' });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/admin/orders/:id', () => {
    it('should return order details', async () => {
      const response = await request(app)
        .get(`/api/admin/orders/${testOrder.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('order');
      expect(response.body.order.id).toBe(testOrder.id);
    });
  });

  describe('PUT /api/admin/orders/:id/status', () => {
    it('should update order status', async () => {
      const response = await request(app)
        .put(`/api/admin/orders/${testOrder.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'processing' });

      expect(response.status).toBe(200);
      
      const db = admin.firestore();
      const orderDoc = await db.collection('orders').doc(testOrder.id).get();
      expect(orderDoc.data().status).toBe('processing');
    });

    it('should validate status transition', async () => {
      const response = await request(app)
        .put(`/api/admin/orders/${testOrder.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'invalid-status' });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/admin/orders/:id/tracking', () => {
    it('should add tracking number to order', async () => {
      const trackingInfo = {
        trackingNumber: 'TRACK123456',
        carrier: 'UPS',
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      };

      const response = await request(app)
        .put(`/api/admin/orders/${testOrder.id}/tracking`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(trackingInfo);

      expect(response.status).toBe(200);
      
      const db = admin.firestore();
      const orderDoc = await db.collection('orders').doc(testOrder.id).get();
      expect(orderDoc.data().trackingNumber).toBe(trackingInfo.trackingNumber);
    });
  });

  describe('PUT /api/admin/orders/:id/refund', () => {
    it('should process order refund', async () => {
      const response = await request(app)
        .put(`/api/admin/orders/${testOrder.id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ 
          reason: 'Customer request',
          amount: testOrder.totalAmount
        });

      expect(response.status).toBe(200);
      
      const db = admin.firestore();
      const orderDoc = await db.collection('orders').doc(testOrder.id).get();
      expect(orderDoc.data().status).toBe('refunded');
    });
  });

  describe('PUT /api/admin/orders/:id/cancel', () => {
    it('should cancel an order', async () => {
      const newOrder = await createTestOrder();
      
      const response = await request(app)
        .put(`/api/admin/orders/${newOrder.id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Out of stock' });

      expect(response.status).toBe(200);
      
      const db = admin.firestore();
      const orderDoc = await db.collection('orders').doc(newOrder.id).get();
      expect(orderDoc.data().status).toBe('cancelled');
    });
  });

  describe('GET /api/admin/orders/stats', () => {
    it('should return order statistics', async () => {
      const response = await request(app)
        .get('/api/admin/orders/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalOrders');
      expect(response.body).toHaveProperty('pendingOrders');
      expect(response.body).toHaveProperty('completedOrders');
      expect(response.body).toHaveProperty('totalRevenue');
      expect(response.body).toHaveProperty('averageOrderValue');
    });
  });

  describe('GET /api/admin/orders/revenue', () => {
    it('should return revenue analytics', async () => {
      const response = await request(app)
        .get('/api/admin/orders/revenue')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ period: 'month' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalRevenue');
      expect(response.body).toHaveProperty('revenueByDate');
      expect(Array.isArray(response.body.revenueByDate)).toBe(true);
    });
  });
});
