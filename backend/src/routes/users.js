const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Follow = require('../models/Follow');
const Content = require('../models/Content');
const { verifyJWT, optionalAuth } = require('../middleware/jwtAuth');
const { uploadMiddleware } = require('../middleware/upload');

/**
 * Users Routes - MongoDB Implementation
 * Replaces users-firestore.js with MongoDB queries
 */

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Users API is working (MongoDB)',
    database: 'MongoDB',
    endpoints: [
      'GET /profile - Get current user profile',
      'PUT /profile - Update current user profile',
      'GET /:userId - Get user by ID',
      'POST /:userId/follow - Follow/unfollow user',
      'GET /:userId/followers - Get user followers',
      'GET /:userId/following - Get users being followed'
    ]
  });
});

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', verifyJWT, async (req, res) => {
  try {
    const user = req.user; // Already populated by verifyJWT middleware

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/profile', verifyJWT, async (req, res) => {
  try {
    const { fullName, bio, website, dateOfBirth, gender, phone, socialLinks, privacySettings, notificationSettings } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update allowed fields
    if (fullName !== undefined) user.fullName = fullName;
    if (bio !== undefined) user.bio = bio;
    if (website !== undefined) user.website = website;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (gender !== undefined) user.gender = gender;
    if (phone !== undefined) user.phone = phone;
    if (socialLinks !== undefined) user.socialLinks = { ...user.socialLinks, ...socialLinks };
    if (privacySettings !== undefined) user.privacySettings = { ...user.privacySettings, ...privacySettings };
    if (notificationSettings !== undefined) user.notificationSettings = { ...user.notificationSettings, ...notificationSettings };

    await user.save();

    res.json({
      success: true,
      data: { user },
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/users/:userId
 * @desc    Get user by ID
 * @access  Public (optional auth for follow status)
 */
router.get('/:userId', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get follower/following counts
    const [followersCount, followingCount, videosCount] = await Promise.all([
      Follow.countDocuments({ followingId: userId }),
      Follow.countDocuments({ followerId: userId }),
      Content.countDocuments({ userId, status: 'active' })
    ]);

    // Check if current user follows this user
    let isFollowing = false;
    if (currentUserId) {
      const follow = await Follow.findOne({
        followerId: currentUserId,
        followingId: userId
      });
      isFollowing = !!follow;
    }

    const userResponse = user.toJSON();
    userResponse.stats = {
      followers: followersCount,
      following: followingCount,
      videos: videosCount
    };
    userResponse.isFollowing = isFollowing;

    res.json({
      success: true,
      data: { user: userResponse }
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @route   POST /api/users/:userId/follow
 * @desc    Follow or unfollow a user
 * @access  Private
 */
router.post('/:userId/follow', verifyJWT, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    if (userId === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot follow yourself'
      });
    }

    // Check if already following
    const existingFollow = await Follow.findOne({
      followerId: currentUserId,
      followingId: userId
    });

    if (existingFollow) {
      // Unfollow
      await existingFollow.deleteOne();
      
      // Update user counts
      await User.findByIdAndUpdate(userId, { $inc: { followersCount: -1 } });
      await User.findByIdAndUpdate(currentUserId, { $inc: { followingCount: -1 } });
      
      const followerCount = await Follow.countDocuments({ followingId: userId });

      return res.json({
        success: true,
        data: { isFollowing: false, followerCount },
        message: 'Unfollowed successfully'
      });
    } else {
      // Follow
      const follow = new Follow({
        followerId: currentUserId,
        followingId: userId
      });
      
      await follow.save();
      
      // Update user counts
      await User.findByIdAndUpdate(userId, { $inc: { followersCount: 1 } });
      await User.findByIdAndUpdate(currentUserId, { $inc: { followingCount: 1 } });
      
      const followerCount = await Follow.countDocuments({ followingId: userId });

      // TODO: Create notification for followed user

      return res.json({
        success: true,
        data: { isFollowing: true, followerCount },
        message: 'Followed successfully'
      });
    }

  } catch (error) {
    console.error('Follow/unfollow error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/users/:userId/followers
 * @desc    Get user followers
 * @access  Public
 */
router.get('/:userId/followers', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const followers = await Follow.find({ followingId: userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('followerId', 'username fullName avatar isVerified');

    const total = await Follow.countDocuments({ followingId: userId });

    res.json({
      success: true,
      data: {
        followers: followers.map(f => f.followerId),
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching followers'
    });
  }
});

/**
 * @route   GET /api/users/:userId/following
 * @desc    Get users being followed
 * @access  Public
 */
router.get('/:userId/following', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const following = await Follow.find({ followerId: userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('followingId', 'username fullName avatar isVerified');

    const total = await Follow.countDocuments({ followerId: userId });

    res.json({
      success: true,
      data: {
        following: following.map(f => f.followingId),
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching following'
    });
  }
});

/**
 * @route   GET /api/users/search
 * @desc    Search users
 * @access  Public
 */
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    // Text search
    const users = await User.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } }
    )
    .select('-password')
    .sort({ score: { $meta: 'textScore' } })
    .limit(parseInt(limit));

    res.json({
      success: true,
      data: { users }
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching users'
    });
  }
});

module.exports = router;
