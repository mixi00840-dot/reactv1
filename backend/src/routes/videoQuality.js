const express = require('express');
const router = express.Router();
const videoQualityController = require('../controllers/videoQualityController');
const { protect, admin } = require('../middleware/auth');

// @route   POST /api/video-quality/transcode
// @desc    Start video transcoding
// @access  Private/Admin
router.post('/transcode', protect, admin, videoQualityController.transcodeVideo);

// @route   GET /api/video-quality/:contentId/qualities
// @desc    Get available video qualities
// @access  Public
router.get('/:contentId/qualities', videoQualityController.getVideoQualities);

// @route   GET /api/video-quality/:contentId/playlist
// @desc    Get HLS playlist
// @access  Public
router.get('/:contentId/playlist', videoQualityController.getHLSPlaylist);

// @route   GET /api/video-quality/:contentId/status
// @desc    Get transcoding status
// @access  Private
router.get('/:contentId/status', protect, videoQualityController.getTranscodingStatus);

// @route   POST /api/video-quality/:qualityId/retry
// @desc    Retry failed transcoding
// @access  Private/Admin
router.post('/:qualityId/retry', protect, admin, videoQualityController.retryTranscoding);

// @route   DELETE /api/video-quality/:qualityId
// @desc    Delete video quality
// @access  Private/Admin
router.delete('/:qualityId', protect, admin, videoQualityController.deleteQuality);

// @route   GET /api/video-quality/jobs
// @desc    Get all transcoding jobs
// @access  Private/Admin
router.get('/jobs/all', protect, admin, videoQualityController.getAllTranscodingJobs);

module.exports = router;
