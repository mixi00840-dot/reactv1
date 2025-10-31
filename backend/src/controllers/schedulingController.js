const schedulingService = require('../services/schedulingService');
const ScheduledContent = require('../models/ScheduledContent');

exports.scheduleContent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { contentType, contentData, scheduledFor, timezone } = req.body;

    if (!contentType || !scheduledFor) {
      return res.status(400).json({ message: 'Content type and scheduled time are required' });
    }

    const scheduledItem = await schedulingService.scheduleContent(
      userId,
      { ...contentData, contentType, timezone },
      scheduledFor
    );

    res.json({
      success: true,
      message: 'Content scheduled successfully',
      scheduledContent: scheduledItem
    });

  } catch (error) {
    console.error('Schedule content error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.scheduleLivestream = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, scheduledFor, notifyFollowers, timezone } = req.body;

    if (!title || !scheduledFor) {
      return res.status(400).json({ message: 'Title and scheduled time are required' });
    }

    // Generate stream key
    const streamKey = `live_${userId}_${Date.now()}`;

    const scheduledStream = await schedulingService.scheduleLivestream(
      userId,
      { title, description, streamKey, notifyFollowers, timezone },
      scheduledFor
    );

    res.json({
      success: true,
      message: 'Livestream scheduled successfully',
      scheduledStream,
      streamKey
    });

  } catch (error) {
    console.error('Schedule livestream error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getScheduledContent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, contentType, limit } = req.query;

    const scheduledItems = await schedulingService.getScheduledContent(userId, {
      status,
      contentType,
      limit: parseInt(limit) || 50
    });

    res.json({
      success: true,
      scheduledContent: scheduledItems,
      count: scheduledItems.length
    });

  } catch (error) {
    console.error('Get scheduled content error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAllScheduledContent = async (req, res) => {
  try {
    const { status, contentType, limit = 100 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (contentType) query.contentType = contentType;

    const scheduledItems = await ScheduledContent.find(query)
      .populate('creator', 'username email avatar')
      .sort({ scheduledFor: 1 })
      .limit(parseInt(limit));

    const stats = {
      total: await ScheduledContent.countDocuments(),
      scheduled: await ScheduledContent.countDocuments({ status: 'scheduled' }),
      published: await ScheduledContent.countDocuments({ status: 'published' }),
      failed: await ScheduledContent.countDocuments({ status: 'failed' })
    };

    res.json({
      success: true,
      scheduledContent: scheduledItems,
      stats
    });

  } catch (error) {
    console.error('Get all scheduled content error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateScheduledContent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { scheduledId } = req.params;
    const updates = req.body;

    const scheduledItem = await ScheduledContent.findOne({
      _id: scheduledId,
      creator: userId
    });

    if (!scheduledItem) {
      return res.status(404).json({ message: 'Scheduled content not found' });
    }

    if (scheduledItem.status === 'published') {
      return res.status(400).json({ message: 'Cannot update already published content' });
    }

    // Update allowed fields
    if (updates.scheduledFor) scheduledItem.scheduledFor = new Date(updates.scheduledFor);
    if (updates.content) scheduledItem.content = { ...scheduledItem.content, ...updates.content };
    if (updates.livestreamConfig) scheduledItem.livestreamConfig = { ...scheduledItem.livestreamConfig, ...updates.livestreamConfig };

    await scheduledItem.save();

    res.json({
      success: true,
      message: 'Scheduled content updated',
      scheduledContent: scheduledItem
    });

  } catch (error) {
    console.error('Update scheduled content error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.cancelScheduledContent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { scheduledId } = req.params;

    const cancelled = await schedulingService.cancelScheduledContent(scheduledId, userId);

    res.json({
      success: true,
      message: 'Scheduled content cancelled',
      scheduledContent: cancelled
    });

  } catch (error) {
    console.error('Cancel scheduled content error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.processScheduledContent = async (req, res) => {
  try {
    // Admin only
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const result = await schedulingService.processScheduledContent();

    res.json({
      success: true,
      message: 'Scheduled content processed',
      result
    });

  } catch (error) {
    console.error('Process scheduled content error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getSchedulingCalendar = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    const query = {
      creator: userId,
      status: { $in: ['scheduled', 'publishing'] }
    };

    if (startDate || endDate) {
      query.scheduledFor = {};
      if (startDate) query.scheduledFor.$gte = new Date(startDate);
      if (endDate) query.scheduledFor.$lte = new Date(endDate);
    }

    const scheduledItems = await ScheduledContent.find(query)
      .sort({ scheduledFor: 1 })
      .select('contentType scheduledFor content.title livestreamConfig.streamTitle status');

    // Group by date
    const calendar = {};
    scheduledItems.forEach(item => {
      const date = item.scheduledFor.toISOString().split('T')[0];
      if (!calendar[date]) {
        calendar[date] = [];
      }
      calendar[date].push({
        id: item._id,
        type: item.contentType,
        time: item.scheduledFor,
        title: item.content?.title || item.livestreamConfig?.streamTitle,
        status: item.status
      });
    });

    res.json({
      success: true,
      calendar,
      totalScheduled: scheduledItems.length
    });

  } catch (error) {
    console.error('Get scheduling calendar error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
