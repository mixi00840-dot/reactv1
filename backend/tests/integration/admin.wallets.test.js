const request = require('supertest');
const admin = require('firebase-admin');
const { generateTestToken, createTestAdmin, createTestUser, clearTestData, waitForFirestore } = require('../helpers/testHelpers');

let app;

describe('Admin Wallets & Transactions API Tests', () => {
  let adminToken;
  let adminUser;
  let testUser;
  let testWallet;
  let testTransaction;

  beforeAll(async () => {
    app = require('../../src/server-simple');
    adminUser = await createTestAdmin();
    adminToken = generateTestToken(adminUser.id, 'admin');
    testUser = await createTestUser();

    // Create test wallet
    const db = admin.firestore();
    const walletRef = await db.collection('wallets').add({
      userId: testUser.id,
      balance: 1000.00,
      currency: 'USD',
      status: 'active',
      totalEarnings: 5000.00,
      totalWithdrawals: 4000.00,
      pendingBalance: 0,
      availableBalance: 1000.00,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    testWallet = { id: walletRef.id, userId: testUser.id };

    // Create test transaction
    const txRef = await db.collection('transactions').add({
      walletId: testWallet.id,
      userId: testUser.id,
      type: 'credit',
      amount: 100.00,
      currency: 'USD',
      status: 'completed',
      description: 'Test credit transaction',
      reference: `REF-${Date.now()}`,
      balanceBefore: 900.00,
      balanceAfter: 1000.00,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    testTransaction = { id: txRef.id };
  });

  afterAll(async () => {
    await clearTestData();
  });

  describe('GET /api/admin/wallets', () => {
    it('should return list of wallets with pagination', async () => {
      const response = await request(app)
        .get('/api/admin/wallets')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('wallets');
      expect(response.body).toHaveProperty('totalWallets');
      expect(Array.isArray(response.body.wallets)).toBe(true);
    });

    it('should filter wallets by status', async () => {
      const response = await request(app)
        .get('/api/admin/wallets')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ status: 'active' });

      expect(response.status).toBe(200);
      response.body.wallets.forEach(wallet => {
        expect(wallet.status).toBe('active');
      });
    });

    it('should filter wallets by minimum balance', async () => {
      const response = await request(app)
        .get('/api/admin/wallets')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ minBalance: 500 });

      expect(response.status).toBe(200);
      response.body.wallets.forEach(wallet => {
        expect(wallet.balance).toBeGreaterThanOrEqual(500);
      });
    });

    it('should search wallets by user', async () => {
      const response = await request(app)
        .get('/api/admin/wallets')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ search: testUser.email });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/admin/wallets/:id', () => {
    it('should return wallet details', async () => {
      const response = await request(app)
        .get(`/api/admin/wallets/${testWallet.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('wallet');
      expect(response.body.wallet.id).toBe(testWallet.id);
      expect(response.body.wallet.balance).toBeDefined();
    });

    it('should include recent transactions', async () => {
      const response = await request(app)
        .get(`/api/admin/wallets/${testWallet.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ includeTransactions: true });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('transactions');
      expect(Array.isArray(response.body.transactions)).toBe(true);
    });
  });

  describe('PUT /api/admin/wallets/:id/adjust', () => {
    it('should adjust wallet balance (credit)', async () => {
      const response = await request(app)
        .put(`/api/admin/wallets/${testWallet.id}/adjust`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 50.00,
          type: 'credit',
          reason: 'Manual adjustment - test credit'
        });

      expect(response.status).toBe(200);

      const db = admin.firestore();
      const walletDoc = await db.collection('wallets').doc(testWallet.id).get();
      expect(walletDoc.data().balance).toBe(1050.00);
    });

    it('should adjust wallet balance (debit)', async () => {
      const response = await request(app)
        .put(`/api/admin/wallets/${testWallet.id}/adjust`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 30.00,
          type: 'debit',
          reason: 'Manual adjustment - test debit'
        });

      expect(response.status).toBe(200);

      const db = admin.firestore();
      const walletDoc = await db.collection('wallets').doc(testWallet.id).get();
      expect(walletDoc.data().balance).toBe(1020.00);
    });

    it('should validate sufficient balance for debit', async () => {
      const response = await request(app)
        .put(`/api/admin/wallets/${testWallet.id}/adjust`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 5000.00,
          type: 'debit',
          reason: 'Exceeds balance'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Insufficient balance');
    });
  });

  describe('PUT /api/admin/wallets/:id/freeze', () => {
    it('should freeze a wallet', async () => {
      const response = await request(app)
        .put(`/api/admin/wallets/${testWallet.id}/freeze`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Suspicious activity' });

      expect(response.status).toBe(200);

      const db = admin.firestore();
      const walletDoc = await db.collection('wallets').doc(testWallet.id).get();
      expect(walletDoc.data().status).toBe('frozen');
      expect(walletDoc.data().freezeReason).toBe('Suspicious activity');
    });
  });

  describe('PUT /api/admin/wallets/:id/unfreeze', () => {
    it('should unfreeze a wallet', async () => {
      // First freeze it
      await request(app)
        .put(`/api/admin/wallets/${testWallet.id}/freeze`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test' });

      // Then unfreeze
      const response = await request(app)
        .put(`/api/admin/wallets/${testWallet.id}/unfreeze`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const db = admin.firestore();
      const walletDoc = await db.collection('wallets').doc(testWallet.id).get();
      expect(walletDoc.data().status).toBe('active');
    });
  });

  describe('GET /api/admin/transactions', () => {
    it('should return list of transactions', async () => {
      const response = await request(app)
        .get('/api/admin/transactions')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('transactions');
      expect(response.body).toHaveProperty('totalTransactions');
      expect(Array.isArray(response.body.transactions)).toBe(true);
    });

    it('should filter by transaction type', async () => {
      const response = await request(app)
        .get('/api/admin/transactions')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ type: 'credit' });

      expect(response.status).toBe(200);
      response.body.transactions.forEach(tx => {
        expect(tx.type).toBe('credit');
      });
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/admin/transactions')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ status: 'completed' });

      expect(response.status).toBe(200);
      response.body.transactions.forEach(tx => {
        expect(tx.status).toBe('completed');
      });
    });

    it('should filter by date range', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get('/api/admin/transactions')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ startDate, endDate });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/admin/transactions/:id', () => {
    it('should return transaction details', async () => {
      const response = await request(app)
        .get(`/api/admin/transactions/${testTransaction.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('transaction');
      expect(response.body.transaction.id).toBe(testTransaction.id);
    });
  });

  describe('GET /api/admin/wallets/stats', () => {
    it('should return wallet statistics', async () => {
      const response = await request(app)
        .get('/api/admin/wallets/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalWallets');
      expect(response.body).toHaveProperty('activeWallets');
      expect(response.body).toHaveProperty('frozenWallets');
      expect(response.body).toHaveProperty('totalBalance');
      expect(response.body).toHaveProperty('totalEarnings');
      expect(response.body).toHaveProperty('totalWithdrawals');
    });
  });

  describe('GET /api/admin/transactions/stats', () => {
    it('should return transaction statistics', async () => {
      const response = await request(app)
        .get('/api/admin/transactions/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalTransactions');
      expect(response.body).toHaveProperty('completedTransactions');
      expect(response.body).toHaveProperty('pendingTransactions');
      expect(response.body).toHaveProperty('totalVolume');
      expect(response.body).toHaveProperty('creditVolume');
      expect(response.body).toHaveProperty('debitVolume');
    });
  });
});
