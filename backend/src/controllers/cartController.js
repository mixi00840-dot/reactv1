const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { Coupon } = require('../models/Coupon');
const { validationResult } = require('express-validator');

class CartController {
  // Get user's cart
  async getCart(req, res) {
    try {
      const cart = await Cart.findOne({ 
        userId: req.user._id,
        status: 'active'
      })
        .populate({
          path: 'items.product',
          select: 'name slug images pricing inventory status',
          populate: {
            path: 'storeId',
            select: 'name slug'
          }
        })
        .populate('appliedCoupons.coupon', 'code name discount type');

      if (!cart) {
        // Create empty cart if none exists
        const newCart = new Cart({ userId: req.user._id });
        await newCart.save();
        
        return res.json({
          success: true,
          data: newCart
        });
      }

      // Validate cart items and update if needed
      await cart.validateItems();
      await cart.calculateTotals();

      res.json({
        success: true,
        data: cart
      });
    } catch (error) {
      console.error('Error fetching cart:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching cart',
        error: error.message
      });
    }
  }

  // Add item to cart
  async addToCart(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { productId, quantity = 1, variantId = null, customizations = {} } = req.body;

      // Validate product exists and is available
      const product = await Product.findById(productId);
      if (!product || product.status !== 'active') {
        return res.status(404).json({
          success: false,
          message: 'Product not found or unavailable'
        });
      }

      // Check inventory availability
      const isAvailable = await product.checkAvailability(quantity, variantId);
      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient inventory for this product'
        });
      }

      // Get or create cart
      let cart = await Cart.findOne({ 
        userId: req.user._id,
        status: 'active'
      });

      if (!cart) {
        cart = new Cart({ userId: req.user._id });
      }

      // Add item to cart
      const result = await cart.addItem(productId, quantity, variantId, customizations);

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
        message: 'Item added to cart successfully',
        data: cart
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      res.status(500).json({
        success: false,
        message: 'Error adding item to cart',
        error: error.message
      });
    }
  }

  // Update cart item quantity
  async updateCartItem(req, res) {
    try {
      const { itemId } = req.params;
      const { quantity } = req.body;

      if (!quantity || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be at least 1'
        });
      }

      const cart = await Cart.findOne({ 
        userId: req.user._id,
        status: 'active'
      });

      if (!cart) {
        return res.status(404).json({
          success: false,
          message: 'Cart not found'
        });
      }

      // Update item quantity
      const result = await cart.updateItemQuantity(itemId, quantity);

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
        message: 'Cart item updated successfully',
        data: cart
      });
    } catch (error) {
      console.error('Error updating cart item:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating cart item',
        error: error.message
      });
    }
  }

  // Remove item from cart
  async removeFromCart(req, res) {
    try {
      const { itemId } = req.params;

      const cart = await Cart.findOne({ 
        userId: req.user._id,
        status: 'active'
      });

      if (!cart) {
        return res.status(404).json({
          success: false,
          message: 'Cart not found'
        });
      }

      // Remove item from cart
      const result = await cart.removeItem(itemId);

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
        message: 'Item removed from cart successfully',
        data: cart
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
      res.status(500).json({
        success: false,
        message: 'Error removing item from cart',
        error: error.message
      });
    }
  }

  // Clear entire cart
  async clearCart(req, res) {
    try {
      const cart = await Cart.findOne({ 
        userId: req.user._id,
        status: 'active'
      });

      if (!cart) {
        return res.status(404).json({
          success: false,
          message: 'Cart not found'
        });
      }

      // Clear all items
      await cart.clearCart();

      res.json({
        success: true,
        message: 'Cart cleared successfully',
        data: cart
      });
    } catch (error) {
      console.error('Error clearing cart:', error);
      res.status(500).json({
        success: false,
        message: 'Error clearing cart',
        error: error.message
      });
    }
  }

  // Apply coupon to cart
  async applyCoupon(req, res) {
    try {
      const { couponCode } = req.body;

      if (!couponCode) {
        return res.status(400).json({
          success: false,
          message: 'Coupon code is required'
        });
      }

      const cart = await Cart.findOne({ 
        userId: req.user._id,
        status: 'active'
      }).populate('items.product');

      if (!cart || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cart is empty'
        });
      }

      // Find and validate coupon
      const coupon = await Coupon.findOne({ 
        code: couponCode.toUpperCase(),
        status: 'active'
      });

      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: 'Invalid coupon code'
        });
      }

      // Check if coupon can be used by this user
      const canUse = coupon.canUseBy(req.user._id, {
        total: cart.totals.subtotal,
        quantity: cart.items.reduce((sum, item) => sum + item.quantity, 0),
        isReturningCustomer: false // You can implement this logic
      });

      if (!canUse.valid) {
        return res.status(400).json({
          success: false,
          message: canUse.reason
        });
      }

      // Apply coupon to cart
      const result = await cart.applyCoupon(coupon._id);

      // Populate the updated cart
      await cart.populate([
        {
          path: 'items.product',
          select: 'name slug images pricing inventory status',
          populate: {
            path: 'storeId',
            select: 'name slug'
          }
        },
        {
          path: 'appliedCoupons.coupon',
          select: 'code name discount type'
        }
      ]);

      res.json({
        success: true,
        message: 'Coupon applied successfully',
        data: cart
      });
    } catch (error) {
      console.error('Error applying coupon:', error);
      res.status(500).json({
        success: false,
        message: 'Error applying coupon',
        error: error.message
      });
    }
  }

  // Remove coupon from cart
  async removeCoupon(req, res) {
    try {
      const { couponId } = req.params;

      const cart = await Cart.findOne({ 
        userId: req.user._id,
        status: 'active'
      });

      if (!cart) {
        return res.status(404).json({
          success: false,
          message: 'Cart not found'
        });
      }

      // Remove coupon from cart
      const result = await cart.removeCoupon(couponId);

      // Populate the updated cart
      await cart.populate([
        {
          path: 'items.product',
          select: 'name slug images pricing inventory status',
          populate: {
            path: 'storeId',
            select: 'name slug'
          }
        },
        {
          path: 'appliedCoupons.coupon',
          select: 'code name discount type'
        }
      ]);

      res.json({
        success: true,
        message: 'Coupon removed successfully',
        data: cart
      });
    } catch (error) {
      console.error('Error removing coupon:', error);
      res.status(500).json({
        success: false,
        message: 'Error removing coupon',
        error: error.message
      });
    }
  }

  // Get cart summary for checkout
  async getCartSummary(req, res) {
    try {
      const cart = await Cart.findOne({ 
        userId: req.user._id,
        status: 'active'
      })
        .populate({
          path: 'items.product',
          select: 'name slug images pricing inventory status shippingSettings',
          populate: {
            path: 'storeId',
            select: 'name slug shippingSettings'
          }
        })
        .populate('appliedCoupons.coupon', 'code name discount type');

      if (!cart || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cart is empty'
        });
      }

      // Validate all items are still available
      await cart.validateItems();
      await cart.calculateTotals();

      // Group items by store for checkout
      const storeGroups = cart.items.reduce((groups, item) => {
        const storeId = item.product.storeId._id.toString();
        if (!groups[storeId]) {
          groups[storeId] = {
            store: item.product.storeId,
            items: [],
            subtotal: 0,
            shippingRequired: false
          };
        }
        
        groups[storeId].items.push(item);
        groups[storeId].subtotal += item.totalPrice;
        
        if (!item.product.isDigital) {
          groups[storeId].shippingRequired = true;
        }
        
        return groups;
      }, {});

      // Calculate shipping estimates for each store
      const shippingEstimates = {};
      for (const [storeId, group] of Object.entries(storeGroups)) {
        if (group.shippingRequired) {
          // This would integrate with shipping calculation service
          shippingEstimates[storeId] = {
            methods: [
              { id: 'standard', name: 'Standard Shipping', price: 5.99, days: '5-7' },
              { id: 'express', name: 'Express Shipping', price: 12.99, days: '2-3' }
            ]
          };
        }
      }

      res.json({
        success: true,
        data: {
          cart,
          storeGroups: Object.values(storeGroups),
          shippingEstimates,
          summary: {
            itemCount: cart.items.length,
            totalQuantity: cart.items.reduce((sum, item) => sum + item.quantity, 0),
            subtotal: cart.totals.subtotal,
            discounts: cart.totals.discounts,
            estimatedTotal: cart.totals.total,
            requiresShipping: Object.values(storeGroups).some(g => g.shippingRequired)
          }
        }
      });
    } catch (error) {
      console.error('Error getting cart summary:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting cart summary',
        error: error.message
      });
    }
  }

  // Save cart for later (wishlist-like functionality)
  async saveCartForLater(req, res) {
    try {
      const cart = await Cart.findOne({ 
        userId: req.user._id,
        status: 'active'
      });

      if (!cart || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cart is empty'
        });
      }

      // Change cart status to saved
      cart.status = 'saved';
      cart.savedAt = new Date();
      await cart.save();

      res.json({
        success: true,
        message: 'Cart saved for later',
        data: cart
      });
    } catch (error) {
      console.error('Error saving cart:', error);
      res.status(500).json({
        success: false,
        message: 'Error saving cart',
        error: error.message
      });
    }
  }

  // Get saved carts
  async getSavedCarts(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const savedCarts = await Cart.find({ 
        userId: req.user._id,
        status: 'saved'
      })
        .populate({
          path: 'items.product',
          select: 'name slug images pricing status',
          populate: {
            path: 'storeId',
            select: 'name slug'
          }
        })
        .sort('-savedAt')
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Cart.countDocuments({ 
        userId: req.user._id,
        status: 'saved'
      });

      res.json({
        success: true,
        data: {
          savedCarts,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching saved carts:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching saved carts',
        error: error.message
      });
    }
  }

  // Restore saved cart
  async restoreSavedCart(req, res) {
    try {
      const { cartId } = req.params;

      const savedCart = await Cart.findOne({
        _id: cartId,
        userId: req.user._id,
        status: 'saved'
      });

      if (!savedCart) {
        return res.status(404).json({
          success: false,
          message: 'Saved cart not found'
        });
      }

      // Check if user has an active cart
      let activeCart = await Cart.findOne({ 
        userId: req.user._id,
        status: 'active'
      });

      if (activeCart) {
        // Merge saved cart into active cart
        for (const item of savedCart.items) {
          await activeCart.addItem(
            item.product,
            item.quantity,
            item.variantId,
            item.customizations
          );
        }
        
        // Delete the saved cart
        await Cart.findByIdAndDelete(cartId);
        
        await activeCart.populate({
          path: 'items.product',
          select: 'name slug images pricing inventory status',
          populate: {
            path: 'storeId',
            select: 'name slug'
          }
        });

        res.json({
          success: true,
          message: 'Saved cart merged with active cart',
          data: activeCart
        });
      } else {
        // Restore saved cart as active cart
        savedCart.status = 'active';
        savedCart.savedAt = undefined;
        await savedCart.save();

        await savedCart.populate({
          path: 'items.product',
          select: 'name slug images pricing inventory status',
          populate: {
            path: 'storeId',
            select: 'name slug'
          }
        });

        res.json({
          success: true,
          message: 'Saved cart restored',
          data: savedCart
        });
      }
    } catch (error) {
      console.error('Error restoring saved cart:', error);
      res.status(500).json({
        success: false,
        message: 'Error restoring saved cart',
        error: error.message
      });
    }
  }

  // Get cart abandonment data for analytics
  async getAbandonedCarts(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const { 
        page = 1, 
        limit = 20,
        storeId,
        minValue,
        days = 7
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const cutoffDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

      // Build query for abandoned carts
      const query = {
        status: 'active',
        'items.0': { $exists: true }, // Has items
        lastActivity: { $lt: cutoffDate }
      };

      if (storeId) {
        query['items.product'] = { $in: await Product.find({ storeId }).select('_id') };
      }

      if (minValue) {
        query['totals.total'] = { $gte: parseFloat(minValue) };
      }

      const abandonedCarts = await Cart.find(query)
        .populate('userId', 'firstName lastName email')
        .populate({
          path: 'items.product',
          select: 'name price storeId',
          populate: {
            path: 'storeId',
            select: 'name'
          }
        })
        .sort('-lastActivity')
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Cart.countDocuments(query);

      res.json({
        success: true,
        data: {
          abandonedCarts,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          },
          filters: {
            days: parseInt(days),
            storeId,
            minValue
          }
        }
      });
    } catch (error) {
      console.error('Error fetching abandoned carts:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching abandoned carts',
        error: error.message
      });
    }
  }
}

module.exports = new CartController();
