const request = require('supertest');
const admin = require('firebase-admin');
const { generateTestToken, createTestAdmin, createTestSeller, clearTestData } = require('../helpers/testHelpers');
const { mockSellerApplication } = require('../fixtures/mockData');

let app;

describe('Admin Sellers API Tests', () => {
  let adminToken;
  let adminUser;
  let sellerUser;
  let sellerApplication;

  beforeAll(async () => {
    app = require('../../src/server-simple');
    adminUser = await createTestAdmin();
    adminToken = generateTestToken(adminUser.id, 'admin');
    sellerUser = await createTestSeller();

    // Create pending seller application
    const db = admin.firestore();
    const appRef = await db.collection('sellerApplications').add({
      ...mockSellerApplication,
      userId: sellerUser.id,
      status: 'pending'
    });
    sellerApplication = { id: appRef.id, ...mockSellerApplication };
  });

  afterAll(async () => {
    await clearTestData();
  });

  describe('GET /api/admin/sellers', () => {
    it('should return list of seller applications', async () => {
      const response = await request(app)
        .get('/api/admin/sellers')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('applications');
      expect(response.body).toHaveProperty('totalApplications');
      expect(Array.isArray(response.body.applications)).toBe(true);
    });

    it('should filter by application status', async () => {
      const response = await request(app)
        .get('/api/admin/sellers')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ status: 'pending' });

      expect(response.status).toBe(200);
      response.body.applications.forEach(app => {
        expect(app.status).toBe('pending');
      });
    });
  });

  describe('GET /api/admin/sellers/:id', () => {
    it('should return seller application details', async () => {
      const response = await request(app)
        .get(`/api/admin/sellers/${sellerApplication.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('application');
      expect(response.body.application.id).toBe(sellerApplication.id);
    });
  });

  describe('PUT /api/admin/sellers/:id/approve', () => {
    it('should approve seller application', async () => {
      const response = await request(app)
        .put(`/api/admin/sellers/${sellerApplication.id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notes: 'Application looks good' });

      expect(response.status).toBe(200);
      
      const db = admin.firestore();
      const appDoc = await db.collection('sellerApplications').doc(sellerApplication.id).get();
      expect(appDoc.data().status).toBe('approved');
      
      // Verify user role updated
      const userDoc = await db.collection('users').doc(sellerUser.id).get();
      expect(userDoc.data().role).toBe('seller');
      expect(userDoc.data().isSeller).toBe(true);
    });
  });

  describe('PUT /api/admin/sellers/:id/reject', () => {
    it('should reject seller application with reason', async () => {
      // Create new pending application
      const db = admin.firestore();
      const newAppRef = await db.collection('sellerApplications').add({
        ...mockSellerApplication,
        status: 'pending'
      });

      const response = await request(app)
        .put(`/api/admin/sellers/${newAppRef.id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Incomplete documents' });

      expect(response.status).toBe(200);
      
      const appDoc = await db.collection('sellerApplications').doc(newAppRef.id).get();
      expect(appDoc.data().status).toBe('rejected');
      expect(appDoc.data().rejectionReason).toBe('Incomplete documents');
    });
  });

  describe('PUT /api/admin/sellers/:id/suspend', () => {
    it('should suspend a seller account', async () => {
      const response = await request(app)
        .put(`/api/admin/sellers/${sellerUser.id}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Policy violation', duration: 30 });

      expect(response.status).toBe(200);
      
      const db = admin.firestore();
      const userDoc = await db.collection('users').doc(sellerUser.id).get();
      expect(userDoc.data().sellerStatus).toBe('suspended');
    });
  });

  describe('GET /api/admin/sellers/stats', () => {
    it('should return seller statistics', async () => {
      const response = await request(app)
        .get('/api/admin/sellers/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalSellers');
      expect(response.body).toHaveProperty('activeSellers');
      expect(response.body).toHaveProperty('pendingApplications');
      expect(response.body).toHaveProperty('rejectedApplications');
    });
  });
});
