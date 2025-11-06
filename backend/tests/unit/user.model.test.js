const admin = require('firebase-admin');
const { createTestUser, clearTestData } = require('../helpers/testHelpers');

describe('User Model Tests', () => {
  let db;

  beforeAll(() => {
    db = admin.firestore();
  });

  afterAll(async () => {
    await clearTestData();
  });

  describe('User Creation', () => {
    it('should create a user with required fields', async () => {
      const userData = {
        email: 'newuser@example.com',
        username: 'newuser',
        displayName: 'New User',
        role: 'user',
        status: 'active'
      };

      const userRef = await db.collection('users').add(userData);
      const userDoc = await userRef.get();

      expect(userDoc.exists).toBe(true);
      expect(userDoc.data().email).toBe(userData.email);
      expect(userDoc.data().username).toBe(userData.username);
    });

    it('should create user with default values', async () => {
      const user = await createTestUser();

      expect(user.followersCount).toBe(0);
      expect(user.followingCount).toBe(0);
      expect(user.videosCount).toBe(0);
      expect(user.isVerified).toBe(false);
    });

    it('should validate email format', async () => {
      const invalidUser = {
        email: 'invalid-email',
        username: 'testuser'
      };

      // This should fail validation
      await expect(async () => {
        await db.collection('users').add(invalidUser);
      }).rejects.toThrow();
    });
  });

  describe('User Updates', () => {
    it('should update user profile', async () => {
      const user = await createTestUser();
      
      await db.collection('users').doc(user.id).update({
        displayName: 'Updated Name',
        bio: 'Updated bio'
      });

      const updatedDoc = await db.collection('users').doc(user.id).get();
      expect(updatedDoc.data().displayName).toBe('Updated Name');
      expect(updatedDoc.data().bio).toBe('Updated bio');
    });

    it('should increment counters correctly', async () => {
      const user = await createTestUser();
      
      await db.collection('users').doc(user.id).update({
        followersCount: admin.firestore.FieldValue.increment(1),
        videosCount: admin.firestore.FieldValue.increment(1)
      });

      const updatedDoc = await db.collection('users').doc(user.id).get();
      expect(updatedDoc.data().followersCount).toBe(1);
      expect(updatedDoc.data().videosCount).toBe(1);
    });
  });

  describe('User Queries', () => {
    beforeAll(async () => {
      // Create test users
      await createTestUser({ role: 'user', status: 'active' });
      await createTestUser({ role: 'seller', status: 'active' });
      await createTestUser({ role: 'user', status: 'banned' });
    });

    it('should query users by role', async () => {
      const snapshot = await db.collection('users')
        .where('role', '==', 'seller')
        .get();

      expect(snapshot.size).toBeGreaterThan(0);
      snapshot.forEach(doc => {
        expect(doc.data().role).toBe('seller');
      });
    });

    it('should query users by status', async () => {
      const snapshot = await db.collection('users')
        .where('status', '==', 'active')
        .get();

      expect(snapshot.size).toBeGreaterThan(0);
      snapshot.forEach(doc => {
        expect(doc.data().status).toBe('active');
      });
    });

    it('should sort users by creation date', async () => {
      const snapshot = await db.collection('users')
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();

      expect(snapshot.size).toBeGreaterThan(0);
      
      let previousTimestamp = null;
      snapshot.forEach(doc => {
        const timestamp = doc.data().createdAt;
        if (previousTimestamp) {
          expect(timestamp.toMillis()).toBeLessThanOrEqual(previousTimestamp.toMillis());
        }
        previousTimestamp = timestamp;
      });
    });
  });

  describe('User Deletion', () => {
    it('should soft delete user', async () => {
      const user = await createTestUser();
      
      await db.collection('users').doc(user.id).update({
        status: 'deleted',
        deletedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const deletedDoc = await db.collection('users').doc(user.id).get();
      expect(deletedDoc.data().status).toBe('deleted');
      expect(deletedDoc.data().deletedAt).toBeDefined();
    });

    it('should hard delete user', async () => {
      const user = await createTestUser();
      
      await db.collection('users').doc(user.id).delete();

      const deletedDoc = await db.collection('users').doc(user.id).get();
      expect(deletedDoc.exists).toBe(false);
    });
  });
});
