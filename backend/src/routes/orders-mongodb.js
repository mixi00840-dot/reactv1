const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Wallet = require('../models/Wallet');
const { verifyJWT, requireAdmin } = require('../middleware/jwtAuth');

/**
 * Orders Routes - MongoDB Implementation
 */

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Orders API is working (MongoDB)',
    database: 'MongoDB'
  });
});

/**
 * @route   GET /api/orders
 * @desc    Get user orders
 * @access  Private
 */
router.get('/', verifyJWT, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const userId = req.userId;

    const orders = await Order.getUserOrders(userId, {
      status,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    const total = await Order.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders'
    });
  }
});

/**
 * @route   POST /api/orders
 * @desc    Create order from cart
 * @access  Private
 */
router.post('/', verifyJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const { shippingAddress, paymentMethod, couponCode } = req.body;

    // Get user's cart
    const cart = await Cart.findOne({ userId }).populate('items.productId');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const product = item.productId;
      
      // Check stock
      if (product.trackInventory && product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`
        });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: product._id,
        storeId: product.storeId,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        variant: item.variant,
        image: product.images?.[0]?.url,
        total: itemTotal
      });
    }

    // Calculate tax, shipping, discount
    const tax = subtotal * 0.1; // 10% tax (configurable)
    const shipping = subtotal > 50 ? 0 : 5.99; // Free shipping over $50
    let discount = 0;

    // Apply coupon if provided
    if (couponCode) {
      const Coupon = require('../models/Coupon');
      const coupon = await Coupon.findOne({ 
        code: couponCode.toUpperCase(),
        isActive: true,
        validFrom: { $lte: new Date() },
        validUntil: { $gte: new Date() }
      });

      if (coupon && subtotal >= coupon.minPurchase) {
        if (coupon.type === 'percentage') {
          discount = (subtotal * coupon.value) / 100;
          if (coupon.maxDiscount) {
            discount = Math.min(discount, coupon.maxDiscount);
          }
        } else {
          discount = coupon.value;
        }
        
        // Update coupon usage
        coupon.usageCount += 1;
        await coupon.save();
      }
    }

    const total = subtotal + tax + shipping - discount;

    // Create order
    const order = new Order({
      userId,
      items: orderItems,
      subtotal,
      tax,
      shipping,
      discount,
      total,
      couponCode,
      shippingAddress,
      paymentMethod,
      sellerId: orderItems[0].storeId // Primary seller
    });

    await order.save();

    // Reduce product stock
    for (const item of cart.items) {
      const product = item.productId;
      if (product.trackInventory) {
        await product.reduceStock(item.quantity);
      }
    }

    // Clear cart
    await cart.clear();

    res.status(201).json({
      success: true,
      data: { order },
      message: 'Order created successfully'
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID
 * @access  Private (Order owner or Admin)
 */
router.get('/:id', verifyJWT, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.productId', 'name images')
      .populate('items.storeId', 'name logo');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check ownership
    if (!order.userId.equals(req.userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { order }
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order'
    });
  }
});

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Update order status
 * @access  Private (Seller or Admin)
 */
router.put('/:id/status', verifyJWT, async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check permission (seller or admin)
    if (!order.sellerId?.equals(req.userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await order.updateStatus(status, note, req.userId);

    res.json({
      success: true,
      data: { order },
      message: `Order status updated to ${status}`
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status'
    });
  }
});

module.exports = router;
