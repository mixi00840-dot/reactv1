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
 * @route   GET /api/streaming/livestreams
 * @desc    Get live streams
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
 * @route   POST /api/streaming/start
 * @desc    Start livestream
 * @access  Private
 */
router.post('/start', verifyJWT, async (req, res) => {
  try {
    const { title, description, provider = 'agora', isPrivate = false, type = 'solo' } = req.body;
    const hostId = req.userId;

    // Generate unique stream ID
    const streamId = `stream_${Date.now()}_${hostId}`;
    const chatRoomId = `chat_${streamId}`;

    // Create livestream
    const livestream = new Livestream({
      hostId,
      title,
      description,
      provider,
      streamId,
      chatRoomId,
      type,
      isPrivate,
      status: 'starting'
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

