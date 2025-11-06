const request = require('supertest');
const admin = require('firebase-admin');
const { generateTestToken, createTestAdmin, createTestUser, createTestUpload, clearTestData } = require('../helpers/testHelpers');

let app;

describe('Admin Uploads API Tests', () => {
  let adminToken;
  let adminUser;
  let testUpload;

  beforeAll(async () => {
    app = require('../../src/server-simple');
    adminUser = await createTestAdmin();
    adminToken = generateTestToken(adminUser.id, 'admin');
    testUpload = await createTestUpload();
  });

  afterAll(async () => {
    await clearTestData();
  });

  describe('GET /api/admin/uploads', () => {
    it('should return list of uploads with pagination', async () => {
      const response = await request(app)
        .get('/api/admin/uploads')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('uploads');
      expect(response.body).toHaveProperty('totalUploads');
      expect(response.body).toHaveProperty('currentPage');
      expect(Array.isArray(response.body.uploads)).toBe(true);
    });

    it('should filter uploads by type', async () => {
      const response = await request(app)
        .get('/api/admin/uploads')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ type: 'id' });

      expect(response.status).toBe(200);
      response.body.uploads.forEach(upload => {
        expect(upload.type).toBe('id');
      });
    });

    it('should filter uploads by status', async () => {
      const response = await request(app)
        .get('/api/admin/uploads')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ status: 'pending' });

      expect(response.status).toBe(200);
      response.body.uploads.forEach(upload => {
        expect(upload.status).toBe('pending');
      });
    });

    it('should search uploads by filename or user', async () => {
      const response = await request(app)
        .get('/api/admin/uploads')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ search: 'test' });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/admin/uploads/:id', () => {
    it('should return upload details', async () => {
      const response = await request(app)
        .get(`/api/admin/uploads/${testUpload.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('upload');
      expect(response.body.upload.id).toBe(testUpload.id);
    });
  });

  describe('PUT /api/admin/uploads/:id/approve', () => {
    it('should approve an upload', async () => {
      const response = await request(app)
        .put(`/api/admin/uploads/${testUpload.id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      
      const db = admin.firestore();
      const uploadDoc = await db.collection('uploads').doc(testUpload.id).get();
      expect(uploadDoc.data().status).toBe('approved');
    });
  });

  describe('PUT /api/admin/uploads/:id/reject', () => {
    it('should reject an upload with reason', async () => {
      const response = await request(app)
        .put(`/api/admin/uploads/${testUpload.id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Invalid document' });

      expect(response.status).toBe(200);
      
      const db = admin.firestore();
      const uploadDoc = await db.collection('uploads').doc(testUpload.id).get();
      expect(uploadDoc.data().status).toBe('rejected');
      expect(uploadDoc.data().rejectionReason).toBe('Invalid document');
    });
  });

  describe('DELETE /api/admin/uploads/:id', () => {
    it('should delete an upload', async () => {
      const uploadToDelete = await createTestUpload();
      
      const response = await request(app)
        .delete(`/api/admin/uploads/${uploadToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      
      const db = admin.firestore();
      const uploadDoc = await db.collection('uploads').doc(uploadToDelete.id).get();
      expect(uploadDoc.exists).toBe(false);
    });
  });
});
