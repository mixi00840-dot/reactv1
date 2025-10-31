const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const cartController = require('../controllers/cartController');
const checkoutController = require('../controllers/checkoutController');
const { 
  authMiddleware, 
  customerMiddleware,
  adminMiddleware,
  rateLimitMiddleware
} = require('../middleware/auth');

// Validation rules
const addToCartValidation = [
  body('productId')
    .isMongoId()
    .withMessage('Valid product ID is required'),
  
  body('quantity')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be between 1 and 100'),
  
  body('variantId')
    .optional()
    .isMongoId()
    .withMessage('Valid variant ID required if specified'),
  
  body('customizations')
    .optional()
    .isObject()
    .withMessage('Customizations must be an object')
];

const updateItemValidation = [
  body('quantity')
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be between 1 and 100')
];

const applyCouponValidation = [
  body('couponCode')
    .notEmpty()
    .withMessage('Coupon code is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Coupon code must be between 3 and 50 characters')
];

const checkoutValidation = [
  body('shippingAddress')
    .isObject()
    .withMessage('Shipping address is required'),
  
  body('shippingAddress.street')
    .notEmpty()
    .withMessage('Street address is required'),
  
  body('shippingAddress.city')
    .notEmpty()
    .withMessage('City is required'),
  
  body('shippingAddress.state')
    .notEmpty()
    .withMessage('State is required'),
  
  body('shippingAddress.zipCode')
    .notEmpty()
    .withMessage('ZIP code is required'),
  
  body('shippingAddress.country')
    .notEmpty()
    .withMessage('Country is required'),
  
  body('paymentMethod')
    .isObject()
    .withMessage('Payment method is required'),
  
  body('paymentMethod.type')
    .isIn(['credit_card', 'debit_card', 'paypal', 'wallet'])
    .withMessage('Valid payment method type is required')
];

// All cart routes require authentication
router.use(authMiddleware);
router.use(customerMiddleware);

// GET /api/cart - Get current user's cart
router.get('/',
  cartController.getCart
);

// POST /api/cart/add - Add item to cart
router.post('/add',
  addToCartValidation,
  rateLimitMiddleware(30, 60000), // 30 additions per minute
  cartController.addToCart
);

// PUT /api/cart/items/:itemId - Update cart item quantity
router.put('/items/:itemId',
  updateItemValidation,
  cartController.updateCartItem
);

// DELETE /api/cart/items/:itemId - Remove item from cart
router.delete('/items/:itemId',
  cartController.removeFromCart
);

// DELETE /api/cart/clear - Clear entire cart
router.delete('/clear',
  rateLimitMiddleware(5, 60000), // 5 clear operations per minute
  cartController.clearCart
);

// Coupon management routes

// POST /api/cart/coupons/apply - Apply coupon to cart
router.post('/coupons/apply',
  applyCouponValidation,
  rateLimitMiddleware(10, 60000), // 10 coupon attempts per minute
  cartController.applyCoupon
);

// DELETE /api/cart/coupons/:couponId - Remove coupon from cart
router.delete('/coupons/:couponId',
  cartController.removeCoupon
);

// Checkout preparation routes

// GET /api/cart/summary - Get cart summary for checkout
router.get('/summary',
  cartController.getCartSummary
);

// Checkout routes

// GET /api/cart/checkout/init - Initialize checkout session
router.get('/checkout/init',
  rateLimitMiddleware(20, 3600000), // 20 checkout inits per hour
  checkoutController.initializeCheckout
);

// POST /api/cart/checkout/validate - Validate checkout data
router.post('/checkout/validate',
  checkoutController.validateCheckout
);

// POST /api/cart/checkout/shipping - Calculate shipping rates
router.post('/checkout/shipping',
  body('address')
    .isObject()
    .withMessage('Address is required'),
  body('items')
    .isArray()
    .withMessage('Items array is required'),
  checkoutController.calculateShipping
);

// POST /api/cart/checkout/process - Process checkout and create order
router.post('/checkout/process',
  checkoutValidation,
  rateLimitMiddleware(5, 3600000), // 5 checkout attempts per hour
  checkoutController.processCheckout
);

// Cart persistence routes

