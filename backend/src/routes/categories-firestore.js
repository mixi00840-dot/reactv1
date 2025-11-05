const express = require('express');
const router = express.Router();

/**
 * Categories Routes - Firestore Stub
 */

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Categories API is operational (Firestore stub)' });
});

// Get all categories (root endpoint - public)
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        categories: [],
        count: 0
      }
    });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get category by ID
router.get('/:categoryId', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        category: {
          id: req.params.categoryId,
          name: '',
          slug: '',
          description: '',
          products: []
        }
      }
    });
  } catch (error) {
    console.error('Error getting category:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

