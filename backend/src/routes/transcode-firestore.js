const express = require('express');
const router = express.Router();
const { authenticate, adminMiddleware } = require('../middleware/auth');

/**
 * Transcode Routes - Firestore Stub
 */

// Get transcode statistics (Admin)
router.get('/stats', authenticate, adminMiddleware, async (req, res) => {
  try {
    res.json({ 
      success: true, 
      data: {
        queuedJobs: 0,
        processingJobs: 0,
        completedToday: 0,
        failedToday: 0
      }
    });
  } catch (error) {
    console.error('Error getting transcode stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get transcode queue (Admin)
router.get('/queue', authenticate, adminMiddleware, async (req, res) => {
  try {
    res.json({ success: true, data: { queue: [], count: 0 } });
  } catch (error) {
    console.error('Error getting transcode queue:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
