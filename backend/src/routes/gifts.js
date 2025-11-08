const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Gift = require('../models/Gift');
const GiftTransaction = require('../models/GiftTransaction');
const Wallet = require('../models/Wallet');
const { verifyJWT, requireAdmin } = require('../middleware/jwtAuth');

/**
 * Gifts Routes - MongoDB Implementation WITH TRANSACTIONS
 * Ensures atomic operations for financial transactions
 */

/**
 * @route   GET /api/gifts
 * @desc    Get all gifts
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { rarity, category, minPrice, maxPrice, limit = 50 } = req.query;

    const query = { isActive: true };
    if (rarity) query.rarity = rarity;
    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    const gifts = await Gift.find(query)
      .sort({ popularity: -1, price: 1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: { gifts }
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
 * @route   GET /api/gifts/popular
 * @desc    Get popular gifts
 * @access  Public
 */
router.get('/popular', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const gifts = await Gift.find({ isActive: true })
      .sort({ timesSent: -1, popularity: -1 })
      .limit(parseInt(limit));

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

/**
 * @route   GET /api/gifts/:id
 * @desc    Get gift by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const gift = await Gift.findById(req.params.id);

    if (!gift) {
      return res.status(404).json({
        success: false,
        message: 'Gift not found'
      });
    }

    res.json({
      success: true,
      data: { gift }
    });

  } catch (error) {
    console.error('Get gift error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching gift'
    });
  }
});

/**
 * @route   POST /api/gifts
 * @desc    Create new gift (Admin only)
 * @access  Admin
 */
router.post('/', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { name, description, price, icon, animation, category, rarity, creatorEarningsPercent } = req.body;

    const gift = new Gift({
      name,
      description,
      price,
      icon,
      animation,
      category: category || 'standard',
      rarity: rarity || 'common',
      creatorEarningsPercent: creatorEarningsPercent || 70,
      isActive: true,
      isAvailable: true
    });

    await gift.save();

    res.status(201).json({
      success: true,
      data: { gift },
      message: 'Gift created successfully'
    });

  } catch (error) {
    console.error('Create gift error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating gift',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/gifts/:id
 * @desc    Update gift (Admin only)
 * @access  Admin
 */
router.put('/:id', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { name, description, price, icon, animation, category, rarity, creatorEarningsPercent, isActive } = req.body;

    const gift = await Gift.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        price,
        icon,
        animation,
        category,
        rarity,
        creatorEarningsPercent,
        isActive,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!gift) {
      return res.status(404).json({
        success: false,
        message: 'Gift not found'
      });
    }

    res.json({
      success: true,
      data: { gift },
      message: 'Gift updated successfully'
    });

  } catch (error) {
    console.error('Update gift error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating gift',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/gifts/:id
 * @desc    Delete gift (Admin only)
 * @access  Admin
 */
router.delete('/:id', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const gift = await Gift.findByIdAndDelete(req.params.id);

    if (!gift) {
      return res.status(404).json({
        success: false,
        message: 'Gift not found'
      });
    }

    res.json({
      success: true,
      message: 'Gift deleted successfully'
    });

  } catch (error) {
    console.error('Delete gift error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting gift'
    });
  }
});

/**
 * @route   GET /api/gifts/stats/overview
 * @desc    Get gift statistics (Admin only)
 * @access  Admin
 */
router.get('/stats/overview', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const [totalGifts, transactions, topGift] = await Promise.all([
      Gift.countDocuments(),
      GiftTransaction.find({ status: 'completed' }),
      Gift.findOne().sort({ timesSent: -1 }).select('name timesSent')
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const giftsSentToday = transactions.filter(t => new Date(t.createdAt) >= today).length;
    const totalRevenue = transactions.reduce((sum, t) => sum + (t.totalCost || 0), 0);

    res.json({
      success: true,
      data: {
        totalGifts,
        totalRevenue: totalRevenue.toFixed(2),
        giftsSentToday,
        popularGift: topGift?.name || 'N/A'
      }
    });

  } catch (error) {
    console.error('Get gift stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching gift statistics'
    });
  }
});

