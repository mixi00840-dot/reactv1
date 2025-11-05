const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../utils/database'); // Firestore instance
const { authMiddleware } = require('../middleware/auth');
const { uploadMiddleware, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// @route   POST /api/sellers/apply
// @desc    Submit seller application
// @access  Private
router.post('/apply', [
  authMiddleware,
  uploadMiddleware.documents,
  handleUploadError,
  body('documentType')
    .isIn(['passport', 'national_id', 'driving_license'])
    .withMessage('Invalid document type'),
  body('documentNumber')
    .notEmpty()
    .withMessage('Document number is required')
    .isLength({ min: 5, max: 50 })
    .withMessage('Document number must be between 5 and 50 characters'),
  body('businessName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be between 2 and 100 characters'),
  body('businessType')
    .optional()
    .isIn(['individual', 'company', 'partnership'])
    .withMessage('Invalid business type'),
  body('businessDescription')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Business description must not exceed 1000 characters'),
  body('expectedMonthlyRevenue')
    .optional()
    .isNumeric()
    .withMessage('Expected monthly revenue must be a number')
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

    const userId = req.user.id || req.user._id;

    // Check if user already has an application
    const existingSnapshot = await db.collection('sellerApplications')
      .where('userId', '==', userId)
      .limit(1)
      .get();
    
    if (!existingSnapshot.empty) {
      const existingApp = existingSnapshot.docs[0].data();
      return res.status(400).json({
        success: false,
        message: 'You already have a seller application. Current status: ' + existingApp.status
      });
    }

    // Check if documents were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one document image is required'
      });
    }

    const {
      documentType,
      documentNumber,
      businessName,
      businessType,
      businessDescription,
      expectedMonthlyRevenue
    } = req.body;

    // Process uploaded documents
    const documentImages = req.files.map(file => ({
      url: `/uploads/documents/${file.filename}`,
      uploadedAt: new Date().toISOString()
    }));

    // Create seller application
    const applicationData = {
      userId,
      documentType,
      documentNumber,
      documentImages,
      businessName: businessName || '',
      businessType: businessType || 'individual',
      businessDescription: businessDescription || '',
      expectedMonthlyRevenue: expectedMonthlyRevenue ? parseFloat(expectedMonthlyRevenue) : 0,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const appRef = await db.collection('sellerApplications').add(applicationData);

    // Get user data for response
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.exists ? {
      id: userDoc.id,
      username: userDoc.data().username,
      fullName: userDoc.data().fullName,
      email: userDoc.data().email
    } : null;

    res.status(201).json({
      success: true,
      message: 'Seller application submitted successfully',
      data: {
        application: {
          id: appRef.id,
          ...applicationData,
          user: userData
        }
      }
    });

  } catch (error) {
    console.error('Seller application error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting application'
    });
  }
});

// @route   GET /api/sellers/application
// @desc    Get current user's seller application
// @access  Private
router.get('/application', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const snapshot = await db.collection('sellerApplications')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        message: 'No seller application found'
      });
    }

    const appDoc = snapshot.docs[0];
    const appData = appDoc.data();

    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.exists ? {
      id: userDoc.id,
      username: userDoc.data().username,
      fullName: userDoc.data().fullName,
      email: userDoc.data().email
    } : null;

    // Get reviewer data if reviewed
    let reviewedBy = null;
    if (appData.reviewedBy) {
      const reviewerDoc = await db.collection('users').doc(appData.reviewedBy).get();
      if (reviewerDoc.exists) {
        reviewedBy = {
          id: reviewerDoc.id,
          username: reviewerDoc.data().username,
          fullName: reviewerDoc.data().fullName
        };
      }
    }

    res.json({
      success: true,
      data: {
        application: {
          id: appDoc.id,
          ...appData,
          user: userData,
          reviewedBy
        }
      }
    });

  } catch (error) {
    console.error('Get seller application error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching application'
    });
  }
});

// @route   PUT /api/sellers/application
// @desc    Update seller application (only for pending applications)
// @access  Private
router.put('/application', [
  authMiddleware,
  body('businessName').optional().isLength({ min: 2, max: 100 }),
  body('businessDescription').optional().isLength({ max: 1000 }),
  body('expectedMonthlyRevenue').optional().isNumeric()
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

    const userId = req.user.id || req.user._id;

    const snapshot = await db.collection('sellerApplications')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        message: 'No seller application found'
      });
    }

    const appDoc = snapshot.docs[0];
    const appData = appDoc.data();

    if (appData.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update application that has been reviewed'
      });
    }

    const allowedUpdates = ['businessName', 'businessDescription', 'expectedMonthlyRevenue'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = field === 'expectedMonthlyRevenue' 
          ? parseFloat(req.body[field]) 
          : req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    updates.updatedAt = new Date().toISOString();

    await db.collection('sellerApplications').doc(appDoc.id).update(updates);

    // Get updated application
    const updatedDoc = await db.collection('sellerApplications').doc(appDoc.id).get();

    res.json({
      success: true,
      message: 'Application updated successfully',
      data: {
        application: {
          id: updatedDoc.id,
          ...updatedDoc.data()
        }
      }
    });

  } catch (error) {
    console.error('Update seller application error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating application'
    });
  }
});

