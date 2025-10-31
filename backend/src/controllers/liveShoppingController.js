const LiveShoppingService = require('../services/liveShoppingService');

/**
 * Live Shopping Controller
 */

exports.createSession = async (req, res) => {
  try {
    const { streamId, storeId } = req.body;
    
    const session = await LiveShoppingService.createShoppingSession(
      streamId,
      req.user._id,
      storeId
    );
    
    res.status(201).json({
      success: true,
      session
    });
    
  } catch (error) {
    console.error('Error creating shopping session:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.startSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await LiveShoppingService.startSession(
      sessionId,
      req.user._id,
      req.app.get('io')
    );
    
    res.json({
      success: true,
      session
    });
    
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.addProduct = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { productId, livePrice, flashSale } = req.body;
    
    const session = await LiveShoppingService.addProduct(
      sessionId,
      req.user._id,
      productId,
      livePrice,
      flashSale,
      req.app.get('io')
    );
    
    res.json({
      success: true,
      session
    });
    
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.pinProduct = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { productId } = req.body;
    
    const session = await LiveShoppingService.pinProduct(
      sessionId,
      req.user._id,
      productId,
      req.app.get('io')
    );
    
    res.json({
      success: true,
      session
    });
    
  } catch (error) {
    console.error('Error pinning product:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.trackInteraction = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { productId, interactionType } = req.body;
    
    await LiveShoppingService.trackInteraction(
      sessionId,
      productId,
      req.user._id,
      interactionType
    );
    
    res.json({
      success: true,
      message: 'Interaction tracked'
    });
    
  } catch (error) {
    console.error('Error tracking interaction:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.placeOrder = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const orderData = req.body;
    
    const result = await LiveShoppingService.placeOrder(
      sessionId,
      req.user._id,
      orderData,
      req.app.get('io')
    );
    
    res.status(201).json({
      success: true,
      session: result.session,
      order: result.order
    });
    
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.createVoucher = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const voucherData = req.body;
    
    const voucher = await LiveShoppingService.createVoucher(
      sessionId,
      req.user._id,
      voucherData,
      req.app.get('io')
    );
    
    res.status(201).json({
      success: true,
      voucher
    });
    
  } catch (error) {
    console.error('Error creating voucher:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.useVoucher = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { voucherCode } = req.body;
    
    const voucher = await LiveShoppingService.useVoucher(sessionId, voucherCode);
    
    res.json({
      success: true,
      voucher
    });
    
  } catch (error) {
    console.error('Error using voucher:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.endSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await LiveShoppingService.endSession(
      sessionId,
      req.user._id,
      req.app.get('io')
    );
    
    res.json({
      success: true,
      session
    });
    
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const LiveShoppingSession = require('../models/LiveShoppingSession');
    const session = await LiveShoppingSession.findOne({ sessionId })
      .populate('host store', 'username avatar fullName name logo')
      .populate('products.product', 'name images price');
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    res.json({
      success: true,
      session
    });
    
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getActiveSessions = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const sessions = await LiveShoppingService.getActiveSessions(parseInt(limit));
    
    res.json({
      success: true,
      sessions
    });
    
  } catch (error) {
    console.error('Error getting active sessions:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getTopSessions = async (req, res) => {
  try {
    const { timeRange = 'week', limit = 10 } = req.query;
    
    const sessions = await LiveShoppingService.getTopSessions(timeRange, parseInt(limit));
    
    res.json({
      success: true,
      sessions
    });
    
  } catch (error) {
    console.error('Error getting top sessions:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const analytics = await LiveShoppingService.getSessionAnalytics(
      sessionId,
      req.user._id
    );
    
    res.json({
      success: true,
      analytics
    });
    
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
