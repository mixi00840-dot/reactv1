const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Content = require('../models/Content');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Store = require('../models/Store');
const SellerApplication = require('../models/SellerApplication');
const Report = require('../models/Report');
const { verifyJWT, requireAdmin } = require('../middleware/jwtAuth');

/**
 * Admin Routes - MongoDB Implementation
 * Admin-specific operations and management
 */

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Admin API is working (MongoDB)',
    database: 'MongoDB'
  });
});

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard stats
 * @access  Admin
 */
router.get('/dashboard', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      bannedUsers,
      totalContent,
      activeContent,
      reportedContent,
      totalProducts,
      pendingProducts,
      totalOrders,
      pendingReports,
      pendingApplications
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'banned' }),
      Content.countDocuments(),
      Content.countDocuments({ status: 'active' }),
      Content.countDocuments({ status: 'reported' }),
      Product.countDocuments(),
      Product.countDocuments({ status: 'pending_approval' }),
      Order.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      SellerApplication.countDocuments({ status: 'pending' })
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          banned: bannedUsers
        },
        content: {
          total: totalContent,
          active: activeContent,
          reported: reportedContent
        },
        products: {
          total: totalProducts,
          pending: pendingProducts
        },
        orders: {
          total: totalOrders
        },
        moderation: {
          pendingReports,
          pendingApplications
        }
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats'
    });
  }
});

/**
 * @route   GET /api/admin/users
 * @desc    Get all users (admin)
 * @access  Admin
 */
router.get('/users', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, status, role, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) query.status = status;
    if (role) query.role = role;

    if (search) {
      query.$text = { $search: search };
    }

    const users = await User.find(query)
      .select('-password')
      .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});

/**
 * @route   POST /api/admin/users
 * @desc    Create new user (admin)
 * @access  Admin
 */
router.post('/users', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { username, email, password, fullName, role = 'user', status = 'active', isVerified = true } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email.toLowerCase() 
          ? 'Email already exists' 
          : 'Username already taken'
      });
    }

    // Create user (password will be hashed by pre-save hook)
    const user = new User({
      username,
      email: email.toLowerCase(),
      password,
      fullName,
      role,
      status,
      isVerified,
      lastLogin: new Date()
    });

    await user.save();

    // Create wallet for user
    const Wallet = require('../models/Wallet');
    const wallet = new Wallet({
      userId: user._id,
      balance: 0
    });
    await wallet.save();

    // Remove password from response
    user.password = undefined;

    res.status(201).json({
      success: true,
      data: { user },
      message: 'User created successfully'
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/admin/users/:id/status
 * @desc    Update user status
 * @access  Admin
 */
router.put('/users/:id/status', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { status, reason } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create strike if banned/suspended
    if (status === 'banned' || status === 'suspended') {
      const Strike = require('../models/Strike');
      const strike = new Strike({
        userId: user._id,
        reason: 'terms_violation',
        description: reason,
        severity: status === 'banned' ? 'critical' : 'major',
        issuedBy: req.userId
      });
      await strike.save();
    }

    res.json({
      success: true,
      data: { user },
      message: `User status updated to ${status}`
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user status'
    });
  }
});

/**
 * @route   GET /api/admin/users/:userId
 * @desc    Get user details by ID (admin)
 * @access  Admin
 */
router.get('/users/:userId', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { populate } = req.query;
    
    let query = User.findById(req.params.userId).select('-password');
    
    // Populate store if requested and user is a seller
    if (populate && populate.includes('storeid')) {
      query = query.populate('storeId', 'name status isVerified');
    }
    
    const user = await query;

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get additional stats
    const [contentCount, followersCount, followingCount] = await Promise.all([
      Content.countDocuments({ userId: user._id }),
      require('../models/Follow').countDocuments({ followingId: user._id }),
      require('../models/Follow').countDocuments({ followerId: user._id })
    ]);

    res.json({
      success: true,
      data: {
        user: {
          ...user.toObject(),
          stats: {
            contentCount,
            followersCount,
            followingCount
          }
        }
      }
    });

  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user details'
    });
  }
});

