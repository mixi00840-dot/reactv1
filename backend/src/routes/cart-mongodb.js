const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { verifyJWT } = require('../middleware/jwtAuth');

/**
 * Cart Routes - MongoDB Implementation
 */

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Cart API is working (MongoDB)',
    database: 'MongoDB'
  });
});

/**
 * @route   GET /api/cart
 * @desc    Get user's cart
 * @access  Private
 */
router.get('/', verifyJWT, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.userId })
      .populate('items.productId', 'name price images stock')
      .populate('items.storeId', 'name logo');

    // Auto-create cart if doesn't exist
    if (!cart) {
      cart = new Cart({ userId: req.userId });
      await cart.save();
    }

    res.json({
      success: true,
      data: { cart }
    });

  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cart'
    });
  }
});

/**
 * @route   POST /api/cart/add
 * @desc    Add item to cart
 * @access  Private
 */
router.post('/add', verifyJWT, async (req, res) => {
  try {
    const { productId, quantity = 1, variant } = req.body;

    let cart = await Cart.findOne({ userId: req.userId });

    if (!cart) {
      cart = new Cart({ userId: req.userId });
    }

    await cart.addItem(productId, quantity, variant);

    // Populate product data
    await cart.populate('items.productId', 'name price images stock');

    res.json({
      success: true,
      data: { cart },
      message: 'Item added to cart'
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding to cart',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/cart/update
 * @desc    Update cart item quantity
 * @access  Private
 */
router.put('/update', verifyJWT, async (req, res) => {
  try {
    const { productId, quantity, variant } = req.body;

    const cart = await Cart.findOne({ userId: req.userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    if (quantity === 0) {
      await cart.removeItem(productId, variant);
    } else {
      await cart.updateQuantity(productId, quantity, variant);
    }

    await cart.populate('items.productId', 'name price images stock');

    res.json({
      success: true,
      data: { cart },
      message: 'Cart updated'
    });

  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating cart',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/cart/remove/:productId
 * @desc    Remove item from cart
 * @access  Private
 */
router.delete('/remove/:productId', verifyJWT, async (req, res) => {
  try {
    const { productId } = req.params;
    const { variant } = req.query;

    const cart = await Cart.findOne({ userId: req.userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    await cart.removeItem(productId, variant ? JSON.parse(variant) : null);

    res.json({
      success: true,
      data: { cart },
      message: 'Item removed from cart'
    });

  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing from cart'
    });
  }
});

/**
 * @route   DELETE /api/cart/clear
 * @desc    Clear entire cart
 * @access  Private
 */
router.delete('/clear', verifyJWT, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.userId });

    if (!cart) {
      return res.json({
        success: true,
        message: 'Cart already empty'
      });
    }

    await cart.clear();

    res.json({
      success: true,
      data: { cart },
      message: 'Cart cleared'
    });

  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing cart'
    });
  }
});

module.exports = router;

