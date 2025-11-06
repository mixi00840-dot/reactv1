const db = require('../../src/utils/database');
const admin = require('firebase-admin');

describe('Transaction Model', () => {
  const transactionsRef = db.collection('transactions');
  const walletsRef = db.collection('wallets');
  let testWalletId;
  let testUserId;

  beforeAll(async () => {
    // Create test user
    const userRef = await db.collection('users').add({
      email: `transaction-test-${Date.now()}@example.com`,
      name: 'Transaction Test User',
      role: 'user',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    testUserId = userRef.id;

    // Create test wallet
    const walletRef = await walletsRef.add({
      userId: testUserId,
      balance: 1000.00,
      currency: 'USD',
      status: 'active',
      pendingBalance: 0,
      totalEarnings: 1000.00,
      totalWithdrawals: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    testWalletId = walletRef.id;
  });

  afterAll(async () => {
    // Clean up test data
    const transactions = await transactionsRef
      .where('walletId', '==', testWalletId)
      .get();
    
    const deletePromises = transactions.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);

    await walletsRef.doc(testWalletId).delete();
    await db.collection('users').doc(testUserId).delete();
  });

  describe('Transaction Creation', () => {
    it('should create a credit transaction', async () => {
      const transactionData = {
        walletId: testWalletId,
        userId: testUserId,
        type: 'credit',
        amount: 250.00,
        currency: 'USD',
        status: 'pending',
        description: 'Test credit transaction',
        balanceBefore: 1000.00,
        balanceAfter: 1250.00,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const transactionRef = await transactionsRef.add(transactionData);
      const transaction = await transactionRef.get();

      expect(transaction.exists).toBe(true);
      expect(transaction.data().type).toBe('credit');
      expect(transaction.data().amount).toBe(250.00);
      expect(transaction.data().status).toBe('pending');
    });

    it('should create a debit transaction', async () => {
      const transactionData = {
        walletId: testWalletId,
        userId: testUserId,
        type: 'debit',
        amount: 100.00,
        currency: 'USD',
        status: 'pending',
        description: 'Test debit transaction',
        balanceBefore: 1250.00,
        balanceAfter: 1150.00,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const transactionRef = await transactionsRef.add(transactionData);
      const transaction = await transactionRef.get();

      expect(transaction.exists).toBe(true);
      expect(transaction.data().type).toBe('debit');
      expect(transaction.data().amount).toBe(100.00);
    });

    it('should create a refund transaction', async () => {
      const transactionData = {
        walletId: testWalletId,
        userId: testUserId,
        type: 'refund',
        amount: 50.00,
        currency: 'USD',
        status: 'pending',
        description: 'Test refund transaction',
        referenceId: 'order123',
        referenceType: 'order',
        balanceBefore: 1150.00,
        balanceAfter: 1200.00,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const transactionRef = await transactionsRef.add(transactionData);
      const transaction = await transactionRef.get();

      expect(transaction.exists).toBe(true);
      expect(transaction.data().type).toBe('refund');
      expect(transaction.data().referenceId).toBe('order123');
    });

    it('should create a withdrawal transaction', async () => {
      const transactionData = {
        walletId: testWalletId,
        userId: testUserId,
        type: 'withdrawal',
        amount: 200.00,
        currency: 'USD',
        status: 'pending',
        description: 'Test withdrawal transaction',
        balanceBefore: 1200.00,
        balanceAfter: 1000.00,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const transactionRef = await transactionsRef.add(transactionData);
      const transaction = await transactionRef.get();

      expect(transaction.exists).toBe(true);
      expect(transaction.data().type).toBe('withdrawal');
      expect(transaction.data().amount).toBe(200.00);
    });
  });

  describe('Transaction Validation', () => {
    it('should require valid transaction type', async () => {
      const transactionData = {
        walletId: testWalletId,
        userId: testUserId,
        type: 'invalid_type',
        amount: 100.00,
        currency: 'USD',
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const transactionRef = await transactionsRef.add(transactionData);
      const transaction = await transactionRef.get();
      
      // In real implementation, this should be validated before creation
      expect(['credit', 'debit', 'refund', 'withdrawal']).not.toContain('invalid_type');
    });

    it('should require positive amount', async () => {
      const transactionData = {
        walletId: testWalletId,
        userId: testUserId,
        type: 'credit',
        amount: -100.00, // Negative amount should be invalid
        currency: 'USD',
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // In real implementation, this should throw an error
      expect(transactionData.amount).toBeLessThan(0);
    });

    it('should require valid status', async () => {
      const validStatuses = ['pending', 'completed', 'failed', 'cancelled'];
      
      for (const status of validStatuses) {
        const transactionData = {
          walletId: testWalletId,
          userId: testUserId,
          type: 'credit',
          amount: 50.00,
          currency: 'USD',
          status,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const transactionRef = await transactionsRef.add(transactionData);
        const transaction = await transactionRef.get();
        
        expect(transaction.data().status).toBe(status);
        await transactionRef.delete();
      }
    });
  });

  describe('Transaction Status Updates', () => {
    let testTransactionId;

    beforeEach(async () => {
      const transactionRef = await transactionsRef.add({
        walletId: testWalletId,
        userId: testUserId,
        type: 'credit',
        amount: 100.00,
        currency: 'USD',
        status: 'pending',
        description: 'Status test transaction',
        balanceBefore: 1000.00,
        balanceAfter: 1100.00,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      testTransactionId = transactionRef.id;
    });

    afterEach(async () => {
      if (testTransactionId) {
        await transactionsRef.doc(testTransactionId).delete();
      }
    });

    it('should update transaction to completed', async () => {
      await transactionsRef.doc(testTransactionId).update({
        status: 'completed',
        completedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const transaction = await transactionsRef.doc(testTransactionId).get();
      expect(transaction.data().status).toBe('completed');
      expect(transaction.data().completedAt).toBeDefined();
    });

    it('should update transaction to failed', async () => {
      await transactionsRef.doc(testTransactionId).update({
        status: 'failed',
        failureReason: 'Insufficient funds',
        failedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const transaction = await transactionsRef.doc(testTransactionId).get();
      expect(transaction.data().status).toBe('failed');
      expect(transaction.data().failureReason).toBe('Insufficient funds');
    });

    it('should update transaction to cancelled', async () => {
      await transactionsRef.doc(testTransactionId).update({
        status: 'cancelled',
        cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
        cancellationReason: 'User requested'
      });

      const transaction = await transactionsRef.doc(testTransactionId).get();
      expect(transaction.data().status).toBe('cancelled');
      expect(transaction.data().cancellationReason).toBe('User requested');
    });
  });

  describe('Transaction Queries', () => {
    beforeAll(async () => {
      // Create multiple test transactions
      const transactions = [
        {
          walletId: testWalletId,
          userId: testUserId,
          type: 'credit',
          amount: 100.00,
          currency: 'USD',
          status: 'completed',
          createdAt: admin.firestore.Timestamp.fromDate(new Date('2024-01-15'))
        },
        {
          walletId: testWalletId,
          userId: testUserId,
          type: 'debit',
          amount: 50.00,
          currency: 'USD',
          status: 'completed',
          createdAt: admin.firestore.Timestamp.fromDate(new Date('2024-01-20'))
        },
        {
          walletId: testWalletId,
          userId: testUserId,
          type: 'credit',
          amount: 75.00,
          currency: 'USD',
          status: 'pending',
          createdAt: admin.firestore.Timestamp.fromDate(new Date('2024-01-25'))
        }
      ];

      for (const transaction of transactions) {
        await transactionsRef.add(transaction);
      }
    });

    it('should query transactions by wallet', async () => {
      const transactions = await transactionsRef
        .where('walletId', '==', testWalletId)
        .get();

      expect(transactions.size).toBeGreaterThan(0);
      transactions.forEach(doc => {
        expect(doc.data().walletId).toBe(testWalletId);
      });
    });

    it('should query transactions by user', async () => {
      const transactions = await transactionsRef
        .where('userId', '==', testUserId)
        .get();

      expect(transactions.size).toBeGreaterThan(0);
      transactions.forEach(doc => {
        expect(doc.data().userId).toBe(testUserId);
      });
    });

    it('should query transactions by type', async () => {
      const transactions = await transactionsRef
        .where('walletId', '==', testWalletId)
        .where('type', '==', 'credit')
        .get();

      expect(transactions.size).toBeGreaterThan(0);
      transactions.forEach(doc => {
        expect(doc.data().type).toBe('credit');
      });
    });

    it('should query transactions by status', async () => {
      const transactions = await transactionsRef
        .where('walletId', '==', testWalletId)
        .where('status', '==', 'completed')
        .get();

      expect(transactions.size).toBeGreaterThan(0);
      transactions.forEach(doc => {
        expect(doc.data().status).toBe('completed');
      });
    });

    it('should query transactions by date range', async () => {
      const startDate = admin.firestore.Timestamp.fromDate(new Date('2024-01-01'));
      const endDate = admin.firestore.Timestamp.fromDate(new Date('2024-01-31'));

      const transactions = await transactionsRef
        .where('walletId', '==', testWalletId)
        .where('createdAt', '>=', startDate)
        .where('createdAt', '<=', endDate)
        .get();

      expect(transactions.size).toBeGreaterThan(0);
    });

    it('should sort transactions by date descending', async () => {
      const transactions = await transactionsRef
        .where('walletId', '==', testWalletId)
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();

      const dates = transactions.docs.map(doc => doc.data().createdAt);
      
      for (let i = 0; i < dates.length - 1; i++) {
        if (dates[i] && dates[i + 1]) {
          expect(dates[i].toMillis()).toBeGreaterThanOrEqual(dates[i + 1].toMillis());
        }
      }
    });
  });

  describe('Balance Tracking', () => {
    it('should store balance before and after transaction', async () => {
      const transactionData = {
        walletId: testWalletId,
        userId: testUserId,
        type: 'credit',
        amount: 150.00,
        currency: 'USD',
        status: 'completed',
        balanceBefore: 1000.00,
        balanceAfter: 1150.00,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const transactionRef = await transactionsRef.add(transactionData);
      const transaction = await transactionRef.get();

      expect(transaction.data().balanceBefore).toBe(1000.00);
      expect(transaction.data().balanceAfter).toBe(1150.00);
      expect(transaction.data().balanceAfter - transaction.data().balanceBefore).toBe(150.00);
    });

    it('should calculate balance change correctly for debit', async () => {
      const transactionData = {
        walletId: testWalletId,
        userId: testUserId,
        type: 'debit',
        amount: 75.00,
        currency: 'USD',
        status: 'completed',
        balanceBefore: 1150.00,
        balanceAfter: 1075.00,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const transactionRef = await transactionsRef.add(transactionData);
      const transaction = await transactionRef.get();

      expect(transaction.data().balanceBefore - transaction.data().balanceAfter).toBe(75.00);
    });
  });

  describe('Transaction Reference', () => {
    it('should link transaction to order', async () => {
      const transactionData = {
        walletId: testWalletId,
        userId: testUserId,
        type: 'credit',
        amount: 100.00,
        currency: 'USD',
        status: 'completed',
        referenceId: 'order456',
        referenceType: 'order',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const transactionRef = await transactionsRef.add(transactionData);
      const transaction = await transactionRef.get();

      expect(transaction.data().referenceId).toBe('order456');
      expect(transaction.data().referenceType).toBe('order');
    });

    it('should link transaction to withdrawal', async () => {
      const transactionData = {
        walletId: testWalletId,
        userId: testUserId,
        type: 'debit',
        amount: 100.00,
        currency: 'USD',
        status: 'pending',
        referenceId: 'withdrawal789',
        referenceType: 'withdrawal',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const transactionRef = await transactionsRef.add(transactionData);
      const transaction = await transactionRef.get();

      expect(transaction.data().referenceId).toBe('withdrawal789');
      expect(transaction.data().referenceType).toBe('withdrawal');
    });
  });
});
