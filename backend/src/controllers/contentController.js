const Content = require('../models/Content');
const Sound = require('../models/Sound');
const UploadSession = require('../models/UploadSession');
const AuditLog = require('../models/AuditLog');
const { addTranscodeJob } = require('../services/transcodeQueue');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

/**
 * Content Controller - Handle content upload, management, and retrieval
 */

// Initialize upload session
exports.initializeUpload = async (req, res) => {
  try {
    const {
      fileName,
      fileSize,
      mimeType,
      chunkSize = 5 * 1024 * 1024, // 5MB default
      uploadType,
      metadata
    } = req.body;
    
    // Validate file size (max 500MB for videos, 50MB for audio)
    const maxSize = uploadType === 'video' ? 500 * 1024 * 1024 : 50 * 1024 * 1024;
    if (fileSize > maxSize) {
      return res.status(400).json({
        success: false,
        error: `File size exceeds maximum allowed (${maxSize / (1024 * 1024)}MB)`
      });
    }
    
    // Validate mime type
    const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    const allowedAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/aac'];
    
    if (uploadType === 'video' && !allowedVideoTypes.includes(mimeType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid video format. Allowed: MP4, MOV, AVI, WEBM'
      });
    }
    
    if (uploadType === 'audio' && !allowedAudioTypes.includes(mimeType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid audio format. Allowed: MP3, WAV, AAC'
      });
    }
    
    // Create upload session
    const session = await UploadSession.createSession({
      userId: req.user._id,
      fileName,
      fileSize,
      mimeType,
      chunkSize,
      uploadType,
      metadata
    });
    
    // Create temp directory for chunks
    const tempDir = path.join(__dirname, '../../uploads/temp', session.sessionId);
    await fs.mkdir(tempDir, { recursive: true });
    
    session.storage.tempPath = tempDir;
    await session.save();
    
    // Create content entry
    const content = new Content({
      userId: req.user._id,
      type: uploadType === 'audio' ? 'post' : 'video',
      status: 'uploading',
      media: {
        masterFile: {
          size: fileSize,
          mimeType,
          uploadedAt: new Date()
        }
      },
      processing: {
        uploadProgress: 0,
        currentStep: 'uploading'
      }
    });
    
    await content.save();
    
    session.contentId = content._id;
    await session.save();
    
    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        contentId: content._id,
        totalChunks: session.totalChunks,
        chunkSize: session.chunkSize,
        uploadUrl: `/api/content/upload/${session.sessionId}/chunk`
      }
    });
    
  } catch (error) {
    console.error('Initialize upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Upload chunk
exports.uploadChunk = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { chunkNumber } = req.body;
    const chunkData = req.file;
    
    if (!chunkData) {
      return res.status(400).json({
        success: false,
        error: 'No chunk data provided'
      });
    }
    
    // Find upload session
    const session = await UploadSession.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Upload session not found'
      });
    }
    
    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    // Save chunk to temp storage
    const chunkPath = path.join(session.storage.tempPath, `chunk_${chunkNumber}`);
    await fs.writeFile(chunkPath, chunkData.buffer);
    
    // Calculate chunk hash for integrity
    const hash = crypto.createHash('md5').update(chunkData.buffer).digest('hex');
    
    // Record chunk
    await session.recordChunk(parseInt(chunkNumber), chunkData.size, hash);
    
    // Update content upload progress
    const content = await Content.findById(session.contentId);
    if (content) {
      content.processing.uploadProgress = session.progress.percentage;
      await content.save();
    }
    
    res.json({
      success: true,
      data: {
        chunkNumber: parseInt(chunkNumber),
        progress: session.progress.percentage,
        chunksCompleted: session.progress.chunksCompleted,
        totalChunks: session.totalChunks,
        isComplete: session.status === 'completed'
      }
    });
    
  } catch (error) {
    console.error('Upload chunk error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Complete upload and assemble file
exports.completeUpload = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { caption, tags, hashtags, soundId, location, settings } = req.body;
    
    const session = await UploadSession.findOne({ sessionId });
    
    if (!session || session.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Upload not complete or session not found'
      });
    }
    
    // Assemble chunks into final file
    const finalFileName = `${session.sessionId}_${session.fileName}`;
    const finalPath = path.join(__dirname, '../../uploads', session.uploadType === 'video' ? 'videos' : 'sounds', finalFileName);
    
    await fs.mkdir(path.dirname(finalPath), { recursive: true });
    
    const writeStream = require('fs').createWriteStream(finalPath);
    
    for (let i = 1; i <= session.totalChunks; i++) {
      const chunkPath = path.join(session.storage.tempPath, `chunk_${i}`);
      const chunkData = await fs.readFile(chunkPath);
      writeStream.write(chunkData);
    }
    
    writeStream.end();
    
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
    
    // Update content with file info
    const content = await Content.findById(session.contentId);
    
    content.media.masterFile.url = `/uploads/${session.uploadType === 'video' ? 'videos' : 'sounds'}/${finalFileName}`;
    content.media.masterFile.key = finalFileName;
    content.media.masterFile.uploadedAt = new Date();
    
    if (caption) content.caption = caption;
    if (tags) content.tags = tags;
    if (hashtags) content.hashtags = hashtags.map(tag => ({ tag, normalizedTag: tag.toLowerCase().replace(/^#/, '') }));
    if (soundId) content.soundId = soundId;
    if (location) content.location = location;
    if (settings) content.settings = { ...content.settings, ...settings };
    
    content.status = 'processing';
    content.processing.uploadProgress = 100;
    content.processing.currentStep = 'transcoding';
    
    await content.save();
    
    // Clean up temp chunks
    try {
      await fs.rm(session.storage.tempPath, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }
    
    // Enqueue transcoding job (only for videos)
    if (content.type === 'video') {
      try {
        const transcodeResult = await addTranscodeJob(content._id, {
          qualities: ['720p', '480p', '360p'],
          generateHLS: true,
          generateDASH: false,
          thumbnailCount: 5,
          extractAudio: true,
          priority: 5
        });
        
        console.log('Transcode job enqueued:', transcodeResult);
      } catch (transcodeError) {
        console.error('Failed to enqueue transcode job:', transcodeError);
        // Don't fail the upload if transcoding fails to queue
      }
    }
    
    // Trigger automated moderation (Sightengine AI + basic checks)
    try {
      const sightengineService = require('../services/sightengineService');
      const moderationService = require('../services/moderationService');
      
      // First run Sightengine AI moderation
      if (content.type === 'video') {
        await sightengineService.moderateVideo(
          content.media.masterFile.url,
          content._id,
          req.user._id
        );
      } else if (content.type === 'image') {
        await sightengineService.moderateImage(
          content.media.masterFile.url,
          content._id,
          req.user._id
        );
      }
      
      // Also run basic moderation checks
      await moderationService.moderateContent(content._id);
      
      console.log('✅ AI moderation (Sightengine) triggered for content:', content._id);
    } catch (moderationError) {
      console.error('Failed to trigger moderation:', moderationError);
      // Don't fail the upload if moderation fails
    }
    
    // Audit log
    await AuditLog.create({
      userId: req.user._id,
      action: 'content.upload',
      resourceType: 'Content',
      resourceId: content._id,
      details: {
        type: content.type,
        fileSize: session.fileSize,
        fileName: session.fileName
      }
    });
    
    res.json({
      success: true,
      data: {
        contentId: content._id,
        status: content.status,
        message: 'Upload complete. Processing started.'
      }
    });
    
  } catch (error) {
    console.error('Complete upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get upload session status
exports.getUploadStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await UploadSession.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    const missingChunks = session.getMissingChunks();
    
    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        status: session.status,
        progress: session.progress,
        totalChunks: session.totalChunks,
        chunksCompleted: session.uploadedChunks.length,
        missingChunks,
        lastActivityAt: session.lastActivityAt
      }
    });
    
  } catch (error) {
    console.error('Get upload status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get content by ID
exports.getContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    
    const content = await Content.findById(contentId)
      .populate('userId', 'username fullName profilePicture verified')
      .populate('soundId', 'title artist duration fileUrl')
      .populate('originalContentId', 'userId caption thumbnails');
    
    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }
    
    // Check visibility
    if (content.visibility === 'private' && content.userId._id.toString() !== req.user?._id?.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Content is private'
      });
    }
    
    res.json({
      success: true,
      data: content
    });
    
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get content feed (For You / Following)
exports.getFeed = async (req, res) => {
  try {
    const {
      feedType = 'foryou', // foryou, following, trending
      cursor,
      limit = 20,
      location,
      tags
    } = req.query;
    
    const skip = cursor ? parseInt(cursor) : 0;
    
    let contents;
    
    if (feedType === 'following') {
      contents = await Content.getFeed({}, {
        userId: req.user._id,
        following: true,
        limit: parseInt(limit),
        skip
      });
    } else if (feedType === 'trending') {
      contents = await Content.getTrending({
        limit: parseInt(limit),
        location
      });
    } else {
      // For You feed - personalized (placeholder, will integrate with recommendation engine)
      contents = await Content.getFeed({}, {
        limit: parseInt(limit),
        skip,
        location,
        tags: tags ? tags.split(',') : undefined,
        sortBy: 'metrics.engagementScore',
        sortOrder: 'desc'
      });
    }
    
    res.json({
      success: true,
      data: contents,
      meta: {
        cursor: skip + contents.length,
        hasMore: contents.length === parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Search content
exports.searchContent = async (req, res) => {
  try {
    const {
      q: searchTerm,
      type,
      limit = 20,
      skip = 0
    } = req.query;
    
    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        error: 'Search term required'
      });
    }
    
    const contents = await Content.searchContent(searchTerm, {
      type,
      limit: parseInt(limit),
      skip: parseInt(skip)
    });
    
    res.json({
      success: true,
      data: contents,
      meta: {
        count: contents.length,
        searchTerm
      }
    });
    
  } catch (error) {
    console.error('Search content error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update content
exports.updateContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    const updates = req.body;
    
    const content = await Content.findById(contentId);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }
    
    if (content.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    // Update allowed fields
    const allowedFields = ['caption', 'description', 'tags', 'hashtags', 'location', 'settings', 'visibility'];
    
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        content[field] = updates[field];
      }
    });
    
    await content.save();
    
    await AuditLog.create({
      userId: req.user._id,
      action: 'content.update',
      resourceType: 'Content',
      resourceId: content._id,
      details: updates
    });
    
    res.json({
      success: true,
      data: content
    });
    
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Delete content
exports.deleteContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    
    const content = await Content.findById(contentId);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }
    
    if (content.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    content.status = 'deleted';
    await content.save();
    
    await AuditLog.create({
      userId: req.user._id,
      action: 'content.delete',
      resourceType: 'Content',
      resourceId: content._id
    });
    
    res.json({
      success: true,
      message: 'Content deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get stream URL (HLS/DASH manifest)
exports.getStreamUrl = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { quality = 'auto' } = req.query;
    
    const content = await Content.findById(contentId);
    
    if (!content || !content.isAvailable()) {
      return res.status(404).json({
        success: false,
        error: 'Content not available'
      });
    }
    
    const streamUrls = content.streamUrls;
    
    if (!streamUrls) {
      return res.status(400).json({
        success: false,
        error: 'Streaming not available for this content'
      });
    }
    
    res.json({
      success: true,
      data: {
        contentId: content._id,
        streamUrls,
        duration: content.media.duration,
        thumbnails: streamUrls.thumbnails,
        captions: streamUrls.captions
      }
    });
    
  } catch (error) {
    console.error('Get stream URL error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Simple content creation (for text posts without file upload)
exports.createSimpleContent = async (req, res) => {
  try {
    const { title, description, type, hashtags, visibility } = req.body;
    
    // Validate required fields
    if (!title && !description) {
      return res.status(400).json({
        success: false,
        message: 'Title or description is required'
      });
    }
    
    // Generate unique contentId
    const contentId = `${type || 'post'}_${req.user._id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Process hashtags into correct format
    const processedHashtags = (hashtags || []).map(tag => ({
      tag: tag.startsWith('#') ? tag : `#${tag}`,
      normalizedTag: tag.toLowerCase().replace(/^#/, '')
    }));
    
    // Create content
    const content = new Content({
      contentId,
      userId: req.user._id,
      type: type || 'post',
      title,
      description,
      hashtags: processedHashtags,
      visibility: visibility || 'public',
      status: 'ready', // Use 'ready' instead of 'published'
      publishedAt: new Date()
    });
    
    await content.save();
    
    // Populate user data
    await content.populate('userId', 'username fullName avatar isVerified');
    
    res.status(201).json({
      success: true,
      message: 'Content created successfully',
      data: { content }
    });
    
  } catch (error) {
    console.error('Create simple content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create content',
      error: error.message
    });
  }
};

// Like content
exports.likeContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    
    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }
    
    // Check if already liked
    const likeIndex = content.engagement.likes.indexOf(req.user._id);
    
    if (likeIndex > -1) {
      // Unlike
      content.engagement.likes.splice(likeIndex, 1);
      content.engagement.likesCount = Math.max(0, content.engagement.likesCount - 1);
    } else {
      // Like
      content.engagement.likes.push(req.user._id);
      content.engagement.likesCount += 1;
    }
    
    await content.save();
    
    res.json({
      success: true,
      message: likeIndex > -1 ? 'Content unliked' : 'Content liked',
      data: {
        isLiked: likeIndex === -1,
        likesCount: content.engagement.likesCount
      }
    });
    
  } catch (error) {
    console.error('Like content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like content',
      error: error.message
    });
  }
};

module.exports = exports;
