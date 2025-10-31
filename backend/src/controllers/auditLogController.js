const { AuditLog } = require('../models/AuditLog');

// @desc    Get audit logs with filtering
// @route   GET /api/audit-logs
// @access  Admin
exports.getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      entityType,
      userId,
      category,
      action,
      severity,
      startDate,
      endDate,
      search
    } = req.query;
    
    const skip = (page - 1) * limit;
    
    const result = await AuditLog.getRecentActivity({
      limit: parseInt(limit),
      skip,
      entityType,
      userId,
      category,
      action,
      severity,
      startDate,
      endDate
    });
    
    // Apply search if provided
    if (search) {
      result.logs = result.logs.filter(log =>
        log.description?.toLowerCase().includes(search.toLowerCase()) ||
        log.userName?.toLowerCase().includes(search.toLowerCase()) ||
        log.fieldName?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    res.json({
      success: true,
      data: result.logs,
      pagination: {
        total: result.total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(result.total / limit)
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: error.message
    });
  }
};

// @desc    Get audit log by ID
// @route   GET /api/audit-logs/:id
// @access  Admin
exports.getAuditLog = async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id)
      .populate('userId', 'fullName avatar email role')
      .populate('rolledBackBy', 'fullName avatar');
    
    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found'
      });
    }
    
    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit log',
      error: error.message
    });
  }
};

// @desc    Get audit logs for specific entity
// @route   GET /api/audit-logs/entity/:entityType/:entityId
// @access  Admin
exports.getEntityAuditLogs = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { limit = 50 } = req.query;
    
    const logs = await AuditLog.find({ entityType, entityId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('userId', 'fullName avatar role')
      .lean();
    
    res.json({
      success: true,
      data: logs,
      total: logs.length
    });
  } catch (error) {
    console.error('Get entity audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch entity audit logs',
      error: error.message
    });
  }
};

// @desc    Get user activity
// @route   GET /api/audit-logs/user/:userId
// @access  Admin
exports.getUserActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    const logs = await AuditLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();
    
    const total = await AuditLog.countDocuments({ userId });
    
    // Get statistics
    const stats = await AuditLog.aggregate([
      { $match: { userId: require('mongoose').Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: logs,
      stats: stats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user activity',
      error: error.message
    });
  }
};

// @desc    Rollback a change
// @route   POST /api/audit-logs/:id/rollback
// @access  SuperAdmin
exports.rollbackChange = async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id);
    
    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found'
      });
    }
    
    if (!log.canRollback) {
      return res.status(400).json({
        success: false,
        message: 'This change cannot be rolled back'
      });
    }
    
    if (log.rolledBack) {
      return res.status(400).json({
        success: false,
        message: 'This change has already been rolled back'
      });
    }
    
    await log.performRollback(req.user._id);
    
    res.json({
      success: true,
      message: 'Change rolled back successfully'
    });
  } catch (error) {
    console.error('Rollback change error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rollback change',
      error: error.message
    });
  }
};

// @desc    Get audit statistics
// @route   GET /api/audit-logs/stats
// @access  Admin
exports.getAuditStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Activity by action
    const byAction = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Activity by entity type
    const byEntityType = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$entityType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Activity by severity
    const bySeverity = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Top active users
    const topUsers = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 },
          userName: { $first: '$userName' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Activity over time (daily)
    const timeline = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        byAction,
        byEntityType,
        bySeverity,
        topUsers,
        timeline,
        period: { days: parseInt(days), startDate }
      }
    });
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit statistics',
      error: error.message
    });
  }
};

// @desc    Export audit logs
// @route   GET /api/audit-logs/export
// @access  Admin
exports.exportAuditLogs = async (req, res) => {
  try {
    const {
      entityType,
      userId,
      category,
      action,
      severity,
      startDate,
      endDate,
      format = 'json'
    } = req.query;
    
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
    
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'fullName email')
      .lean();
    
    // Log the export action
    await AuditLog.logChange({
      entityType: 'audit_log',
      action: 'export',
      userId: req.user._id,
      userName: req.user.fullName,
      description: `Exported ${logs.length} audit logs`,
      severity: 'medium'
    });
    
    if (format === 'csv') {
      const fields = ['createdAt', 'entityType', 'action', 'userName', 'description', 'severity'];
      const csv = [
        fields.join(','),
        ...logs.map(log => fields.map(field => {
          const value = field === 'createdAt' ? new Date(log[field]).toISOString() : log[field];
          return JSON.stringify(value || '');
        }).join(','))
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=audit_logs_${Date.now()}.csv`);
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=audit_logs_${Date.now()}.json`);
      res.json(logs);
    }
  } catch (error) {
    console.error('Export audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export audit logs',
      error: error.message
    });
  }
};
