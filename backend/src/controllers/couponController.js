const { Coupon } = require('../models/Coupon');
const Product = require('../models/Product');
const { Category } = require('../models/Category');
const Store = require('../models/Store');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

class CouponController {
  // Get all coupons with filtering
  async getCoupons(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        sort = '-createdAt',
        status,
        type,
        storeId,
        search,
        startDate,
        endDate,
        includeExpired = false
      } = req.query;

      // Build query based on user role
      let query = {};
      
      if (req.user.role === 'seller') {
        // Sellers can only see their store coupons
        const store = await Store.findOne({ ownerId: req.user._id });
        if (!store) {
          return res.status(404).json({
            success: false,
            message: 'Store not found'
          });
        }
        query.storeId = store._id;
      } else if (req.user.role === 'customer') {
        // Customers can only see active, public coupons
        query.status = 'active';
        query.isPublic = true;
        
        // Only show non-expired coupons unless specifically requested
        if (!includeExpired) {
          query.$or = [
            { 'validity.endDate': { $gte: new Date() } },
            { 'validity.endDate': null }
          ];
        }
      }
      // Admins can see all coupons (no additional restrictions)

      // Apply filters
      if (status) {
        query.status = status;
      }

      if (type) {
        query.type = type;
      }

      if (storeId && req.user.role === 'admin') {
        query.storeId = storeId;
      }

      if (search) {
        query.$or = [
          { code: new RegExp(search, 'i') },
          { name: new RegExp(search, 'i') },
          { description: new RegExp(search, 'i') }
        ];
      }

      // Date range filter
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Execute query
      const coupons = await Coupon.find(query)
        .populate('storeId', 'name slug')
        .populate('conditions.applicableProducts', 'name images pricing.basePrice')
        .populate('conditions.applicableCategories', 'name')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      // Get total count
      const total = await Coupon.countDocuments(query);
      const totalPages = Math.ceil(total / parseInt(limit));

      // Add computed fields
      const enhancedCoupons = coupons.map(coupon => ({
        ...coupon,
        isExpired: coupon.validity?.endDate ? new Date(coupon.validity.endDate) < new Date() : false,
        isActive: coupon.status === 'active' && 
                 (!coupon.validity?.endDate || new Date(coupon.validity.endDate) >= new Date()) &&
                 (!coupon.validity?.startDate || new Date(coupon.validity.startDate) <= new Date()),
        usagePercentage: coupon.usage?.limit ? (coupon.usage.used / coupon.usage.limit) * 100 : 0
      }));

