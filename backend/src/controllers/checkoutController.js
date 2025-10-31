const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { Wallet } = require('../models/Wallet');
const { ShippingRate } = require('../models/Shipping');
const { validationResult } = require('express-validator');

class CheckoutController {
  // Initialize checkout session
  async initializeCheckout(req, res) {
    try {
      const cart = await Cart.findOne({ 
        userId: req.user._id,
        status: 'active'
      })
        .populate({
          path: 'items.product',
          select: 'name slug images pricing inventory status shippingSettings isDigital',
          populate: {
            path: 'storeId',
            select: 'name slug shippingSettings businessInfo'
          }
        })
        .populate('appliedCoupons.coupon');

      if (!cart || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cart is empty'
        });
      }

      // Validate inventory and pricing
      await cart.validateItems();
      await cart.calculateTotals();

      // Get user's saved addresses
      const user = await User.findById(req.user._id);
      const savedAddresses = user.addresses || [];

      // Group items by store
      const storeGroups = cart.items.reduce((groups, item) => {
        const storeId = item.product.storeId._id.toString();
        if (!groups[storeId]) {
          groups[storeId] = {
            store: item.product.storeId,
            items: [],
            subtotal: 0,
            requiresShipping: false,
            estimatedTax: 0
          };
        }
        
        groups[storeId].items.push(item);
        groups[storeId].subtotal += item.totalPrice;
        
        if (!item.product.isDigital) {
          groups[storeId].requiresShipping = true;
        }
        
        return groups;
      }, {});

      // Calculate estimated tax for each store group
      for (const group of Object.values(storeGroups)) {
        // This would integrate with tax calculation service
        group.estimatedTax = group.subtotal * 0.08; // Example 8% tax
      }

      // Get available payment methods
      const availablePaymentMethods = await this.getAvailablePaymentMethods(req.user._id);

