const mongoose = require('mongoose');

const StrikeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  reason: {
    type: String,
    enum: ['spam', 'harassment', 'inappropriate_content', 'copyright', 'terms_violation', 'other'],
    required: true
  },
  
  description: String,
  
  severity: {
    type: String,
    enum: ['minor', 'moderate', 'major', 'critical'],
    default: 'moderate'
  },
  
  relatedContentId: mongoose.Schema.Types.ObjectId,
  relatedContentType: String,
  
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  expiresAt: Date,
  
  isActive: {
    type: Boolean,
    default: true
  },
  
}, {
  timestamps: true
});

StrikeSchema.index({ userId: 1, isActive: 1 });
StrikeSchema.index({ expiresAt: 1 });

const Strike = mongoose.model('Strike', StrikeSchema);

module.exports = Strike;

