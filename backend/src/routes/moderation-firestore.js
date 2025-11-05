const express = require('express');
const router = express.Router();
const { verifyFirebaseToken, requireAdmin } = require('../middleware/firebaseAuth');

/**
 * Moderation Routes - Firestore Stub
 */

// Health check
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Moderation API is operational (Firestore stub)' });
});

// Apply Firebase auth to all routes
router.use(verifyFirebaseToken);
router.use(requireAdmin);

// Get moderation overview (root endpoint)
router.get('/', async (req, res) => {
  try {
    res.json({ 
      success: true, 
      data: {
        pendingReviews: 0,
        approvedToday: 0,
        rejectedToday: 0,
        totalQueued: 0
      }
    });
  } catch (error) {
    console.error('Error getting moderation overview:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get moderation statistics (Admin)
router.get('/stats', async (req, res) => {
  try {
    res.json({ 
      success: true, 
      data: {
        pendingReviews: 0,
        approvedToday: 0,
        rejectedToday: 0,
        totalQueued: 0
      }
    });
  } catch (error) {
    console.error('Error getting moderation stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get moderation queue (Admin)
router.get('/queue', async (req, res) => {
  try {
    const { status = 'pending', limit = 50 } = req.query;
    res.json({ success: true, data: { queue: [], count: 0 } });
  } catch (error) {
    console.error('Error getting moderation queue:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
