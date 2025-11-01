const {
  AnalyticsDashboard,
  AnalyticsReport,
  AnalyticsEvent,
  KPI,
  BICache
} = require('../models/Analytics');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Store = require('../models/Store');
const { SupportTicket, LiveChat } = require('../models/CustomerService');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

class AnalyticsController {
  constructor() {
    // Bind public route handlers to preserve 'this' when Express invokes them
    this.getOverviewDashboard = this.getOverviewDashboard.bind(this);
    this.getSalesAnalytics = this.getSalesAnalytics.bind(this);
    this.getCustomerAnalytics = this.getCustomerAnalytics.bind(this);
    this.getProductAnalytics = this.getProductAnalytics.bind(this);
    this.getFinancialAnalytics = this.getFinancialAnalytics.bind(this);
    this.getMarketingAnalytics = this.getMarketingAnalytics.bind(this);
    this.getOperationalAnalytics = this.getOperationalAnalytics.bind(this);
    this.getRealTimeMetrics = this.getRealTimeMetrics.bind(this);

    // KPI & reports
    this.getKPIs = this.getKPIs.bind(this);
    this.createKPI = this.createKPI.bind(this);
    this.updateKPIValue = this.updateKPIValue.bind(this);
    this.generateReport = this.generateReport.bind(this);
    this.exportData = this.exportData.bind(this);
  }
  // Dashboard Analytics

