const request = require('supertest');
const admin = require('firebase-admin');
const {
  generateTestToken,
  createTestAdmin,
  createTestUser,
  createTestSeller,
  createTestProduct,
  createTestOrder,
  clearTestData,
  waitForFirestore
} = require('../helpers/testHelpers');

let app;

describe('End-to-End Integration Tests', () => {
  let adminToken;
  let adminUser;

  beforeAll(async () => {
    app = require('../../src/server-simple');
    adminUser = await createTestAdmin();
    adminToken = generateTestToken(adminUser.id, 'admin');
  });

  afterAll(async () => {
    await clearTestData();
  });

  describe('Complete User Lifecycle', () => {
    it('should complete full user lifecycle: create -> verify -> ban -> unban', async () => {
      // Create user
      const user = await createTestUser();
      expect(user.id).toBeDefined();
      
      // Verify user
      const verifyResponse = await request(app)
        .put(`/api/admin/users/${user.id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(verifyResponse.status).toBe(200);

      await waitForFirestore();

      // Check verification
      const db = admin.firestore();
      let userDoc = await db.collection('users').doc(user.id).get();
      expect(userDoc.data().isVerified).toBe(true);

      // Ban user
      const banResponse = await request(app)
        .put(`/api/admin/users/${user.id}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test ban', duration: 7 });
      expect(banResponse.status).toBe(200);

      await waitForFirestore();

      userDoc = await db.collection('users').doc(user.id).get();
      expect(userDoc.data().status).toBe('banned');

      // Unban user
      const unbanResponse = await request(app)
        .put(`/api/admin/users/${user.id}/unban`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(unbanResponse.status).toBe(200);

      await waitForFirestore();

      userDoc = await db.collection('users').doc(user.id).get();
      expect(userDoc.data().status).toBe('active');
    });
  });

  describe('Complete Seller Application Workflow', () => {
    it('should complete seller application: submit -> review -> approve', async () => {
      const user = await createTestUser();
      const db = admin.firestore();

      // Submit seller application
      const applicationData = {
        userId: user.id,
        storeName: 'Test Store',
        businessType: 'individual',
        status: 'pending'
      };

      const appRef = await db.collection('sellerApplications').add(applicationData);
      const applicationId = appRef.id;

      await waitForFirestore();

      // Get application
      const getResponse = await request(app)
        .get(`/api/admin/sellers/${applicationId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.application.status).toBe('pending');

      // Approve application
      const approveResponse = await request(app)
        .put(`/api/admin/sellers/${applicationId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notes: 'Approved' });
      expect(approveResponse.status).toBe(200);

      await waitForFirestore();

      // Verify seller role updated
      const userDoc = await db.collection('users').doc(user.id).get();
      expect(userDoc.data().role).toBe('seller');
      expect(userDoc.data().isSeller).toBe(true);
    });
  });

  describe('Complete Order Processing Workflow', () => {
    it('should process order: create -> payment -> ship -> deliver', async () => {
      const customer = await createTestUser();
      const seller = await createTestSeller();
      const product = await createTestProduct({ sellerId: seller.id });

      // Create order
      const order = await createTestOrder({
        customerId: customer.id,
        items: [{
          productId: product.id,
          quantity: 2,
          price: product.price
        }],
        status: 'pending'
      });

      await waitForFirestore();

      // Update to processing
      let response = await request(app)
        .put(`/api/admin/orders/${order.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'processing' });
      expect(response.status).toBe(200);

      // Add tracking
      response = await request(app)
        .put(`/api/admin/orders/${order.id}/tracking`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          trackingNumber: 'TRACK123',
          carrier: 'UPS'
        });
      expect(response.status).toBe(200);

      // Update to shipped
      response = await request(app)
        .put(`/api/admin/orders/${order.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'shipped' });
      expect(response.status).toBe(200);

      // Update to delivered
      response = await request(app)
        .put(`/api/admin/orders/${order.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'delivered' });
      expect(response.status).toBe(200);

      await waitForFirestore();

      // Verify final status
      const db = admin.firestore();
      const orderDoc = await db.collection('orders').doc(order.id).get();
      expect(orderDoc.data().status).toBe('delivered');
      expect(orderDoc.data().trackingNumber).toBe('TRACK123');
    });
  });

  describe('Product Management Workflow', () => {
    it('should manage product: create -> update -> feature -> deactivate', async () => {
      const seller = await createTestSeller();
      const product = await createTestProduct({ sellerId: seller.id });

      await waitForFirestore();

      // Update product
      let response = await request(app)
        .put(`/api/admin/products/${product.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Product',
          price: 149.99
        });
      expect(response.status).toBe(200);

      // Feature product
      response = await request(app)
        .put(`/api/admin/products/${product.id}/feature`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ featured: true });
      expect(response.status).toBe(200);

      // Deactivate product
      response = await request(app)
        .put(`/api/admin/products/${product.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'inactive' });
      expect(response.status).toBe(200);

      await waitForFirestore();

      // Verify final state
      const db = admin.firestore();
      const productDoc = await db.collection('products').doc(product.id).get();
      expect(productDoc.data().name).toBe('Updated Product');
      expect(productDoc.data().isFeatured).toBe(true);
      expect(productDoc.data().status).toBe('inactive');
    });
  });

  describe('Dashboard Analytics', () => {
    it('should aggregate statistics correctly', async () => {
      // Create test data
      await Promise.all([
        createTestUser({ status: 'active' }),
        createTestUser({ status: 'active' }),
        createTestUser({ status: 'banned' }),
        createTestSeller(),
        createTestProduct(),
        createTestProduct(),
        createTestOrder({ status: 'completed', totalAmount: 100 }),
        createTestOrder({ status: 'completed', totalAmount: 200 })
      ]);

      await waitForFirestore(2000);

      // Get dashboard stats
      const response = await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalUsers');
      expect(response.body).toHaveProperty('totalSellers');
      expect(response.body).toHaveProperty('totalProducts');
      expect(response.body).toHaveProperty('totalOrders');
      expect(response.body).toHaveProperty('totalRevenue');
      
      expect(response.body.totalUsers).toBeGreaterThan(0);
      expect(response.body.totalRevenue).toBeGreaterThanOrEqual(300);
    });
  });
});
