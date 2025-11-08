const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const ModerationQueue = require('../models/ModerationQueue');
const { verifyJWT } = require('../middleware/jwtAuth');

/**
 * Reports Routes - MongoDB Implementation
 * User reporting system
 */

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Reports API is working (MongoDB)',
    database: 'MongoDB'
  });
});

/**
 * @route   POST /api/reports
 * @desc    Create report
 * @access  Private
 */
router.post('/', verifyJWT, async (req, res) => {
  try {
    const { reportedType, reportedId, reportedUserId, reason, description, screenshots } = req.body;

    // Create report
    const report = new Report({
      reporterId: req.userId,
      reportedType,
      reportedId,
      reportedUserId,
      reason,
      description,
      screenshots,
      status: 'pending'
    });

    await report.save();

    // Add to moderation queue
    const queueItem = new ModerationQueue({
      contentType: reportedType,
      contentId: reportedId,
      reportedBy: [req.userId],
      reportCount: 1,
      reasons: [reason],
      priority: 'medium',
      status: 'pending'
    });

    await queueItem.save().catch(() => {}); // Might already exist

    res.status(201).json({
      success: true,
      data: { report },
      message: 'Report submitted successfully'
    });

  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting report',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/reports/my
 * @desc    Get user's reports
 * @access  Private
 */
router.get('/my', verifyJWT, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const reports = await Report.find({ reporterId: req.userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Report.countDocuments({ reporterId: req.userId });

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
    console.error('Get my reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reports'
    });
  }
});

module.exports = router;

