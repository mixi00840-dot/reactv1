const express = require('express');
const router = express.Router();
const { authenticate, adminMiddleware } = require('../middleware/auth');

/**
 * Settings Routes - Firestore Stub
 */

// Get app settings (Admin)
router.get('/', authenticate, adminMiddleware, async (req, res) => {
  try {
    res.json({ 
      success: true, 
      data: {
        appName: 'Mixillo',
        version: '1.0.0',
        maintenanceMode: false,
        features: {
          stories: true,
          livestreaming: true,
          ecommerce: true
        }
      }
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update settings (Admin)
router.put('/', authenticate, adminMiddleware, async (req, res) => {
  try {
    res.json({ success: true, message: 'Settings updated' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
