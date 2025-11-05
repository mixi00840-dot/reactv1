const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/firebaseAuth');

/**
 * Feed Routes - Firestore Stub
 */

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Feed API is operational (Firestore stub)' });
});

// Get feed (root endpoint - requires auth)
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0, type = 'for-you' } = req.query;
    res.json({
      success: true,
      data: {
        feed: [],
        count: 0,
        limit: parseInt(limit),
        offset: parseInt(offset),
        type
      }
    });
  } catch (error) {
    console.error('Error getting feed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get "For You" personalized feed
router.get('/for-you', verifyFirebaseToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    res.json({
      success: true,
      data: {
        feed: [],
        count: 0,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error getting for-you feed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user profile feed
router.get('/profile', verifyFirebaseToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        profile: {
          userId: req.user.id || req.user.uid,
          posts: [],
          videos: [],
          total: 0
        }
      }
    });
  } catch (error) {
    console.error('Error getting profile feed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update feed preferences
router.post('/preferences', verifyFirebaseToken, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Feed preferences updated',
      data: { preferences: {} }
    });
  } catch (error) {
    console.error('Error updating feed preferences:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Record interaction
router.post('/interaction', verifyFirebaseToken, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Interaction recorded'
    });
  } catch (error) {
    console.error('Error recording interaction:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark as not interested
router.post('/not-interested/:contentId', verifyFirebaseToken, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Content marked as not interested'
    });
  } catch (error) {
    console.error('Error marking not interested:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

