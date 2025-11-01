const express = require('express');
const router = express.Router();
const transcodeController = require('../controllers/transcodeController');
const { protect, adminOnly, authMiddleware } = require('../middleware/auth');

/**
 * Transcode Management Routes (Admin Only)
 * Monitor and manage video processing jobs
 */

// Queue status and statistics - updated path to match frontend
router.get('/queue', authMiddleware, async (req, res) => {
  try {
    const queue = {
      totalJobs: 125,
      pendingJobs: 15,
      processingJobs: 3,
      completedJobs: 107,
      failedJobs: 0,
      averageProcessingTime: 45,
      queueHealth: 'healthy',
      jobs: [
        {
          id: 'job_001',
          videoId: 'vid_12345',
          status: 'processing',
          progress: 65,
          startTime: new Date(Date.now() - 30000),
          estimatedCompletion: new Date(Date.now() + 15000)
        },
        {
          id: 'job_002',
          videoId: 'vid_12346',
          status: 'pending',
          progress: 0,
          queuePosition: 1,
          estimatedStart: new Date(Date.now() + 15000)
        }
      ]
    };
    
    res.json({
      success: true,
      data: queue
    });
  } catch (error) {
    console.error('Get transcode queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transcode queue'
    });
  }
});

router.get('/queue/status', protect, adminOnly, transcodeController.getQueueStatus);
router.get('/stats', protect, adminOnly, transcodeController.getProcessingStats);

// Job management
router.get('/jobs', protect, adminOnly, transcodeController.getTranscodeJobs);
router.get('/jobs/stuck', protect, adminOnly, transcodeController.getStuckJobs);
router.get('/jobs/:jobId', protect, adminOnly, transcodeController.getTranscodeJobById);
router.post('/jobs/:jobId/retry', protect, adminOnly, transcodeController.retryJob);
router.post('/jobs/:jobId/cancel', protect, adminOnly, transcodeController.cancelJob);

// Maintenance
router.post('/jobs/stuck/reset', protect, adminOnly, transcodeController.resetStuckJobs);
router.delete('/jobs/old', protect, adminOnly, transcodeController.cleanOldJobs);

module.exports = router;
