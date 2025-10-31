const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const Content = require('../models/Content');
const crypto = require('crypto');

/**
 * Upload Service - Presigned S3/R2 URLs for Direct Client Uploads
 * Enables clients (Flutter, React) to upload directly to cloud storage
 */

class UploadService {
  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      },
      endpoint: process.env.AWS_S3_ENDPOINT, // For Cloudflare R2
      forcePathStyle: !!process.env.AWS_S3_ENDPOINT // Required for R2
    });
    
    this.bucket = process.env.AWS_S3_BUCKET || 'mixillo-media';
    this.cdnUrl = process.env.CDN_URL || '';
    
    // File constraints
    this.maxFileSizes = {
      video: 500 * 1024 * 1024,  // 500MB
      image: 50 * 1024 * 1024,   // 50MB
      audio: 50 * 1024 * 1024,   // 50MB
      document: 10 * 1024 * 1024 // 10MB (for ID verification)
    };
    
    this.allowedMimeTypes = {
      video: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska'],
      image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/aac', 'audio/ogg'],
      document: ['image/jpeg', 'image/png', 'application/pdf']
    };
  }

  /**
   * Generate Presigned Upload URL
   * Client will POST directly to this URL
   */
  async generateUploadUrl(options) {
    const {
      userId,
      fileName,
      fileSize,
      mimeType,
      contentType,
      metadata = {}
    } = options;

    // Validate file size
    const maxSize = this.maxFileSizes[contentType] || this.maxFileSizes.image;
    if (fileSize > maxSize) {
      throw new Error(`File size exceeds maximum allowed (${maxSize / (1024 * 1024)}MB)`);
    }

    // Validate MIME type
    const allowedTypes = this.allowedMimeTypes[contentType] || this.allowedMimeTypes.image;
    if (!allowedTypes.includes(mimeType)) {
      throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
    }

    // Generate unique key
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(8).toString('hex');
    const extension = this._getExtension(fileName);
    const key = `${contentType}s/${userId}/${timestamp}_${randomId}${extension}`;

    // Create content record
    const content = new Content({
      userId,
      type: contentType,
      status: 'uploading',
      media: {
        masterFile: {
          key,
          size: fileSize,
          mimeType,
          uploadedAt: null
        }
      },
      processing: {
        uploadProgress: 0,
        currentStep: 'uploading',
        startedAt: new Date()
      },
      metadata
    });

    await content.save();

    // Generate presigned URL (expires in 1 hour)
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
      Metadata: {
        userId: userId.toString(),
        contentId: content._id.toString(),
        uploadedAt: new Date().toISOString()
      }
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600 // 1 hour
    });

    return {
      uploadUrl,
      key,
      contentId: content._id,
      bucket: this.bucket,
      expiresIn: 3600,
      method: 'PUT'
    };
  }

  /**
   * Generate Multipart Upload URLs (for large files)
   * Chunked uploads for files > 100MB
   */
  async generateMultipartUpload(options) {
    const {
      userId,
      fileName,
      fileSize,
      mimeType,
      contentType,
      chunkSize = 10 * 1024 * 1024, // 10MB chunks
      metadata = {}
    } = options;

    // Validate
    const maxSize = this.maxFileSizes[contentType] || this.maxFileSizes.image;
    if (fileSize > maxSize) {
      throw new Error(`File size exceeds maximum allowed (${maxSize / (1024 * 1024)}MB)`);
    }

    // Generate key
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(8).toString('hex');
    const extension = this._getExtension(fileName);
    const key = `${contentType}s/${userId}/${timestamp}_${randomId}${extension}`;

    // Calculate chunks
    const totalChunks = Math.ceil(fileSize / chunkSize);
    const chunks = [];

    // Create content record
    const content = new Content({
      userId,
      type: contentType,
      status: 'uploading',
      media: {
        masterFile: {
          key,
          size: fileSize,
          mimeType,
          uploadedAt: null
        }
      },
      processing: {
        uploadProgress: 0,
        currentStep: 'uploading',
        totalChunks,
        uploadedChunks: 0,
        startedAt: new Date()
      },
      metadata: {
        ...metadata,
        multipart: true,
        chunkSize
      }
    });

    await content.save();

    // Generate presigned URL for each chunk
    for (let i = 0; i < totalChunks; i++) {
      const chunkKey = `${key}.part${i + 1}`;
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: chunkKey,
        ContentType: mimeType
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 7200 // 2 hours for large uploads
      });

      chunks.push({
        partNumber: i + 1,
        uploadUrl,
        key: chunkKey,
        startByte: i * chunkSize,
        endByte: Math.min((i + 1) * chunkSize - 1, fileSize - 1)
      });
    }

    return {
      contentId: content._id,
      key,
      bucket: this.bucket,
      totalChunks,
      chunkSize,
      chunks,
      expiresIn: 7200
    };
  }

  /**
   * Confirm Upload Complete
   * Client calls this after successful upload to S3
   */
  async confirmUpload(contentId, options = {}) {
    const { caption, tags, hashtags, soundId, location, settings } = options;

    const content = await Content.findById(contentId);
    if (!content) {
      throw new Error('Content not found');
    }

    // Update content metadata
    content.media.masterFile.uploadedAt = new Date();
    content.media.masterFile.url = this._getPublicUrl(content.media.masterFile.key);
    
    if (caption) content.caption = caption;
    if (tags) content.tags = tags;
    if (hashtags) content.hashtags = hashtags.map(tag => ({
      tag,
      normalizedTag: tag.toLowerCase().replace(/^#/, '')
    }));
    if (soundId) content.soundId = soundId;
    if (location) content.location = location;
    if (settings) content.settings = { ...content.settings, ...settings };

    content.status = 'processing';
    content.processing.uploadProgress = 100;
    content.processing.currentStep = 'transcoding';
    content.processing.completedAt = new Date();

    await content.save();

    // Trigger transcoding for videos
    if (content.type === 'video') {
      const transcodeQueue = require('./transcodeQueue');
      try {
        await transcodeQueue.addTranscodeJob(content._id, {
          qualities: ['1080p', '720p', '480p', '360p'],
          generateHLS: true,
          thumbnailCount: 5,
          extractAudio: true,
          priority: 5
        });
      } catch (error) {
        console.error('Failed to enqueue transcode job:', error);
      }
    }

    // Trigger AI moderation
    const sightengineService = require('./sightengineService');
    try {
      if (content.type === 'video') {
        await sightengineService.moderateVideo(
          content.media.masterFile.url,
          content._id,
          content.userId
        );
      } else if (content.type === 'image') {
        await sightengineService.moderateImage(
          content.media.masterFile.url,
          content._id,
          content.userId
        );
      }
    } catch (error) {
      console.error('Failed to trigger moderation:', error);
    }

    return {
      success: true,
      content: {
        id: content._id,
        status: content.status,
        url: content.media.masterFile.url
      }
    };
  }

  /**
   * Update Upload Progress (for multipart)
   */
  async updateProgress(contentId, uploadedChunks, totalChunks) {
    const content = await Content.findById(contentId);
    if (!content) {
      throw new Error('Content not found');
    }

    const progress = Math.round((uploadedChunks / totalChunks) * 100);
    
    content.processing.uploadedChunks = uploadedChunks;
    content.processing.uploadProgress = progress;
    
    await content.save();

    return {
      contentId,
      progress,
      uploadedChunks,
      totalChunks,
      isComplete: uploadedChunks === totalChunks
    };
  }

  /**
   * Generate Download URL (presigned GET)
   */
  async generateDownloadUrl(key, expiresIn = 3600) {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key
    });

    const downloadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn
    });

    return downloadUrl;
  }

  /**
   * Delete File from S3/R2
   */
  async deleteFile(key) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key
    });

    await this.s3Client.send(command);
    return { success: true, key };
  }

  /**
   * Cancel Upload
   */
  async cancelUpload(contentId) {
    const content = await Content.findById(contentId);
    if (!content) {
      throw new Error('Content not found');
    }

    // Delete partially uploaded file if exists
    if (content.media.masterFile.key) {
      try {
        await this.deleteFile(content.media.masterFile.key);
      } catch (error) {
        console.error('Failed to delete file:', error);
      }
    }

    // Delete multipart chunks
    if (content.metadata?.multipart) {
      const totalChunks = content.processing.totalChunks || 0;
      for (let i = 0; i < totalChunks; i++) {
        try {
          await this.deleteFile(`${content.media.masterFile.key}.part${i + 1}`);
        } catch (error) {
          console.error(`Failed to delete chunk ${i + 1}:`, error);
        }
      }
    }

    // Update content status
    content.status = 'cancelled';
    await content.save();

    return { success: true, contentId };
  }

  /**
   * Get Upload Status
   */
  async getUploadStatus(contentId) {
    const content = await Content.findById(contentId)
      .select('status processing media.masterFile');

    if (!content) {
      throw new Error('Content not found');
    }

    return {
      contentId: content._id,
      status: content.status,
      progress: content.processing.uploadProgress || 0,
      currentStep: content.processing.currentStep,
      uploadedChunks: content.processing.uploadedChunks || 0,
      totalChunks: content.processing.totalChunks || 1,
      url: content.media.masterFile.url || null
    };
  }

  /**
   * Helper: Get file extension
   */
  _getExtension(fileName) {
    const ext = fileName.split('.').pop();
    return ext ? `.${ext}` : '';
  }

  /**
   * Helper: Get public CDN URL
   */
  _getPublicUrl(key) {
    if (this.cdnUrl) {
      return `${this.cdnUrl}/${key}`;
    }
    // Fallback to S3/R2 direct URL
    if (process.env.AWS_S3_ENDPOINT) {
      return `${process.env.AWS_S3_ENDPOINT}/${this.bucket}/${key}`;
    }
    return `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }

  /**
   * Get Service Configuration
   */
  getConfig() {
    return {
      bucket: this.bucket,
      cdnUrl: this.cdnUrl,
      maxFileSizes: this.maxFileSizes,
      allowedMimeTypes: this.allowedMimeTypes,
      s3Configured: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
    };
  }
}

module.exports = new UploadService();
