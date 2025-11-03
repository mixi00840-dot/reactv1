const mongoose = require('mongoose');

/**
 * UploadSession Model - Manages chunked/resumable uploads
 * Supports large file uploads with pause/resume capability
 */
const uploadSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  
  // User and content reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content'
  },
  
  // Upload type
  uploadType: {
    type: String,
    enum: ['video', 'audio', 'image', 'document'],
    required: true
  },
  
  // File information
  fileName: {
    type: String,
    required: true
  },
  
  fileSize: {
    type: Number,
    required: true // total bytes
  },
  
  mimeType: {
    type: String,
    required: true
  },
  
  fileHash: String, // MD5 or SHA-256 for integrity
  
  // Chunking configuration
  chunkSize: {
    type: Number,
    default: 5 * 1024 * 1024 // 5MB chunks
  },
  
  totalChunks: {
    type: Number,
    required: true
  },
  
  uploadedChunks: [{
    chunkNumber: Number,
    size: Number,
    etag: String, // S3 ETag for multipart
    uploadedAt: Date
  }],
  
  // Storage location
  storage: {
    provider: {
      type: String,
      enum: ['s3', 'gcs', 'azure', 'local'],
      default: 's3'
    },
    bucket: String,
    key: String,
    uploadId: String, // S3 multipart upload ID
    tempPath: String // local temp storage
  },
  
  // Upload progress
  progress: {
    bytesUploaded: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    chunksCompleted: {
      type: Number,
      default: 0
    },
    lastChunkAt: Date
  },
  
  // Session status
  status: {
    type: String,
    enum: ['initialized', 'uploading', 'paused', 'completed', 'failed', 'cancelled', 'expired'],
    default: 'initialized',
    index: true
  },
  
  // Timestamps
  startedAt: Date,
  completedAt: Date,
  lastActivityAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  expiresAt: {
    type: Date,
    index: true
  },
  
  // Error tracking
  errors: [{
    chunkNumber: Number,
    error: String,
    timestamp: Date,
    retryCount: Number
  }],
  
  lastError: String,
  retryCount: {
    type: Number,
    default: 0
  },
  
  // Metadata
  metadata: {
    deviceType: String,
    platform: String,
    appVersion: String,
    networkType: String, // wifi, cellular, ethernet
    userAgent: String,
    
    // Video-specific metadata (client-side)
    width: Number,
    height: Number,
    duration: Number,
    fps: Number,
    codec: String
  }
}, {
  timestamps: true
});

// Indexes
uploadSessionSchema.index({ userId: 1, status: 1 });
uploadSessionSchema.index({ expiresAt: 1 }, { 
  expireAfterSeconds: 0,
  partialFilterExpression: { status: { $in: ['completed', 'failed', 'cancelled'] } }
});
uploadSessionSchema.index({ lastActivityAt: 1 });

// Pre-save: calculate progress
uploadSessionSchema.pre('save', function(next) {
  if (this.fileSize && this.progress.bytesUploaded) {
    this.progress.percentage = Math.round((this.progress.bytesUploaded / this.fileSize) * 100);
  }
  
  this.progress.chunksCompleted = this.uploadedChunks.length;
  
  // Set expiration (7 days from last activity)
  if (!this.expiresAt || this.status === 'uploading') {
    this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  
  next();
});

// Method: record chunk upload
uploadSessionSchema.methods.recordChunk = async function(chunkNumber, chunkSize, etag) {
  const existingChunk = this.uploadedChunks.find(c => c.chunkNumber === chunkNumber);
  
  if (!existingChunk) {
    this.uploadedChunks.push({
      chunkNumber,
      size: chunkSize,
      etag,
      uploadedAt: new Date()
    });
    
    this.progress.bytesUploaded += chunkSize;
    this.progress.lastChunkAt = new Date();
  }
  
  this.lastActivityAt = new Date();
  this.status = 'uploading';
  
  // Check if upload is complete
  if (this.uploadedChunks.length === this.totalChunks) {
    this.status = 'completed';
    this.completedAt = new Date();
  }
  
  await this.save();
};

// Method: mark as failed
uploadSessionSchema.methods.markAsFailed = async function(error) {
  this.status = 'failed';
  this.lastError = error;
  this.retryCount += 1;
  await this.save();
};

// Method: pause upload
uploadSessionSchema.methods.pause = async function() {
  this.status = 'paused';
  await this.save();
};

// Method: resume upload
uploadSessionSchema.methods.resume = async function() {
  this.status = 'uploading';
  this.lastActivityAt = new Date();
  await this.save();
};

// Method: cancel upload
uploadSessionSchema.methods.cancel = async function() {
  this.status = 'cancelled';
  await this.save();
};

// Method: get missing chunks
uploadSessionSchema.methods.getMissingChunks = function() {
  const uploadedChunkNumbers = this.uploadedChunks.map(c => c.chunkNumber);
  const allChunks = Array.from({ length: this.totalChunks }, (_, i) => i + 1);
  return allChunks.filter(n => !uploadedChunkNumbers.includes(n));
};

// Static: create new session
uploadSessionSchema.statics.createSession = async function(data) {
  const {
    userId,
    fileName,
    fileSize,
    mimeType,
    chunkSize,
    uploadType,
    metadata
  } = data;
  
  const totalChunks = Math.ceil(fileSize / chunkSize);
  const sessionId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const session = new this({
    sessionId,
    userId,
    fileName,
    fileSize,
    mimeType,
    chunkSize,
    totalChunks,
    uploadType,
    metadata,
    startedAt: new Date(),
    status: 'initialized'
  });
  
  await session.save();
  return session;
};

// Static: get active sessions for user
uploadSessionSchema.statics.getActiveSessions = async function(userId) {
  return this.find({
    userId,
    status: { $in: ['initialized', 'uploading', 'paused'] }
  })
    .sort({ lastActivityAt: -1 })
    .lean();
};

// Static: cleanup expired sessions
uploadSessionSchema.statics.cleanupExpired = async function() {
  const expiredSessions = await this.find({
    status: { $in: ['initialized', 'uploading', 'paused'] },
    lastActivityAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  });
  
  for (const session of expiredSessions) {
    session.status = 'expired';
    await session.save();
  }
  
  return expiredSessions.length;
};

const UploadSession = mongoose.model('UploadSession', uploadSessionSchema);

module.exports = UploadSession;
