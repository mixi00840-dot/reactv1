const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Content = require('../../models/Content');
const vertexAI = require('../../services/vertexAI');
const cache = require('../../services/redisCache');

/**
 * Cloudinary Webhook Handler
 * 
 * Receives notifications when:
 * - Video upload completes
 * - Video transcoding finishes
 * - Thumbnail generation completes
 * 
 * Then automatically:
 * - Runs AI moderation
 * - Generates embeddings
 * - Extracts metadata
 * - Updates Content record
 */

/**
 * Verify Cloudinary webhook signature
 */
function verifyCloudinarySignature(req) {
  const signature = req.headers['x-cld-signature'];
  const timestamp = req.headers['x-cld-timestamp'];
  
  if (!signature || !timestamp) {
    return false;
  }

  // Check timestamp is recent (within 5 minutes)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) {
    console.log('⚠️  Webhook timestamp too old');
    return false;
  }

  // Verify signature
  const secret = process.env.CLOUDINARY_API_SECRET;
  const payload = JSON.stringify(req.body) + timestamp;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  const isValid = signature === expectedSignature;
  
  if (!isValid) {
    console.log('⚠️  Invalid webhook signature');
  }

  return isValid;
}

/**
 * Process uploaded video
 */
async function processVideo(notification) {
  const { public_id, secure_url, format, width, height, duration, bytes, resource_type } = notification;

  try {
    console.log(`📹 Processing video: ${public_id}`);

    // Find Content record by cloudinary public_id or videoUrl
    let content = await Content.findOne({
      $or: [
        { 'cloudinaryPublicId': public_id },
        { videoUrl: secure_url }
      ]
    });

    if (!content) {
      console.log('⚠️  Content not found, creating new record');
      // Create new content if not exists
      content = new Content({
        type: 'video',
        videoUrl: secure_url,
        cloudinaryPublicId: public_id,
        status: 'processing'
      });
    }

    // Update video metadata
    content.videoUrl = secure_url;
    content.cloudinaryPublicId = public_id;
    content.duration = duration;
    
    // Generate thumbnail URL from Cloudinary
    const thumbnailUrl = secure_url.replace('/upload/', '/upload/so_0,w_400,h_225,c_fill/').replace(`.${format}`, '.jpg');
    content.thumbnailUrl = thumbnailUrl;

    // Update processing status
    content.processingStatus = 'completed';
    content.status = 'processing'; // Still needs AI moderation

    await content.save();

    // Trigger AI processing in background
    processVideoAI(content._id, thumbnailUrl, content.caption || '').catch(err => {
      console.error('AI processing error:', err);
    });

    console.log(`✅ Video processed: ${content._id}`);
    return content;

  } catch (error) {
    console.error('Video processing error:', error);
    throw error;
  }
}

/**
 * AI Processing Pipeline (runs async)
 */
async function processVideoAI(contentId, thumbnailUrl, caption) {
  try {
    console.log(`🤖 Starting AI processing for ${contentId}`);

    const content = await Content.findById(contentId);
    if (!content) {
      console.log('Content not found');
      return;
    }

    // 1. Run AI moderation on thumbnail
    let moderationScore = 0;
    try {
      const imageModeration = await vertexAI.moderateImage(thumbnailUrl);
      if (imageModeration.success) {
        moderationScore = imageModeration.scores.overall || 0;
        content.moderationScore = moderationScore;

        // If content is unsafe, mark for review
        if (moderationScore > 70) {
          content.status = 'reported';
          console.log(`⚠️  High moderation score: ${moderationScore}`);
        }
      }
    } catch (error) {
      console.error('Image moderation failed:', error.message);
    }

    // 2. Generate embeddings from caption
    if (caption) {
      try {
        const embeddingResult = await vertexAI.generateEmbedding(caption);
        if (embeddingResult.success && embeddingResult.embedding.length > 0) {
          content.embeddings = embeddingResult.embedding;
          console.log(`✅ Generated ${embeddingResult.dimensions}-dim embeddings`);
        }
      } catch (error) {
        console.error('Embedding generation failed:', error.message);
      }
    }

    // 3. Generate AI caption if none exists
    if (!caption || caption.length < 10) {
      try {
        const captionResult = await vertexAI.generateCaption(thumbnailUrl);
        if (captionResult.success) {
          content.aiCaption = captionResult.caption;
          console.log(`✅ Generated AI caption: ${captionResult.caption}`);
        }
      } catch (error) {
        console.error('Caption generation failed:', error.message);
      }
    }

    // 4. Suggest hashtags
    if (content.hashtags && content.hashtags.length > 0) {
      try {
        const hashtagResult = await vertexAI.suggestHashtags(
          content.hashtags,
          content.caption || content.aiCaption || ''
        );
        if (hashtagResult.success) {
          content.aiTags = hashtagResult.suggestions;
          console.log(`✅ Suggested hashtags: ${hashtagResult.suggestions.join(', ')}`);
        }
      } catch (error) {
        console.error('Hashtag suggestion failed:', error.message);
      }
    }

    // 5. Calculate initial feed score
    content.feedScore = calculateInitialFeedScore(content);

    // 6. Update status to active if safe
    if (moderationScore < 70 && content.status === 'processing') {
      content.status = 'active';
    }

    await content.save();

    // 7. Invalidate caches
    if (content.userId) {
      await cache.invalidateFeed(content.userId);
    }
    await cache.del(cache.key('trending', 'global'));

    console.log(`✅ AI processing complete for ${contentId}`);

  } catch (error) {
    console.error('AI processing pipeline error:', error);
    
    // Update content with error
    try {
      await Content.findByIdAndUpdate(contentId, {
        processingError: error.message,
        status: 'active' // Still publish, just without AI features
      });
    } catch (updateError) {
      console.error('Failed to update error status:', updateError);
    }
  }
}

