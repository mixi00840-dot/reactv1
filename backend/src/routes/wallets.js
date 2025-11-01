const express = require('express');
const router = express.Router();
const { Wallet, WalletTransaction } = require('../models/Wallet');
const { Transaction } = require('../models/Transaction');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// @route   GET /api/wallets
// @desc    Get current user's wallet info
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.user._id });

    if (!wallet) {
      // Create wallet if it doesn't exist
      wallet = new Wallet({ 
        userId: req.user._id,
        balance: 0,
        currency: 'USD'
      });
      await wallet.save();
    }

    res.json({
      success: true,
      data: {
        wallet
      }
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching wallet'
    });
  }
});

// @route   GET /api/wallets/balance
// @desc    Get current user's wallet balance
// @access  Private
router.get('/balance', authMiddleware, async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user._id });

    if (!wallet) {
      // Create wallet if it doesn't exist
      const newWallet = new Wallet({ userId: req.user._id });
      await newWallet.save();
      
      return res.json({
        success: true,
        data: {
          balance: 0,
          currency: 'USD'
        }
      });
    }

    res.json({
      success: true,
      data: {
        balance: wallet.balance || 0,
        currency: wallet.currency || 'USD'
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

// @route   GET /api/wallets/transactions/all
// @desc    Get all transactions (admin only)
// @access  Admin
router.get('/transactions/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 50, type } = req.query;

    const query = {};
    if (type) query.type = type;

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((page - 1) * limit)
      .populate('userId', 'username fullName avatar');

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions'
    });
  }
});

// @route   GET /api/wallets/:userId
// @desc    Get user wallet
// @access  Private (user/admin)
router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    // Check if user can access this wallet
    if (req.user.id !== req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this wallet'
      });
    }

    const wallet = await Wallet.findOne({ userId: req.params.userId })
      .populate('userId', 'username fullName avatar');

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
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

// @route   GET /api/wallets/:userId/transactions
// @desc    Get wallet transactions
// @access  Private (user/admin)
router.get('/:userId/transactions', authMiddleware, async (req, res) => {
  try {
    // Check if user can access these transactions
    if (req.user.id !== req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access these transactions'
      });
    }

    const {
      page = 1,
      limit = 20,
      type
    } = req.query;

    const query = { userId: req.params.userId };
    if (type) query.type = type;

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          page: parseInt(page),
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

// @route   GET /api/wallets/:userId/balance
// @desc    Get wallet balance
// @access  Private (user/admin)
router.get('/:userId/balance', authMiddleware, async (req, res) => {
  try {
    // Check if user can access this balance
    if (req.user.id !== req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const wallet = await Wallet.findOne({ userId: req.params.userId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    res.json({
      success: true,
      data: {
        balance: wallet.balance,
        currency: wallet.currency || 'USD'
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

// @route   POST /api/wallets/:userId/deposit
// @desc    Deposit to wallet
// @access  Admin only
router.post('/:userId/deposit', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    const wallet = await Wallet.findOne({ userId: req.params.userId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    wallet.balance += amount;
    await wallet.save();

    // Create transaction record
    const transaction = new Transaction({
      userId: req.params.userId,
      type: 'deposit',
      amount,
      description: description || 'Admin deposit',
      status: 'completed'
    });
    await transaction.save();

    res.json({
      success: true,
      data: { wallet, transaction },
      message: 'Deposit successful'
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing deposit'
    });
  }
});

// @route   POST /api/wallets/:userId/withdraw
// @desc    Withdraw from wallet
// @access  Private (user) or Admin
router.post('/:userId/withdraw', authMiddleware, async (req, res) => {
  try {
    // Check if user can withdraw from this wallet
    if (req.user.id !== req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const { amount, paymentMethod } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    const wallet = await Wallet.findOne({ userId: req.params.userId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    wallet.balance -= amount;
    await wallet.save();

    // Create transaction record
    const transaction = new Transaction({
      userId: req.params.userId,
      type: 'withdrawal',
      amount,
      paymentMethod: paymentMethod || 'bank_transfer',
      status: 'pending',
      description: 'Withdrawal request'
    });
    await transaction.save();

    res.json({
      success: true,
      data: { wallet, transaction },
      message: 'Withdrawal request submitted'
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing withdrawal'
    });
  }
});

module.exports = router;
