const mongoose = require('mongoose');

const AIModerationSchema = new mongoose.Schema({
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  
  contentType: {
    type: String,
    enum: ['content', 'comment', 'message', 'profile'],
    required: true
  },
  
  // AI Analysis Results
  scores: {
    adult: Number,
    violence: Number,
    hate: Number,
    harassment: Number,
    spam: Number,
    toxicity: Number,
    overall: Number
  },
  
  flags: [String],
  
  recommendation: {
    type: String,
    enum: ['approve', 'review', 'reject', 'remove'],
    required: true
  },
  
  confidence: {
    type: Number,
    min: 0,
    max: 100
  },
  
  provider: {
    type: String,
    enum: ['google', 'aws', 'azure', 'custom'],
    default: 'custom'
  },
  
  processedAt: {
    type: Date,
    default: Date.now
  },
  
  // Human review
  humanReviewed: {
    type: Boolean,
    default: false
  },
  
  humanDecision: {
    type: String,
    enum: ['agree', 'disagree']
  },
  
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
}, {
  timestamps: true
});

AIModerationSchema.index({ contentId: 1, contentType: 1 });
AIModerationSchema.index({ recommendation: 1, processedAt: -1 });

const AIModeration = mongoose.model('AIModeration', AIModerationSchema);

module.exports = AIModeration;

