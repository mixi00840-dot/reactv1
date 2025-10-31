const express = require('express');
const router = express.Router();
const {
  getProviders,
  getProvider,
  createProvider,
  updateProvider,
  deleteProvider,
  checkHealth,
  checkAllHealth,
  getBestProvider,
  getStatistics,
  resetMonthlyUsage
} = require('../controllers/streamProviderController');
const { adminOnly, superAdminOnly } = require('../middleware/auth');

// Statistics and best provider
router.get('/statistics', adminOnly, getStatistics);
router.get('/best', adminOnly, getBestProvider);

// Health checks
router.post('/health-check-all', adminOnly, checkAllHealth);
router.post('/:name/health-check', adminOnly, checkHealth);

// CRUD operations
router.get('/', adminOnly, getProviders);
router.get('/:name', adminOnly, getProvider);
router.post('/', superAdminOnly, createProvider);
router.put('/:name', adminOnly, updateProvider);
router.delete('/:name', superAdminOnly, deleteProvider);

// Usage management
router.post('/:name/reset-usage', superAdminOnly, resetMonthlyUsage);

module.exports = router;
