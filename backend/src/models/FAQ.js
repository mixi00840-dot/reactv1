const mongoose = require('mongoose');

const FAQSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  
  answer: {
    type: String,
    required: true
  },
  
  category: {
    type: String,
    enum: ['general', 'account', 'payments', 'shipping', 'returns', 'technical', 'seller', 'other'],
    default: 'general'
  },
  
  isPublished: {
    type: Boolean,
    default: true,
    index: true
  },
  
  order: {
    type: Number,
    default: 0
  },
  
  views: {
    type: Number,
    default: 0
  },
  
  helpful: {
    type: Number,
    default: 0
  },
  
  notHelpful: {
    type: Number,
    default: 0
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
  
}, {
  timestamps: true
});

FAQSchema.index({ category: 1, order: 1 });
FAQSchema.index({ isPublished: 1, order: 1 });

const FAQ = mongoose.model('FAQ', FAQSchema);

module.exports = FAQ;
