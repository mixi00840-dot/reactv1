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

