const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Content = require('../models/Content');
const Product = require('../models/Product');
const SearchQuery = require('../models/SearchQuery');
const { optionalAuth } = require('../middleware/jwtAuth');

/**
 * Search Routes - MongoDB Implementation
 */

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Search API is working (MongoDB)',
    database: 'MongoDB'
  });
});

/**
 * @route   GET /api/search
 * @desc    Global search (users, content, products)
 * @access  Public
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { q, type = 'all', limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const searchTerm = q.trim();
    const results = {};

    // Search users
    if (type === 'all' || type === 'users') {
      results.users = await User.find(
        { $text: { $search: searchTerm } },
        { score: { $meta: 'textScore' } }
      )
      .select('-password')
      .sort({ score: { $meta: 'textScore' } })
      .limit(parseInt(limit));
    }

    // Search content
    if (type === 'all' || type === 'content') {
      results.content = await Content.find(
        {
          $text: { $search: searchTerm },
          status: 'active',
          isDeleted: false
        },
        { score: { $meta: 'textScore' } }
      )
      .sort({ score: { $meta: 'textScore' } })
      .limit(parseInt(limit))
      .populate('userId', 'username fullName avatar isVerified');
    }

    // Search products
    if (type === 'all' || type === 'products') {
      results.products = await Product.find(
        {
          $text: { $search: searchTerm },
          status: 'active',
          isPublished: true
        },
        { score: { $meta: 'textScore' } }
      )
      .sort({ score: { $meta: 'textScore' } })
      .limit(parseInt(limit))
      .populate('storeId', 'name logo');
    }

    // Search hashtags (from Tag model or Content)
    if (type === 'all' || type === 'hashtags') {
      const Tag = require('../models/Tag');
      results.hashtags = await Tag.find({
        name: { $regex: searchTerm, $options: 'i' }
      })
      .sort({ usageCount: -1 })
      .limit(parseInt(limit));
    }

    // Log search query
    if (req.userId) {
      const searchQuery = new SearchQuery({
        userId: req.userId,
        query: searchTerm,
        type,
        resultsCount: Object.values(results).reduce((sum, arr) => sum + (arr?.length || 0), 0)
      });
      await searchQuery.save().catch(() => {}); // Don't fail if logging fails
    }

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing search',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/search/suggestions
 * @desc    Get search suggestions
 * @access  Public
 */
router.get('/suggestions', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: { suggestions: [] }
      });
    }

    // Get popular searches
    const suggestions = await SearchQuery.aggregate([
      {
        $match: {
          query: { $regex: `^${q}`, $options: 'i' }
        }
      },
      {
        $group: {
          _id: '$query',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    res.json({
      success: true,
      data: {
        suggestions: suggestions.map(s => s._id)
      }
    });

  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting suggestions'
    });
  }
});

module.exports = router;

