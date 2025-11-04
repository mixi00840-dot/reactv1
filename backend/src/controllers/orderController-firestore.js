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
}

module.exports = new OrderController();
