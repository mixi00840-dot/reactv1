const express = require('express');
const router = express.Router();
const ExplorerSection = require('../models/ExplorerSection');
const { verifyJWT, requireAdmin } = require('../middleware/jwtAuth');

const adminAuth = [verifyJWT, requireAdmin];

const formatSection = (section) => ({
  _id: section._id,
  title: section.title,
  type: section.type,
  category: section.category || '',
  order: section.sortOrder,
  maxItems: section.maxItems,
  isActive: section.isActive,
  contentCount: Array.isArray(section.content) ? section.content.length : 0,
  views: section.views || 0,
  createdAt: section.createdAt,
  updatedAt: section.updatedAt
});

const clampOrder = (value, min, max) => {
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

router.get('/stats', adminAuth, async (req, res) => {
  try {
    const sections = await ExplorerSection.find({}, 'content views isActive');
    const totalSections = sections.length;
    const activeSections = sections.filter((section) => section.isActive).length;
    const totalContent = sections.reduce((sum, section) => sum + (Array.isArray(section.content) ? section.content.length : 0), 0);
    const totalViews = sections.reduce((sum, section) => sum + (section.views || 0), 0);

    const baselineVisitors = activeSections * 120;
    const dailyVisitors = totalViews > 0 ? Math.max(totalViews, baselineVisitors) : baselineVisitors;
    const engagementRate = totalContent > 0
      ? Math.min(100, (totalViews / (totalContent * 10)) * 100)
      : 0;

    res.json({
      success: true,
      stats: {
        totalSections,
        activeSections,
        totalContent,
        totalViews,
        dailyVisitors,
        engagementRate
      }
    });
  } catch (error) {
    console.error('Explorer stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load explorer statistics'
    });
  }
});

router.get('/sections', adminAuth, async (req, res) => {
  try {
    const { filter } = req.query;
    const query = {};

    if (filter === 'active') {
      query.isActive = true;
    } else if (filter === 'categories') {
      query.type = 'category';
    }

    const sections = await ExplorerSection.find(query).sort({ sortOrder: 1, createdAt: 1 });

    res.json({
      success: true,
      sections: sections.map(formatSection)
    });
  } catch (error) {
    console.error('List explorer sections error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch explorer sections'
    });
  }
});

router.get('/sections/:id', adminAuth, async (req, res) => {
  try {
    const section = await ExplorerSection.findById(req.params.id);

    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Explorer section not found'
      });
    }

    res.json({
      success: true,
      section: formatSection(section)
    });
  } catch (error) {
    console.error('Get explorer section error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch explorer section'
    });
  }
});

router.post('/sections', adminAuth, async (req, res) => {
  try {
    const {
      title,
      type,
      category,
      order,
      maxItems = 20,
      isActive = true,
      content = []
    } = req.body || {};

    if (!title || !type) {
      return res.status(400).json({
        success: false,
        message: 'Title and type are required'
      });
    }

    const totalSections = await ExplorerSection.countDocuments();
    let targetOrder = Number.isFinite(order) ? parseInt(order, 10) : totalSections + 1;
    targetOrder = clampOrder(targetOrder || totalSections + 1, 1, totalSections + 1);

    await ExplorerSection.updateMany(
      { sortOrder: { $gte: targetOrder } },
      { $inc: { sortOrder: 1 } }
    );

    const section = await ExplorerSection.create({
      title,
      type,
      category: category || null,
      sortOrder: targetOrder,
      maxItems,
      isActive,
      content,
      views: 0
    });

    res.status(201).json({
      success: true,
      message: 'Explorer section created successfully',
      section: formatSection(section)
    });
  } catch (error) {
    console.error('Create explorer section error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create explorer section'
    });
  }
});

