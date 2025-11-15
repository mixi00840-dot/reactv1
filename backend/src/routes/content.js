const express = require('express');
const router = express.Router();
const Content = require('../models/Content');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const { verifyJWT, optionalAuth } = require('../middleware/jwtAuth');
const { validationRules, handleValidationErrors } = require('../middleware/validation');
const socketService = require('../services/socketService');

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
 * @route   GET /api/content/feed
 * @desc    Get personalized content feed
 * @access  Public (better with auth)
 */
router.get('/feed', optionalAuth, async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    // If authenticated, get personalized feed
    // For now, return trending/recent content
    const content = await Content.find({ status: 'approved' })
      .populate('userId', 'username fullName avatar isVerified')
      .sort({ createdAt: -1, viewCount: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    res.json({
      success: true,
      data: { content }
    });

  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching feed'
    });
  }
});

/**
 * @route   GET /api/content/trending
 * @desc    Get trending content
 * @access  Public
 */
router.get('/trending', async (req, res) => {
  try {
    const { limit = 20, timeframe = '7d' } = req.query;

    // Calculate date based on timeframe
    const now = new Date();
    let sinceDate = new Date();
    
    switch(timeframe) {
      case '24h':
        sinceDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        sinceDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        sinceDate.setDate(now.getDate() - 30);
        break;
      default:
        sinceDate.setDate(now.getDate() - 7);
    }

    const content = await Content.find({
      status: 'approved',
      createdAt: { $gte: sinceDate }
    })
      .populate('userId', 'username fullName avatar isVerified')
      .sort({ viewCount: -1, likesCount: -1, commentsCount: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: { content }
    });

  } catch (error) {
    console.error('Get trending error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trending content'
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
      matchQuery.userId = req.userId; // Fixed: was req.user.id
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

/**
 * @route   POST /api/content/:id/like
 * @desc    Like or unlike content
 * @access  Private
 */
router.post('/:id/like', verifyJWT, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Check if already liked
    const existingLike = await Like.findOne({
      userId: req.user.id,
      contentId: req.params.id
    });

    let isLiked = false;
    
    if (existingLike) {
      // Unlike
      await Like.deleteOne({ _id: existingLike._id });
      content.likesCount = Math.max(0, content.likesCount - 1);
      isLiked = false;
    } else {
      // Like
      await Like.create({
        userId: req.user.id,
        contentId: req.params.id
      });
      content.likesCount += 1;
      isLiked = true;
    }

    await content.save();

    // Emit socket event for real-time updates
    socketService.emitVideoLike(
      req.params.id,
      req.user.id,
      isLiked,
      content.likesCount
    );

    res.json({
      success: true,
      data: {
        isLiked,
        likesCount: content.likesCount
      },
      message: isLiked ? 'Content liked' : 'Content unliked'
    });

  } catch (error) {
    console.error('Like content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling like'
    });
  }
});

/**
 * @route   POST /api/content/:id/view
 * @desc    Record content view
 * @access  Public
 */
router.post('/:id/view', optionalAuth, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Increment view count
    content.viewsCount += 1;
    await content.save();

    // Emit socket event for live viewer count
    socketService.emitVideoView(req.params.id, content.viewsCount);

    res.json({
      success: true,
      data: {
        viewsCount: content.viewsCount
      }
    });

  } catch (error) {
    console.error('Record view error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording view'
    });
  }
});

/**
 * @route   POST /api/content/:id/share
 * @desc    Record content share
 * @access  Private
 */
router.post('/:id/share', verifyJWT, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Increment share count
    content.sharesCount += 1;
    await content.save();

    // Emit socket event
    socketService.emitVideoShare(
      req.params.id,
      req.user.id,
      content.sharesCount
    );

    res.json({
      success: true,
      data: {
        sharesCount: content.sharesCount
      },
      message: 'Share recorded'
    });

  } catch (error) {
    console.error('Record share error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording share'
    });
  }
});

/**
 * @route   POST /api/content/:id/comments
 * @desc    Create comment on content
 * @access  Private
 */
router.post('/:id/comments', verifyJWT, async (req, res) => {
  try {
    const { text, parentId } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }

    const content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Create comment
    const comment = new Comment({
      contentId: req.params.id,
      userId: req.user.id,
      text,
      parentId: parentId || null
    });

    await comment.save();
    await comment.populate('userId', 'username fullName avatar isVerified');

    // Update content comment count
    content.commentsCount += 1;
    await content.save();

    // Emit socket event for real-time comment
    socketService.emitVideoComment(
      req.params.id,
      {
        _id: comment._id,
        text: comment.text,
        user: {
          _id: comment.userId._id,
          username: comment.userId.username,
          avatar: comment.userId.avatar,
          isVerified: comment.userId.isVerified
        },
        createdAt: comment.createdAt
      },
      content.commentsCount
    );

    res.status(201).json({
      success: true,
      data: { 
        comment,
        commentsCount: content.commentsCount
      },
      message: 'Comment created'
    });

  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating comment'
    });
  }
});

/**
 * @route   GET /api/content/:id/comments
 * @desc    Get content comments
 * @access  Public
 */
router.get('/:id/comments', async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ 
      contentId: req.params.id,
      parentId: null // Only top-level comments
    })
      .populate('userId', 'username fullName avatar isVerified')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Comment.countDocuments({ 
      contentId: req.params.id,
      parentId: null
    });

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comments'
    });
  }
});

module.exports = router;
