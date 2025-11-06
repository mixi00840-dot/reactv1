const request = require('supertest');
const admin = require('firebase-admin');
const { generateTestToken, createTestAdmin, createTestUser, clearTestData } = require('../helpers/testHelpers');

// Import your Express app
let app;

describe('Admin Users API Tests', () => {
  let adminToken;
  let adminUser;
  let testUser;

  beforeAll(async () => {
    // Initialize app
    app = require('../../src/server-simple');
    
    // Create test admin
    adminUser = await createTestAdmin();
    adminToken = generateTestToken(adminUser.id, 'admin');

    // Create test user
    testUser = await createTestUser();
  });

  afterAll(async () => {
    await clearTestData();
  });

  describe('GET /api/admin/users', () => {
    it('should return list of users with pagination', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('totalUsers');
      expect(response.body).toHaveProperty('currentPage');
      expect(response.body).toHaveProperty('totalPages');
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    it('should filter users by status', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ status: 'active' });

      expect(response.status).toBe(200);
      response.body.users.forEach(user => {
        expect(user.status).toBe('active');
      });
    });

    it('should filter users by role', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ role: 'user' });

      expect(response.status).toBe(200);
      response.body.users.forEach(user => {
        expect(user.role).toBe('user');
      });
    });

    it('should search users by email or username', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ search: testUser.email.substring(0, 10) });

      expect(response.status).toBe(200);
      expect(response.body.users.length).toBeGreaterThan(0);
    });

    it('should reject request without admin token', async () => {
      const response = await request(app)
        .get('/api/admin/users');

      expect(response.status).toBe(401);
    });

    it('should reject request with non-admin token', async () => {
      const userToken = generateTestToken(testUser.id, 'user');
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/admin/users/:id', () => {
    it('should return user details by ID', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.id).toBe(testUser.id);
      expect(response.body.user.email).toBe(testUser.email);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/admin/users/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/admin/users/:id/ban', () => {
    it('should ban a user successfully', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${testUser.id}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Test ban reason',
          duration: 7
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      
      // Verify user is banned in database
      const db = admin.firestore();
      const userDoc = await db.collection('users').doc(testUser.id).get();
      expect(userDoc.data().status).toBe('banned');
    });

    it('should validate ban reason is required', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${testUser.id}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/admin/users/:id/unban', () => {
    it('should unban a banned user', async () => {
      // First ban the user
      await request(app)
        .put(`/api/admin/users/${testUser.id}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test', duration: 7 });

      // Then unban
      const response = await request(app)
        .put(`/api/admin/users/${testUser.id}/unban`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      
      // Verify user is active
      const db = admin.firestore();
      const userDoc = await db.collection('users').doc(testUser.id).get();
      expect(userDoc.data().status).toBe('active');
    });
  });

  describe('PUT /api/admin/users/:id/verify', () => {
    it('should verify a user', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${testUser.id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      
      // Verify in database
      const db = admin.firestore();
      const userDoc = await db.collection('users').doc(testUser.id).get();
      expect(userDoc.data().isVerified).toBe(true);
    });
  });

  describe('PUT /api/admin/users/:id/feature', () => {
    it('should feature a user', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${testUser.id}/feature`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ featured: true });

      expect(response.status).toBe(200);
      
      // Verify in database
      const db = admin.firestore();
      const userDoc = await db.collection('users').doc(testUser.id).get();
      expect(userDoc.data().isFeatured).toBe(true);
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should delete a user', async () => {
      // Create a user to delete
      const userToDelete = await createTestUser();
      
      const response = await request(app)
        .delete(`/api/admin/users/${userToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      
      // Verify user is deleted
      const db = admin.firestore();
      const userDoc = await db.collection('users').doc(userToDelete.id).get();
      expect(userDoc.exists).toBe(false);
    });
  });

  describe('GET /api/admin/users/stats', () => {
    it('should return user statistics', async () => {
      const response = await request(app)
        .get('/api/admin/users/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalUsers');
      expect(response.body).toHaveProperty('activeUsers');
      expect(response.body).toHaveProperty('bannedUsers');
      expect(response.body).toHaveProperty('verifiedUsers');
      expect(response.body).toHaveProperty('newUsersToday');
    });
  });
});
