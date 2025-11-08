const mongoose = require('mongoose');

const SearchQuerySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  query: {
    type: String,
    required: true,
    index: true
  },
  
  type: {
    type: String,
    enum: ['users', 'content', 'products', 'hashtags', 'all'],
    default: 'all'
  },
  
  resultsCount: {
    type: Number,
    default: 0
  },
  
  clickedResults: [{
    resultId: mongoose.Schema.Types.ObjectId,
    resultType: String,
    position: Number
  }],
  
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false
});

SearchQuerySchema.index({ query: 1, timestamp: -1 });
SearchQuerySchema.index({ userId: 1, timestamp: -1 });

// TTL - keep for 30 days
SearchQuerySchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const SearchQuery = mongoose.model('SearchQuery', SearchQuerySchema);

module.exports = SearchQuery;