/**
 * @route   GET /api/admin/users/:userId/activities
 * @desc    Get user activity log
 * @access  Admin
 */
router.get('/users/:userId/activities', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Get recent content, comments, likes, etc.
    const [contents, comments] = await Promise.all([
      Content.find({ userId: req.params.userId })
        .select('caption mediaUrl mediaType viewsCount likesCount createdAt')
        .sort({ createdAt: -1 })
        .limit(5),
      require('../models/Comment').find({ userId: req.params.userId })
        .select('text contentId createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('contentId', 'caption')
    ]);

    // Format activities
    const activities = [
      ...contents.map(c => ({
        type: 'content_posted',
        description: `Posted ${c.mediaType}: ${c.caption?.substring(0, 50) || 'No caption'}`,
        timestamp: c.createdAt,
        metadata: { contentId: c._id, views: c.viewsCount, likes: c.likesCount }
      })),
      ...comments.map(c => ({
        type: 'comment_added',
        description: `Commented: ${c.text?.substring(0, 50)}`,
        timestamp: c.createdAt,
        metadata: { commentId: c._id, contentId: c.contentId?._id }
      }))
    ].sort((a, b) => b.timestamp - a.timestamp).slice(0, parseInt(limit));

    res.json({
      success: true,
      data: {
        activities,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: activities.length
        }
      }
    });

  } catch (error) {
    console.error('Get user activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user activities'
    });
  }
});

/**
 * @route   GET /api/admin/users/:userId/followers
 * @desc    Get user followers
 * @access  Admin
 */
router.get('/users/:userId/followers', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const Follow = require('../models/Follow');
    
    const followers = await Follow.find({ followingId: req.params.userId })
      .populate('followerId', 'username fullName avatar isVerified')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Follow.countDocuments({ followingId: req.params.userId });

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
    console.error('Get user followers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching followers'
    });
  }
});

/**
 * @route   GET /api/admin/users/:userId/following
 * @desc    Get users being followed by this user
 * @access  Admin
 */
router.get('/users/:userId/following', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const Follow = require('../models/Follow');
    
    const following = await Follow.find({ followerId: req.params.userId })
      .populate('followingId', 'username fullName avatar isVerified')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Follow.countDocuments({ followerId: req.params.userId });

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
    console.error('Get user following error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching following'
    });
  }
});

/**
 * @route   GET /api/admin/wallets/:userId/transactions
 * @desc    Get user wallet transactions
 * @access  Admin
 */
router.get('/wallets/:userId/transactions', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const skip = (page - 1) * limit;

    const Transaction = require('../models/Transaction');
    
    const query = { userId: req.params.userId };
    if (type) query.type = type;

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get wallet transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions'
    });
  }
});

/**
 * @route   GET /api/admin/seller-applications
 * @desc    Get seller applications
 * @access  Admin
 */
router.get('/seller-applications', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const applications = await SellerApplication.find({ status })
      .sort({ createdAt: 1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('userId', 'username fullName email avatar');

    const total = await SellerApplication.countDocuments({ status });

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get seller applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications'
    });
  }
});

/**
 * @route   POST /api/admin/seller-applications/:id/approve
 * @desc    Approve seller application
 * @access  Admin
 */
