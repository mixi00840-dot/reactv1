const express = require('express');
const router = express.Router();
const db = require('../../utils/database');
const admin = require('firebase-admin');

// GET /api/admin/wallets - List all wallets
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      minBalance,
      maxBalance,
      search 
    } = req.query;

    let query = db.collection('wallets');

    // Filter by status
    if (status) {
      query = query.where('status', '==', status);
    }

    // Filter by balance range
    if (minBalance) {
      query = query.where('balance', '>=', parseFloat(minBalance));
    }
    if (maxBalance) {
      query = query.where('balance', '<=', parseFloat(maxBalance));
    }

    // Get all matching wallets
    const walletsSnapshot = await query.get();

    let wallets = [];
    for (const doc of walletsSnapshot.docs) {
      const walletData = { id: doc.id, ...doc.data() };
      
      // Get user details
      if (walletData.userId) {
        const userDoc = await db.collection('users').doc(walletData.userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          walletData.userName = userData.name || userData.displayName || 'Unknown';
          walletData.userEmail = userData.email;
        }
      }

      // Convert timestamps
      if (walletData.createdAt) {
        walletData.createdAt = walletData.createdAt.toDate().toISOString();
      }
      if (walletData.updatedAt) {
        walletData.updatedAt = walletData.updatedAt.toDate().toISOString();
      }

      // Calculate available balance
      walletData.availableBalance = walletData.balance - (walletData.pendingBalance || 0);

      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch = 
          (walletData.userName && walletData.userName.toLowerCase().includes(searchLower)) ||
          (walletData.userEmail && walletData.userEmail.toLowerCase().includes(searchLower));
        
        if (matchesSearch) {
          wallets.push(walletData);
        }
      } else {
        wallets.push(walletData);
      }
    }

    // Calculate total balance
    const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);

    // Pagination
    const totalWallets = wallets.length;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const paginatedWallets = wallets.slice(offset, offset + parseInt(limit));

    res.json({
      wallets: paginatedWallets,
      totalWallets,
      totalBalance,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalWallets / parseInt(limit))
    });
  } catch (error) {
    console.error('Get wallets error:', error);
    res.status(500).json({ error: 'Failed to fetch wallets' });
  }
});

// GET /api/admin/wallets/stats - Get wallet statistics
router.get('/stats', async (req, res) => {
  try {
    const walletsSnapshot = await db.collection('wallets').get();

    let totalBalance = 0;
    let totalPending = 0;
    let activeWallets = 0;
    let frozenWallets = 0;

    walletsSnapshot.forEach(doc => {
      const data = doc.data();
      totalBalance += data.balance || 0;
      totalPending += data.pendingBalance || 0;
      
      if (data.status === 'active') activeWallets++;
      if (data.status === 'frozen') frozenWallets++;
    });

    res.json({
      totalWallets: walletsSnapshot.size,
      totalBalance,
      totalPending,
      availableBalance: totalBalance - totalPending,
      activeWallets,
      frozenWallets
    });
  } catch (error) {
    console.error('Get wallet stats error:', error);
    res.status(500).json({ error: 'Failed to fetch wallet statistics' });
  }
});

