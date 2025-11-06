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

// Get "For You" personalized feed (uses recommendation engine)
router.get('/for-you', verifyFirebaseToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const userId = req.user.id || req.user.uid;
    
    // Use recommendation service for personalized feed
    const recommendationService = require('../services/recommendationService-firestore');
    const recommendations = await recommendationService.generateRecommendations(
      userId, 
      parseInt(limit) + parseInt(offset)
    );

    // Get content details (skip offset items)
    const contentIds = recommendations
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit))
      .map(r => r.contentId);

    const db = require('../utils/database');
    const feedItems = [];

    for (const contentId of contentIds) {
      try {
        const contentDoc = await db.collection('content').doc(contentId).get();
        if (contentDoc.exists) {
          const data = contentDoc.data();
          
          // Get creator info
          let creator = null;
          if (data.userId) {
            try {
              const userDoc = await db.collection('users').doc(data.userId).get();
              if (userDoc.exists) {
                const userData = userDoc.data();
                creator = {
                  id: userDoc.id,
                  username: userData.username || userData.email?.split('@')[0] || 'user',
                  avatar: userData.avatar || userData.photoURL || '',
                  verified: userData.isVerified || false
                };
              }
            } catch (err) {
              console.error('Error fetching creator:', err);
            }
          }

          // Get stats
          const likesSnapshot = await db.collection('contentLikes')
            .where('contentId', '==', contentId)
            .count()
            .get();
          const likeCount = likesSnapshot.data().count || 0;

          const commentsSnapshot = await db.collection('comments')
            .where('contentId', '==', contentId)
            .count()
            .get();
          const commentCount = commentsSnapshot.data().count || 0;

          feedItems.push({
            id: contentId,
            videoUrl: data.media?.masterFile?.url || '',
            thumbnailUrl: data.media?.thumbnail?.url || '',
            creator: creator || {
              id: data.userId,
              username: '@user',
              avatar: '',
              verified: false
            },
            caption: data.caption || data.description || '',
            hashtags: data.hashtags?.map(h => typeof h === 'string' ? h : h.normalizedTag || h.tag) || [],
            stats: {
              likes: likeCount,
              comments: commentCount,
              shares: data.shares || 0,
              views: data.views || 0
            },
            duration: data.duration || 0,
            createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date()
          });
        }
      } catch (err) {
        console.error(`Error fetching content ${contentId}:`, err);
      }
    }

    res.json({
      success: true,
      data: {
        feed: feedItems,
        count: feedItems.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: recommendations.length > parseInt(offset) + parseInt(limit)
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
    const { contentId, interactionType, watchTime, completionRate, metadata } = req.body;
    const userId = req.user.id || req.user.uid;
    const db = require('../utils/database');
    const { FieldValue } = require('@google-cloud/firestore');

    if (!contentId || !interactionType) {
      return res.status(400).json({
        success: false,
        message: 'contentId and interactionType are required'
      });
    }

    // Record interaction in userActivities collection
    const activityData = {
      userId: userId,
      activityType: interactionType, // 'view', 'like', 'comment', 'share', 'follow'
      targetType: 'content',
      targetId: contentId,
      metadata: {
        watchTime: watchTime || 0,
        completionRate: completionRate || 0,
        ...metadata
      },
      timestamp: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp()
    };

    await db.collection('userActivities').add(activityData);

    // Update content engagement metrics if needed
    if (interactionType === 'view' && watchTime) {
      // Track view time for analytics
      await db.collection('contentViews').add({
        contentId: contentId,
        userId: userId,
        watchTime: watchTime,
        completionRate: completionRate || 0,
        timestamp: FieldValue.serverTimestamp()
      });
    }

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
    const { contentId } = req.params;
    const userId = req.user.id || req.user.uid;
    const db = require('../utils/database');
    const { FieldValue } = require('@google-cloud/firestore');

    // Record as not interested interaction
    await db.collection('userActivities').add({
      userId: userId,
      activityType: 'not_interested',
      targetType: 'content',
      targetId: contentId,
      timestamp: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp()
    });

    // Store in notInterested collection for quick filtering
    await db.collection('notInterested').doc(`${userId}_${contentId}`).set({
      userId: userId,
      contentId: contentId,
      createdAt: FieldValue.serverTimestamp()
    });

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