router.post('/seller-applications/:id/approve', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const application = await SellerApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Update user role
    await User.findByIdAndUpdate(application.userId, {
      role: 'seller',
      isSeller: true,
      sellerStatus: 'approved'
    });

    // Create store
    const store = new Store({
      sellerId: application.userId,
      name: application.businessName,
      businessType: application.businessType,
      description: application.description,
      email: application.contactEmail,
      phone: application.contactPhone,
      address: application.address,
      status: 'active',
      isVerified: true,
      verifiedAt: new Date(),
      approvedBy: req.userId,
      approvedAt: new Date()
    });

    await store.save();

    // Update application
    application.status = 'approved';
    application.reviewedBy = req.userId;
    application.reviewedAt = new Date();
    application.storeId = store._id;
    await application.save();

    res.json({
      success: true,
      data: { application, store },
      message: 'Seller application approved'
    });

  } catch (error) {
    console.error('Approve seller error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving seller',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/admin/seller-applications/:id/reject
 * @desc    Reject seller application
 * @access  Admin
 */
router.post('/seller-applications/:id/reject', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;

    const application = await SellerApplication.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        rejectionReason: reason,
        reviewedBy: req.userId,
        reviewedAt: new Date()
      },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      data: { application },
      message: 'Application rejected'
    });

  } catch (error) {
    console.error('Reject seller error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting application'
    });
  }
});

/**
 * @route   PUT /api/admin/users/:id/make-seller
 * @desc    Directly promote user to seller and create store (admin shortcut)
 * @access  Admin
 */
router.put('/users/:id/make-seller', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (user.role === 'seller') {
      return res.status(400).json({
        success: false,
        message: 'User is already a seller',
        data: { user, storeCreated: false }
      });
    }
    
    // Update user role
    user.role = 'seller';
    user.isSeller = true;
    user.sellerStatus = 'approved';
    await user.save();
    
    // Create store for the seller
    const store = new Store({
      sellerId: user._id,
      name: `${user.fullName || user.username}'s Store`,
      description: `Welcome to ${user.fullName || user.username}'s Store`,
      businessType: 'individual',
      status: 'active',
      isVerified: true,
      verifiedAt: new Date(),
      approvedBy: req.userId,
      approvedAt: new Date(),
      settings: {
        isActive: true,
        allowReviews: true,
        autoAcceptOrders: false
      }
    });
    
    await store.save();
    
    // Update user with store reference
    user.storeId = store._id;
    await user.save();
    
    // Populate user data for response
    await user.populate('storeId');
    
    res.json({
      success: true,
      message: 'User promoted to seller and store created successfully',
      data: {
        user,
        store,
        storeCreated: true
      }
    });
    
  } catch (error) {
    console.error('Make seller error:', error);
    res.status(500).json({
      success: false,
      message: 'Error making user a seller',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/uploads
 * @desc    Get all uploads (admin)
 * @access  Admin
 */
router.get('/uploads', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, type, status } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (type && type !== 'all') query.type = type;
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    const uploads = await Content.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('userId', 'username fullName avatar');

    const total = await Content.countDocuments(query);

    res.json({
      success: true,
      data: {
        uploads,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get uploads error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching uploads'
    });
  }
});

/**
 * @route   GET /api/admin/comments
 * @desc    Get all comments (admin)
 * @access  Admin
 */
router.get('/comments', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const Comment = require('../models/Comment');
    const { page = 1, limit = 20, search, status, contentType } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status && status !== 'all') query.status = status;
    if (contentType && contentType !== 'all') query.contentType = contentType;
    if (search) {
      query.text = new RegExp(search, 'i');
    }

    const comments = await Comment.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('userId', 'username fullName avatar')
      .populate('contentId', 'title type');

    const total = await Comment.countDocuments(query);

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comments'
    });
  }
});

/**
 * @route   GET /api/admin/wallets
 * @desc    Get all wallets (admin)
 * @access  Admin
 */
router.get('/wallets', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const Wallet = require('../models/Wallet');
    const { page = 1, limit = 100 } = req.query;
    const skip = (page - 1) * limit;

    const wallets = await Wallet.find()
      .sort({ balance: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('userId', 'username fullName email avatar');

    const total = await Wallet.countDocuments();
    const totalBalance = await Wallet.aggregate([
      { $group: { _id: null, total: { $sum: '$balance' } } }
    ]);

    res.json({
      success: true,
      data: {
        wallets,
        stats: {
          totalWallets: total,
          totalBalance: totalBalance[0]?.total || 0
        },
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get wallets error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching wallets'
    });
  }
});

module.exports = router;

