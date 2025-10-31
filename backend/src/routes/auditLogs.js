const express = require('express');
const router = express.Router();
const {
  getAuditLogs,
  getAuditLog,
  getEntityAuditLogs,
  getUserActivity,
  rollbackChange,
  getAuditStats,
  exportAuditLogs
} = require('../controllers/auditLogController');
const { protect, adminOnly, superAdminOnly } = require('../middleware/auth');

// All routes require admin authentication
router.use(protect, adminOnly);

router.get('/', getAuditLogs);
router.get('/stats', getAuditStats);
router.get('/export', exportAuditLogs);
router.get('/user/:userId', getUserActivity);
router.get('/entity/:entityType/:entityId', getEntityAuditLogs);
router.get('/:id', getAuditLog);

// SuperAdmin only
router.post('/:id/rollback', superAdminOnly, rollbackChange);

module.exports = router;