// GET /api/admin/wallets/transactions - List all transactions
router.get('/transactions', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      type, 
      status,
      walletId,
      userId,
      startDate,
      endDate
    } = req.query;

    let query = db.collection('transactions');

    // Filters
    if (type) query = query.where('type', '==', type);
    if (status) query = query.where('status', '==', status);
    if (walletId) query = query.where('walletId', '==', walletId);
    if (userId) query = query.where('userId', '==', userId);

    // Date range filter
    if (startDate) {
      query = query.where('createdAt', '>=', admin.firestore.Timestamp.fromDate(new Date(startDate)));
    }
    if (endDate) {
      query = query.where('createdAt', '<=', admin.firestore.Timestamp.fromDate(new Date(endDate)));
    }

    // Order by date
    query = query.orderBy('createdAt', 'desc');

    // Get total count
    const totalSnapshot = await query.get();
    const totalTransactions = totalSnapshot.size;

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const transactionsSnapshot = await query.limit(parseInt(limit)).offset(offset).get();

    const transactions = [];
    for (const doc of transactionsSnapshot.docs) {
      const txData = { id: doc.id, ...doc.data() };
      
      // Get user details
      if (txData.userId) {
        const userDoc = await db.collection('users').doc(txData.userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          txData.userName = userData.name || userData.displayName;
          txData.userEmail = userData.email;
        }
      }

      // Convert timestamps
      ['createdAt', 'completedAt', 'failedAt', 'cancelledAt'].forEach(field => {
        if (txData[field]) {
          txData[field] = txData[field].toDate().toISOString();
        }
      });

      transactions.push(txData);
    }

    res.json({
      transactions,
      totalTransactions,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalTransactions / parseInt(limit))
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// GET /api/admin/wallets/transactions/stats - Get transaction statistics
router.get('/transactions/stats', async (req, res) => {
  try {
    const transactionsSnapshot = await db.collection('transactions').get();

    let totalVolume = 0;
    let completedCount = 0;
    let pendingCount = 0;
    let failedCount = 0;
    const typeBreakdown = {};

    transactionsSnapshot.forEach(doc => {
      const data = doc.data();
      totalVolume += data.amount || 0;
      
      if (data.status === 'completed') completedCount++;
      if (data.status === 'pending') pendingCount++;
      if (data.status === 'failed') failedCount++;

      const type = data.type || 'unknown';
      typeBreakdown[type] = (typeBreakdown[type] || 0) + 1;
    });

    res.json({
      totalTransactions: transactionsSnapshot.size,
      totalVolume,
      completedCount,
      pendingCount,
      failedCount,
      typeBreakdown
    });
  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction statistics' });
  }
});

// GET /api/admin/wallets/:id - Get wallet details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const walletDoc = await db.collection('wallets').doc(id).get();

    if (!walletDoc.exists) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    const walletData = { id: walletDoc.id, ...walletDoc.data() };

    // Get user details
    if (walletData.userId) {
      const userDoc = await db.collection('users').doc(walletData.userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        walletData.user = {
          id: userDoc.id,
          name: userData.name || userData.displayName,
          email: userData.email
        };
      }
    }

    // Get recent transactions
    const transactionsSnapshot = await db.collection('transactions')
      .where('walletId', '==', id)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    walletData.recentTransactions = transactionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString()
    }));

    // Convert timestamps
    if (walletData.createdAt) {
      walletData.createdAt = walletData.createdAt.toDate().toISOString();
    }
    if (walletData.updatedAt) {
      walletData.updatedAt = walletData.updatedAt.toDate().toISOString();
    }

    // Calculate available balance
    walletData.availableBalance = walletData.balance - (walletData.pendingBalance || 0);

    res.json({ wallet: walletData });
  } catch (error) {
    console.error('Get wallet details error:', error);
    res.status(500).json({ error: 'Failed to fetch wallet details' });
  }
});

// PUT /api/admin/wallets/:id/adjust - Adjust wallet balance
router.put('/:id/adjust', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, type, reason } = req.body;

    if (!amount || !type) {
      return res.status(400).json({ error: 'Amount and type are required' });
    }

    const adjustAmount = parseFloat(amount);
    if (isNaN(adjustAmount) || adjustAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!['credit', 'debit'].includes(type)) {
      return res.status(400).json({ error: 'Type must be credit or debit' });
    }

    const walletRef = db.collection('wallets').doc(id);
    const walletDoc = await walletRef.get();

    if (!walletDoc.exists) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    const walletData = walletDoc.data();
    const currentBalance = walletData.balance || 0;

    // For debit, check sufficient balance
    if (type === 'debit' && currentBalance < adjustAmount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Update balance
    const balanceChange = type === 'credit' ? adjustAmount : -adjustAmount;
    await walletRef.update({
      balance: admin.firestore.FieldValue.increment(balanceChange),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create transaction record
    await db.collection('transactions').add({
      walletId: id,
      userId: walletData.userId,
      type,
      amount: adjustAmount,
      currency: walletData.currency || 'USD',
      status: 'completed',
      description: reason || `Admin ${type}`,
      balanceBefore: currentBalance,
      balanceAfter: currentBalance + balanceChange,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      completedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ 
      message: 'Balance adjusted successfully',
      newBalance: currentBalance + balanceChange
    });
  } catch (error) {
    console.error('Adjust balance error:', error);
    res.status(500).json({ error: 'Failed to adjust balance' });
  }
});

// PUT /api/admin/wallets/:id/freeze - Freeze a wallet
router.put('/:id/freeze', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const walletRef = db.collection('wallets').doc(id);
    const walletDoc = await walletRef.get();

    if (!walletDoc.exists) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    await walletRef.update({
      status: 'frozen',
      freezeReason: reason || 'Frozen by admin',
      frozenAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Wallet frozen successfully' });
  } catch (error) {
    console.error('Freeze wallet error:', error);
    res.status(500).json({ error: 'Failed to freeze wallet' });
  }
});

// PUT /api/admin/wallets/:id/unfreeze - Unfreeze a wallet
router.put('/:id/unfreeze', async (req, res) => {
  try {
    const { id } = req.params;

    const walletRef = db.collection('wallets').doc(id);
    const walletDoc = await walletRef.get();

    if (!walletDoc.exists) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    await walletRef.update({
      status: 'active',
      freezeReason: admin.firestore.FieldValue.delete(),
      frozenAt: admin.firestore.FieldValue.delete(),
      unfrozenAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Wallet unfrozen successfully' });
  } catch (error) {
    console.error('Unfreeze wallet error:', error);
    res.status(500).json({ error: 'Failed to unfreeze wallet' });
  }
});

module.exports = router;
