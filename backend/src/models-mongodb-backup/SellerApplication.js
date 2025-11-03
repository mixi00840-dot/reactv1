const mongoose = require('mongoose');

const sellerApplicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'under_review'],
    default: 'pending'
  },
  documentType: {
    type: String,
    enum: ['passport', 'national_id', 'driving_license'],
    required: [true, 'Document type is required']
  },
  documentNumber: {
    type: String,
    required: [true, 'Document number is required'],
    trim: true
  },
  documentImages: [{
    url: {
      type: String,
      required: true
    },
    publicId: String, // For cloudinary
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  businessName: {
    type: String,
    trim: true
  },
  businessType: {
    type: String,
    enum: ['individual', 'company', 'partnership'],
    default: 'individual'
  },
  businessDescription: {
    type: String,
    maxlength: [1000, 'Business description must not exceed 1000 characters']
  },
  expectedMonthlyRevenue: {
    type: Number,
    min: 0
  },
  // Admin review
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  reviewNotes: {
    type: String,
    maxlength: [500, 'Review notes must not exceed 500 characters']
  },
  rejectionReason: {
    type: String,
    maxlength: [500, 'Rejection reason must not exceed 500 characters']
  },
  // Timestamps
  submittedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for performance
sellerApplicationSchema.index({ userId: 1 });
sellerApplicationSchema.index({ status: 1 });
sellerApplicationSchema.index({ submittedAt: -1 });

// Virtual for user details
sellerApplicationSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Method to approve application
sellerApplicationSchema.methods.approve = function(adminId, notes = '') {
  this.status = 'approved';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.approvedAt = new Date();
  this.reviewNotes = notes;
  return this.save();
};

// Method to reject application
sellerApplicationSchema.methods.reject = function(adminId, reason, notes = '') {
  this.status = 'rejected';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.rejectionReason = reason;
  this.reviewNotes = notes;
  return this.save();
};

module.exports = mongoose.model('SellerApplication', sellerApplicationSchema);