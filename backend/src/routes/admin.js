const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const SellerApplication = require('../models/SellerApplication');
const { Wallet } = require('../models/Wallet');
const Strike = require('../models/Strike');
const Store = require('../models/Store');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Health check endpoint (no auth required) - MUST be before middleware
router.get('/health', async (req, res) => {
  res.json({
    success: true,
    message: 'Admin API is operational',
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /api/admin/dashboard',
      'GET /api/admin/users',
      'POST /api/admin/users',
      'GET /api/admin/seller-applications',
      'GET /api/admin/uploads',
      'GET /api/admin/content',
      'GET /api/admin/comments',
      'GET /api/admin/analytics',
      'GET /api/admin/gifts/stats',
      'GET /api/admin/coin-packages',
      'GET /api/admin/levels',
      'GET /api/admin/tags',
      'GET /api/admin/explorer/sections'
    ]
  });
});

// Apply auth and admin middleware to all routes AFTER health check
router.use(authMiddleware);
router.use(adminMiddleware);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Admin
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      bannedUsers,
      suspendedUsers,
      verifiedUsers,
      featuredUsers,
      pendingSellerApps,
      approvedSellers,
      totalStrikes,
      activeStrikes
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'banned' }),
      User.countDocuments({ status: 'suspended' }),
      User.countDocuments({ isVerified: true }),
      User.countDocuments({ isFeatured: true }),
      SellerApplication.countDocuments({ status: 'pending' }),
      SellerApplication.countDocuments({ status: 'approved' }),
      Strike.countDocuments(),
      Strike.countDocuments({ status: 'active' })
    ]);

    // Get top earners
    const topEarners = await Wallet.find()
      .populate('userId', 'username fullName avatar isVerified')
      .sort({ totalEarnings: -1 })
      .limit(10);

    // Get recent registrations
    const recentUsers = await User.find()
      .select('username fullName avatar createdAt status')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get monthly stats (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyRegistrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    const stats = {
      overview: {
        totalUsers,
        activeUsers,
        bannedUsers,
        suspendedUsers,
        verifiedUsers,
        featuredUsers,
        pendingSellerApps,
        approvedSellers,
        totalStrikes,
        activeStrikes
      },
      topEarners: topEarners.map(wallet => ({
        user: wallet.userId,
        totalEarnings: wallet.totalEarnings,
        supportLevel: wallet.supportLevel
      })),
      recentUsers,
      monthlyRegistrations
    };

    res.json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard data'
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination and filters
// @access  Admin
router.get('/users', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = '',
      verified = '',
      featured = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter query
    const filter = {};

    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      filter.status = status;
    }

    if (verified !== '') {
      filter.isVerified = verified === 'true';
    }

    if (featured !== '') {
      filter.isFeatured = featured === 'true';
    }

    // Build sort query
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [users, totalUsers] = await Promise.all([
      User.find(filter)
        .select('-password')
        .populate('wallet', 'balance totalEarnings supportLevel')
        .populate('sellerStatus', 'status submittedAt')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(filter)
    ]);

    // Get active strikes for each user
    const usersWithStrikes = await Promise.all(
      users.map(async (user) => {
        const activeStrikes = await Strike.countActiveStrikes(user._id);
        return {
          ...user.toObject(),
          activeStrikes
        };
      })
    );

    const totalPages = Math.ceil(totalUsers / limitNum);

    res.json({
      success: true,
      data: {
        users: usersWithStrikes,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalUsers,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get specific user details with comprehensive data
// @access  Admin
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('wallet')
      .populate('sellerStatus');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user strikes
    const strikes = await Strike.find({ userId: user._id })
      .populate('issuedBy', 'username fullName')
      .sort({ createdAt: -1 });

    const activeStrikes = await Strike.countActiveStrikes(user._id);

    // Mock additional data for comprehensive user profile
    // In a real app, these would come from separate collections/services
    const userExtendedData = {
      // Content Statistics
      contentStats: {
        totalVideos: Math.floor(Math.random() * 50) + 5,
        totalViews: Math.floor(Math.random() * 100000) + 1000,
        totalLikes: Math.floor(Math.random() * 10000) + 500,
        totalComments: Math.floor(Math.random() * 5000) + 200,
        totalShares: Math.floor(Math.random() * 2000) + 100
      },
      
      // Social Statistics  
      socialStats: {
        followersCount: Math.floor(Math.random() * 10000) + 100,
        followingCount: Math.floor(Math.random() * 1000) + 50,
        mutualFollows: Math.floor(Math.random() * 500) + 10
      },

      // Recent Activities (mock data)
      recentActivities: [
        {
          action: 'Posted a video',
          timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          details: 'Dancing Challenge #trending'
        },
        {
          action: 'Went live',
          timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          details: 'Live cooking session - 234 viewers'
        },
        {
          action: 'Updated profile',
          timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          details: 'Changed bio and avatar'
        }
      ],

      // Engagement Metrics
      engagementMetrics: {
        averageViewDuration: Math.floor(Math.random() * 60) + 30, // seconds
        engagementRate: (Math.random() * 10 + 2).toFixed(2), // percentage
        topPerformingContent: 'Dance videos',
        peakActivity: 'Evening (6-9 PM)'
      },

      // Verification Documents (if seller)
      documents: user.role === 'seller' ? {
        idDocument: {
          uploaded: true,
          verified: user.isVerified,
          uploadDate: user.createdAt
        },
        businessLicense: {
          uploaded: Math.random() > 0.5,
          verified: Math.random() > 0.3,
          uploadDate: user.createdAt
        }
      } : {},

      // Device and Location Info
      deviceInfo: {
        lastActiveDevice: ['iOS', 'Android', 'Web'][Math.floor(Math.random() * 3)],
        lastActiveLocation: ['United States', 'Canada', 'United Kingdom'][Math.floor(Math.random() * 3)],
        lastLoginDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      }
    };

    res.json({
      success: true,
      data: {
        user: {
          ...user.toObject(),
          activeStrikes,
          ...userExtendedData
        },
        strikes
      }
    });

  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user details'
    });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user details (general edit)
// @access  Admin
router.put('/users/:id', [
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('fullName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Full name must be between 2 and 50 characters'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio must not exceed 500 characters'),
  body('role')
    .optional()
    .isIn(['user', 'seller'])
    .withMessage('Invalid role'),
  body('isVerified')
    .optional()
    .isBoolean()
    .withMessage('isVerified must be a boolean'),
  body('isFeatured')
    .optional()
    .isBoolean()
    .withMessage('isFeatured must be a boolean'),
  body('isBanned')
    .optional()
    .isBoolean()
    .withMessage('isBanned must be a boolean')
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

    const userId = req.params.id;
    const updateData = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if username or email already exists (if being updated)
    if (updateData.username && updateData.username !== user.username) {
      const existingUser = await User.findOne({ username: updateData.username });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        });
      }
    }

    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await User.findOne({ email: updateData.email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        ...updateData,
        updatedAt: new Date()
      },
      { 
        new: true,
        runValidators: true
      }
    ).select('-password');

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user'
    });
  }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Update user status (ban, suspend, activate)
