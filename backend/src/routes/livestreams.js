const express = require('express');
const router = express.Router();
const {
  getLivestreams,
  getTrending,
  getLivestream,
  createLivestream,
  startLivestream,
  endLivestream,
  joinLivestream,
  leaveLivestream,
  getUserStreams,
  updateLivestream,
  banUser
} = require('../controllers/livestreamController');
const { protect } = require('../middleware/auth');
const { verifyJWT, requireAdmin } = require('../middleware/jwtAuth');
const LiveStream = require('../models/Livestream');

// Admin routes
router.get('/admin/all', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { status, search, limit = 50, page = 1 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const [streams, total] = await Promise.all([
      LiveStream.find(query)
        .populate('user', 'fullName avatar username verified')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean(),
      LiveStream.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: {
        streams,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Admin get all livestreams error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch livestreams'
    });
  }
});

router.get('/admin/stats', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const [
      activeCount,
      endedCount,
      totalViewers,
      featuredCount
    ] = await Promise.all([
      LiveStream.countDocuments({ status: 'live' }),
      LiveStream.countDocuments({ status: 'ended' }),
      LiveStream.aggregate([
        { $match: { status: 'live' } },
        { $group: { _id: null, total: { $sum: '$stats.currentViewers' } } }
      ]),
      LiveStream.countDocuments({ featured: true })
    ]);
    
    res.json({
      success: true,
      data: {
        active: activeCount,
        ended: endedCount,
        totalViewers: totalViewers[0]?.total || 0,
        featured: featuredCount
      }
    });
  } catch (error) {
    console.error('Admin get livestream stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats'
    });
  }
});

router.post('/admin/:streamId/end', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    
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
        message: 'Stream is not currently live'
      });
    }
    
    stream.status = 'ended';
    stream.endedAt = new Date();
    stream.endedBy = req.userId;
    stream.endReason = reason || 'Admin ended stream';
    
    await stream.save();
    
    res.json({
      success: true,
      message: 'Stream ended successfully',
      data: stream
    });
  } catch (error) {
    console.error('Admin end stream error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end stream'
    });
  }
});

router.put('/admin/:streamId/feature', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { featured } = req.body;
    
    const stream = await LiveStream.findOneAndUpdate(
      { streamId: req.params.streamId },
      { featured, featuredAt: featured ? new Date() : null },
      { new: true }
    ).populate('user', 'fullName avatar username');
    
    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Livestream not found'
      });
    }
    
    res.json({
      success: true,
      message: `Stream ${featured ? 'featured' : 'unfeatured'} successfully`,
      data: stream
    });
  } catch (error) {
    console.error('Admin feature stream error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update featured status'
    });
  }
});

router.delete('/admin/:streamId', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const stream = await LiveStream.findOneAndDelete({ streamId: req.params.streamId });
    
    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Livestream not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Stream deleted successfully'
    });
  } catch (error) {
    console.error('Admin delete stream error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete stream'
    });
  }
});

// Public routes
router.get('/', getLivestreams);
router.get('/trending', getTrending);
router.get('/user/:userId', getUserStreams);
router.get('/:streamId', getLivestream);

// Protected routes (require authentication)
router.post('/', protect, createLivestream);
router.post('/:streamId/start', protect, startLivestream);
router.post('/:streamId/end', protect, endLivestream);
router.post('/:streamId/join', protect, joinLivestream);
router.post('/:streamId/leave', protect, leaveLivestream);
router.put('/:streamId', protect, updateLivestream);
router.post('/:streamId/ban/:userId', protect, banUser);

module.exports = router;
