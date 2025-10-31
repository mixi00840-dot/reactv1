const mongoose = require('mongoose');

// Platform Analytics Schema - Overall platform metrics
const platformAnalyticsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true
  },
  
  period: {
    type: String,
    enum: ['hourly', 'daily', 'weekly', 'monthly'],
    default: 'daily',
    index: true
  },
  
  // User Metrics
  users: {
    total: { type: Number, default: 0 },
    new: { type: Number, default: 0 },
    active: { type: Number, default: 0 },
    deleted: { type: Number, default: 0 },
    verified: { type: Number, default: 0 },
    sellers: { type: Number, default: 0 },
    newSellers: { type: Number, default: 0 }
  },
  
  // Revenue Metrics
  revenue: {
    total: { type: Number, default: 0 },
    credits: { type: Number, default: 0 },
    products: { type: Number, default: 0 },
    subscriptions: { type: Number, default: 0 },
    commissions: { type: Number, default: 0 },
    avgOrderValue: { type: Number, default: 0 }
  },
  
  // Transaction Metrics
  transactions: {
    total: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    refunded: { type: Number, default: 0 }
  },
  
  // Credit System Metrics
  credits: {
    purchased: { type: Number, default: 0 },
    spent: { type: Number, default: 0 },
    gifted: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    avgPackageSize: { type: Number, default: 0 }
  },
  
  // Gift Metrics
  gifts: {
    sent: { type: Number, default: 0 },
    totalValue: { type: Number, default: 0 },
    uniqueSenders: { type: Number, default: 0 },
    uniqueReceivers: { type: Number, default: 0 },
    avgGiftValue: { type: Number, default: 0 },
    topGifts: [{
      giftId: mongoose.Schema.Types.ObjectId,
      name: String,
      count: Number,
      revenue: Number
    }]
  },
  
  // Livestream Metrics
  livestreams: {
    total: { type: Number, default: 0 },
    active: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    totalViewers: { type: Number, default: 0 },
    avgViewers: { type: Number, default: 0 },
    totalDuration: { type: Number, default: 0 },
    avgDuration: { type: Number, default: 0 },
    giftsReceived: { type: Number, default: 0 }
  },
  
  // Product Metrics
  products: {
    total: { type: Number, default: 0 },
    new: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    avgPrice: { type: Number, default: 0 }
  },
  
  // Order Metrics
  orders: {
    total: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    cancelled: { type: Number, default: 0 },
    avgValue: { type: Number, default: 0 }
  },
  
  // Engagement Metrics
  engagement: {
    pageViews: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    avgSessionDuration: { type: Number, default: 0 },
    bounceRate: { type: Number, default: 0 },
    interactions: { type: Number, default: 0 }
  },
  
  // Geographic Data
  geography: {
    topCountries: [{
      country: String,
      users: Number,
      revenue: Number
    }],
    topCities: [{
      city: String,
      users: Number,
      revenue: Number
    }]
  },
  
  // Device Data
  devices: {
    mobile: { type: Number, default: 0 },
    tablet: { type: Number, default: 0 },
    desktop: { type: Number, default: 0 }
  },
  
  // Performance Metrics
  performance: {
    avgResponseTime: { type: Number, default: 0 },
    errorRate: { type: Number, default: 0 },
    uptime: { type: Number, default: 100 }
  }
}, {
  timestamps: true
});

// Indexes
platformAnalyticsSchema.index({ date: 1, period: 1 }, { unique: true });
platformAnalyticsSchema.index({ period: 1, date: -1 });

// User Analytics Schema - Individual user behavior tracking
const userAnalyticsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  date: {
    type: Date,
    required: true,
    index: true
  },
  
  // Session Data
  sessions: {
    count: { type: Number, default: 0 },
    totalDuration: { type: Number, default: 0 },
    avgDuration: { type: Number, default: 0 },
    lastSession: Date
  },
  
  // Activity Metrics
  activity: {
    pageViews: { type: Number, default: 0 },
    uniquePages: { type: Number, default: 0 },
    searches: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    interactions: { type: Number, default: 0 }
  },
  
  // Shopping Behavior
  shopping: {
    productsViewed: { type: Number, default: 0 },
    addedToCart: { type: Number, default: 0 },
    ordersPlaced: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    avgOrderValue: { type: Number, default: 0 }
  },
  
  // Credit & Gift Activity
  credits: {
    purchased: { type: Number, default: 0 },
    spent: { type: Number, default: 0 },
    balance: { type: Number, default: 0 }
  },
  
  gifting: {
    giftsSent: { type: Number, default: 0 },
    giftsReceived: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    totalReceived: { type: Number, default: 0 }
  },
  
  // Livestream Engagement
  livestreams: {
    watched: { type: Number, default: 0 },
    totalWatchTime: { type: Number, default: 0 },
    giftsInStreams: { type: Number, default: 0 },
    interactionsInStreams: { type: Number, default: 0 }
  },
  
  // Social Interactions
  social: {
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    posts: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    likes: { type: Number, default: 0 }
  },
  
  // Device Usage
  devices: {
    mobile: { type: Number, default: 0 },
    tablet: { type: Number, default: 0 },
    desktop: { type: Number, default: 0 }
  },
  
  // User Segments
  segments: [String],
  
  // RFM Score (Recency, Frequency, Monetary)
  rfm: {
    recency: { type: Number, default: 0 },      // Days since last activity
    frequency: { type: Number, default: 0 },    // Number of transactions
    monetary: { type: Number, default: 0 },     // Total spent
    score: { type: Number, default: 0 }         // Combined RFM score
  }
}, {
  timestamps: true
});

