const { LiveStream } = require('../models/LiveStream');
const { StreamProvider } = require('../models/StreamProvider');
const { User } = require('../models/User');
const crypto = require('crypto');

// @desc    Get all livestreams
// @route   GET /api/streaming/livestreams
// @access  Public
exports.getLivestreams = async (req, res) => {
  try {
    const {
      status = 'live',
      category,
      featured,
      language,
      limit = 50,
      page = 1
    } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (featured) query.featured = featured === 'true';
    if (language) query.language = language;
    
    const skip = (page - 1) * limit;
    
    const streams = await LiveStream.find(query)
      .populate('user', 'fullName avatar username followers verified')
      .populate('provider', 'name displayName')
      .sort({ 'stats.currentViewers': -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();
    
    const total = await LiveStream.countDocuments(query);
    
    res.json({
      success: true,
      data: streams,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get livestreams error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch livestreams',
      error: error.message
    });
  }
};

// @desc    Get trending livestreams
// @route   GET /api/streaming/livestreams/trending
// @access  Public
exports.getTrending = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const streams = await LiveStream.getTrending(parseInt(limit));
    
    res.json({
      success: true,
      data: streams
    });
  } catch (error) {
    console.error('Get trending error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending streams',
      error: error.message
    });
  }
};

// @desc    Get livestream by ID
// @route   GET /api/streaming/livestreams/:streamId
// @access  Public
exports.getLivestream = async (req, res) => {
  try {
    const stream = await LiveStream.findOne({ streamId: req.params.streamId })
      .populate('user', 'fullName avatar username followers verified bio')
      .populate('provider', 'name displayName config')
      .populate('viewers.user', 'fullName avatar username');
    
    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Livestream not found'
      });
    }
    
    // Check if user has access
    if (stream.privacy === 'private' && req.user) {
      if (stream.user._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'This stream is private'
        });
      }
    }
    
    if (stream.privacy === 'followers' && req.user) {
      const streamer = await User.findById(stream.user._id);
      if (!streamer.followers.includes(req.user._id) && stream.user._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'This stream is for followers only'
        });
      }
    }
    
    res.json({
      success: true,
      data: stream
    });
  } catch (error) {
    console.error('Get livestream error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch livestream',
      error: error.message
    });
  }
};

// @desc    Create livestream
// @route   POST /api/streaming/livestreams
// @access  Private
exports.createLivestream = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Check if user already has an active stream
    const existingStream = await LiveStream.findOne({
      user: userId,
      status: { $in: ['scheduled', 'live'] }
    });
    
    if (existingStream) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active livestream'
      });
    }
    
    // Get best available provider
    const provider = await StreamProvider.getBestProvider({
      features: req.body.config?.features || {}
    });
    
    if (!provider) {
      return res.status(503).json({
        success: false,
        message: 'No streaming provider available at the moment'
      });
    }
    
    // Generate unique stream ID and keys
    const streamId = `${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const streamKey = crypto.randomBytes(16).toString('hex');
    
    // Create stream
    const streamData = {
      ...req.body,
      streamId,
      user: userId,
      provider: provider._id,
      streamKey,
      rtmpUrl: `rtmp://${provider.config.serverUrl}/live/${streamKey}`,
      playbackUrl: `https://${provider.config.serverUrl}/live/${streamKey}.flv`,
      hlsUrl: `https://${provider.config.serverUrl}/live/${streamKey}/index.m3u8`
    };
    
    const stream = await LiveStream.create(streamData);
    
    await stream.populate('user', 'fullName avatar username');
    await stream.populate('provider', 'name displayName');
    
    res.status(201).json({
      success: true,
      message: 'Livestream created successfully',
      data: stream
    });
  } catch (error) {
    console.error('Create livestream error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create livestream',
      error: error.message
    });
  }
};

// @desc    Start livestream
// @route   POST /api/streaming/livestreams/:streamId/start
// @access  Private
exports.startLivestream = async (req, res) => {
  try {
    const stream = await LiveStream.findOne({ streamId: req.params.streamId });
    
    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Livestream not found'
      });
    }
    
    // Check ownership
    if (stream.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to start this stream'
      });
    }
    
    if (stream.status === 'live') {
      return res.status(400).json({
        success: false,
        message: 'Stream is already live'
      });
    }
    
    await stream.start();
    
    // Emit WebSocket event
    if (req.app.get('io')) {
      req.app.get('io').emit('stream:started', {
        streamId: stream.streamId,
        user: req.user.fullName,
        title: stream.title
      });
    }
    
    res.json({
      success: true,
      message: 'Livestream started successfully',
      data: stream
    });
  } catch (error) {
    console.error('Start livestream error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start livestream',
      error: error.message
    });
  }
};

