const StreamingService = require('../services/streamingService');
const Content = require('../models/Content');
const ViewEvent = require('../models/ViewEvent');
const path = require('path');
const fs = require('fs').promises;

/**
 * Player Controller
 * 
 * Handles video player API endpoints including:
 * - HLS/DASH manifest delivery
 * - Progressive download
 * - Adaptive bitrate selection
 * - Playback tracking
 */

/**
 * Get HLS master playlist
 */
exports.getHLSMasterPlaylist = async (req, res) => {
  try {
    const { contentId } = req.params;
    
    const result = await StreamingService.getHLSManifest(contentId);
    
    res.set('Content-Type', 'application/vnd.apple.mpegurl');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(result.manifest);
    
  } catch (error) {
    console.error('Error getting HLS manifest:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get HLS variant playlist
 */
exports.getHLSVariantPlaylist = async (req, res) => {
  try {
    const { contentId, quality } = req.params;
    
    // Read variant playlist from storage
    const playlistPath = path.join(
      process.env.UPLOAD_DIR || 'uploads',
      'videos',
      contentId,
      'hls',
      quality,
      'playlist.m3u8'
    );
    
    const playlist = await fs.readFile(playlistPath, 'utf8');
    
    res.set('Content-Type', 'application/vnd.apple.mpegurl');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(playlist);
    
  } catch (error) {
    console.error('Error getting HLS variant playlist:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get HLS video segment
 */
exports.getHLSSegment = async (req, res) => {
  try {
    const { contentId, quality, segment } = req.params;
    
    const segmentPath = path.join(
      process.env.UPLOAD_DIR || 'uploads',
      'videos',
      contentId,
      'hls',
      quality,
      segment
    );
    
    // Set headers for segment streaming
    res.set('Content-Type', 'video/MP2T');
    res.set('Cache-Control', 'public, max-age=31536000'); // 1 year
    res.set('Accept-Ranges', 'bytes');
    
    // Stream the segment
    const stat = await fs.stat(segmentPath);
    const range = req.headers.range;
    
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunkSize = end - start + 1;
      
      res.status(206);
      res.set('Content-Range', `bytes ${start}-${end}/${stat.size}`);
      res.set('Content-Length', chunkSize);
      
      const stream = require('fs').createReadStream(segmentPath, { start, end });
      stream.pipe(res);
    } else {
      res.set('Content-Length', stat.size);
      const stream = require('fs').createReadStream(segmentPath);
      stream.pipe(res);
    }
    
  } catch (error) {
    console.error('Error getting HLS segment:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get DASH manifest
 */
exports.getDASHManifest = async (req, res) => {
  try {
    const { contentId } = req.params;
    
    const result = await StreamingService.getDASHManifest(contentId);
    
    res.set('Content-Type', 'application/dash+xml');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(result.manifest);
    
  } catch (error) {
    console.error('Error getting DASH manifest:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get progressive MP4 video
 */
exports.getProgressiveVideo = async (req, res) => {
  try {
    const { contentId, quality } = req.params;
    
    const videoPath = path.join(
      process.env.UPLOAD_DIR || 'uploads',
      'videos',
      contentId,
      'progressive',
      `${quality}.mp4`
    );
    
    const stat = await fs.stat(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    if (range) {
      // Range request for seeking
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      
      res.status(206);
      res.set({
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
        'Cache-Control': 'public, max-age=31536000'
      });
      
      const stream = require('fs').createReadStream(videoPath, { start, end });
      stream.pipe(res);
    } else {
      // Full video
      res.set({
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000'
      });
      
      const stream = require('fs').createReadStream(videoPath);
      stream.pipe(res);
    }
    
  } catch (error) {
    console.error('Error getting progressive video:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get player configuration
 */
exports.getPlayerConfig = async (req, res) => {
  try {
    const { contentId } = req.params;
    const userId = req.user?._id;
    
    const config = await StreamingService.getPlayerConfig(contentId, userId, {
      autoplay: req.query.autoplay === 'true',
      muted: req.query.muted === 'true',
      preload: req.query.preload || 'metadata'
    });
    
    res.json(config);
    
  } catch (error) {
    console.error('Error getting player config:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get optimal quality recommendation
 */
exports.getOptimalQuality = async (req, res) => {
  try {
    const { contentId } = req.params;
    
    // Get available qualities
    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    const TranscodeJob = require('../models/TranscodeJob');
    const transcodeJob = await TranscodeJob.findOne({ 
      content: contentId, 
      status: 'completed' 
    });
    
    if (!transcodeJob || !transcodeJob.outputs.hls) {
      return res.status(404).json({ error: 'Transcode not available' });
    }
    
    // Select optimal quality based on client info
    const optimal = StreamingService.selectOptimalQuality(
      transcodeJob.outputs.hls.variants,
      {
        bandwidth: parseInt(req.query.bandwidth) || 5000000,
        deviceType: req.query.deviceType || 'mobile',
        screenResolution: req.query.resolution || '1920x1080',
        batteryLevel: parseFloat(req.query.battery) || 1.0,
        dataPreference: req.query.dataPreference || 'auto'
      }
    );
    
    res.json(optimal);
    
  } catch (error) {
    console.error('Error getting optimal quality:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get preload segments
 */
exports.getPreloadSegments = async (req, res) => {
  try {
    const { contentId } = req.params;
    const count = parseInt(req.query.count) || 5;
    
    const segments = await StreamingService.getPreloadSegments(contentId, count);
    
    res.json(segments);
    
  } catch (error) {
    console.error('Error getting preload segments:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get signed streaming URL
 */
exports.getSignedUrl = async (req, res) => {
  try {
    const { contentId } = req.params;
    const userId = req.user?._id;
    
    const result = StreamingService.generateSignedUrl(contentId, userId, {
      expiresIn: parseInt(req.query.expiresIn) || 3600,
      quality: req.query.quality || 'auto',
      format: req.query.format || 'hls'
    });
    
    res.json(result);
    
  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Stream with signed token verification
 */
exports.streamWithToken = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { token } = req.query;
    
    if (!token) {
      return res.status(401).json({ error: 'Token required' });
    }
    
    // Verify token
    const payload = StreamingService.verifyStreamToken(token);
    
    if (payload.contentId !== contentId) {
      return res.status(403).json({ error: 'Invalid content' });
    }
    
    // Redirect to actual stream
    const format = payload.format || 'hls';
    const redirectUrl = format === 'hls' 
      ? `/api/player/hls/${contentId}/master.m3u8`
      : `/api/player/dash/${contentId}/manifest.mpd`;
    
    res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('Error streaming with token:', error);
    res.status(401).json({ error: error.message });
  }
};

/**
 * Track playback progress
 */
exports.trackProgress = async (req, res) => {
  try {
    const { contentId } = req.params;
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const progressData = {
      currentTime: req.body.currentTime,
      duration: req.body.duration,
      watchTime: req.body.watchTime,
      quality: req.body.quality,
      bandwidth: req.body.bandwidth,
      bufferHealth: req.body.bufferHealth,
      deviceType: req.body.deviceType
    };
    
    const event = await StreamingService.trackProgress(contentId, userId, progressData);
    
    res.json({ success: true, eventId: event._id });
    
  } catch (error) {
    console.error('Error tracking progress:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get CDN URLs for content
 */
exports.getCDNUrls = async (req, res) => {
  try {
    const { contentId } = req.params;
    
    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    const urls = StreamingService.getCDNUrls(content, {
      cdnProvider: req.query.provider,
      region: req.query.region
    });
    
    res.json(urls);
    
  } catch (error) {
    console.error('Error getting CDN URLs:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get video captions/subtitles
 */
exports.getCaptions = async (req, res) => {
  try {
    const { contentId, language } = req.params;
    
    const captionsPath = path.join(
      process.env.UPLOAD_DIR || 'uploads',
      'captions',
      contentId,
      `${language}.vtt`
    );
    
    const captions = await fs.readFile(captionsPath, 'utf8');
    
    res.set('Content-Type', 'text/vtt');
    res.set('Cache-Control', 'public, max-age=31536000');
    res.send(captions);
    
  } catch (error) {
    console.error('Error getting captions:', error);
    res.status(404).json({ error: 'Captions not found' });
  }
};

module.exports = exports;
