const express = require('express');
const router = express.Router();
const {
  getLivestreams,
  getTrending,
  getLivestream,
  createLivestream,
  startLivestream,
  endLivestream,
  joinLivestream,
  leaveLivestream,
  getUserStreams,
  updateLivestream,
  banUser
} = require('../controllers/livestreamController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/', getLivestreams);
router.get('/trending', getTrending);
router.get('/user/:userId', getUserStreams);
router.get('/:streamId', getLivestream);

// Protected routes (require authentication)
router.post('/', protect, createLivestream);
router.post('/:streamId/start', protect, startLivestream);
router.post('/:streamId/end', protect, endLivestream);
router.post('/:streamId/join', protect, joinLivestream);
router.post('/:streamId/leave', protect, leaveLivestream);
router.put('/:streamId', protect, updateLivestream);
router.post('/:streamId/ban/:userId', protect, banUser);

module.exports = router;
