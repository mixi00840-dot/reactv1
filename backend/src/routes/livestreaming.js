const express = require('express');
const router = express.Router();
const Livestream = require('../models/Livestream');
const StreamProvider = require('../models/StreamProvider');
const GiftTransaction = require('../models/GiftTransaction');
const { verifyJWT } = require('../middleware/jwtAuth');

/**
 * Live Streaming Routes - MongoDB Implementation
 */

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Live Streaming API is working (MongoDB)',
    database: 'MongoDB'
  });
});

/**
 * @route   GET /api/streaming/providers
 * @desc    Get streaming providers
 * @access  Private
 */
router.get('/providers', verifyJWT, async (req, res) => {
  try {
    const providers = await StreamProvider.find({ enabled: true, status: 'active' })
      .sort({ priority: 1 });

    // If no providers in database, return defaults
    if (providers.length === 0) {
      const defaultProviders = [
        {
          name: 'agora',
          displayName: 'Agora',
          enabled: true,
          status: 'active',
          priority: 1,
          config: {
            appId: process.env.AGORA_APP_ID,
            region: 'global'
          },
          features: {
            pkBattle: true,
            screenShare: true,
            beautyFilter: true
          }
        },
        {
          name: 'zegocloud',
          displayName: 'ZegoCloud',
          enabled: true,
          status: 'active',
          priority: 2,
          config: {
            appId: process.env.ZEGO_APP_ID,
            region: 'global'
          },
          features: {
            pkBattle: true,
            screenShare: true,
            beautyFilter: true,
            virtualBackground: true
          }
        }
      ];

      return res.json({
        success: true,
        data: { providers: defaultProviders }
      });
    }

    res.json({
      success: true,
      data: { providers }
    });

  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching providers'
    });
  }
});

/**
 * @route   GET /api/live/livestreams (legacy)
 * @desc    Get live streams (legacy nested path)
 * @access  Public
 */
router.get('/livestreams', async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const livestreams = await Livestream.getLiveStreams(parseInt(limit));

    res.json({
      success: true,
      data: { livestreams }
    });

  } catch (error) {
    console.error('Get livestreams error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching livestreams'
    });
  }
});

/**
 * @route   GET /api/live
 * @desc    Get live streams (flattened path)
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const livestreams = await Livestream.getLiveStreams(parseInt(limit));

    res.json({
      success: true,
      data: { livestreams }
    });

  } catch (error) {
    console.error('Get livestreams error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching livestreams'
    });
  }
});

/**
 * @route   POST /api/streaming/start
 * @desc    Start livestream
 * @access  Private
 */
