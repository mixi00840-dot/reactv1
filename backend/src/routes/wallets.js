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

// ==================== ADMIN ENDPOINTS ====================
const { requireAdmin: requireAdminMiddleware } = require('../middleware/adminMiddleware');

/**
 * @route   GET /api/wallets/admin/all
 * @desc    Get all wallets (Admin)
 * @access  Admin
 */
router.get('/admin/all', verifyJWT, requireAdminMiddleware, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search,
      minBalance,
      maxBalance
    } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    
    if (minBalance !== undefined) {
      query.balance = { $gte: parseFloat(minBalance) };
    }
    if (maxBalance !== undefined) {
      query.balance = { ...query.balance, $lte: parseFloat(maxBalance) };
    }

    const wallets = await Wallet.find(query)
      .populate('userId', 'username email avatar isVerified')
      .sort({ balance: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await Wallet.countDocuments(query);

    res.json({
      success: true,
      data: {
        wallets,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all wallets error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching wallets'
    });
  }
});

/**
 * @route   GET /api/wallets/admin/stats
 * @desc    Get wallet statistics (Admin)
 * @access  Admin
 */
router.get('/admin/stats', verifyJWT, requireAdminMiddleware, async (req, res) => {
  try {
    const [
      totalWallets,
      totalBalanceData,
      totalDepositsData,
      totalWithdrawalsData
    ] = await Promise.all([
      Wallet.countDocuments(),
      Wallet.aggregate([
        { $group: { _id: null, total: { $sum: '$balance' } } }
      ]),
      Wallet.aggregate([
        { $group: { _id: null, total: { $sum: '$totalDeposits' } } }
      ]),
      Wallet.aggregate([
        { $group: { _id: null, total: { $sum: '$totalWithdrawals' } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalWallets,
        totalBalance: totalBalanceData[0]?.total || 0,
        totalDeposits: totalDepositsData[0]?.total || 0,
        totalWithdrawals: totalWithdrawalsData[0]?.total || 0
      }
    });

  } catch (error) {
    console.error('Get wallet stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching wallet statistics'
    });
  }
});

/**
 * @route   POST /api/wallets/admin/:userId/adjust
 * @desc    Adjust wallet balance (Admin)
 * @access  Admin
 */
router.post('/admin/:userId/adjust', verifyJWT, requireAdminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, reason, type } = req.body;

    if (!amount || amount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount is required'
      });
    }

    let wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      wallet = new Wallet({ userId });
      await wallet.save();
    }

    if (type === 'add' || amount > 0) {
      await wallet.addFunds(Math.abs(amount), reason || 'Balance adjustment by admin');
    } else {
      await wallet.deductFunds(Math.abs(amount), reason || 'Balance adjustment by admin');
    }

    res.json({
      success: true,
      data: { wallet },
      message: 'Balance adjusted successfully'
    });

  } catch (error) {
    console.error('Adjust balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adjusting balance',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/wallets/admin/:userId
 * @desc    Get user wallet details (Admin)
 * @access  Admin
 */
router.get('/admin/:userId', verifyJWT, requireAdminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    let wallet = await Wallet.findOne({ userId })
      .populate('userId', 'username email avatar phone isVerified');

    if (!wallet) {
      wallet = new Wallet({ userId });
      await wallet.save();
    }

    res.json({
      success: true,
      data: { wallet }
    });

  } catch (error) {
    console.error('Get wallet details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching wallet details'
    });
  }
});

module.exports = router;