/**
 * Calculate initial feed score
 */
function calculateInitialFeedScore(content) {
  let score = 50; // Base score

  // Boost for verified users
  if (content.userId?.isVerified) {
    score += 20;
  }

  // Boost for quality content
  if (content.embeddings && content.embeddings.length > 0) {
    score += 15; // Has AI embeddings
  }

  // Penalty for unsafe content
  if (content.moderationScore > 50) {
    score -= (content.moderationScore - 50);
  }

  // Boost for complete metadata
  if (content.caption && content.caption.length > 20) {
    score += 10;
  }
  if (content.hashtags && content.hashtags.length >= 3) {
    score += 5;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * @route   POST /api/webhooks/cloudinary
 * @desc    Handle Cloudinary upload notifications
 * @access  Public (but signature verified)
 */
router.post('/', async (req, res) => {
  try {
    console.log('📨 Cloudinary webhook received');

    // Verify signature (disable in development if needed)
    if (process.env.NODE_ENV === 'production') {
      const isValid = verifyCloudinarySignature(req);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid webhook signature'
        });
      }
    }

    const { notification_type, resource_type } = req.body;

    console.log(`Webhook type: ${notification_type}, resource: ${resource_type}`);

    // Handle upload completion
    if (notification_type === 'upload' && resource_type === 'video') {
      await processVideo(req.body);
      
      return res.json({
        success: true,
        message: 'Video processing started'
      });
    }

    // Handle eager transformation completion (thumbnails)
    if (notification_type === 'eager' && resource_type === 'video') {
      console.log('✅ Thumbnail generated');
      
      return res.json({
        success: true,
        message: 'Thumbnail processed'
      });
    }

    // Handle other notification types
    console.log('⚠️  Unhandled notification type:', notification_type);
    
    return res.json({
      success: true,
      message: 'Notification received'
    });

  } catch (error) {
    console.error('Cloudinary webhook error:', error);
    
    // Always return 200 to avoid Cloudinary retries
    return res.json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/webhooks/cloudinary/health
 * @desc    Health check for webhook
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Cloudinary webhook handler is operational',
    timestamp: new Date().toISOString()
  });
});

/**
 * @route   POST /api/webhooks/cloudinary/test
 * @desc    Test webhook processing
 * @access  Development only
 */
router.post('/test', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      message: 'Test endpoint disabled in production'
    });
  }

  try {
    // Mock Cloudinary notification
    const mockNotification = {
      notification_type: 'upload',
      resource_type: 'video',
      public_id: 'test_video_' + Date.now(),
      secure_url: 'https://res.cloudinary.com/dlg6dnlj4/video/upload/v1234/test.mp4',
      format: 'mp4',
      width: 1920,
      height: 1080,
      duration: 30.5,
      bytes: 5242880
    };

    await processVideo(mockNotification);

    res.json({
      success: true,
      message: 'Test webhook processed',
      notification: mockNotification
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