// @access  Admin
router.put('/users/:id/status', [
  body('status')
    .isIn(['active', 'suspended', 'banned'])
    .withMessage('Invalid status'),
  body('reason')
    .optional()
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters')
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

    const { status, reason } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from changing other admin status
    if (user.role === 'admin' && user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify other admin accounts'
      });
    }

    const oldStatus = user.status;
    user.status = status;
    await user.save();

    // Create strike/warning if banning or suspending
    if ((status === 'banned' || status === 'suspended') && reason) {
      const strike = new Strike({
        userId,
        type: status === 'banned' ? 'strike' : 'warning',
        severity: status === 'banned' ? 'critical' : 'high',
        reason,
        actionTaken: status === 'banned' ? 'account_banned' : 'account_suspended',
        issuedBy: req.user._id
      });
      await strike.save();
    }

    res.json({
      success: true,
      message: `User status updated from ${oldStatus} to ${status}`,
      data: { user: user.toObject() }
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user status'
    });
  }
});

// @route   PUT /api/admin/users/:id/verify
// @desc    Toggle user verification status & auto-create store for sellers
// @access  Admin
router.put('/users/:id/verify', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const wasUnverified = !user.isVerified;
    user.isVerified = !user.isVerified;

    let storeCreated = false;

    // SMART WORKFLOW: Auto-upgrade to seller & create store when verifying
    // Works for both regular users and users already marked as sellers
    if (wasUnverified && user.isVerified) {
      // Upgrade user to seller if not already
      if (user.role === 'user') {
        user.role = 'seller';
        console.log(`✅ Upgraded ${user.fullName} from user to seller`);
      }
      
      // Check if store already exists for ANY user being verified
      let store = await Store.findOne({ ownerId: user._id });
      
      if (!store && user.role === 'seller') {
        // Auto-create store with user's details
        const storeName = `${user.fullName}'s Store`;
        const storeSlug = storeName.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        try {
          store = await Store.create({
            storeName: storeName,
            storeSlug: `${storeSlug}-${user._id.toString().slice(-6)}`,
            description: `Welcome to ${user.fullName}'s official store!`,
            shortDescription: `Quality products from ${user.fullName}`,
            ownerId: user._id,
            
            // Use user's avatar as store logo
            logo: user.avatar || null,
            
            // Inherit contact information
            contactInfo: {
              email: user.email,
              phone: user.phone || '',
              website: ''
            },
            
            // Use user's address if available
            address: {
              street: user.address?.street || '',
              city: user.address?.city || '',
              state: user.address?.state || '',
              zipCode: user.address?.zipCode || '',
              country: user.address?.country || 'US'
            },
            
            // Set as business type
            businessInfo: {
              businessType: 'individual',
              taxId: '',
              businessLicense: ''
            },
            
            // Start as active and verified
            status: 'active',
            isVerified: true,
            isFeatured: false
          });

          storeCreated = true;
          console.log(`✅ Auto-created store for seller: ${user.fullName} (${store.storeName})`);
        } catch (storeError) {
          console.error('Error creating store:', storeError);
          // Continue anyway - user verification should succeed even if store creation fails
        }
      }
    }
    
    await user.save();

    res.json({
      success: true,
      message: user.isVerified 
        ? (storeCreated ? 'User verified, upgraded to seller, and store created automatically!' : 
           user.role === 'seller' ? 'User verified as seller!' : 'User verified successfully')
        : 'User unverified successfully',
      data: { 
        user: user.toObject(),
        storeCreated: storeCreated
      }
    });

  } catch (error) {
    console.error('Toggle verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating verification status',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/users/:id/feature
// @desc    Toggle user featured status
// @access  Admin
router.put('/users/:id/feature', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isFeatured = !user.isFeatured;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      data: { user: user.toObject() }
    });

  } catch (error) {
    console.error('Toggle featured error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating featured status'
    });
  }
});

