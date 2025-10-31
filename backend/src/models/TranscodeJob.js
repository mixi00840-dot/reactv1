const mongoose = require('mongoose');

/**
 * TranscodeJob Model - Video transcoding job tracking
 * Manages multi-resolution transcoding, thumbnail generation, HLS/DASH creation
 */
const transcodeJobSchema = new mongoose.Schema({
  jobId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  
  // Content reference
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true,
    index: true
  },
  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Job status
  status: {
    type: String,
    enum: ['pending', 'queued', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  priority: {
    type: Number,
    default: 5, // 1-10, higher = more priority
    min: 1,
    max: 10,
    index: true
  },
  
  // Source file
  sourceFile: {
    url: String,
    key: String,
    size: Number,
    duration: Number,
    width: Number,
    height: Number,
    fps: Number,
    codec: String,
    bitrate: Number,
    format: String
  },
  
  // Processing tasks
  tasks: [{
    taskId: String,
    type: {
      type: String,
      enum: ['transcode', 'thumbnail', 'hls', 'dash', 'audio_extract', 'preview'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'skipped'],
      default: 'pending'
    },
    config: mongoose.Schema.Types.Mixed, // Task-specific config
    output: mongoose.Schema.Types.Mixed, // Task output details
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    startedAt: Date,
    completedAt: Date,
    error: String,
    retryCount: {
      type: Number,
      default: 0
    }
  }],
  
  // Transcode outputs
  outputs: [{
    quality: {
      type: String,
      enum: ['1080p', '720p', '480p', '360p', '240p', 'source']
    },
    format: {
      type: String,
      enum: ['mp4', 'hls', 'dash']
    },
    url: String,
    key: String,
    size: Number,
    bitrate: Number,
    width: Number,
    height: Number,
    duration: Number,
    codec: String,
    container: String,
    
    // HLS/DASH specific
    manifestUrl: String,
    segmentCount: Number,
    segmentDuration: Number,
    
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
      default: 'processing'
    },
    completedAt: Date
  }],
  
  // Thumbnails
  thumbnails: [{
    url: String,
    key: String,
    width: Number,
    height: Number,
    timeOffset: Number, // second in video
    size: Number,
    format: String, // jpg, png
    isDefault: Boolean,
    generatedAt: Date
  }],
  
  // Animated preview
  animatedPreview: {
    url: String,
    key: String,
    duration: Number,
    size: Number,
    format: String, // gif, webp
    width: Number,
    height: Number,
    generatedAt: Date
  },
  
  // Extracted audio
  audioTrack: {
    url: String,
    key: String,
    duration: Number,
    size: Number,
    format: String,
    codec: String,
    bitrate: Number,
    sampleRate: Number,
    channels: Number,
    generatedAt: Date
  },
  
  // Processing progress
  progress: {
    overall: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    currentTask: String,
    currentStep: String,
    
    // Task completion counters
    tasksTotal: {
      type: Number,
      default: 0
    },
    tasksCompleted: {
      type: Number,
      default: 0
    },
    tasksFailed: {
      type: Number,
      default: 0
    }
  },
  
  // Worker information
  worker: {
    workerId: String,
    hostname: String,
    startedAt: Date,
    lastHeartbeat: Date
  },
  
  // Timing
  queuedAt: Date,
  startedAt: Date,
  completedAt: Date,
  
  processingTime: Number, // milliseconds
  
  // Error tracking
  errors: [{
    task: String,
    error: String,
    stack: String,
    timestamp: Date,
    retryable: Boolean
  }],
  
  lastError: String,
  
  retryCount: {
    type: Number,
    default: 0
  },
  
  maxRetries: {
    type: Number,
    default: 3
  },
  
  // Resource usage estimates
  estimatedCost: {
    compute: Number,
    storage: Number,
    bandwidth: Number,
    total: Number
  },
  
  actualCost: {
    compute: Number,
    storage: Number,
    bandwidth: Number,
    total: Number
  },
  
  // Metadata
  metadata: {
    sourceFormat: String,
    targetFormats: [String],
    profiles: [String], // e.g., ['web', 'mobile', 'hls']
    features: [String], // e.g., ['hdr', 'dolby_atmos']
    
    // Client info
    userAgent: String,
    platform: String,
    uploadedFrom: String
  }
}, {
  timestamps: true
});

// Indexes
transcodeJobSchema.index({ status: 1, priority: -1, createdAt: 1 }); // Queue processing
transcodeJobSchema.index({ userId: 1, status: 1 });
transcodeJobSchema.index({ 'worker.workerId': 1, status: 1 });
transcodeJobSchema.index({ createdAt: -1 });

