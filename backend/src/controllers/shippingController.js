const Shipping = require('../models/Shipping');
const Product = require('../models/Product');
const Store = require('../models/Store');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

class ShippingController {
  // Calculate shipping rates for cart/order
  async calculateShipping(req, res) {
    try {
      const {
        cartId,
        orderId,
        shippingAddress,
        items = [] // Direct items if no cart/order
      } = req.body;

      let shippingItems = [];
      let storeId = null;

      // Get items from cart, order, or direct input
      if (cartId) {
        const cart = await Cart.findById(cartId)
          .populate('items.product', 'weight dimensions shippingSettings');
        
        if (!cart || cart.userId.toString() !== req.user._id.toString()) {
          return res.status(404).json({
            success: false,
            message: 'Cart not found'
          });
        }

        shippingItems = cart.items;
        storeId = cart.storeId;
      } else if (orderId) {
        const order = await Order.findById(orderId)
          .populate('items.product', 'weight dimensions shippingSettings');
        
        if (!order) {
          return res.status(404).json({
            success: false,
            message: 'Order not found'
          });
        }

        shippingItems = order.items;
        storeId = order.storeId;
      } else if (items.length > 0) {
        // Direct items calculation
        const productIds = items.map(item => item.productId);
        const products = await Product.find({ _id: { $in: productIds } })
          .select('weight dimensions shippingSettings storeId');

        shippingItems = items.map(item => {
          const product = products.find(p => p._id.toString() === item.productId);
          return {
            product: product,
            quantity: item.quantity,
            price: item.price || 0
          };
        });

        // Assume single store for direct calculation
        storeId = products[0]?.storeId;
      } else {
        return res.status(400).json({
          success: false,
          message: 'No items provided for shipping calculation'
        });
      }

      // Validate shipping address
      if (!shippingAddress || !shippingAddress.country || !shippingAddress.postalCode) {
        return res.status(400).json({
          success: false,
          message: 'Complete shipping address is required'
        });
      }

      // Find applicable shipping zones
      const shippingZones = await this.findApplicableZones(storeId, shippingAddress);

      if (shippingZones.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No shipping available to this address'
        });
      }

      // Calculate shipping options
      const shippingOptions = [];

      for (const zone of shippingZones) {
        for (const zoneMethod of zone.shippingMethods) {
          if (!zoneMethod.isActive) continue;

          const method = await ShippingMethod.findById(zoneMethod.method);
          if (!method || !method.isActive) continue;

          const shippingCalculation = await this.calculateMethodRate(
            method,
            zoneMethod.customRates,
            shippingItems,
            shippingAddress,
            zone
          );

          if (shippingCalculation.available) {
            shippingOptions.push({
              methodId: method._id,
              zoneId: zone._id,
              name: method.name,
              description: method.description,
              type: method.type,
              carrier: method.carrier,
              estimatedDays: shippingCalculation.estimatedDays,
              cost: shippingCalculation.cost,
              currency: 'USD',
              features: method.features || [],
              restrictions: shippingCalculation.restrictions || []
            });
          }
        }
      }

      // Sort by cost (cheapest first)
      shippingOptions.sort((a, b) => a.cost - b.cost);

