const { StreamProvider } = require('../models/StreamProvider');
const { AuditLog } = require('../models/AuditLog');

// @desc    Get all stream providers
// @route   GET /api/streaming/providers
// @access  Admin
exports.getProviders = async (req, res) => {
  try {
    const { enabled, status } = req.query;
    
    const query = {};
    if (enabled !== undefined) query.enabled = enabled === 'true';
    if (status) query.status = status;
    
    const providers = await StreamProvider.find(query)
      .sort({ priority: 1 })
      .populate('createdBy', 'fullName')
      .populate('lastModifiedBy', 'fullName');
    
    res.json({
      success: true,
      data: providers
    });
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stream providers',
      error: error.message
    });
  }
};

// @desc    Get single provider
// @route   GET /api/streaming/providers/:name
// @access  Admin
exports.getProvider = async (req, res) => {
  try {
    const provider = await StreamProvider.findOne({ name: req.params.name })
      .populate('createdBy', 'fullName avatar')
      .populate('lastModifiedBy', 'fullName avatar');
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }
    
    res.json({
      success: true,
      data: provider
    });
  } catch (error) {
    console.error('Get provider error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch provider',
      error: error.message
    });
  }
};

// @desc    Create stream provider
// @route   POST /api/streaming/providers
// @access  SuperAdmin
exports.createProvider = async (req, res) => {
  try {
    const providerData = {
      ...req.body,
      createdBy: req.user._id,
      lastModifiedBy: req.user._id
    };
    
    const provider = await StreamProvider.create(providerData);
    
    // Log creation
    await AuditLog.logChange({
      entityType: 'stream_provider',
      entityId: provider._id,
      action: 'create',
      userId: req.user._id,
      userName: req.user.fullName,
      description: `Created stream provider: ${provider.displayName}`,
      severity: 'medium'
    });
    
    res.status(201).json({
      success: true,
      message: 'Stream provider created successfully',
      data: provider
    });
  } catch (error) {
    console.error('Create provider error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create provider',
      error: error.message
    });
  }
};

// @desc    Update stream provider
// @route   PUT /api/streaming/providers/:name
// @access  Admin
exports.updateProvider = async (req, res) => {
  try {
    const provider = await StreamProvider.findOne({ name: req.params.name });
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }
    
    const oldData = provider.toObject();
    
    // Update fields
    const updateFields = [
      'displayName', 'description', 'enabled', 'status', 'priority',
      'config', 'limits', 'pricing', 'webhooks', 'notes'
    ];
    
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'config' || field === 'limits' || field === 'pricing' || field === 'webhooks') {
          provider[field] = { ...provider[field], ...req.body[field] };
        } else {
          provider[field] = req.body[field];
        }
      }
    });
    
    provider.lastModifiedBy = req.user._id;
    await provider.save();
    
    // Log update
    await AuditLog.logChange({
      entityType: 'stream_provider',
      entityId: provider._id,
      action: 'update',
      userId: req.user._id,
      userName: req.user.fullName,
      description: `Updated stream provider: ${provider.displayName}`,
      oldValue: oldData,
      newValue: provider.toObject(),
      severity: 'low'
    });
    
    res.json({
      success: true,
      message: 'Provider updated successfully',
      data: provider
    });
  } catch (error) {
    console.error('Update provider error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update provider',
      error: error.message
    });
  }
};

// @desc    Delete stream provider
// @route   DELETE /api/streaming/providers/:name
// @access  SuperAdmin
exports.deleteProvider = async (req, res) => {
  try {
    const provider = await StreamProvider.findOne({ name: req.params.name });
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }
    
    // Check if provider has active streams
    if (provider.stats.activeStreams > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete provider with active streams'
      });
    }
    
    await provider.deleteOne();
    
    // Log deletion
    await AuditLog.logChange({
      entityType: 'stream_provider',
      entityId: provider._id,
      action: 'delete',
      userId: req.user._id,
      userName: req.user.fullName,
      description: `Deleted stream provider: ${provider.displayName}`,
      severity: 'high',
      snapshot: provider.toObject()
    });
    
    res.json({
      success: true,
      message: 'Provider deleted successfully'
    });
  } catch (error) {
    console.error('Delete provider error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete provider',
      error: error.message
    });
  }
};

// @desc    Check provider health
// @route   POST /api/streaming/providers/:name/health-check
// @access  Admin
exports.checkHealth = async (req, res) => {
  try {
    const provider = await StreamProvider.findOne({ name: req.params.name });
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }
    
    const health = await provider.checkHealth();
    
    res.json({
      success: true,
      data: {
        provider: provider.name,
        displayName: provider.displayName,
        healthy: health.healthy,
        latency: health.latency,
        status: health.status,
        uptime: provider.health.uptime,
        errorRate: provider.health.errorRate,
        consecutiveFailures: provider.health.consecutiveFailures
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
};

// @desc    Run health checks on all providers
// @route   POST /api/streaming/providers/health-check-all
// @access  Admin
exports.checkAllHealth = async (req, res) => {
  try {
    const results = await StreamProvider.runHealthChecks();
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Health check all error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run health checks',
      error: error.message
    });
  }
};

// @desc    Get best available provider
// @route   GET /api/streaming/providers/best
// @access  Admin
exports.getBestProvider = async (req, res) => {
  try {
    const requirements = req.query.features ? JSON.parse(req.query.features) : {};
    
    const provider = await StreamProvider.getBestProvider({ features: requirements });
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'No available provider found'
      });
    }
    
    res.json({
      success: true,
      data: {
        name: provider.name,
        displayName: provider.displayName,
        priority: provider.priority,
        health: provider.health,
        hasCapacity: provider.hasCapacity,
        features: provider.config.features
      }
    });
  } catch (error) {
    console.error('Get best provider error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get best provider',
      error: error.message
    });
  }
};

// @desc    Get provider statistics
// @route   GET /api/streaming/providers/statistics
// @access  Admin
exports.getStatistics = async (req, res) => {
  try {
    const stats = await StreamProvider.getStatistics();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

// @desc    Reset monthly usage for provider
// @route   POST /api/streaming/providers/:name/reset-usage
// @access  SuperAdmin
exports.resetMonthlyUsage = async (req, res) => {
  try {
    const provider = await StreamProvider.findOne({ name: req.params.name });
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }
    
    const oldUsage = provider.limits.usedMinutes;
    await provider.resetMonthlyUsage();
    
    // Log reset
    await AuditLog.logChange({
      entityType: 'stream_provider',
      entityId: provider._id,
      action: 'update',
      userId: req.user._id,
      userName: req.user.fullName,
      description: `Reset monthly usage for ${provider.displayName}`,
      oldValue: { usedMinutes: oldUsage },
      newValue: { usedMinutes: 0 },
      severity: 'medium'
    });
    
    res.json({
      success: true,
      message: 'Monthly usage reset successfully',
      data: {
        previousUsage: oldUsage,
        currentUsage: provider.limits.usedMinutes
      }
    });
  } catch (error) {
    console.error('Reset usage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset usage',
      error: error.message
    });
  }
};
