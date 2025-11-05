const express = require('express');
const { verifyFirebaseToken, requireAdmin } = require('../middleware/firebaseAuth');
const db = require('../utils/database');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Users API is working (Firestore)',
    endpoints: [
      'GET /profile - Get user profile (requires Firebase auth)',
      'GET /stats - Get user statistics (requires admin)',
      'GET /:userId - Get user by ID'
    ]
  });
});

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private (Firebase Auth)
router.get('/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id || req.user.uid;
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = { id: userDoc.id, ...userDoc.data() };
    delete userData.password;

    res.json({
      success: true,
      data: { user: userData }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
});

// @route   GET /api/users
// @desc    Get all users (admin)
// @access  Admin (Firebase Auth)
router.get('/', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const { limit = 25, offset = 0, status, role, search, verified, page = 1 } = req.query;

    let query = db.collection('users');

    // Handle filtering - avoid composite indexes by doing client-side filtering when needed
    try {
      if (status && !role) {
        // Status + orderBy requires index, so fetch all and filter client-side
        const snapshot = await query.orderBy('createdAt', 'desc').get();
        
        let users = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.status === status) {
            delete data.password;
            users.push({ id: doc.id, ...data });
          }
        });

        // Apply search filter if provided
        if (search) {
          const searchLower = search.toLowerCase();
          users = users.filter(u => 
            u.username?.toLowerCase().includes(searchLower) ||
            u.email?.toLowerCase().includes(searchLower) ||
            u.fullName?.toLowerCase().includes(searchLower)
          );
        }

        // Apply verified filter if provided
        if (verified !== undefined) {
          const isVerified = verified === 'true' || verified === true;
          users = users.filter(u => u.isVerified === isVerified);
        }

        // Apply pagination
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const paginatedUsers = users.slice(startIndex, startIndex + parseInt(limit));

        return res.json({ 
          success: true, 
          data: { 
            users: paginatedUsers, 
            count: users.length,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: users.length,
              pages: Math.ceil(users.length / parseInt(limit))
            }
          } 
        });
      } else if (role && !status) {
        query = query.where('role', '==', role);
      }
      
      // If no status filter or both filters, use indexed query
      const snapshot = await query.orderBy('createdAt', 'desc').limit(parseInt(limit)).offset(parseInt(offset)).get();
      
      let users = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        delete data.password;
        users.push({ id: doc.id, ...data });
      });

      // Apply search filter if provided
      if (search) {
        const searchLower = search.toLowerCase();
        users = users.filter(u => 
          u.username?.toLowerCase().includes(searchLower) ||
          u.email?.toLowerCase().includes(searchLower) ||
          u.fullName?.toLowerCase().includes(searchLower)
        );
      }

      // Apply verified filter if provided
      if (verified !== undefined) {
        const isVerified = verified === 'true' || verified === true;
        users = users.filter(u => u.isVerified === isVerified);
      }

      res.json({ success: true, data: { users, count: users.length } });
    } catch (queryError) {
      // Fallback: fetch all users and filter client-side
      console.warn('Query failed, falling back to client-side filtering:', queryError.message);
      const snapshot = await db.collection('users').get();
      
      let users = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        delete data.password;
        users.push({ id: doc.id, ...data });
      });

      // Apply all filters client-side
      if (status) {
        users = users.filter(u => u.status === status);
      }
      if (role) {
        users = users.filter(u => u.role === role);
      }
      if (search) {
        const searchLower = search.toLowerCase();
        users = users.filter(u => 
          u.username?.toLowerCase().includes(searchLower) ||
          u.email?.toLowerCase().includes(searchLower) ||
          u.fullName?.toLowerCase().includes(searchLower)
        );
      }
      if (verified !== undefined) {
        const isVerified = verified === 'true' || verified === true;
        users = users.filter(u => u.isVerified === isVerified);
      }

      // Sort by createdAt desc
      users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Apply pagination
      const startIndex = (parseInt(page) - 1) * parseInt(limit);
      const paginatedUsers = users.slice(startIndex, startIndex + parseInt(limit));

      res.json({ 
        success: true, 
        data: { 
          users: paginatedUsers, 
          count: users.length,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: users.length,
            pages: Math.ceil(users.length / parseInt(limit))
          }
        } 
      });
    }
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics (admin only)
// @access  Admin (Firebase Auth)
router.get('/stats', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    
    let total = 0;
    let active = 0;
    let banned = 0;
    let suspended = 0;
    let verified = 0;
    let featured = 0;
    let sellers = 0;
    let admins = 0;
    
    usersSnapshot.forEach(doc => {
      const user = doc.data();
      total++;
      if (user.status === 'active') active++;
      if (user.status === 'banned') banned++;
      if (user.status === 'suspended') suspended++;
      if (user.isVerified) verified++;
      if (user.isFeatured) featured++;
      if (user.role === 'seller') sellers++;
      if (user.role === 'admin') admins++;
    });
    
    // Get recent signups (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentSnapshot = await db.collection('users')
      .where('createdAt', '>=', sevenDaysAgo.toISOString())
      .get();
    
    const recentSignups = recentSnapshot.size;
    
    res.json({
      success: true,
      data: {
        stats: {
          total,
          active,
          banned,
          suspended,
          verified,
          featured,
          sellers,
          admins,
          recentSignups
        }
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/users/search
// @desc    Search for users by username or email
// @access  Admin
router.get('/search', verifyFirebaseToken, requireAdmin, async (req, res) => {
    try {
        const { q, limit = 20 } = req.query;
        if (!q || q.trim().length < 2) {
            return res.status(400).json({ success: false, message: 'Search query must be at least 2 characters' });
        }

        const searchTerm = q.trim().toLowerCase();
        
        const usersSnapshot = await db.collection('users').limit(parseInt(limit) * 2).get();

        const users = [];
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            const username = (userData.username || '').toLowerCase();
            const email = (userData.email || '').toLowerCase();
            
            if (username.includes(searchTerm) || email.includes(searchTerm)) {
                delete userData.password;
                users.push({ id: doc.id, ...userData });
            }
        });

        const limitedUsers = users.slice(0, parseInt(limit));
        res.json({ success: true, data: { users: limitedUsers } });
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


// @route   POST /api/users/:userId/follow
// @desc    Follow or unfollow a user
// @access  Private (Firebase Auth)
router.post('/:userId/follow', verifyFirebaseToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id || req.user.uid;
    
    if (userId === currentUserId) {
      return res.status(400).json({ success: false, message: 'Cannot follow yourself' });
    }
    
    const followDocId = `${currentUserId}_${userId}`;
    const followDoc = await db.collection('follows').doc(followDocId).get();
    
    if (followDoc.exists) {
      // Unfollow
      await followDoc.ref.delete();
      
      // Get follower count
      const followerSnapshot = await db.collection('follows')
        .where('followingId', '==', userId)
        .count()
        .get();
      
      const followerCount = followerSnapshot.data().count || 0;
      
      return res.json({
        success: true,
        data: { isFollowing: false, followerCount }
      });
    } else {
      // Follow
      await db.collection('follows').doc(followDocId).set({
        followerId: currentUserId,
        followingId: userId,
        createdAt: new Date()
      });
      
      // Get follower count
      const followerSnapshot = await db.collection('follows')
        .where('followingId', '==', userId)
        .count()
        .get();
      
      const followerCount = followerSnapshot.data().count || 0;
      
      return res.json({
        success: true,
        data: { isFollowing: true, followerCount }
      });
    }
  } catch (error) {
    console.error('Follow/unfollow error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/users/:userId
// @desc    Get user by ID
// @access  Public
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userData = userDoc.data();
    delete userData.password;
    
    // Get follower/following counts
    const followerSnapshot = await db.collection('follows')
      .where('followingId', '==', userId)
      .count()
      .get();
    const followingSnapshot = await db.collection('follows')
      .where('followerId', '==', userId)
      .count()
      .get();
    
    // Check if current user follows this user
    let isFollowing = false;
    if (req.headers.authorization) {
      try {
        const { verifyFirebaseToken } = require('../middleware/firebaseAuth');
        // Quick check without full middleware
        const currentUserId = req.user?.id || req.user?.uid;
        if (currentUserId) {
          const followDoc = await db.collection('follows')
            .doc(`${currentUserId}_${userId}`)
            .get();
          isFollowing = followDoc.exists;
        }
      } catch (e) {
        // Not authenticated, isFollowing stays false
      }
    }

    res.json({ 
      success: true, 
      data: { 
        user: { 
          id: userDoc.id, 
          ...userData,
          stats: {
            followers: followerSnapshot.data().count || 0,
            following: followingSnapshot.data().count || 0,
            videos: 0 // TODO: Count from content collection
          },
          isFollowing
        } 
      } 
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
