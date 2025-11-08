const express = require('express');
const router = express.Router();
const Content = require('../models/Content');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const { verifyJWT, optionalAuth } = require('../middleware/jwtAuth');
const { validationRules, handleValidationErrors } = require('../middleware/validation');

/**
 * Content Routes - MongoDB Implementation
 * Handles videos, posts, and other content
 */

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Content API is working (MongoDB)',
    database: 'MongoDB'
  });
});

/**
 * @route   GET /api/content
 * @desc    Get all content (feed)
 * @access  Public
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      status = 'active',
      userId,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;
    
    const skip = (page - 1) * limit;

    let query = { status };
    if (type) query.type = type;
    if (userId) query.userId = userId;

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const content = await Content.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip)
      .populate('userId', 'username fullName avatar isVerified');

    const total = await Content.countDocuments(query);

    res.json({
      success: true,
      data: {
        content,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content'
    });
  }
});

/**
 * @route   GET /api/content/:id
 * @desc    Get single content
 * @access  Public
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id)
      .populate('userId', 'username fullName avatar isVerified followersCount');

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Increment views
    content.viewsCount += 1;
    await content.save();

    res.json({
      success: true,
      data: { content }
    });

  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content'
    });
  }
});

/**
 * @route   GET /api/content/analytics
 * @desc    Get content analytics summary
 * @access  Private
 */
router.get('/analytics', verifyJWT, async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;

    // Build date filter
    let dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    // Build query
    let matchQuery = {};
    if (userId) {
      matchQuery.userId = userId;
    } else {
      // If no userId specified, use current user
      matchQuery.userId = req.user.id;
    }
    
    if (Object.keys(dateFilter).length > 0) {
      matchQuery.createdAt = dateFilter;
    }

    // Get analytics
    const [
      totalContent,
      totalViews,
      totalLikes,
      totalComments,
      totalShares,
      contentByType,
      topPerformingContent
    ] = await Promise.all([
      Content.countDocuments(matchQuery),
      
      Content.aggregate([
        { $match: matchQuery },
        { $group: { _id: null, total: { $sum: '$viewsCount' } } }
      ]),
      
      Content.aggregate([
        { $match: matchQuery },
        { $group: { _id: null, total: { $sum: '$likesCount' } } }
      ]),
      
      Content.aggregate([
        { $match: matchQuery },
        { $group: { _id: null, total: { $sum: '$commentsCount' } } }
      ]),
      
      Content.aggregate([
        { $match: matchQuery },
        { $group: { _id: null, total: { $sum: '$sharesCount' } } }
      ]),
      
      Content.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            views: { $sum: '$viewsCount' },
            likes: { $sum: '$likesCount' }
          }
        }
      ]),
      
      Content.find(matchQuery)
        .sort({ viewsCount: -1 })
        .limit(10)
        .select('title type viewsCount likesCount commentsCount createdAt')
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalContent,
          totalViews: totalViews[0]?.total || 0,
          totalLikes: totalLikes[0]?.total || 0,
          totalComments: totalComments[0]?.total || 0,
          totalShares: totalShares[0]?.total || 0,
          avgViewsPerContent: totalContent > 0 ? ((totalViews[0]?.total || 0) / totalContent).toFixed(2) : 0,
          engagementRate: (totalViews[0]?.total || 0) > 0 
            ? (((totalLikes[0]?.total || 0) + (totalComments[0]?.total || 0)) / (totalViews[0]?.total || 0) * 100).toFixed(2)
            : 0
        },
        contentByType: contentByType || [],
        topPerformingContent: topPerformingContent || []
      }
    });

  } catch (error) {
    console.error('Get content analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content analytics',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/content
 * @desc    Create new content
 * @access  Private
 */
router.post('/', verifyJWT, validationRules.contentCreation(), handleValidationErrors, async (req, res) => {
  try {
    const {
      type,
      title,
      description,
      videoUrl,
      thumbnailUrl,
      duration,
      width,
      height,
      tags,
      soundId,
      visibility = 'public'
    } = req.body;

    if (!type || !videoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Type and videoUrl are required'
      });
    }

    const content = new Content({
      userId: req.user.id,
      type,
      title,
      description,
      videoUrl,
      thumbnailUrl,
      duration,
      width,
      height,
      tags,
      soundId,
      visibility,
      status: 'pending' // Pending moderation
    });

    await content.save();

    res.status(201).json({
      success: true,
      data: { content },
      message: 'Content created successfully'
    });

  } catch (error) {
    console.error('Create content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating content'
    });
  }
});

/**
 * @route   PUT /api/content/:id
 * @desc    Update content
 * @access  Private (owner only)
 */
router.put('/:id', verifyJWT, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Check ownership
    if (!content.userId.equals(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this content'
      });
    }

    // Update allowed fields
    const allowedUpdates = ['title', 'description', 'tags', 'visibility'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        content[field] = req.body[field];
      }
    });

    await content.save();

    res.json({
      success: true,
      data: { content },
      message: 'Content updated successfully'
    });

  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating content'
    });
  }
});

/**
 * @route   DELETE /api/content/:id
 * @desc    Delete content
 * @access  Private (owner or admin)
 */
router.delete('/:id', verifyJWT, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Check ownership or admin
    if (!content.userId.equals(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this content'
      });
    }

    // Soft delete
    content.isDeleted = true;
    content.deletedAt = new Date();
    await content.save();

    res.json({
      success: true,
      message: 'Content deleted successfully'
    });

  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting content'
    });
  }
});

module.exports = router;