// @route   DELETE /api/sellers/application
// @desc    Withdraw seller application (only pending applications)
// @access  Private
router.delete('/application', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const snapshot = await db.collection('sellerApplications')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        message: 'No seller application found'
      });
    }

    const appDoc = snapshot.docs[0];
    const appData = appDoc.data();

    if (appData.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot withdraw application that has been reviewed'
      });
    }

    await db.collection('sellerApplications').doc(appDoc.id).delete();

    res.json({
      success: true,
      message: 'Application withdrawn successfully'
    });

  } catch (error) {
    console.error('Delete seller application error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting application'
    });
  }
});

// @route   GET /api/sellers/check-eligibility
// @desc    Check if user is eligible to apply as seller
// @access  Private
router.get('/check-eligibility', authMiddleware, async (req, res) => {
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

    const userData = userDoc.data();

    // Check if already a seller
    if (userData.role === 'seller') {
      return res.json({
        success: true,
        data: {
          eligible: false,
          reason: 'You are already a seller'
        }
      });
    }

    // Check if banned or suspended
    if (userData.status === 'banned' || userData.status === 'suspended') {
      return res.json({
        success: true,
        data: {
          eligible: false,
          reason: 'Your account is ' + userData.status
        }
      });
    }

    // Check for existing application
    const appSnapshot = await db.collection('sellerApplications')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (!appSnapshot.empty) {
      const appData = appSnapshot.docs[0].data();
      return res.json({
        success: true,
        data: {
          eligible: false,
          reason: 'You already have an application with status: ' + appData.status
        }
      });
    }

    // Check for active strikes
    const strikesSnapshot = await db.collection('strikes')
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .get();

    if (strikesSnapshot.size > 0) {
      return res.json({
        success: true,
        data: {
          eligible: false,
          reason: 'You have active strikes on your account'
        }
      });
    }

    res.json({
      success: true,
      data: {
        eligible: true,
        reason: 'You are eligible to apply as a seller'
      }
    });

  } catch (error) {
    console.error('Check eligibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking eligibility'
    });
  }
});

// @route   GET /api/sellers/applications
// @desc    Get all seller applications (admin-accessible)
// @access  Private (Admin)
router.get('/applications', authMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    // Build query with fallback ordering to avoid composite index issues
    let query = db.collection('sellerApplications');
    
    const hasStatus = Boolean(status);
    if (hasStatus) {
      query = query.where('status', '==', status);
      // Avoid orderBy when using status filter to prevent composite index requirement
    } else {
      query = query.orderBy('createdAt', 'desc');
    }
    
    // Get total count
    const countSnapshot = await query.get();
    const total = countSnapshot.size;
    
    // Apply pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const snapshot = await query.limit(parseInt(limit)).offset(offset).get();
    
    const applications = [];
    
    for (const doc of snapshot.docs) {
      const appData = doc.data();
      
      // Get user data
      const userDoc = await db.collection('users').doc(appData.userId).get();
      const userData = userDoc.exists ? {
        id: userDoc.id,
        username: userDoc.data().username,
        fullName: userDoc.data().fullName,
        email: userDoc.data().email,
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
      message: 'Server error while fetching applications'
    });
  }
});

// @route   GET /api/sellers/stats
// @desc    Get seller statistics
// @access  Private (Admin)
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const applicationsSnapshot = await db.collection('sellerApplications').get();
    
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let total = applicationsSnapshot.size;
    
    applicationsSnapshot.forEach(doc => {
      const app = doc.data();
      if (app.status === 'pending') pending++;
      else if (app.status === 'approved') approved++;
      else if (app.status === 'rejected') rejected++;
    });
    
    // Get recent applications (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentSnapshot = await db.collection('sellerApplications')
      .where('createdAt', '>=', sevenDaysAgo.toISOString())
      .get();
    
    const recentApplications = recentSnapshot.size;
    
    res.json({
      success: true,
      data: {
        stats: {
          total,
          pending,
          approved,
          rejected,
          recentApplications,
          approvalRate: total > 0 ? ((approved / total) * 100).toFixed(2) : 0
        }
      }
    });
    
  } catch (error) {
    console.error('Get seller stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics'
    });
  }
});

module.exports = router;
