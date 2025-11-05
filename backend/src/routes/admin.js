const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../utils/database'); // Firestore instance
const { verifyFirebaseToken, requireAdmin } = require('../middleware/firebaseAuth');

const router = express.Router();

// Health check endpoint (no auth required)
router.get('/health', async (req, res) => {
  res.json({
    success: true,
    message: 'Admin API is operational (Firestore)',
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /api/admin/dashboard - Admin dashboard stats',
      'GET /api/admin/users - List all users',
      'GET /api/admin/users/:userId - Get user details',
      'PUT /api/admin/users/:userId/role - Update user role',
      'PUT /api/admin/users/:userId/status - Update user status (ban/suspend/activate)',
      'PUT /api/admin/users/:userId/verify - Verify user',
      'PUT /api/admin/users/:userId/feature - Feature user',
      'GET /api/admin/seller-applications - List seller applications',
      'PUT /api/admin/seller-applications/:appId - Approve/reject seller application',
      'POST /api/admin/strikes - Issue strike to user',
      'GET /api/admin/strikes - List all strikes',
      'DELETE /api/admin/strikes/:strikeId - Remove strike'
    ]
  });
});

// Apply Firebase auth and admin middleware to all routes AFTER health check
router.use(verifyFirebaseToken);
router.use(requireAdmin);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Admin
router.get('/dashboard', async (req, res) => {
  try {
    // Get user statistics
    const usersSnapshot = await db.collection('users').get();
    let totalUsers = 0;
    let activeUsers = 0;
    let bannedUsers = 0;
    let suspendedUsers = 0;
    let verifiedUsers = 0;
    let featuredUsers = 0;

    usersSnapshot.forEach(doc => {
      const user = doc.data();
      totalUsers++;
      if (user.status === 'active') activeUsers++;
      if (user.status === 'banned') bannedUsers++;
      if (user.status === 'suspended') suspendedUsers++;
      if (user.isVerified) verifiedUsers++;
      if (user.isFeatured) featuredUsers++;
    });

    // Get seller application statistics
    const sellerSnapshot = await db.collection('sellerApplications').get();
    let pendingSellerApps = 0;
    let approvedSellers = 0;

    sellerSnapshot.forEach(doc => {
      const app = doc.data();
      if (app.status === 'pending') pendingSellerApps++;
      if (app.status === 'approved') approvedSellers++;
    });

    // Get strike statistics
    const strikesSnapshot = await db.collection('strikes').get();
    let totalStrikes = strikesSnapshot.size;
    let activeStrikes = 0;

    strikesSnapshot.forEach(doc => {
      const strike = doc.data();
      if (strike.isActive) activeStrikes++;
    });

    // Get top earners (top 10 by totalEarnings)
    const walletsSnapshot = await db.collection('wallets')
      .orderBy('totalEarnings', 'desc')
      .limit(10)
      .get();

    const topEarners = [];
    for (const walletDoc of walletsSnapshot.docs) {
      const walletData = walletDoc.data();
      const userDoc = await db.collection('users').doc(walletDoc.id).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        topEarners.push({
          user: {
            id: userDoc.id,
            username: userData.username,
            fullName: userData.fullName,
            avatar: userData.avatar,
            isVerified: userData.isVerified
          },
          totalEarnings: walletData.totalEarnings || 0,
          supportLevel: walletData.supportLevel || 1
        });
      }
    }

    // Get recent registrations (last 10 users)
    const recentUsersSnapshot = await db.collection('users')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const recentUsers = recentUsersSnapshot.docs.map(doc => ({
      id: doc.id,
      username: doc.data().username,
      fullName: doc.data().fullName,
      avatar: doc.data().avatar,
      createdAt: doc.data().createdAt,
      status: doc.data().status
    }));

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
      topEarners,
      recentUsers
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

// Note: User management routes are handled by /api/admin/users router
// (mounted separately in app.js to avoid conflicts)

// @route   GET /api/admin/users/search
// @desc    Search users (must come before /users/:userId to avoid route conflict)
// @access  Admin
router.get('/users/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'Search query must be at least 2 characters' 
      });
    }

    const searchTerm = q.trim().toLowerCase();
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

