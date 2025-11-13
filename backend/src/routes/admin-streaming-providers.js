const express = require('express');
const router = express.Router();
const StreamProvider = require('../models/StreamProvider');
const { verifyJWT, requireAdmin } = require('../middleware/jwtAuth');

/**
 * Admin Routes for Streaming Provider Management
 * These routes allow admin dashboard to manage provider credentials
 */

/**
 * @route   GET /api/admin/streaming-providers
 * @desc    Get all streaming providers with full config (admin only)
 * @access  Private/Admin
 */
router.get('/streaming-providers', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const providers = await StreamProvider.find()
      .sort({ priority: 1 })
      .select('+config'); // Include sensitive config for admins

    res.json({
      success: true,
      data: providers
    });
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching providers',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/admin/streaming-providers
 * @desc    Create new streaming provider
 * @access  Private/Admin
 */
router.post('/streaming-providers', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      displayName,
      enabled,
      priority,
      config,
      features,
      usageLimit
    } = req.body;

    // Validate provider name
    if (!['agora', 'zegocloud', 'webrtc'].includes(name)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid provider name. Must be: agora, zegocloud, or webrtc'
      });
    }

    // Check if provider already exists
    const existing = await StreamProvider.findOne({ name });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Provider already exists. Use PUT to update.'
      });
    }

    const provider = new StreamProvider({
      name,
      displayName,
      enabled,
      priority,
      config,
      features,
      usageLimit,
      status: 'active'
    });

    await provider.save();

    res.status(201).json({
      success: true,
      data: provider,
      message: 'Streaming provider created successfully'
    });
  } catch (error) {
    console.error('Error creating provider:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating provider',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/admin/streaming-providers/:id
 * @desc    Update streaming provider (including credentials)
 * @access  Private/Admin
 */
router.put('/streaming-providers/:id', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Find and update provider
    const provider = await StreamProvider.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    res.json({
      success: true,
      data: provider,
      message: 'Provider updated successfully'
    });
  } catch (error) {
    console.error('Error updating provider:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating provider',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/admin/streaming-providers/:name/credentials
 * @desc    Update provider API credentials
 * @access  Private/Admin
 */
router.put('/streaming-providers/:name/credentials', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { name } = req.params;
    const { appId, appCertificate, appSign, serverSecret } = req.body;

    const provider = await StreamProvider.findOne({ name });
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    // Update config based on provider type
    if (name === 'agora') {
      provider.config = {
        ...provider.config,
        appId,
        appCertificate
      };
    } else if (name === 'zegocloud') {
      provider.config = {
        ...provider.config,
        appId: parseInt(appId),
        serverSecret
      };
    }

    await provider.save();

    res.json({
      success: true,
      data: provider,
      message: `${provider.displayName} credentials updated successfully`
    });
  } catch (error) {
    console.error('Error updating credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating credentials',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/admin/streaming-providers/:id
 * @desc    Delete streaming provider
 * @access  Private/Admin
 */
router.delete('/streaming-providers/:id', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const provider = await StreamProvider.findByIdAndDelete(id);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    res.json({
      success: true,
      message: 'Provider deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting provider:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting provider',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/admin/streaming-providers/:name/test
 * @desc    Test provider credentials
 * @access  Private/Admin
 */
router.post('/streaming-providers/:name/test', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { name } = req.params;
    const provider = await StreamProvider.findOne({ name });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    if (!provider.config || !provider.config.appId) {
      return res.status(400).json({
        success: false,
        message: 'Provider credentials not configured'
      });
    }

    // Test token generation
    let testResult = { success: false };

    if (name === 'agora') {
      try {
        const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
        const { appId, appCertificate } = provider.config;

        if (!appCertificate) {
          throw new Error('App certificate not configured');
        }

        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpiredTs = currentTimestamp + 3600;

        const token = RtcTokenBuilder.buildTokenWithUid(
          appId,
          appCertificate,
          'test_channel',
          0,
          RtcRole.PUBLISHER,
          privilegeExpiredTs
        );

        testResult = {
          success: true,
          message: 'Agora credentials valid',
          tokenGenerated: true,
          tokenLength: token.length
        };
      } catch (err) {
        testResult = {
          success: false,
          message: `Agora test failed: ${err.message}`
        };
      }
    } else if (name === 'zegocloud') {
      try {
        const crypto = require('crypto');
        const { appId, serverSecret } = provider.config;

        if (!serverSecret) {
          throw new Error('Server secret not configured');
        }

        const nonce = crypto.randomBytes(16).toString('base64');
        const timestamp = Math.floor(Date.now() / 1000);
        const payload = {
          app_id: appId,
          user_id: 'test_user',
          nonce,
          ctime: timestamp,
          expire: timestamp + 7200
        };

        const payloadString = JSON.stringify(payload);
        const signature = crypto
          .createHmac('sha256', serverSecret)
          .update(payloadString)
          .digest('hex');

        testResult = {
          success: true,
          message: 'ZegoCloud credentials valid',
          tokenGenerated: true,
          signatureLength: signature.length
        };
      } catch (err) {
        testResult = {
          success: false,
          message: `ZegoCloud test failed: ${err.message}`
        };
      }
    }

    // Update health status
    provider.lastHealthCheck = new Date();
    provider.healthStatus = testResult.success ? 'healthy' : 'error';
    await provider.save();

    res.json({
      success: testResult.success,
      data: testResult
    });
  } catch (error) {
    console.error('Error testing provider:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing provider',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/admin/streaming-providers/seed
 * @desc    Seed default providers (for initial setup)
 * @access  Private/Admin
 */
router.post('/streaming-providers/seed', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const defaultProviders = [
      {
        name: 'agora',
        displayName: 'Agora RTC',
        enabled: true,
        priority: 1,
        config: {
          appId: process.env.AGORA_APP_ID || '',
          appCertificate: process.env.AGORA_APP_CERTIFICATE || '',
          region: 'global'
        },
        features: {
          pkBattle: true,
          screenShare: true,
          beautyFilter: true,
          maxResolution: '1440p',
          maxViewers: 10000
        },
        status: 'active'
      },
      {
        name: 'zegocloud',
        displayName: 'ZegoCloud Express',
        enabled: true,
        priority: 2,
        config: {
          appId: parseInt(process.env.ZEGO_APP_ID) || 0,
          serverSecret: process.env.ZEGO_SERVER_SECRET || '',
          region: 'global'
        },
        features: {
          pkBattle: true,
          screenShare: true,
          beautyFilter: true,
          virtualBackground: true,
          maxResolution: '1080p',
          maxViewers: 100000
        },
        status: 'active'
      }
    ];

    const created = [];
    for (const providerData of defaultProviders) {
      const existing = await StreamProvider.findOne({ name: providerData.name });
      if (!existing) {
        const provider = new StreamProvider(providerData);
        await provider.save();
        created.push(provider);
      }
    }

    res.json({
      success: true,
      data: created,
      message: `Seeded ${created.length} providers successfully`
    });
  } catch (error) {
    console.error('Error seeding providers:', error);
    res.status(500).json({
      success: false,
      message: 'Error seeding providers',
      error: error.message
    });
  }
});

module.exports = router;
