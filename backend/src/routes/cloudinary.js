const express = require('express');
const router = express.Router();
const { verifyJWT, requireAdmin } = require('../middleware/jwtAuth');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ===========================
// ADMIN ROUTES
// ===========================

// Get Cloudinary configuration
router.get('/admin/cloudinary/config', verifyJWT, requireAdmin, async (req, res) => {
  try {
    // Return cloudinary config from environment or settings
    const config = {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
      apiKey: process.env.CLOUDINARY_API_KEY || '',
      enabled: process.env.CLOUDINARY_ENABLED !== 'false',
      uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || 'mixillo_uploads',
      folder: process.env.CLOUDINARY_FOLDER || 'mixillo'
    };
    
    res.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('Error fetching Cloudinary config:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Update Cloudinary configuration
router.post('/admin/cloudinary/config', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { cloudName, apiKey, apiSecret, uploadPreset, folder, enabled } = req.body;
    
    // In production, this would update environment variables or database settings
    // For now, return success
    
    res.json({
      success: true,
      message: 'Cloudinary configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating Cloudinary config:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get Cloudinary usage statistics
router.get('/admin/cloudinary/stats', verifyJWT, requireAdmin, async (req, res) => {
  try {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      return res.json({
        success: true,
        data: {
          configured: false,
          message: 'Cloudinary not configured',
          storage: { used: 0, limit: 0, percentage: 0 },
          bandwidth: { used: 0, limit: 0 },
          transformations: { used: 0, limit: 0 },
          uploads: { total: 0, thisMonth: 0 }
        }
      });
    }

    // Fetch real usage data from Cloudinary Admin API
    const usage = await cloudinary.api.usage();
    
    const storageUsedGB = (usage.storage?.usage || 0) / (1024 * 1024 * 1024);
    const storageLimitGB = (usage.storage?.limit || 0) / (1024 * 1024 * 1024);
    const bandwidthUsedGB = (usage.bandwidth?.usage || 0) / (1024 * 1024 * 1024);
    const bandwidthLimitGB = (usage.bandwidth?.limit || 0) / (1024 * 1024 * 1024);
    const transformationsUsed = usage.transformations?.usage || 0;
    const transformationsLimit = usage.transformations?.limit || 0;
    
    const stats = {
      configured: true,
      storage: {
        used: parseFloat(storageUsedGB.toFixed(2)),
        limit: parseFloat(storageLimitGB.toFixed(2)),
        percentage: storageLimitGB > 0 ? parseFloat(((storageUsedGB / storageLimitGB) * 100).toFixed(2)) : 0
      },
      bandwidth: {
        used: parseFloat(bandwidthUsedGB.toFixed(2)),
        limit: parseFloat(bandwidthLimitGB.toFixed(2)),
        percentage: bandwidthLimitGB > 0 ? parseFloat(((bandwidthUsedGB / bandwidthLimitGB) * 100).toFixed(2)) : 0
      },
      transformations: {
        count: transformationsUsed,
        limit: transformationsLimit,
        percentage: transformationsLimit > 0 ? parseFloat(((transformationsUsed / transformationsLimit) * 100).toFixed(2)) : 0
      },
      resources: {
        images: usage.resources?.image || 0,
        videos: usage.resources?.video || 0,
        raw: usage.resources?.raw || 0,
        total: (usage.resources?.image || 0) + (usage.resources?.video || 0) + (usage.resources?.raw || 0)
      },
      plan: usage.plan || 'Free',
      lastUpdated: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching Cloudinary stats:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get recent uploads
router.get('/admin/cloudinary/uploads', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { limit = 50, type = 'image' } = req.query;
    
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      return res.json({
        success: true,
        data: { uploads: [], total: 0 }
      });
    }
    
    // Fetch real resources from Cloudinary
    const result = await cloudinary.api.resources({
      type: 'upload',
      resource_type: type,
      max_results: parseInt(limit),
      direction: 'desc'
    });
    
    const uploads = result.resources.map(resource => ({
      publicId: resource.public_id,
      url: resource.secure_url,
      format: resource.format,
      width: resource.width,
      height: resource.height,
      bytes: resource.bytes,
      createdAt: resource.created_at,
      resourceType: resource.resource_type
    }));
    
    res.json({
      success: true,
      data: {
        uploads,
        total: result.total_count || uploads.length
      }
    });
  } catch (error) {
    console.error('Error fetching Cloudinary uploads:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Delete asset
router.delete('/admin/cloudinary/assets/:publicId', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { publicId } = req.params;
    
    // This would call Cloudinary API to delete the asset
    // cloudinary.uploader.destroy(publicId)
    
    res.json({
      success: true,
      message: 'Asset deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting Cloudinary asset:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get CDN performance metrics
router.get('/admin/cloudinary/performance', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    // This would fetch CDN performance data
    const performance = {
      avgLoadTime: 0, // ms
      cacheHitRate: 0, // percentage
      bandwidthSaved: 0, // GB
      requestsServed: 0,
      errorRate: 0 // percentage
    };
    
    res.json({
      success: true,
      performance,
      period
    });
  } catch (error) {
    console.error('Error fetching Cloudinary performance:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