// @route   GET /api/admin/users/:userId
// @desc    Get detailed user information  
// @access  Admin
router.get('/users/:userId', async (req, res) => {
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
    delete userData.password;

    // Get wallet data
    const walletDoc = await db.collection('wallets').doc(userId).get();
    const wallet = walletDoc.exists ? walletDoc.data() : null;

    // Get strikes
    const strikesSnapshot = await db.collection('strikes')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const strikes = strikesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get seller application
    const sellerSnapshot = await db.collection('sellerApplications')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    const sellerApplication = !sellerSnapshot.empty ? {
      id: sellerSnapshot.docs[0].id,
      ...sellerSnapshot.docs[0].data()
    } : null;

    res.json({
      success: true,
      data: {
        user: {
          id: userDoc.id,
          ...userData
        },
        wallet,
        strikes,
        sellerApplication
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

// @route   PUT /api/admin/users/:userId/role
// @desc    Update user role
// @access  Admin
router.put('/users/:userId/role', [
  body('role').isIn(['user', 'admin', 'moderator']).withMessage('Invalid role')
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

    const { userId } = req.params;
    const { role } = req.body;

    await db.collection('users').doc(userId).update({
      role,
      updatedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: `User role updated to ${role}`
    });

  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating role'
    });
  }
});

// @route   PUT /api/admin/users/:userId/status
// @desc    Update user status (ban/suspend/activate)
// @access  Admin
router.put('/users/:userId/status', [
  body('status').isIn(['active', 'banned', 'suspended']).withMessage('Invalid status'),
  body('reason').optional().isString()
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

    const { userId } = req.params;
    const { status, reason } = req.body;

    await db.collection('users').doc(userId).update({
      status,
      statusReason: reason || '',
      updatedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: `User status updated to ${status}`
    });

  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating status'
    });
  }
});

// @route   PUT /api/admin/users/:userId/verify
// @desc    Verify/unverify user
// @access  Admin
router.put('/users/:userId/verify', [
  body('isVerified').isBoolean().withMessage('isVerified must be boolean')
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

    const { userId } = req.params;
    const { isVerified } = req.body;

    await db.collection('users').doc(userId).update({
      isVerified,
      updatedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: isVerified ? 'User verified' : 'User unverified'
    });

  } catch (error) {
    console.error('Update verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating verification'
    });
  }
});

// @route   PUT /api/admin/users/:userId/feature
// @desc    Feature/unfeature user
// @access  Admin
router.put('/users/:userId/feature', [
  body('isFeatured').isBoolean().withMessage('isFeatured must be boolean')
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

    const { userId } = req.params;
    const { isFeatured } = req.body;

    await db.collection('users').doc(userId).update({
      isFeatured,
      updatedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: isFeatured ? 'User featured' : 'User unfeatured'
    });

  } catch (error) {
    console.error('Update featured error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating featured status'
    });
  }
});

