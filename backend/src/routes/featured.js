const express = require('express');
const router = express.Router();
const Featured = require('../models/Featured');
const User = require('../models/User');
const Content = require('../models/Content');
const { verifyJWT, requireAdmin } = require('../middleware/authMiddleware');

// ===========================
// ADMIN ROUTES
// ===========================

// Get all featured items
router.get('/admin/featured', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { type, position, status, page = 1, limit = 20, sortBy = '-priority' } = req.query;
    
    const query = {};
    if (type) query.type = type;
    if (position) query.position = position;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (status === 'expired') query.endDate = { $lt: new Date() };
    
    const skip = (page - 1) * limit;
    
    const featured = await Featured.find(query)
      .populate('itemId', 'username shopName title thumbnail')
      .populate('createdBy', 'username email')
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Featured.countDocuments(query);
    
    res.json({
      success: true,
      featured,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching featured items:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get featured statistics
router.get('/admin/featured/stats', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    
    const [stats] = await Featured.aggregate([
      {
        $facet: {
          overall: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                active: { 
                  $sum: { 
                    $cond: [
                      { $and: [{ $eq: ['$isActive', true] }, { $gte: ['$endDate', now] }] }, 
                      1, 
                      0
                    ] 
                  }
                },
                expired: { 
                  $sum: { $cond: [{ $lt: ['$endDate', now] }, 1, 0] }
                },
                totalImpressions: { $sum: '$impressions' },
                totalClicks: { $sum: '$clicks' }
              }
            }
          ],
          byType: [
            {
              $group: {
                _id: '$type',
                count: { $sum: 1 },
                active: { 
                  $sum: { 
                    $cond: [
                      { $and: [{ $eq: ['$isActive', true] }, { $gte: ['$endDate', now] }] }, 
                      1, 
                      0
                    ] 
                  }
                }
              }
            },
            { $sort: { count: -1 } }
          ],
          byPosition: [
            {
              $group: {
                _id: '$position',
                count: { $sum: 1 },
                impressions: { $sum: '$impressions' },
                clicks: { $sum: '$clicks' }
              }
            },
            { $sort: { count: -1 } }
          ]
        }
      }
    ]);
    
    const overall = stats.overall[0] || { 
      total: 0, 
      active: 0, 
      expired: 0,
      totalImpressions: 0,
      totalClicks: 0
    };
    
    const avgCTR = overall.totalImpressions > 0 
      ? ((overall.totalClicks / overall.totalImpressions) * 100).toFixed(2)
      : 0;
    
    res.json({
      success: true,
      stats: {
        ...overall,
        avgCTR: parseFloat(avgCTR),
        byType: stats.byType,
        byPosition: stats.byPosition
      }
    });
  } catch (error) {
    console.error('Error fetching featured stats:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Create featured item
router.post('/admin/featured', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { type, itemId, position, priority, startDate, endDate, isActive } = req.body;
    
    if (!type || !itemId || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Type, itemId, and endDate are required' 
      });
    }
    
    // Validate dates
    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(endDate);
    
    if (end <= start) {
      return res.status(400).json({ 
        success: false, 
        message: 'End date must be after start date' 
      });
    }
    
    // Check if item exists
    let itemExists = false;
    if (type === 'user') {
      itemExists = await User.findById(itemId);
    } else if (type === 'content') {
      itemExists = await Content.findById(itemId);
    }
    
    if (!itemExists) {
      return res.status(404).json({ 
        success: false, 
        message: `${type} with this ID not found` 
      });
    }
    
    const featured = new Featured({
      type,
      itemId,
      position: position || 'homepage',
      priority: priority || 1,
      startDate: start,
      endDate: end,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id
    });
    
    await featured.save();
    
    res.status(201).json({
      success: true,
      message: 'Featured item created successfully',
      featured
    });
  } catch (error) {
    console.error('Error creating featured item:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Update featured item
router.put('/admin/featured/:id', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { position, priority, startDate, endDate, isActive } = req.body;
    
    const featured = await Featured.findById(req.params.id);
    if (!featured) {
      return res.status(404).json({ success: false, message: 'Featured item not found' });
    }
    
    if (position) featured.position = position;
    if (priority !== undefined) featured.priority = priority;
    if (startDate) featured.startDate = new Date(startDate);
    if (endDate) featured.endDate = new Date(endDate);
    if (isActive !== undefined) featured.isActive = isActive;
    
    // Validate dates
    if (featured.endDate <= featured.startDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'End date must be after start date' 
      });
    }
    
    await featured.save();
    
    res.json({
      success: true,
      message: 'Featured item updated successfully',
      featured
    });
  } catch (error) {
    console.error('Error updating featured item:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Delete featured item
router.delete('/admin/featured/:id', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const featured = await Featured.findByIdAndDelete(req.params.id);
    
    if (!featured) {
      return res.status(404).json({ success: false, message: 'Featured item not found' });
    }
    
    res.json({
      success: true,
      message: 'Featured item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting featured item:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Toggle featured status
router.patch('/admin/featured/:id/toggle', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const featured = await Featured.findById(req.params.id);
    
    if (!featured) {
      return res.status(404).json({ success: false, message: 'Featured item not found' });
    }
    
    featured.isActive = !featured.isActive;
    await featured.save();
    
    res.json({
      success: true,
      message: `Featured item ${featured.isActive ? 'activated' : 'deactivated'}`,
      featured
    });
  } catch (error) {
    console.error('Error toggling featured status:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Track impression
router.post('/admin/featured/:id/impression', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const featured = await Featured.findByIdAndUpdate(
      req.params.id,
      { $inc: { impressions: 1 } },
      { new: true }
    );
    
    if (!featured) {
      return res.status(404).json({ success: false, message: 'Featured item not found' });
    }
    
    res.json({ success: true, impressions: featured.impressions });
  } catch (error) {
    console.error('Error tracking impression:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Track click
router.post('/admin/featured/:id/click', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const featured = await Featured.findByIdAndUpdate(
      req.params.id,
      { $inc: { clicks: 1 } },
      { new: true }
    );
    
    if (!featured) {
      return res.status(404).json({ success: false, message: 'Featured item not found' });
    }
    
    res.json({ success: true, clicks: featured.clicks });
  } catch (error) {
    console.error('Error tracking click:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ===========================
// PUBLIC ROUTES
// ===========================

// Get active featured items (public)
router.get('/featured', async (req, res) => {
  try {
    const { type, position, limit = 10 } = req.query;
    
    const query = {
      isActive: true,
      endDate: { $gte: new Date() },
      startDate: { $lte: new Date() }
    };
    
    if (type) query.type = type;
    if (position) query.position = position;
    
    const featured = await Featured.find(query)
      .populate('itemId', 'username shopName title thumbnail coverImage videoUrl')
      .sort('-priority -createdAt')
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      featured
    });
  } catch (error) {
    console.error('Error fetching featured items:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