// @route   PUT /api/admin/users/:id/make-seller
// @desc    Convert user to seller & auto-create store
// @access  Admin
router.put('/users/:id/make-seller', async (req, res) => {
  console.log('🔵 Make-seller endpoint called for user:', req.params.id);
  
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      console.log('❌ User not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`📋 User found: ${user.fullName} (${user.email}), Current role: ${user.role}`);

    if (user.role === 'seller') {
      console.log('⚠️ User is already a seller');
      return res.status(400).json({
        success: false,
        message: 'User is already a seller'
      });
    }

    // Upgrade to seller
    user.role = 'seller';
    user.isVerified = true;
    
    // Check if store already exists
    let store = await Store.findOne({ ownerId: user._id });
    let storeCreated = false;
    
    console.log(`🔍 Checking for existing store... Found: ${store ? 'YES' : 'NO'}`);
    
    if (!store) {
      // Auto-create store with user's details
      const storeName = `${user.fullName}'s Store`;
      const storeSlug = storeName.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      console.log(`🏪 Creating store: ${storeName} (${storeSlug})`);
      
      store = await Store.create({
        storeName: storeName,
        storeSlug: `${storeSlug}-${user._id.toString().slice(-6)}`,
        description: `Welcome to ${user.fullName}'s official store!`,
        shortDescription: `Quality products from ${user.fullName}`,
        ownerId: user._id,
        logo: user.avatar || null,
        contactInfo: {
          email: user.email,
          phone: user.phone || '000-000-0000', // Default placeholder if empty
          website: ''
        },
        address: {
          street: user.address?.street || 'Not provided',
          city: user.address?.city || 'Not provided',
          state: user.address?.state || 'N/A',
          zipCode: user.address?.zipCode || '00000',
          country: user.address?.country || 'US'
        },
        businessInfo: {
          businessType: 'individual',
          taxId: '',
          businessLicense: ''
        },
        status: 'active',
        isVerified: true,
        isFeatured: false
      });

      storeCreated = true;
      console.log(`✅ Store created successfully! Store ID: ${store._id}`);
    } else {
      console.log(`ℹ️ Using existing store: ${store.storeName}`);
    }
    
    await user.save();
    console.log(`✅ User role updated to seller and saved!`);

    res.json({
      success: true,
      message: storeCreated 
        ? 'User converted to seller and store created automatically!' 
        : 'User converted to seller!',
      data: { 
        user: user.toObject(),
        store: store ? store.toObject() : null,
        storeCreated
      }
    });
    
    console.log(`🎉 Make-seller completed successfully for ${user.fullName}`);

  } catch (error) {
    console.error('❌ Make seller error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while converting user to seller',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/users/:id/ban
// @desc    Ban or unban user
// @access  Admin
router.put('/users/:id/ban', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Toggle ban status
    const newStatus = user.status === 'banned' ? 'active' : 'banned';
    user.status = newStatus;
    await user.save();

    res.json({
      success: true,
      message: `User ${newStatus === 'banned' ? 'banned' : 'unbanned'} successfully`,
      data: { user: user.toObject() }
    });

  } catch (error) {
    console.error('Toggle ban error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating ban status'
    });
  }
});

// @route   PUT /api/admin/users/:id/unban
// @desc    Unban user (alias for ban toggle)
// @access  Admin
router.put('/users/:id/unban', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.status = 'active';
    await user.save();

    res.json({
      success: true,
      message: 'User unbanned successfully',
      data: { user: user.toObject() }
    });

  } catch (error) {
    console.error('Unban user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while unbanning user'
    });
  }
});

// @route   PUT /api/admin/users/:id/feature
// @desc    Feature or unfeature user (alias for feature toggle)
// @access  Admin
router.put('/users/:id/feature', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isFeatured = !user.isFeatured;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      data: { user: user.toObject() }
    });

  } catch (error) {
    console.error('Toggle feature error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating featured status'
    });
  }
});

// @route   PUT /api/admin/users/:id/unfeature
// @desc    Unfeature user
// @access  Admin
router.put('/users/:id/unfeature', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isFeatured = false;
    await user.save();

    res.json({
      success: true,
      message: 'User unfeatured successfully',
      data: { user: user.toObject() }
    });

  } catch (error) {
    console.error('Unfeature user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while unfeaturing user'
    });
  }
});

