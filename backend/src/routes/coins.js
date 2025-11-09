const express = require('express');
const router = express.Router();
const CoinPackage = require('../models/CoinPackage');
const Transaction = require('../models/Transaction');
const { verifyJWT, requireAdmin } = require('../middleware/jwtAuth');

// ===========================
// ADMIN ROUTES
// ===========================

// Get all coin packages
router.get('/admin/coins/packages', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20, sortBy = 'sortOrder' } = req.query;
    
    const query = {};
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    
    const skip = (page - 1) * limit;
    
    const packages = await CoinPackage.find(query)
      .sort(sortBy === 'sortOrder' ? { sortOrder: 1, createdAt: -1 } : sortBy)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await CoinPackage.countDocuments(query);
    
    res.json({
      success: true,
      packages,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching coin packages:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get coin package statistics
router.get('/admin/coins/stats', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const [packageStats, transactionStats] = await Promise.all([
      CoinPackage.aggregate([
        {
          $group: {
            _id: null,
            totalPackages: { $sum: 1 },
            activePackages: { 
              $sum: { $cond: ['$isActive', 1, 0] }
            },
            totalPurchases: { $sum: '$purchaseCount' },
            totalRevenue: { 
              $sum: { $multiply: ['$price', '$purchaseCount'] }
            }
          }
        }
      ]),
      Transaction.aggregate([
        {
          $match: {
            type: 'coin_purchase',
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            last30Days: {
              $sum: {
                $cond: [
                  { $gte: ['$createdAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
                  '$amount',
                  0
                ]
              }
            },
            totalTransactions: { $sum: 1 }
          }
        }
      ])
    ]);
    
    const pkgStats = packageStats[0] || { 
      totalPackages: 0, 
      activePackages: 0,
      totalPurchases: 0,
      totalRevenue: 0
    };
    
    const txStats = transactionStats[0] || {
      last30Days: 0,
      totalTransactions: 0
    };
    
    // Get top selling packages
    const topPackages = await CoinPackage.find({ purchaseCount: { $gt: 0 } })
      .sort('-purchaseCount')
      .limit(5)
      .select('name coins price purchaseCount');
    
    res.json({
      success: true,
      stats: {
        ...pkgStats,
        revenueLastMonth: txStats.last30Days,
        totalTransactions: txStats.totalTransactions,
        topPackages
      }
    });
  } catch (error) {
    console.error('Error fetching coin stats:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Create coin package
router.post('/admin/coins/packages', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { 
      name, 
      coins, 
      bonusCoins, 
      price, 
      currency, 
      isPopular, 
      isBestValue, 
      isActive, 
      sortOrder 
    } = req.body;
    
    if (!name || !coins || price === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, coins, and price are required' 
      });
    }
    
    if (coins <= 0 || price < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Coins must be positive and price cannot be negative' 
      });
    }
    
    const coinPackage = new CoinPackage({
      name,
      coins,
      bonusCoins: bonusCoins || 0,
      price,
      currency: currency || 'USD',
      isPopular: isPopular || false,
      isBestValue: isBestValue || false,
      isActive: isActive !== undefined ? isActive : true,
      sortOrder: sortOrder !== undefined ? sortOrder : 0
    });
    
    await coinPackage.save();
    
    res.status(201).json({
      success: true,
      message: 'Coin package created successfully',
      package: coinPackage
    });
  } catch (error) {
    console.error('Error creating coin package:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Update coin package
router.put('/admin/coins/packages/:id', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { 
      name, 
      coins, 
      bonusCoins, 
      price, 
      currency, 
      isPopular, 
      isBestValue, 
      isActive, 
      sortOrder 
    } = req.body;
    
    const coinPackage = await CoinPackage.findById(req.params.id);
    if (!coinPackage) {
      return res.status(404).json({ success: false, message: 'Coin package not found' });
    }
    
    if (name) coinPackage.name = name;
    if (coins !== undefined) {
      if (coins <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Coins must be positive' 
        });
      }
      coinPackage.coins = coins;
    }
    if (bonusCoins !== undefined) coinPackage.bonusCoins = bonusCoins;
    if (price !== undefined) {
      if (price < 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Price cannot be negative' 
        });
      }
      coinPackage.price = price;
    }
    if (currency) coinPackage.currency = currency;
    if (isPopular !== undefined) coinPackage.isPopular = isPopular;
    if (isBestValue !== undefined) coinPackage.isBestValue = isBestValue;
    if (isActive !== undefined) coinPackage.isActive = isActive;
    if (sortOrder !== undefined) coinPackage.sortOrder = sortOrder;
    
    await coinPackage.save();
    
    res.json({
      success: true,
      message: 'Coin package updated successfully',
      package: coinPackage
    });
  } catch (error) {
    console.error('Error updating coin package:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Delete coin package
router.delete('/admin/coins/packages/:id', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const coinPackage = await CoinPackage.findById(req.params.id);
    
    if (!coinPackage) {
      return res.status(404).json({ success: false, message: 'Coin package not found' });
    }
    
    // Check if package has purchases
    if (coinPackage.purchaseCount > 0) {
      // Soft delete - deactivate instead
      coinPackage.isActive = false;
      await coinPackage.save();
      
      return res.json({
        success: true,
        message: 'Package deactivated (has existing purchases)',
        package: coinPackage
      });
    }
    
    // Hard delete if no purchases
    await coinPackage.deleteOne();
    
    res.json({
      success: true,
      message: 'Coin package deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting coin package:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Toggle package status
router.patch('/admin/coins/packages/:id/toggle', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const coinPackage = await CoinPackage.findById(req.params.id);
    
    if (!coinPackage) {
      return res.status(404).json({ success: false, message: 'Coin package not found' });
    }
    
    coinPackage.isActive = !coinPackage.isActive;
    await coinPackage.save();
    
    res.json({
      success: true,
      message: `Package ${coinPackage.isActive ? 'activated' : 'deactivated'}`,
      package: coinPackage
    });
  } catch (error) {
    console.error('Error toggling package status:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get coin transactions
router.get('/admin/coins/transactions', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { userId, status, page = 1, limit = 20 } = req.query;
    
    const query = { type: 'coin_purchase' };
    if (userId) query.userId = userId;
    if (status) query.status = status;
    
    const skip = (page - 1) * limit;
    
    const transactions = await Transaction.find(query)
      .populate('userId', 'username email avatar')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Transaction.countDocuments(query);
    
    res.json({
      success: true,
      transactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching coin transactions:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ===========================
// PUBLIC ROUTES
// ===========================

// Get active coin packages (public)
router.get('/coins/packages', async (req, res) => {
  try {
    const packages = await CoinPackage.find({ isActive: true })
      .sort('sortOrder -coins')
      .select('-purchaseCount -createdAt -updatedAt');
    
    res.json({
      success: true,
      packages
    });
  } catch (error) {
    console.error('Error fetching coin packages:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
