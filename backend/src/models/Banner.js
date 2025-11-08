const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  linkUrl: String,
  type: {
    type: String,
    enum: ['home', 'shop', 'live', 'promotion'],
    default: 'home'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  clicksCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

BannerSchema.index({ type: 1, isActive: 1, sortOrder: 1 });

const Banner = mongoose.model('Banner', BannerSchema);

module.exports = Banner;
