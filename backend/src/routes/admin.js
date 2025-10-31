const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const SellerApplication = require('../models/SellerApplication');
const { Wallet } = require('../models/Wallet');
const Strike = require('../models/Strike');
const Store = require('../models/Store');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Apply auth and admin middleware to all routes
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

module.exports = router;