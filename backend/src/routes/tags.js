const express = require('express');
const router = express.Router();
const Tag = require('../models/Tag');
const Content = require('../models/Content');
const { verifyJWT, requireAdmin } = require('../middleware/jwtAuth');

// ===========================
// ADMIN ROUTES
// ===========================

// Get all tags
router.get('/admin/tags', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { 
      search, 
      status, 
      trending, 
      page = 1, 
      limit = 50, 
      sortBy = '-usageCount' 
    } = req.query;
    
    const query = {};
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    if (status === 'blocked') query.isBlocked = true;
    if (status === 'active') query.isBlocked = false;
    if (trending === 'true') query.isTrending = true;
    
    const skip = (page - 1) * limit;
    
    const tags = await Tag.find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Tag.countDocuments(query);
    
    res.json({
      success: true,
      tags,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get tag statistics
router.get('/admin/tags/stats', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const [tagStats] = await Tag.aggregate([
      {
        $facet: {
          overall: [
            {
              $group: {
                _id: null,
                totalTags: { $sum: 1 },
                blockedTags: { 
                  $sum: { $cond: ['$isBlocked', 1, 0] }
                },
                trendingTags: {
                  $sum: { $cond: ['$isTrending', 1, 0] }
                },
                totalUsage: { $sum: '$usageCount' },
                avgUsage: { $avg: '$usageCount' }
              }
            }
          ],
          topTags: [
            { $match: { isBlocked: false } },
            { $sort: { usageCount: -1 } },
            { $limit: 10 },
            {
              $project: {
                name: 1,
                usageCount: 1,
                isTrending: 1
              }
            }
          ],
          recentTags: [
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            {
              $project: {
                name: 1,
                usageCount: 1,
                createdAt: 1
              }
            }
          ]
        }
      }
    ]);
    
    const overall = tagStats.overall[0] || {
      totalTags: 0,
      blockedTags: 0,
      trendingTags: 0,
      totalUsage: 0,
      avgUsage: 0
    };
    
    res.json({
      success: true,
      stats: {
        ...overall,
        topTags: tagStats.topTags,
        recentTags: tagStats.recentTags
      }
    });
  } catch (error) {
    console.error('Error fetching tag stats:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Create tag
router.post('/admin/tags', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { name, isTrending, isBlocked } = req.body;
    
    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tag name is required' 
      });
    }
    
    // Check if tag already exists
    const existing = await Tag.findOne({ name: name.toLowerCase() });
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tag already exists' 
      });
    }
    
    const tag = new Tag({
      name: name.toLowerCase(),
      isTrending: isTrending || false,
      isBlocked: isBlocked || false
    });
    
    await tag.save();
    
    res.status(201).json({
      success: true,
      message: 'Tag created successfully',
      tag
    });
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Update tag
router.put('/admin/tags/:id', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { name, isTrending, isBlocked } = req.body;
    
    const tag = await Tag.findById(req.params.id);
    if (!tag) {
      return res.status(404).json({ success: false, message: 'Tag not found' });
    }
    
    if (name && name.toLowerCase() !== tag.name) {
      // Check if new name already exists
      const existing = await Tag.findOne({ name: name.toLowerCase() });
      if (existing) {
        return res.status(400).json({ 
          success: false, 
          message: 'A tag with this name already exists' 
        });
      }
      tag.name = name.toLowerCase();
    }
    
    if (isTrending !== undefined) tag.isTrending = isTrending;
    if (isBlocked !== undefined) tag.isBlocked = isBlocked;
    
    await tag.save();
    
    res.json({
      success: true,
      message: 'Tag updated successfully',
      tag
    });
  } catch (error) {
    console.error('Error updating tag:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Delete tag
router.delete('/admin/tags/:id', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);
    
    if (!tag) {
      return res.status(404).json({ success: false, message: 'Tag not found' });
    }
    
    // Remove tag from all content
    await Content.updateMany(
      { tags: tag.name },
      { $pull: { tags: tag.name } }
    );
    
    await tag.deleteOne();
    
    res.json({
      success: true,
      message: 'Tag deleted successfully and removed from all content'
    });
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Toggle tag blocking
router.patch('/admin/tags/:id/block', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);
    
    if (!tag) {
      return res.status(404).json({ success: false, message: 'Tag not found' });
    }
    
    tag.isBlocked = !tag.isBlocked;
    await tag.save();
    
    res.json({
      success: true,
      message: `Tag ${tag.isBlocked ? 'blocked' : 'unblocked'}`,
      tag
    });
  } catch (error) {
    console.error('Error toggling tag block:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Toggle tag trending
router.patch('/admin/tags/:id/trending', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);
    
    if (!tag) {
      return res.status(404).json({ success: false, message: 'Tag not found' });
    }
    
    tag.isTrending = !tag.isTrending;
    await tag.save();
    
    res.json({
      success: true,
      message: `Tag ${tag.isTrending ? 'marked as trending' : 'unmarked from trending'}`,
      tag
    });
  } catch (error) {
    console.error('Error toggling tag trending:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Merge tags
router.post('/admin/tags/merge', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { sourceTagIds, targetTagId } = req.body;
    
    if (!sourceTagIds || !Array.isArray(sourceTagIds) || !targetTagId) {
      return res.status(400).json({ 
        success: false, 
        message: 'sourceTagIds (array) and targetTagId are required' 
      });
    }
    
    const targetTag = await Tag.findById(targetTagId);
    if (!targetTag) {
      return res.status(404).json({ success: false, message: 'Target tag not found' });
    }
    
    const sourceTags = await Tag.find({ _id: { $in: sourceTagIds } });
    if (sourceTags.length !== sourceTagIds.length) {
      return res.status(404).json({ success: false, message: 'One or more source tags not found' });
    }
    
    // Update all content using source tags to use target tag
    for (const sourceTag of sourceTags) {
      await Content.updateMany(
        { tags: sourceTag.name },
        { 
          $pull: { tags: sourceTag.name },
          $addToSet: { tags: targetTag.name }
        }
      );
      
      // Add source tag usage to target
      targetTag.usageCount += sourceTag.usageCount;
      
      // Delete source tag
      await sourceTag.deleteOne();
    }
    
    await targetTag.save();
    
    res.json({
      success: true,
      message: `Merged ${sourceTags.length} tags into ${targetTag.name}`,
      tag: targetTag
    });
  } catch (error) {
    console.error('Error merging tags:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ===========================
// PUBLIC ROUTES
// ===========================

// Get trending tags (public)
router.get('/tags/trending', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const tags = await Tag.find({ 
      isTrending: true, 
      isBlocked: false 
    })
      .sort('-usageCount')
      .limit(parseInt(limit))
      .select('name usageCount');
    
    res.json({
      success: true,
      tags
    });
  } catch (error) {
    console.error('Error fetching trending tags:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Search tags (public)
router.get('/tags/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({ 
        success: false, 
        message: 'Search query (q) is required' 
      });
    }
    
    const tags = await Tag.find({ 
      name: { $regex: q, $options: 'i' },
      isBlocked: false 
    })
      .sort('-usageCount')
      .limit(parseInt(limit))
      .select('name usageCount');
    
    res.json({
      success: true,
      tags
    });
  } catch (error) {
    console.error('Error searching tags:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
