const TranscodeJob = require('../models/TranscodeJob');
const Content = require('../models/Content');
const { getQueueStatus, cleanQueue, addTranscodeJob } = require('../services/transcodeQueue');

/**
 * Transcode Admin Controller
 * Manage video processing jobs and queue
 */

// Get all transcode jobs with filtering
exports.getTranscodeJobs = async (req, res) => {
  try {
    const {
      status,
      userId,
      limit = 20,
      skip = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (userId) query.userId = userId;
    
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const jobs = await TranscodeJob.find(query)
      .sort(sort)
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate('userId', 'username fullName email')
      .populate('contentId', 'type caption status')
      .lean();
    
    const total = await TranscodeJob.countDocuments(query);
    
    res.json({
      success: true,
      data: jobs,
      meta: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > (parseInt(skip) + jobs.length)
      }
    });
    
  } catch (error) {
    console.error('Get transcode jobs error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get single transcode job by ID
exports.getTranscodeJobById = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const job = await TranscodeJob.findById(jobId)
      .populate('userId', 'username fullName email profilePicture')
      .populate('contentId');
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }
    
    res.json({
      success: true,
      data: job
    });
    
  } catch (error) {
    console.error('Get transcode job error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get queue status and statistics
exports.getQueueStatus = async (req, res) => {
  try {
    const queueStatus = await getQueueStatus();
    
    // Get job stats from database
    const stats = await TranscodeJob.getStats(24); // Last 24 hours
    
    res.json({
      success: true,
      data: {
        queue: queueStatus,
        stats
      }
    });
    
  } catch (error) {
    console.error('Get queue status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Retry failed job
exports.retryJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const job = await TranscodeJob.findById(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }
    
    if (job.status !== 'failed') {
      return res.status(400).json({
        success: false,
        error: 'Only failed jobs can be retried'
      });
    }
    
    await job.retry();
    
    // Re-enqueue
    const content = await Content.findById(job.contentId);
    await addTranscodeJob(content._id, {
      qualities: ['720p', '480p', '360p'],
      priority: 7 // Higher priority for retries
    });
    
    res.json({
      success: true,
      message: 'Job retry initiated',
      data: job
    });
    
  } catch (error) {
    console.error('Retry job error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Cancel job
exports.cancelJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const job = await TranscodeJob.findById(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }
    
    if (job.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel completed job'
      });
    }
    
    job.status = 'cancelled';
    await job.save();
    
    res.json({
      success: true,
      message: 'Job cancelled',
      data: job
    });
    
  } catch (error) {
    console.error('Cancel job error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Clean old completed jobs
exports.cleanOldJobs = async (req, res) => {
  try {
    const { daysOld = 30 } = req.query;
    
    const deletedCount = await TranscodeJob.cleanOldJobs(parseInt(daysOld));
    await cleanQueue(3600); // Clean queue cache
    
    res.json({
      success: true,
      message: `Cleaned ${deletedCount} old jobs`,
      data: {
        deletedCount,
        daysOld: parseInt(daysOld)
      }
    });
    
  } catch (error) {
    console.error('Clean old jobs error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get stuck jobs (no heartbeat)
exports.getStuckJobs = async (req, res) => {
  try {
    const stuckJobs = await TranscodeJob.getStuckJobs();
    
    res.json({
      success: true,
      data: stuckJobs,
      meta: {
        count: stuckJobs.length
      }
    });
    
  } catch (error) {
    console.error('Get stuck jobs error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Reset stuck jobs
exports.resetStuckJobs = async (req, res) => {
  try {
    const stuckJobs = await TranscodeJob.getStuckJobs();
    
    let resetCount = 0;
    for (const job of stuckJobs) {
      try {
        await job.retry();
        resetCount++;
      } catch (err) {
        console.error(`Failed to reset job ${job.jobId}:`, err);
      }
    }
    
    res.json({
      success: true,
      message: `Reset ${resetCount} stuck jobs`,
      data: {
        resetCount,
        totalStuck: stuckJobs.length
      }
    });
    
  } catch (error) {
    console.error('Reset stuck jobs error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get processing statistics
exports.getProcessingStats = async (req, res) => {
  try {
    const { timeRange = 24 } = req.query;
    
    const stats = await TranscodeJob.getStats(parseInt(timeRange));
    
    // Additional aggregations
    const avgProcessingTime = await TranscodeJob.aggregate([
      {
        $match: {
          status: 'completed',
          processingTime: { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$processingTime' },
          minTime: { $min: '$processingTime' },
          maxTime: { $max: '$processingTime' }
        }
      }
    ]);
    
    // Success rate
    const completedCount = await TranscodeJob.countDocuments({ status: 'completed' });
    const failedCount = await TranscodeJob.countDocuments({ status: 'failed' });
    const totalProcessed = completedCount + failedCount;
    const successRate = totalProcessed > 0 ? (completedCount / totalProcessed) * 100 : 0;
    
    res.json({
      success: true,
      data: {
        ...stats,
        processingTime: avgProcessingTime[0] || {
          avgTime: 0,
          minTime: 0,
          maxTime: 0
        },
        successRate: successRate.toFixed(2),
        completedCount,
        failedCount
      }
    });
    
  } catch (error) {
    console.error('Get processing stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = exports;