  // Get overview dashboard
  async getOverviewDashboard(req, res) {
    try {
      const {
        period = '30d',
        storeId,
        compareWith
      } = req.query;

      // Calculate date ranges
      const dateRange = this.getDateRange(period);
      const compareRange = compareWith ? this.getDateRange(compareWith) : null;

      // Build query based on user role
      let matchQuery = {
        createdAt: { $gte: dateRange.start, $lte: dateRange.end }
      };

      if (req.user.role === 'seller') {
        const store = await Store.findOne({ ownerId: req.user._id });
        if (store) {
          matchQuery.storeId = store._id;
        }
      } else if (storeId && req.user.role === 'admin') {
        matchQuery.storeId = mongoose.Types.ObjectId(storeId);
      }

      // Get overview metrics
      const overview = await this.getOverviewMetrics(matchQuery, compareRange);

      // Get recent activities
      const recentActivities = await this.getRecentActivities(matchQuery, 10);

      // Get top performing items
      const topProducts = await this.getTopProducts(matchQuery, 5);
      const topCustomers = await this.getTopCustomers(matchQuery, 5);

      res.json({
        success: true,
        data: {
          period: {
            start: dateRange.start,
            end: dateRange.end,
            label: period
          },
          overview,
          recentActivities,
          topProducts,
          topCustomers
        }
      });

    } catch (error) {
      console.error('Error fetching overview dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching overview dashboard',
        error: error.message
      });
    }
  }

  // Get sales analytics
  async getSalesAnalytics(req, res) {
    try {
      const {
        period = '30d',
        groupBy = 'day',
        storeId,
        productId,
        categoryId
      } = req.query;

      const dateRange = this.getDateRange(period);

      // Build match query
      let matchQuery = {
        createdAt: { $gte: dateRange.start, $lte: dateRange.end },
        status: { $in: ['delivered', 'completed', 'shipped'] }
      };

      // Apply filters based on user role and request parameters
      if (req.user.role === 'seller') {
        const store = await Store.findOne({ ownerId: req.user._id });
        if (store) {
          matchQuery.storeId = store._id;
        }
      } else if (storeId && req.user.role === 'admin') {
        matchQuery.storeId = mongoose.Types.ObjectId(storeId);
      }

      if (productId) {
        matchQuery['items.product'] = mongoose.Types.ObjectId(productId);
      }

      // Sales over time
      const salesOverTime = await Order.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: this.getGroupByExpression(groupBy, '$createdAt'),
            totalSales: { $sum: '$totalAmount' },
            orderCount: { $sum: 1 },
            averageOrderValue: { $avg: '$totalAmount' },
            totalItems: { $sum: { $sum: '$items.quantity' } }
          }
        },
        { $sort: { '_id': 1 } }
      ]);

      // Sales by category
      const salesByCategory = await Order.aggregate([
        { $match: matchQuery },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'products',
            localField: 'items.product',
            foreignField: '_id',
            as: 'productInfo'
          }
        },
        { $unwind: '$productInfo' },
        {
          $group: {
            _id: '$productInfo.category',
            totalSales: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
            orderCount: { $sum: 1 },
            itemsSold: { $sum: '$items.quantity' }
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'categoryInfo'
          }
        },
        { $sort: { totalSales: -1 } }
      ]);

      // Sales by payment method
      const salesByPaymentMethod = await Order.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$payment.method',
            totalSales: { $sum: '$totalAmount' },
            orderCount: { $sum: 1 }
          }
        },
        { $sort: { totalSales: -1 } }
      ]);

      // Sales funnel
      const salesFunnel = await this.getSalesFunnel(matchQuery);

      // Revenue metrics
      const revenueMetrics = await this.getRevenueMetrics(matchQuery);

      res.json({
        success: true,
        data: {
          period: {
            start: dateRange.start,
            end: dateRange.end,
            groupBy
          },
          salesOverTime,
          salesByCategory,
          salesByPaymentMethod,
          salesFunnel,
          revenueMetrics
        }
      });

    } catch (error) {
      console.error('Error fetching sales analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching sales analytics',
        error: error.message
      });
    }
  }

  // Get customer analytics
  async getCustomerAnalytics(req, res) {
    try {
      const {
        period = '30d',
        groupBy = 'day',
        storeId
      } = req.query;

      const dateRange = this.getDateRange(period);

      // Build match query
      let matchQuery = {
        createdAt: { $gte: dateRange.start, $lte: dateRange.end }
      };

      if (req.user.role === 'seller') {
        const store = await Store.findOne({ ownerId: req.user._id });
        if (store) {
          matchQuery.storeId = store._id;
        }
      } else if (storeId && req.user.role === 'admin') {
        matchQuery.storeId = mongoose.Types.ObjectId(storeId);
      }

      // Customer acquisition
      const customerAcquisition = await User.aggregate([
        {
          $match: {
            createdAt: { $gte: dateRange.start, $lte: dateRange.end },
            role: 'customer'
          }
        },
        {
          $group: {
            _id: this.getGroupByExpression(groupBy, '$createdAt'),
            newCustomers: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]);

      // Customer lifetime value
      const customerLTV = await Order.aggregate([
        { $match: { ...matchQuery, status: { $in: ['delivered', 'completed'] } } },
        {
          $group: {
            _id: '$customer',
            totalSpent: { $sum: '$totalAmount' },
            orderCount: { $sum: 1 },
            firstOrder: { $min: '$createdAt' },
            lastOrder: { $max: '$createdAt' }
          }
        },
        {
          $addFields: {
            customerLifespan: {
              $divide: [
                { $subtract: ['$lastOrder', '$firstOrder'] },
                1000 * 60 * 60 * 24 // Convert to days
              ]
            },
            averageOrderValue: { $divide: ['$totalSpent', '$orderCount'] }
          }
        },
        {
          $group: {
            _id: null,
            avgLifetimeValue: { $avg: '$totalSpent' },
            avgOrderCount: { $avg: '$orderCount' },
            avgCustomerLifespan: { $avg: '$customerLifespan' },
            avgOrderValue: { $avg: '$averageOrderValue' }
          }
        }
      ]);

      // Customer segments
      const customerSegments = await this.getCustomerSegments(matchQuery);

      // Customer retention
      const customerRetention = await this.getCustomerRetention(matchQuery);

      // Customer demographics
      const customerDemographics = await this.getCustomerDemographics();

      res.json({
        success: true,
        data: {
          period: {
            start: dateRange.start,
            end: dateRange.end,
            groupBy
          },
          customerAcquisition,
          customerLTV: customerLTV[0] || {},
          customerSegments,
          customerRetention,
          customerDemographics
        }
      });

    } catch (error) {
      console.error('Error fetching customer analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching customer analytics',
        error: error.message
      });
    }
  }

  // Get product analytics
  async getProductAnalytics(req, res) {
    try {
      const {
        period = '30d',
        storeId,
        categoryId,
        limit = 20
      } = req.query;

      const dateRange = this.getDateRange(period);

      // Build match query
      let matchQuery = {
        createdAt: { $gte: dateRange.start, $lte: dateRange.end }
      };

      if (req.user.role === 'seller') {
        const store = await Store.findOne({ ownerId: req.user._id });
        if (store) {
          matchQuery.storeId = store._id;
        }
      } else if (storeId && req.user.role === 'admin') {
        matchQuery.storeId = mongoose.Types.ObjectId(storeId);
      }

      // Top selling products
      const topSellingProducts = await Order.aggregate([
        { $match: matchQuery },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            totalSold: { $sum: '$items.quantity' },
            totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
            orderCount: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'productInfo'
          }
        },
        { $unwind: '$productInfo' },
        { $sort: { totalSold: -1 } },
        { $limit: parseInt(limit) }
      ]);

      // Product performance metrics
      const productPerformance = await this.getProductPerformance(matchQuery);

      // Inventory analytics
      const inventoryAnalytics = await this.getInventoryAnalytics(matchQuery);

      // Product conversion rates
      const conversionRates = await this.getProductConversionRates(matchQuery);

      res.json({
        success: true,
        data: {
          period: {
            start: dateRange.start,
            end: dateRange.end
          },
          topSellingProducts,
          productPerformance,
          inventoryAnalytics,
          conversionRates
        }
      });

    } catch (error) {
      console.error('Error fetching product analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching product analytics',
        error: error.message
      });
    }
  }

  // Get financial analytics
  async getFinancialAnalytics(req, res) {
    try {
      const {
        period = '30d',
        groupBy = 'day',
        storeId
      } = req.query;

      const dateRange = this.getDateRange(period);

      // Build match query
      let matchQuery = {
        createdAt: { $gte: dateRange.start, $lte: dateRange.end }
      };

      if (req.user.role === 'seller') {
        const store = await Store.findOne({ ownerId: req.user._id });
        if (store) {
          matchQuery.storeId = store._id;
        }
      } else if (storeId && req.user.role === 'admin') {
        matchQuery.storeId = mongoose.Types.ObjectId(storeId);
      }

      // Revenue analytics
      const revenueAnalytics = await Order.aggregate([
        { $match: { ...matchQuery, status: { $in: ['delivered', 'completed'] } } },
        {
          $group: {
            _id: this.getGroupByExpression(groupBy, '$createdAt'),
            grossRevenue: { $sum: '$totalAmount' },
            netRevenue: { $sum: '$subtotal' },
            taxes: { $sum: '$tax' },
            shipping: { $sum: '$shipping.cost' },
            discounts: { $sum: '$discount.amount' },
            orderCount: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]);

      // Payment method analytics
      const paymentAnalytics = await this.getPaymentAnalytics(matchQuery);

      // Cost analytics (simplified)
      const costAnalytics = await this.getCostAnalytics(matchQuery);

      // Profit margins
      const profitMargins = await this.getProfitMargins(matchQuery);

      res.json({
        success: true,
        data: {
          period: {
            start: dateRange.start,
            end: dateRange.end,
            groupBy
          },
          revenueAnalytics,
          paymentAnalytics,
          costAnalytics,
          profitMargins
        }
      });

    } catch (error) {
      console.error('Error fetching financial analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching financial analytics',
        error: error.message
      });
    }
  }

  // Get marketing analytics
  async getMarketingAnalytics(req, res) {
    try {
      const {
        period = '30d',
        storeId,
        campaignId
      } = req.query;

      const dateRange = this.getDateRange(period);

      // Build match query
      let matchQuery = {
        createdAt: { $gte: dateRange.start, $lte: dateRange.end }
      };

      if (req.user.role === 'seller') {
        const store = await Store.findOne({ ownerId: req.user._id });
        if (store) {
          matchQuery.storeId = store._id;
        }
      } else if (storeId && req.user.role === 'admin') {
        matchQuery.storeId = mongoose.Types.ObjectId(storeId);
      }

      // Coupon usage analytics
      const couponAnalytics = await this.getCouponAnalytics(matchQuery);

      // Traffic sources
      const trafficSources = await this.getTrafficSources(matchQuery);

      // Conversion funnel
      const conversionFunnel = await this.getConversionFunnel(matchQuery);

      // Email marketing metrics (if applicable)
      const emailMetrics = await this.getEmailMarketingMetrics(matchQuery);

      res.json({
        success: true,
        data: {
          period: {
            start: dateRange.start,
            end: dateRange.end
          },
          couponAnalytics,
          trafficSources,
          conversionFunnel,
          emailMetrics
        }
      });

    } catch (error) {
      console.error('Error fetching marketing analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching marketing analytics',
        error: error.message
      });
    }
  }

  // Get operational analytics
  async getOperationalAnalytics(req, res) {
    try {
      const {
        period = '30d',
        storeId
      } = req.query;

      const dateRange = this.getDateRange(period);

      // Build match query
      let matchQuery = {
        createdAt: { $gte: dateRange.start, $lte: dateRange.end }
      };

      if (req.user.role === 'seller') {
        const store = await Store.findOne({ ownerId: req.user._id });
        if (store) {
          matchQuery.storeId = store._id;
        }
      } else if (storeId && req.user.role === 'admin') {
        matchQuery.storeId = mongoose.Types.ObjectId(storeId);
      }

      // Order fulfillment metrics
      const fulfillmentMetrics = await this.getOrderFulfillmentMetrics(matchQuery);

      // Shipping analytics
      const shippingAnalytics = await this.getShippingAnalytics(matchQuery);

      // Customer service metrics
      const customerServiceMetrics = await this.getCustomerServiceMetrics(matchQuery);

      // Inventory turnover
      const inventoryTurnover = await this.getInventoryTurnover(matchQuery);

      res.json({
        success: true,
        data: {
          period: {
            start: dateRange.start,
            end: dateRange.end
          },
          fulfillmentMetrics,
          shippingAnalytics,
          customerServiceMetrics,
          inventoryTurnover
        }
      });

    } catch (error) {
      console.error('Error fetching operational analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching operational analytics',
        error: error.message
      });
    }
  }

  // Real-time metrics
  async getRealTimeMetrics(req, res) {
    try {
      const { storeId } = req.query;

      // Build query based on user role
      let matchQuery = {};

      if (req.user.role === 'seller') {
        const store = await Store.findOne({ ownerId: req.user._id });
        if (store) {
          matchQuery.storeId = store._id;
        }
      } else if (storeId && req.user.role === 'admin') {
        matchQuery.storeId = mongoose.Types.ObjectId(storeId);
      }

      // Current day metrics
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayQuery = { ...matchQuery, createdAt: { $gte: today } };

      // Real-time metrics
      const realTimeMetrics = await Promise.all([
        // Today's sales
        Order.aggregate([
          { $match: { ...todayQuery, status: { $ne: 'cancelled' } } },
          {
            $group: {
              _id: null,
              totalSales: { $sum: '$totalAmount' },
              orderCount: { $sum: 1 },
              averageOrderValue: { $avg: '$totalAmount' }
            }
          }
        ]),

        // Active users (last hour)
        AnalyticsEvent.countDocuments({
          ...matchQuery,
          timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
          eventType: 'page_view'
        }),

        // Cart abandonment rate (last 24 hours)
        this.getCartAbandonmentRate(matchQuery),

        // Current inventory alerts
        this.getInventoryAlerts(matchQuery)
      ]);

      res.json({
        success: true,
        data: {
          timestamp: new Date(),
          todaysSales: realTimeMetrics[0][0] || { totalSales: 0, orderCount: 0, averageOrderValue: 0 },
          activeUsers: realTimeMetrics[1],
          cartAbandonmentRate: realTimeMetrics[2],
          inventoryAlerts: realTimeMetrics[3]
        }
      });

    } catch (error) {
      console.error('Error fetching real-time metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching real-time metrics',
        error: error.message
      });
    }
  }

  // KPI Management

  // Get KPIs
  async getKPIs(req, res) {
    try {
      const { storeId, category } = req.query;

      // Build query based on user role
      let query = { isActive: true };

      if (req.user.role === 'seller') {
        const store = await Store.findOne({ ownerId: req.user._id });
        if (store) {
          query.storeId = store._id;
        }
      } else if (storeId && req.user.role === 'admin') {
        query.storeId = storeId;
      }

      if (category) {
        query.metric = new RegExp(category, 'i');
      }

      const kpis = await KPI.find(query)
        .populate('owner', 'fullName')
        .populate('storeId', 'storeName')
        .sort('name');

      res.json({
        success: true,
        data: kpis
      });

    } catch (error) {
      console.error('Error fetching KPIs:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching KPIs',
        error: error.message
      });
    }
  }

  // Create KPI
  async createKPI(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const kpiData = {
        ...req.body,
        owner: req.user._id
      };

      // Set store ID for sellers
      if (req.user.role === 'seller') {
        const store = await Store.findOne({ ownerId: req.user._id });
        if (store) {
          kpiData.storeId = store._id;
        }
      }

      const kpi = new KPI(kpiData);
      await kpi.save();

      // Populate references
      await kpi.populate([
        { path: 'owner', select: 'firstName lastName' },
        { path: 'storeId', select: 'name' }
      ]);

      res.status(201).json({
        success: true,
        message: 'KPI created successfully',
        data: kpi
      });

    } catch (error) {
      console.error('Error creating KPI:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating KPI',
        error: error.message
      });
    }
  }

  // Update KPI value
  async updateKPIValue(req, res) {
    try {
      const { id } = req.params;
      const { value } = req.body;

      const kpi = await KPI.findById(id);

      if (!kpi) {
        return res.status(404).json({
          success: false,
          message: 'KPI not found'
        });
      }

      // Check permissions
      if (req.user.role === 'seller') {
        const store = await Store.findOne({ ownerId: req.user._id });
        if (!store || kpi.storeId?.toString() !== store._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }

      // Update KPI value
      kpi.currentValue.previousValue = kpi.currentValue.value;
      kpi.currentValue.value = value;
      kpi.currentValue.lastUpdated = new Date();
      kpi.lastUpdate = new Date();

      // Add to history
      kpi.history.push({
        value: value,
        date: new Date(),
        period: 'current'
      });

      // Keep only last 30 entries
      if (kpi.history.length > 30) {
        kpi.history = kpi.history.slice(-30);
      }

      await kpi.save();

      res.json({
        success: true,
        message: 'KPI updated successfully',
        data: kpi
      });

    } catch (error) {
      console.error('Error updating KPI:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating KPI',
        error: error.message
      });
    }
  }

  // Generate report
  async generateReport(req, res) {
    try {
      const {
        type,
        parameters,
        format = 'json'
      } = req.body;

      // Validate report type
      const validTypes = [
        'sales_report',
        'product_performance',
        'customer_analysis',
        'inventory_report',
        'financial_statement'
      ];

      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
      }

      // Generate report data based on type
      let reportData;
      
      switch (type) {
        case 'sales_report':
          reportData = await this.generateSalesReport(parameters, req.user);
          break;
        case 'product_performance':
          reportData = await this.generateProductPerformanceReport(parameters, req.user);
          break;
        case 'customer_analysis':
          reportData = await this.generateCustomerAnalysisReport(parameters, req.user);
          break;
        case 'inventory_report':
          reportData = await this.generateInventoryReport(parameters, req.user);
          break;
        case 'financial_statement':
          reportData = await this.generateFinancialStatement(parameters, req.user);
          break;
      }

      // Create report record
      const report = new AnalyticsReport({
        name: `${type.replace('_', ' ').toUpperCase()} - ${new Date().toLocaleDateString()}`,
        type: type,
        parameters: parameters,
        data: reportData,
        owner: req.user._id,
        status: 'active'
      });

      await report.save();

      res.json({
        success: true,
        message: 'Report generated successfully',
        data: {
          reportId: report._id,
          type: type,
          generatedAt: report.createdAt,
          data: reportData
        }
      });

    } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating report',
        error: error.message
      });
    }
  }

  // Export analytics data
  async exportData(req, res) {
    try {
      const {
        type,
        format = 'csv',
        period = '30d',
        storeId
      } = req.query;

      // Build query
      const dateRange = this.getDateRange(period);
      let matchQuery = {
        createdAt: { $gte: dateRange.start, $lte: dateRange.end }
      };

      if (req.user.role === 'seller') {
        const store = await Store.findOne({ ownerId: req.user._id });
        if (store) {
          matchQuery.storeId = store._id;
        }
      } else if (storeId && req.user.role === 'admin') {
        matchQuery.storeId = mongoose.Types.ObjectId(storeId);
      }

      // Get data based on type
      let data;
      let filename;

      switch (type) {
        case 'orders':
          data = await Order.find(matchQuery)
            .populate('customer', 'firstName lastName email')
            .populate('storeId', 'name')
            .lean();
          filename = `orders_${period}.${format}`;
          break;
        
        case 'products':
          data = await Product.find(matchQuery)
            .populate('storeId', 'name')
            .populate('category', 'name')
            .lean();
          filename = `products_${period}.${format}`;
          break;
        
        case 'customers':
          data = await User.find({
            ...matchQuery,
            role: 'customer'
          }).lean();
          filename = `customers_${period}.${format}`;
          break;
        
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid export type'
          });
      }

      // Format data based on export format
      if (format === 'csv') {
        const csv = this.convertToCSV(data);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.json(data);
      }

    } catch (error) {
      console.error('Error exporting data:', error);
      res.status(500).json({
        success: false,
        message: 'Error exporting data',
        error: error.message
      });
    }
  }

  // Helper methods

  getDateRange(period) {
    const end = new Date();
    let start = new Date();

    switch (period) {
      case '1d':
        start.setDate(end.getDate() - 1);
        break;
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(end.getFullYear() - 1);
        break;
      default:
        start.setDate(end.getDate() - 30);
    }

    return { start, end };
  }

  getGroupByExpression(groupBy, dateField) {
    switch (groupBy) {
      case 'hour':
        return {
          year: { $year: dateField },
          month: { $month: dateField },
          day: { $dayOfMonth: dateField },
          hour: { $hour: dateField }
        };
      case 'day':
        return {
          year: { $year: dateField },
          month: { $month: dateField },
          day: { $dayOfMonth: dateField }
        };
      case 'week':
        return {
          year: { $year: dateField },
          week: { $week: dateField }
        };
      case 'month':
        return {
          year: { $year: dateField },
          month: { $month: dateField }
        };
      case 'year':
        return { year: { $year: dateField } };
      default:
        return {
          year: { $year: dateField },
          month: { $month: dateField },
          day: { $dayOfMonth: dateField }
        };
    }
  }

  async getOverviewMetrics(matchQuery, compareRange) {
    // Current period metrics
    const currentMetrics = await Order.aggregate([
      { $match: { ...matchQuery, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$totalAmount' },
          totalCustomers: { $addToSet: '$customer' }
        }
      },
      {
        $addFields: {
          totalCustomers: { $size: '$totalCustomers' }
        }
      }
    ]);

    const current = currentMetrics[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      totalCustomers: 0
    };

    // Compare with previous period if requested
    let comparison = null;
    if (compareRange) {
      const compareMetrics = await Order.aggregate([
        { 
          $match: { 
            ...matchQuery, 
            createdAt: { $gte: compareRange.start, $lte: compareRange.end },
            status: { $ne: 'cancelled' } 
          } 
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalOrders: { $sum: 1 },
            averageOrderValue: { $avg: '$totalAmount' },
            totalCustomers: { $addToSet: '$customer' }
          }
        }
      ]);

      const previous = compareMetrics[0] || {
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        totalCustomers: 0
      };

      comparison = {
        revenueChange: this.calculatePercentageChange(current.totalRevenue, previous.totalRevenue),
        ordersChange: this.calculatePercentageChange(current.totalOrders, previous.totalOrders),
        aovChange: this.calculatePercentageChange(current.averageOrderValue, previous.averageOrderValue),
        customersChange: this.calculatePercentageChange(current.totalCustomers, previous.totalCustomers)
      };
    }

    return {
      current,
      comparison
    };
  }

  calculatePercentageChange(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  async getRecentActivities(matchQuery, limit) {
    // Get recent orders, new customers, etc.
    const recentOrders = await Order.find(matchQuery)
      .populate('customer', 'firstName lastName')
      .populate('storeId', 'name')
      .sort('-createdAt')
      .limit(limit)
      .lean();

    return recentOrders.map(order => ({
      type: 'order',
      message: `New order #${order.orderNumber} from ${order.customer.firstName} ${order.customer.lastName}`,
      amount: order.totalAmount,
      timestamp: order.createdAt
    }));
  }

  async getTopProducts(matchQuery, limit) {
    return await Order.aggregate([
      { $match: matchQuery },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit }
    ]);
  }

  async getTopCustomers(matchQuery, limit) {
    return await Order.aggregate([
      { $match: { ...matchQuery, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: '$customer',
          totalSpent: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: '$customer' },
      { $sort: { totalSpent: -1 } },
      { $limit: limit }
    ]);
  }

  convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' ? `"${value}"` : value
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  }

  // Additional helper methods would be implemented here for:
  // - getSalesFunnel()
  // - getRevenueMetrics()
  // - getCustomerSegments()
  // - getCustomerRetention()
  // - getProductPerformance()
  // - getInventoryAnalytics()
  // - getCouponAnalytics()
  // - getTrafficSources()
  // - etc.
}

module.exports = new AnalyticsController();
