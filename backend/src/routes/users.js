const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { Wallet } = require('../models/Wallet');
const SellerApplication = require('../models/SellerApplication');
const Strike = require('../models/Strike');
const { authMiddleware } = require('../middleware/auth');
const { uploadMiddleware, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('wallet')
      .populate('sellerStatus');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get active strikes count
    const activeStrikes = await Strike.countActiveStrikes(user._id);

    res.json({
      success: true,
      data: {
        user: {
          ...user.toObject(),
          activeStrikes
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

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
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

    // Update user avatar
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        user,
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
    const user = await User.findById(req.user._id).select('-password');
    const wallet = await Wallet.findOne({ userId: req.user._id });
    const activeStrikes = await Strike.countActiveStrikes(req.user._id);
    const sellerStatus = await SellerApplication.findOne({ userId: req.user._id });

    const stats = {
      profile: {
        followersCount: user.followersCount,
        followingCount: user.followingCount,
        videosCount: user.videosCount,
        postsCount: user.postsCount,
        commentsCount: user.commentsCount,
        likesReceived: user.likesReceived,
        profileViews: user.profileViews
      },
      wallet: wallet ? {
        balance: wallet.balance,
        totalEarnings: wallet.totalEarnings,
        totalSpendings: wallet.totalSpendings,
        supportLevel: wallet.supportLevel,
        monthlyEarnings: wallet.monthlyEarnings,
        monthlySpendings: wallet.monthlySpendings
      } : null,
      account: {
        isVerified: user.isVerified,
        isFeatured: user.isFeatured,
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

// @route   GET /api/users/notifications
// @desc    Get user notifications (placeholder)
// @access  Private
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    // In a real implementation, you would fetch from a notifications collection
    // For now, return recent strikes and important updates
    
    const recentStrikes = await Strike.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('issuedBy', 'username fullName');

    const sellerApplication = await SellerApplication.findOne({ userId: req.user._id });

    const notifications = [];

    // Add strike notifications
    recentStrikes.forEach(strike => {
      notifications.push({
        id: strike._id,
        type: 'strike',
        title: `${strike.type.charAt(0).toUpperCase() + strike.type.slice(1)} Issued`,
        message: strike.reason,
        createdAt: strike.createdAt,
        read: false,
        severity: strike.severity
      });
    });

    // Add seller application status notification
    if (sellerApplication && sellerApplication.reviewedAt) {
      notifications.push({
        id: sellerApplication._id,
        type: 'seller_application',
        title: `Seller Application ${sellerApplication.status.charAt(0).toUpperCase() + sellerApplication.status.slice(1)}`,
        message: sellerApplication.status === 'approved' 
          ? 'Congratulations! Your seller application has been approved.'
          : `Your seller application was ${sellerApplication.status}. ${sellerApplication.rejectionReason || ''}`,
        createdAt: sellerApplication.reviewedAt,
        read: false,
        severity: sellerApplication.status === 'approved' ? 'low' : 'medium'
      });
    }

    // Sort by most recent
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: {
        notifications: notifications.slice(0, 20), // Return latest 20
        unreadCount: notifications.filter(n => !n.read).length
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notifications'
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

    // Get user with password
    const user = await User.findById(req.user._id);

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

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
    
    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { fullName: { $regex: q, $options: 'i' } }
      ],
      status: 'active'
    })
    .select('username fullName avatar isVerified followersCount')
    .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: { users }
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
    
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself'
      });
    }
    
    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const currentUser = await User.findById(req.user._id);
    
    // Check if already following
    if (currentUser.following && currentUser.following.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Already following this user'
      });
    }
    
    // Add to following/followers
    if (!currentUser.following) currentUser.following = [];
    if (!userToFollow.followers) userToFollow.followers = [];
    
    currentUser.following.push(userId);
    currentUser.followingCount = currentUser.following.length;
    
    userToFollow.followers.push(req.user._id);
    userToFollow.followersCount = userToFollow.followers.length;
    
    await currentUser.save();
    await userToFollow.save();
    
    res.json({
      success: true,
      message: 'User followed successfully',
      data: {
        isFollowing: true,
        followersCount: userToFollow.followersCount
      }
    });
    
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while following user'
    });
  }
});

// @route   DELETE /api/users/:userId/follow
// @desc    Unfollow a user
// @access  Private
router.delete('/:userId/follow', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userToUnfollow = await User.findById(userId);
    if (!userToUnfollow) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const currentUser = await User.findById(req.user._id);
    
    // Remove from following/followers
    if (currentUser.following) {
      currentUser.following = currentUser.following.filter(
        id => id.toString() !== userId
      );
      currentUser.followingCount = currentUser.following.length;
    }
    
    if (userToUnfollow.followers) {
      userToUnfollow.followers = userToUnfollow.followers.filter(
        id => id.toString() !== req.user._id.toString()
      );
      userToUnfollow.followersCount = userToUnfollow.followers.length;
    }
    
    await currentUser.save();
    await userToUnfollow.save();
    
    res.json({
      success: true,
      message: 'User unfollowed successfully',
      data: {
        isFollowing: false,
        followersCount: userToUnfollow.followersCount
      }
    });
    
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while unfollowing user'
    });
  }
});

module.exports = router;