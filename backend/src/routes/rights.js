const express = require('express');
const router = express.Router();
const rightsController = require('../controllers/rightsController');
const { protect, adminOnly } = require('../middleware/auth');

// Scan content for copyright
router.post('/scan/:contentId', protect, rightsController.scanContent);
router.post('/scan/bulk', protect, adminOnly, rightsController.bulkScan);

// Get rights info
router.get('/:contentId', protect, rightsController.getRights);
router.post('/batch/status', protect, rightsController.getBatchStatus);

// Claims management
router.post('/:contentId/claim', protect, adminOnly, rightsController.fileClaim);
router.get('/claims/pending', protect, adminOnly, rightsController.getPendingClaims);

// Disputes
router.post('/:contentId/dispute/:claimId', protect, rightsController.fileDispute);
router.get('/disputes', protect, adminOnly, rightsController.getDisputes);
router.post('/disputes/:disputeId/resolve', protect, adminOnly, rightsController.resolveDispute);

// Royalties
router.post('/:contentId/royalties', protect, adminOnly, rightsController.calculateRoyalties);
router.get('/royalties/report/:rightsHolderId', protect, rightsController.getRoyaltyReport);
router.post('/royalties/payout/:rightsHolderId', protect, adminOnly, rightsController.processPayout);

// License validation
router.post('/validate-license', protect, rightsController.validateLicense);

// Creator summary
router.get('/creator/:creatorId/summary', protect, rightsController.getCreatorSummary);

module.exports = router;
