const express = require('express');
const router = express.Router();
const webrtcController = require('../controllers/webrtcController');
const { authenticate } = require('../middleware/auth');

/**
 * WebRTC Signaling Routes
 */

// Create offer
router.post('/offer', authenticate, webrtcController.createOffer);

// Create answer
router.post('/answer', authenticate, webrtcController.createAnswer);

// Add ICE candidate
router.post('/ice-candidate', authenticate, webrtcController.addICECandidate);

// Start WebRTC stream
router.post('/stream/start', authenticate, webrtcController.startWebRTCStream);

// Join WebRTC stream
router.get('/stream/:streamId/join', authenticate, webrtcController.joinWebRTCStream);

// Setup PK battle WebRTC
router.get('/battle/:battleId/setup', authenticate, webrtcController.setupPKBattle);

// Setup multi-host WebRTC
router.get('/multihost/:sessionId/setup', authenticate, webrtcController.setupMultiHost);

// Adapt stream quality
router.post('/quality/adapt', authenticate, webrtcController.adaptQuality);

// Monitor connection health
router.post('/connection/monitor', authenticate, webrtcController.monitorConnection);

module.exports = router;
