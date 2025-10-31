const Sound = require('../models/Sound');
const Content = require('../models/Content');
const uploadService = require('../services/uploadService');
const crypto = require('crypto');

/**
 * Sound Management Controller
 * Handles music/audio upload, approval, trending, and usage tracking
 */

/**
 * @route   POST /api/sounds/upload
 * @desc    Upload new sound/music (creator or admin)
 * @access  Private
 */
exports.uploadSound = async (req, res) => {
  try {
    const {
      title,
      artist,
      album,
      duration,
      genre,
      mood,
      tempo,
      explicit,
      tags,
      categories
    } = req.body;

    if (!title || !duration) {
      return res.status(400).json({
        success: false,
        message: 'title and duration are required'
      });
    }

    // Generate presigned URL for audio upload
    const uploadResult = await uploadService.generateUploadUrl({
      userId: req.user._id,
      fileName: `${title.replace(/\s+/g, '_')}.mp3`,
      fileSize: req.body.fileSize || 10 * 1024 * 1024, // Default 10MB
      mimeType: 'audio/mpeg',
      contentType: 'audio',
      metadata: { title, artist }
    });

    // Create sound record
    const sound = new Sound({
      title,
      artist: artist || 'Unknown',
      album,
      sourceType: 'upload',
      creatorId: req.user._id,
      duration,
      fileUrl: uploadResult.uploadUrl, // Temporary, will be updated after upload
      fileKey: uploadResult.key,
      metadata: {
        genre: genre ? (Array.isArray(genre) ? genre : [genre]) : [],
        mood: mood ? (Array.isArray(mood) ? mood : [mood]) : [],
        tempo,
        explicit: explicit || false
      },
      tags: tags || [],
      categories: categories || [],
      status: 'pending_review',
      moderation: {
        isReviewed: false
      }
    });

    await sound.save();

    res.json({
      success: true,
      message: 'Sound upload initialized',
      data: {
        sound,
        uploadUrl: uploadResult.uploadUrl,
        uploadKey: uploadResult.key
      }
    });

  } catch (error) {
    console.error('Upload sound error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload sound',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/sounds/:soundId/confirm-upload
 * @desc    Confirm sound upload complete
 * @access  Private
 */
exports.confirmSoundUpload = async (req, res) => {
  try {
    const { soundId } = req.params;
    const { fileUrl } = req.body;

    const sound = await Sound.findOne({ soundId });
    if (!sound) {
      return res.status(404).json({
        success: false,
        message: 'Sound not found'
      });
    }

    // Verify ownership
    if (sound.creatorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Update with final file URL
    sound.fileUrl = fileUrl;
    sound.status = 'pending_review';
    await sound.save();

    res.json({
      success: true,
      message: 'Sound upload confirmed, pending review',
      data: { sound }
    });

  } catch (error) {
    console.error('Confirm sound upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to confirm upload',
      error: error.message
    });
  }
};

/**
 * @route   PUT /api/sounds/:soundId/approve
 * @desc    Approve sound for use (admin/moderator)
 * @access  Private (Admin/Moderator)
 */
exports.approveSound = async (req, res) => {
  try {
    const { soundId } = req.params;
    const { featured, featuredCategory, featuredUntil } = req.body;

    const sound = await Sound.findOne({ soundId });
    if (!sound) {
      return res.status(404).json({
        success: false,
        message: 'Sound not found'
      });
    }

    sound.status = 'active';
    sound.availability.isAvailable = true;
    sound.moderation.isReviewed = true;
    sound.moderation.reviewedBy = req.user._id;
    sound.moderation.reviewedAt = new Date();

    // Optional: feature the sound
    if (featured) {
      sound.featured.isFeatured = true;
      sound.featured.featuredCategory = featuredCategory;
      sound.featured.featuredUntil = featuredUntil || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    await sound.save();

    res.json({
      success: true,
      message: 'Sound approved',
      data: { sound }
    });

  } catch (error) {
    console.error('Approve sound error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to approve sound',
      error: error.message
    });
  }
};

/**
 * @route   PUT /api/sounds/:soundId/reject
 * @desc    Reject sound submission (admin/moderator)
 * @access  Private (Admin/Moderator)
 */
exports.rejectSound = async (req, res) => {
  try {
    const { soundId } = req.params;
    const { reason } = req.body;

    const sound = await Sound.findOne({ soundId });
    if (!sound) {
      return res.status(404).json({
        success: false,
        message: 'Sound not found'
      });
    }

    sound.status = 'blocked';
    sound.moderation.isReviewed = true;
    sound.moderation.reviewedBy = req.user._id;
    sound.moderation.reviewedAt = new Date();
    sound.moderation.flagged = true;
    sound.moderation.flagReason = reason || 'Does not meet platform guidelines';

    await sound.save();

    res.json({
      success: true,
      message: 'Sound rejected',
      data: { sound }
    });

  } catch (error) {
    console.error('Reject sound error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reject sound',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/sounds/trending
 * @desc    Get trending sounds
 * @access  Public
 */
exports.getTrendingSounds = async (req, res) => {
  try {
    const { limit = 50, category } = req.query;

    const sounds = await Sound.getTrending({
      limit: parseInt(limit),
      category
    });

    res.json({
      success: true,
      data: { sounds, count: sounds.length }
    });

  } catch (error) {
    console.error('Get trending sounds error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get trending sounds',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/sounds/search
 * @desc    Search sounds
 * @access  Public
 */
exports.searchSounds = async (req, res) => {
  try {
    const { q, limit = 20, skip = 0, category, mood } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query (q) is required'
      });
    }

    const sounds = await Sound.searchSounds(q, {
      limit: parseInt(limit),
      skip: parseInt(skip),
      category,
      mood
    });

    res.json({
      success: true,
      data: { sounds, count: sounds.length }
    });

  } catch (error) {
    console.error('Search sounds error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search sounds',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/sounds/featured
 * @desc    Get featured sounds
 * @access  Public
 */
exports.getFeaturedSounds = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const sounds = await Sound.getFeatured(parseInt(limit));

    res.json({
      success: true,
      data: { sounds, count: sounds.length }
    });

  } catch (error) {
    console.error('Get featured sounds error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get featured sounds',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/sounds/:soundId
 * @desc    Get sound details
 * @access  Public
 */
exports.getSoundDetails = async (req, res) => {
  try {
    const { soundId } = req.params;

    const sound = await Sound.findOne({ soundId })
      .populate('creatorId', 'username displayName profilePicture verified');

    if (!sound) {
      return res.status(404).json({
        success: false,
        message: 'Sound not found'
      });
    }

    // Get recent videos using this sound
    const recentVideos = await Content.find({
      soundId: sound._id,
      status: 'published',
      visibility: 'public'
    })
      .limit(10)
      .sort({ createdAt: -1 })
      .populate('userId', 'username displayName profilePicture verified')
      .select('_id caption thumbnails analytics createdAt');

    res.json({
      success: true,
      data: {
        sound,
        recentVideos
      }
    });

  } catch (error) {
    console.error('Get sound details error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get sound details',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/sounds/:soundId/videos
 * @desc    Get videos using this sound
 * @access  Public
 */
exports.getSoundVideos = async (req, res) => {
  try {
    const { soundId } = req.params;
    const { limit = 20, skip = 0 } = req.query;

    const sound = await Sound.findOne({ soundId });
    if (!sound) {
      return res.status(404).json({
        success: false,
        message: 'Sound not found'
      });
    }

    const videos = await Content.find({
      soundId: sound._id,
      status: 'published',
      visibility: 'public'
    })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ 'analytics.views': -1 })
      .populate('userId', 'username displayName profilePicture verified')
      .select('_id caption thumbnails analytics createdAt');

    const total = await Content.countDocuments({
      soundId: sound._id,
      status: 'published'
    });

    res.json({
      success: true,
      data: {
        videos,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: total > parseInt(skip) + videos.length
        }
      }
    });

  } catch (error) {
    console.error('Get sound videos error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get sound videos',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/sounds/:soundId/use
 * @desc    Increment sound usage when used in content
 * @access  Private
 */
exports.recordSoundUsage = async (req, res) => {
  try {
    const { soundId } = req.params;
    const { contentId } = req.body;

    const sound = await Sound.findOne({ soundId });
    if (!sound) {
      return res.status(404).json({
        success: false,
        message: 'Sound not found'
      });
    }

    // Check if sound is usable
    if (!sound.isUsable) {
      return res.status(403).json({
        success: false,
        message: 'Sound is not available for use'
      });
    }

    // Increment usage
    await sound.incrementUsage();

    res.json({
      success: true,
      message: 'Sound usage recorded',
      data: { usageCount: sound.usageCount }
    });

  } catch (error) {
    console.error('Record sound usage error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to record usage',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/sounds/my-sounds
 * @desc    Get sounds uploaded by current user
 * @access  Private
 */
exports.getMySounds = async (req, res) => {
  try {
    const { limit = 20, skip = 0, status } = req.query;

    const query = { creatorId: req.user._id };
    if (status) query.status = status;

    const sounds = await Sound.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Sound.countDocuments(query);

    res.json({
      success: true,
      data: {
        sounds,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: total > parseInt(skip) + sounds.length
        }
      }
    });

  } catch (error) {
    console.error('Get my sounds error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get sounds',
      error: error.message
    });
  }
};

/**
 * @route   PUT /api/sounds/:soundId
 * @desc    Update sound metadata
 * @access  Private (Creator or Admin)
 */
exports.updateSound = async (req, res) => {
  try {
    const { soundId } = req.params;
    const {
      title,
      artist,
      album,
      genre,
      mood,
      tempo,
      explicit,
      tags,
      categories
    } = req.body;

    const sound = await Sound.findOne({ soundId });
    if (!sound) {
      return res.status(404).json({
        success: false,
        message: 'Sound not found'
      });
    }

    // Check permissions
    const isCreator = sound.creatorId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Update fields
    if (title) sound.title = title;
    if (artist) sound.artist = artist;
    if (album) sound.album = album;
    if (genre) sound.metadata.genre = Array.isArray(genre) ? genre : [genre];
    if (mood) sound.metadata.mood = Array.isArray(mood) ? mood : [mood];
    if (tempo) sound.metadata.tempo = tempo;
    if (explicit !== undefined) sound.metadata.explicit = explicit;
    if (tags) sound.tags = tags;
    if (categories) sound.categories = categories;

    await sound.save();

    res.json({
      success: true,
      message: 'Sound updated',
      data: { sound }
    });

  } catch (error) {
    console.error('Update sound error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update sound',
      error: error.message
    });
  }
};

/**
 * @route   DELETE /api/sounds/:soundId
 * @desc    Delete sound
 * @access  Private (Creator or Admin)
 */
exports.deleteSound = async (req, res) => {
  try {
    const { soundId } = req.params;

    const sound = await Sound.findOne({ soundId });
    if (!sound) {
      return res.status(404).json({
        success: false,
        message: 'Sound not found'
      });
    }

    // Check permissions
    const isCreator = sound.creatorId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Check if sound is being used
    const usageCount = await Content.countDocuments({ soundId: sound._id });
    if (usageCount > 0 && !isAdmin) {
      return res.status(400).json({
        success: false,
        message: `Sound is being used in ${usageCount} videos. Only admins can delete sounds in use.`
      });
    }

    // Soft delete - set status to removed
    sound.status = 'removed';
    sound.availability.isAvailable = false;
    await sound.save();

    res.json({
      success: true,
      message: 'Sound deleted'
    });

  } catch (error) {
    console.error('Delete sound error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete sound',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/sounds/pending-review
 * @desc    Get sounds pending review (admin/moderator)
 * @access  Private (Admin/Moderator)
 */
exports.getPendingReview = async (req, res) => {
  try {
    const { limit = 20, skip = 0 } = req.query;

    const sounds = await Sound.find({ status: 'pending_review' })
      .populate('creatorId', 'username displayName profilePicture')
      .sort({ createdAt: 1 }) // Oldest first
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Sound.countDocuments({ status: 'pending_review' });

    res.json({
      success: true,
      data: {
        sounds,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: total > parseInt(skip) + sounds.length
        }
      }
    });

  } catch (error) {
    console.error('Get pending review error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get pending sounds',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/sounds/stats
 * @desc    Get sound library statistics (admin)
 * @access  Private (Admin)
 */
exports.getSoundStats = async (req, res) => {
  try {
    const [total, active, pending, trending, totalUsage] = await Promise.all([
      Sound.countDocuments({}),
      Sound.countDocuments({ status: 'active' }),
      Sound.countDocuments({ status: 'pending_review' }),
      Sound.countDocuments({ 'stats.trendingRank': { $lte: 50 } }),
      Sound.aggregate([
        { $group: { _id: null, totalUsage: { $sum: '$usageCount' } } }
      ])
    ]);

    // Top creators
    const topCreators = await Sound.aggregate([
      { $match: { status: 'active' } },
      { $group: {
        _id: '$creatorId',
        soundsCount: { $sum: 1 },
        totalUsage: { $sum: '$usageCount' }
      }},
      { $sort: { totalUsage: -1 } },
      { $limit: 10 },
      { $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'creator'
      }},
      { $unwind: '$creator' },
      { $project: {
        'creator.username': 1,
        'creator.displayName': 1,
        soundsCount: 1,
        totalUsage: 1
      }}
    ]);

    res.json({
      success: true,
      data: {
        total,
        active,
        pending,
        trending,
        totalUsage: totalUsage[0]?.totalUsage || 0,
        topCreators
      }
    });

  } catch (error) {
    console.error('Get sound stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get stats',
      error: error.message
    });
  }
};
