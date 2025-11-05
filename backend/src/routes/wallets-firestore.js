const express = require('express');
const router = express.Router();
const { verifyFirebaseToken, requireAdmin } = require('../middleware/firebaseAuth');
const walletsHelpers = require('../utils/walletsHelpers');

/**
 * Wallets Routes - Firestore Implementation
 */

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Wallets API is operational (Firestore)' });
});

// Get wallet overview (root endpoint - requires auth)
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    // If admin, return all wallets; otherwise return user's wallet
    if (req.user.role === 'admin') {
      const { limit = 100, status, minBalance } = req.query;
      const wallets = await walletsHelpers.getAllWallets({
        limit: parseInt(limit),
        status,
        minBalance: minBalance ? parseFloat(minBalance) : undefined
      });
      return res.json({ success: true, data: { wallets, count: wallets.length } });
    } else {
      const wallet = await walletsHelpers.getWalletByUserId(req.user.id || req.user.uid);
      return res.json({ success: true, data: { wallet } });
    }
  } catch (error) {
    console.error('Error getting wallets:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get wallet statistics (Admin)
router.get('/stats', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const stats = await walletsHelpers.getWalletsStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error getting wallets stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get current user's wallet
router.get('/me', verifyFirebaseToken, async (req, res) => {
  try {
    const wallet = await walletsHelpers.getWalletByUserId(req.user.id || req.user.uid);
    res.json({ success: true, data: { wallet } });
  } catch (error) {
    console.error('Error getting wallet:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get current user's wallet balance
router.get('/balance', verifyFirebaseToken, async (req, res) => {
  try {
    const wallet = await walletsHelpers.getWalletByUserId(req.user.id || req.user.uid);
    res.json({ 
      success: true, 
      data: { 
        balance: wallet.balance || 0,
        currency: wallet.currency || 'USD'
      } 
    });
  } catch (error) {
    console.error('Error getting balance:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get current user's transactions
router.get('/transactions', verifyFirebaseToken, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const transactions = await walletsHelpers.getTransactions(req.user.id || req.user.uid, { limit: parseInt(limit) });
    res.json({ success: true, data: { transactions } });
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user wallet by ID (Admin)
router.get('/:userId', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const wallet = await walletsHelpers.getWalletByUserId(userId);
    res.json({ success: true, data: { wallet } });
  } catch (error) {
    console.error('Error getting user wallet:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add funds to user wallet (Admin)
router.post('/:userId/deposit', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, description, source } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    
    const result = await walletsHelpers.addFunds(userId, amount, { description, source });
    res.json({ success: true, data: result, message: 'Funds added successfully' });
  } catch (error) {
    console.error('Error adding funds:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Deduct funds from user wallet (Admin)
router.post('/:userId/deduct', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, description, destination } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    
    const result = await walletsHelpers.deductFunds(userId, amount, { description, destination });
    res.json({ success: true, data: result, message: 'Funds deducted successfully' });
  } catch (error) {
    console.error('Error deducting funds:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create withdrawal request
router.post('/withdraw', verifyFirebaseToken, async (req, res) => {
  try {
    const { amount, method, accountDetails } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    
    const result = await walletsHelpers.createWithdrawalRequest(req.user.id || req.user.uid, amount, {
      method,
      accountDetails
    });
    res.json({ success: true, data: result, message: 'Withdrawal request created' });
  } catch (error) {
    console.error('Error creating withdrawal:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Process withdrawal (Admin)
router.post('/withdrawals/:withdrawalId/process', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { status, adminNotes } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    
    await walletsHelpers.processWithdrawal(withdrawalId, status, adminNotes);
    res.json({ success: true, message: `Withdrawal ${status}` });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Transfer funds between users
router.post('/transfer', verifyFirebaseToken, async (req, res) => {
  try {
    const { toUserId, amount, description } = req.body;
    
    if (!toUserId || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid transfer details' });
    }
    
    const result = await walletsHelpers.transferFunds(req.user.id || req.user.uid, toUserId, amount, description);
    res.json({ success: true, data: result, message: 'Transfer successful' });
  } catch (error) {
    console.error('Error transferring funds:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
