const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const db = require('../utils/database'); // Firestore instance
const { authMiddleware } = require('../middleware/auth');
const { uploadMiddleware, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Users API is working (Firestore)',
    endpoints: [
      'GET /profile - Get user profile (requires auth)',
      'PUT /profile - Update user profile (requires auth)',
      'POST /upload-avatar - Upload avatar (requires auth)',
      'GET /stats - Get user statistics (requires auth)',
      'POST /change-password - Change password (requires auth)',
      'GET /search - Search users (requires auth)',
      'POST /:userId/follow - Follow a user (requires auth)',
      'DELETE /:userId/unfollow - Unfollow a user (requires auth)',
      'GET /:userId - Get user by ID',
      'GET /:userId/followers - Get user followers',
      'GET /:userId/following - Get user following'
    ]
  });
});

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = { id: userDoc.id, ...userDoc.data() };
    delete userData.password; // Remove password from response

    // Get wallet data
    const walletDoc = await db.collection('wallets').doc(userId).get();
    const wallet = walletDoc.exists ? { id: walletDoc.id, ...walletDoc.data() } : null;

    // Get active strikes count
    const strikesSnapshot = await db.collection('strikes')
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .get();
    const activeStrikes = strikesSnapshot.size;

    // Get seller application if exists
    const sellerSnapshot = await db.collection('sellerApplications')
      .where('userId', '==', userId)
      .limit(1)
      .get();
    const sellerStatus = !sellerSnapshot.empty ? 
      { id: sellerSnapshot.docs[0].id, ...sellerSnapshot.docs[0].data() } : null;

    res.json({
      success: true,
      data: {
        user: {
          ...userData,
          activeStrikes,
          wallet,
          sellerStatus
        }
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  authMiddleware,
  body('fullName').optional().isLength({ min: 2, max: 100 }),
  body('bio').optional().isLength({ max: 500 }),
  body('phone').optional().isMobilePhone(),
  body('dateOfBirth').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const allowedUpdates = ['fullName', 'bio', 'phone', 'dateOfBirth'];
    const updates = {};

    // Only include allowed fields
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    const userId = req.user.id || req.user._id;
    updates.updatedAt = new Date().toISOString();

    await db.collection('users').doc(userId).update(updates);

    // Get updated user
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = { id: userDoc.id, ...userDoc.data() };
    delete userData.password;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: userData }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
});

// @route   POST /api/users/upload-avatar
// @desc    Upload user avatar
// @access  Private
router.post('/upload-avatar', [
  authMiddleware,
  uploadMiddleware.avatar,
  handleUploadError
], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No avatar file uploaded'
      });
    }

    const userId = req.user.id || req.user._id;
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    await db.collection('users').doc(userId).update({
      avatar: avatarUrl,
      updatedAt: new Date().toISOString()
    });

    // Get updated user
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = { id: userDoc.id, ...userDoc.data() };
    delete userData.password;

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        user: userData,
        avatarUrl
      }
    });

  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading avatar'
    });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    const user = userDoc.data();

    // Get wallet data
    const walletDoc = await db.collection('wallets').doc(userId).get();
    const wallet = walletDoc.exists ? walletDoc.data() : null;

    // Get active strikes count
    const strikesSnapshot = await db.collection('strikes')
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .get();
    const activeStrikes = strikesSnapshot.size;

    // Get seller application
    const sellerSnapshot = await db.collection('sellerApplications')
      .where('userId', '==', userId)
      .limit(1)
      .get();
    const sellerStatus = !sellerSnapshot.empty ? sellerSnapshot.docs[0].data() : null;

    const stats = {
      profile: {
        followersCount: user.followersCount || 0,
        followingCount: user.followingCount || 0,
        videosCount: user.videosCount || 0,
        postsCount: user.postsCount || 0,
        commentsCount: user.commentsCount || 0,
        likesReceived: user.likesReceived || 0,
        profileViews: user.profileViews || 0
      },
      wallet: wallet ? {
        balance: wallet.balance || 0,
        totalEarnings: wallet.totalEarnings || 0,
        totalSpendings: wallet.totalSpendings || 0,
        supportLevel: wallet.supportLevel || 1,
        monthlyEarnings: wallet.monthlyEarnings || 0,
        monthlySpendings: wallet.monthlySpendings || 0
      } : null,
      account: {
        isVerified: user.isVerified || false,
        isFeatured: user.isFeatured || false,
        activeStrikes,
        memberSince: user.createdAt,
        lastLogin: user.lastLogin
      },
      seller: sellerStatus ? {
        status: sellerStatus.status,
        submittedAt: sellerStatus.submittedAt,
        reviewedAt: sellerStatus.reviewedAt
      } : null
    };

    res.json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching stats'
    });
  }
});

