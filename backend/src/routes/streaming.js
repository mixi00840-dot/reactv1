const express = require('express');
const router = express.Router();
const Livestream = require('../models/Livestream');
const StreamProvider = require('../models/StreamProvider');
const GiftTransaction = require('../models/GiftTransaction');
const { verifyJWT, requireAdmin, optionalAuth } = require('../middleware/jwtAuth');

/**
 * Streaming Routes - MongoDB Implementation
 */

// Health check
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Streaming API is operational (MongoDB)' });
});

/**
 * @route   GET /api/streaming/providers
 * @desc    Get available streaming providers
 * @access  Private
 */
router.get('/providers', verifyJWT, async (req, res) => {
  try {
    const providers = await StreamProvider.find({ enabled: true })
      .sort({ priority: 1 })
      .lean();
    
    // Default providers if none in database
    if (providers.length === 0) {
      const defaultProviders = [
        {
          name: 'agora',
          displayName: 'Agora',
          enabled: true,
          status: 'active',
          priority: 1,
          config: {
            appId: process.env.AGORA_APP_ID || '',
            protocol: 'webrtc',
            maxResolution: '1080p'
          },
          features: {
            pkBattle: true,
            multiHost: true,
            screenShare: true
          }
        },
        {
          name: 'zegocloud',
          displayName: 'Zego Cloud',
          enabled: true,
          status: 'active',
          priority: 2,
          config: {
            appId: process.env.ZEGO_APP_ID || '',
            protocol: 'webrtc'
          },
          features: {
            pkBattle: true,
            beautyFilter: true,
            virtualBackground: true
          }
        }
      ];
      
      return res.json({
        success: true,
        data: { providers: defaultProviders, count: defaultProviders.length }
      });
    }
    
    res.json({
      success: true,
      data: { providers, count: providers.length }
    });
    
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({ success: false, message: 'Error fetching providers' });
  }
});

/**
 * @route   GET /api/streaming/livestreams
 * @desc    Get live streams
 * @access  Public
 */
router.get('/livestreams', optionalAuth, async (req, res) => {
  try {
    const { limit = 20, status = 'live' } = req.query;
    
    const livestreams = status === 'live'
      ? await Livestream.getLiveStreams(parseInt(limit))
      : await Livestream.find({ status })
          .sort({ startedAt: -1 })
          .limit(parseInt(limit))
          .populate('hostId', 'username fullName avatar isVerified')
          .lean();
    
    res.json({
      success: true,
      data: { livestreams, count: livestreams.length }
    });
    
  } catch (error) {
    console.error('Get livestreams error:', error);
    res.status(500).json({ success: false, message: 'Error fetching livestreams' });
  }
});

/**
 * @route   POST /api/streaming/livestreams/start
 * @desc    Start a new livestream
 * @access  Private
 */
router.post('/livestreams/start', verifyJWT, async (req, res) => {
  try {
    const hostId = req.user.id || req.user._id;
    const { title, description, isPrivate = false, type = 'solo' } = req.body;
    
    // Get best available provider
    const provider = await StreamProvider.getBestAvailable();
    
    if (!provider) {
      return res.status(503).json({
        success: false,
        message: 'No streaming providers available'
      });
    }
    
    // Generate stream ID
    const streamId = `stream_${Date.now()}_${hostId}`;
    
    const livestream = new Livestream({
      hostId,
      title,
      description,
      isPrivate,
      type,
      provider: provider.name,
      streamId,
      status: 'starting',
      chatRoomId: `chat_${streamId}`
    });
    
    await livestream.save();
    
    res.status(201).json({
      success: true,
      data: {
        livestream,
        streamConfig: {
          provider: provider.name,
          appId: provider.config.appId,
          streamId,
          channelId: streamId
        }
      },
      message: 'Livestream created successfully'
    });
    
  } catch (error) {
    console.error('Start livestream error:', error);
    res.status(500).json({ success: false, message: 'Error starting livestream' });
  }
});

/**
 * @route   POST /api/streaming/livestreams/:livestreamId/end
 * @desc    End a livestream
 * @access  Private (host only)
 */
router.post('/livestreams/:livestreamId/end', verifyJWT, async (req, res) => {
  try {
    const { livestreamId } = req.params;
    const userId = req.user.id || req.user._id;
    
    const livestream = await Livestream.findById(livestreamId);
    
    if (!livestream) {
      return res.status(404).json({ success: false, message: 'Livestream not found' });
    }
    
    if (!livestream.hostId.equals(userId)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    await livestream.end();
    
    res.json({
      success: true,
      data: { livestream },
      message: 'Livestream ended successfully'
    });
    
  } catch (error) {
    console.error('End livestream error:', error);
    res.status(500).json({ success: false, message: 'Error ending livestream' });
  }
});

module.exports = router;