// Compound index
userAnalyticsSchema.index({ user: 1, date: 1 }, { unique: true });

// Event Tracking Schema - Track specific events
const eventTrackingSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true,
    index: true,
    enum: [
      // User Events
      'user_signup', 'user_login', 'user_logout', 'user_profile_update',
      // Product Events
      'product_view', 'product_search', 'product_add_to_cart', 'product_purchase',
      // Credit Events
      'credit_purchase', 'credit_spend', 'gift_send', 'gift_receive',
      // Livestream Events
      'stream_start', 'stream_end', 'stream_join', 'stream_leave', 'stream_gift',
      // Social Events
      'follow', 'unfollow', 'post_create', 'comment_create', 'like',
      // CMS Events
      'page_view', 'banner_click', 'theme_change',
      // Other
      'error', 'custom'
    ]
  },
  
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  // Related Entities
  relatedEntities: {
    productId: mongoose.Schema.Types.ObjectId,
    orderId: mongoose.Schema.Types.ObjectId,
    livestreamId: mongoose.Schema.Types.ObjectId,
    giftId: mongoose.Schema.Types.ObjectId,
    pageId: mongoose.Schema.Types.ObjectId
  },
  
  // Event Data
  data: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  
  // Session Info
  sessionId: String,
  
  // Device & Location
  device: {
    type: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop', 'unknown']
    },
    os: String,
    browser: String,
    userAgent: String
  },
  
  location: {
    country: String,
    city: String,
    ip: String
  },
  
  // Timing
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  duration: Number, // For events with duration
  
  // Metadata
  metadata: {
    referrer: String,
    path: String,
    query: Map
  }
}, {
  timestamps: true
});

// Indexes
eventTrackingSchema.index({ eventType: 1, timestamp: -1 });
eventTrackingSchema.index({ user: 1, timestamp: -1 });
eventTrackingSchema.index({ timestamp: -1 });

// Methods for PlatformAnalytics
platformAnalyticsSchema.statics.getMetrics = async function(startDate, endDate, period = 'daily') {
  const metrics = await this.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
        period: period
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$revenue.total' },
        totalUsers: { $last: '$users.total' },
        newUsers: { $sum: '$users.new' },
        totalOrders: { $sum: '$orders.total' },
        totalCredits: { $sum: '$credits.purchased' },
        totalGifts: { $sum: '$gifts.sent' },
        totalLivestreams: { $sum: '$livestreams.total' },
        avgOrderValue: { $avg: '$orders.avgValue' }
      }
    }
  ]);
  
  return metrics[0] || {};
};

platformAnalyticsSchema.statics.getTrend = async function(metric, days = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.find({
    date: { $gte: startDate },
    period: 'daily'
  })
  .sort({ date: 1 })
  .select(`date ${metric}`);
};

// Methods for UserAnalytics
userAnalyticsSchema.statics.getUserSegment = async function(userId) {
  const analytics = await this.findOne({ user: userId })
    .sort({ date: -1 });
  
  if (!analytics) return 'new';
  
  const rfmScore = analytics.rfm.score;
  
  if (rfmScore >= 9) return 'champions';
  if (rfmScore >= 7) return 'loyal';
  if (rfmScore >= 5) return 'potential';
  if (rfmScore >= 3) return 'at_risk';
  return 'inactive';
};

// Methods for EventTracking
eventTrackingSchema.statics.trackEvent = async function(eventData) {
  return this.create(eventData);
};

eventTrackingSchema.statics.getEventStats = async function(eventType, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        eventType: eventType,
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
        },
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$user' }
      }
    },
    {
      $project: {
        date: '$_id',
        count: 1,
        uniqueUsers: { $size: '$uniqueUsers' }
      }
    },
    {
      $sort: { date: 1 }
    }
  ]);
};

const PlatformAnalytics = mongoose.model('PlatformAnalytics', platformAnalyticsSchema);
const UserAnalytics = mongoose.model('UserAnalytics', userAnalyticsSchema);
const EventTracking = mongoose.model('EventTracking', eventTrackingSchema);

module.exports = {
  PlatformAnalytics,
  UserAnalytics,
  EventTracking
};
