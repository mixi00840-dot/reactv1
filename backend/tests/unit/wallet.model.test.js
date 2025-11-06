const admin = require('firebase-admin');
const { createTestUser, clearTestData } = require('../helpers/testHelpers');

describe('Wallet Model Tests', () => {
  let db;
  let testUser;

  beforeAll(async () => {
    db = admin.firestore();
    testUser = await createTestUser();
  });

  afterAll(async () => {
    await clearTestData();
  });

  describe('Wallet Creation', () => {
    it('should create a wallet with default values', async () => {
      const walletData = {
        userId: testUser.id,
        balance: 0,
        currency: 'USD',
        status: 'active',
        totalEarnings: 0,
        totalWithdrawals: 0,
        pendingBalance: 0,
        availableBalance: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const walletRef = await db.collection('wallets').add(walletData);
      const walletDoc = await walletRef.get();

      expect(walletDoc.exists).toBe(true);
      expect(walletDoc.data().balance).toBe(0);
      expect(walletDoc.data().status).toBe('active');
    });

    it('should link wallet to user', async () => {
      const walletRef = await db.collection('wallets').add({
        userId: testUser.id,
        balance: 0,
        currency: 'USD',
        status: 'active'
      });

      const walletDoc = await walletRef.get();
      expect(walletDoc.data().userId).toBe(testUser.id);
    });

    it('should support multiple currencies', async () => {
      const currencies = ['USD', 'EUR', 'GBP'];

      for (const currency of currencies) {
        const walletRef = await db.collection('wallets').add({
          userId: testUser.id,
          balance: 0,
          currency,
          status: 'active'
        });

        const walletDoc = await walletRef.get();
        expect(walletDoc.data().currency).toBe(currency);
      }
    });
  });

  describe('Wallet Balance Operations', () => {
    it('should credit wallet balance', async () => {
      const walletRef = await db.collection('wallets').add({
        userId: testUser.id,
        balance: 100,
        currency: 'USD',
        status: 'active'
      });

      await walletRef.update({
        balance: admin.firestore.FieldValue.increment(50),
        totalEarnings: admin.firestore.FieldValue.increment(50)
      });

      const walletDoc = await walletRef.get();
      expect(walletDoc.data().balance).toBe(150);
      expect(walletDoc.data().totalEarnings).toBe(50);
    });

    it('should debit wallet balance', async () => {
      const walletRef = await db.collection('wallets').add({
        userId: testUser.id,
        balance: 100,
        currency: 'USD',
        status: 'active'
      });

      await walletRef.update({
        balance: admin.firestore.FieldValue.increment(-30),
        totalWithdrawals: admin.firestore.FieldValue.increment(30)
      });

      const walletDoc = await walletRef.get();
      expect(walletDoc.data().balance).toBe(70);
      expect(walletDoc.data().totalWithdrawals).toBe(30);
    });

    it('should validate sufficient balance for withdrawal', async () => {
      const walletRef = await db.collection('wallets').add({
        userId: testUser.id,
        balance: 50,
        currency: 'USD',
        status: 'active'
      });

      const walletDoc = await walletRef.get();
      const withdrawAmount = 100;
      const hasSufficientBalance = walletDoc.data().balance >= withdrawAmount;

      expect(hasSufficientBalance).toBe(false);
    });

    it('should calculate available balance', async () => {
      const walletRef = await db.collection('wallets').add({
        userId: testUser.id,
        balance: 1000,
        pendingBalance: 200,
        currency: 'USD',
        status: 'active'
      });

      const walletDoc = await walletRef.get();
      const availableBalance = walletDoc.data().balance - walletDoc.data().pendingBalance;

      expect(availableBalance).toBe(800);
    });
  });

  describe('Wallet Status Management', () => {
    it('should freeze wallet', async () => {
      const walletRef = await db.collection('wallets').add({
        userId: testUser.id,
        balance: 500,
        currency: 'USD',
        status: 'active'
      });

      await walletRef.update({
        status: 'frozen',
        frozenAt: admin.firestore.FieldValue.serverTimestamp(),
        freezeReason: 'Suspicious activity'
      });

      const walletDoc = await walletRef.get();
      expect(walletDoc.data().status).toBe('frozen');
      expect(walletDoc.data().freezeReason).toBe('Suspicious activity');
    });

    it('should unfreeze wallet', async () => {
      const walletRef = await db.collection('wallets').add({
        userId: testUser.id,
        balance: 500,
        currency: 'USD',
        status: 'frozen'
      });

      await walletRef.update({
        status: 'active',
        unfrozenAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const walletDoc = await walletRef.get();
      expect(walletDoc.data().status).toBe('active');
    });

    it('should close wallet', async () => {
      const walletRef = await db.collection('wallets').add({
        userId: testUser.id,
        balance: 0,
        currency: 'USD',
        status: 'active'
      });

      await walletRef.update({
        status: 'closed',
        closedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const walletDoc = await walletRef.get();
      expect(walletDoc.data().status).toBe('closed');
    });
  });

  describe('Wallet Queries', () => {
    beforeAll(async () => {
      await Promise.all([
        db.collection('wallets').add({
          userId: testUser.id,
          balance: 1000,
          currency: 'USD',
          status: 'active'
        }),
        db.collection('wallets').add({
          userId: testUser.id,
          balance: 500,
          currency: 'USD',
          status: 'frozen'
        }),
        db.collection('wallets').add({
          userId: testUser.id,
          balance: 2000,
          currency: 'EUR',
          status: 'active'
        })
      ]);
    });

    it('should query wallets by user', async () => {
      const snapshot = await db.collection('wallets')
        .where('userId', '==', testUser.id)
        .get();

      expect(snapshot.size).toBeGreaterThan(0);
      snapshot.forEach(doc => {
        expect(doc.data().userId).toBe(testUser.id);
      });
    });

    it('should query wallets by status', async () => {
      const snapshot = await db.collection('wallets')
        .where('status', '==', 'active')
        .get();

      expect(snapshot.size).toBeGreaterThan(0);
      snapshot.forEach(doc => {
        expect(doc.data().status).toBe('active');
      });
    });

    it('should query wallets by minimum balance', async () => {
      const minBalance = 500;
      const snapshot = await db.collection('wallets')
        .where('balance', '>=', minBalance)
        .get();

      expect(snapshot.size).toBeGreaterThan(0);
      snapshot.forEach(doc => {
        expect(doc.data().balance).toBeGreaterThanOrEqual(minBalance);
      });
    });

    it('should calculate total balance across all wallets', async () => {
      const snapshot = await db.collection('wallets')
        .where('userId', '==', testUser.id)
        .where('status', '==', 'active')
        .get();

      let totalBalance = 0;
      snapshot.forEach(doc => {
        totalBalance += doc.data().balance;
      });

      expect(totalBalance).toBeGreaterThan(0);
    });
  });
});
