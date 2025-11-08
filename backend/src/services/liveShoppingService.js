const LiveShoppingSession = require('../models/LiveShoppingSession');
const LiveStream = require('../models/Livestream');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Notification = require('../models/Notification');

/**
 * Live Shopping Service
 * 
 * Handles live commerce features during livestreams
 */

class LiveShoppingService {
  /**
   * Create shopping session
   */
  static async createShoppingSession(streamId, hostId, storeId = null) {
    try {
      const stream = await LiveStream.findById(streamId);
      
      if (!stream) {
        throw new Error('Stream not found');
      }
      
      if (stream.user.toString() !== hostId.toString()) {
        throw new Error('Not authorized');
      }
      
      const session = await LiveShoppingSession.create({
        stream: streamId,
        host: hostId,
        store: storeId,
        status: 'scheduled'
      });
      
      await session.populate('host store', 'username avatar fullName name logo');
      
      return session;
      
    } catch (error) {
      console.error('Error creating shopping session:', error);
      throw error;
    }
  }
  
  /**
   * Start shopping session
   */
  static async startSession(sessionId, hostId, io = null) {
    try {
      const session = await LiveShoppingSession.findOne({ sessionId });
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      if (session.host.toString() !== hostId.toString()) {
        throw new Error('Not authorized');
      }
      
      await session.startSession();
      
      // Notify followers
      if (io) {
        io.emit('shopping:session-started', {
          sessionId: session.sessionId,
          host: hostId
        });
      }
      
      return session;
      
    } catch (error) {
      console.error('Error starting shopping session:', error);
      throw error;
    }
  }
  
