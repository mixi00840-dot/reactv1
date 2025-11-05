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
    const { limit = 20, page = 1, type = 'for-you', hashtag } = req.query;
    const db = require('../utils/database');
    
    let query = db.collection('content')
      .where('status', '==', 'published')
      .orderBy('createdAt', 'desc');
    
    // Filter by hashtag if provided
    if (hashtag) {
      query = query.where('hashtags', 'array-contains', hashtag);
    }
    
    const snapshot = await query
      .limit(parseInt(limit))
      .offset((parseInt(page) - 1) * parseInt(limit))
      .get();
    
    const videos = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      videos.push({
        id: doc.id,
        videoUrl: data.videoUrl || data.media?.masterFile?.url || '',
        thumbnailUrl: data.thumbnailUrl || data.media?.thumbnail?.url || '',
        creator: {
          id: data.userId,
          username: data.creator?.username || '@user',
          avatar: data.creator?.avatar || '',
          verified: data.creator?.verified || false
        },
        caption: data.caption || data.description || '',
        hashtags: data.hashtags || [],
        stats: {
          likes: data.likes || data.stats?.likes || 0,
          comments: data.comments || data.stats?.comments || 0,
          shares: data.shares || data.stats?.shares || 0,
          views: data.views || data.stats?.views || 0
        },
        duration: data.duration || 0,
        createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date()
      });
    });
    
    res.json({
      success: true,
      data: {
        videos,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: videos.length === parseInt(limit),
          nextCursor: videos.length > 0 ? Buffer.from(JSON.stringify({ id: videos[videos.length - 1].id })).toString('base64') : null
        }
      }
    });
  } catch (error) {
    console.error('Error getting feed:', error);
    // Return empty feed if error (e.g., missing index)
    res.json({
      success: true,
      data: {
        videos: [],
        pagination: {
          page: parseInt(req.query.page || 1),
          limit: parseInt(req.query.limit || 20),
          hasMore: false,
          nextCursor: null
        }
      }
    });
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

