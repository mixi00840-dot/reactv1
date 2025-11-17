/**
 * ADMIN AI USAGE MONITORING ROUTES
 * 
 * Provides AI service usage statistics for the admin dashboard.
 * Frontend calls: /api/admin/ai/vertex-usage
 */

const express = require('express');
const router = express.Router();
const { verifyJWT, requireAdmin } = require('../../middleware/jwtAuth');
const Content = require('../../models/Content');

/**
 * @route   GET /api/admin/ai/vertex-usage
 * @desc    Get Google Vertex AI usage statistics
 * @access  Admin only
 */
router.get('/vertex-usage', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    // Calculate date range
    let startDate = new Date();
    if (timeRange === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeRange === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (timeRange === '90d') {
      startDate.setDate(startDate.getDate() - 90);
    }

    // Get AI-processed content counts
    const [
      aiCaptionsGenerated,
      aiHashtagsGenerated,
      aiModerationScans,
      totalContent
    ] = await Promise.all([
      // Count content with AI-generated captions
      Content.countDocuments({
        'aiMetadata.captionGenerated': true,
        createdAt: { $gte: startDate }
      }),
      
      // Count content with AI-generated hashtags
      Content.countDocuments({
        'aiMetadata.hashtagsGenerated': true,
        createdAt: { $gte: startDate }
      }),
      
      // Count content that went through AI moderation
      Content.countDocuments({
        'aiMetadata.moderationScore': { $exists: true },
        createdAt: { $gte: startDate }
      }),
      
      // Total content in period
      Content.countDocuments({
        createdAt: { $gte: startDate }
      })
    ]);

    // Estimate API calls
    // Each content piece may trigger multiple AI calls:
    // - Caption generation: 1 call
    // - Hashtag generation: 1 call  
    // - Moderation: 1-3 calls depending on content type
    const estimatedApiCalls = aiCaptionsGenerated + aiHashtagsGenerated + (aiModerationScans * 2);

    // Estimate costs (rough approximation)
    // Vertex AI pricing varies, but typical costs:
    // - Text generation: $0.001 per 1k chars
    // - Vision API: $0.001 per image
    const estimatedCost = {
      captions: aiCaptionsGenerated * 0.002, // ~$0.002 per caption
      hashtags: aiHashtagsGenerated * 0.001, // ~$0.001 per hashtag set
      moderation: aiModerationScans * 0.003, // ~$0.003 per moderation scan
      total: (aiCaptionsGenerated * 0.002) + (aiHashtagsGenerated * 0.001) + (aiModerationScans * 0.003)
    };

    // Get daily breakdown
    const dailyUsage = await Content.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          $or: [
            { 'aiMetadata.captionGenerated': true },
            { 'aiMetadata.hashtagsGenerated': true },
            { 'aiMetadata.moderationScore': { $exists: true } }
          ]
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          captions: {
            $sum: { $cond: ['$aiMetadata.captionGenerated', 1, 0] }
          },
          hashtags: {
            $sum: { $cond: ['$aiMetadata.hashtagsGenerated', 1, 0] }
          },
          moderation: {
            $sum: { $cond: [{ $exists: ['$aiMetadata.moderationScore', true] }, 1, 0] }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $limit: 90
      }
    ]);

    res.json({
      success: true,
      data: {
        timeRange,
        period: {
          start: startDate.toISOString(),
          end: new Date().toISOString()
        },
        usage: {
          captions: aiCaptionsGenerated,
          hashtags: aiHashtagsGenerated,
          moderation: aiModerationScans,
          total: estimatedApiCalls
        },
        content: {
          total: totalContent,
          aiProcessed: aiCaptionsGenerated + aiHashtagsGenerated + aiModerationScans,
          percentage: totalContent > 0 
            ? ((aiCaptionsGenerated + aiHashtagsGenerated + aiModerationScans) / totalContent * 100).toFixed(2)
            : 0
        },
        costs: {
          estimated: true,
          currency: 'USD',
          ...estimatedCost
        },
        dailyBreakdown: dailyUsage.map(day => ({
          date: day._id,
          captions: day.captions,
          hashtags: day.hashtags,
          moderation: day.moderation,
          total: day.count,
          estimatedCost: (day.captions * 0.002) + (day.hashtags * 0.001) + (day.moderation * 0.003)
        })),
        features: {
          captionGeneration: {
            enabled: process.env.AI_CAPTIONS_ENABLED === 'true',
            usage: aiCaptionsGenerated
          },
          hashtagGeneration: {
            enabled: process.env.AI_HASHTAGS_ENABLED === 'true',
            usage: aiHashtagsGenerated
          },
          contentModeration: {
            enabled: process.env.AI_MODERATION_ENABLED === 'true',
            usage: aiModerationScans
          }
        }
      }
    });
  } catch (error) {
    console.error('Error fetching AI usage:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching AI usage statistics',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/ai/features
 * @desc    Get AI features configuration
 * @access  Admin only
 */
router.get('/features', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const features = {
      captionGeneration: {
        enabled: process.env.AI_CAPTIONS_ENABLED === 'true',
        provider: 'Google Vertex AI',
        model: process.env.AI_CAPTION_MODEL || 'text-bison',
        autoGenerate: process.env.AI_AUTO_CAPTIONS === 'true'
      },
      hashtagGeneration: {
        enabled: process.env.AI_HASHTAGS_ENABLED === 'true',
        provider: 'Google Vertex AI',
        model: process.env.AI_HASHTAG_MODEL || 'text-bison',
        autoGenerate: process.env.AI_AUTO_HASHTAGS === 'true'
      },
      contentModeration: {
        enabled: process.env.AI_MODERATION_ENABLED === 'true',
        provider: 'Google Cloud Vision',
        safeSearch: true,
        threshold: 'LIKELY'
      },
      translation: {
        enabled: process.env.AI_TRANSLATION_ENABLED === 'true',
        provider: 'Google Cloud Translation',
        autoDetect: true
      }
    };

    res.json({
      success: true,
      data: features
    });
  } catch (error) {
    console.error('Error fetching AI features:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching AI features',
      error: error.message
    });
  }
});

module.exports = router;
