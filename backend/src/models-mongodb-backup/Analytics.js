const mongoose = require('mongoose');

// Analytics Dashboard Schema
const analyticsDashboardSchema = new mongoose.Schema({
  // Dashboard Information
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  
  description: {
    type: String,
    maxlength: 500
  },
  
  // Dashboard Type
  type: {
    type: String,
    enum: [
      'admin_overview',
      'sales_performance',
      'product_analytics',
      'customer_insights',
      'store_performance',
      'financial_summary',
      'marketing_metrics',
      'operational_metrics',
      'custom'
    ],
    required: true
  },
  
  // Owner and Access
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store'
  },
  
  // Dashboard Configuration
  layout: {
    columns: {
      type: Number,
      default: 12,
      min: 1,
      max: 24
    },
    
    widgets: [{
      id: String,
      type: {
        type: String,
        enum: [
          'metric_card',
          'chart',
          'table',
          'progress_bar',
          'gauge',
          'map',
          'timeline',
          'heatmap',
          'funnel',
          'custom'
        ]
      },
      title: String,
      position: {
        x: Number,
        y: Number,
        width: Number,
        height: Number
      },
      config: mongoose.Schema.Types.Mixed,
      dataSource: String,
      refreshRate: {
        type: Number,
        default: 300 // seconds
      }
    }]
  },
  
  // Access Control
  visibility: {
    type: String,
    enum: ['private', 'shared', 'public'],
    default: 'private'
  },
  
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['view', 'edit'],
      default: 'view'
    }
  }],
  
  // Metadata
  tags: [String],
  
  isDefault: {
    type: Boolean,
    default: false
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Usage Tracking
  viewCount: {
    type: Number,
    default: 0
  },
  
  lastViewedAt: Date,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Analytics Report Schema
const analyticsReportSchema = new mongoose.Schema({
  // Report Information
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  
  description: {
    type: String,
    maxlength: 500
  },
  
  // Report Type
  type: {
    type: String,
    enum: [
      'sales_report',
      'product_performance',
      'customer_analysis',
      'inventory_report',
      'financial_statement',
      'marketing_roi',
      'shipping_analysis',
      'support_metrics',
      'compliance_report',
      'custom'
    ],
    required: true
  },
  
  // Report Configuration
  parameters: {
    dateRange: {
      start: Date,
      end: Date,
      period: {
        type: String,
        enum: ['day', 'week', 'month', 'quarter', 'year', 'custom']
      }
    },
    
    filters: {
      storeIds: [mongoose.Schema.Types.ObjectId],
      productIds: [mongoose.Schema.Types.ObjectId],
      categoryIds: [mongoose.Schema.Types.ObjectId],
      customerSegments: [String],
      regions: [String],
      channels: [String]
    },
    
    groupBy: [String],
    sortBy: String,
    sortOrder: {
      type: String,
      enum: ['asc', 'desc'],
      default: 'desc'
    },
    
    metrics: [String],
    limit: Number
  },
  
  // Report Data (Cached)
  data: {
    summary: mongoose.Schema.Types.Mixed,
    details: mongoose.Schema.Types.Mixed,
    charts: mongoose.Schema.Types.Mixed,
    metadata: {
      recordCount: Number,
      generatedAt: Date,
      executionTime: Number, // milliseconds
      dataFreshness: Date
    }
  },
  
  // Scheduling
  schedule: {
    enabled: {
      type: Boolean,
      default: false
    },
    
    frequency: {
      type: String,
      enum: ['hourly', 'daily', 'weekly', 'monthly', 'quarterly']
    },
    
    time: String, // HH:MM format
    dayOfWeek: Number, // 0-6 (Sunday-Saturday)
    dayOfMonth: Number, // 1-31
    
    nextRun: Date,
    lastRun: Date
  },
  
  // Distribution
  recipients: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    email: String,
    format: {
      type: String,
      enum: ['pdf', 'excel', 'csv', 'json'],
      default: 'pdf'
    }
  }],
  
  // Owner and Access
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store'
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'archived'],
    default: 'draft'
  },
  
  // Cache Control
  cacheSettings: {
    enabled: {
      type: Boolean,
      default: true
    },
    ttl: {
      type: Number,
      default: 3600 // seconds
    },
    refreshOnAccess: {
      type: Boolean,
      default: false
    }
  },
  
  // Usage Tracking
  accessCount: {
    type: Number,
    default: 0
  },
  
  lastAccessedAt: Date,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Analytics Event Schema (for tracking user actions)
const analyticsEventSchema = new mongoose.Schema({
  // Event Information
  eventType: {
    type: String,
    required: true,
    index: true
  },
  
  eventCategory: {
    type: String,
    required: true,
    index: true
  },
  
  eventAction: {
    type: String,
    required: true
  },
  
  eventLabel: String,
  
  // User Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  sessionId: String,
  
  // Context Information
  page: String,
  referrer: String,
  
  userAgent: String,
  ipAddress: String,
  
  // Geo Information
  country: String,
  region: String,
  city: String,
  
  // Device Information
  device: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet', 'unknown']
  },
  
  browser: String,
  os: String,
  
  // E-commerce Specific Data
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store'
  },
  
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  
  // Event Data
  value: Number, // monetary value or metric value
  quantity: Number,
  
  properties: mongoose.Schema.Types.Mixed,
  
  // Timestamps
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Processing Status
  processed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: false // Using custom timestamp field
});

