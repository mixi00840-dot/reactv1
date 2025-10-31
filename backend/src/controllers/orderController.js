const Order = require('../models/Order');
const Product = require('../models/Product');
const Store = require('../models/Store');
const User = require('../models/User');
const { Transaction } = require('../models/Transaction');
const { Wallet } = require('../models/Wallet');
const { validationResult } = require('express-validator');

class OrderController {
  // Get orders with filtering and pagination
  async getOrders(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        sort = '-createdAt',
        status,
        storeId,
        customerId,
        startDate,
        endDate,
        search,
        paymentStatus,
        shippingStatus,
        minAmount,
        maxAmount
      } = req.query;

      // Build query based on user role
      let query = {};
      
      if (req.user.role === 'customer') {
        // Customers can only see their own orders
        query.customer = req.user._id;
      } else if (req.user.role === 'seller') {
        // Sellers can only see orders for their store
        const store = await Store.findOne({ ownerId: req.user._id });
        if (!store) {
          return res.status(404).json({
            success: false,
            message: 'Store not found'
          });
        }
        query.storeId = store._id;
      }
      // Admins can see all orders (no additional query restrictions)

      // Apply filters
      if (status) {
        query.status = status;
      }

      if (storeId && req.user.role === 'admin') {
        query.storeId = storeId;
      }

      if (customerId && ['admin', 'seller'].includes(req.user.role)) {
        query.customer = customerId;
      }

      if (paymentStatus) {
        query['payment.status'] = paymentStatus;
      }

      if (shippingStatus) {
        query['shipping.status'] = shippingStatus;
      }

      // Date range filter
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      // Amount range filter
      if (minAmount || maxAmount) {
        query['totals.finalTotal'] = {};
        if (minAmount) query['totals.finalTotal'].$gte = parseFloat(minAmount);
        if (maxAmount) query['totals.finalTotal'].$lte = parseFloat(maxAmount);
      }

