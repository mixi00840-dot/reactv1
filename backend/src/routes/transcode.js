const express = require('express');
const router = express.Router();
const transcodeController = require('../controllers/transcodeController');
const { protect, adminOnly } = require('../middleware/auth');

/**
 * Transcode Management Routes (Admin Only)
 * Monitor and manage video processing jobs
 */

// Queue status and statistics
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
