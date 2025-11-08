const mongoose = require('mongoose');

const AdCampaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  
  advertiserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  type: {
    type: String,
    enum: ['banner', 'video', 'sponsored_content'],
    required: true
  },
  
  targetAudience: {
    ageRange: {
      min: Number,
      max: Number
    },
    gender: [String],
    interests: [String],
    locations: [String]
  },
  
  budget: {
    total: Number,
    daily: Number,
    spent: { type: Number, default: 0 }
  },
  
  schedule: {
    startDate: Date,
    endDate: Date
  },
  
  creative: {
    imageUrl: String,
    videoUrl: String,
    title: String,
    description: String,
    callToAction: String,
    destinationUrl: String
  },
  
  metrics: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 }
  },
  
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'active', 'paused', 'completed', 'rejected'],
    default: 'draft',
    index: true
  },
  
}, {
  timestamps: true
});

AdCampaignSchema.index({ advertiserId: 1, status: 1 });
AdCampaignSchema.index({ status: 1, 'schedule.startDate': 1 });

const AdCampaign = mongoose.model('AdCampaign', AdCampaignSchema);

module.exports = AdCampaign;

