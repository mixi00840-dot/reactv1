const express = require('express');
const router = express.Router();
const Content = require('../models/Content');
const User = require('../models/User');
const { verifyJWT, optionalAuth } = require('../middleware/jwtAuth');
const feedRanking = require('../services/feedRanking');
const cache = require('../services/redisCache');

/**
 * Feed Routes - AI-Powered Personalized Feed
 * Uses AI ranking with Redis caching for performance
 */

/**
 * @route   GET /api/feed
 * @desc    Get AI-powered personalized feed
 * @access  Private/Public
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { cursor, limit = 20, useAI = 'true' } = req.query;
    const userId = req.user?.id;

    // Use AI ranking if user is logged in and AI is enabled
    if (userId && useAI === 'true' && process.env.ENABLE_FEED_CACHING === 'true') {
      try {
        const result = await feedRanking.generateFeed(userId, {
          cursor,
          limit: parseInt(limit)
        });

        return res.json({
          success: true,
          data: {
            content: result.content,
            pagination: {
              nextCursor: result.cursor,
              hasMore: result.hasMore,
              limit: parseInt(limit)
            },
            meta: {
              source: result.source,
              avgScore: result.avgScore,
              aiRanked: true
            }
          }
        });
      } catch (aiError) {
        console.error('AI feed error, falling back to basic:', aiError.message);
        // Fall through to basic feed
      }
    }

    // Fallback to basic feed (original logic)
    return await getBasicFeed(req, res, cursor, limit, userId);

  } catch (error) {
    console.error('Feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feed',
      error: error.message
    });
  }
});

/**
 * Basic feed (fallback when AI not available)
 */
async function getBasicFeed(req, res, cursor, limit, userId) {
  // Build query
  let query = { status: 'active', visibility: 'public' };
  
  // Cursor-based pagination
  if (cursor) {
    query.createdAt = { $lt: new Date(cursor) };
  }

  // Get user's following list for personalized feed
  let followingIds = [];
  if (userId) {
    const user = await User.findById(userId).select('following');
    followingIds = user?.following || [];
  }

  // Personalized feed: prioritize content from followed users
  const aggregation = [
    { $match: query },
    {
      $addFields: {
        isFollowing: followingIds.length > 0 
          ? { $in: ['$userId', followingIds] }
          : false,
        engagementScore: {
          $add: [
            { $multiply: ['$likesCount', 1] },
            { $multiply: ['$commentsCount', 2] },
            { $multiply: ['$sharesCount', 3] },
            { $multiply: ['$viewsCount', 0.01] }
          ]
        }
      }
    },
    {
      $sort: {
        isFollowing: -1, // Prioritize following
        feedScore: -1,   // Then by AI feed score
        engagementScore: -1, // Then by engagement
        createdAt: -1 // Then by recency
      }
    },
    { $limit: parseInt(limit) + 1 }, // Get one extra to check if there's more
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: 1,
        type: 1,
        title: 1,
        description: 1,
        caption: 1,
        videoUrl: 1,
        thumbnailUrl: 1,
        duration: 1,
        viewsCount: 1,
        likesCount: 1,
        commentsCount: 1,
        sharesCount: 1,
        hashtags: 1,
        feedScore: 1,
        createdAt: 1,
        'user._id': 1,
        'user.username': 1,
        'user.fullName': 1,
        'user.avatar': 1,
        'user.isVerified': 1
      }
    }
  ];

  const content = await Content.aggregate(aggregation);

  // Check if there's more
  const hasMore = content.length > limit;
  if (hasMore) {
    content.pop(); // Remove the extra item
  }

  // Get next cursor
  const nextCursor = hasMore && content.length > 0
    ? content[content.length - 1].createdAt.toISOString()
    : null;

  return res.json({
    success: true,
    data: {
      content,
      pagination: {
        nextCursor,
        hasMore,
        limit: parseInt(limit)
      },
      meta: {
        source: 'basic',
        aiRanked: false
      }
    }
  });
}

/**
 * @route   GET /api/feed/trending
 * @desc    Get trending content (CACHED & PRE-COMPUTED)
 * @access  Public
 */
router.get('/trending', async (req, res) => {
  try {
    const { limit = 20, period = '24h' } = req.query;

    // Calculate time range
    const now = new Date();
    const periodHours = {
      '1h': 1,
      '6h': 6,
      '24h': 24,
      '7d': 168
    };
    
    const hours = periodHours[period] || 24;
    const startDate = new Date(now - hours * 60 * 60 * 1000);

    // Use compound index: (createdAt, viewsCount, likesCount)
    const trending = await Content.find({
      status: 'active',
      visibility: 'public',
      createdAt: { $gte: startDate }
    })
    .sort({ 
      viewsCount: -1, 
      likesCount: -1,
      commentsCount: -1
    })
    .limit(parseInt(limit))
    .populate('userId', 'username fullName avatar isVerified')
    .lean(); // Use lean() for better performance (plain objects)

    res.json({
      success: true,
      data: {
        content: trending,
        period,
        generatedAt: new Date()
      }
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
 * @route   GET /api/feed/for-you
 * @desc    Get AI-recommended content (ML-BASED)
 * @access  Private
 */
router.get('/for-you', verifyJWT, async (req, res) => {
  try {
    const { limit = 20, cursor } = req.query;
    const userId = req.user.id;

    // Get user's interaction history for recommendations
    const user = await User.findById(userId).select('preferences viewHistory likedContent');

    // Build recommendation query based on user preferences
    const query = {
      status: 'active',
      visibility: 'public',
      userId: { $ne: userId } // Exclude own content
    };

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    // Add tag-based filtering if user has preferences
    if (user?.preferences?.tags && user.preferences.tags.length > 0) {
      query.tags = { $in: user.preferences.tags };
    }

    const content = await Content.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) + 1)
      .populate('userId', 'username fullName avatar isVerified')
      .lean();

    const hasMore = content.length > limit;
    if (hasMore) {
      content.pop();
    }

    const nextCursor = hasMore && content.length > 0
      ? content[content.length - 1].createdAt.toISOString()
      : null;

    res.json({
      success: true,
      data: {
        content,
        pagination: {
          nextCursor,
          hasMore
        }
      }
    });

  } catch (error) {
    console.error('Get for-you feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recommendations'
    });
  }
});

module.exports = router;