// POST /api/cart/save - Save cart for later
router.post('/save',
  rateLimitMiddleware(5, 3600000), // 5 saves per hour
  cartController.saveCartForLater
);

// GET /api/cart/saved - Get saved carts
router.get('/saved',
  cartController.getSavedCarts
);

// POST /api/cart/saved/:cartId/restore - Restore saved cart
router.post('/saved/:cartId/restore',
  cartController.restoreSavedCart
);

// DELETE /api/cart/saved/:cartId - Delete saved cart
router.delete('/saved/:cartId',
  async (req, res) => {
    try {
      const { cartId } = req.params;
      
      const result = await Cart.findOneAndDelete({
        _id: cartId,
        userId: req.user._id,
        status: 'saved'
      });
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Saved cart not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Saved cart deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting saved cart',
        error: error.message
      });
    }
  }
);

// Quick add routes for common operations

// POST /api/cart/quick-add - Quick add multiple items
router.post('/quick-add',
  body('items')
    .isArray({ min: 1, max: 10 })
    .withMessage('Items array is required (max 10 items)'),
  body('items.*.productId')
    .isMongoId()
    .withMessage('Valid product ID is required for each item'),
  body('items.*.quantity')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be between 1 and 100'),
  rateLimitMiddleware(5, 60000), // 5 quick-add operations per minute
  async (req, res) => {
    try {
      const { items } = req.body;
      const Cart = require('../models/Cart');
      
      // Get or create cart
      let cart = await Cart.findOne({ 
        userId: req.user._id,
        status: 'active'
      });

      if (!cart) {
        cart = new Cart({ userId: req.user._id });
      }

      // Add all items
      const results = [];
      for (const item of items) {
        try {
          const result = await cart.addItem(
            item.productId,
            item.quantity || 1,
            item.variantId,
            item.customizations || {}
          );
          results.push({ productId: item.productId, success: true });
        } catch (error) {
          results.push({ 
            productId: item.productId, 
            success: false, 
            error: error.message 
          });
        }
      }

      // Populate the updated cart
      await cart.populate({
        path: 'items.product',
        select: 'name slug images pricing inventory status',
        populate: {
          path: 'storeId',
          select: 'name slug'
        }
      });

      res.json({
        success: true,
        message: 'Items processed',
        data: {
          cart,
          results
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error adding items to cart',
        error: error.message
      });
    }
  }
);

// Admin routes

// GET /api/cart/admin/abandoned - Get abandoned carts (admin only)
router.get('/admin/abandoned',
  adminMiddleware,
  cartController.getAbandonedCarts
);

// GET /api/cart/admin/analytics - Get cart analytics (admin only)
router.get('/admin/analytics',
  adminMiddleware,
  async (req, res) => {
    try {
      const { 
        startDate, 
        endDate,
        storeId 
      } = req.query;

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const Cart = require('../models/Cart');
      
      // Build match query
      const matchQuery = {
        createdAt: { $gte: start, $lte: end }
      };

      if (storeId) {
        const Product = require('../models/Product');
        const storeProducts = await Product.find({ storeId }).select('_id');
        matchQuery['items.product'] = { $in: storeProducts };
      }

      // Aggregate cart analytics
      const analytics = await Cart.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              status: "$status"
            },
            count: { $sum: 1 },
            totalValue: { $sum: "$totals.total" },
            averageValue: { $avg: "$totals.total" },
            totalItems: { $sum: { $size: "$items" } }
          }
        },
        { $sort: { "_id.date": 1 } }
      ]);

      // Calculate conversion rates
      const conversionData = await Cart.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ]);

      const totalCarts = conversionData.reduce((sum, item) => sum + item.count, 0);
      const completedCarts = conversionData.find(item => item._id === 'completed')?.count || 0;
      const conversionRate = totalCarts > 0 ? (completedCarts / totalCarts) * 100 : 0;

      res.json({
        success: true,
        data: {
          analytics,
          conversionData,
          summary: {
            totalCarts,
            completedCarts,
            conversionRate: Math.round(conversionRate * 100) / 100,
            abandonedCarts: totalCarts - completedCarts
          },
          period: {
            startDate: start,
            endDate: end
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching cart analytics',
        error: error.message
      });
    }
  }
);

module.exports = router;