      res.json({
        success: true,
        data: {
          cart,
          storeGroups: Object.values(storeGroups),
          savedAddresses,
          availablePaymentMethods,
          totals: {
            subtotal: cart.totals.subtotal,
            discounts: cart.totals.discounts,
            estimatedTax: Object.values(storeGroups).reduce((sum, g) => sum + g.estimatedTax, 0),
            estimatedTotal: cart.totals.total + Object.values(storeGroups).reduce((sum, g) => sum + g.estimatedTax, 0)
          }
        }
      });
    } catch (error) {
      console.error('Error initializing checkout:', error);
      res.status(500).json({
        success: false,
        message: 'Error initializing checkout',
        error: error.message
      });
    }
  }

  // Calculate shipping rates
  async calculateShipping(req, res) {
    try {
      const { address, items } = req.body;

      if (!address || !items || !Array.isArray(items)) {
        return res.status(400).json({
          success: false,
          message: 'Address and items are required'
        });
      }

      const shippingRates = [];

      // Group items by store
      const storeGroups = items.reduce((groups, item) => {
        const storeId = item.storeId;
        if (!groups[storeId]) {
          groups[storeId] = {
            storeId,
            items: [],
            totalWeight: 0,
            totalValue: 0
          };
        }
        
        groups[storeId].items.push(item);
        groups[storeId].totalWeight += (item.weight || 0) * item.quantity;
        groups[storeId].totalValue += item.price * item.quantity;
        
        return groups;
      }, {});

      // Calculate shipping for each store
      for (const [storeId, group] of Object.entries(storeGroups)) {
        try {
          const rates = await ShippingRate.calculateShippingCost(
            storeId,
            address,
            group.totalWeight,
            group.totalValue
          );
          
          shippingRates.push({
            storeId,
            rates
          });
        } catch (error) {
          shippingRates.push({
            storeId,
            error: error.message,
            rates: []
          });
        }
      }

      res.json({
        success: true,
        data: {
          shippingRates,
          address
        }
      });
    } catch (error) {
      console.error('Error calculating shipping:', error);
      res.status(500).json({
        success: false,
        message: 'Error calculating shipping',
        error: error.message
      });
    }
  }

  // Process checkout and create order
  async processCheckout(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const {
        shippingAddress,
        billingAddress,
        paymentMethod,
        shippingMethods, // Object with storeId as key and shipping method as value
        notes
      } = req.body;

      // Get and validate cart
      const cart = await Cart.findOne({ 
        userId: req.user._id,
        status: 'active'
      }).populate([
        {
          path: 'items.product',
          populate: {
            path: 'storeId'
          }
        },
        {
          path: 'appliedCoupons.coupon'
        }
      ]);

      if (!cart || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cart is empty'
        });
      }

      // Final inventory check and reserve stock
      for (const item of cart.items) {
        const product = item.product;
        const available = await product.checkAvailability(item.quantity, item.variantId);
        
        if (!available) {
          return res.status(400).json({
            success: false,
            message: `Insufficient inventory for ${product.name}`
          });
        }

        // Reserve stock
        await product.reserveStock(item.quantity, item.variantId, 'order_processing');
      }

      try {
        // Group items by store to create separate orders
        const storeGroups = cart.items.reduce((groups, item) => {
          const storeId = item.product.storeId._id.toString();
          if (!groups[storeId]) {
            groups[storeId] = {
              store: item.product.storeId,
              items: [],
              subtotal: 0
            };
          }
          
          groups[storeId].items.push(item);
          groups[storeId].subtotal += item.totalPrice;
          
          return groups;
        }, {});

        const createdOrders = [];

        // Create separate order for each store
        for (const [storeId, group] of Object.entries(storeGroups)) {
          const orderData = {
            orderNumber: this.generateOrderNumber(),
            customer: req.user._id,
            storeId: storeId,
            items: group.items.map(item => ({
              product: item.product._id,
              variant: item.variantId,
              quantity: item.quantity,
              price: item.price,
              customizations: item.customizations
            })),
            addresses: {
              shipping: shippingAddress,
              billing: billingAddress || shippingAddress
            },
            payment: {
              method: paymentMethod.type,
              status: 'pending'
            },
            shipping: {
              method: shippingMethods[storeId],
              status: 'pending'
            },
            totals: {
              subtotal: group.subtotal,
              tax: group.subtotal * 0.08, // Calculate actual tax
              shipping: shippingMethods[storeId]?.cost || 0,
              discounts: 0, // Distribute cart discounts proportionally
              finalTotal: 0 // Will be calculated
            },
            notes: notes,
            metadata: {
              cartId: cart._id,
              checkoutAt: new Date()
            }
          };

          // Calculate final total
          orderData.totals.finalTotal = 
            orderData.totals.subtotal + 
            orderData.totals.tax + 
            orderData.totals.shipping - 
            orderData.totals.discounts;

          const order = new Order(orderData);
          await order.save();
          
          createdOrders.push(order);
        }

        // Process payment
        const paymentResult = await this.processPayment(paymentMethod, createdOrders);

        if (!paymentResult.success) {
          // Release reserved stock
          for (const item of cart.items) {
            await item.product.releaseStock(item.quantity, item.variantId, 'payment_failed');
          }

          return res.status(400).json({
            success: false,
            message: 'Payment processing failed',
            error: paymentResult.error
          });
        }

        // Update order payment status
        for (const order of createdOrders) {
          order.payment.status = 'completed';
          order.payment.transactionId = paymentResult.transactionId;
          order.status = 'confirmed';
          await order.save();
        }

        // Mark cart as completed
        cart.status = 'completed';
        cart.completedAt = new Date();
        await cart.save();

        // Mark applied coupons as used
        for (const appliedCoupon of cart.appliedCoupons) {
          await appliedCoupon.coupon.markUsed(
            req.user._id, 
            createdOrders[0]._id, 
            appliedCoupon.discountAmount
          );
        }

        // Convert reserved stock to sold
        for (const item of cart.items) {
          await item.product.decreaseStock(item.quantity, item.variantId, 'sold');
        }

        res.status(201).json({
          success: true,
          message: 'Order(s) created successfully',
          data: {
            orders: createdOrders,
            paymentResult
          }
        });

      } catch (error) {
        // Release reserved stock on error
        for (const item of cart.items) {
          try {
            await item.product.releaseStock(item.quantity, item.variantId, 'checkout_error');
          } catch (releaseError) {
            console.error('Error releasing stock:', releaseError);
          }
        }
        throw error;
      }

    } catch (error) {
      console.error('Error processing checkout:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing checkout',
        error: error.message
      });
    }
  }

  // Validate checkout data
  async validateCheckout(req, res) {
    try {
      const { shippingAddress, paymentMethod } = req.body;

      const validationErrors = [];

      // Validate cart
      const cart = await Cart.findOne({ 
        userId: req.user._id,
        status: 'active'
      }).populate('items.product');

      if (!cart || cart.items.length === 0) {
        validationErrors.push('Cart is empty');
      } else {
        // Check inventory for all items
        for (const item of cart.items) {
          const available = await item.product.checkAvailability(item.quantity, item.variantId);
          if (!available) {
            validationErrors.push(`Insufficient inventory for ${item.product.name}`);
          }
        }
      }

      // Validate shipping address
      if (!shippingAddress) {
        validationErrors.push('Shipping address is required');
      } else {
        const requiredFields = ['street', 'city', 'state', 'zipCode', 'country'];
        for (const field of requiredFields) {
          if (!shippingAddress[field]) {
            validationErrors.push(`Shipping address ${field} is required`);
          }
        }
      }

      // Validate payment method
      if (!paymentMethod) {
        validationErrors.push('Payment method is required');
      } else {
        const isValid = await this.validatePaymentMethod(paymentMethod, req.user._id);
        if (!isValid) {
          validationErrors.push('Invalid payment method');
        }
      }

      res.json({
        success: validationErrors.length === 0,
        valid: validationErrors.length === 0,
        errors: validationErrors,
        data: {
          cartValid: cart && cart.items.length > 0,
          addressValid: shippingAddress && shippingAddress.street,
          paymentValid: paymentMethod && paymentMethod.type
        }
      });
    } catch (error) {
      console.error('Error validating checkout:', error);
      res.status(500).json({
        success: false,
        message: 'Error validating checkout',
        error: error.message
      });
    }
  }

  // Helper methods

  generateOrderNumber() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `ORD-${timestamp.substr(-8)}-${random}`;
  }

  async getAvailablePaymentMethods(userId) {
    const methods = [
      { type: 'credit_card', name: 'Credit Card', enabled: true },
      { type: 'debit_card', name: 'Debit Card', enabled: true },
      { type: 'paypal', name: 'PayPal', enabled: true }
    ];

    // Check if user has wallet balance
    const wallet = await Wallet.findByUser(userId);
    if (wallet && wallet.balance > 0) {
      methods.push({
        type: 'wallet',
        name: 'Wallet Balance',
        enabled: true,
        balance: wallet.balance
      });
    }

    return methods;
  }

  async validatePaymentMethod(paymentMethod, userId) {
    if (!paymentMethod.type) return false;

    switch (paymentMethod.type) {
      case 'credit_card':
      case 'debit_card':
        return paymentMethod.cardToken || paymentMethod.cardDetails;
      
      case 'paypal':
        return paymentMethod.paypalToken || paymentMethod.paypalEmail;
      
      case 'wallet':
        const wallet = await Wallet.findByUser(userId);
        return wallet && wallet.balance >= paymentMethod.amount;
      
      default:
        return false;
    }
  }

  async processPayment(paymentMethod, orders) {
    // This would integrate with actual payment processors
    // For now, we'll simulate payment processing
    
    const totalAmount = orders.reduce((sum, order) => sum + order.totals.finalTotal, 0);

    try {
      switch (paymentMethod.type) {
        case 'wallet':
          return await this.processWalletPayment(paymentMethod, totalAmount);
        
        case 'credit_card':
        case 'debit_card':
          return await this.processCardPayment(paymentMethod, totalAmount);
        
        case 'paypal':
          return await this.processPayPalPayment(paymentMethod, totalAmount);
        
        default:
          return {
            success: false,
            error: 'Unsupported payment method'
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async processWalletPayment(paymentMethod, amount) {
    const wallet = await Wallet.findByUser(paymentMethod.userId);
    
    if (!wallet || wallet.balance < amount) {
      return {
        success: false,
        error: 'Insufficient wallet balance'
      };
    }

    // Debit wallet
    await wallet.debit(amount, 'Order payment', `Order payment`);

    return {
      success: true,
      transactionId: `WAL-${Date.now()}`,
      method: 'wallet',
      amount
    };
  }

  async processCardPayment(paymentMethod, amount) {
    // Simulate card payment processing
    // In real implementation, integrate with Stripe, Square, etc.
    
    return {
      success: true,
      transactionId: `CARD-${Date.now()}`,
      method: 'card',
      amount
    };
  }

  async processPayPalPayment(paymentMethod, amount) {
    // Simulate PayPal payment processing
    // In real implementation, integrate with PayPal API
    
    return {
      success: true,
      transactionId: `PP-${Date.now()}`,
      method: 'paypal',
      amount
    };
  }
}

module.exports = new CheckoutController();