router.post('/start', verifyJWT, async (req, res) => {
  try {
    const { title, description, provider = 'agora', isPrivate = false, type = 'solo' } = req.body;
    const hostId = req.userId;

    // Generate unique stream ID and channel ID
    const streamId = `stream_${Date.now()}_${hostId}`;
    const channelId = `channel_${Date.now()}`;
    const chatRoomId = `chat_${streamId}`;

    // Generate Agora/ZegoCloud token if provider is Agora or ZegoCloud
    let token = '';
    let config = {};
    
    // Try to get credentials from database first, fallback to env vars
    const dbProvider = await StreamProvider.findOne({ name: provider, enabled: true });
    
    if (provider === 'agora') {
      const crypto = require('crypto');
      // Priority: Database config > Environment variables
      const appId = dbProvider?.config?.appId || process.env.AGORA_APP_ID;
      const appCertificate = dbProvider?.config?.appCertificate || process.env.AGORA_APP_CERTIFICATE;
      
      if (appId) {
        // Generate token using agora-access-token package
        try {
          const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
          
          if (appCertificate) {
            const currentTimestamp = Math.floor(Date.now() / 1000);
            const privilegeExpiredTs = currentTimestamp + 3600; // 1 hour
            
            token = RtcTokenBuilder.buildTokenWithUid(
              appId,
              appCertificate,
              channelId,
              0, // UID (0 = auto-assign)
              RtcRole.PUBLISHER,
              privilegeExpiredTs
            );
          }
        } catch (err) {
          console.error('Error generating Agora token:', err);
        }
        
        config = {
          appId,
          channelId,
          token,
          role: 'broadcaster',
        };
      }
    } else if (provider === 'zegocloud') {
      // Priority: Database config > Environment variables
      const appID = dbProvider?.config?.appId || parseInt(process.env.ZEGO_APP_ID || '0');
      const serverSecret = dbProvider?.config?.serverSecret || process.env.ZEGO_SERVER_SECRET;
      
      if (appID) {
        // Generate ZegoCloud token
        try {
          if (serverSecret) {
            const crypto = require('crypto');
            const nonce = crypto.randomBytes(16).toString('base64');
            const timestamp = Math.floor(Date.now() / 1000);
            const expiration = timestamp + 7200; // 2 hours
            
            const payload = {
              app_id: appID,
              user_id: streamId,
              nonce: nonce,
              ctime: timestamp,
              expire: expiration,
            };
            
            const payloadString = JSON.stringify(payload);
            const signature = crypto
              .createHmac('sha256', serverSecret)
              .update(payloadString)
              .digest('hex');
            
            const tokenData = {
              ...payload,
              signature: signature,
            };
            
            token = Buffer.from(JSON.stringify(tokenData)).toString('base64');
          }
        } catch (err) {
          console.error('Error generating ZegoCloud token:', err);
        }
        
        config = {
          appID,
          appSign: serverSecret ? token : '',
          channelId,
          token,
          role: 'host',
        };
      }
    }

    // Create livestream
    const livestream = new Livestream({
      hostId,
      title,
      description,
      provider,
      streamId,
      channelId,
      chatRoomId,
      type,
      isPrivate,
      status: 'starting',
      config
    });

    await livestream.save();

    // Start the stream
    await livestream.start();

    // Populate host data
    await livestream.populate('hostId', 'username fullName avatar isVerified');

    res.status(201).json({
      success: true,
      data: {
        livestream,
        streamId,
        channelId,
        token,
        config,
        chatRoomId
      },
      message: 'Livestream started successfully'
    });

  } catch (error) {
    console.error('Start livestream error:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting livestream',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/streaming/:id/end
 * @desc    End livestream
 * @access  Private (Host only)
 */
router.post('/:id/end', verifyJWT, async (req, res) => {
  try {
    const livestream = await Livestream.findById(req.params.id);

    if (!livestream) {
      return res.status(404).json({
        success: false,
        message: 'Livestream not found'
      });
    }

    // Check if user is the host
    if (!livestream.hostId.equals(req.userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only the host can end the livestream'
      });
    }

    await livestream.end();

    res.json({
      success: true,
      data: { livestream },
      message: 'Livestream ended successfully'
    });

  } catch (error) {
    console.error('End livestream error:', error);
    res.status(500).json({
      success: false,
      message: 'Error ending livestream'
    });
  }
});

/**
 * @route   GET /api/streaming/:id
 * @desc    Get livestream details
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const livestream = await Livestream.findById(req.params.id)
      .populate('hostId', 'username fullName avatar isVerified')
      .populate('participants.userId', 'username fullName avatar');

    if (!livestream) {
      return res.status(404).json({
        success: false,
        message: 'Livestream not found'
      });
    }

    res.json({
      success: true,
      data: { livestream }
    });

  } catch (error) {
    console.error('Get livestream error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching livestream'
    });
  }
});

/**
 * @route   POST /api/streaming/:id/join
 * @desc    Join livestream as participant
 * @access  Private
 */
router.post('/:id/join', verifyJWT, async (req, res) => {
  try {
    const { role = 'guest' } = req.body;
    const userId = req.userId;

    const livestream = await Livestream.findById(req.params.id);

    if (!livestream) {
      return res.status(404).json({
        success: false,
        message: 'Livestream not found'
      });
    }

    if (livestream.status !== 'live') {
      return res.status(400).json({
        success: false,
        message: 'Livestream is not currently live'
      });
    }

    await livestream.addParticipant(userId, role);
    await livestream.updateViewers(livestream.currentViewers + 1);

    res.json({
      success: true,
      data: { livestream },
      message: 'Joined livestream successfully'
    });

  } catch (error) {
    console.error('Join livestream error:', error);
    res.status(500).json({
      success: false,
      message: 'Error joining livestream'
    });
  }
});

module.exports = router;

