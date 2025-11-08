const express = require('express');
const router = express.Router();
const ModerationQueue = require('../models/ModerationQueue');
const Report = require('../models/Report');
const Content = require('../models/Content');
const User = require('../models/User');
const Strike = require('../models/Strike');
const { verifyJWT, requireAdmin } = require('../middleware/jwtAuth');

/**
 * Moderation Routes - MongoDB Implementation
 */

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Moderation API is working (MongoDB)',
    database: 'MongoDB'
  });
});

/**
 * @route   GET /api/moderation/queue
 * @desc    Get moderation queue
 * @access  Admin
 */
router.get('/queue', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { status = 'pending', priority, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    let query = { status };
    if (priority) query.priority = priority;

    const queue = await ModerationQueue.find(query)
      .sort({ priority: -1, createdAt: 1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('assignedTo', 'username fullName');

    const total = await ModerationQueue.countDocuments(query);

    res.json({
      success: true,
      data: {
        queue,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get moderation queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching moderation queue'
    });
  }
});

/**
 * @route   GET /api/moderation/reports
 * @desc    Get all reports
 * @access  Admin
 */
router.get('/reports', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { status = 'pending', type, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    let query = { status };
    if (type) query.reportedType = type;

    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('reporterId', 'username fullName avatar')
      .populate('reportedUserId', 'username fullName avatar')
      .populate('reviewedBy', 'username fullName');

    const total = await Report.countDocuments(query);

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reports'
    });
  }
});

/**
 * @route   PUT /api/moderation/reports/:id/resolve
 * @desc    Resolve report
 * @access  Admin
 */
router.put('/reports/:id/resolve', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { actionTaken, reviewNotes } = req.body;

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    report.status = 'resolved';
    report.actionTaken = actionTaken;
    report.reviewNotes = reviewNotes;
    report.reviewedBy = req.userId;
    report.reviewedAt = new Date();

    await report.save();

    // Execute action
    if (actionTaken === 'content_removed' && report.reportedType === 'content') {
      await Content.findByIdAndUpdate(report.reportedId, { status: 'removed' });
    } else if (actionTaken === 'account_suspended') {
      await User.findByIdAndUpdate(report.reportedUserId, { status: 'suspended' });
    } else if (actionTaken === 'account_banned') {
      await User.findByIdAndUpdate(report.reportedUserId, { status: 'banned' });
    } else if (actionTaken === 'warning') {
      // Create strike
      const strike = new Strike({
        userId: report.reportedUserId,
        reason: report.reason,
        description: reviewNotes,
        severity: 'moderate',
        issuedBy: req.userId
      });
      await strike.save();
    }

    res.json({
      success: true,
      data: { report },
      message: 'Report resolved successfully'
    });

  } catch (error) {
    console.error('Resolve report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resolving report'
    });
  }
});

/**
 * @route   POST /api/moderation/content/:id/approve
 * @desc    Approve content
 * @access  Admin
 */
router.post('/content/:id/approve', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const content = await Content.findByIdAndUpdate(
      req.params.id,
      { status: 'active', reviewedBy: req.userId, reviewedAt: new Date() },
      { new: true }
    );

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      data: { content },
      message: 'Content approved successfully'
    });

  } catch (error) {
    console.error('Approve content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving content'
    });
  }
});

/**
 * @route   POST /api/moderation/content/:id/reject
 * @desc    Reject content
 * @access  Admin
 */
router.post('/content/:id/reject', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;

    const content = await Content.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'removed',
        moderationFlags: [reason],
        reviewedBy: req.userId,
        reviewedAt: new Date()
      },
      { new: true }
    );

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      data: { content },
      message: 'Content rejected'
    });

  } catch (error) {
    console.error('Reject content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting content'
    });
  }
});

module.exports = router;