  /**
   * Add product to session
   */
  static async addProduct(sessionId, hostId, productId, livePrice = null, flashSale = null, io = null) {
    try {
      const session = await LiveShoppingSession.findOne({ sessionId });
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      if (session.host.toString() !== hostId.toString()) {
        throw new Error('Not authorized');
      }
      
      const product = await Product.findById(productId);
      
      if (!product) {
        throw new Error('Product not found');
      }
      
      await session.addProduct(productId, livePrice, flashSale);
      
      // Notify viewers
      if (io) {
        io.to(`stream_${session.stream}`).emit('shopping:product-added', {
          sessionId,
          product: await product.populate('images')
        });
      }
      
      return session;
      
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  }
  
  /**
   * Pin product (showcase)
   */
  static async pinProduct(sessionId, hostId, productId, io = null) {
    try {
      const session = await LiveShoppingSession.findOne({ sessionId });
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      if (session.host.toString() !== hostId.toString()) {
        throw new Error('Not authorized');
      }
      
      await session.pinProduct(productId);
      
      // Notify viewers
      if (io) {
        io.to(`stream_${session.stream}`).emit('shopping:product-pinned', {
          sessionId,
          productId
        });
      }
      
      return session;
      
    } catch (error) {
      console.error('Error pinning product:', error);
      throw error;
    }
  }
  
  /**
   * Track product interaction
   */
  static async trackInteraction(sessionId, productId, userId, interactionType) {
    try {
      const session = await LiveShoppingSession.findOne({ sessionId });
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      await session.trackProductInteraction(productId, interactionType);
      
      return session;
      
    } catch (error) {
      console.error('Error tracking interaction:', error);
      throw error;
    }
  }
  
  /**
   * Place order during live session
   */
  static async placeOrder(sessionId, userId, orderData, io = null) {
    try {
      const session = await LiveShoppingSession.findOne({ sessionId });
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      if (session.status !== 'active') {
        throw new Error('Shopping session is not active');
      }
      
      // Create order
      const order = await Order.create({
        ...orderData,
        user: userId,
        metadata: {
          source: 'live-shopping',
          sessionId: session.sessionId,
          streamId: session.stream
        }
      });
      
      // Add order to session
      await session.addOrder(order._id, orderData.total);
      
      // Track product purchases
      for (const item of orderData.items) {
        await session.trackProductInteraction(item.product, 'purchase');
        
        // Update flash sale if applicable
        const productInSession = session.products.find(
          p => p.product.toString() === item.product.toString()
        );
        
        if (productInSession && productInSession.flashSale && productInSession.flashSale.enabled) {
          productInSession.flashSale.sold += item.quantity;
          
          // Check if flash sale is sold out
          if (productInSession.flashSale.sold >= productInSession.flashSale.quantity) {
            if (io) {
              io.to(`stream_${session.stream}`).emit('shopping:flash-sale-sold-out', {
                sessionId,
                productId: item.product
              });
            }
          }
        }
      }
      
      await session.save();
      
      // Notify host
      if (io) {
        io.to(`user_${session.host}`).emit('shopping:order-placed', {
          sessionId,
          order: order._id,
          total: orderData.total
        });
        
        // Show order animation to all viewers
        io.to(`stream_${session.stream}`).emit('shopping:order-animation', {
          buyer: userId,
          total: orderData.total
        });
      }
      
      return { session, order };
      
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  }
  
  /**
   * Create voucher for session
   */
  static async createVoucher(sessionId, hostId, voucherData, io = null) {
    try {
      const session = await LiveShoppingSession.findOne({ sessionId });
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      if (session.host.toString() !== hostId.toString()) {
        throw new Error('Not authorized');
      }
      
      const voucher = await session.createVoucher(voucherData);
      
      // Notify all viewers
      if (io) {
        io.to(`stream_${session.stream}`).emit('shopping:voucher-available', {
          sessionId,
          voucher: {
            code: voucher.code,
            discount: voucher.discount,
            type: voucher.type,
            expiresAt: voucher.expiresAt
          }
        });
      }
      
      return voucher;
      
    } catch (error) {
      console.error('Error creating voucher:', error);
      throw error;
    }
  }
  
  /**
   * Use voucher
   */
  static async useVoucher(sessionId, voucherCode) {
    try {
      const session = await LiveShoppingSession.findOne({ sessionId });
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      const voucher = await session.useVoucher(voucherCode);
      
      return voucher;
      
    } catch (error) {
      console.error('Error using voucher:', error);
      throw error;
    }
  }
  
  /**
   * End shopping session
   */
  static async endSession(sessionId, hostId, io = null) {
    try {
      const session = await LiveShoppingSession.findOne({ sessionId });
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      if (session.host.toString() !== hostId.toString()) {
        throw new Error('Not authorized');
      }
      
      await session.endSession();
      
      // Notify viewers
      if (io) {
        io.to(`stream_${session.stream}`).emit('shopping:session-ended', {
          sessionId,
          stats: session.stats
        });
      }
      
      return session;
      
    } catch (error) {
      console.error('Error ending shopping session:', error);
      throw error;
    }
  }
  
  /**
   * Get active shopping sessions
   */
  static async getActiveSessions(limit = 20) {
    try {
      return await LiveShoppingSession.getActiveSessions(limit);
    } catch (error) {
      console.error('Error getting active sessions:', error);
      throw error;
    }
  }
  
  /**
   * Get top performing sessions
   */
  static async getTopSessions(timeRange = 'week', limit = 10) {
    try {
      return await LiveShoppingSession.getTopSessions(timeRange, limit);
    } catch (error) {
      console.error('Error getting top sessions:', error);
      throw error;
    }
  }
  
  /**
   * Get session analytics
   */
  static async getSessionAnalytics(sessionId, hostId) {
    try {
      const session = await LiveShoppingSession.findOne({ sessionId })
        .populate('products.product', 'name images price')
        .populate('orders', 'total status createdAt');
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      if (session.host.toString() !== hostId.toString()) {
        throw new Error('Not authorized');
      }
      
      // Calculate detailed analytics
      const analytics = {
        overview: {
          totalRevenue: session.stats.totalRevenue,
          totalOrders: session.stats.totalOrders,
          averageOrderValue: session.stats.averageOrderValue,
          conversionRate: session.stats.conversionRate,
          totalViewers: session.stats.totalViewers,
          peakViewers: session.stats.peakViewers
        },
        products: session.products.map(p => ({
          product: p.product,
          stats: p.stats,
          revenue: p.stats.revenue,
          conversionRate: p.stats.views > 0 
            ? (p.stats.purchased / p.stats.views * 100).toFixed(2)
            : 0
        })).sort((a, b) => b.revenue - a.revenue),
        vouchers: session.vouchers.map(v => ({
          code: v.code,
          discount: v.discount,
          used: v.used,
          usageLimit: v.usageLimit,
          usageRate: (v.used / v.usageLimit * 100).toFixed(2)
        })),
        engagement: session.engagement
      };
      
      return analytics;
      
    } catch (error) {
      console.error('Error getting session analytics:', error);
      throw error;
    }
  }
}

module.exports = LiveShoppingService;
