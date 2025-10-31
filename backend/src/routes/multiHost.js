const express = require('express');
const router = express.Router();
const multiHostController = require('../controllers/multiHostController');
const { authenticate } = require('../middleware/auth');

/**
 * Multi-Host Session Routes
 */

// Create session
router.post('/', authenticate, multiHostController.createSession);

// Start session
router.post('/:sessionId/start', authenticate, multiHostController.startSession);

// Invite user
router.post('/:sessionId/invite', authenticate, multiHostController.inviteUser);

// Accept invitation
router.post('/:sessionId/accept', authenticate, multiHostController.acceptInvitation);

// Request to join
router.post('/:sessionId/request', authenticate, multiHostController.requestToJoin);

// Approve join request
router.post('/:sessionId/approve', authenticate, multiHostController.approveRequest);

// Remove host
router.delete('/:sessionId/hosts/:userId', authenticate, multiHostController.removeHost);

// Update host settings
router.put('/:sessionId/settings', authenticate, multiHostController.updateSettings);

// Change layout
router.put('/:sessionId/layout', authenticate, multiHostController.changeLayout);

// End session
router.post('/:sessionId/end', authenticate, multiHostController.endSession);

// Get session details
router.get('/:sessionId', authenticate, multiHostController.getSession);

// Get active sessions
router.get('/active/list', authenticate, multiHostController.getActiveSessions);

// Get user's sessions
router.get('/user/:userId', authenticate, multiHostController.getUserSessions);

module.exports = router;
