/**
 * ADMIN COIN PACKAGES ROUTES - ALIAS FOR /api/coins/admin/*
 * 
 * This file creates route aliases to fix frontend path mismatches.
 * Frontend calls: /api/admin/coin-packages/*
 * Backend has: /api/coins/admin/coin-packages/*
 * 
 * This alias makes both paths work correctly.
 */

const express = require('express');
const router = express.Router();
const CoinPackage = require('../../models/CoinPackage');
const Transaction = require('../../models/Transaction');
const { verifyJWT, requireAdmin } = require('../../middleware/jwtAuth');

// ===========================
// ADMIN COIN PACKAGE ROUTES
// ===========================

// Get all coin packages (with pagination)
router.get('/', verifyJWT, requireAdmin, async (req, res) => {
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
router.get('/stats', verifyJWT, requireAdmin, async (req, res) => {
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
    
    res.json({
      success: true,
      stats: {
        packages: pkgStats,
        transactions: txStats,
        revenueGrowth: 0 // Could calculate from historical data
      }
    });
  } catch (error) {
    console.error('Error fetching coin package stats:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get specific coin package
router.get('/:id', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const package = await CoinPackage.findById(req.params.id);
    
    if (!package) {
      return res.status(404).json({ success: false, message: 'Coin package not found' });
    }
    
    res.json({ success: true, package });
  } catch (error) {
    console.error('Error fetching coin package:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Create new coin package
router.post('/', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      coinAmount,
      bonusCoins,
      price,
      currency,
      isActive,
      isFeatured,
      isPopular,
      sortOrder,
      description,
      icon
    } = req.body;
    
    // Validation
    if (!name || !coinAmount || !price) {
      return res.status(400).json({
        success: false,
        message: 'Name, coin amount, and price are required'
      });
    }
    
    // Check for duplicate names
    const existing = await CoinPackage.findOne({ name });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A coin package with this name already exists'
      });
    }
    
    const newPackage = new CoinPackage({
      name,
      coinAmount: parseInt(coinAmount),
      bonusCoins: parseInt(bonusCoins) || 0,
      price: parseFloat(price),
      currency: currency || 'USD',
      isActive: isActive !== false,
      isFeatured: isFeatured === true,
      isPopular: isPopular === true,
      sortOrder: parseInt(sortOrder) || 0,
      description,
      icon,
      purchaseCount: 0
    });
    
    await newPackage.save();
    
    res.status(201).json({
      success: true,
      message: 'Coin package created successfully',
      package: newPackage
    });
  } catch (error) {
    console.error('Error creating coin package:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Update coin package
router.put('/:id', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      coinAmount,
      bonusCoins,
      price,
      currency,
      isActive,
      isFeatured,
      isPopular,
      sortOrder,
      description,
      icon
    } = req.body;
    
    const package = await CoinPackage.findById(req.params.id);
    
    if (!package) {
      return res.status(404).json({ success: false, message: 'Coin package not found' });
    }
    
    // Check for duplicate names (excluding current package)
    if (name && name !== package.name) {
      const existing = await CoinPackage.findOne({ name, _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'A coin package with this name already exists'
        });
      }
    }
    
    // Update fields
    if (name) package.name = name;
    if (coinAmount !== undefined) package.coinAmount = parseInt(coinAmount);
    if (bonusCoins !== undefined) package.bonusCoins = parseInt(bonusCoins);
    if (price !== undefined) package.price = parseFloat(price);
    if (currency) package.currency = currency;
    if (isActive !== undefined) package.isActive = isActive;
    if (isFeatured !== undefined) package.isFeatured = isFeatured;
    if (isPopular !== undefined) package.isPopular = isPopular;
    if (sortOrder !== undefined) package.sortOrder = parseInt(sortOrder);
    if (description !== undefined) package.description = description;
    if (icon !== undefined) package.icon = icon;
    
    await package.save();
    
    res.json({
      success: true,
      message: 'Coin package updated successfully',
      package
    });
  } catch (error) {
    console.error('Error updating coin package:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Delete coin package
router.delete('/:id', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const package = await CoinPackage.findById(req.params.id);
    
    if (!package) {
      return res.status(404).json({ success: false, message: 'Coin package not found' });
    }
    
    // Check if package has been purchased
    if (package.purchaseCount > 0) {
      // Soft delete - just deactivate
      package.isActive = false;
      await package.save();
      
      return res.json({
        success: true,
        message: 'Coin package deactivated (has purchase history)',
        package
      });
    }
    
    // Hard delete if no purchases
    await package.deleteOne();
    
    res.json({
      success: true,
      message: 'Coin package deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting coin package:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Toggle coin package active status
router.patch('/:id/toggle', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const package = await CoinPackage.findById(req.params.id);
    
    if (!package) {
      return res.status(404).json({ success: false, message: 'Coin package not found' });
    }
    
    package.isActive = !package.isActive;
    await package.save();
    
    res.json({
      success: true,
      message: `Coin package ${package.isActive ? 'activated' : 'deactivated'}`,
      package
    });
  } catch (error) {
    console.error('Error toggling coin package:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