router.put('/sections/:id', adminAuth, async (req, res) => {
  try {
    const {
      title,
      type,
      category,
      order,
      maxItems,
      isActive,
      content
    } = req.body || {};

    const section = await ExplorerSection.findById(req.params.id);

    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Explorer section not found'
      });
    }

    if (order !== undefined) {
      const totalSections = await ExplorerSection.countDocuments();
      const currentOrder = section.sortOrder;
      let targetOrder = clampOrder(parseInt(order, 10) || currentOrder, 1, totalSections);

      if (targetOrder !== currentOrder) {
        if (targetOrder < currentOrder) {
          await ExplorerSection.updateMany(
            {
              _id: { $ne: section._id },
              sortOrder: { $gte: targetOrder, $lt: currentOrder }
            },
            { $inc: { sortOrder: 1 } }
          );
        } else {
          await ExplorerSection.updateMany(
            {
              _id: { $ne: section._id },
              sortOrder: { $gt: currentOrder, $lte: targetOrder }
            },
            { $inc: { sortOrder: -1 } }
          );
        }

        section.sortOrder = targetOrder;
      }
    }

    if (title !== undefined) section.title = title;
    if (type !== undefined) section.type = type;
    if (category !== undefined) section.category = category || null;
    if (maxItems !== undefined) section.maxItems = maxItems;
    if (isActive !== undefined) section.isActive = isActive;
    if (Array.isArray(content)) section.content = content;

    await section.save();

    res.json({
      success: true,
      message: 'Explorer section updated successfully',
      section: formatSection(section)
    });
  } catch (error) {
    console.error('Update explorer section error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update explorer section'
    });
  }
});

router.patch('/sections/:id/toggle', adminAuth, async (req, res) => {
  try {
    const { isActive } = req.body || {};
    const section = await ExplorerSection.findById(req.params.id);

    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Explorer section not found'
      });
    }

    if (typeof isActive === 'boolean') {
      section.isActive = isActive;
    } else {
      section.isActive = !section.isActive;
    }

    await section.save();

    res.json({
      success: true,
      message: `Explorer section ${section.isActive ? 'enabled' : 'disabled'}`,
      section: formatSection(section)
    });
  } catch (error) {
    console.error('Toggle explorer section error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle explorer section'
    });
  }
});

router.patch('/sections/:id/reorder', adminAuth, async (req, res) => {
  try {
    const { direction } = req.body || {};
    const section = await ExplorerSection.findById(req.params.id);

    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Explorer section not found'
      });
    }

    if (!['up', 'down'].includes(direction)) {
      return res.status(400).json({
        success: false,
        message: 'Direction must be "up" or "down"'
      });
    }

    const comparisonOperator = direction === 'up' ? '$lt' : '$gt';
    const sortDirection = direction === 'up' ? -1 : 1;

    const swapSection = await ExplorerSection
      .findOne({ sortOrder: { [comparisonOperator]: section.sortOrder } })
      .sort({ sortOrder: sortDirection });

    if (!swapSection) {
      return res.json({
        success: true,
        message: 'Explorer section already at boundary',
        section: formatSection(section)
      });
    }

    const currentOrder = section.sortOrder;
    section.sortOrder = swapSection.sortOrder;
    swapSection.sortOrder = currentOrder;

    await Promise.all([section.save(), swapSection.save()]);

    res.json({
      success: true,
      message: 'Explorer sections reordered successfully',
      section: formatSection(section)
    });
  } catch (error) {
    console.error('Reorder explorer section error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder explorer section'
    });
  }
});

router.delete('/sections/:id', adminAuth, async (req, res) => {
  try {
    const section = await ExplorerSection.findById(req.params.id);

    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Explorer section not found'
      });
    }

    const deletedOrder = section.sortOrder;
    await section.deleteOne();

    await ExplorerSection.updateMany(
      { sortOrder: { $gt: deletedOrder } },
      { $inc: { sortOrder: -1 } }
    );

    res.json({
      success: true,
      message: 'Explorer section deleted successfully'
    });
  } catch (error) {
    console.error('Delete explorer section error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete explorer section'
    });
  }
});

module.exports = router;