// @desc    End livestream
// @route   POST /api/streaming/livestreams/:streamId/end
// @access  Private
exports.endLivestream = async (req, res) => {
  try {
    const stream = await LiveStream.findOne({ streamId: req.params.streamId });
    
    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Livestream not found'
      });
    }
    
    // Check ownership
    if (stream.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to end this stream'
      });
    }
    
    if (stream.status !== 'live') {
      return res.status(400).json({
        success: false,
        message: 'Stream is not live'
      });
    }
    
    await stream.end();
    
    // Emit WebSocket event
    if (req.app.get('io')) {
      req.app.get('io').emit('stream:ended', {
        streamId: stream.streamId,
        duration: stream.duration,
        stats: stream.stats
      });
    }
    
    res.json({
      success: true,
      message: 'Livestream ended successfully',
      data: {
        duration: stream.duration,
        stats: stream.stats
      }
    });
  } catch (error) {
    console.error('End livestream error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end livestream',
      error: error.message
    });
  }
};

// @desc    Join livestream (viewer)
// @route   POST /api/streaming/livestreams/:streamId/join
// @access  Private
exports.joinLivestream = async (req, res) => {
  try {
    const stream = await LiveStream.findOne({ streamId: req.params.streamId });
    
    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Livestream not found'
      });
    }
    
    if (stream.status !== 'live') {
      return res.status(400).json({
        success: false,
        message: 'Stream is not live'
      });
    }
    
    await stream.addViewer(req.user._id);
    
    res.json({
      success: true,
      message: 'Joined livestream successfully',
      data: {
        currentViewers: stream.stats.currentViewers,
        playbackUrl: stream.streamUrl
      }
    });
  } catch (error) {
    console.error('Join livestream error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join livestream',
      error: error.message
    });
  }
};

// @desc    Leave livestream (viewer)
// @route   POST /api/streaming/livestreams/:streamId/leave
// @access  Private
exports.leaveLivestream = async (req, res) => {
  try {
    const stream = await LiveStream.findOne({ streamId: req.params.streamId });
    
    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Livestream not found'
      });
    }
    
    await stream.removeViewer(req.user._id);
    
    res.json({
      success: true,
      message: 'Left livestream successfully'
    });
  } catch (error) {
    console.error('Leave livestream error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave livestream',
      error: error.message
    });
  }
};

// @desc    Get user's streams
// @route   GET /api/streaming/livestreams/user/:userId
// @access  Public
exports.getUserStreams = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const streams = await LiveStream.getUserStreams(req.params.userId, parseInt(limit));
    
    res.json({
      success: true,
      data: streams
    });
  } catch (error) {
    console.error('Get user streams error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user streams',
      error: error.message
    });
  }
};

// @desc    Update livestream settings
// @route   PUT /api/streaming/livestreams/:streamId
// @access  Private
exports.updateLivestream = async (req, res) => {
  try {
    const stream = await LiveStream.findOne({ streamId: req.params.streamId });
    
    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Livestream not found'
      });
    }
    
    // Check ownership
    if (stream.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this stream'
      });
    }
    
    // Update allowed fields
    const updateFields = ['title', 'description', 'category', 'tags', 'config', 'privacy', 'moderation'];
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'config' || field === 'moderation') {
          stream[field] = { ...stream[field], ...req.body[field] };
        } else {
          stream[field] = req.body[field];
        }
      }
    });
    
    await stream.save();
    
    res.json({
      success: true,
      message: 'Livestream updated successfully',
      data: stream
    });
  } catch (error) {
    console.error('Update livestream error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update livestream',
      error: error.message
    });
  }
};

// @desc    Ban user from stream
// @route   POST /api/streaming/livestreams/:streamId/ban/:userId
// @access  Private
exports.banUser = async (req, res) => {
  try {
    const stream = await LiveStream.findOne({ streamId: req.params.streamId });
    
    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Livestream not found'
      });
    }
    
    // Check ownership
    if (stream.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to ban users from this stream'
      });
    }
    
    await stream.banUser(req.params.userId);
    
    // Remove viewer if currently watching
    await stream.removeViewer(req.params.userId);
    
    res.json({
      success: true,
      message: 'User banned from stream successfully'
    });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to ban user',
      error: error.message
    });
  }
};