// @route   PUT /api/admin/users/:id/explore-limit
// @desc    Toggle user explore limitation
// @access  Admin
router.put('/users/:id/explore-limit', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isLimitedFromExplore = !user.isLimitedFromExplore;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isLimitedFromExplore ? 'limited from' : 'allowed in'} explore successfully`,
      data: { user: user.toObject() }
    });

  } catch (error) {
    console.error('Toggle explore limit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating explore limitation'
    });
  }
});

// ==================== POST METHOD ALIASES FOR API COMPATIBILITY ====================
// These aliases ensure compatibility with frontend expecting POST methods

// @route   POST /api/admin/users/:id/verify
// @desc    Verify user (POST alias for PUT)
// @access  Admin
router.post('/users/:id/verify', async (req, res) => {
  req.method = 'PUT';
  return router.handle(req, res);
});

// @route   POST /api/admin/users/:id/feature
// @desc    Feature user (POST alias for PUT)
// @access  Admin
router.post('/users/:id/feature', async (req, res) => {
  req.method = 'PUT';
  return router.handle(req, res);
});

// @route   POST /api/admin/users/:id/ban
// @desc    Ban user (POST alias for PUT)
// @access  Admin
router.post('/users/:id/ban', async (req, res) => {
  req.method = 'PUT';
  return router.handle(req, res);
});

// @route   POST /api/admin/users/:id/unban
// @desc    Unban user (POST alias for PUT)
// @access  Admin
router.post('/users/:id/unban', async (req, res) => {
  req.method = 'PUT';
  return router.handle(req, res);
});

// @route   PATCH /api/admin/users/:id
// @desc    Update user (PATCH alias for PUT)
// @access  Admin
router.patch('/users/:id', async (req, res) => {
  req.method = 'PUT';
  return router.handle(req, res);
});

// @route   GET /api/admin/seller-applications
// @desc    Get all seller applications with pagination and filters
// @access  Admin
router.get('/seller-applications', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = '',
      sortBy = 'submittedAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter query
    const filter = {};
    if (status) {
      filter.status = status;
    }

    // Build sort query
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [applications, totalApplications] = await Promise.all([
      SellerApplication.find(filter)
        .populate('userId', 'username fullName email avatar createdAt')
        .populate('reviewedBy', 'username fullName')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      SellerApplication.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalApplications / limitNum);

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalApplications,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      }
    });

  } catch (error) {
    console.error('Get seller applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching seller applications'
    });
  }
});

// @route   GET /api/admin/seller-applications/:id
// @desc    Get specific seller application details
// @access  Admin
router.get('/seller-applications/:id', async (req, res) => {
  try {
    const application = await SellerApplication.findById(req.params.id)
      .populate('userId', 'username fullName email avatar phone createdAt')
      .populate('reviewedBy', 'username fullName');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Seller application not found'
      });
    }

    res.json({
      success: true,
      data: { application }
    });

  } catch (error) {
    console.error('Get seller application details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching application details'
    });
  }
});

// @route   PUT /api/admin/seller-applications/:id/approve
// @desc    Approve seller application & auto-create store with user details
// @access  Admin
router.put('/seller-applications/:id/approve', [
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
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

    const { notes = '' } = req.body;
    const application = await SellerApplication.findById(req.params.id).populate('userId');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Seller application not found'
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only approve pending applications'
      });
    }

    // Approve the application
    await application.approve(req.user._id, notes);

    // SMART WORKFLOW: Auto-upgrade user to seller & create store
    const user = await User.findById(application.userId._id || application.userId);
    
    if (user) {
      // Upgrade to seller role
      user.role = 'seller';
      user.isVerified = true;
      
      // Check if store already exists
      let store = await Store.findOne({ ownerId: user._id });
      
      if (!store) {
        // Auto-create store with user's profile details
        const storeName = `${user.fullName}'s Store`;
        const storeSlug = storeName.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        store = await Store.create({
          storeName: storeName,
          storeSlug: `${storeSlug}-${user._id.toString().slice(-6)}`,
          description: application.businessInfo?.description || `Welcome to ${user.fullName}'s official store!`,
          shortDescription: `Quality products from ${user.fullName}`,
          ownerId: user._id,
          
          // Use user's avatar as store logo
          logo: user.avatar || null,
          
          // Inherit contact information
          contactInfo: {
            email: user.email,
            phone: user.phone || application.businessInfo?.phone || '',
            website: application.businessInfo?.website || ''
          },
          
          // Use user's or application address
          address: {
            street: user.address?.street || application.businessInfo?.address?.street || '',
            city: user.address?.city || application.businessInfo?.address?.city || '',
            state: user.address?.state || application.businessInfo?.address?.state || '',
            zipCode: user.address?.zipCode || application.businessInfo?.address?.zipCode || '',
            country: user.address?.country || application.businessInfo?.address?.country || 'US'
          },
          
          // Business information from application
          businessInfo: {
            businessType: application.businessInfo?.businessType || 'individual',
            taxId: application.businessInfo?.taxId || '',
            businessLicense: application.businessInfo?.businessLicense || ''
          },
          
          // Start as active and verified
          status: 'active',
          isVerified: true,
          isFeatured: false
        });

        console.log(`✅ Auto-created store for approved seller: ${user.fullName}`);
      }
      
      await user.save();
    }

    await application.populate('userId', 'username fullName email');

    res.json({
      success: true,
      message: 'Seller application approved! User upgraded to seller and store created automatically.',
      data: { 
        application,
        storeCreated: true
      }
    });

  } catch (error) {
    console.error('Approve seller application error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while approving application',
      error: error.message
    });
  }
});

// @route   POST /api/admin/seller-applications/:id/approve
// @desc    Approve seller application (POST alias)
// @access  Admin
router.post('/seller-applications/:id/approve', async (req, res) => {
  req.method = 'PUT';
  return router.handle(req, res);
});

// @route   PUT /api/admin/seller-applications/:id/reject
// @desc    Reject seller application
// @access  Admin
router.put('/seller-applications/:id/reject', [
  body('reason')
    .notEmpty()
    .withMessage('Rejection reason is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
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

    const { reason, notes = '' } = req.body;
    const application = await SellerApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Seller application not found'
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only reject pending applications'
      });
    }

    // Reject the application
    await application.reject(req.user._id, reason, notes);
    await application.populate('userId', 'username fullName email');

    res.json({
      success: true,
      message: 'Seller application rejected successfully',
      data: { application }
    });

  } catch (error) {
    console.error('Reject seller application error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting application'
    });
  }
});

// @route   POST /api/admin/strikes
// @desc    Issue a strike/warning to user
// @access  Admin
router.post('/strikes', [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID'),
  body('type')
    .isIn(['warning', 'strike', 'final_warning'])
    .withMessage('Invalid strike type'),
  body('severity')
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid severity level'),
  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters'),
  body('actionTaken')
    .isIn(['content_removed', 'account_suspended', 'account_banned', 'content_hidden', 'feature_restricted', 'warning_issued'])
    .withMessage('Invalid action taken'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('Invalid expiry date')
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

    const {
      userId,
      type,
      severity,
      reason,
      description,
      actionTaken,
      relatedContentType,
      relatedContentId,
      expiresAt
    } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create strike
    const strike = new Strike({
      userId,
      type,
      severity,
      reason,
      description,
      actionTaken,
      relatedContentType,
      relatedContentId,
      issuedBy: req.user._id,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });

    await strike.save();
    await strike.populate('userId', 'username fullName email');
    await strike.populate('issuedBy', 'username fullName');

    res.status(201).json({
      success: true,
      message: 'Strike issued successfully',
      data: { strike }
    });

  } catch (error) {
    console.error('Issue strike error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while issuing strike'
    });
  }
});

// @route   GET /api/admin/strikes
// @desc    Get all strikes with pagination and filters
// @access  Admin
router.get('/strikes', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      userId = '',
      type = '',
      severity = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter query
    const filter = {};
    if (userId) filter.userId = userId;
    if (type) filter.type = type;
    if (severity) filter.severity = severity;
    if (status) filter.status = status;

    // Build sort query
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [strikes, totalStrikes] = await Promise.all([
      Strike.find(filter)
        .populate('userId', 'username fullName avatar')
        .populate('issuedBy', 'username fullName')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Strike.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalStrikes / limitNum);

    res.json({
      success: true,
      data: {
        strikes,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalStrikes,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      }
    });

  } catch (error) {
    console.error('Get strikes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching strikes'
    });
  }
});

