const express = require('express');
const { verifyJWT, requireAdmin } = require('../../middleware/jwtAuth');
const User = require('../../models/User');

const router = express.Router();

// Apply JWT auth and admin middleware to all routes
router.use(verifyJWT);
router.use(requireAdmin);

// @route   GET /api/admin/users
// @desc    Get all users with pagination and filtering (for admin dashboard)
// @access  Admin
router.get('/', async (req, res) => {
  try {
    const { limit = 25, offset = 0, status, role, sortBy = 'createdAt', order = 'desc' } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }
    if (role) {
      query.role = role;
    }

    // Get total count for pagination
    const totalCount = await User.countDocuments(query);

    // Apply sorting, pagination
    const sortOrder = order === 'desc' ? -1 : 1;
    const users = await User.find(query)
      .select('-password') // Never send password
      .sort({ [sortBy]: sortOrder })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

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
    res.status(500).json({ success: false, message: 'Server error while fetching users.' });
  }
});

// @route   GET /api/admin/users/search
// @desc    Search for users by username or email (for admin dashboard)
// @access  Admin
router.get('/search', async (req, res) => {
    try {
        const { q, limit = 20 } = req.query;
        if (!q || q.trim().length < 2) {
            return res.status(400).json({ success: false, message: 'Search query must be at least 2 characters' });
        }

        const searchTerm = q.trim();
        
        // Use MongoDB text search or regex
        const users = await User.find({
            $or: [
                { username: { $regex: searchTerm, $options: 'i' } },
                { email: { $regex: searchTerm, $options: 'i' } }
            ]
        })
        .select('-password')
        .limit(parseInt(limit));

        res.json({ success: true, data: { users } });
    } catch (error) {
        console.error('Admin search users error:', error);
        res.status(500).json({ success: false, message: 'Server error during user search.' });
    }
});

module.exports = router;
