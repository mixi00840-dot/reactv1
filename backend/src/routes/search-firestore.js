const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/firebaseAuth');
const db = require('../utils/database');

/**
 * Search Routes - Firestore Implementation
 */

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Search API is operational (Firestore)' });
});

// Search endpoint
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const { q, type = 'all', page = 1, limit = 20 } = req.query;
    
    if (!q || q.trim().length < 1) {
      return res.status(400).json({ success: false, message: 'Search query required' });
    }
    
    const query = q.trim();
    const searchLower = query.toLowerCase();
    const hashtag = query.startsWith('#') ? query.substring(1) : query;
    
    const results = {
      hashtags: [],
      users: [],
      videos: []
    };
    
    // Search hashtags
    if (type === 'hashtag' || type === 'all') {
      try {
        const contentSnapshot = await db.collection('content')
          .where('hashtags', 'array-contains', hashtag)
          .limit(parseInt(limit))
          .get();
        
        const videoCount = contentSnapshot.size;
        if (videoCount > 0) {
          results.hashtags.push({
            hashtag: `#${hashtag}`,
            videoCount,
            trending: false // TODO: Calculate from trending data
          });
          
          // Get video details
          contentSnapshot.forEach(doc => {
            const data = doc.data();
            results.videos.push({
              id: doc.id,
              ...data
            });
          });
        }
      } catch (error) {
        console.error('Error searching hashtags:', error);
        // Continue with other searches
      }
    }
    
    // Search users
    if (type === 'user' || type === 'all') {
      try {
        const usersSnapshot = await db.collection('users')
          .limit(parseInt(limit) * 2)
          .get();
        
        const matchingUsers = [];
        usersSnapshot.forEach(doc => {
          const userData = doc.data();
          const username = (userData.username || '').toLowerCase();
          const displayName = (userData.displayName || userData.fullName || '').toLowerCase();
          
          if (username.includes(searchLower) || displayName.includes(searchLower)) {
            delete userData.password;
            matchingUsers.push({
              id: doc.id,
              ...userData
            });
          }
        });
        
        results.users = matchingUsers.slice(0, parseInt(limit));
      } catch (error) {
        console.error('Error searching users:', error);
      }
    }
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