// @route   POST /api/admin/users
// @desc    Create user manually
// @access  Admin
router.post('/users', [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('fullName')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('dateOfBirth')
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Invalid role')
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

    const { username, email, password, fullName, dateOfBirth, phone, bio, role = 'user' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email 
          ? 'Email already registered' 
          : 'Username already taken'
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      fullName,
      dateOfBirth,
      phone,
      bio,
      role
    });

    await user.save();

    // Create wallet for new user
    const wallet = new Wallet({
      userId: user._id
    });
    await wallet.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user: userResponse }
    });

  } catch (error) {
    console.error('Create user error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during user creation'
    });
  }
});

// @route   GET /api/admin/categories
// @desc    Get all categories for admin
// @access  Admin
router.get('/categories', async (req, res) => {
  try {
    const { Category } = require('../models/Category');
    const categories = await Category.find()
      .select('_id name slug description status')
      .sort('name');
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories'
    });
  }
});

// @route   POST /api/admin/categories
// @desc    Create a new category
// @access  Admin
router.post('/categories', [
  body('name').notEmpty().withMessage('Category name is required'),
  body('description').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { Category } = require('../models/Category');
    const { name, description, status = 'active' } = req.body;
    
    const slug = name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-');
    
    const category = new Category({
      name,
      slug,
      description,
      status
    });
    
    await category.save();
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Error creating category:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating category'
    });
  }
});

// @route   GET /api/admin/transactions
// @desc    Get all transactions
// @access  Admin
router.get('/transactions', async (req, res) => {
  try {
    const { Transaction } = require('../models/Transaction');
    const { page = 1, limit = 20, type } = req.query;
    
    const query = {};
    if (type) query.type = type;
    
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((page - 1) * limit)
      .populate('userId', 'username fullName avatar');
    
    const total = await Transaction.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions'
    });
  }
});

// @route   GET /api/admin/uploads
// @desc    Get upload statistics and management
// @access  Admin
router.get('/uploads', async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    
    // For now, return mock data since we don't have an uploads model
    const uploads = {
      total: 150,
      totalSize: '2.4GB',
      recentUploads: [],
      typeBreakdown: {
        images: 45,
        videos: 30,
        audio: 25,
        documents: 20,
        other: 30
      },
      statusBreakdown: {
        pending: 15,
        approved: 120,
        rejected: 10,
        processing: 5
      }
    };
    
    res.json({
      success: true,
      data: uploads,
      pagination: {
        total: uploads.total,
        page: parseInt(page),
        pages: Math.ceil(uploads.total / limit)
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

// @route   GET /api/admin/comments
// @desc    Get comments for moderation
// @access  Admin
router.get('/comments', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    
    // For now, return mock data since we don't have a comments model properly set up
    const comments = {
      total: 89,
      comments: [],
      statusBreakdown: {
        pending: 12,
        approved: 65,
        rejected: 8,
        flagged: 4
      }
    };
    
    res.json({
      success: true,
      data: comments,
      pagination: {
        total: comments.total,
        page: parseInt(page),
        pages: Math.ceil(comments.total / limit)
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

// @route   GET /api/admin/gifts/stats
// @desc    Get gifts statistics
// @access  Admin
router.get('/gifts/stats', async (req, res) => {
  try {
    const giftsStats = {
      totalGifts: 150,
      totalValue: 125000,
      activeGifts: 120,
      pendingGifts: 15,
      categories: {
        hearts: 45,
        diamonds: 25,
        roses: 30,
        cars: 20,
        other: 30
      },
      topGifts: [],
      recentActivity: []
    };
    
    res.json({
      success: true,
      data: giftsStats
    });
  } catch (error) {
    console.error('Get gifts stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching gifts statistics'
    });
  }
});

// @route   GET /api/admin/coin-packages
// @desc    Get coin packages management
// @access  Admin
router.get('/coin-packages', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const coinPackages = {
      total: 12,
      packages: [
        { id: 1, name: '100 Coins', price: 0.99, coins: 100, isActive: true },
        { id: 2, name: '500 Coins', price: 4.99, coins: 500, isActive: true },
        { id: 3, name: '1000 Coins', price: 9.99, coins: 1000, isActive: true },
        { id: 4, name: '5000 Coins', price: 49.99, coins: 5000, isActive: true }
      ],
      stats: {
        totalSales: 15000,
        totalRevenue: 75000,
        averagePackageValue: 12.50
      }
    };
    
    res.json({
      success: true,
      data: coinPackages,
      pagination: {
        total: coinPackages.total,
        page: parseInt(page),
        pages: Math.ceil(coinPackages.total / limit)
      }
    });
  } catch (error) {
    console.error('Get coin packages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching coin packages'
    });
  }
});

// @route   GET /api/admin/coin-packages/stats
// @desc    Get coin packages statistics
// @access  Admin
router.get('/coin-packages/stats', async (req, res) => {
  try {
    const stats = {
      totalPackages: 12,
      totalSales: 15000,
      totalRevenue: 75000,
      conversionRate: 12.5,
      topPackages: [],
      salesTrend: []
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get coin packages stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching coin packages statistics'
    });
  }
});

// @route   GET /api/admin/levels
// @desc    Get user levels management
// @access  Admin
router.get('/levels', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const levels = {
      total: 50,
      levels: [
        { id: 1, level: 1, name: 'Newbie', minXP: 0, maxXP: 100, users: 1250 },
        { id: 2, level: 2, name: 'Rising Star', minXP: 100, maxXP: 500, users: 850 },
        { id: 3, level: 3, name: 'Creator', minXP: 500, maxXP: 1000, users: 450 },
        { id: 4, level: 4, name: 'Influencer', minXP: 1000, maxXP: 5000, users: 200 }
      ],
      totalUsers: 2750
    };
    
    res.json({
      success: true,
      data: levels,
      pagination: {
        total: levels.total,
        page: parseInt(page),
        pages: Math.ceil(levels.total / limit)
      }
    });
  } catch (error) {
    console.error('Get levels error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching levels'
    });
  }
});

// @route   GET /api/admin/levels/stats
// @desc    Get levels statistics
// @access  Admin
router.get('/levels/stats', async (req, res) => {
  try {
    const stats = {
      totalLevels: 50,
      totalUsers: 2750,
      averageLevel: 2.8,
      levelDistribution: {
        1: 45,
        2: 30,
        3: 16,
        4: 7,
        5: 2
      },
      progressionRate: 85.5
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get levels stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching levels statistics'
    });
  }
});