// @route   POST /api/users/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', [
  authMiddleware,
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id || req.user._id;

    // Get user with password
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = userDoc.data();

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, userData.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.collection('users').doc(userId).update({
      password: hashedPassword,
      updatedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while changing password'
    });
  }
});

// @route   GET /api/users/search
// @desc    Search users by username or fullName
// @access  Private
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const searchTerm = q.trim().toLowerCase();
    
    // Firestore doesn't support full-text search, so we'll do prefix matching
    // For production, consider using Algolia or Elasticsearch for better search
    const usersSnapshot = await db.collection('users')
      .where('status', '==', 'active')
      .limit(parseInt(limit) * 2) // Get more to filter
      .get();

    const users = [];
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      const username = (userData.username || '').toLowerCase();
      const fullName = (userData.fullName || '').toLowerCase();
      
      if (username.includes(searchTerm) || fullName.includes(searchTerm)) {
        users.push({
          id: doc.id,
          username: userData.username,
          fullName: userData.fullName,
          avatar: userData.avatar,
          isVerified: userData.isVerified,
          followersCount: userData.followersCount || 0
        });
      }
    });

    // Limit results
    const limitedUsers = users.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: { users: limitedUsers }
    });
    
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching users'
    });
  }
});

// @route   POST /api/users/:userId/follow
// @desc    Follow a user
// @access  Private
router.post('/:userId/follow', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id || req.user._id;
    
    if (userId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself'
      });
    }
    
    // Check if target user exists
    const userToFollowDoc = await db.collection('users').doc(userId).get();
    if (!userToFollowDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if already following
    const followDoc = await db.collection('follows')
      .where('followerId', '==', currentUserId)
      .where('followingId', '==', userId)
      .limit(1)
      .get();
    
    if (!followDoc.empty) {
      return res.status(400).json({
        success: false,
        message: 'You are already following this user'
      });
    }
    
    // Create follow relationship
    const batch = db.batch();
    
    const followRef = db.collection('follows').doc();
    batch.set(followRef, {
      followerId: currentUserId,
      followingId: userId,
      createdAt: new Date().toISOString()
    });
    
    // Update follower count
    const currentUserRef = db.collection('users').doc(currentUserId);
    const targetUserRef = db.collection('users').doc(userId);
    
    const currentUserDoc = await currentUserRef.get();
    const targetUserDoc = await targetUserRef.get();
    
    batch.update(currentUserRef, {
      followingCount: (currentUserDoc.data().followingCount || 0) + 1,
      updatedAt: new Date().toISOString()
    });
    
    batch.update(targetUserRef, {
      followersCount: (targetUserDoc.data().followersCount || 0) + 1,
      updatedAt: new Date().toISOString()
    });
    
    await batch.commit();
    
    res.json({
      success: true,
      message: 'User followed successfully'
    });
    
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while following user'
    });
  }
});

