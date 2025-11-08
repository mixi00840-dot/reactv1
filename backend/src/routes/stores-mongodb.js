const express = require('express');
const router = express.Router();
const Store = require('../models/Store');
const Product = require('../models/Product');
const SellerApplication = require('../models/SellerApplication');
const { verifyJWT, requireAdmin } = require('../middleware/jwtAuth');

/**
 * Stores Routes - MongoDB Implementation
 */

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Stores API is working (MongoDB)',
    database: 'MongoDB'
  });
});

/**
 * @route   GET /api/stores
 * @desc    Get all stores
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, verified, featured } = req.query;
    const skip = (page - 1) * limit;

    let query = { status: 'active' };
    if (verified === 'true') query.isVerified = true;
    if (featured === 'true') query.isFeatured = true;

    if (search) {
      query.$text = { $search: search };
    }

    const stores = await Store.find(query)
      .sort(search ? { score: { $meta: 'textScore' } } : { rating: -1, totalSales: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('sellerId', 'username fullName avatar');

    const total = await Store.countDocuments(query);

    res.json({
      success: true,
      data: {
        stores,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stores'
    });
  }
});

/**
 * @route   GET /api/stores/:id
 * @desc    Get store by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const store = await Store.findById(req.params.id)
      .populate('sellerId', 'username fullName avatar isVerified');

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Get store products
    const products = await Product.find({
      storeId: store._id,
      status: 'active',
      isPublished: true
    })
    .limit(20)
    .sort({ createdAt: -1 });

    const storeData = store.toObject();
    storeData.products = products;

    res.json({
      success: true,
      data: { store: storeData }
    });

  } catch (error) {
    console.error('Get store error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching store'
    });
  }
});

/**
 * @route   POST /api/stores/apply
 * @desc    Apply to become a seller
 * @access  Private
 */
router.post('/apply', verifyJWT, async (req, res) => {
  try {
    const userId = req.userId;

    // Check if already has a store
    const existingStore = await Store.findOne({ sellerId: userId });
    if (existingStore) {
      return res.status(400).json({
        success: false,
        message: 'You already have a store'
      });
    }

    // Check if already applied
    const existingApplication = await SellerApplication.findOne({
      userId,
      status: { $in: ['pending', 'under_review'] }
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending application'
      });
    }

    // Create application
    const application = new SellerApplication({
      userId,
      ...req.body,
      status: 'pending'
    });

    await application.save();

    res.status(201).json({
      success: true,
      data: { application },
      message: 'Seller application submitted successfully'
    });

  } catch (error) {
    console.error('Apply for seller error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting application',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/stores/my-store
 * @desc    Get current user's store
 * @access  Private
 */
router.get('/my/store', verifyJWT, async (req, res) => {
  try {
    const store = await Store.findOne({ sellerId: req.userId });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'You do not have a store yet'
      });
    }

    res.json({
      success: true,
      data: { store }
    });

  } catch (error) {
    console.error('Get my store error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching store'
    });
  }
});

/**
 * @route   PUT /api/stores/:id
 * @desc    Update store
 * @access  Private (Store owner or Admin)
 */
router.put('/:id', verifyJWT, async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check ownership
    if (!store.sellerId.equals(req.userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    Object.assign(store, req.body);
    await store.save();

    res.json({
      success: true,
      data: { store },
      message: 'Store updated successfully'
    });

  } catch (error) {
    console.error('Update store error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating store'
    });
  }
});

module.exports = router;

