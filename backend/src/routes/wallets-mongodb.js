const express = require('express');
const router = express.Router();
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const { verifyJWT, requireAdmin } = require('../middleware/jwtAuth');

/**
 * Wallets Routes - MongoDB Implementation
 */

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Wallets API is working (MongoDB)',
    database: 'MongoDB'
  });
});

/**
 * @route   GET /api/wallets/:userId
 * @desc    Get user wallet
 * @access  Private (Wallet owner or Admin)
 */
router.get('/:userId', verifyJWT, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check permission
    if (userId !== req.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    let wallet = await Wallet.findOne({ userId });

    // Auto-create wallet if doesn't exist
    if (!wallet) {
      wallet = new Wallet({ userId });
      await wallet.save();
    }

    res.json({
      success: true,
      data: { wallet }
    });

  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching wallet'
    });
  }
});

/**
 * @route   GET /api/wallets/:userId/balance
 * @desc    Get wallet balance
 * @access  Private (Wallet owner or Admin)
 */
router.get('/:userId/balance', verifyJWT, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check permission
    if (userId !== req.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const wallet = await Wallet.findOne({ userId });

    res.json({
      success: true,
      data: {
        balance: wallet?.balance || 0,
        currency: wallet?.currency || 'USD'
      }
    });

  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching balance'
    });
  }
});

/**
 * @route   GET /api/wallets/:userId/transactions
 * @desc    Get wallet transactions
 * @access  Private (Wallet owner or Admin)
 */
router.get('/:userId/transactions', verifyJWT, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50, type, status } = req.query;

    // Check permission
    if (userId !== req.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const transactions = await Transaction.getUserTransactions(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      status
    });

    const total = await Transaction.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions'
    });
  }
});

/**
 * @route   POST /api/wallets/:userId/add-funds
 * @desc    Add funds to wallet
 * @access  Admin only (in production, this would be via payment gateway)
 */
router.post('/:userId/add-funds', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be positive'
      });
    }

    let wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      wallet = new Wallet({ userId });
      await wallet.save();
    }

    await wallet.addFunds(amount, description || 'Funds added by admin');

    res.json({
      success: true,
      data: { wallet },
      message: 'Funds added successfully'
    });

  } catch (error) {
    console.error('Add funds error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding funds',
      error: error.message
    });
  }
});

module.exports = router;
