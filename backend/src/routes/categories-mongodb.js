const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Product = require('../models/Product');
const { verifyJWT, requireAdmin } = require('../middleware/jwtAuth');

/**
 * Categories Routes - MongoDB Implementation
 */

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Categories API is working (MongoDB)',
    database: 'MongoDB'
  });
});

/**
 * @route   GET /api/categories
 * @desc    Get all categories
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { parentId, activeOnly = 'true' } = req.query;

    let query = {};
    if (activeOnly === 'true') query.isActive = true;
    if (parentId) query.parentId = parentId;

    const categories = await Category.find(query)
      .sort({ sortOrder: 1, name: 1 })
      .populate('parentId', 'name slug');

    res.json({
      success: true,
      data: { categories }
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories'
    });
  }
});

/**
 * @route   GET /api/categories/:id
 * @desc    Get category by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parentId', 'name slug');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get product count
    const productsCount = await Product.countDocuments({
      category: category._id,
      status: 'active',
      isPublished: true
    });

    const categoryData = category.toObject();
    categoryData.productsCount = productsCount;

    res.json({
      success: true,
      data: { category: categoryData }
    });

  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category'
    });
  }
});

/**
 * @route   POST /api/categories
 * @desc    Create category
 * @access  Admin
 */
router.post('/', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const categoryData = req.body;

    // Generate slug if not provided
    if (!categoryData.slug) {
      categoryData.slug = categoryData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    const category = new Category(categoryData);
    await category.save();

    res.status(201).json({
      success: true,
      data: { category },
      message: 'Category created successfully'
    });

  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating category',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category
 * @access  Admin
 */
router.put('/:id', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: { category },
      message: 'Category updated successfully'
    });

  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating category'
    });
  }
});

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category
 * @access  Admin
 */
router.delete('/:id', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has products
    const productsCount = await Product.countDocuments({ category: category._id });
    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${productsCount} products`
      });
    }

    await category.deleteOne();

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting category'
    });
  }
});

module.exports = router;

