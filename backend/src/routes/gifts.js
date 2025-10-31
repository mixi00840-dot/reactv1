const express = require('express');
const router = express.Router();
const { Gift } = require('../models/Gift');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// @route   GET /api/gifts
// @desc    Get all gifts with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      category,
      featured,
      page = 1,
      limit = 20,
      sort = '-popularity'
    } = req.query;

    const query = { isActive: true };
    
    if (category) query.category = category;
    if (featured === 'true') query.isFeatured = true;

    const gifts = await Gift.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip((page - 1) * limit);

    const total = await Gift.countDocuments(query);

    res.json({
      success: true,
      data: {
        gifts,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get gifts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching gifts'
    });
  }
});

// @route   GET /api/gifts/categories
// @desc    Get gift categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Gift.distinct('category');
    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error('Get gift categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories'
    });
  }
});

// @route   GET /api/gifts/:id
// @desc    Get gift by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const gift = await Gift.findById(req.params.id);
    
    if (!gift) {
      return res.status(404).json({
        success: false,
        message: 'Gift not found'
      });
    }

    res.json({
      success: true,
      data: { gift }
    });
  } catch (error) {
    console.error('Get gift error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching gift'
    });
  }
});

// @route   POST /api/gifts
// @desc    Create new gift
// @access  Admin
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const gift = new Gift(req.body);
    await gift.save();

    res.status(201).json({
      success: true,
      data: { gift },
      message: 'Gift created successfully'
    });
  } catch (error) {
    console.error('Create gift error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating gift',
      error: error.message
    });
  }
});

// @route   PUT /api/gifts/:id
// @desc    Update gift
// @access  Admin
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const gift = await Gift.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!gift) {
      return res.status(404).json({
        success: false,
        message: 'Gift not found'
      });
    }

    res.json({
      success: true,
      data: { gift },
      message: 'Gift updated successfully'
    });
  } catch (error) {
    console.error('Update gift error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating gift'
    });
  }
});

// @route   DELETE /api/gifts/:id
// @desc    Delete gift
// @access  Admin
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const gift = await Gift.findByIdAndDelete(req.params.id);

    if (!gift) {
      return res.status(404).json({
        success: false,
        message: 'Gift not found'
      });
    }

    res.json({
      success: true,
      message: 'Gift deleted successfully'
    });
  } catch (error) {
    console.error('Delete gift error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting gift'
    });
  }
});

module.exports = router;