// KPI (Key Performance Indicator) Schema
const kpiSchema = new mongoose.Schema({
  // KPI Information
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  
  description: {
    type: String,
    maxlength: 500
  },
  
  // KPI Configuration
  metric: {
    type: String,
    required: true // e.g., 'revenue', 'conversion_rate', 'avg_order_value'
  },
  
  calculation: {
    formula: String, // Mathematical formula or aggregation query
    source: String, // Data source (table/collection)
    aggregation: mongoose.Schema.Types.Mixed
  },
  
  // Target and Thresholds
  target: {
    value: Number,
    period: {
      type: String,
      enum: ['day', 'week', 'month', 'quarter', 'year']
    }
  },
  
  thresholds: {
    excellent: Number,
    good: Number,
    warning: Number,
    critical: Number
  },
  
  // Current Value
  currentValue: {
    value: Number,
    lastUpdated: Date,
    trend: {
      type: String,
      enum: ['up', 'down', 'stable', 'unknown'],
      default: 'unknown'
    },
    changePercent: Number,
    previousValue: Number
  },
  
  // Display Configuration
  display: {
    unit: String, // '$', '%', 'units', etc.
    format: String, // 'currency', 'percentage', 'number'
    decimals: {
      type: Number,
      default: 2
    },
    prefix: String,
    suffix: String
  },
  
  // Owner and Scope
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store'
  },
  
  // Update Configuration
  updateFrequency: {
    type: String,
    enum: ['real-time', 'hourly', 'daily', 'weekly'],
    default: 'daily'
  },
  
  lastUpdate: Date,
  nextUpdate: Date,
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Historical Data (last 30 periods)
  history: [{
    value: Number,
    date: Date,
    period: String
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Business Intelligence Cache Schema
const biCacheSchema = new mongoose.Schema({
  // Cache Key
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Cache Data
  data: mongoose.Schema.Types.Mixed,
  
  // Metadata
  metadata: {
    size: Number, // bytes
    recordCount: Number,
    generatedAt: Date,
    executionTime: Number
  },
  
  // Cache Configuration
  ttl: {
    type: Number,
    default: 3600 // seconds
  },
  
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 }
  },
  
  // Access Tracking
  accessCount: {
    type: Number,
    default: 0
  },
  
  lastAccessedAt: Date,
  
  // Cache Tags for invalidation
  tags: [String],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for performance
analyticsDashboardSchema.index({ owner: 1, type: 1 });
analyticsDashboardSchema.index({ storeId: 1, isActive: 1 });
analyticsDashboardSchema.index({ visibility: 1, isActive: 1 });

analyticsReportSchema.index({ owner: 1, type: 1 });
analyticsReportSchema.index({ storeId: 1, status: 1 });
analyticsReportSchema.index({ 'schedule.enabled': 1, 'schedule.nextRun': 1 });

analyticsEventSchema.index({ eventType: 1, eventCategory: 1, timestamp: -1 });
analyticsEventSchema.index({ userId: 1, timestamp: -1 });
analyticsEventSchema.index({ storeId: 1, timestamp: -1 });
analyticsEventSchema.index({ timestamp: -1 }); // For time-based queries
analyticsEventSchema.index({ processed: 1 }); // For processing queue

kpiSchema.index({ owner: 1, metric: 1 });
kpiSchema.index({ storeId: 1, isActive: 1 });
kpiSchema.index({ updateFrequency: 1, nextUpdate: 1 });

biCacheSchema.index({ key: 1 });
biCacheSchema.index({ expiresAt: 1 });
biCacheSchema.index({ tags: 1 });

// Pre-save middleware
analyticsDashboardSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

analyticsReportSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Set cache expiration
  if (this.cacheSettings.enabled && this.data && this.data.metadata) {
    const expirationTime = new Date(
      this.data.metadata.generatedAt.getTime() + (this.cacheSettings.ttl * 1000)
    );
    this.data.metadata.expiresAt = expirationTime;
  }
  
  next();
});

kpiSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Calculate trend
  if (this.currentValue.value !== undefined && this.currentValue.previousValue !== undefined) {
    const change = this.currentValue.value - this.currentValue.previousValue;
    this.currentValue.changePercent = this.currentValue.previousValue !== 0 
      ? (change / this.currentValue.previousValue) * 100 
      : 0;
    
    if (change > 0) {
      this.currentValue.trend = 'up';
    } else if (change < 0) {
      this.currentValue.trend = 'down';
    } else {
      this.currentValue.trend = 'stable';
    }
  }
  
  next();
});

biCacheSchema.pre('save', function(next) {
  // Set expiration date
  this.expiresAt = new Date(Date.now() + (this.ttl * 1000));
  next();
});

// Virtual fields
kpiSchema.virtual('status').get(function() {
  if (!this.currentValue.value || !this.thresholds) return 'unknown';
  
  const value = this.currentValue.value;
  const thresholds = this.thresholds;
  
  if (value >= thresholds.excellent) return 'excellent';
  if (value >= thresholds.good) return 'good';
  if (value >= thresholds.warning) return 'warning';
  return 'critical';
});

kpiSchema.virtual('targetProgress').get(function() {
  if (!this.target.value || !this.currentValue.value) return 0;
  return Math.min((this.currentValue.value / this.target.value) * 100, 100);
});

// Create models
const AnalyticsDashboard = mongoose.model('AnalyticsDashboard', analyticsDashboardSchema);
const AnalyticsReport = mongoose.model('AnalyticsReport', analyticsReportSchema);
const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema);
const KPI = mongoose.model('KPI', kpiSchema);
const BICache = mongoose.model('BICache', biCacheSchema);

module.exports = {
  AnalyticsDashboard,
  AnalyticsReport,
  AnalyticsEvent,
  KPI,
  BICache
};