// @route   GET /api/admin/tags
// @desc    Get tags management
// @access  Admin
router.get('/tags', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    const tags = {
      total: 150,
      tags: [
        { id: 1, name: 'dance', usageCount: 5500, isActive: true, isTrending: true },
        { id: 2, name: 'music', usageCount: 4200, isActive: true, isTrending: true },
        { id: 3, name: 'comedy', usageCount: 3800, isActive: true, isTrending: false },
        { id: 4, name: 'lifestyle', usageCount: 2100, isActive: true, isTrending: false }
      ],
      categories: {
        entertainment: 45,
        music: 30,
        lifestyle: 25,
        education: 15,
        other: 35
      }
    };
    
    res.json({
      success: true,
      data: tags,
      pagination: {
        total: tags.total,
        page: parseInt(page),
        pages: Math.ceil(tags.total / limit)
      }
    });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tags'
    });
  }
});

// @route   GET /api/admin/tags/stats
// @desc    Get tags statistics
// @access  Admin
router.get('/tags/stats', async (req, res) => {
  try {
    const stats = {
      totalTags: 150,
      trendingTags: 15,
      totalUsage: 45000,
      averageUsage: 300,
      topTags: [],
      newTagsThisWeek: 8,
      tagGrowthRate: 12.5
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get tags stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tags statistics'
    });
  }
});

// @route   GET /api/admin/explorer/sections
// @desc    Get explorer sections management
// @access  Admin
router.get('/explorer/sections', async (req, res) => {
  try {
    const sections = {
      total: 8,
      sections: [
        { id: 1, name: 'Trending', isActive: true, contentCount: 250, order: 1 },
        { id: 2, name: 'Music', isActive: true, contentCount: 180, order: 2 },
        { id: 3, name: 'Dance', isActive: true, contentCount: 320, order: 3 },
        { id: 4, name: 'Comedy', isActive: true, contentCount: 150, order: 4 }
      ],
      totalContent: 900
    };
    
    res.json({
      success: true,
      data: sections
    });
  } catch (error) {
    console.error('Get explorer sections error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching explorer sections'
    });
  }
});

// @route   GET /api/admin/explorer/stats
// @desc    Get explorer statistics
// @access  Admin
router.get('/explorer/stats', async (req, res) => {
  try {
    const stats = {
      totalSections: 8,
      totalContent: 900,
      totalViews: 1250000,
      avgEngagement: 8.5,
      topSections: [],
      recentActivity: []
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get explorer stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching explorer statistics'
    });
  }
});

// @route   GET /api/admin/seller-applications
// @desc    Get seller applications with pagination
// @access  Admin
router.get('/seller-applications', async (req, res) => {
  try {
    const { page = 1, limit = 20, status = '', search = '' } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { 'userId.username': { $regex: search, $options: 'i' } },
        { 'userId.fullName': { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } }
      ];
    }

    const applications = await SellerApplication.find(filter)
      .populate('userId', 'username fullName email avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await SellerApplication.countDocuments(filter);

    // If no real applications, return dummy data
    if (applications.length === 0) {
      const dummyApplications = Array.from({ length: 15 }, (_, i) => ({
        _id: `app_${i + 1}`,
        userId: {
          _id: `user_${i + 1}`,
          username: `seller${i + 1}`,
          fullName: `Seller User ${i + 1}`,
          email: `seller${i + 1}@example.com`,
          avatar: `https://ui-avatars.com/api/?name=Seller+${i + 1}&background=random`
        },
        businessName: `Business ${i + 1}`,
        businessType: ['retail', 'service', 'digital', 'food'][i % 4],
        description: `This is a business description for seller ${i + 1}. We provide quality products and services.`,
        documents: [
          { type: 'businessLicense', url: '/documents/license.pdf', verified: Math.random() > 0.5 },
          { type: 'taxId', url: '/documents/tax.pdf', verified: Math.random() > 0.5 }
        ],
        status: ['pending', 'approved', 'rejected', 'under_review'][Math.floor(Math.random() * 4)],
        submittedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        reviewedAt: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000) : null,
        reviewedBy: Math.random() > 0.5 ? 'admin_user' : null,
        rejectionReason: null
      }));

      return res.json({
        success: true,
        data: {
          applications: dummyApplications,
          pagination: {
            total: 15,
            page: parseInt(page),
            pages: Math.ceil(15 / limit),
            limit: parseInt(limit)
          }
        }
      });
    }

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get seller applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching seller applications'
    });
  }
});

// @route   POST /api/admin/seller-applications/:id/approve
// @desc    Approve seller application
// @access  Admin
router.post('/seller-applications/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Simulate approval
    res.json({
      success: true,
      message: 'Seller application approved successfully',
      data: {
        id,
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: req.user.id
      }
    });
  } catch (error) {
    console.error('Approve seller application error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving seller application'
    });
  }
});

// @route   POST /api/admin/seller-applications/:id/reject
// @desc    Reject seller application
// @access  Admin
router.post('/seller-applications/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    // Simulate rejection
    res.json({
      success: true,
      message: 'Seller application rejected successfully',
      data: {
        id,
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: req.user.id,
        rejectionReason: reason
      }
    });
  } catch (error) {
    console.error('Reject seller application error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting seller application'
    });
  }
});

// @route   POST /api/admin/users
// @desc    Create new user
// @access  Admin
router.post('/users', [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Must be a valid email'),
  body('fullName').trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { username, email, fullName, password, role = 'user' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // Create new user
    const newUser = new User({
      username,
      email,
      fullName,
      password, // This should be hashed in the User model pre-save middleware
      role,
      status: 'active',
      isVerified: true, // Admin created users are auto-verified
      createdAt: new Date()
    });

    await newUser.save();

    // Remove password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user: userResponse }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user'
    });
  }
});

