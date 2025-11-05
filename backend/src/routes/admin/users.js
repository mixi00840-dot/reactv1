const express = require('express');
const { adminMiddleware } = require('../../middleware/auth');
const db = require('../../utils/database');

const router = express.Router();

// @route   GET /api/admin/users
// @desc    Get all users with pagination and filtering (for admin dashboard)
// @access  Admin
router.get('/', adminMiddleware, async (req, res) => {
  try {
    const { limit = 25, offset = 0, status, role, sortBy = 'createdAt', order = 'desc' } = req.query;

    let query = db.collection('users');

    if (status) {
      query = query.where('status', '==', status);
    }
    if (role) {
      query = query.where('role', '==', role);
    }

    // Get total count for pagination before applying limit/offset
    const countSnapshot = await query.get();
    const totalCount = countSnapshot.size;

    // Apply sorting, pagination
    const snapshot = await query.orderBy(sortBy, order).limit(parseInt(limit)).offset(parseInt(offset)).get();
    
    const users = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      delete data.password; // Never send password
      users.push({ id: doc.id, ...data });
    });

    res.json({ 
        success: true, 
        data: { 
            users, 
            total: totalCount,
            page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
            limit: parseInt(limit)
        } 
    });
  } catch (error) {
    console.error('Get all users for admin error:', error);
    if (error.code === 'FAILED_PRECONDITION') {
        return res.status(500).json({ 
            success: false, 
            message: `Query requires a Firestore index. Please create it. Details: ${error.message}` 
        });
    }
    res.status(500).json({ success: false, message: 'Server error while fetching users.' });
  }
});

// @route   GET /api/admin/users/search
// @desc    Search for users by username or email (for admin dashboard)
// @access  Admin
router.get('/search', adminMiddleware, async (req, res) => {
    try {
        const { q, limit = 20 } = req.query;
        if (!q || q.trim().length < 2) {
            return res.status(400).json({ success: false, message: 'Search query must be at least 2 characters' });
        }

        const searchTerm = q.trim().toLowerCase();
        
        // This is an inefficient scan. For production, use a dedicated search service.
        const usersSnapshot = await db.collection('users').get();

        const users = [];
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            if (
                (userData.username && userData.username.toLowerCase().includes(searchTerm)) ||
                (userData.email && userData.email.toLowerCase().includes(searchTerm))
            ) {
                delete userData.password;
                users.push({ id: doc.id, ...userData });
            }
        });

        const limitedUsers = users.slice(0, parseInt(limit));
        res.json({ success: true, data: { users: limitedUsers } });
    } catch (error) {
        console.error('Admin search users error:', error);
        res.status(500).json({ success: false, message: 'Server error during user search.' });
    }
});

module.exports = router;
