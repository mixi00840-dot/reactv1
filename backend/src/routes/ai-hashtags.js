const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const ffmpeg = require('fluent-ffmpeg');
const { ImageAnnotatorClient } = require('@google-cloud/vision');
const { VertexAI } = require('@google-cloud/vertexai');

// MongoDB models
const Post = require('../models/Post');
const Tag = require('../models/Tag');

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/temp');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

// Initialize Google Cloud clients
let visionClient, vertexAI;
try {
  visionClient = new ImageAnnotatorClient({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || './google-cloud-key.json'
  });
  
  vertexAI = new VertexAI({
    project: process.env.GOOGLE_CLOUD_PROJECT || 'your-project-id',
    location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
  });
  
  console.log('✅ Google Cloud Vision & Vertex AI initialized');
} catch (error) {
  console.error('❌ Failed to initialize AI services:', error.message);
}

/**
 * Extract frames from video for analysis
 */
async function extractFrames(videoPath, count = 5) {
  const framesDir = path.join(path.dirname(videoPath), 'frames');
  await fs.mkdir(framesDir, { recursive: true });
  
  return new Promise((resolve, reject) => {
    const frames = [];
    
    ffmpeg.ffprobe(videoPath, async (err, metadata) => {
      if (err) return reject(err);
      
      const duration = metadata.format.duration;
      const interval = duration / (count + 1);
      
      for (let i = 1; i <= count; i++) {
        const timestamp = interval * i;
        const framePath = path.join(framesDir, `frame-${i}.jpg`);
        
        await new Promise((res, rej) => {
          ffmpeg(videoPath)
            .screenshots({
              timestamps: [timestamp],
              filename: `frame-${i}.jpg`,
              folder: framesDir,
              size: '1280x720'
            })
            .on('end', () => {
              frames.push(framePath);
              res();
            })
            .on('error', rej);
        });
      }
      
      resolve(frames);
    });
  });
}

/**
 * Analyze image with Google Cloud Vision
 */
async function analyzeImage(imagePath) {
  if (!visionClient) {
    throw new Error('Vision API not configured');
  }
  
  const [result] = await visionClient.annotateImage({
    image: { source: { filename: imagePath } },
    features: [
      { type: 'LABEL_DETECTION', maxResults: 10 },
      { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
      { type: 'TEXT_DETECTION' },
      { type: 'SAFE_SEARCH_DETECTION' },
    ],
  });
  
  return {
    labels: result.labelAnnotations?.map(l => l.description) || [],
    objects: result.localizedObjectAnnotations?.map(o => o.name) || [],
    text: result.textAnnotations?.[0]?.description || '',
    safeSearch: result.safeSearchAnnotation,
  };
}

/**
 * Generate hashtags using Vertex AI
 */
async function generateHashtagsWithAI(context) {
  if (!vertexAI) {
    throw new Error('Vertex AI not configured');
  }
  
  const generativeModel = vertexAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      maxOutputTokens: 200,
      temperature: 0.7,
      topP: 0.8,
    },
  });
  
  const prompt = `Based on this video content analysis, generate 15-20 relevant, trending hashtags for a TikTok-style social media post. 
  
Video Analysis:
- Visual Labels: ${context.labels.join(', ')}
- Objects Detected: ${context.objects.join(', ')}
- Text in Video: ${context.text || 'None'}
- User Description: ${context.description || 'None'}

Requirements:
1. Mix of popular and niche hashtags
2. Include trending topics if relevant
3. Use proper TikTok hashtag format (#lowercase)
4. Prioritize engagement-driving hashtags
5. Include category hashtags (e.g., #dance, #comedy, #tutorial)

Return ONLY a JSON array of hashtags without any explanation, like this:
["#hashtag1", "#hashtag2", "#hashtag3"]`;

  const result = await generativeModel.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  // Extract JSON array from response
  const match = text.match(/\[[\s\S]*\]/);
  if (match) {
    return JSON.parse(match[0]);
  }
  
  return [];
}

/**
 * Get trending hashtags from database
 */
async function getTrendingHashtags(limit = 20) {
  try {
    // Get hashtags sorted by usage count
    const trending = await Tag.find({ type: 'hashtag' })
      .sort({ usageCount: -1 })
      .limit(limit)
      .select('name usageCount');
    
    return trending.map(t => ({
      hashtag: t.name.startsWith('#') ? t.name : `#${t.name}`,
      count: t.usageCount || 0,
    }));
  } catch (error) {
    console.error('Error fetching trending hashtags:', error);
    return [];
  }
}

/**
 * POST /api/ai/hashtags/generate
 * Generate hashtag suggestions from video
 */