// @route   GET /api/admin/uploads
// @desc    Get all uploads with filters
// @access  Admin
router.get('/uploads', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status = '', 
      type = '', 
      userId = '',
      search = '' 
    } = req.query;

    // Generate dummy upload data for demonstration
    const uploads = Array.from({ length: parseInt(limit) }, (_, i) => {
      const index = ((page - 1) * limit) + i + 1;
      const types = ['video', 'image', 'audio', 'document'];
      const statuses = ['pending', 'processing', 'completed', 'failed'];
      const fileType = types[index % types.length];
      
      return {
        _id: `upload_${index}`,
        fileName: `${fileType}_file_${index}.${fileType === 'video' ? 'mp4' : fileType === 'image' ? 'jpg' : fileType === 'audio' ? 'mp3' : 'pdf'}`,
        originalName: `User Upload ${index}.${fileType === 'video' ? 'mp4' : fileType === 'image' ? 'jpg' : fileType === 'audio' ? 'mp3' : 'pdf'}`,
        fileSize: Math.floor(Math.random() * 50000000) + 1000000, // 1MB to 50MB
        mimeType: fileType === 'video' ? 'video/mp4' : fileType === 'image' ? 'image/jpeg' : fileType === 'audio' ? 'audio/mpeg' : 'application/pdf',
        type: fileType,
        status: statuses[index % statuses.length],
        uploadProgress: statuses[index % statuses.length] === 'completed' ? 100 : Math.floor(Math.random() * 100),
        userId: {
          _id: `user_${index % 20 + 1}`,
          username: `user${index % 20 + 1}`,
          fullName: `User ${index % 20 + 1}`,
          avatar: `https://ui-avatars.com/api/?name=User+${index % 20 + 1}&background=random`
        },
        url: `https://mixillo-uploads.s3.amazonaws.com/${fileType}s/upload_${index}`,
        thumbnailUrl: fileType === 'video' || fileType === 'image' ? `https://mixillo-uploads.s3.amazonaws.com/thumbnails/upload_${index}_thumb.jpg` : null,
        duration: fileType === 'video' || fileType === 'audio' ? Math.floor(Math.random() * 300) + 10 : null,
        dimensions: fileType === 'video' || fileType === 'image' ? {
          width: [1920, 1280, 720][index % 3],
          height: [1080, 720, 480][index % 3]
        } : null,
        uploadedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        processedAt: statuses[index % statuses.length] === 'completed' ? new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000) : null,
        metadata: {
          ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          location: ['US', 'UK', 'CA', 'AU'][index % 4]
        }
      };
    });

    const totalUploads = 1500; // Simulated total
    
    res.json({
      success: true,
      data: {
        uploads,
        pagination: {
          total: totalUploads,
          page: parseInt(page),
          pages: Math.ceil(totalUploads / limit),
          limit: parseInt(limit)
        },
        stats: {
          totalUploads,
          pendingUploads: Math.floor(totalUploads * 0.1),
          processingUploads: Math.floor(totalUploads * 0.05),
          completedUploads: Math.floor(totalUploads * 0.8),
          failedUploads: Math.floor(totalUploads * 0.05),
          totalSize: '2.5 TB',
          averageSize: '15.2 MB'
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

// @route   DELETE /api/admin/uploads/:id
// @desc    Delete upload
// @access  Admin
router.delete('/uploads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    res.json({
      success: true,
      message: 'Upload deleted successfully',
      data: { deletedId: id }
    });
  } catch (error) {
    console.error('Delete upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting upload'
    });
  }
});

// @route   POST /api/admin/uploads/:id/reprocess
// @desc    Reprocess failed upload
// @access  Admin
router.post('/uploads/:id/reprocess', async (req, res) => {
  try {
    const { id } = req.params;
    
    res.json({
      success: true,
      message: 'Upload queued for reprocessing',
      data: { 
        uploadId: id,
        status: 'processing',
        queuePosition: Math.floor(Math.random() * 10) + 1
      }
    });
  } catch (error) {
    console.error('Reprocess upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reprocessing upload'
    });
  }
});

// @route   GET /api/admin/content
// @desc    Get all content/media for admin
// @access  Admin
router.get('/content', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type = '', 
      status = '',
      userId = '',
      search = '' 
    } = req.query;

    // Generate dummy content data
    const content = Array.from({ length: parseInt(limit) }, (_, i) => {
      const index = ((page - 1) * limit) + i + 1;
      const types = ['video', 'image', 'audio'];
      const statuses = ['published', 'draft', 'archived', 'reported', 'blocked'];
      const contentType = types[index % types.length];
      
      return {
        _id: `content_${index}`,
        title: `${contentType} Content ${index}`,
        description: `This is a sample ${contentType} content description for item ${index}`,
        type: contentType,
        status: statuses[index % statuses.length],
        url: `https://mixillo-content.s3.amazonaws.com/${contentType}s/content_${index}`,
        thumbnailUrl: `https://mixillo-content.s3.amazonaws.com/thumbnails/content_${index}_thumb.jpg`,
        duration: contentType === 'video' || contentType === 'audio' ? Math.floor(Math.random() * 300) + 10 : null,
        dimensions: contentType === 'video' || contentType === 'image' ? {
          width: [1920, 1280, 720][index % 3],
          height: [1080, 720, 480][index % 3]
        } : null,
        author: {
          _id: `user_${index % 25 + 1}`,
          username: `creator${index % 25 + 1}`,
          fullName: `Creator ${index % 25 + 1}`,
          avatar: `https://ui-avatars.com/api/?name=Creator+${index % 25 + 1}&background=random`,
          isVerified: Math.random() > 0.7
        },
        metrics: {
          views: Math.floor(Math.random() * 100000),
          likes: Math.floor(Math.random() * 10000),
          comments: Math.floor(Math.random() * 1000),
          shares: Math.floor(Math.random() * 500)
        },
        tags: [`tag${index % 10 + 1}`, `trending${index % 5 + 1}`],
        createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
        publishedAt: statuses[index % statuses.length] === 'published' ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
        reportCount: statuses[index % statuses.length] === 'reported' ? Math.floor(Math.random() * 5) + 1 : 0,
        moderationFlags: statuses[index % statuses.length] === 'reported' ? ['inappropriate', 'spam'][Math.floor(Math.random() * 2)] : null
      };
    });

    const totalContent = 3500; // Simulated total
    
    res.json({
      success: true,
      data: {
        content,
        pagination: {
          total: totalContent,
          page: parseInt(page),
          pages: Math.ceil(totalContent / limit),
          limit: parseInt(limit)
        },
        stats: {
          totalContent,
          publishedContent: Math.floor(totalContent * 0.7),
          draftContent: Math.floor(totalContent * 0.15),
          archivedContent: Math.floor(totalContent * 0.1),
          reportedContent: Math.floor(totalContent * 0.03),
          blockedContent: Math.floor(totalContent * 0.02)
        }
      }
    });

  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content'
    });
  }
});

