const express = require('express');
const router = express.Router();
const { verifyFirebaseToken, requireAdmin } = require('../middleware/firebaseAuth');

/**
 * Settings Routes - Firestore Stub
 */

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Settings API is operational (Firestore stub)' });
});

// Get app settings (Admin)
router.get('/', verifyFirebaseToken, requireAdmin, async (req, res) => {
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
router.put('/', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    res.json({ success: true, message: 'Settings updated' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
