const express = require('express');
const router = express.Router();
const db = require('../../utils/database');
const admin = require('firebase-admin');

// GET /api/admin/stories - List all stories with filters
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      mediaType, 
      search,
      expired 
    } = req.query;

    let query = db.collection('stories');

    // Filter by status
    if (status) {
      query = query.where('status', '==', status);
    }

    // Filter by media type
    if (mediaType) {
      query = query.where('mediaType', '==', mediaType);
    }

    // Filter expired stories
    if (expired === 'true') {
      query = query.where('expiresAt', '<=', admin.firestore.Timestamp.now());
    } else if (expired === 'false') {
      query = query.where('expiresAt', '>', admin.firestore.Timestamp.now());
    }

    // Order by creation date (newest first)
    query = query.orderBy('createdAt', 'desc');

    // Get total count
    const totalSnapshot = await query.get();
    const totalStories = totalSnapshot.size;

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const storiesSnapshot = await query.limit(parseInt(limit)).offset(offset).get();

    let stories = [];
    for (const doc of storiesSnapshot.docs) {
      const storyData = { id: doc.id, ...doc.data() };
      
      // Get user details
      if (storyData.userId) {
        const userDoc = await db.collection('users').doc(storyData.userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          storyData.userName = userData.name || userData.displayName || 'Unknown';
          storyData.userAvatar = userData.photoURL || userData.avatar;
        }
      }

      // Convert timestamps
      if (storyData.createdAt) {
        storyData.createdAt = storyData.createdAt.toDate().toISOString();
      }
      if (storyData.expiresAt) {
        storyData.expiresAt = storyData.expiresAt.toDate().toISOString();
      }

      // Search filter (apply after fetching)
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch = 
          (storyData.caption && storyData.caption.toLowerCase().includes(searchLower)) ||
          (storyData.userName && storyData.userName.toLowerCase().includes(searchLower));
        
        if (matchesSearch) {
          stories.push(storyData);
        }
      } else {
        stories.push(storyData);
      }
    }

    res.json({
      stories,
      totalStories: search ? stories.length : totalStories,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalStories / parseInt(limit))
    });
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
});

// GET /api/admin/stories/stats - Get story statistics
router.get('/stats', async (req, res) => {
  try {
    const now = admin.firestore.Timestamp.now();
    
    // Get total stories
    const totalSnapshot = await db.collection('stories').get();
    const totalStories = totalSnapshot.size;

    // Get active stories (not expired)
    const activeSnapshot = await db.collection('stories')
      .where('expiresAt', '>', now)
      .where('status', '==', 'active')
      .get();
    const activeStories = activeSnapshot.size;

    // Get hidden stories
    const hiddenSnapshot = await db.collection('stories')
      .where('status', '==', 'hidden')
      .get();
    const hiddenStories = hiddenSnapshot.size;

    // Get flagged stories
    const flaggedSnapshot = await db.collection('stories')
      .where('status', '==', 'flagged')
      .get();
    const flaggedStories = flaggedSnapshot.size;

    // Calculate total views and likes
    let totalViews = 0;
    let totalLikes = 0;
    
    totalSnapshot.forEach(doc => {
      const data = doc.data();
      totalViews += data.viewsCount || 0;
      totalLikes += data.likesCount || 0;
    });

    res.json({
      totalStories,
      activeStories,
      hiddenStories,
      flaggedStories,
      expiredStories: totalStories - activeStories - hiddenStories - flaggedStories,
      totalViews,
      totalLikes
    });
  } catch (error) {
    console.error('Get story stats error:', error);
    res.status(500).json({ error: 'Failed to fetch story statistics' });
  }
});

// GET /api/admin/stories/trending - Get trending stories
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const now = admin.firestore.Timestamp.now();

    // Get active, non-expired stories ordered by views
    const storiesSnapshot = await db.collection('stories')
      .where('status', '==', 'active')
      .where('expiresAt', '>', now)
      .orderBy('viewsCount', 'desc')
      .limit(parseInt(limit))
      .get();

    const stories = [];
    for (const doc of storiesSnapshot.docs) {
      const storyData = { id: doc.id, ...doc.data() };
      
      // Get user details
      if (storyData.userId) {
        const userDoc = await db.collection('users').doc(storyData.userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          storyData.userName = userData.name || userData.displayName;
        }
      }

      // Convert timestamps
      if (storyData.createdAt) {
        storyData.createdAt = storyData.createdAt.toDate().toISOString();
      }
      if (storyData.expiresAt) {
        storyData.expiresAt = storyData.expiresAt.toDate().toISOString();
      }

      stories.push(storyData);
    }

    res.json({ stories });
  } catch (error) {
    console.error('Get trending stories error:', error);
    res.status(500).json({ error: 'Failed to fetch trending stories' });
  }
});

// GET /api/admin/stories/:id - Get story details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const storyDoc = await db.collection('stories').doc(id).get();

    if (!storyDoc.exists) {
      return res.status(404).json({ error: 'Story not found' });
    }

    const storyData = { id: storyDoc.id, ...storyDoc.data() };

    // Get user details
    if (storyData.userId) {
      const userDoc = await db.collection('users').doc(storyData.userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        storyData.user = {
          id: userDoc.id,
          name: userData.name || userData.displayName,
          email: userData.email,
          avatar: userData.photoURL || userData.avatar
        };
      }
    }

    // Convert timestamps
    if (storyData.createdAt) {
      storyData.createdAt = storyData.createdAt.toDate().toISOString();
    }
    if (storyData.expiresAt) {
      storyData.expiresAt = storyData.expiresAt.toDate().toISOString();
    }

    res.json({ story: storyData });
  } catch (error) {
    console.error('Get story details error:', error);
    res.status(500).json({ error: 'Failed to fetch story details' });
  }
});

// PUT /api/admin/stories/:id/status - Update story status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['active', 'hidden', 'flagged', 'expired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const storyRef = db.collection('stories').doc(id);
    const storyDoc = await storyRef.get();

    if (!storyDoc.exists) {
      return res.status(404).json({ error: 'Story not found' });
    }

    await storyRef.update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ 
      message: 'Story status updated successfully',
      story: { id, status }
    });
  } catch (error) {
    console.error('Update story status error:', error);
    res.status(500).json({ error: 'Failed to update story status' });
  }
});

// PUT /api/admin/stories/:id/feature - Feature/unfeature a story
router.put('/:id/feature', async (req, res) => {
  try {
    const { id } = req.params;
    const { featured } = req.body;

    const storyRef = db.collection('stories').doc(id);
    const storyDoc = await storyRef.get();

    if (!storyDoc.exists) {
      return res.status(404).json({ error: 'Story not found' });
    }

    await storyRef.update({
      featured: featured === true || featured === 'true',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ 
      message: `Story ${featured ? 'featured' : 'unfeatured'} successfully`,
      story: { id, featured }
    });
  } catch (error) {
    console.error('Feature story error:', error);
    res.status(500).json({ error: 'Failed to feature story' });
  }
});

// DELETE /api/admin/stories/:id - Delete a story
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const storyRef = db.collection('stories').doc(id);
    const storyDoc = await storyRef.get();

    if (!storyDoc.exists) {
      return res.status(404).json({ error: 'Story not found' });
    }

    await storyRef.delete();

    res.json({ message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ error: 'Failed to delete story' });
  }
});

module.exports = router;
