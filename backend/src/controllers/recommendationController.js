const CandidateGenerationService = require('../services/candidateGenerationService');
const RecommendationMetadata = require('../models/RecommendationMetadata');

/**
 * @desc Generate recommendation candidates for user
 * @route POST /api/recommendations/candidates
 * @access Private
 */
exports.generateCandidates = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      limit,
      minQuality,
      excludeViewed,
      strategies
    } = req.body;
    
    const result = await CandidateGenerationService.generateCandidates(userId, {
      limit,
      minQuality,
      excludeViewed,
      strategies
    });
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc Get trending content
 * @route GET /api/recommendations/trending
 * @access Public
 */
exports.getTrending = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    const trending = await RecommendationMetadata.getTrending(limit);
    
    res.status(200).json({
      success: true,
      count: trending.length,
      data: trending
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc Get content metadata
 * @route GET /api/recommendations/metadata/:contentId
 * @access Private
 */
exports.getMetadata = async (req, res) => {
  try {
    const metadata = await RecommendationMetadata.findOne({ 
      content: req.params.contentId 
    }).populate('content', 'title creator videoUrl thumbnailUrl duration');
    
    if (!metadata) {
      return res.status(404).json({
        success: false,
        message: 'Metadata not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: metadata
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc Refresh metadata for content
 * @route POST /api/recommendations/metadata/:contentId/refresh
 * @access Private (Admin)
 */
exports.refreshMetadata = async (req, res) => {
  try {
    const metadata = await CandidateGenerationService.refreshMetadata(
      req.params.contentId
    );
    
    res.status(200).json({
      success: true,
      data: metadata
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc Batch refresh metadata
 * @route POST /api/recommendations/metadata/batch/refresh
 * @access Private (Admin)
 */
exports.batchRefreshMetadata = async (req, res) => {
  try {
    const { contentIds } = req.body;
    
    if (!contentIds || !Array.isArray(contentIds)) {
      return res.status(400).json({
        success: false,
        message: 'contentIds array required'
      });
    }
    
    const results = await CandidateGenerationService.batchRefreshMetadata(contentIds);
    
    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc Generate embeddings for content
 * @route POST /api/recommendations/embeddings/:contentId
 * @access Private (Admin)
 */
exports.generateEmbeddings = async (req, res) => {
  try {
    const embeddings = await CandidateGenerationService.generateEmbeddings(
      req.params.contentId
    );
    
    res.status(200).json({
      success: true,
      data: embeddings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc Get similar content
 * @route GET /api/recommendations/similar/:contentId
 * @access Public
 */
exports.getSimilarContent = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    const metadata = await RecommendationMetadata.findOne({ 
      content: req.params.contentId 
    });
    
    if (!metadata) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }
    
    // Get similar content from collaborative data
    const similarIds = metadata.collaborative.similarContent
      .slice(0, limit)
      .map(s => s.contentId);
    
    const similar = await RecommendationMetadata.find({
      content: { $in: similarIds }
    })
    .populate('content', 'title creator videoUrl thumbnailUrl')
    .limit(limit);
    
    res.status(200).json({
      success: true,
      count: similar.length,
      data: similar
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc Get content by topics
 * @route POST /api/recommendations/by-topics
 * @access Private
 */
exports.getByTopics = async (req, res) => {
  try {
    const { topics } = req.body;
    const limit = parseInt(req.query.limit) || 50;
    
    if (!topics || !Array.isArray(topics)) {
      return res.status(400).json({
        success: false,
        message: 'topics array required'
      });
    }
    
    const candidates = await RecommendationMetadata.getCandidatesByTopics(topics, limit);
    
    res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc Get content by hashtags
 * @route POST /api/recommendations/by-hashtags
 * @access Private
 */
exports.getByHashtags = async (req, res) => {
  try {
    const { hashtags } = req.body;
    const limit = parseInt(req.query.limit) || 50;
    
    if (!hashtags || !Array.isArray(hashtags)) {
      return res.status(400).json({
        success: false,
        message: 'hashtags array required'
      });
    }
    
    const candidates = await RecommendationMetadata.getCandidatesByHashtags(hashtags, limit);
    
    res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc Get content needing reindexing
 * @route GET /api/recommendations/reindex/pending
 * @access Private (Admin)
 */
exports.getPendingReindex = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    
    const content = await RecommendationMetadata.getNeedingReindex(limit);
    
    res.status(200).json({
      success: true,
      count: content.length,
      data: content
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = exports;
