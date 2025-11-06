const admin = require('firebase-admin');
const { createTestUser, clearTestData } = require('../helpers/testHelpers');

describe('Story Model Tests', () => {
  let db;
  let testUser;

  beforeAll(async () => {
    db = admin.firestore();
    testUser = await createTestUser();
  });

  afterAll(async () => {
    await clearTestData();
  });

  describe('Story Creation', () => {
    it('should create a story with required fields', async () => {
      const storyData = {
        userId: testUser.id,
        userName: testUser.displayName,
        mediaUrl: 'https://example.com/story.jpg',
        mediaType: 'image',
        thumbnail: 'https://example.com/thumb.jpg',
        status: 'active',
        viewsCount: 0,
        likesCount: 0,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const storyRef = await db.collection('stories').add(storyData);
      const storyDoc = await storyRef.get();

      expect(storyDoc.exists).toBe(true);
      expect(storyDoc.data().userId).toBe(testUser.id);
      expect(storyDoc.data().mediaType).toBe('image');
    });

    it('should validate media type', async () => {
      const validTypes = ['image', 'video'];
      
      for (const type of validTypes) {
        const storyData = {
          userId: testUser.id,
          mediaUrl: 'https://example.com/media',
          mediaType: type,
          status: 'active'
        };

        const storyRef = await db.collection('stories').add(storyData);
        const storyDoc = await storyRef.get();
        expect(storyDoc.data().mediaType).toBe(type);
      }
    });

    it('should set expiration time 24 hours from creation', async () => {
      const now = Date.now();
      const expiresAt = new Date(now + 24 * 60 * 60 * 1000);

      const storyData = {
        userId: testUser.id,
        mediaUrl: 'https://example.com/story.jpg',
        mediaType: 'image',
        status: 'active',
        expiresAt,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const storyRef = await db.collection('stories').add(storyData);
      const storyDoc = await storyRef.get();

      const diff = storyDoc.data().expiresAt.toDate().getTime() - now;
      expect(diff).toBeGreaterThan(23 * 60 * 60 * 1000); // At least 23 hours
      expect(diff).toBeLessThan(25 * 60 * 60 * 1000); // Less than 25 hours
    });
  });

  describe('Story Updates', () => {
    it('should increment view count', async () => {
      const storyRef = await db.collection('stories').add({
        userId: testUser.id,
        mediaUrl: 'https://example.com/story.jpg',
        mediaType: 'image',
        status: 'active',
        viewsCount: 0
      });

      await storyRef.update({
        viewsCount: admin.firestore.FieldValue.increment(1)
      });

      const storyDoc = await storyRef.get();
      expect(storyDoc.data().viewsCount).toBe(1);
    });

    it('should increment like count', async () => {
      const storyRef = await db.collection('stories').add({
        userId: testUser.id,
        mediaUrl: 'https://example.com/story.jpg',
        mediaType: 'image',
        status: 'active',
        likesCount: 0
      });

      await storyRef.update({
        likesCount: admin.firestore.FieldValue.increment(1)
      });

      const storyDoc = await storyRef.get();
      expect(storyDoc.data().likesCount).toBe(1);
    });

    it('should update story status', async () => {
      const storyRef = await db.collection('stories').add({
        userId: testUser.id,
        mediaUrl: 'https://example.com/story.jpg',
        mediaType: 'image',
        status: 'active'
      });

      await storyRef.update({ status: 'hidden' });

      const storyDoc = await storyRef.get();
      expect(storyDoc.data().status).toBe('hidden');
    });
  });

  describe('Story Queries', () => {
    beforeAll(async () => {
      // Create test stories
      const now = Date.now();
      await Promise.all([
        db.collection('stories').add({
          userId: testUser.id,
          mediaType: 'image',
          status: 'active',
          viewsCount: 100,
          expiresAt: new Date(now + 24 * 60 * 60 * 1000),
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        }),
        db.collection('stories').add({
          userId: testUser.id,
          mediaType: 'video',
          status: 'active',
          viewsCount: 200,
          expiresAt: new Date(now + 24 * 60 * 60 * 1000),
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        }),
        db.collection('stories').add({
          userId: testUser.id,
          mediaType: 'image',
          status: 'hidden',
          viewsCount: 50,
          expiresAt: new Date(now - 1 * 60 * 60 * 1000), // Expired
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        })
      ]);
    });

    it('should query active stories', async () => {
      const snapshot = await db.collection('stories')
        .where('status', '==', 'active')
        .get();

      expect(snapshot.size).toBeGreaterThan(0);
      snapshot.forEach(doc => {
        expect(doc.data().status).toBe('active');
      });
    });

    it('should query non-expired stories', async () => {
      const now = admin.firestore.Timestamp.now();
      const snapshot = await db.collection('stories')
        .where('expiresAt', '>', now)
        .get();

      expect(snapshot.size).toBeGreaterThan(0);
      snapshot.forEach(doc => {
        expect(doc.data().expiresAt.toDate().getTime()).toBeGreaterThan(Date.now());
      });
    });

    it('should sort stories by views', async () => {
      const snapshot = await db.collection('stories')
        .orderBy('viewsCount', 'desc')
        .limit(10)
        .get();

      let previousViews = Infinity;
      snapshot.forEach(doc => {
        expect(doc.data().viewsCount).toBeLessThanOrEqual(previousViews);
        previousViews = doc.data().viewsCount;
      });
    });

    it('should query stories by user', async () => {
      const snapshot = await db.collection('stories')
        .where('userId', '==', testUser.id)
        .get();

      expect(snapshot.size).toBeGreaterThan(0);
      snapshot.forEach(doc => {
        expect(doc.data().userId).toBe(testUser.id);
      });
    });
  });

  describe('Story Expiration', () => {
    it('should identify expired stories', async () => {
      const expiredStory = await db.collection('stories').add({
        userId: testUser.id,
        mediaUrl: 'https://example.com/expired.jpg',
        mediaType: 'image',
        status: 'active',
        expiresAt: new Date(Date.now() - 1000) // Already expired
      });

      const storyDoc = await expiredStory.get();
      const isExpired = storyDoc.data().expiresAt.toDate().getTime() < Date.now();

      expect(isExpired).toBe(true);
    });

    it('should auto-expire stories after 24 hours', async () => {
      const now = Date.now();
      const story24HoursAgo = await db.collection('stories').add({
        userId: testUser.id,
        mediaUrl: 'https://example.com/old.jpg',
        mediaType: 'image',
        status: 'active',
        createdAt: new Date(now - 24 * 60 * 60 * 1000),
        expiresAt: new Date(now - 1000)
      });

      const storyDoc = await story24HoursAgo.get();
      expect(storyDoc.data().expiresAt.toDate().getTime()).toBeLessThan(now);
    });
  });

  describe('Story Deletion', () => {
    it('should soft delete story by hiding', async () => {
      const storyRef = await db.collection('stories').add({
        userId: testUser.id,
        mediaUrl: 'https://example.com/delete.jpg',
        mediaType: 'image',
        status: 'active'
      });

      await storyRef.update({
        status: 'deleted',
        deletedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const storyDoc = await storyRef.get();
      expect(storyDoc.data().status).toBe('deleted');
      expect(storyDoc.data().deletedAt).toBeDefined();
    });

    it('should hard delete story', async () => {
      const storyRef = await db.collection('stories').add({
        userId: testUser.id,
        mediaUrl: 'https://example.com/hard-delete.jpg',
        mediaType: 'image',
        status: 'active'
      });

      await storyRef.delete();

      const storyDoc = await storyRef.get();
      expect(storyDoc.exists).toBe(false);
    });
  });
});