/**
 * @route   POST /api/gifts/send
 * @desc    Send gift to another user (TRANSACTIONAL - RACE CONDITION SAFE)
 * @access  Private
 */
router.post('/send', verifyJWT, async (req, res) => {
  // Start a MongoDB session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { giftId, recipientId, quantity = 1, context, livestreamId, contentId, message } = req.body;
    const senderId = req.user.id;

    // Validate inputs
    if (!giftId || !recipientId) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Gift ID and recipient ID are required'
      });
    }

    if (quantity < 1 || quantity > 100) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Quantity must be between 1 and 100'
      });
    }

    if (senderId === recipientId) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Cannot send gift to yourself'
      });
    }

    // Get gift (within transaction)
    const gift = await Gift.findById(giftId).session(session);
    if (!gift || !gift.isActive || !gift.isAvailable()) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Gift not available'
      });
    }

    const totalCost = gift.price * quantity;

    // Get sender wallet (with session for locking)
    const senderWallet = await Wallet.findOne({ userId: senderId }).session(session);
    if (!senderWallet) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Sender wallet not found'
      });
    }

    if (senderWallet.balance < totalCost) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Need ${totalCost}, have ${senderWallet.balance}`
      });
    }

    // Deduct from sender (atomic update)
    senderWallet.balance -= totalCost;
    senderWallet.updatedAt = new Date();
    await senderWallet.save({ session });

    // Add to sender's transaction history
    if (!senderWallet.transactions) senderWallet.transactions = [];
    senderWallet.transactions.push({
      type: 'gift_sent',
      amount: -totalCost,
      description: `Sent ${quantity}x ${gift.name} to user`,
      relatedId: recipientId,
      createdAt: new Date()
    });

    // Get or create recipient wallet
    let recipientWallet = await Wallet.findOne({ userId: recipientId }).session(session);
    if (!recipientWallet) {
      recipientWallet = new Wallet({
        userId: recipientId,
        balance: 0,
        currency: 'USD'
      });
    }

    // Calculate earnings (platform takes a cut)
    const creatorEarnings = (totalCost * (gift.creatorEarningsPercent || 70)) / 100;
    const platformFee = totalCost - creatorEarnings;

    // Add to recipient (atomic update)
    recipientWallet.balance += creatorEarnings;
    recipientWallet.updatedAt = new Date();
    await recipientWallet.save({ session });

    // Add to recipient's transaction history
    if (!recipientWallet.transactions) recipientWallet.transactions = [];
    recipientWallet.transactions.push({
      type: 'gift_received',
      amount: creatorEarnings,
      description: `Received ${quantity}x ${gift.name}`,
      relatedId: senderId,
      createdAt: new Date()
    });

    // Create gift transaction record
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
      platformFee,
      giftName: gift.name,
      giftIcon: gift.icon,
      giftAnimation: gift.animation,
      message,
      status: 'completed',
      createdAt: new Date()
    });

    await giftTransaction.save({ session });

    // Update gift stats (atomic increment)
    await Gift.findByIdAndUpdate(
      giftId,
      {
        $inc: {
          timesSent: quantity,
          popularity: quantity,
          totalRevenue: totalCost
        }
      },
      { session }
    );

    // Commit transaction
    await session.commitTransaction();

    // Emit socket event for real-time notification (outside transaction)
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${recipientId}`).emit('gift:received', {
        gift: {
          id: gift._id,
          name: gift.name,
          icon: gift.icon,
          animation: gift.animation
        },
        sender: {
          id: senderId,
          username: req.user.username
        },
        quantity,
        earnings: creatorEarnings,
        livestreamId,
        contentId,
        message
      });
    }

    res.json({
      success: true,
      data: {
        transaction: giftTransaction,
        newBalance: senderWallet.balance,
        recipientEarnings: creatorEarnings
      },
      message: 'Gift sent successfully'
    });

  } catch (error) {
    // Rollback transaction on error
    await session.abortTransaction();
    console.error('Send gift error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending gift',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  } finally {
    // End session
    session.endSession();
  }
});

module.exports = router;

