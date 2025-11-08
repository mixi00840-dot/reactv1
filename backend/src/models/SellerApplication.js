const mongoose = require('mongoose');

const SellerApplicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  businessName: {
    type: String,
    required: true
  },
  
  businessType: {
    type: String,
    enum: ['individual', 'business', 'company'],
    required: true
  },
  
  description: String,
  
  contactEmail: String,
  contactPhone: String,
  
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  
  taxId: String,
  businessLicense: String,
  
  // Documents
  documents: [{
    type: String,
    url: String,
    uploadedAt: Date
  }],
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  reviewedAt: Date,
  reviewNotes: String,
  
  rejectionReason: String,
  
  // Auto-created store ID after approval
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store'
  },
  
}, {
  timestamps: true
});

SellerApplicationSchema.index({ userId: 1 });
SellerApplicationSchema.index({ status: 1, createdAt: 1 });

const SellerApplication = mongoose.model('SellerApplication', SellerApplicationSchema);

module.exports = SellerApplication;