// Pre-save: generate jobId
transcodeJobSchema.pre('save', function(next) {
  if (!this.jobId) {
    this.jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Calculate overall progress
  if (this.tasks.length > 0) {
    this.progress.tasksTotal = this.tasks.length;
    this.progress.tasksCompleted = this.tasks.filter(t => t.status === 'completed').length;
    this.progress.tasksFailed = this.tasks.filter(t => t.status === 'failed').length;
    
    const totalProgress = this.tasks.reduce((sum, task) => sum + task.progress, 0);
    this.progress.overall = Math.round(totalProgress / this.tasks.length);
  }
  
  // Calculate processing time
  if (this.startedAt && this.completedAt) {
    this.processingTime = this.completedAt - this.startedAt;
  }
  
  next();
});

// Method: Add task
transcodeJobSchema.methods.addTask = function(taskType, config = {}) {
  const taskId = `task_${this.tasks.length + 1}_${taskType}`;
  this.tasks.push({
    taskId,
    type: taskType,
    status: 'pending',
    config,
    progress: 0
  });
  return taskId;
};

// Method: Update task progress
transcodeJobSchema.methods.updateTaskProgress = async function(taskId, progress, status) {
  const task = this.tasks.find(t => t.taskId === taskId);
  if (task) {
    task.progress = progress;
    if (status) task.status = status;
    
    if (status === 'processing' && !task.startedAt) {
      task.startedAt = new Date();
    }
    if (status === 'completed' || status === 'failed') {
      task.completedAt = new Date();
    }
    
    this.progress.currentTask = taskId;
    await this.save();
  }
};

// Method: Complete task
transcodeJobSchema.methods.completeTask = async function(taskId, output = {}) {
  const task = this.tasks.find(t => t.taskId === taskId);
  if (task) {
    task.status = 'completed';
    task.progress = 100;
    task.completedAt = new Date();
    task.output = output;
    await this.save();
  }
};

// Method: Fail task
transcodeJobSchema.methods.failTask = async function(taskId, error) {
  const task = this.tasks.find(t => t.taskId === taskId);
  if (task) {
    task.status = 'failed';
    task.error = error;
    task.completedAt = new Date();
    task.retryCount += 1;
    
    this.errors.push({
      task: taskId,
      error: error,
      timestamp: new Date(),
      retryable: task.retryCount < 3
    });
    
    await this.save();
  }
};

// Method: Start job
transcodeJobSchema.methods.start = async function(workerId, hostname) {
  this.status = 'processing';
  this.startedAt = new Date();
  this.worker = {
    workerId,
    hostname,
    startedAt: new Date(),
    lastHeartbeat: new Date()
  };
  await this.save();
};

// Method: Complete job
transcodeJobSchema.methods.complete = async function() {
  this.status = 'completed';
  this.completedAt = new Date();
  this.progress.overall = 100;
  await this.save();
};

// Method: Fail job
transcodeJobSchema.methods.fail = async function(error) {
  this.status = 'failed';
  this.lastError = error;
  this.completedAt = new Date();
  this.retryCount += 1;
  await this.save();
};

// Method: Retry job
transcodeJobSchema.methods.retry = async function() {
  if (this.retryCount >= this.maxRetries) {
    throw new Error('Max retries exceeded');
  }
  
  this.status = 'pending';
  this.retryCount += 1;
  this.lastError = null;
  this.startedAt = null;
  this.completedAt = null;
  
  // Reset failed tasks
  this.tasks.forEach(task => {
    if (task.status === 'failed') {
      task.status = 'pending';
      task.error = null;
      task.progress = 0;
    }
  });
  
  await this.save();
};

// Method: Update heartbeat
transcodeJobSchema.methods.heartbeat = async function() {
  if (this.worker) {
    this.worker.lastHeartbeat = new Date();
    await this.save();
  }
};

// Method: Add output
transcodeJobSchema.methods.addOutput = function(outputData) {
  this.outputs.push(outputData);
};

// Method: Add thumbnail
transcodeJobSchema.methods.addThumbnail = function(thumbnailData) {
  this.thumbnails.push(thumbnailData);
};

// Static: Get next job from queue
transcodeJobSchema.statics.getNextJob = async function() {
  return this.findOneAndUpdate(
    {
      status: 'pending',
      $or: [
        { queuedAt: { $exists: false } },
        { queuedAt: null }
      ]
    },
    {
      status: 'queued',
      queuedAt: new Date()
    },
    {
      sort: { priority: -1, createdAt: 1 },
      new: true
    }
  );
};

// Static: Get stuck jobs (no heartbeat for 5 minutes)
transcodeJobSchema.statics.getStuckJobs = async function() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  return this.find({
    status: 'processing',
    'worker.lastHeartbeat': { $lt: fiveMinutesAgo }
  });
};

// Static: Get job statistics
transcodeJobSchema.statics.getStats = async function(timeRange = 24) {
  const since = new Date(Date.now() - timeRange * 60 * 60 * 1000);
  
  const stats = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: since }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgProcessingTime: { $avg: '$processingTime' },
        totalCost: { $sum: '$actualCost.total' }
      }
    }
  ]);
  
  const totalJobs = await this.countDocuments({ createdAt: { $gte: since } });
  
  return {
    totalJobs,
    byStatus: stats,
    timeRange: `${timeRange}h`
  };
};

// Static: Clean old completed jobs
transcodeJobSchema.statics.cleanOldJobs = async function(daysOld = 30) {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  
  const result = await this.deleteMany({
    status: { $in: ['completed', 'failed'] },
    completedAt: { $lt: cutoffDate }
  });
  
  return result.deletedCount;
};

const TranscodeJob = mongoose.model('TranscodeJob', transcodeJobSchema);

module.exports = TranscodeJob;
