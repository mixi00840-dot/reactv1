const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');
const { protect } = require('../middleware/auth');

// Public endpoints

// Get player configuration
router.get('/config/:contentId', playerController.getPlayerConfig);

// HLS streaming
router.get('/hls/:contentId/master.m3u8', playerController.getHLSMasterPlaylist);
router.get('/hls/:contentId/:quality/playlist.m3u8', playerController.getHLSVariantPlaylist);
router.get('/hls/:contentId/:quality/:segment', playerController.getHLSSegment);

// DASH streaming
router.get('/dash/:contentId/manifest.mpd', playerController.getDASHManifest);

// Progressive download
router.get('/progressive/:contentId/:quality.mp4', playerController.getProgressiveVideo);

// Quality selection
router.get('/quality/:contentId', playerController.getOptimalQuality);

// Preload segments
router.get('/preload/:contentId', playerController.getPreloadSegments);

// CDN URLs
router.get('/cdn/:contentId', playerController.getCDNUrls);

// Captions
router.get('/captions/:contentId/:language.vtt', playerController.getCaptions);

// Signed URL streaming
router.get('/stream/:contentId', playerController.streamWithToken);

// Protected endpoints (require authentication)

// Get signed URL
router.get('/signed/:contentId', protect, playerController.getSignedUrl);

// Track playback progress
router.post('/progress/:contentId', protect, playerController.trackProgress);

module.exports = router;
