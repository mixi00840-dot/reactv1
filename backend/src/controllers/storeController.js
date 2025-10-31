const Store = require('../models/Store');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { validationResult } = require('express-validator');

class StoreController {
  // Get all stores with filtering and pagination
  async getStores(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        sort = '-createdAt',
        search,
        status = 'active',
        category,
        rating,
        verified,
        country,
        featured
      } = req.query;

      // Build query
      const query = {};
      
      // Status filter
      if (status && status !== 'all') {
        query.status = status;
      }
      
      // Search filter
      if (search) {
        query.$or = [
          { name: new RegExp(search, 'i') },
          { 'businessInfo.businessName': new RegExp(search, 'i') },
          { 'businessInfo.description': new RegExp(search, 'i') },
          { tags: new RegExp(search, 'i') }
        ];
      }
      
      // Category filter
      if (category) {
        query['businessInfo.categories'] = category;
      }
      
      // Rating filter
      if (rating) {
        query['ratings.average'] = { $gte: parseFloat(rating) };
      }
      
      // Verified filter
      if (verified === 'true') {
        query.verificationStatus = 'verified';
      }
      
      // Country filter
      if (country) {
        query['businessInfo.address.country'] = country;
      }
      
      // Featured filter
      if (featured === 'true') {
        query.isFeatured = true;
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Execute query
      const stores = await Store.find(query)
        .populate('ownerId', 'fullName email avatar')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      // Get total count for pagination
      const total = await Store.countDocuments(query);
      
      // Calculate pagination info
      const totalPages = Math.ceil(total / parseInt(limit));
      const hasNextPage = parseInt(page) < totalPages;
      const hasPrevPage = parseInt(page) > 1;

      res.json({
        success: true,
        data: {
          stores,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: total,
            itemsPerPage: parseInt(limit),
            hasNextPage,
            hasPrevPage
          }
        }
      });
    } catch (error) {
      console.error('Error fetching stores:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching stores',
        error: error.message
      });
    }
  }

  // Get single store by ID or slug
  async getStore(req, res) {
    try {
      const { id } = req.params;
      const { includeProducts = false, includeStats = false } = req.query;
      
      // Find store by ID or slug
      const store = await Store.findOne({
        $or: [
          { _id: id },
          { storeSlug: id }
        ]
      }).populate('ownerId', 'fullName avatar');

      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }

      // Check if store is accessible
      if (store.status !== 'active' && (!req.user || req.user.role !== 'admin')) {
        // Allow store owners to view their own stores
        if (!req.user || store.owner._id.toString() !== req.user._id.toString()) {
          return res.status(404).json({
            success: false,
            message: 'Store not found'
          });
        }
      }

      let responseData = { store };

      // Include recent products if requested
      if (includeProducts === 'true') {
        const products = await Product.find({
          storeId: store._id,
          status: 'active'
        })
          .select('name slug images pricing.basePrice ratings.average')
          .sort('-createdAt')
          .limit(12)
          .lean();
        
        responseData.products = products;
      }

      // Include store statistics if requested
      if (includeStats === 'true' && req.user && 
          (req.user.role === 'admin' || store.owner._id.toString() === req.user._id.toString())) {
        
        const stats = await this.getStoreStats(store._id);
        responseData.stats = stats;
      }

      res.json({
        success: true,
        data: responseData
      });
    } catch (error) {
      console.error('Error fetching store:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching store',
        error: error.message
      });
    }
  }

  // Create new store (seller only)
  async createStore(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      // Check if user already has a store
      const existingStore = await Store.findOne({ ownerId: req.user._id });
      if (existingStore) {
        return res.status(400).json({
          success: false,
          message: 'You already have a store. Each user can only have one store.'
        });
      }

      const storeData = {
        ...req.body,
        owner: req.user._id
      };

      // Create store
      const store = new Store(storeData);
      await store.save();

      // Update user role to seller if not already
      if (req.user.role === 'user') {
        await User.findByIdAndUpdate(req.user._id, { role: 'seller' });
      }

      // Populate owner data
      await store.populate('ownerId', 'fullName email avatar');

      res.status(201).json({
        success: true,
        message: 'Store created successfully',
        data: store
      });
    } catch (error) {
      console.error('Error creating store:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Store name or slug already exists'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error creating store',
        error: error.message
      });
    }
  }

  // Update store (store owner/admin only)
  async updateStore(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const store = await Store.findById(id);
      
      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }

      // Check permissions
      if (req.user.role !== 'admin' && store.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own store'
        });
      }

      // Update store
      Object.assign(store, updates);
      await store.save();

      // Populate owner data
      await store.populate('ownerId', 'fullName email avatar');

      res.json({
        success: true,
        message: 'Store updated successfully',
        data: store
      });
    } catch (error) {
      console.error('Error updating store:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating store',
        error: error.message
      });
    }
  }

  // Update store settings (store owner only)
  async updateStoreSettings(req, res) {
    try {
      const { id } = req.params;
      const { section, data } = req.body;

      const store = await Store.findById(id);
      
      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }

      // Check permissions
      if (req.user.role !== 'admin' && store.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own store settings'
        });
      }

      // Update specific section
      switch (section) {
        case 'business':
          store.businessInfo = { ...store.businessInfo, ...data };
          break;
        case 'shipping':
          store.shippingSettings = { ...store.shippingSettings, ...data };
          break;
        case 'payment':
          store.paymentSettings = { ...store.paymentSettings, ...data };
          break;
        case 'policies':
          store.policies = { ...store.policies, ...data };
          break;
        case 'branding':
          store.branding = { ...store.branding, ...data };
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid settings section'
          });
      }

      await store.save();

      res.json({
        success: true,
        message: 'Store settings updated successfully',
        data: store
      });
    } catch (error) {
      console.error('Error updating store settings:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating store settings',
        error: error.message
      });
    }
  }

  // Get store dashboard data (store owner only)
  async getStoreDashboard(req, res) {
    try {
      const { id } = req.params;
      const { period = '30d' } = req.query;

      const store = await Store.findById(id);
      
      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }

      // Check permissions
      if (req.user.role !== 'admin' && store.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      // Get comprehensive store statistics
      const stats = await this.getStoreDashboardStats(store._id, startDate, endDate);

      res.json({
        success: true,
        data: {
          store: {
            _id: store._id,
            name: store.name,
            slug: store.slug,
            status: store.status,
            verificationStatus: store.verificationStatus
          },
          period,
          stats
        }
      });
    } catch (error) {
      console.error('Error fetching store dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching dashboard data',
        error: error.message
      });
    }
  }

  // Get store analytics (store owner/admin only)
  async getStoreAnalytics(req, res) {
    try {
      const { id } = req.params;
      const { 
        startDate, 
        endDate, 
        granularity = 'day',
        metrics = 'all'
      } = req.query;

      const store = await Store.findById(id);
      
      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }

      // Check permissions
      if (req.user.role !== 'admin' && store.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Get analytics data
      const analytics = await this.getStoreAnalytics(store._id, {
        startDate: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: endDate ? new Date(endDate) : new Date(),
        granularity,
        metrics: metrics === 'all' ? null : metrics.split(',')
      });

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error fetching store analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching analytics',
        error: error.message
      });
    }
  }

  // Verify store (admin only)
  async verifyStore(req, res) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const store = await Store.findById(id);
      
      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }

      // Update verification status
      store.verificationStatus = status;
      store.verificationNotes = notes;
      store.verifiedAt = status === 'verified' ? new Date() : null;
      store.verifiedBy = status === 'verified' ? req.user._id : null;
      
      await store.save();

      // Send notification to store owner
      // (Would integrate with notification service)

      res.json({
        success: true,
        message: `Store ${status} successfully`,
        data: store
      });
    } catch (error) {
      console.error('Error verifying store:', error);
      res.status(500).json({
        success: false,
        message: 'Error verifying store',
        error: error.message
      });
    }
  }

  async unverifyStore(req, res) {
    try {
      const { id } = req.params;

      const store = await Store.findById(id);
      
      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }

      // Update verification status to unverified
      store.isVerified = false;
      store.verificationStatus = 'pending';
      store.verifiedAt = null;
      store.verifiedBy = null;
      
      await store.save();

      res.json({
        success: true,
        message: 'Store unverified successfully',
        data: store
      });
    } catch (error) {
      console.error('Error unverifying store:', error);
      res.status(500).json({
        success: false,
        message: 'Error unverifying store',
        error: error.message
      });
    }
  }

  // Helper methods

  async getStoreStats(storeId) {
    try {
      const [productCount, orderStats, revenueStats] = await Promise.all([
        Product.countDocuments({ storeId, status: 'active' }),
        
        Order.aggregate([
          { $match: { storeId } },
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              totalRevenue: { $sum: '$totals.finalTotal' },
              avgOrderValue: { $avg: '$totals.finalTotal' }
            }
          }
        ]),
        
        Order.aggregate([
          { 
            $match: { 
              storeId,
              createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            }
          },
          {
            $group: {
              _id: null,
              monthlyOrders: { $sum: 1 },
              monthlyRevenue: { $sum: '$totals.finalTotal' }
            }
          }
        ])
      ]);

      return {
        products: {
          total: productCount
        },
        orders: {
          total: orderStats[0]?.totalOrders || 0,
          monthly: revenueStats[0]?.monthlyOrders || 0,
          averageValue: orderStats[0]?.avgOrderValue || 0
        },
        revenue: {
          total: orderStats[0]?.totalRevenue || 0,
          monthly: revenueStats[0]?.monthlyRevenue || 0
        }
      };
    } catch (error) {
      console.error('Error getting store stats:', error);
      return {};
    }
  }

  async getStoreDashboardStats(storeId, startDate, endDate) {
    try {
      // Comprehensive dashboard statistics
      const [
        orders,
        products,
        revenue,
        customers,
        topProducts,
        recentOrders
      ] = await Promise.all([
        // Order statistics
        Order.aggregate([
          {
            $match: {
              storeId,
              createdAt: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              revenue: { $sum: '$totals.finalTotal' }
            }
          }
        ]),

        // Product statistics
        Product.aggregate([
          { $match: { storeId } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ]),

        // Revenue trends
        Order.aggregate([
          {
            $match: {
              storeId,
              createdAt: { $gte: startDate, $lte: endDate },
              status: { $in: ['completed', 'delivered'] }
            }
          },
          {
            $group: {
              _id: {
                date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
              },
              revenue: { $sum: '$totals.finalTotal' },
              orders: { $sum: 1 }
            }
          },
          { $sort: { '_id.date': 1 } }
        ]),

        // Customer statistics
        Order.aggregate([
          {
            $match: {
              storeId,
              createdAt: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: '$customer',
              orderCount: { $sum: 1 },
              totalSpent: { $sum: '$totals.finalTotal' }
            }
          }
        ]),

        // Top selling products
        Order.aggregate([
          {
            $match: {
              storeId,
              createdAt: { $gte: startDate, $lte: endDate }
            }
          },
          { $unwind: '$items' },
          {
            $group: {
              _id: '$items.product',
              totalSold: { $sum: '$items.quantity' },
              revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
            }
          },
          { $sort: { totalSold: -1 } },
          { $limit: 10 }
        ]),

        // Recent orders
        Order.find({ storeId })
          .populate('customer', 'fullName')
          .sort('-createdAt')
          .limit(10)
          .select('_id orderNumber customer totals.finalTotal status createdAt')
      ]);

      return {
        orders,
        products,
        revenue,
        customers: {
          total: customers.length,
          new: customers.filter(c => c.orderCount === 1).length,
          returning: customers.filter(c => c.orderCount > 1).length
        },
        topProducts,
        recentOrders
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {};
    }
  }
}

module.exports = new StoreController();