// @route   DELETE /api/users/:userId/unfollow
// @desc    Unfollow a user
// @access  Private
router.delete('/:userId/unfollow', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id || req.user._id;
    
    if (userId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid operation'
      });
    }
    
    // Find follow relationship
    const followSnapshot = await db.collection('follows')
      .where('followerId', '==', currentUserId)
      .where('followingId', '==', userId)
      .limit(1)
      .get();
    
    if (followSnapshot.empty) {
      return res.status(400).json({
        success: false,
        message: 'You are not following this user'
      });
    }
    
    // Delete follow relationship and update counts
    const batch = db.batch();
    
    const followDoc = followSnapshot.docs[0];
    batch.delete(followDoc.ref);
    
    // Update follower counts
    const currentUserRef = db.collection('users').doc(currentUserId);
    const targetUserRef = db.collection('users').doc(userId);
    
    const currentUserDoc = await currentUserRef.get();
    const targetUserDoc = await targetUserRef.get();
    
    batch.update(currentUserRef, {
      followingCount: Math.max(0, (currentUserDoc.data().followingCount || 0) - 1),
      updatedAt: new Date().toISOString()
    });
    
    batch.update(targetUserRef, {
      followersCount: Math.max(0, (targetUserDoc.data().followersCount || 0) - 1),
      updatedAt: new Date().toISOString()
    });
    
    await batch.commit();
    
    res.json({
      success: true,
      message: 'User unfollowed successfully'
    });
    
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while unfollowing user'
    });
  }
});

// @route   GET /api/users/:userId
// @desc    Get user by ID (public profile)
// @access  Public
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const userData = userDoc.data();
    
    // Return public profile data only
    const publicProfile = {
      id: userDoc.id,
      username: userData.username,
      fullName: userData.fullName,
      avatar: userData.avatar,
      bio: userData.bio,
      isVerified: userData.isVerified,
      isFeatured: userData.isFeatured,
      followersCount: userData.followersCount || 0,
      followingCount: userData.followingCount || 0,
      videosCount: userData.videosCount || 0,
      postsCount: userData.postsCount || 0,
      likesReceived: userData.likesReceived || 0,
      createdAt: userData.createdAt
    };
    
    res.json({
      success: true,
      data: { user: publicProfile }
    });
    
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user'
    });
  }
});

// @route   GET /api/users/:userId/followers
// @desc    Get user followers list
// @access  Public
router.get('/:userId/followers', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    // Get followers
    const followsSnapshot = await db.collection('follows')
      .where('followingId', '==', userId)
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .get();
    
    const followerIds = followsSnapshot.docs.map(doc => doc.data().followerId);
    
    if (followerIds.length === 0) {
      return res.json({
        success: true,
        data: { followers: [], total: 0 }
      });
    }
    
    // Get follower user data (Firestore 'in' query supports up to 10 items)
    const followers = [];
    for (let i = 0; i < followerIds.length; i += 10) {
      const batch = followerIds.slice(i, i + 10);
      const usersSnapshot = await db.collection('users')
        .where('__name__', 'in', batch)
        .get();
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        followers.push({
          id: doc.id,
          username: userData.username,
          fullName: userData.fullName,
          avatar: userData.avatar,
          isVerified: userData.isVerified,
          followersCount: userData.followersCount || 0
        });
      });
    }
    
    res.json({
      success: true,
      data: {
        followers,
        total: followsSnapshot.size
      }
    });
    
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching followers'
    });
  }
});

// @route   GET /api/users/:userId/following
// @desc    Get user following list
// @access  Public
router.get('/:userId/following', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    // Get following
    const followsSnapshot = await db.collection('follows')
      .where('followerId', '==', userId)
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .get();
    
    const followingIds = followsSnapshot.docs.map(doc => doc.data().followingId);
    
    if (followingIds.length === 0) {
      return res.json({
        success: true,
        data: { following: [], total: 0 }
      });
    }
    
    // Get following user data
    const following = [];
    for (let i = 0; i < followingIds.length; i += 10) {
      const batch = followingIds.slice(i, i + 10);
      const usersSnapshot = await db.collection('users')
        .where('__name__', 'in', batch)
        .get();
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        following.push({
          id: doc.id,
          username: userData.username,
          fullName: userData.fullName,
          avatar: userData.avatar,
          isVerified: userData.isVerified,
          followersCount: userData.followersCount || 0
        });
      });
    }
    
    res.json({
      success: true,
      data: {
        following,
        total: followsSnapshot.size
      }
    });
    
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching following'
    });
  }
});

module.exports = router;
