const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/firebaseAuth');

/**
 * Content Routes - Firestore Stub
 */

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Content API is operational (Firestore stub)' });
});

// Get all content (root endpoint - requires auth)
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0, type, userId } = req.query;
    res.json({
      success: true,
      data: {
        content: [],
        count: 0,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error getting content:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get content by ID
router.get('/:contentId', verifyFirebaseToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        content: {
          id: req.params.contentId,
          type: 'video',
          title: '',
          description: '',
          views: 0,
          likes: 0,
          comments: 0
        }
      }
    });
  } catch (error) {
    console.error('Error getting content:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create content
router.post('/', verifyFirebaseToken, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Content created',
      data: { content: { id: 'new-content-id' } }
    });
  } catch (error) {
    console.error('Error creating content:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update content
router.put('/:contentId', verifyFirebaseToken, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Content updated',
      data: { content: { id: req.params.contentId } }
    });
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete content
router.delete('/:contentId', verifyFirebaseToken, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Content deleted'
    });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Like/Unlike content
router.post('/:contentId/like', verifyFirebaseToken, async (req, res) => {
  try {
    const { contentId } = req.params;
    const userId = req.user.id || req.user.uid;
    const db = require('../utils/database');
    
    // Check if already liked
    const likeDoc = await db.collection('contentLikes')
      .doc(`${contentId}_${userId}`)
      .get();
    
    if (likeDoc.exists) {
      // Unlike
      await likeDoc.ref.delete();
      const likeSnapshot = await db.collection('contentLikes')
        .where('contentId', '==', contentId)
        .count()
        .get();
      
      const likeCount = likeSnapshot.data().count || 0;
      
      return res.json({
        success: true,
        data: { liked: false, likeCount }
      });
    } else {
      // Like
      await db.collection('contentLikes').doc(`${contentId}_${userId}`).set({
        contentId,
        userId,
        createdAt: new Date()
      });
      
      const likeSnapshot = await db.collection('contentLikes')
        .where('contentId', '==', contentId)
        .count()
        .get();
      
      const likeCount = likeSnapshot.data().count || 0;
      
      return res.json({
        success: true,
        data: { liked: true, likeCount }
      });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

