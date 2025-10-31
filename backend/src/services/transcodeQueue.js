const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const TranscodeJob = require('../models/TranscodeJob');
const Content = require('../models/Content');
const videoProcessor = require('./videoProcessor');
const path = require('path');
const os = require('os');

/**
 * TranscodeQueue - BullMQ-based job queue for video processing
 * Manages distributed video transcoding workers
 */

// Redis connection with error handling (optional for development)
const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
  retryStrategy: (times) => {
    // Stop retrying after 3 attempts
    if (times > 3) {
      console.warn('⚠️  Redis unavailable - transcoding queue disabled (install Redis for production)');
      return null;
    }
    return Math.min(times * 200, 1000);
  },
  lazyConnect: true // Don't connect immediately
});

// Handle Redis connection errors gracefully
redisConnection.on('error', (err) => {
  if (err.code === 'ECONNREFUSED') {
    console.warn('⚠️  Redis not running - transcoding features limited. Install Redis for full functionality.');
  } else {
    console.error('Redis error:', err.message);
  }
});

// Create queue (only if Redis is available)
let transcodeQueue = null;
let redisAvailable = false;

try {
  transcodeQueue = new Queue('video-transcode', {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: {
        count: 100, // Keep last 100 completed jobs
        age: 24 * 3600 // Keep for 24 hours
      },
      removeOnFail: {
        count: 500 // Keep last 500 failed jobs
      }
    }
  });
  
  // Test connection
  redisConnection.connect().then(() => {
    redisAvailable = true;
    console.log('✅ Redis connected - transcoding queue active');
  }).catch(() => {
    redisAvailable = false;
    console.warn('⚠️  Redis unavailable - transcoding disabled');
  });
} catch (error) {
  console.warn('⚠️  Failed to create transcode queue:', error.message);
  transcodeQueue = null;
}

/**
 * Add video transcoding job to queue
 */
async function addTranscodeJob(contentId, options = {}) {
  if (!redisAvailable || !transcodeQueue) {
    console.warn('⚠️  Transcode queue unavailable - Redis not connected');
    return { success: false, message: 'Transcode service unavailable' };
  }
  
  try {
    const content = await Content.findById(contentId);
    if (!content) {
      throw new Error('Content not found');
    }
    
    // Create TranscodeJob record
    const transcodeJob = new TranscodeJob({
      contentId,
      userId: content.userId,
      priority: options.priority || 5,
      sourceFile: {
        url: content.media.masterFile.url,
        key: content.media.masterFile.key,
        size: content.media.masterFile.size
      },
      metadata: {
        sourceFormat: content.media.masterFile.mimeType,
        targetFormats: options.formats || ['mp4', 'hls'],
        profiles: options.profiles || ['web', 'mobile']
      }
    });
    
    // Add default tasks
    transcodeJob.addTask('transcode', {
      qualities: options.qualities || ['720p', '480p', '360p']
    });
    transcodeJob.addTask('thumbnail', {
      count: options.thumbnailCount || 5
    });
    transcodeJob.addTask('hls', {
      enabled: options.generateHLS !== false
    });
    transcodeJob.addTask('audio_extract', {
      enabled: options.extractAudio !== false
    });
    transcodeJob.addTask('preview', {
      duration: 3,
      startTime: 0
    });
    
    await transcodeJob.save();
    
    // Add to BullMQ queue
    const job = await transcodeQueue.add(
      'transcode',
      {
        transcodeJobId: transcodeJob._id.toString(),
        contentId: contentId.toString(),
        sourceFile: content.media.masterFile.url,
        options
      },
      {
        priority: 10 - transcodeJob.priority, // BullMQ: lower number = higher priority
        jobId: transcodeJob.jobId
      }
    );
    
    transcodeJob.status = 'queued';
    transcodeJob.queuedAt = new Date();
    await transcodeJob.save();
    
    return {
      transcodeJobId: transcodeJob._id,
      queueJobId: job.id,
      status: 'queued'
    };
    
  } catch (error) {
    console.error('Failed to add transcode job:', error);
    throw error;
  }
}

/**
 * Create worker to process transcode jobs
 */
