const { Wallet, WalletTransaction } = require('../models/Wallet');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

class WalletController {
  // Get wallet details with comprehensive information
  async getWalletDetails(req, res) {
    try {
      const userId = req.user.role === 'admin' && req.query.userId 
        ? req.query.userId 
        : req.user._id;

      const wallet = await Wallet.findByUser(userId);
      
      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found'
        });
      }

      // Get recent transactions
      const recentTransactions = await WalletTransaction.find({ walletId: wallet._id })
        .sort('-createdAt')
        .limit(20)
        .populate('relatedUserId', 'firstName lastName avatar')
        .populate('processedBy', 'firstName lastName')
        .lean();

      // Get monthly statistics
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Current month stats
      const currentMonthStats = await WalletTransaction.aggregate([
        {
          $match: {
            walletId: wallet._id,
            createdAt: { $gte: startOfMonth },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      // Last month stats for comparison
      const lastMonthStats = await WalletTransaction.aggregate([
        {
          $match: {
            walletId: wallet._id,
            createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      // Transaction trends (last 12 months)
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const monthlyTrends = await WalletTransaction.aggregate([
        {
          $match: {
            walletId: wallet._id,
            createdAt: { $gte: twelveMonthsAgo },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              type: '$type'
            },
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]);

      res.json({
        success: true,
        data: {
          wallet,
          recentTransactions,
          statistics: {
            currentMonth: currentMonthStats,
            lastMonth: lastMonthStats,
            monthlyTrends
          }
        }
      });

    } catch (error) {
      console.error('Error fetching wallet details:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching wallet details',
        error: error.message
      });
    }
  }

  // Get wallet transaction history with advanced filtering
  async getTransactionHistory(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        status,
        startDate,
        endDate,
        sort = '-createdAt',
        search,
        minAmount,
        maxAmount
      } = req.query;

      const userId = req.user.role === 'admin' && req.query.userId 
        ? req.query.userId 
        : req.user._id;

      // Get user's wallet
      const wallet = await Wallet.findByUser(userId);
      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found'
        });
      }

      // Build query
      let query = { walletId: wallet._id };

      if (type) {
        if (Array.isArray(type)) {
          query.type = { $in: type };
        } else {
          query.type = type;
        }
      }

      if (status) {
        query.status = status;
      }

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      if (minAmount || maxAmount) {
        query.amount = {};
        if (minAmount) query.amount.$gte = parseFloat(minAmount);
        if (maxAmount) query.amount.$lte = parseFloat(maxAmount);
      }

      if (search) {
        query.$or = [
          { description: new RegExp(search, 'i') },
          { reference: new RegExp(search, 'i') },
          { transactionId: new RegExp(search, 'i') }
        ];
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Get transactions
      const transactions = await WalletTransaction.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('relatedUserId', 'firstName lastName avatar')
        .populate('relatedOrderId', 'orderNumber status')
        .populate('processedBy', 'firstName lastName')
        .lean();

      // Get total count
      const total = await WalletTransaction.countDocuments(query);
      const totalPages = Math.ceil(total / parseInt(limit));

      // Calculate summary for the filtered transactions
      const summary = await WalletTransaction.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalCredits: {
              $sum: {
                $cond: [
                  { $in: ['$type', ['credit', 'transfer_in', 'refund', 'bonus', 'cashback', 'reward', 'commission', 'earning']] },
                  '$amount',
                  0
                ]
              }
            },
            totalDebits: {
              $sum: {
                $cond: [
                  { $in: ['$type', ['debit', 'transfer_out', 'fee', 'penalty']] },
                  '$amount',
                  0
                ]
              }
            },
            transactionCount: { $sum: 1 }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: total,
            itemsPerPage: parseInt(limit),
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1
          },
          summary: summary[0] || { totalCredits: 0, totalDebits: 0, transactionCount: 0 },
          filters: {
            type, status, startDate, endDate, search, minAmount, maxAmount
          }
        }
      });

    } catch (error) {
      console.error('Error fetching transaction history:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching transaction history',
        error: error.message
      });
    }
  }

  // Hold/Reserve funds in wallet
  async holdFunds(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { amount, reason, reference, duration = 24 } = req.body; // duration in hours

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Hold amount must be greater than 0'
        });
      }

      const wallet = await Wallet.findByUser(req.user._id).session(session);
      
      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found'
        });
      }

      // Check available balance
      if (wallet.availableBalance < amount) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient available balance'
        });
      }

      // Create hold record
      const holdId = `HOLD-${Date.now()}`;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + duration);

      // Update wallet pending amounts
      wallet.pendingDebit += amount;
      wallet.availableBalance = wallet.balance - wallet.pendingDebit;
      await wallet.save({ session });

      // Create wallet transaction record
      const transaction = new WalletTransaction({
        transactionId: holdId,
        walletId: wallet._id,
        type: 'hold',
        amount: amount,
        balanceBefore: wallet.balance + amount,
        balanceAfter: wallet.balance,
        description: reason || 'Funds held',
        reference: reference,
        status: 'pending',
        metadata: {
          holdType: 'temporary',
          expiresAt: expiresAt,
          duration: duration
        }
      });

      await transaction.save({ session });

      await session.commitTransaction();

      res.json({
        success: true,
        message: 'Funds held successfully',
        data: {
          holdId: holdId,
          amount: amount,
          expiresAt: expiresAt,
          wallet: await Wallet.findByUser(req.user._id)
        }
      });

    } catch (error) {
      await session.abortTransaction();
      console.error('Error holding funds:', error);
      res.status(500).json({
        success: false,
        message: 'Error holding funds',
        error: error.message
      });
    } finally {
      session.endSession();
    }
  }

  // Release held funds
  async releaseFunds(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { holdId, action = 'release' } = req.body; // action: 'release' or 'capture'

      // Find the hold transaction
      const holdTransaction = await WalletTransaction.findOne({
        transactionId: holdId,
        type: 'hold',
        status: 'pending'
      }).session(session);

      if (!holdTransaction) {
        return res.status(404).json({
          success: false,
          message: 'Hold transaction not found or already processed'
        });
      }

      const wallet = await Wallet.findById(holdTransaction.walletId).session(session);
      
      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found'
        });
      }

      // Verify user permission
      if (wallet.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const holdAmount = holdTransaction.amount;

      if (action === 'release') {
        // Release the hold - restore available balance
        wallet.pendingDebit = Math.max(0, wallet.pendingDebit - holdAmount);
        wallet.availableBalance = wallet.balance - wallet.pendingDebit;
        
        holdTransaction.status = 'cancelled';
        holdTransaction.metadata.releasedAt = new Date();
        holdTransaction.metadata.action = 'released';

      } else if (action === 'capture') {
        // Capture the hold - actually debit the amount
        wallet.balance -= holdAmount;
        wallet.pendingDebit = Math.max(0, wallet.pendingDebit - holdAmount);
        wallet.availableBalance = wallet.balance - wallet.pendingDebit;
        
        holdTransaction.status = 'completed';
        holdTransaction.metadata.capturedAt = new Date();
        holdTransaction.metadata.action = 'captured';
        holdTransaction.balanceAfter = wallet.balance;

      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Use "release" or "capture"'
        });
      }

      await wallet.save({ session });
      await holdTransaction.save({ session });

      await session.commitTransaction();

      res.json({
        success: true,
        message: `Hold ${action}d successfully`,
        data: {
          holdId: holdId,
          action: action,
          amount: holdAmount,
          wallet: await Wallet.findByUser(req.user._id)
        }
      });

    } catch (error) {
      await session.abortTransaction();
      console.error('Error processing hold:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing hold',
        error: error.message
      });
    } finally {
      session.endSession();
    }
  }

  // Get wallet statistics and analytics
  async getWalletAnalytics(req, res) {
    try {
      const { period = '30d', granularity = 'day' } = req.query;
      
      const userId = req.user.role === 'admin' && req.query.userId 
        ? req.query.userId 
        : req.user._id;

      const wallet = await Wallet.findByUser(userId);
      
      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found'
        });
      }

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 30);
      }

      // Transaction analytics
      const transactionAnalytics = await WalletTransaction.aggregate([
        {
          $match: {
            walletId: wallet._id,
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: {
              type: '$type',
              date: {
                $dateToString: {
                  format: granularity === 'day' ? '%Y-%m-%d' : '%Y-%m',
                  date: '$createdAt'
                }
              }
            },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
            avgAmount: { $avg: '$amount' }
          }
        },
        {
          $sort: { '_id.date': 1 }
        }
      ]);

      // Transaction type summary
      const typeSummary = await WalletTransaction.aggregate([
        {
          $match: {
            walletId: wallet._id,
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
            avgAmount: { $avg: '$amount' }
          }
        },
        {
          $sort: { total: -1 }
        }
      ]);

      // Balance trend
      const balanceTrend = await WalletTransaction.aggregate([
        {
          $match: {
            walletId: wallet._id,
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $sort: { createdAt: 1 }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: granularity === 'day' ? '%Y-%m-%d' : '%Y-%m',
                date: '$createdAt'
              }
            },
            balance: { $last: '$balanceAfter' },
            date: { $last: '$createdAt' }
          }
        },
        {
          $sort: { '_id': 1 }
        }
      ]);

      // Calculate growth metrics
      const previousPeriodStart = new Date(startDate);
      const periodDuration = endDate - startDate;
      previousPeriodStart.setTime(previousPeriodStart.getTime() - periodDuration);

      const currentPeriodStats = await WalletTransaction.aggregate([
        {
          $match: {
            walletId: wallet._id,
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            totalIncome: {
              $sum: {
                $cond: [
                  { $in: ['$type', ['credit', 'transfer_in', 'refund', 'bonus', 'cashback', 'reward', 'commission', 'earning']] },
                  '$amount',
                  0
                ]
              }
            },
            totalExpense: {
              $sum: {
                $cond: [
                  { $in: ['$type', ['debit', 'transfer_out', 'fee', 'penalty']] },
                  '$amount',
                  0
                ]
              }
            },
            transactionCount: { $sum: 1 }
          }
        }
      ]);

      const previousPeriodStats = await WalletTransaction.aggregate([
        {
          $match: {
            walletId: wallet._id,
            createdAt: { $gte: previousPeriodStart, $lt: startDate },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            totalIncome: {
              $sum: {
                $cond: [
                  { $in: ['$type', ['credit', 'transfer_in', 'refund', 'bonus', 'cashback', 'reward', 'commission', 'earning']] },
                  '$amount',
                  0
                ]
              }
            },
            totalExpense: {
              $sum: {
                $cond: [
                  { $in: ['$type', ['debit', 'transfer_out', 'fee', 'penalty']] },
                  '$amount',
                  0
                ]
              }
            },
            transactionCount: { $sum: 1 }
          }
        }
      ]);

      const current = currentPeriodStats[0] || { totalIncome: 0, totalExpense: 0, transactionCount: 0 };
      const previous = previousPeriodStats[0] || { totalIncome: 0, totalExpense: 0, transactionCount: 0 };

      // Calculate growth percentages
      const growthMetrics = {
        incomeGrowth: previous.totalIncome > 0 
          ? ((current.totalIncome - previous.totalIncome) / previous.totalIncome) * 100 
          : 0,
        expenseGrowth: previous.totalExpense > 0 
          ? ((current.totalExpense - previous.totalExpense) / previous.totalExpense) * 100 
          : 0,
        transactionGrowth: previous.transactionCount > 0 
          ? ((current.transactionCount - previous.transactionCount) / previous.transactionCount) * 100 
          : 0
      };

      res.json({
        success: true,
        data: {
          wallet,
          analytics: {
            transactionAnalytics,
            typeSummary,
            balanceTrend,
            currentPeriod: current,
            previousPeriod: previous,
            growthMetrics
          },
          period: {
            start: startDate,
            end: endDate,
            granularity
          }
        }
      });

    } catch (error) {
      console.error('Error fetching wallet analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching wallet analytics',
        error: error.message
      });
    }
  }

  // Admin: Manage user wallet (credit/debit)
  async adminWalletOperation(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { userId, operation, amount, reason, reference } = req.body;

      if (!['credit', 'debit'].includes(operation)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid operation. Use "credit" or "debit"'
        });
      }

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be greater than 0'
        });
      }

      // Verify user exists
      const user = await User.findById(userId).session(session);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get user's wallet
      const wallet = await Wallet.findByUser(userId).session(session);
      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found'
        });
      }

      const transactionId = `ADM-${Date.now()}`;

      if (operation === 'credit') {
        await wallet.credit(amount, reason || 'Admin credit', transactionId, session);
      } else {
        // Check sufficient balance for debit
        if (wallet.availableBalance < amount) {
          return res.status(400).json({
            success: false,
            message: 'Insufficient wallet balance'
          });
        }
        await wallet.debit(amount, reason || 'Admin debit', transactionId, session);
      }

      await session.commitTransaction();

      res.json({
        success: true,
        message: `Wallet ${operation} completed successfully`,
        data: {
          transactionId: transactionId,
          operation: operation,
          amount: amount,
          user: {
            id: user._id,
            name: `${user.firstName} ${user.lastName}`
          },
          wallet: await Wallet.findByUser(userId)
        }
      });

    } catch (error) {
      await session.abortTransaction();
      console.error('Admin wallet operation error:', error);
      res.status(500).json({
        success: false,
        message: 'Wallet operation failed',
        error: error.message
      });
    } finally {
      session.endSession();
    }
  }

  // Get all wallets (admin only)
  async getAllWallets(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        sort = '-balance',
        search,
        minBalance,
        maxBalance,
        hasActivity
      } = req.query;

      // Build query
      let query = {};

      if (search) {
        // Search users and then get their wallets
        const users = await User.find({
          $or: [
            { firstName: new RegExp(search, 'i') },
            { lastName: new RegExp(search, 'i') },
            { email: new RegExp(search, 'i') }
          ]
        }).select('_id');
        
        query.userId = { $in: users.map(u => u._id) };
      }

      if (minBalance || maxBalance) {
        query.balance = {};
        if (minBalance) query.balance.$gte = parseFloat(minBalance);
        if (maxBalance) query.balance.$lte = parseFloat(maxBalance);
      }

      if (hasActivity === 'true') {
        query.$or = [
          { totalEarnings: { $gt: 0 } },
          { totalSpendings: { $gt: 0 } }
        ];
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Get wallets
      const wallets = await Wallet.find(query)
        .populate('userId', 'firstName lastName email avatar role')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      // Get total count
      const total = await Wallet.countDocuments(query);
      const totalPages = Math.ceil(total / parseInt(limit));

      // Calculate summary statistics
      const summaryStats = await Wallet.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalBalance: { $sum: '$balance' },
            totalEarnings: { $sum: '$totalEarnings' },
            totalSpendings: { $sum: '$totalSpendings' },
            averageBalance: { $avg: '$balance' },
            activeWallets: {
              $sum: {
                $cond: [
                  { $or: [{ $gt: ['$totalEarnings', 0] }, { $gt: ['$totalSpendings', 0] }] },
                  1,
                  0
                ]
              }
            }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          wallets,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: total,
            itemsPerPage: parseInt(limit),
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1
          },
          summary: summaryStats[0] || {
            totalBalance: 0,
            totalEarnings: 0,
            totalSpendings: 0,
            averageBalance: 0,
            activeWallets: 0
          }
        }
      });

    } catch (error) {
      console.error('Error fetching all wallets:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching wallet data',
        error: error.message
      });
    }
  }
}

module.exports = new WalletController();
