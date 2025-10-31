const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // What was changed
  entityType: {
    type: String,
    required: true,
    enum: [
      'setting',
      'language',
      'translation',
      'streaming_provider',
      'cms_page',
      'banner',
      'theme',
      'supporter_level',
      'currency',
      'coin_config',
      'moderation_rule',
      'payment_config',
      'ad_config',
      'media_config',
      'integration',
      'notification_template',
      'user',
      'store',
      'product',
      'order'
    ],
    index: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  
  // Action performed
  action: {
    type: String,
    required: true,
    enum: ['create', 'update', 'delete', 'enable', 'disable', 'publish', 'archive', 'restore', 'export', 'import'],
    index: true
  },
  
  // Who made the change
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userName: String, // Denormalized for quick display
  userRole: String,
  
  // What changed
  category: String, // For settings
  fieldName: String, // Specific field that changed
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  
  // Full snapshot for critical changes
  snapshot: mongoose.Schema.Types.Mixed,
  
  // Context
  description: String, // Human-readable description of the change
  reason: String, // Admin-provided reason for the change
  
  // Request metadata
  ipAddress: String,
  userAgent: String,
  requestId: String, // For tracing
  
  // Impact tracking
  affectedUsers: Number, // Estimated number of users affected
  affectedRegions: [String],
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  
  // Rollback support
  rollbackData: mongoose.Schema.Types.Mixed, // Data needed to rollback this change
  canRollback: {
    type: Boolean,
    default: false
  },
  rolledBack: {
    type: Boolean,
    default: false
  },
  rolledBackBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rolledBackAt: Date,
  
  // Tags for filtering
  tags: [String],
  
  // Flags
  isSystemAction: {
    type: Boolean,
    default: false // True for automated system changes
  },
  requiresNotification: {
    type: Boolean,
    default: false // If true, notify other admins
  },
  notified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for common queries
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ category: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ severity: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 }); // For recent activity

// Static method to log change
auditLogSchema.statics.logChange = async function(data) {
  const log = new this({
    ...data,
    createdAt: Date.now()
  });
  
  await log.save();
  return log;
};

// Static method to log setting change
auditLogSchema.statics.logSettingChange = async function(setting, oldValue, newValue, userId, req = null) {
  const user = userId ? await mongoose.model('User').findById(userId).select('fullName role') : null;
  
  return this.logChange({
    entityType: 'setting',
    entityId: setting._id,
    action: 'update',
    userId,
    userName: user?.fullName || 'System',
    userRole: user?.role || 'system',
    category: setting.category,
    fieldName: setting.key,
    oldValue: oldValue,
    newValue: newValue,
    description: `Updated ${setting.category}.${setting.key} from "${oldValue}" to "${newValue}"`,
    ipAddress: req?.ip || req?.connection?.remoteAddress,
    userAgent: req?.get('user-agent'),
    severity: setting.encrypted ? 'high' : 'medium',
    canRollback: true,
    rollbackData: { value: oldValue, version: setting.version - 1 },
    requiresNotification: setting.category === 'security' || setting.encrypted
  });
};

// Method to perform rollback
auditLogSchema.methods.performRollback = async function(adminUserId) {
  if (!this.canRollback || this.rolledBack) {
    throw new Error('Cannot rollback this change');
  }
  
  const { Setting } = require('./Setting');
  
  if (this.entityType === 'setting') {
    const setting = await Setting.findById(this.entityId);
    if (setting && this.rollbackData) {
      await Setting.setSetting(
        setting.category,
        setting.key,
        this.rollbackData.value,
        adminUserId,
        { encrypted: setting.encrypted }
      );
    }
  }
  
  this.rolledBack = true;
  this.rolledBackBy = adminUserId;
  this.rolledBackAt = Date.now();
  await this.save();
  
  // Log the rollback action
  await this.constructor.logChange({
    entityType: this.entityType,
    entityId: this.entityId,
    action: 'restore',
    userId: adminUserId,
    description: `Rolled back change from ${this.createdAt}`,
    severity: 'high',
    tags: ['rollback']
  });
};

// Static method to get recent activity
auditLogSchema.statics.getRecentActivity = async function(options = {}) {
  const {
    limit = 50,
    skip = 0,
    entityType,
    userId,
    category,
    action,
    severity,
    startDate,
    endDate
  } = options;
  
  const query = {};
  if (entityType) query.entityType = entityType;
  if (userId) query.userId = userId;
  if (category) query.category = category;
  if (action) query.action = action;
  if (severity) query.severity = severity;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  const logs = await this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('userId', 'fullName avatar role')
    .lean();
  
  const total = await this.countDocuments(query);
  
  return { logs, total, limit, skip };
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = { AuditLog };