      // Search filter (order number, customer name, etc.)
      if (search) {
        query.$or = [
          { orderNumber: new RegExp(search, 'i') },
          { 'addresses.shipping.fullName': new RegExp(search, 'i') },
          { 'addresses.billing.fullName': new RegExp(search, 'i') }
        ];
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Execute query
      const orders = await Order.find(query)
        .populate('customer', 'firstName lastName email avatar')
        .populate('storeId', 'name slug businessInfo.businessName')
        .populate('items.product', 'name slug images')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      // Get total count
      const total = await Order.countDocuments(query);
      
      // Calculate pagination info
      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        success: true,
        data: {
          orders,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: total,
            itemsPerPage: parseInt(limit),
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1
          },
          filters: {
            status,
            storeId,
            customerId,
            startDate,
            endDate,
            paymentStatus,
            shippingStatus
          }
        }
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching orders',
        error: error.message
      });
    }
  }

  // Get single order by ID
  async getOrder(req, res) {
    try {
      const { id } = req.params;
      
      // Build query based on user role
      let query = { _id: id };
      
      if (req.user.role === 'customer') {
        query.customer = req.user._id;
      } else if (req.user.role === 'seller') {
        const store = await Store.findOne({ ownerId: req.user._id });
        if (!store) {
          return res.status(404).json({
            success: false,
            message: 'Store not found'
          });
        }
        query.storeId = store._id;
      }

      const order = await Order.findOne(query)
        .populate('customer', 'firstName lastName email avatar phone')
        .populate('storeId', 'name slug businessInfo')
        .populate('items.product', 'name slug images pricing')
        .populate('refunds.processedBy', 'firstName lastName')
        .populate('events.triggeredBy', 'firstName lastName');

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Get related transactions
      const transactions = await Transaction.find({ orderId: order._id })
        .sort('-createdAt');

      res.json({
        success: true,
        data: {
          order,
          transactions
        }
      });
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching order',
        error: error.message
      });
    }
  }

  // Update order status (seller/admin only)
  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes, trackingNumber, estimatedDelivery } = req.body;

      // Validate status
      const validStatuses = [
        'pending', 'confirmed', 'processing', 'shipped', 
        'delivered', 'cancelled', 'refunded', 'disputed'
      ];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid order status'
        });
      }

      // Find order with permission check
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

      const order = await Order.findOne(query);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Validate status transition
      const canTransition = this.canTransitionStatus(order.status, status);
      if (!canTransition) {
        return res.status(400).json({
          success: false,
          message: `Cannot transition from ${order.status} to ${status}`
        });
      }

      // Update order status
      const previousStatus = order.status;
      order.status = status;

      // Update shipping info if provided
      if (trackingNumber) {
        order.shipping.trackingNumber = trackingNumber;
        order.shipping.status = 'shipped';
        order.shipping.shippedAt = new Date();
      }

      if (estimatedDelivery) {
        order.shipping.estimatedDelivery = new Date(estimatedDelivery);
      }

      // Add status change event
      order.events.push({
        type: 'status_change',
        description: `Order status changed from ${previousStatus} to ${status}`,
        triggeredBy: req.user._id,
        metadata: {
          previousStatus,
          newStatus: status,
          notes
        }
      });

      // Handle specific status changes
      await this.handleStatusChange(order, status, previousStatus);

      await order.save();

      // Send notifications (would integrate with notification service)
      await this.sendOrderStatusNotification(order, status, previousStatus);

      res.json({
        success: true,
        message: 'Order status updated successfully',
        data: order
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating order status',
        error: error.message
      });
    }
  }

  // Cancel order (customer/seller/admin)
  async cancelOrder(req, res) {
    try {
      const { id } = req.params;
      const { reason, refundMethod = 'original' } = req.body;

      // Find order with permission check
      let query = { _id: id };
      
      if (req.user.role === 'customer') {
        query.customer = req.user._id;
      } else if (req.user.role === 'seller') {
        const store = await Store.findOne({ ownerId: req.user._id });
        if (!store) {
          return res.status(404).json({
            success: false,
            message: 'Store not found'
          });
        }
        query.storeId = store._id;
      }

      const order = await Order.findOne(query).populate('items.product');
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Check if order can be cancelled
      if (!['pending', 'confirmed', 'processing'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: 'Order cannot be cancelled at this stage'
        });
      }

      // Cancel the order
      const previousStatus = order.status;
      order.status = 'cancelled';
      order.cancelledAt = new Date();
      order.cancelledBy = req.user._id;
      order.cancellationReason = reason;

      // Add cancellation event
      order.events.push({
        type: 'cancelled',
        description: `Order cancelled by ${req.user.role}`,
        triggeredBy: req.user._id,
        metadata: {
          reason,
          previousStatus,
          refundMethod
        }
      });

      // Restore inventory
      for (const item of order.items) {
        await item.product.releaseStock(item.quantity, item.variant, 'order_cancelled');
      }

      // Process refund if payment was completed
      if (order.payment.status === 'completed') {
        const refundResult = await this.processRefund(order, order.totals.finalTotal, 'full', refundMethod);
        
        if (refundResult.success) {
          order.refunds.push({
            amount: order.totals.finalTotal,
            reason: 'order_cancelled',
            method: refundMethod,
            status: 'completed',
            processedBy: req.user._id,
            processedAt: new Date(),
            transactionId: refundResult.transactionId
          });

          order.payment.refundedAmount = order.totals.finalTotal;
          order.payment.status = 'refunded';
        }
      }

      await order.save();

      res.json({
        success: true,
        message: 'Order cancelled successfully',
        data: order
      });
    } catch (error) {
      console.error('Error cancelling order:', error);
      res.status(500).json({
        success: false,
        message: 'Error cancelling order',
        error: error.message
      });
    }
  }

  // Process refund (seller/admin only)
  async processOrderRefund(req, res) {
    try {
      const { id } = req.params;
      const { amount, reason, method = 'original', items = [] } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid refund amount is required'
        });
      }

      // Find order with permission check
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

      const order = await Order.findOne(query).populate('items.product');
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Validate refund amount
      const totalRefunded = order.refunds.reduce((sum, refund) => 
        refund.status === 'completed' ? sum + refund.amount : sum, 0
      );
      
      if (totalRefunded + amount > order.totals.finalTotal) {
        return res.status(400).json({
          success: false,
          message: 'Refund amount exceeds order total'
        });
      }

      // Process the refund
      const refundResult = await this.processRefund(order, amount, 'partial', method);
      
      if (!refundResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Refund processing failed',
          error: refundResult.error
        });
      }

      // Add refund record
      order.refunds.push({
        amount,
        reason,
        method,
        status: 'completed',
        processedBy: req.user._id,
        processedAt: new Date(),
        transactionId: refundResult.transactionId,
        items: items // Items being refunded
      });

      // Update payment status
      order.payment.refundedAmount = totalRefunded + amount;
      if (order.payment.refundedAmount >= order.totals.finalTotal) {
        order.payment.status = 'refunded';
        order.status = 'refunded';
      }

      // Add refund event
      order.events.push({
        type: 'refund_processed',
        description: `Refund of $${amount} processed`,
        triggeredBy: req.user._id,
        metadata: {
          amount,
          reason,
          method,
          transactionId: refundResult.transactionId
        }
      });

      // Restore inventory for refunded items
      if (items.length > 0) {
        for (const refundItem of items) {
          const orderItem = order.items.find(item => 
            item._id.toString() === refundItem.itemId
          );
          
          if (orderItem) {
            await orderItem.product.addStock(
              refundItem.quantity, 
              orderItem.variant, 
              'refund_return'
            );
          }
        }
      }

      await order.save();

      res.json({
        success: true,
        message: 'Refund processed successfully',
        data: {
          order,
          refund: {
            amount,
            transactionId: refundResult.transactionId,
            method
          }
        }
      });
    } catch (error) {
      console.error('Error processing refund:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing refund',
        error: error.message
      });
    }
  }

  // Update shipping information (seller/admin only)
  async updateShipping(req, res) {
    try {
      const { id } = req.params;
      const { 
        trackingNumber, 
        carrier, 
        estimatedDelivery, 
        notes,
        shippingAddress 
      } = req.body;

      // Find order with permission check
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

      const order = await Order.findOne(query);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Update shipping information
      if (trackingNumber) {
        order.shipping.trackingNumber = trackingNumber;
        
        // Auto-update status to shipped if not already
        if (order.shipping.status === 'pending') {
          order.shipping.status = 'shipped';
          order.shipping.shippedAt = new Date();
          
          if (order.status === 'processing') {
            order.status = 'shipped';
          }
        }
      }

      if (carrier) {
        order.shipping.carrier = carrier;
      }

      if (estimatedDelivery) {
        order.shipping.estimatedDelivery = new Date(estimatedDelivery);
      }

      if (notes) {
        order.shipping.notes = notes;
      }

      if (shippingAddress) {
        order.addresses.shipping = { ...order.addresses.shipping, ...shippingAddress };
      }

      // Add tracking event
      if (trackingNumber) {
        order.events.push({
          type: 'tracking_updated',
          description: `Tracking number added: ${trackingNumber}`,
          triggeredBy: req.user._id,
          metadata: {
            trackingNumber,
            carrier
          }
        });
      }

      await order.save();

      res.json({
        success: true,
        message: 'Shipping information updated successfully',
        data: order
      });
    } catch (error) {
      console.error('Error updating shipping:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating shipping information',
        error: error.message
      });
    }
  }

  // Get order analytics (seller/admin only)
  async getOrderAnalytics(req, res) {
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
      } else if (storeId && req.user.role === 'admin') {
        matchQuery.storeId = mongoose.Types.ObjectId(storeId);
      }

      // Date range
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      matchQuery.createdAt = { $gte: start, $lte: end };

      // Analytics aggregation
      const analytics = await Order.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              status: "$status"
            },
            count: { $sum: 1 },
            revenue: { $sum: "$totals.finalTotal" },
            averageOrderValue: { $avg: "$totals.finalTotal" }
          }
        },
        { $sort: { "_id.date": 1 } }
      ]);

      // Status distribution
      const statusDistribution = await Order.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            revenue: { $sum: "$totals.finalTotal" }
          }
        }
      ]);

      // Top products
      const topProducts = await Order.aggregate([
        { $match: matchQuery },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.product",
            totalSold: { $sum: "$items.quantity" },
            revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
          }
        },
        { $sort: { totalSold: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product"
          }
        },
        { $unwind: "$product" }
      ]);

      // Calculate summary metrics
      const totalOrders = analytics.reduce((sum, item) => sum + item.count, 0);
      const totalRevenue = analytics.reduce((sum, item) => sum + item.revenue, 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      res.json({
        success: true,
        data: {
          summary: {
            totalOrders,
            totalRevenue,
            averageOrderValue: Math.round(averageOrderValue * 100) / 100
          },
          analytics,
          statusDistribution,
          topProducts,
          period: {
            startDate: start,
            endDate: end
          }
        }
      });
    } catch (error) {
      console.error('Error fetching order analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching order analytics',
        error: error.message
      });
    }
  }

  // Bulk update orders (admin only)
  async bulkUpdateOrders(req, res) {
    try {
      const { orderIds, updates } = req.body;

      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Order IDs array is required'
        });
      }

      // Validate updates
      const allowedUpdates = ['status', 'shipping.carrier', 'shipping.estimatedDelivery'];
      const updateKeys = Object.keys(updates);
      
      if (!updateKeys.every(key => allowedUpdates.includes(key))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid update fields'
        });
      }

      // Update orders
      const result = await Order.updateMany(
        { _id: { $in: orderIds } },
        { 
          $set: updates,
          $push: {
            events: {
              type: 'bulk_update',
              description: 'Bulk update applied',
              triggeredBy: req.user._id,
              timestamp: new Date(),
              metadata: updates
            }
          }
        }
      );

      res.json({
        success: true,
        message: `${result.modifiedCount} orders updated successfully`,
        data: {
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount
        }
      });
    } catch (error) {
      console.error('Error bulk updating orders:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating orders',
        error: error.message
      });
    }
  }

  // Helper methods

  canTransitionStatus(currentStatus, newStatus) {
    const transitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['processing', 'cancelled'],
      'processing': ['shipped', 'cancelled'],
      'shipped': ['delivered', 'cancelled'],
      'delivered': ['disputed', 'refunded'],
      'cancelled': [],
      'refunded': [],
      'disputed': ['resolved', 'refunded']
    };

    return transitions[currentStatus]?.includes(newStatus) || false;
  }

  async handleStatusChange(order, newStatus, previousStatus) {
    switch (newStatus) {
      case 'confirmed':
        // Send confirmation email
        break;
      case 'shipped':
        order.shipping.shippedAt = new Date();
        break;
      case 'delivered':
        order.shipping.deliveredAt = new Date();
        // Release any holds on payment
        break;
      case 'cancelled':
        // Handle cancellation logic
        break;
    }
  }

  async processRefund(order, amount, type, method) {
    try {
      // This would integrate with actual payment processors
      // For now, simulate refund processing
      
      if (method === 'wallet') {
        // Refund to user's wallet
        const wallet = await Wallet.findByUser(order.customer);
        if (wallet) {
          await wallet.credit(amount, 'Order refund', order.orderNumber);
        }
      }

      return {
        success: true,
        transactionId: `REF-${Date.now()}`,
        method,
        amount
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendOrderStatusNotification(order, newStatus, previousStatus) {
    // This would integrate with notification service
    // Send email, SMS, push notifications etc.
    console.log(`Order ${order.orderNumber} status changed from ${previousStatus} to ${newStatus}`);
  }
}

module.exports = new OrderController();