function createTranscodeWorker(concurrency = 2) {
  if (!redisAvailable || !transcodeQueue) {
    console.warn('⚠️  Cannot create transcode worker - Redis unavailable');
    return null;
  }
  
  const workerId = `worker_${os.hostname()}_${process.pid}`;
  
  const worker = new Worker(
    'video-transcode',
    async (job) => {
      const { transcodeJobId, contentId, sourceFile, options } = job.data;
      
      console.log(`[${workerId}] Processing job ${job.id} for content ${contentId}`);
      
      let transcodeJob = null;
      let content = null;
      
      try {
        // Load models
        transcodeJob = await TranscodeJob.findById(transcodeJobId);
        content = await Content.findById(contentId);
        
        if (!transcodeJob) throw new Error('TranscodeJob not found');
        if (!content) throw new Error('Content not found');
        
        // Start job
        await transcodeJob.start(workerId, os.hostname());
        
        // Get source file path
        const sourceFilePath = path.join(__dirname, '../../', sourceFile);
        
        // Process video with progress tracking
        const results = await videoProcessor.processVideo(
          sourceFilePath,
          contentId,
          {
            qualities: options?.qualities || ['720p', '480p', '360p'],
            generateHLS: options?.generateHLS !== false,
            generateDASH: options?.generateDASH || false,
            thumbnailCount: options?.thumbnailCount || 5,
            extractAudioTrack: options?.extractAudio !== false,
            generatePreview: true,
            onProgress: async (step, percent) => {
              // Update job progress
              await job.updateProgress(percent);
              
              // Update task progress in TranscodeJob
              const taskType = step.includes('transcode') ? 'transcode' : 
                              step.includes('hls') ? 'hls' :
                              step.includes('dash') ? 'dash' :
                              step.includes('thumbnail') ? 'thumbnail' :
                              step.includes('audio') ? 'audio_extract' :
                              step.includes('preview') ? 'preview' : null;
              
              if (taskType) {
                const task = transcodeJob.tasks.find(t => t.type === taskType);
                if (task) {
                  await transcodeJob.updateTaskProgress(task.taskId, percent, 'processing');
                }
              }
              
              transcodeJob.progress.currentStep = step;
              await transcodeJob.save();
            }
          }
        );
        
        // Update TranscodeJob with results
        
        // Add transcoded outputs
        for (const transcode of results.transcodes) {
          const stats = await require('fs').promises.stat(transcode.path);
          transcodeJob.addOutput({
            quality: transcode.quality,
            format: 'mp4',
            url: transcode.path.replace(path.join(__dirname, '../../'), '/'),
            key: path.basename(transcode.path),
            size: stats.size,
            width: transcode.preset.width,
            height: transcode.preset.height,
            bitrate: parseInt(transcode.preset.videoBitrate) * 1000,
            status: 'completed',
            completedAt: new Date()
          });
          
          // Mark transcode task as complete
          const task = transcodeJob.tasks.find(t => t.type === 'transcode');
          if (task) {
            await transcodeJob.completeTask(task.taskId, {
              qualities: results.transcodes.map(t => t.quality)
            });
          }
        }
        
        // Add HLS output
        if (results.hls) {
          transcodeJob.addOutput({
            quality: 'source',
            format: 'hls',
            manifestUrl: results.hls.manifestUrl.replace(path.join(__dirname, '../../'), '/'),
            segmentCount: results.hls.segmentCount,
            segmentDuration: results.hls.segmentDuration,
            status: 'completed',
            completedAt: new Date()
          });
          
          const task = transcodeJob.tasks.find(t => t.type === 'hls');
          if (task) {
            await transcodeJob.completeTask(task.taskId, results.hls);
          }
        }
        
        // Add thumbnails
        for (const thumb of results.thumbnails) {
          const stats = await require('fs').promises.stat(thumb.path);
          transcodeJob.addThumbnail({
            url: thumb.path.replace(path.join(__dirname, '../../'), '/'),
            key: thumb.filename,
            width: thumb.width,
            height: Math.round(thumb.width * (content.media.height / content.media.width)),
            timeOffset: thumb.timeOffset,
            size: stats.size,
            format: 'jpg',
            isDefault: thumb.timeOffset === results.thumbnails[0].timeOffset,
            generatedAt: new Date()
          });
        }
        
        const thumbTask = transcodeJob.tasks.find(t => t.type === 'thumbnail');
        if (thumbTask) {
          await transcodeJob.completeTask(thumbTask.taskId, {
            count: results.thumbnails.length
          });
        }
        
        // Add audio track
        if (results.audio) {
          const stats = await require('fs').promises.stat(results.audio.path);
          transcodeJob.audioTrack = {
            url: results.audio.path.replace(path.join(__dirname, '../../'), '/'),
            key: path.basename(results.audio.path),
            duration: results.audio.duration,
            size: stats.size,
            format: 'mp3',
            codec: results.audio.codec,
            bitrate: results.audio.bitrate,
            sampleRate: results.audio.sampleRate,
            channels: results.audio.channels,
            generatedAt: new Date()
          };
          
          const audioTask = transcodeJob.tasks.find(t => t.type === 'audio_extract');
          if (audioTask) {
            await transcodeJob.completeTask(audioTask.taskId, results.audio);
          }
        }
        
        // Add animated preview
        if (results.preview) {
          const stats = await require('fs').promises.stat(results.preview.path);
          transcodeJob.animatedPreview = {
            url: results.preview.path.replace(path.join(__dirname, '../../'), '/'),
            key: path.basename(results.preview.path),
            duration: results.preview.duration,
            size: stats.size,
            format: 'mp4',
            width: 360,
            height: Math.round(360 * (content.media.height / content.media.width)),
            generatedAt: new Date()
          };
          
          const previewTask = transcodeJob.tasks.find(t => t.type === 'preview');
          if (previewTask) {
            await transcodeJob.completeTask(previewTask.taskId, results.preview);
          }
        }
        
        // Complete job
        await transcodeJob.complete();
        
        // Update Content model with processed media
        content.media.duration = results.metadata.duration;
        content.media.width = results.metadata.video.width;
        content.media.height = results.metadata.video.height;
        content.media.fps = results.metadata.video.fps;
        content.media.codec = results.metadata.video.codec;
        content.media.hasAudio = results.metadata.audio !== null;
        
        // Update thumbnails
        content.media.thumbnails = transcodeJob.thumbnails.map(t => ({
          url: t.url,
          key: t.key,
          width: t.width,
          height: t.height,
          timeOffset: t.timeOffset,
          isDefault: t.isDefault
        }));
        
        // Update versions
        content.media.versions = transcodeJob.outputs.map(o => ({
          quality: o.quality,
          url: o.url,
          key: o.key,
          size: o.size,
          bitrate: o.bitrate,
          width: o.width,
          height: o.height,
          format: o.format,
          hlsManifest: o.format === 'hls' ? o.manifestUrl : undefined,
          dashManifest: o.format === 'dash' ? o.manifestUrl : undefined
        }));
        
        // Update animated preview
        if (transcodeJob.animatedPreview) {
          content.media.animatedPreview = {
            url: transcodeJob.animatedPreview.url,
            key: transcodeJob.animatedPreview.key,
            duration: transcodeJob.animatedPreview.duration,
            size: transcodeJob.animatedPreview.size
          };
        }
        
        // Mark content as ready
        await content.markAsReady();
        
        console.log(`[${workerId}] Job ${job.id} completed successfully`);
        
        return {
          success: true,
          transcodeJobId,
          contentId,
          outputs: transcodeJob.outputs.length,
          thumbnails: transcodeJob.thumbnails.length
        };
        
      } catch (error) {
        console.error(`[${workerId}] Job ${job.id} failed:`, error);
        
        if (transcodeJob) {
          await transcodeJob.fail(error.message);
        }
        
        if (content) {
          await content.markAsFailed(error.message);
        }
        
        throw error;
      }
    },
    {
      connection: redisConnection,
      concurrency,
      limiter: {
        max: 10,        // Max 10 jobs
        duration: 1000  // Per second
      }
    }
  );
  
  // Worker events
  worker.on('completed', (job, result) => {
    console.log(`✅ Job ${job.id} completed:`, result);
  });
  
  worker.on('failed', (job, error) => {
    console.error(`❌ Job ${job.id} failed:`, error.message);
  });
  
  worker.on('progress', (job, progress) => {
    console.log(`⏳ Job ${job.id} progress: ${progress}%`);
  });
  
  worker.on('error', (error) => {
    console.error('Worker error:', error);
  });
  
  return worker;
}

/**
 * Get queue status
 */
async function getQueueStatus() {
  if (!redisAvailable || !transcodeQueue) {
    return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, total: 0, unavailable: true };
  }
  
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    transcodeQueue.getWaitingCount(),
    transcodeQueue.getActiveCount(),
    transcodeQueue.getCompletedCount(),
    transcodeQueue.getFailedCount(),
    transcodeQueue.getDelayedCount()
  ]);
  
  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed
  };
}

/**
 * Clean completed jobs
 */
async function cleanQueue(grace = 3600) {
  if (!redisAvailable || !transcodeQueue) {
    return { success: false, message: 'Queue unavailable' };
  }
  
  await transcodeQueue.clean(grace, 1000, 'completed');
  await transcodeQueue.clean(grace * 24, 1000, 'failed');
  return { success: true };
}

module.exports = {
  transcodeQueue,
  addTranscodeJob,
  createTranscodeWorker,
  getQueueStatus,
  cleanQueue,
  redisConnection
};