router.post('/generate', upload.single('video'), async (req, res) => {
  let videoPath = null;
  let framesDir = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No video file uploaded'
      });
    }
    
    videoPath = req.file.path;
    const { description = '', includeAI = 'true', includeTrending = 'true' } = req.body;
    
    console.log(`🏷️  Generating hashtags for: ${req.file.filename}`);
    
    const suggestions = [];
    
    // Get trending hashtags
    if (includeTrending === 'true') {
      const trending = await getTrendingHashtags(10);
      suggestions.push(...trending.map(t => ({
        hashtag: t.hashtag,
        source: 'trending',
        count: t.count,
        relevance: 0.5, // Default relevance for trending
      })));
    }
    
    // AI-powered analysis (if enabled and configured)
    if (includeAI === 'true' && visionClient && vertexAI) {
      try {
        // Extract frames from video
        console.log('🎬 Extracting frames...');
        const frames = await extractFrames(videoPath, 3);
        framesDir = path.dirname(frames[0]);
        
        // Analyze each frame
        console.log('👁️  Analyzing frames with Vision AI...');
        const analyses = await Promise.all(
          frames.map(frame => analyzeImage(frame))
        );
        
        // Combine analysis results
        const combinedLabels = [...new Set(analyses.flatMap(a => a.labels))];
        const combinedObjects = [...new Set(analyses.flatMap(a => a.objects))];
        const combinedText = analyses.map(a => a.text).filter(Boolean).join(' ');
        
        // Generate hashtags with Vertex AI
        console.log('🤖 Generating hashtags with Gemini AI...');
        const aiHashtags = await generateHashtagsWithAI({
          labels: combinedLabels,
          objects: combinedObjects,
          text: combinedText,
          description,
        });
        
        // Add AI-generated hashtags
        aiHashtags.forEach(hashtag => {
          suggestions.push({
            hashtag: hashtag.startsWith('#') ? hashtag : `#${hashtag}`,
            source: 'ai',
            relevance: 0.9, // High relevance for AI
          });
        });
        
      } catch (aiError) {
        console.error('⚠️  AI analysis error:', aiError.message);
        // Continue without AI suggestions
      }
    }
    
    // Fallback: Extract hashtags from description
    if (description) {
      const descHashtags = description.match(/#\w+/g) || [];
      descHashtags.forEach(hashtag => {
        suggestions.push({
          hashtag,
          source: 'description',
          relevance: 0.8,
        });
      });
    }
    
    // Remove duplicates and sort by relevance
    const uniqueHashtags = [];
    const seen = new Set();
    
    for (const suggestion of suggestions) {
      const normalized = suggestion.hashtag.toLowerCase();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        uniqueHashtags.push(suggestion);
      }
    }
    
    uniqueHashtags.sort((a, b) => b.relevance - a.relevance);
    
    // Cleanup
    try {
      if (videoPath) await fs.unlink(videoPath);
      if (framesDir) {
        const files = await fs.readdir(framesDir);
        await Promise.all(files.map(f => fs.unlink(path.join(framesDir, f))));
        await fs.rmdir(framesDir);
      }
    } catch (cleanupError) {
      console.error('⚠️  Cleanup error:', cleanupError);
    }
    
    console.log(`✅ Generated ${uniqueHashtags.length} hashtag suggestions`);
    
    res.json({
      success: true,
      suggestions: uniqueHashtags.slice(0, 30), // Limit to 30
      total: uniqueHashtags.length,
    });
    
  } catch (error) {
    console.error('❌ Hashtag generation error:', error);
    
    // Cleanup on error
    try {
      if (videoPath) await fs.unlink(videoPath);
      if (framesDir) {
        const files = await fs.readdir(framesDir);
        await Promise.all(files.map(f => fs.unlink(path.join(framesDir, f))));
        await fs.rmdir(framesDir);
      }
    } catch (cleanupError) {
      console.error('⚠️  Cleanup error:', cleanupError);
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate hashtags'
    });
  }
});

/**
 * GET /api/ai/hashtags/trending
 * Get trending hashtags
 */
router.get('/trending', async (req, res) => {
  try {
    const { limit = 20, category } = req.query;
    
    const query = { type: 'hashtag' };
    if (category) {
      query.category = category;
    }
    
    const trending = await Tag.find(query)
      .sort({ usageCount: -1 })
      .limit(parseInt(limit))
      .select('name usageCount category');
    
    res.json({
      success: true,
      hashtags: trending.map(t => ({
        hashtag: t.name.startsWith('#') ? t.name : `#${t.name}`,
        count: t.usageCount || 0,
        category: t.category,
      })),
    });
  } catch (error) {
    console.error('❌ Get trending error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ai/hashtags/search
 * Search for hashtags with autocomplete
 */
router.post('/search', async (req, res) => {
  try {
    const { query, limit = 10 } = req.body;
    
    if (!query || query.length < 2) {
      return res.json({
        success: true,
        results: [],
      });
    }
    
    const searchQuery = query.startsWith('#') ? query.substring(1) : query;
    
    const results = await Tag.find({
      type: 'hashtag',
      name: { $regex: searchQuery, $options: 'i' }
    })
      .sort({ usageCount: -1 })
      .limit(parseInt(limit))
      .select('name usageCount');
    
    res.json({
      success: true,
      results: results.map(t => ({
        hashtag: t.name.startsWith('#') ? t.name : `#${t.name}`,
        count: t.usageCount || 0,
      })),
    });
  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ai/hashtags/categories
 * Get hashtag categories
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      { id: 'trending', name: 'Trending', icon: '🔥' },
      { id: 'dance', name: 'Dance', icon: '💃' },
      { id: 'comedy', name: 'Comedy', icon: '😂' },
      { id: 'music', name: 'Music', icon: '🎵' },
      { id: 'tutorial', name: 'Tutorial', icon: '📚' },
      { id: 'food', name: 'Food', icon: '🍔' },
      { id: 'fitness', name: 'Fitness', icon: '💪' },
      { id: 'beauty', name: 'Beauty', icon: '💄' },
      { id: 'fashion', name: 'Fashion', icon: '👗' },
      { id: 'travel', name: 'Travel', icon: '✈️' },
      { id: 'gaming', name: 'Gaming', icon: '🎮' },
      { id: 'pets', name: 'Pets', icon: '🐶' },
    ];
    
    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error('❌ Get categories error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
