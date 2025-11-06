const request = require('supertest');
const admin = require('firebase-admin');
const { generateTestToken, createTestAdmin, createTestUser, clearTestData, waitForFirestore } = require('../helpers/testHelpers');

let app;

describe('Admin Stories API Tests', () => {
  let adminToken;
  let adminUser;
  let testUser;
  let testStory;

  beforeAll(async () => {
    app = require('../../src/server-simple');
    adminUser = await createTestAdmin();
    adminToken = generateTestToken(adminUser.id, 'admin');
    testUser = await createTestUser();

    // Create test story
    const db = admin.firestore();
    const storyRef = await db.collection('stories').add({
      userId: testUser.id,
      userName: testUser.displayName || testUser.username,
      userAvatar: testUser.avatar || '',
      mediaUrl: 'https://example.com/story.jpg',
      mediaType: 'image',
      thumbnail: 'https://example.com/story-thumb.jpg',
      duration: 5000,
      caption: 'Test story caption',
      status: 'active',
      viewsCount: 100,
      likesCount: 25,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    testStory = { id: storyRef.id };
  });

  afterAll(async () => {
    await clearTestData();
  });

  describe('GET /api/admin/stories', () => {
    it('should return list of stories with pagination', async () => {
      const response = await request(app)
        .get('/api/admin/stories')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('stories');
      expect(response.body).toHaveProperty('totalStories');
      expect(response.body).toHaveProperty('currentPage');
      expect(Array.isArray(response.body.stories)).toBe(true);
    });

    it('should filter stories by status', async () => {
      const response = await request(app)
        .get('/api/admin/stories')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ status: 'active' });

      expect(response.status).toBe(200);
      response.body.stories.forEach(story => {
        expect(story.status).toBe('active');
      });
    });

    it('should filter stories by media type', async () => {
      const response = await request(app)
        .get('/api/admin/stories')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ mediaType: 'image' });

      expect(response.status).toBe(200);
      response.body.stories.forEach(story => {
        expect(story.mediaType).toBe('image');
      });
    });

    it('should search stories by caption or user', async () => {
      const response = await request(app)
        .get('/api/admin/stories')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ search: 'test' });

      expect(response.status).toBe(200);
    });

    it('should filter expired stories', async () => {
      const response = await request(app)
        .get('/api/admin/stories')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ expired: true });

      expect(response.status).toBe(200);
      response.body.stories.forEach(story => {
        expect(new Date(story.expiresAt).getTime()).toBeLessThan(Date.now());
      });
    });
  });

  describe('GET /api/admin/stories/:id', () => {
    it('should return story details', async () => {
      const response = await request(app)
        .get(`/api/admin/stories/${testStory.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('story');
      expect(response.body.story.id).toBe(testStory.id);
    });

    it('should return 404 for non-existent story', async () => {
      const response = await request(app)
        .get('/api/admin/stories/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/admin/stories/:id/status', () => {
    it('should update story status to hidden', async () => {
      const response = await request(app)
        .put(`/api/admin/stories/${testStory.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'hidden' });

      expect(response.status).toBe(200);

      const db = admin.firestore();
      const storyDoc = await db.collection('stories').doc(testStory.id).get();
      expect(storyDoc.data().status).toBe('hidden');
    });

    it('should update story status to flagged', async () => {
      const response = await request(app)
        .put(`/api/admin/stories/${testStory.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'flagged', reason: 'Inappropriate content' });

      expect(response.status).toBe(200);

      const db = admin.firestore();
      const storyDoc = await db.collection('stories').doc(testStory.id).get();
      expect(storyDoc.data().status).toBe('flagged');
      expect(storyDoc.data().flagReason).toBeDefined();
    });

    it('should validate status value', async () => {
      const response = await request(app)
        .put(`/api/admin/stories/${testStory.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'invalid-status' });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/admin/stories/:id', () => {
    it('should delete a story', async () => {
      // Create story to delete
      const db = admin.firestore();
      const storyRef = await db.collection('stories').add({
        userId: testUser.id,
        mediaUrl: 'https://example.com/delete-story.jpg',
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const response = await request(app)
        .delete(`/api/admin/stories/${storyRef.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const deletedDoc = await db.collection('stories').doc(storyRef.id).get();
      expect(deletedDoc.exists).toBe(false);
    });
  });

  describe('GET /api/admin/stories/stats', () => {
    it('should return story statistics', async () => {
      const response = await request(app)
        .get('/api/admin/stories/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalStories');
      expect(response.body).toHaveProperty('activeStories');
      expect(response.body).toHaveProperty('expiredStories');
      expect(response.body).toHaveProperty('flaggedStories');
      expect(response.body).toHaveProperty('totalViews');
      expect(response.body).toHaveProperty('totalLikes');
    });
  });

  describe('GET /api/admin/stories/trending', () => {
    it('should return trending stories', async () => {
      const response = await request(app)
        .get('/api/admin/stories/trending')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('stories');
      expect(Array.isArray(response.body.stories)).toBe(true);
      
      // Verify sorted by views/likes
      const stories = response.body.stories;
      for (let i = 1; i < stories.length; i++) {
        expect(stories[i-1].viewsCount).toBeGreaterThanOrEqual(stories[i].viewsCount);
      }
    });
  });

  describe('PUT /api/admin/stories/:id/feature', () => {
    it('should feature a story', async () => {
      const response = await request(app)
        .put(`/api/admin/stories/${testStory.id}/feature`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ featured: true });

      expect(response.status).toBe(200);

      const db = admin.firestore();
      const storyDoc = await db.collection('stories').doc(testStory.id).get();
      expect(storyDoc.data().isFeatured).toBe(true);
    });

    it('should unfeature a story', async () => {
      const response = await request(app)
        .put(`/api/admin/stories/${testStory.id}/feature`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ featured: false });

      expect(response.status).toBe(200);

      const db = admin.firestore();
      const storyDoc = await db.collection('stories').doc(testStory.id).get();
      expect(storyDoc.data().isFeatured).toBe(false);
    });
  });
});
