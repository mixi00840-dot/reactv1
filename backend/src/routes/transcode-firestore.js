const express = require('express');
const router = express.Router();
const { verifyFirebaseToken, requireAdmin } = require('../middleware/firebaseAuth');

/**
 * Transcode Routes - Firestore Stub
 */

// Health check
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Transcode API is operational (Firestore stub)' });
});

// Apply Firebase auth to all routes
router.use(verifyFirebaseToken);
router.use(requireAdmin);

// Get transcode overview (root endpoint)
router.get('/', async (req, res) => {
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
    console.error('Error getting transcode overview:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get transcode statistics (Admin)
router.get('/stats', async (req, res) => {
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
router.get('/queue', async (req, res) => {
  try {
    res.json({ success: true, data: { queue: [], count: 0 } });
  } catch (error) {
    console.error('Error getting transcode queue:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