      res.json({
        success: true,
        data: {
          coupons: enhancedCoupons,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: total,
            itemsPerPage: parseInt(limit),
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1
          }
        }
      });

    } catch (error) {
      console.error('Error fetching coupons:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching coupons',
        error: error.message
      });
    }
  }

  // Get single coupon
  async getCoupon(req, res) {
    try {
      const { id } = req.params;
      
      let query = { _id: id };
      
      // Apply role-based restrictions
      if (req.user.role === 'seller') {
        const store = await Store.findOne({ ownerId: req.user._id });
        if (!store) {
          return res.status(404).json({
            success: false,
            message: 'Store not found'
          });
        }
        query.storeId = store._id;
      } else if (req.user.role === 'customer') {
        query.status = 'active';
        query.isPublic = true;
      }

      const coupon = await Coupon.findOne(query)
        .populate('storeId', 'name slug businessInfo')
        .populate('conditions.applicableProducts', 'name images pricing')
        .populate('conditions.applicableCategories', 'name description')
        .populate('createdBy', 'firstName lastName')
        .populate('usage.usedBy.user', 'firstName lastName email');

      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: 'Coupon not found'
        });
      }

      // Add computed fields
      const enhancedCoupon = {
        ...coupon.toObject(),
        isExpired: coupon.validity?.endDate ? new Date(coupon.validity.endDate) < new Date() : false,
        isActive: coupon.status === 'active' && 
                 (!coupon.validity?.endDate || new Date(coupon.validity.endDate) >= new Date()) &&
                 (!coupon.validity?.startDate || new Date(coupon.validity.startDate) <= new Date()),
        usagePercentage: coupon.usage?.limit ? (coupon.usage.used / coupon.usage.limit) * 100 : 0,
        remainingUses: coupon.usage?.limit ? Math.max(0, coupon.usage.limit - coupon.usage.used) : null
      };

      res.json({
        success: true,
        data: enhancedCoupon
      });

    } catch (error) {
      console.error('Error fetching coupon:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching coupon',
        error: error.message
      });
    }
  }

  // Create new coupon
  async createCoupon(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const couponData = { ...req.body };

      // Set store ID for sellers
      if (req.user.role === 'seller') {
        const store = await Store.findOne({ ownerId: req.user._id });
        if (!store) {
          return res.status(404).json({
            success: false,
            message: 'Store not found'
          });
        }
        couponData.storeId = store._id;
      }

      // Check if coupon code already exists
      const existingCoupon = await Coupon.findOne({ 
        code: couponData.code.toUpperCase() 
      });

      if (existingCoupon) {
        return res.status(400).json({
          success: false,
          message: 'Coupon code already exists'
        });
      }

      // Validate coupon configuration
      const validationResult = await this.validateCouponConfig(couponData);
      if (!validationResult.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid coupon configuration',
          errors: validationResult.errors
        });
      }

      // Set creator
      couponData.createdBy = req.user._id;

      // Create coupon
      const coupon = new Coupon(couponData);
      await coupon.save();

      // Populate references
      await coupon.populate([
        { path: 'storeId', select: 'name slug' },
        { path: 'conditions.applicableProducts', select: 'name images pricing.basePrice' },
        { path: 'conditions.applicableCategories', select: 'name' },
        { path: 'createdBy', select: 'firstName lastName' }
      ]);

      res.status(201).json({
        success: true,
        message: 'Coupon created successfully',
        data: coupon
      });

    } catch (error) {
      console.error('Error creating coupon:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating coupon',
        error: error.message
      });
    }
  }

  // Update coupon
  async updateCoupon(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Find coupon with role-based restrictions
      let query = { _id: id };
      
      if (req.user.role === 'seller') {
        const store = await Store.findOne({ ownerId: req.user._id });
        if (!store) {
          return res.status(404).json({
            success: false,
            message: 'Store not found'
          });
        }
        query.storeId = store._id;
      }

      const coupon = await Coupon.findOne(query);
      
      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: 'Coupon not found'
        });
      }

      // Prevent updating used coupons in certain ways
      if (coupon.usage.used > 0 && (updates.code || updates.type || updates.discount)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot modify core properties of a coupon that has been used'
        });
      }

      // Validate updated configuration
      const mergedData = { ...coupon.toObject(), ...updates };
      const validationResult = await this.validateCouponConfig(mergedData);
      if (!validationResult.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid coupon configuration',
          errors: validationResult.errors
        });
      }

      // Update coupon
      Object.assign(coupon, updates);
      coupon.updatedBy = req.user._id;
      await coupon.save();

      // Populate references
      await coupon.populate([
        { path: 'storeId', select: 'name slug' },
        { path: 'conditions.applicableProducts', select: 'name images pricing.basePrice' },
        { path: 'conditions.applicableCategories', select: 'name' },
        { path: 'createdBy', select: 'firstName lastName' },
        { path: 'updatedBy', select: 'firstName lastName' }
      ]);

      res.json({
        success: true,
        message: 'Coupon updated successfully',
        data: coupon
      });

    } catch (error) {
      console.error('Error updating coupon:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating coupon',
        error: error.message
      });
    }
  }

  // Delete coupon
  async deleteCoupon(req, res) {
    try {
      const { id } = req.params;
      
      let query = { _id: id };
      
      if (req.user.role === 'seller') {
        const store = await Store.findOne({ ownerId: req.user._id });
        if (!store) {
          return res.status(404).json({
            success: false,
            message: 'Store not found'
          });
        }
        query.storeId = store._id;
      }

      const coupon = await Coupon.findOne(query);
      
      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: 'Coupon not found'
        });
      }

      // Check if coupon has been used
      if (coupon.usage.used > 0) {
        // Don't delete, just deactivate
        coupon.status = 'inactive';
        coupon.deletedAt = new Date();
        coupon.deletedBy = req.user._id;
        await coupon.save();

        return res.json({
          success: true,
          message: 'Coupon deactivated (has usage history)'
        });
      }

      // Actually delete if never used
      await Coupon.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Coupon deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting coupon:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting coupon',
        error: error.message
      });
    }
  }

  // Apply coupon to cart
  async applyCoupon(req, res) {
    try {
      const { code, cartId } = req.body;

      // Find the coupon
      const coupon = await Coupon.findOne({ 
        code: code.toUpperCase(),
        status: 'active'
      })
      .populate('conditions.applicableProducts')
      .populate('conditions.applicableCategories')
      .populate('storeId');

      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: 'Invalid or inactive coupon code'
        });
      }

      // Get cart
      const cart = await Cart.findById(cartId)
        .populate('items.product');

      if (!cart || cart.userId.toString() !== req.user._id.toString()) {
        return res.status(404).json({
          success: false,
          message: 'Cart not found'
        });
      }

      // Validate coupon eligibility
      const eligibilityResult = await this.validateCouponEligibility(coupon, cart, req.user);
      
      if (!eligibilityResult.isEligible) {
        return res.status(400).json({
          success: false,
          message: eligibilityResult.reason
        });
      }

      // Calculate discount
      const discountResult = await this.calculateDiscount(coupon, cart);

      if (discountResult.amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'This coupon provides no discount for your cart'
        });
      }

      // Apply coupon to cart
      cart.appliedCoupons = cart.appliedCoupons || [];
      
      // Remove existing coupon with same code
      cart.appliedCoupons = cart.appliedCoupons.filter(
        applied => applied.code !== coupon.code
      );

      // Add new coupon
      cart.appliedCoupons.push({
        couponId: coupon._id,
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        discountAmount: discountResult.amount,
        appliedAt: new Date(),
        appliedItems: discountResult.appliedItems || []
      });

      // Recalculate cart totals
      await cart.calculateTotals();
      await cart.save();

      res.json({
        success: true,
        message: 'Coupon applied successfully',
        data: {
          coupon: {
            code: coupon.code,
            name: coupon.name,
            discountAmount: discountResult.amount
          },
          cart: cart
        }
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
      const { code, cartId } = req.body;

      const cart = await Cart.findById(cartId);

      if (!cart || cart.userId.toString() !== req.user._id.toString()) {
        return res.status(404).json({
          success: false,
          message: 'Cart not found'
        });
      }

      // Remove coupon
      const initialLength = cart.appliedCoupons?.length || 0;
      cart.appliedCoupons = (cart.appliedCoupons || []).filter(
        applied => applied.code !== code.toUpperCase()
      );

      if (cart.appliedCoupons.length === initialLength) {
        return res.status(404).json({
          success: false,
          message: 'Coupon not found in cart'
        });
      }

      // Recalculate cart totals
      await cart.calculateTotals();
      await cart.save();

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

  // Validate coupon for customer
  async validateCoupon(req, res) {
    try {
      const { code } = req.params;
      const { cartId } = req.query;

      const coupon = await Coupon.findOne({ 
        code: code.toUpperCase(),
        status: 'active'
      })
      .populate('conditions.applicableProducts', 'name pricing')
      .populate('conditions.applicableCategories', 'name')
      .populate('storeId', 'name');

      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: 'Coupon not found'
        });
      }

      let eligibilityResult = { isEligible: true, reason: null };
      let discountResult = { amount: 0, appliedItems: [] };

      // If cart provided, validate against cart
      if (cartId) {
        const cart = await Cart.findById(cartId)
          .populate('items.product');

        if (cart && cart.userId.toString() === req.user._id.toString()) {
          eligibilityResult = await this.validateCouponEligibility(coupon, cart, req.user);
          
          if (eligibilityResult.isEligible) {
            discountResult = await this.calculateDiscount(coupon, cart);
          }
        }
      }

      res.json({
        success: true,
        data: {
          coupon: {
            code: coupon.code,
            name: coupon.name,
            description: coupon.description,
            type: coupon.type,
            discount: coupon.discount,
            conditions: coupon.conditions,
            isEligible: eligibilityResult.isEligible,
            reason: eligibilityResult.reason,
            estimatedDiscount: discountResult.amount
          }
        }
      });

    } catch (error) {
      console.error('Error validating coupon:', error);
      res.status(500).json({
        success: false,
        message: 'Error validating coupon',
        error: error.message
      });
    }
  }

  // Get coupon analytics
  async getCouponAnalytics(req, res) {
    try {
      const {
        startDate,
        endDate,
        storeId,
        granularity = 'day'
      } = req.query;

      // Build match query based on user role
      let matchQuery = {};
      
      if (req.user.role === 'seller') {
        const store = await Store.findOne({ ownerId: req.user._id });
        if (!store) {
          return res.status(404).json({
            success: false,
            message: 'Store not found'
          });
        }
        matchQuery.storeId = store._id;
      } else if (req.user.role === 'admin') {
        // Admin can filter by storeId or see all coupons
        if (storeId) {
          matchQuery.storeId = mongoose.Types.ObjectId(storeId);
        }
        // If no storeId, matchQuery remains empty to get all coupons
      }

      // Date range
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      // Get coupon usage analytics
      const usageAnalytics = await Coupon.aggregate([
        { $match: matchQuery },
        {
          $project: {
            code: 1,
            name: 1,
            type: 1,
            'usage.used': 1,
            'usage.limit': 1,
            'analytics.totalSavings': 1,
            'analytics.totalOrders': 1,
            'analytics.averageOrderValue': 1,
            createdAt: 1,
            status: 1
          }
        },
        {
          $addFields: {
            usageRate: {
              $cond: [
                { $gt: ['$usage.limit', 0] },
                { $divide: ['$usage.used', '$usage.limit'] },
                0
              ]
            }
          }
        },
        { $sort: { 'usage.used': -1 } }
      ]);

      // Top performing coupons
      const topCoupons = await Coupon.aggregate([
        { $match: matchQuery },
        {
          $project: {
            code: 1,
            name: 1,
            'analytics.totalSavings': 1,
            'analytics.totalOrders': 1,
            'usage.used': 1
          }
        },
        { $sort: { 'analytics.totalOrders': -1 } },
        { $limit: 10 }
      ]);

      // Coupon type distribution
      const typeDistribution = await Coupon.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            totalUsage: { $sum: '$usage.used' },
            totalSavings: { $sum: '$analytics.totalSavings' }
          }
        }
      ]);

      // Status distribution
      const statusDistribution = await Coupon.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      // Calculate summary metrics with safe defaults
      const totalCoupons = Array.isArray(usageAnalytics) ? usageAnalytics.length : 0;
      const activeCoupons = Array.isArray(usageAnalytics) ? usageAnalytics.filter(c => c.status === 'active').length : 0;
      const totalUsage = Array.isArray(usageAnalytics) ? usageAnalytics.reduce((sum, c) => sum + (c.usage?.used || 0), 0) : 0;
      const totalSavings = Array.isArray(usageAnalytics) ? usageAnalytics.reduce((sum, c) => sum + (c.analytics?.totalSavings || 0), 0) : 0;

      res.json({
        success: true,
        data: {
          summary: {
            totalCoupons,
            activeCoupons,
            totalUsage,
            totalSavings: Math.round(totalSavings * 100) / 100
          },
          usageAnalytics: usageAnalytics || [],
          topCoupons: topCoupons || [],
          typeDistribution: typeDistribution || [],
          statusDistribution: statusDistribution || [],
          period: {
            startDate: start,
            endDate: end
          }
        }
      });

    } catch (error) {
      console.error('Error fetching coupon analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching coupon analytics',
        error: error.message
      });
    }
  }

  // Generate coupon codes
  async generateCouponCodes(req, res) {
    try {
      const {
        count = 1,
        prefix = '',
        length = 8,
        pattern = 'ALPHANUMERIC' // ALPHABETIC, NUMERIC, ALPHANUMERIC
      } = req.body;

      if (count > 100) {
        return res.status(400).json({
          success: false,
          message: 'Cannot generate more than 100 codes at once'
        });
      }

      const codes = [];
      const maxAttempts = count * 10; // Prevent infinite loops
      let attempts = 0;

      while (codes.length < count && attempts < maxAttempts) {
        const code = this.generateRandomCode(prefix, length, pattern);
        
        // Check if code already exists
        const existingCoupon = await Coupon.findOne({ code });
        
        if (!existingCoupon && !codes.includes(code)) {
          codes.push(code);
        }
        
        attempts++;
      }

      if (codes.length < count) {
        return res.status(400).json({
          success: false,
          message: 'Could not generate enough unique codes. Try different parameters.'
        });
      }

      res.json({
        success: true,
        data: {
          codes,
          generated: codes.length,
          requested: count
        }
      });

    } catch (error) {
      console.error('Error generating coupon codes:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating coupon codes',
        error: error.message
      });
    }
  }

  // Helper methods

  async validateCouponConfig(couponData) {
    const errors = [];

    // Validate discount configuration
    if (couponData.type === 'percentage') {
      if (!couponData.discount?.value || couponData.discount.value <= 0 || couponData.discount.value > 100) {
        errors.push('Percentage discount must be between 1-100');
      }
    } else if (couponData.type === 'fixed_amount') {
      if (!couponData.discount?.value || couponData.discount.value <= 0) {
        errors.push('Fixed amount discount must be greater than 0');
      }
    } else if (couponData.type === 'buy_x_get_y') {
      if (!couponData.discount?.buyQuantity || !couponData.discount?.getQuantity) {
        errors.push('Buy X Get Y requires both buy and get quantities');
      }
    }

    // Validate date ranges
    if (couponData.validity?.startDate && couponData.validity?.endDate) {
      if (new Date(couponData.validity.startDate) >= new Date(couponData.validity.endDate)) {
        errors.push('Start date must be before end date');
      }
    }

    // Validate usage limits
    if (couponData.usage?.perUser && couponData.usage.perUser <= 0) {
      errors.push('Per user limit must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async validateCouponEligibility(coupon, cart, user) {
    // Check if coupon is active
    if (coupon.status !== 'active') {
      return { isEligible: false, reason: 'Coupon is not active' };
    }

    // Check date validity
    const now = new Date();
    if (coupon.validity?.startDate && new Date(coupon.validity.startDate) > now) {
      return { isEligible: false, reason: 'Coupon is not yet valid' };
    }
    if (coupon.validity?.endDate && new Date(coupon.validity.endDate) < now) {
      return { isEligible: false, reason: 'Coupon has expired' };
    }

    // Check usage limits
    if (coupon.usage?.limit && coupon.usage.used >= coupon.usage.limit) {
      return { isEligible: false, reason: 'Coupon usage limit reached' };
    }

    // Check per-user usage limit
    if (coupon.usage?.perUser) {
      const userUsage = coupon.usage.usedBy?.filter(
        usage => usage.user.toString() === user._id.toString()
      ).length || 0;

      if (userUsage >= coupon.usage.perUser) {
        return { isEligible: false, reason: 'You have reached the usage limit for this coupon' };
      }
    }

    // Check minimum order amount
    if (coupon.conditions?.minOrderAmount && cart.totals.subtotal < coupon.conditions.minOrderAmount) {
      return { 
        isEligible: false, 
        reason: `Minimum order amount is $${coupon.conditions.minOrderAmount}` 
      };
    }

    // Check minimum order quantity
    if (coupon.conditions?.minOrderQuantity) {
      const totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      if (totalQuantity < coupon.conditions.minOrderQuantity) {
        return { 
          isEligible: false, 
          reason: `Minimum order quantity is ${coupon.conditions.minOrderQuantity} items` 
        };
      }
    }

    // Check store-specific restrictions
    if (coupon.storeId && cart.storeId && coupon.storeId.toString() !== cart.storeId.toString()) {
      return { isEligible: false, reason: 'Coupon is not valid for items from this store' };
    }

    // Check customer eligibility
    if (coupon.conditions?.eligibleUsers?.length > 0) {
      const isEligible = coupon.conditions.eligibleUsers.some(
        userId => userId.toString() === user._id.toString()
      );
      if (!isEligible) {
        return { isEligible: false, reason: 'You are not eligible for this coupon' };
      }
    }

    // Check excluded users
    if (coupon.conditions?.excludedUsers?.length > 0) {
      const isExcluded = coupon.conditions.excludedUsers.some(
        userId => userId.toString() === user._id.toString()
      );
      if (isExcluded) {
        return { isEligible: false, reason: 'You are not eligible for this coupon' };
      }
    }

    return { isEligible: true, reason: null };
  }

  async calculateDiscount(coupon, cart) {
    let discountAmount = 0;
    let appliedItems = [];

    switch (coupon.type) {
      case 'percentage':
        if (coupon.discount.applyTo === 'order_total') {
          discountAmount = (cart.totals.subtotal * coupon.discount.value) / 100;
          if (coupon.discount.maxDiscountAmount) {
            discountAmount = Math.min(discountAmount, coupon.discount.maxDiscountAmount);
          }
        } else if (coupon.discount.applyTo === 'specific_products') {
          // Apply to specific products only
          const applicableItems = cart.items.filter(item =>
            coupon.conditions.applicableProducts?.some(
              productId => productId.toString() === item.product._id.toString()
            )
          );
          
          const applicableTotal = applicableItems.reduce(
            (sum, item) => sum + (item.price * item.quantity), 0
          );
          
          discountAmount = (applicableTotal * coupon.discount.value) / 100;
          appliedItems = applicableItems.map(item => ({
            productId: item.product._id,
            quantity: item.quantity,
            discountAmount: (item.price * item.quantity * coupon.discount.value) / 100
          }));
        }
        break;

      case 'fixed_amount':
        discountAmount = Math.min(coupon.discount.value, cart.totals.subtotal);
        break;

      case 'free_shipping':
        discountAmount = cart.totals.shipping || 0;
        break;

      case 'buy_x_get_y':
        // Find eligible items and calculate discount
        const eligibleItems = cart.items.filter(item => {
          if (coupon.conditions.applicableProducts?.length > 0) {
            return coupon.conditions.applicableProducts.some(
              productId => productId.toString() === item.product._id.toString()
            );
          }
          return true;
        });

        const buyQuantity = coupon.discount.buyQuantity;
        const getQuantity = coupon.discount.getQuantity;
        
        for (const item of eligibleItems) {
          const sets = Math.floor(item.quantity / buyQuantity);
          const freeItems = Math.min(sets * getQuantity, item.quantity);
          
          if (coupon.discount.getDiscountType === 'free') {
            discountAmount += freeItems * item.price;
          } else if (coupon.discount.getDiscountType === 'percentage') {
            discountAmount += (freeItems * item.price * coupon.discount.getDiscountValue) / 100;
          } else if (coupon.discount.getDiscountType === 'fixed_amount') {
            discountAmount += freeItems * coupon.discount.getDiscountValue;
          }

          if (freeItems > 0) {
            appliedItems.push({
              productId: item.product._id,
              quantity: freeItems,
              discountAmount: freeItems * item.price
            });
          }
        }
        break;
    }

    return {
      amount: Math.round(discountAmount * 100) / 100,
      appliedItems
    };
  }

  generateRandomCode(prefix, length, pattern) {
    let characters = '';
    
    switch (pattern) {
      case 'ALPHABETIC':
        characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        break;
      case 'NUMERIC':
        characters = '0123456789';
        break;
      case 'ALPHANUMERIC':
      default:
        characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        break;
    }

    let result = prefix;
    const remainingLength = length - prefix.length;
    
    for (let i = 0; i < remainingLength; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return result;
  }
}

module.exports = new CouponController();
