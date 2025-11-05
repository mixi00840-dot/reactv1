const express = require('express');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const db = require('../utils/database');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authMiddleware, async (req, res) => {
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
// @access  Admin
router.get('/', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { limit = 25, offset = 0, status, role } = req.query;

    let query = db.collection('users');

    if (status) {
      query = query.where('status', '==', status);
    }
    if (role) {
      query = query.where('role', '==', role);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').limit(parseInt(limit)).offset(parseInt(offset)).get();
    
    const users = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      delete data.password;
      users.push({ id: doc.id, ...data });
    });

    res.json({ success: true, data: { users, count: users.length } });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/users/search
// @desc    Search for users by username or email
// @access  Admin
router.get('/search', [authMiddleware, adminMiddleware], async (req, res) => {
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

    res.json({ success: true, data: { user: { id: userDoc.id, ...userData } } });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