// @route   POST /api/admin/coin-packages
// @desc    Create new coin package
// @access  Admin
router.post('/coin-packages', async (req, res) => {
  try {
    const { name, coins, price, currency, description, isActive } = req.body;
    
    const coinPackage = new CoinPackage({
      name,
      coins,
      price,
      currency: currency || 'USD',
      description,
      isActive: isActive !== undefined ? isActive : true
    });
    
    await coinPackage.save();
    
    res.json({
      success: true,
      message: 'Coin package created successfully',
      data: { package: coinPackage }
    });
  } catch (error) {
    console.error('Create coin package error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating coin package'
    });
  }
});

// @route   POST /api/admin/levels
// @desc    Create new user level
// @access  Admin
router.post('/levels', async (req, res) => {
  try {
    const { level, name, minExperience, maxExperience, badge, benefits } = req.body;
    
    const userLevel = new Level({
      level,
      name,
      minExperience,
      maxExperience,
      badge,
      benefits: benefits || []
    });
    
    await userLevel.save();
    
    res.json({
      success: true,
      message: 'Level created successfully',
      data: { level: userLevel }
    });
  } catch (error) {
    console.error('Create level error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating level'
    });
  }
});

// @route   POST /api/admin/tags
// @desc    Create new tag
// @access  Admin
router.post('/tags', async (req, res) => {
  try {
    const { name, displayName, category, isActive } = req.body;
    
    const tag = new Tag({
      name,
      displayName,
      category: category || 'general',
      isActive: isActive !== undefined ? isActive : true,
      usageCount: 0
    });
    
    await tag.save();
    
    res.json({
      success: true,
      message: 'Tag created successfully',
      data: { tag }
    });
  } catch (error) {
    console.error('Create tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating tag'
    });
  }
});

// @route   GET /api/admin/explorer-sections
// @desc    Get explorer sections
// @access  Admin
router.get('/explorer-sections', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const sections = await ExplorerSection.find()
      .sort('order')
      .limit(parseInt(limit))
      .skip((page - 1) * limit);
    
    const total = await ExplorerSection.countDocuments();
    
    res.json({
      success: true,
      data: {
        sections,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get explorer sections error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching explorer sections'
    });
  }
});

// @route   POST /api/admin/explorer-sections
// @desc    Create new explorer section
// @access  Admin
router.post('/explorer-sections', async (req, res) => {
  try {
    const { title, type, isActive, order } = req.body;
    
    const section = new ExplorerSection({
      title,
      type,
      isActive: isActive !== undefined ? isActive : true,
      order: order || 0,
      contentIds: []
    });
    
    await section.save();
    
    res.json({
      success: true,
      message: 'Explorer section created successfully',
      data: { section }
    });
  } catch (error) {
    console.error('Create explorer section error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating explorer section'
    });
  }
});

// @route   GET /api/admin/reports
// @desc    Get moderation reports
// @access  Admin
router.get('/reports', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    
    // Mock data for now - implement with actual Report model later
    const reports = {
      total: 45,
      reports: [],
      stats: {
        pending: 12,
        reviewed: 28,
        resolved: 5
      }
    };
    
    res.json({
      success: true,
      data: reports,
      pagination: {
        total: reports.total,
        page: parseInt(page),
        pages: Math.ceil(reports.total / limit)
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reports'
    });
  }
});

// @route   GET /api/admin/analytics/overview
// @desc    Get analytics overview
// @access  Admin
router.get('/analytics/overview', async (req, res) => {
  try {
    const analytics = {
      users: {
        total: await User.countDocuments(),
        active: await User.countDocuments({ status: 'active' }),
        new: await User.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        })
      },
      content: {
        total: await Content.countDocuments(),
        videos: await Content.countDocuments({ type: 'video' }),
        posts: await Content.countDocuments({ type: 'post' })
      },
      revenue: {
        total: 125000,
        thisMonth: 35000,
        lastMonth: 28000
      },
      engagement: {
        views: 1250000,
        likes: 85000,
        comments: 12500,
        shares: 8500
      }
    };
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics'
    });
  }
});

// @route   GET /api/admin/livestreams
// @desc    Get livestreams
// @access  Admin
router.get('/livestreams', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    // Mock data for now
    const livestreams = {
      total: 8,
      livestreams: [],
      stats: {
        live: 3,
        scheduled: 2,
        ended: 3
      }
    };
    
    res.json({
      success: true,
      data: livestreams,
      pagination: {
        total: livestreams.total,
        page: parseInt(page),
        pages: Math.ceil(livestreams.total / limit)
      }
    });
  } catch (error) {
    console.error('Get livestreams error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching livestreams'
    });
  }
});

// @route   GET /api/admin/wallets
// @desc    Get all wallets
// @access  Admin
router.get('/wallets', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const wallets = await Wallet.find()
      .populate('userId', 'username email fullName')
      .sort('-balance')
      .limit(parseInt(limit))
      .skip((page - 1) * limit);
    
    const total = await Wallet.countDocuments();
    
    res.json({
      success: true,
      data: {
        wallets,
        pagination: {
          total,
          page: parseInt(page),
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