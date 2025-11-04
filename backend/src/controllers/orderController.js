/**
 * Order Controller - Firestore Migration
 * Handles all order-related operations using Firestore
 */

const {
  findDocuments,
  findById,
  createDocument,
  updateById,
  deleteById,
  FieldValue
} = require('../utils/firestoreHelpers');

class OrderController {
  // Get all orders
  async getOrders(req, res) {
    try {
      const { page = 1, limit = 20, status, userId, storeId } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (userId) filters.userId = userId;
      if (storeId) filters.storeId = storeId;

      // For non-admin users, only show their orders
      if (req.user.role !== 'admin') {
        filters.userId = req.user.id;
      }

      const orders = await findDocuments('orders', filters, {
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        orderBy: 'createdAt',
        direction: 'desc'
      });

      // Enrich with product and store data
      for (let order of orders) {
        if (order.storeId) {
          order.store = await findById('stores', order.storeId);
        }
        if (order.items) {
          for (let item of order.items) {
            if (item.productId) {
              item.product = await findById('products', item.productId);
            }
          }
        }
      }

      res.json({ success: true, data: { orders } });
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ success: false, message: 'Error fetching orders', error: error.message });
    }
  }

  // Get single order
  async getOrder(req, res) {
    try {
      const { id } = req.params;
      const order = await findById('orders', id);

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      // Check authorization
      if (req.user.role !== 'admin' && order.userId !== req.user.id) {
        const store = await findById('stores', order.storeId);
        if (!store || store.ownerId !== req.user.id) {
          return res.status(403).json({ success: false, message: 'Not authorized' });
        }
      }

      // Enrich order data
      if (order.storeId) {
        order.store = await findById('stores', order.storeId);
      }
      if (order.userId) {
        order.user = await findById('users', order.userId);
      }
      if (order.items) {
        for (let item of order.items) {
          if (item.productId) {
            item.product = await findById('products', item.productId);
          }
        }
      }

      res.json({ success: true, data: { order } });
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({ success: false, message: 'Error fetching order', error: error.message });
    }
  }

  // Create order
  async createOrder(req, res) {
    try {
      const { items, shippingAddress, paymentMethod, notes } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Order must have at least one item' });
      }

      // Calculate total
      let subtotal = 0;
      const enrichedItems = [];

      for (let item of items) {
        const product = await findById('products', item.productId);
        if (!product) {
          return res.status(404).json({ success: false, message: `Product ${item.productId} not found` });
        }

        const itemTotal = product.pricing.basePrice * item.quantity;
        subtotal += itemTotal;

        enrichedItems.push({
          productId: item.productId,
          quantity: item.quantity,
          price: product.pricing.basePrice,
          name: product.name,
          image: product.images?.[0] || ''
        });
      }

      const shippingCost = 0; // Calculate based on shipping rules
      const tax = subtotal * 0.1; // 10% tax
      const total = subtotal + shippingCost + tax;

      const order = await createDocument('orders', {
        userId: req.user.id,
        storeId: items[0].storeId || null,
        items: enrichedItems,
        pricing: {
          subtotal,
          shippingCost,
          tax,
          total
        },
        shippingAddress,
        paymentMethod,
        notes: notes || '',
        status: 'pending',
        paymentStatus: 'pending',
        timeline: [{
          status: 'pending',
          timestamp: new Date().toISOString(),
          note: 'Order created'
        }]
      });

      res.status(201).json({ success: true, message: 'Order created successfully', data: { order } });
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ success: false, message: 'Error creating order', error: error.message });
    }
  }

  // Update order status
  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, note } = req.body;

      const order = await findById('orders', id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      // Check authorization
      if (req.user.role !== 'admin') {
        const store = await findById('stores', order.storeId);
        if (!store || store.ownerId !== req.user.id) {
          return res.status(403).json({ success: false, message: 'Not authorized' });
        }
      }

      const timeline = order.timeline || [];
      timeline.push({
        status,
        timestamp: new Date().toISOString(),
        note: note || `Status changed to ${status}`,
        updatedBy: req.user.id
      });

      await updateById('orders', id, {
        status,
        timeline
      });

      res.json({ success: true, message: 'Order status updated successfully' });
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({ success: false, message: 'Error updating order status', error: error.message });
    }
  }

  // Cancel order
  async cancelOrder(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const order = await findById('orders', id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      // Check authorization
      if (req.user.role !== 'admin' && order.userId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      if (order.status === 'delivered' || order.status === 'cancelled') {
        return res.status(400).json({ success: false, message: `Cannot cancel ${order.status} order` });
      }

      const timeline = order.timeline || [];
      timeline.push({
        status: 'cancelled',
        timestamp: new Date().toISOString(),
        note: reason || 'Order cancelled',
        cancelledBy: req.user.id
      });

      await updateById('orders', id, {
        status: 'cancelled',
        timeline
      });

      res.json({ success: true, message: 'Order cancelled successfully' });
    } catch (error) {
      console.error('Error cancelling order:', error);
      res.status(500).json({ success: false, message: 'Error cancelling order', error: error.message });
    }
  }

  // Get order analytics
  async getOrderAnalytics(req, res) {
    try {
      const { startDate, endDate, storeId, granularity = 'day' } = req.query;

      const filters = {};
      if (storeId) filters.storeId = storeId;
      if (req.user.role === 'seller' && !storeId) {
        // Get seller's stores
        const stores = await findDocuments('stores', { ownerId: req.user.id });
        const storeIds = stores.map(s => s.id);
        filters.storeId = { in: storeIds };
      }

      const orders = await findDocuments('orders', filters);

      // Calculate analytics
      const analytics = {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, o) => sum + (o.pricing?.total || 0), 0),
        averageOrderValue: 0,
        statusBreakdown: {},
        periodData: []
      };

      analytics.averageOrderValue = analytics.totalOrders > 0 
        ? analytics.totalRevenue / analytics.totalOrders 
        : 0;

      // Status breakdown
      orders.forEach(order => {
        analytics.statusBreakdown[order.status] = 
          (analytics.statusBreakdown[order.status] || 0) + 1;
      });

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error getting order analytics:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching analytics', 
        error: error.message 
      });
    }
  }

  // Update shipping information
  async updateShipping(req, res) {
    try {
      const { id } = req.params;
      const { trackingNumber, carrier, estimatedDelivery, notes } = req.body;

      const order = await findById('orders', id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      // Check authorization (seller/admin only)
      if (req.user.role !== 'admin') {
        const store = await findById('stores', order.storeId);
        if (!store || store.ownerId !== req.user.id) {
          return res.status(403).json({ success: false, message: 'Not authorized' });
        }
      }

      const timeline = order.timeline || [];
      timeline.push({
        status: 'shipping_updated',
        timestamp: new Date().toISOString(),
        note: notes || 'Shipping information updated',
        updatedBy: req.user.id
      });

      const updates = { timeline };
      if (trackingNumber) updates.trackingNumber = trackingNumber;
      if (carrier) updates.carrier = carrier;
      if (estimatedDelivery) updates.estimatedDelivery = estimatedDelivery;

      await updateById('orders', id, updates);

      res.json({ 
        success: true, 
        message: 'Shipping information updated successfully'
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

  // Process order refund
  async processOrderRefund(req, res) {
    try {
      const { id } = req.params;
      const { amount, reason, method = 'original' } = req.body;

      const order = await findById('orders', id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      // Check authorization (seller/admin only)
      if (req.user.role !== 'admin') {
        const store = await findById('stores', order.storeId);
        if (!store || store.ownerId !== req.user.id) {
          return res.status(403).json({ success: false, message: 'Not authorized' });
        }
      }

      if (amount > order.pricing.total) {
        return res.status(400).json({ 
          success: false, 
          message: 'Refund amount cannot exceed order total' 
        });
      }

      const timeline = order.timeline || [];
      timeline.push({
        status: 'refunded',
        timestamp: new Date().toISOString(),
        note: `Refund processed: $${amount}. Reason: ${reason}`,
        refundAmount: amount,
        refundMethod: method,
        processedBy: req.user.id
      });

      await updateById('orders', id, {
        status: 'refunded',
        timeline,
        refundInfo: {
          amount,
          reason,
          method,
          processedAt: new Date().toISOString(),
          processedBy: req.user.id
        }
      });

      res.json({ 
        success: true, 
        message: 'Refund processed successfully',
        data: { amount, method }
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

  // Bulk update orders
  async bulkUpdateOrders(req, res) {
    try {
      const { orderIds, updates } = req.body;

      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Order IDs array is required' 
        });
      }

      const results = {
        success: 0,
        failed: 0,
        errors: []
      };

      for (const orderId of orderIds) {
        try {
          const order = await findById('orders', orderId);
          if (!order) {
            results.failed++;
            results.errors.push({ orderId, error: 'Order not found' });
            continue;
          }

          await updateById('orders', orderId, {
            ...updates,
            updatedAt: new Date().toISOString(),
            updatedBy: req.user.id
          });

          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({ orderId, error: error.message });
        }
      }

      res.json({ 
        success: true, 
        message: `Bulk update completed: ${results.success} successful, ${results.failed} failed`,
        data: results
      });
    } catch (error) {
      console.error('Error in bulk update:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error performing bulk update', 
        error: error.message 
      });
    }
  }
}

module.exports = new OrderController();