// @route   GET /api/admin/seller-applications
// @desc    Get all seller applications
// @access  Admin
router.get('/seller-applications', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let query = db.collection('sellerApplications');

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query
      .orderBy('submittedAt', 'desc')
      .get();

    const total = snapshot.size;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const applications = [];
    for (let i = offset; i < Math.min(offset + parseInt(limit), snapshot.size); i++) {
      const doc = snapshot.docs[i];
      const appData = doc.data();
      
      // Get user data
      const userDoc = await db.collection('users').doc(appData.userId).get();
      const userData = userDoc.exists ? {
        id: userDoc.id,
        username: userDoc.data().username,
        fullName: userDoc.data().fullName,
        avatar: userDoc.data().avatar
      } : null;

      applications.push({
        id: doc.id,
        ...appData,
        user: userData
      });
    }

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
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

// @route   PUT /api/admin/seller-applications/:appId
// @desc    Approve or reject seller application
// @access  Admin
router.put('/seller-applications/:appId', [
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  body('notes').optional().isString()
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

    const { appId } = req.params;
    const { status, notes } = req.body;
    const adminId = req.user.id || req.user._id;

    const appDoc = await db.collection('sellerApplications').doc(appId).get();
    if (!appDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const appData = appDoc.data();

    // Update application
    await db.collection('sellerApplications').doc(appId).update({
      status,
      reviewedBy: adminId,
      reviewedAt: new Date().toISOString(),
      reviewNotes: notes || '',
      updatedAt: new Date().toISOString()
    });

    // Update user role if approved
    if (status === 'approved') {
      await db.collection('users').doc(appData.userId).update({
        role: 'seller',
        updatedAt: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: `Seller application ${status}`
    });

  } catch (error) {
    console.error('Update seller application error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating application'
    });
  }
});

// @route   POST /api/admin/strikes
// @desc    Issue a strike to a user
// @access  Admin
router.post('/strikes', [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('type').isIn(['warning', 'minor', 'major', 'severe']).withMessage('Invalid strike type'),
  body('reason').notEmpty().withMessage('Reason is required'),
  body('severity').isInt({ min: 1, max: 5 }).withMessage('Severity must be 1-5'),
  body('expiresAt').optional().isISO8601()
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

    const { userId, type, reason, severity, expiresAt } = req.body;
    const adminId = req.user.id || req.user._id;

    // Check if user exists
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create strike
    const strikeData = {
      userId,
      type,
      reason,
      severity: parseInt(severity),
      issuedBy: adminId,
      isActive: true,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt || null
    };

    const strikeRef = await db.collection('strikes').add(strikeData);

    // Get active strikes count
    const strikesSnapshot = await db.collection('strikes')
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .get();

    const activeStrikesCount = strikesSnapshot.size;

    // Auto-suspend if too many strikes
    if (activeStrikesCount >= 3) {
      await db.collection('users').doc(userId).update({
        status: 'suspended',
        statusReason: 'Accumulated too many strikes',
        updatedAt: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Strike issued successfully',
      data: {
        strikeId: strikeRef.id,
        activeStrikesCount
      }
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
// @desc    Get all strikes with filters
// @access  Admin
router.get('/strikes', async (req, res) => {
  try {
    const { userId, isActive, page = 1, limit = 20 } = req.query;

    let query = db.collection('strikes');

    if (userId) {
      query = query.where('userId', '==', userId);
    }
    if (isActive !== undefined) {
      query = query.where('isActive', '==', isActive === 'true');
    }

    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .get();

    const total = snapshot.size;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const strikes = [];
    for (let i = offset; i < Math.min(offset + parseInt(limit), snapshot.size); i++) {
      const doc = snapshot.docs[i];
      const strikeData = doc.data();

      // Get user data
      const userDoc = await db.collection('users').doc(strikeData.userId).get();
      const userData = userDoc.exists ? {
        id: userDoc.id,
        username: userDoc.data().username,
        fullName: userDoc.data().fullName
      } : null;

      strikes.push({
        id: doc.id,
        ...strikeData,
        user: userData
      });
    }

    res.json({
      success: true,
      data: {
        strikes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
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

// @route   DELETE /api/admin/strikes/:strikeId
// @desc    Remove/deactivate a strike
// @access  Admin
router.delete('/strikes/:strikeId', async (req, res) => {
  try {
    const { strikeId } = req.params;

    const strikeDoc = await db.collection('strikes').doc(strikeId).get();
    if (!strikeDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Strike not found'
      });
    }

    await db.collection('strikes').doc(strikeId).update({
      isActive: false,
      removedAt: new Date().toISOString(),
      removedBy: req.user.id || req.user._id
    });

    res.json({
      success: true,
      message: 'Strike removed successfully'
    });

  } catch (error) {
    console.error('Remove strike error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing strike'
    });
  }
});

module.exports = router;
