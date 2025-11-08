const express = require('express');
const router = express.Router();
const Gift = require('../models/Gift');
const GiftTransaction = require('../models/GiftTransaction');
const Wallet = require('../models/Wallet');
const { verifyJWT, requireAdmin } = require('../middleware/jwtAuth');

/**
 * Gifts Routes - MongoDB Implementation
 */

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Gifts API is working (MongoDB)',
    database: 'MongoDB'
  });
});

/**
 * @route   GET /api/gifts
 * @desc    Get all gifts
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { category, featured, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    let query = { isActive: true };
    if (category) query.category = category;
    if (featured === 'true') query.isFeatured = true;

    const gifts = await Gift.find(query)
      .sort({ sortOrder: 1, popularity: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Gift.countDocuments(query);

    res.json({
      success: true,
      data: {
        gifts,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get gifts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching gifts'
    });
  }
});

/**
 * @route   POST /api/gifts/send
 * @desc    Send gift to another user
 * @access  Private
 */
router.post('/send', verifyJWT, async (req, res) => {
  try {
    const { giftId, recipientId, quantity = 1, context, livestreamId, contentId, message } = req.body;
    const senderId = req.userId;

    // Get gift
    const gift = await Gift.findById(giftId);
    if (!gift || !gift.isAvailable()) {
      return res.status(404).json({
        success: false,
        message: 'Gift not available'
      });
    }

    const totalCost = gift.price * quantity;

    // Get sender wallet
    const senderWallet = await Wallet.findOne({ userId: senderId });
    if (!senderWallet || senderWallet.balance < totalCost) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    // Deduct from sender
    await senderWallet.deductFunds(totalCost, `Sent ${quantity}x ${gift.name} to user`);

    // Add to recipient
    let recipientWallet = await Wallet.findOne({ userId: recipientId });
    if (!recipientWallet) {
      recipientWallet = new Wallet({ userId: recipientId });
    }

    const creatorEarnings = (totalCost * gift.creatorEarningsPercent) / 100;
    await recipientWallet.addFunds(creatorEarnings, `Received ${quantity}x ${gift.name}`);

    // Create gift transaction
    const giftTransaction = new GiftTransaction({
      giftId,
      senderId,
      recipientId,
      context: context || 'profile',
      livestreamId,
      contentId,
      quantity,
      unitPrice: gift.price,
      totalCost,
      creatorEarnings,
      platformFee: totalCost - creatorEarnings,
      giftName: gift.name,
      giftIcon: gift.icon,
      giftAnimation: gift.animation,
      message
    });

    await giftTransaction.save();

    // Update gift stats
    gift.timesSent += quantity;
    gift.popularity += quantity;
    gift.totalRevenue += totalCost;
    await gift.save();

    res.json({
      success: true,
      data: { transaction: giftTransaction },
      message: 'Gift sent successfully'
    });

  } catch (error) {
    console.error('Send gift error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending gift',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/gifts/popular
 * @desc    Get popular gifts
 * @access  Public
 */
router.get('/popular', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const gifts = await Gift.getPopularGifts(parseInt(limit));

    res.json({
      success: true,
      data: { gifts }
    });

  } catch (error) {
    console.error('Get popular gifts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching popular gifts'
    });
  }
});

module.exports = router;

