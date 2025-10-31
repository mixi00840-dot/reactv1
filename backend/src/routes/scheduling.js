const express = require('express');
const router = express.Router();
const schedulingController = require('../controllers/schedulingController');
const { protect, admin } = require('../middleware/auth');

// @route   POST /api/scheduling/schedule
// @desc    Schedule content for publication
// @access  Private
router.post('/schedule', protect, schedulingController.scheduleContent);

// @route   POST /api/scheduling/livestream
// @desc    Schedule a livestream
// @access  Private
router.post('/livestream', protect, schedulingController.scheduleLivestream);

// @route   GET /api/scheduling/my-scheduled
// @desc    Get user's scheduled content
// @access  Private
router.get('/my-scheduled', protect, schedulingController.getScheduledContent);

// @route   GET /api/scheduling/calendar
// @desc    Get scheduling calendar
// @access  Private
router.get('/calendar', protect, schedulingController.getSchedulingCalendar);

// @route   PUT /api/scheduling/:scheduledId
// @desc    Update scheduled content
// @access  Private
router.put('/:scheduledId', protect, schedulingController.updateScheduledContent);

// @route   DELETE /api/scheduling/:scheduledId
// @desc    Cancel scheduled content
// @access  Private
router.delete('/:scheduledId', protect, schedulingController.cancelScheduledContent);

// @route   GET /api/scheduling/all
// @desc    Get all scheduled content (Admin)
// @access  Private/Admin
router.get('/all', protect, admin, schedulingController.getAllScheduledContent);

// @route   POST /api/scheduling/process
// @desc    Process scheduled content (Admin)
// @access  Private/Admin
router.post('/process', protect, admin, schedulingController.processScheduledContent);

module.exports = router;
