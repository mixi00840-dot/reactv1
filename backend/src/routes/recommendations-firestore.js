const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/firebaseAuth');
const recommendationService = require('../services/recommendationService-firestore');
const db = require('../utils/database');

/**
 * Recommendations Routes - Firestore Implementation
 * Provides TikTok-style personalized content recommendations
 */

// Health check
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Recommendations API is operational (Firestore)' });
});

/**
 * GET /api/recommendations
 * Get personalized recommendations for the current user
 * Query params: limit, useCache
 */
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const { limit = 50, useCache = true } = req.query;
    const userId = req.user.id || req.user.uid;

    // Try to get cached recommendations first
    let recommendations = null;
    if (useCache === 'true' || useCache === true) {
      recommendations = await recommendationService.getCachedRecommendations(userId);
    }

    // If no cache or cache expired, generate new recommendations
    if (!recommendations || recommendations.length === 0) {
      const recs = await recommendationService.generateRecommendations(userId, parseInt(limit));
      recommendations = recs;
    }

    // Get full content details for recommendations
    const contentIds = recommendations.map(r => r.contentId).slice(0, parseInt(limit));
    const contentDetails = [];

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
                  fullName: userData.fullName || userData.displayName || '',
                  avatar: userData.avatar || userData.photoURL || '',
                  isVerified: userData.isVerified || false
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

          // Format media
          let media = [];
          if (data.type === 'post' || data.type === 'carousel') {
            if (data.postMetadata?.imageUrls && Array.isArray(data.postMetadata.imageUrls)) {
              media = data.postMetadata.imageUrls.map((img, index) => ({
                id: `${contentId}_${index}`,
                type: 'photo',
                url: img.url,
                thumbnail: img.url,
                width: img.width || null,
                height: img.height || null,
                aspectRatio: img.width && img.height ? img.width / img.height : 1.0
              }));
            }
          } else if (data.media?.masterFile?.url) {
            media = [{
              id: `${contentId}_0`,
              type: data.type === 'video' ? 'video' : 'photo',
              url: data.media.masterFile.url,
              thumbnail: data.media.thumbnail?.url || data.media.masterFile.url,
              duration: data.duration || null,
              width: data.media.masterFile.width || null,
              height: data.media.masterFile.height || null,
              aspectRatio: data.media.masterFile.width && data.media.masterFile.height 
                ? data.media.masterFile.width / data.media.masterFile.height 
                : 1.0
            }];
          }

          const rec = recommendations.find(r => r.contentId === contentId);
          
          contentDetails.push({
            id: contentId,
            userId: data.userId,
            creator: creator || {
              id: data.userId,
              username: 'user',
              fullName: '',
              avatar: '',
              isVerified: false
            },
            type: data.type || 'post',
            media: media,
            caption: data.caption || data.description || '',
            hashtags: data.hashtags?.map(h => typeof h === 'string' ? h : h.normalizedTag || h.tag) || [],
            stats: {
              likes: likeCount,
              comments: commentCount,
              shares: data.shares || 0,
              saves: 0,
              views: data.views || 0
            },
            createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
            // Recommendation metadata
            recommendationScore: rec?.score || 0,
            recommendationReasons: rec?.reasons || []
          });
        }
      } catch (err) {
        console.error(`Error fetching content ${contentId}:`, err);
      }
    }

    res.json({
      success: true,
      data: {
        recommendations: contentDetails,
        count: contentDetails.length,
        algorithm: 'hybrid',
        version: '1.0'
      }
    });

  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

/**
 * POST /api/recommendations/refresh
 * Force refresh recommendations (ignore cache)
 */
router.post('/refresh', verifyFirebaseToken, async (req, res) => {
  try {
    const { limit = 50 } = req.body;
    const userId = req.user.id || req.user.uid;

    const recommendations = await recommendationService.generateRecommendations(userId, parseInt(limit));

    res.json({
      success: true,
      message: 'Recommendations refreshed',
      data: {
        count: recommendations.length
      }
    });

  } catch (error) {
    console.error('Error refreshing recommendations:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

/**
 * GET /api/recommendations/preferences
 * Get user preferences used for recommendations
 */
router.get('/preferences', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.uid;
    const preferences = await recommendationService.analyzeUserPreferences(userId);

    res.json({
      success: true,
      data: preferences
    });

  } catch (error) {
    console.error('Error getting preferences:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;

