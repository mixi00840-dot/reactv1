const express = require('express');
const { body, validationResult } = require('express-validator');
const SellerApplication = require('../models/SellerApplication');
const User = require('../models/User');
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

    // Check if user already has an application
    const existingApplication = await SellerApplication.findOne({ userId: req.user._id });
    
    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You already have a seller application. Current status: ' + existingApplication.status
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
      uploadedAt: new Date()
    }));

    // Create seller application
    const application = new SellerApplication({
      userId: req.user._id,
      documentType,
      documentNumber,
      documentImages,
      businessName,
      businessType: businessType || 'individual',
      businessDescription,
      expectedMonthlyRevenue
    });

    await application.save();

    // Populate user data for response
    await application.populate('userId', 'username fullName email');

    res.status(201).json({
      success: true,
      message: 'Seller application submitted successfully',
      data: { application }
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
    const application = await SellerApplication.findOne({ userId: req.user._id })
      .populate('userId', 'username fullName email')
      .populate('reviewedBy', 'username fullName');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'No seller application found'
      });
    }

    res.json({
      success: true,
      data: { application }
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
  uploadMiddleware.documents,
  handleUploadError,
  body('businessName')
    .optional()
    .isLength({ min: 2, max: 100 }),
  body('businessDescription')
    .optional()
    .isLength({ max: 1000 }),
  body('expectedMonthlyRevenue')
    .optional()
    .isNumeric()
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

    const application = await SellerApplication.findOne({ userId: req.user._id });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'No seller application found'
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update application. Current status: ' + application.status
      });
    }

    const allowedUpdates = ['businessName', 'businessDescription', 'expectedMonthlyRevenue'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Handle new document uploads
    if (req.files && req.files.length > 0) {
      const newDocuments = req.files.map(file => ({
        url: `/uploads/documents/${file.filename}`,
        uploadedAt: new Date()
      }));
      
      // Add to existing documents (don't replace)
      updates.documentImages = [...application.documentImages, ...newDocuments];
    }

    const updatedApplication = await SellerApplication.findByIdAndUpdate(
      application._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('userId', 'username fullName email');

    res.json({
      success: true,
      message: 'Application updated successfully',
      data: { application: updatedApplication }
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
// @desc    Withdraw seller application (only for pending applications)
// @access  Private
router.delete('/application', authMiddleware, async (req, res) => {
  try {
    const application = await SellerApplication.findOne({ userId: req.user._id });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'No seller application found'
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot withdraw application. Current status: ' + application.status
      });
    }

    await SellerApplication.findByIdAndDelete(application._id);

    res.json({
      success: true,
      message: 'Seller application withdrawn successfully'
    });

  } catch (error) {
    console.error('Withdraw seller application error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while withdrawing application'
    });
  }
});

// @route   GET /api/sellers/status
// @desc    Get seller verification status
// @access  Private
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const application = await SellerApplication.findOne({ userId: req.user._id });
    
    const status = {
      hasApplication: !!application,
      status: application ? application.status : null,
      submittedAt: application ? application.submittedAt : null,
      reviewedAt: application ? application.reviewedAt : null,
      canApply: !application || application.status === 'rejected'
    };

    res.json({
      success: true,
      data: { status }
    });

  } catch (error) {
    console.error('Get seller status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching seller status'
    });
  }
});

// @route   POST /api/sellers/reapply
// @desc    Reapply for seller status (only after rejection)
// @access  Private
router.post('/reapply', [
  authMiddleware,
  uploadMiddleware.documents,
  handleUploadError,
  body('documentType')
    .isIn(['passport', 'national_id', 'driving_license'])
    .withMessage('Invalid document type'),
  body('documentNumber')
    .notEmpty()
    .withMessage('Document number is required')
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

    const existingApplication = await SellerApplication.findOne({ userId: req.user._id });
    
    if (!existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'No previous application found. Please use the apply endpoint.'
      });
    }

    if (existingApplication.status !== 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Can only reapply after rejection. Current status: ' + existingApplication.status
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
      uploadedAt: new Date()
    }));

    // Update existing application
    existingApplication.status = 'pending';
    existingApplication.documentType = documentType;
    existingApplication.documentNumber = documentNumber;
    existingApplication.documentImages = documentImages;
    existingApplication.businessName = businessName;
    existingApplication.businessType = businessType || 'individual';
    existingApplication.businessDescription = businessDescription;
    existingApplication.expectedMonthlyRevenue = expectedMonthlyRevenue;
    existingApplication.submittedAt = new Date();
    
    // Clear review data
    existingApplication.reviewedBy = null;
    existingApplication.reviewedAt = null;
    existingApplication.reviewNotes = '';
    existingApplication.rejectionReason = '';

    await existingApplication.save();
    await existingApplication.populate('userId', 'username fullName email');

    res.json({
      success: true,
      message: 'Seller application resubmitted successfully',
      data: { application: existingApplication }
    });

  } catch (error) {
    console.error('Seller reapplication error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resubmitting application'
    });
  }
});

module.exports = router;