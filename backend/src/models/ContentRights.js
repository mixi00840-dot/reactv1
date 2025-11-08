const mongoose = require('mongoose');

const ContentRightsSchema = new mongoose.Schema({
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true,
    index: true
  },
  
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  licenseType: {
    type: String,
    enum: ['exclusive', 'non-exclusive', 'creative_commons', 'all_rights_reserved'],
    default: 'all_rights_reserved'
  },
  
  allowCommercialUse: {
    type: Boolean,
    default: false
  },
  
  allowModification: {
    type: Boolean,
    default: false
  },
  
  copyrightNotice: String,
  
  claimedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    claimDate: Date,
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected']
    }
  }],
  
}, {
  timestamps: true
});

ContentRightsSchema.index({ contentId: 1 }, { unique: true });
ContentRightsSchema.index({ ownerId: 1 });

const ContentRights = mongoose.model('ContentRights', ContentRightsSchema);

module.exports = ContentRights;