      res.json({
        success: true,
        data: {
          shippingAddress: shippingAddress,
          options: shippingOptions,
          totalItems: shippingItems.reduce((sum, item) => sum + item.quantity, 0),
          totalWeight: this.calculateTotalWeight(shippingItems),
          dimensions: this.calculatePackageDimensions(shippingItems)
        }
      });

    } catch (error) {
      console.error('Error calculating shipping:', error);
      res.status(500).json({
        success: false,
        message: 'Error calculating shipping rates',
        error: error.message
      });
    }
  }

  // Get shipping zones for a store
  async getShippingZones(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        isActive,
        search
      } = req.query;

      // Build query based on user role
      let query = {};

      if (req.user.role === 'seller') {
        const store = await Store.findOne({ ownerId: req.user._id });
        if (!store) {
          return res.status(404).json({
            success: false,
            message: 'Store not found'
          });
        }
        query.storeId = store._id;
      } else if (req.query.storeId && req.user.role === 'admin') {
        query.storeId = req.query.storeId;
      }

      if (isActive !== undefined) {
        query.isActive = isActive === 'true';
      }

      if (search) {
        query.$or = [
          { name: new RegExp(search, 'i') },
          { description: new RegExp(search, 'i') }
        ];
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Get shipping zones
      const zones = await ShippingZone.find(query)
        .populate('storeId', 'storeName storeSlug')
        .populate('shippingMethods.method', 'name type carrier')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count
      const total = await ShippingZone.countDocuments(query);
      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        success: true,
        data: {
          zones,
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
      console.error('Error fetching shipping zones:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching shipping zones',
        error: error.message
      });
    }
  }

  // Create shipping zone
  async createShippingZone(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const zoneData = { ...req.body };

      // Set store ID for sellers
      if (req.user.role === 'seller') {
        const store = await Store.findOne({ ownerId: req.user._id });
        if (!store) {
          return res.status(404).json({
            success: false,
            message: 'Store not found'
          });
        }
        zoneData.storeId = store._id;
      }

      // Validate shipping methods exist
      if (zoneData.shippingMethods && zoneData.shippingMethods.length > 0) {
        const methodIds = zoneData.shippingMethods.map(m => m.method);
        const existingMethods = await ShippingMethod.find({ 
          _id: { $in: methodIds } 
        });

        if (existingMethods.length !== methodIds.length) {
          return res.status(400).json({
            success: false,
            message: 'One or more shipping methods not found'
          });
        }
      }

      // Check for overlapping zones
      const overlappingZone = await this.checkZoneOverlap(zoneData);
      if (overlappingZone) {
        return res.status(400).json({
          success: false,
          message: 'Shipping zone overlaps with existing zone',
          conflictingZone: overlappingZone.name
        });
      }

      // Create zone
      const zone = new ShippingZone(zoneData);
      await zone.save();

      // Populate references
      await zone.populate([
        { path: 'storeId', select: 'name slug' },
        { path: 'shippingMethods.method', select: 'name type carrier' }
      ]);

      res.status(201).json({
        success: true,
        message: 'Shipping zone created successfully',
        data: zone
      });

    } catch (error) {
      console.error('Error creating shipping zone:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating shipping zone',
        error: error.message
      });
    }
  }

  // Update shipping zone
  async updateShippingZone(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Find zone with role-based restrictions
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

      const zone = await ShippingZone.findOne(query);
      
      if (!zone) {
        return res.status(404).json({
          success: false,
          message: 'Shipping zone not found'
        });
      }

      // Update zone
      Object.assign(zone, updates);
      await zone.save();

      // Populate references
      await zone.populate([
        { path: 'storeId', select: 'name slug' },
        { path: 'shippingMethods.method', select: 'name type carrier' }
      ]);

      res.json({
        success: true,
        message: 'Shipping zone updated successfully',
        data: zone
      });

    } catch (error) {
      console.error('Error updating shipping zone:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating shipping zone',
        error: error.message
      });
    }
  }

  // Get shipping methods
  async getShippingMethods(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        carrier,
        isActive,
        search
      } = req.query;

      // Build query
      let query = {};

      if (req.user.role === 'seller') {
        const store = await Store.findOne({ ownerId: req.user._id });
        if (store) {
          query.$or = [
            { storeId: store._id },
            { storeId: null } // Global methods
          ];
        }
      } else if (req.query.storeId && req.user.role === 'admin') {
        query.storeId = req.query.storeId;
      }

      if (type) {
        query.type = type;
      }

      if (carrier) {
        query['carrier.name'] = new RegExp(carrier, 'i');
      }

      if (isActive !== undefined) {
        query.isActive = isActive === 'true';
      }

      if (search) {
        query.$or = [
          { name: new RegExp(search, 'i') },
          { description: new RegExp(search, 'i') },
          { code: new RegExp(search, 'i') }
        ];
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Get methods
      const methods = await ShippingMethod.find(query)
        .populate('storeId', 'storeName storeSlug')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count
      const total = await ShippingMethod.countDocuments(query);
      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        success: true,
        data: {
          methods,
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
      console.error('Error fetching shipping methods:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching shipping methods',
        error: error.message
      });
    }
  }

  // Create shipping method
  async createShippingMethod(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const methodData = { ...req.body };

      // Set store ID for sellers
      if (req.user.role === 'seller') {
        const store = await Store.findOne({ ownerId: req.user._id });
        if (!store) {
          return res.status(404).json({
            success: false,
            message: 'Store not found'
          });
        }
        methodData.storeId = store._id;
      }

      // Check if method code already exists
      const existingMethod = await ShippingMethod.findOne({ 
        code: methodData.code.toUpperCase() 
      });

      if (existingMethod) {
        return res.status(400).json({
          success: false,
          message: 'Shipping method code already exists'
        });
      }

      // Create method
      const method = new ShippingMethod(methodData);
      await method.save();

      // Populate references
      await method.populate('storeId', 'storeName storeSlug');

      res.status(201).json({
        success: true,
        message: 'Shipping method created successfully',
        data: method
      });

    } catch (error) {
      console.error('Error creating shipping method:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating shipping method',
        error: error.message
      });
    }
  }

  // Track shipment
  async trackShipment(req, res) {
    try {
      const { trackingNumber } = req.params;
      const { carrier } = req.query;

      if (!trackingNumber) {
        return res.status(400).json({
          success: false,
          message: 'Tracking number is required'
        });
      }

      // Find order with tracking number
      const order = await Order.findOne({
        'shipping.trackingNumber': trackingNumber
      }).populate('customer', 'firstName lastName email');

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Tracking number not found'
        });
      }

      // Check user permission
      if (req.user.role === 'customer' && order.customer._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Get tracking information from carrier API
      const trackingInfo = await this.getTrackingFromCarrier(
        trackingNumber,
        carrier || order.shipping.carrier
      );

      // Update order shipping status if needed
      if (trackingInfo.status && trackingInfo.status !== order.shipping.status) {
        order.shipping.status = trackingInfo.status;
        order.shipping.lastUpdate = new Date();
        
        if (trackingInfo.status === 'delivered') {
          order.shipping.deliveredAt = new Date();
          order.status = 'delivered';
        }

        await order.save();
      }

      res.json({
        success: true,
        data: {
          trackingNumber: trackingNumber,
          carrier: carrier || order.shipping.carrier,
          order: {
            orderNumber: order.orderNumber,
            status: order.status,
            shippingStatus: order.shipping.status
          },
          tracking: trackingInfo
        }
      });

    } catch (error) {
      console.error('Error tracking shipment:', error);
      res.status(500).json({
        success: false,
        message: 'Error tracking shipment',
        error: error.message
      });
    }
  }

  // Get delivery estimates
  async getDeliveryEstimates(req, res) {
    try {
      const {
        fromAddress,
        toAddress,
        weight,
        dimensions,
        serviceTypes = []
      } = req.body;

      // Validate addresses
      if (!fromAddress || !toAddress) {
        return res.status(400).json({
          success: false,
          message: 'From and to addresses are required'
        });
      }

      // Calculate estimates for different carriers
      const estimates = [];

      // Major carriers to check
      const carriers = ['UPS', 'FedEx', 'USPS', 'DHL'];

      for (const carrier of carriers) {
        const carrierEstimates = await this.getCarrierEstimates(
          carrier,
          fromAddress,
          toAddress,
          weight,
          dimensions,
          serviceTypes
        );

        estimates.push(...carrierEstimates);
      }

      // Sort by delivery time
      estimates.sort((a, b) => a.estimatedDays - b.estimatedDays);

      res.json({
        success: true,
        data: {
          estimates,
          fromAddress,
          toAddress,
          packageInfo: {
            weight: weight,
            dimensions: dimensions
          }
        }
      });

    } catch (error) {
      console.error('Error getting delivery estimates:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting delivery estimates',
        error: error.message
      });
    }
  }

  // Generate shipping labels
  async generateShippingLabel(req, res) {
    try {
      const {
        orderId,
        shippingMethodId,
        fromAddress,
        toAddress,
        packageDetails
      } = req.body;

      // Find order
      const order = await Order.findById(orderId)
        .populate('items.product', 'weight dimensions');

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Check permissions
      if (req.user.role === 'seller') {
        const store = await Store.findOne({ ownerId: req.user._id });
        if (!store || order.storeId.toString() !== store._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }

      // Get shipping method
      const shippingMethod = await ShippingMethod.findById(shippingMethodId);
      if (!shippingMethod) {
        return res.status(404).json({
          success: false,
          message: 'Shipping method not found'
        });
      }

      // Generate label through carrier API
      const labelResult = await this.generateCarrierLabel(
        shippingMethod.carrier.name,
        order,
        shippingMethod,
        fromAddress,
        toAddress,
        packageDetails
      );

      if (!labelResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Failed to generate shipping label',
          error: labelResult.error
        });
      }

      // Update order with tracking information
      order.shipping.trackingNumber = labelResult.trackingNumber;
      order.shipping.carrier = shippingMethod.carrier.name;
      order.shipping.service = shippingMethod.carrier.service;
      order.shipping.labelUrl = labelResult.labelUrl;
      order.shipping.status = 'ready_for_pickup';
      order.shipping.shippedAt = new Date();

      if (order.status === 'processing') {
        order.status = 'shipped';
      }

      await order.save();

      res.json({
        success: true,
        message: 'Shipping label generated successfully',
        data: {
          trackingNumber: labelResult.trackingNumber,
          labelUrl: labelResult.labelUrl,
          estimatedDelivery: labelResult.estimatedDelivery,
          cost: labelResult.cost,
          order: order
        }
      });

    } catch (error) {
      console.error('Error generating shipping label:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating shipping label',
        error: error.message
      });
    }
  }

  // Get shipping analytics
  async getShippingAnalytics(req, res) {
    try {
      const {
        startDate,
        endDate,
        storeId,
        groupBy = 'day'
      } = req.query;

      // Build match query
      let matchQuery = {};

      if (req.user.role === 'seller') {
        const store = await Store.findOne({ ownerId: req.user._id });
        if (store) {
          matchQuery.storeId = store._id;
        }
      } else if (storeId && req.user.role === 'admin') {
        matchQuery.storeId = mongoose.Types.ObjectId(storeId);
      }

      // Date range
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      matchQuery.createdAt = { $gte: start, $lte: end };

      // Shipping performance analytics
      const shippingStats = await Order.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              carrier: '$shipping.carrier',
              method: '$shipping.service'
            },
            totalOrders: { $sum: 1 },
            totalCost: { $sum: '$shipping.cost' },
            averageCost: { $avg: '$shipping.cost' },
            onTimeDeliveries: {
              $sum: {
                $cond: [
                  { $lte: ['$shipping.deliveredAt', '$shipping.estimatedDelivery'] },
                  1,
                  0
                ]
              }
            },
            totalDelivered: {
              $sum: {
                $cond: [{ $eq: ['$shipping.status', 'delivered'] }, 1, 0]
              }
            }
          }
        },
        {
          $addFields: {
            onTimeRate: {
              $cond: [
                { $gt: ['$totalDelivered', 0] },
                { $divide: ['$onTimeDeliveries', '$totalDelivered'] },
                0
              ]
            }
          }
        },
        { $sort: { totalOrders: -1 } }
      ]);

      // Delivery time analysis
      const deliveryTimes = await Order.aggregate([
        {
          $match: {
            ...matchQuery,
            'shipping.deliveredAt': { $exists: true },
            'shipping.shippedAt': { $exists: true }
          }
        },
        {
          $addFields: {
            deliveryDays: {
              $divide: [
                { $subtract: ['$shipping.deliveredAt', '$shipping.shippedAt'] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        },
        {
          $group: {
            _id: '$shipping.carrier',
            averageDeliveryDays: { $avg: '$deliveryDays' },
            minDeliveryDays: { $min: '$deliveryDays' },
            maxDeliveryDays: { $max: '$deliveryDays' },
            orderCount: { $sum: 1 }
          }
        }
      ]);

      // Shipping zones performance
      const zonePerformance = await Order.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              country: '$addresses.shipping.country',
              state: '$addresses.shipping.state'
            },
            orderCount: { $sum: 1 },
            averageShippingCost: { $avg: '$shipping.cost' },
            averageDeliveryTime: { $avg: '$shipping.deliveryDays' }
          }
        },
        { $sort: { orderCount: -1 } },
        { $limit: 20 }
      ]);

      res.json({
        success: true,
        data: {
          summary: {
            period: { start, end },
            totalOrders: shippingStats.reduce((sum, stat) => sum + stat.totalOrders, 0),
            totalShippingCost: shippingStats.reduce((sum, stat) => sum + stat.totalCost, 0),
            averageShippingCost: shippingStats.reduce((sum, stat, _, arr) => 
              sum + stat.averageCost / arr.length, 0
            )
          },
          carrierPerformance: shippingStats,
          deliveryTimes,
          zonePerformance
        }
      });

    } catch (error) {
      console.error('Error fetching shipping analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching shipping analytics',
        error: error.message
      });
    }
  }

  // Helper methods

  async findApplicableZones(storeId, shippingAddress) {
    const query = {
      storeId: storeId,
      isActive: true
    };

    // Find zones that cover the shipping address
    const zones = await ShippingZone.find(query)
      .populate('shippingMethods.method');

    // Filter zones by coverage
    return zones.filter(zone => 
      this.isAddressInZone(shippingAddress, zone)
    );
  }

  isAddressInZone(address, zone) {
    // Check if address is covered by zone
    for (const country of zone.countries) {
      if (country.code === address.country) {
        // Check regions if specified
        if (country.regions && country.regions.length > 0) {
          if (!country.regions.includes(address.state)) {
            continue;
          }
        }

        // Check postal codes if specified
        if (country.postalCodes && country.postalCodes.length > 0) {
          const postalCode = address.postalCode;
          let inRange = false;
          
          for (const range of country.postalCodes) {
            if (postalCode >= range.min && postalCode <= range.max) {
              inRange = true;
              break;
            }
          }
          
          if (!inRange) {
            continue;
          }
        }

        // Check cities if specified
        if (country.cities && country.cities.length > 0) {
          if (!country.cities.includes(address.city)) {
            continue;
          }
        }

        return true;
      }
    }

    return false;
  }

  async calculateMethodRate(method, customRates, items, address, zone) {
    // Calculate shipping rate based on method configuration
    let cost = 0;
    let estimatedDays = { min: 1, max: 7 };
    let available = true;
    let restrictions = [];

    try {
      // Use custom rates if available
      const rates = customRates || method.rates;

      switch (method.rateCalculation.type) {
        case 'flat_rate':
          cost = rates.baseRate || 0;
          break;

        case 'weight_based':
          const totalWeight = this.calculateTotalWeight(items);
          cost = this.calculateWeightBasedRate(rates, totalWeight);
          break;

        case 'price_based':
          const totalValue = items.reduce((sum, item) => 
            sum + (item.price * item.quantity), 0
          );
          cost = this.calculatePriceBasedRate(rates, totalValue);
          break;

        case 'dimensional_weight':
          const dimWeight = this.calculateDimensionalWeight(items);
          const actualWeight = this.calculateTotalWeight(items);
          const billableWeight = Math.max(dimWeight, actualWeight);
          cost = this.calculateWeightBasedRate(rates, billableWeight);
          break;

        case 'zone_based':
          cost = this.calculateZoneBasedRate(rates, address, zone);
          break;

        case 'carrier_api':
          const apiResult = await this.getCarrierRate(method, items, address);
          cost = apiResult.cost;
          estimatedDays = apiResult.estimatedDays;
          available = apiResult.available;
          break;

        default:
          cost = rates.baseRate || 0;
      }

      // Apply minimum cost
      if (method.rates?.minCost) {
        cost = Math.max(cost, method.rates.minCost);
      }

      // Apply maximum cost
      if (method.rates?.maxCost) {
        cost = Math.min(cost, method.rates.maxCost);
      }

      // Check restrictions
      if (method.restrictions) {
        const restrictionCheck = this.checkShippingRestrictions(
          method.restrictions,
          items,
          address
        );
        
        available = restrictionCheck.available;
        restrictions = restrictionCheck.restrictions;
      }

      // Calculate estimated delivery days
      if (method.deliveryEstimate) {
        estimatedDays = {
          min: method.deliveryEstimate.minDays || 1,
          max: method.deliveryEstimate.maxDays || 7
        };
      }

      return {
        available,
        cost: Math.round(cost * 100) / 100,
        estimatedDays,
        restrictions
      };

    } catch (error) {
      console.error('Error calculating method rate:', error);
      return {
        available: false,
        cost: 0,
        estimatedDays: { min: 1, max: 7 },
        restrictions: ['Calculation error']
      };
    }
  }

  calculateTotalWeight(items) {
    return items.reduce((total, item) => {
      const weight = item.product?.weight || 0;
      return total + (weight * item.quantity);
    }, 0);
  }

  calculatePackageDimensions(items) {
    // Simplified calculation - in practice, this would be more complex
    let totalVolume = 0;
    
    items.forEach(item => {
      const dimensions = item.product?.dimensions;
      if (dimensions) {
        const volume = dimensions.length * dimensions.width * dimensions.height;
        totalVolume += volume * item.quantity;
      }
    });

    // Estimate package dimensions from total volume
    const estimatedLength = Math.cbrt(totalVolume) * 1.2;
    
    return {
      length: Math.max(estimatedLength, 6),
      width: Math.max(estimatedLength * 0.8, 4),
      height: Math.max(estimatedLength * 0.6, 2),
      volume: totalVolume
    };
  }

  calculateWeightBasedRate(rates, weight) {
    if (!rates.weightTiers) return rates.baseRate || 0;

    for (const tier of rates.weightTiers) {
      if (weight >= tier.minWeight && weight <= tier.maxWeight) {
        return tier.rate + (tier.additionalRate * Math.max(0, weight - tier.minWeight));
      }
    }

    return rates.baseRate || 0;
  }

  calculatePriceBasedRate(rates, totalValue) {
    if (rates.freeShippingThreshold && totalValue >= rates.freeShippingThreshold) {
      return 0;
    }

    if (rates.percentage) {
      return totalValue * (rates.percentage / 100);
    }

    return rates.baseRate || 0;
  }

  calculateDimensionalWeight(items) {
    const dimensions = this.calculatePackageDimensions(items);
    // Standard dimensional weight calculation (length × width × height / 166)
    return (dimensions.length * dimensions.width * dimensions.height) / 166;
  }

  calculateZoneBasedRate(rates, address, zone) {
    // Zone-based rate calculation logic
    return rates.baseRate || 0;
  }

  async getCarrierRate(method, items, address) {
    // Simulate carrier API call
    return {
      available: true,
      cost: 10.99,
      estimatedDays: { min: 2, max: 5 }
    };
  }

  checkShippingRestrictions(restrictions, items, address) {
    const violatedRestrictions = [];
    let available = true;

    // Check product restrictions
    if (restrictions.prohibitedProducts) {
      // Implementation for prohibited products check
    }

    // Check address restrictions
    if (restrictions.excludedCountries) {
      if (restrictions.excludedCountries.includes(address.country)) {
        available = false;
        violatedRestrictions.push('Shipping not available to this country');
      }
    }

    // Check weight/size restrictions
    if (restrictions.maxWeight) {
      const totalWeight = this.calculateTotalWeight(items);
      if (totalWeight > restrictions.maxWeight) {
        available = false;
        violatedRestrictions.push(`Exceeds maximum weight limit of ${restrictions.maxWeight}kg`);
      }
    }

    return {
      available,
      restrictions: violatedRestrictions
    };
  }

  async checkZoneOverlap(newZone) {
    // Check if new zone overlaps with existing zones
    // This is a simplified check - in practice, would be more complex
    const existingZones = await ShippingZone.find({
      storeId: newZone.storeId,
      isActive: true
    });

    for (const zone of existingZones) {
      // Check for country overlap
      const countryOverlap = newZone.countries.some(newCountry =>
        zone.countries.some(existingCountry =>
          existingCountry.code === newCountry.code
        )
      );

      if (countryOverlap) {
        return zone;
      }
    }

    return null;
  }

  async getTrackingFromCarrier(trackingNumber, carrier) {
    // Simulate carrier tracking API call
    // In production, this would integrate with actual carrier APIs
    return {
      status: 'in_transit',
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      events: [
        {
          date: new Date(),
          status: 'in_transit',
          location: 'Distribution Center',
          description: 'Package is in transit'
        }
      ],
      lastUpdate: new Date()
    };
  }

  async getCarrierEstimates(carrier, fromAddress, toAddress, weight, dimensions, serviceTypes) {
    // Simulate carrier estimate API calls
    const estimates = [
      {
        carrier: carrier,
        service: 'Ground',
        estimatedDays: 5,
        cost: 8.99
      },
      {
        carrier: carrier,
        service: 'Express',
        estimatedDays: 2,
        cost: 24.99
      }
    ];

    return estimates;
  }

  async generateCarrierLabel(carrier, order, method, fromAddress, toAddress, packageDetails) {
    // Simulate carrier label generation API
    return {
      success: true,
      trackingNumber: `1Z${Date.now()}`,
      labelUrl: `https://example.com/labels/${Date.now()}.pdf`,
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      cost: 12.99
    };
  }
}

module.exports = new ShippingController();
