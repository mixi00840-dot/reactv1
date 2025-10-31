const { CreditPackage, CreditTransaction, UserCreditBalance } = require('../models/Credit');
const { Gift, GiftTransaction } = require('../models/Gift');
const { SupporterBadge, UserBadge, SupporterTier } = require('../models/SupporterBadge');
const { AuditLog } = require('../models/AuditLog');

// ============ Credit Package Controllers ============

// Get all credit packages
exports.getCreditPackages = async (req, res) => {
  try {
    const { status, featured, popular } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (featured) query.featured = featured === 'true';
    if (popular) query.popular = popular === 'true';
    
    const packages = await CreditPackage.find(query)
      .sort({ order: 1, credits: 1 });
    
    res.json({
      success: true,
      data: packages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Purchase credit package
exports.purchaseCreditPackage = async (req, res) => {
  try {
    const { packageId, paymentMethod, paymentTransactionId } = req.body;
    const userId = req.user._id;
    
    // Get package
    const package = await CreditPackage.findById(packageId);
    if (!package || !package.isAvailable) {
      return res.status(404).json({
        success: false,
        message: 'Package not available'
      });
    }
    
    // Get or create user credit balance
    const balance = await UserCreditBalance.getOrCreate(userId);
    
    // Check eligibility
    const eligibility = balance.canPurchasePackage(package);
    if (!eligibility.allowed) {
      return res.status(403).json({
        success: false,
        message: eligibility.reason
      });
    }
    
    // Calculate credits to add
    let creditsToAdd = package.credits + package.bonusCredits;
    
    // First-time purchase bonus
    const isFirstPurchase = balance.lifetime.totalPurchased === 0;
    if (isFirstPurchase && package.firstTimeBonusCredits) {
      creditsToAdd += package.firstTimeBonusCredits;
    }
    
    // Apply tier multiplier
    const tierMultiplier = balance.tierBenefits.bonusCreditsMultiplier || 1;
    const bonusFromTier = Math.floor((package.bonusCredits) * (tierMultiplier - 1));
    creditsToAdd += bonusFromTier;
    
    // Add credits
    const result = await balance.addCredits(creditsToAdd, 'purchase', {
      packageId: package._id,
      packageName: package.name,
      paidAmount: package.price.amount,
      currency: package.price.currency,
      isFirstPurchase,
      tierBonus: bonusFromTier
    });
    
    // Update credit transaction with payment details
    await CreditTransaction.findByIdAndUpdate(result.transaction._id, {
      package: packageId,
      payment: {
        method: paymentMethod,
        transactionId: paymentTransactionId,
        status: 'completed',
        paidAmount: package.price.amount,
        currency: package.price.currency
      }
    });
    
    // Update package stats
    package.stats.totalSold += 1;
    package.stats.totalRevenue += package.price.amount;
    if (package.availability.limitedQuantity) {
      package.availability.soldCount += 1;
    }
    await package.save();
    
    // Update user tier
    await balance.updateTier();
    
    // Audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'purchase_credits',
      entityType: 'credit_package',
      entityId: packageId,
      changes: {
        packageName: package.name,
        credits: creditsToAdd,
        amount: package.price.amount
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.json({
      success: true,
      message: 'Credits purchased successfully',
      data: {
        creditsAdded: creditsToAdd,
        newBalance: result.balance,
        transaction: result.transaction,
        tierBonus: bonusFromTier,
        isFirstPurchase
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get user credit balance
exports.getUserCreditBalance = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    
    const balance = await UserCreditBalance.getOrCreate(userId)
      .populate('user', 'username avatar');
    
    res.json({
      success: true,
      data: balance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get credit transactions history
exports.getCreditTransactions = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const { type, status, limit = 50, page = 1 } = req.query;
    
    const query = { user: userId };
    if (type) query.type = type;
    if (status) query.status = status;
    
    const skip = (page - 1) * limit;
    
    const [transactions, total] = await Promise.all([
      CreditTransaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('package', 'name displayName credits')
        .populate('relatedUser', 'username avatar'),
      CreditTransaction.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============ Gift Controllers ============

// Get all gifts
exports.getGifts = async (req, res) => {
  try {
    const { category, rarity, status, featured, popular, search } = req.query;
    
    const query = {};
    if (category) query.category = category;
    if (rarity) query.rarity = rarity;
    if (status) query.status = status;
    if (featured) query.featured = featured === 'true';
    if (popular) query.popular = popular === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    const gifts = await Gift.find(query)
      .sort({ popular: -1, order: 1 });
    
    res.json({
      success: true,
      data: gifts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get gifts by category
exports.getGiftsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 20 } = req.query;
    
    const gifts = await Gift.getGiftsByCategory(category, parseInt(limit));
    
    res.json({
      success: true,
      data: gifts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get featured gifts
exports.getFeaturedGifts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const gifts = await Gift.getFeaturedGifts(parseInt(limit));
    
    res.json({
      success: true,
      data: gifts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Send gift
exports.sendGift = async (req, res) => {
  try {
    const { giftId, receiverId, quantity = 1, message, anonymous = false, context } = req.body;
    const senderId = req.user._id;
    
    // Validate quantity
    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }
    
    // Get gift
    const gift = await Gift.findById(giftId);
    if (!gift) {
      return res.status(404).json({
        success: false,
        message: 'Gift not found'
      });
    }
    
    // Get sender balance
    const senderBalance = await UserCreditBalance.getOrCreate(senderId);
    
    // Check if user can send
    const canSend = gift.canUserSend(senderBalance, senderBalance.tier);
    if (!canSend.allowed) {
      return res.status(403).json({
        success: false,
        message: canSend.reason
      });
    }
    
    // Calculate total cost
    const totalCost = gift.price * quantity;
    
    // Check sender restrictions
    if (!senderBalance.restrictions.canGift) {
      return res.status(403).json({
        success: false,
        message: 'Gifting is restricted for your account'
      });
    }
    
    // Deduct credits
    const deductResult = await senderBalance.deductCredits(totalCost, 'gift_sent', {
      giftId: gift._id,
      giftName: gift.name,
      receiverId,
      quantity
    });
    
    // Create gift transaction
    const giftTransaction = await GiftTransaction.create({
      gift: giftId,
      sender: senderId,
      receiver: receiverId,
      quantity,
      totalCost,
      message,
      anonymous,
      context,
      creditTransaction: deductResult.transaction._id,
      metadata: {
        deviceType: req.get('user-agent'),
        senderLocation: req.ip
      }
    });
    
    // Mark as delivered
    await giftTransaction.markAsDelivered();
    
    // Update gift stats
    await gift.recordSale();
    
    // Add credits to receiver if gift has receiver benefits
    if (gift.receiverBenefits.creditsBonus) {
      const receiverBalance = await UserCreditBalance.getOrCreate(receiverId);
      await receiverBalance.addCredits(gift.receiverBenefits.creditsBonus, 'gift_received', {
        giftId: gift._id,
        senderId: senderId,
        giftTransactionId: giftTransaction._id
      });
    }
    
    // Audit log
    await AuditLog.create({
      user: senderId,
      action: 'send_gift',
      entityType: 'gift_transaction',
      entityId: giftTransaction._id,
      changes: {
        giftName: gift.name,
        receiverId,
        quantity,
        totalCost
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.json({
      success: true,
      message: 'Gift sent successfully',
      data: {
        transaction: giftTransaction,
        newBalance: deductResult.balance
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get gift transactions
exports.getGiftTransactions = async (req, res) => {
  try {
    const { type, userId } = req.query;
    const limit = parseInt(req.query.limit) || 50;
    
    const targetUserId = userId || req.user._id;
    let transactions;
    
    if (type === 'sent') {
      transactions = await GiftTransaction.getSenderHistory(targetUserId, limit);
    } else if (type === 'received') {
      transactions = await GiftTransaction.getReceiverHistory(targetUserId, limit);
    } else {
      // Get both
      const [sent, received] = await Promise.all([
        GiftTransaction.getSenderHistory(targetUserId, limit / 2),
        GiftTransaction.getReceiverHistory(targetUserId, limit / 2)
      ]);
      transactions = { sent, received };
    }
    
    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get livestream gifts
exports.getLivestreamGifts = async (req, res) => {
  try {
    const { livestreamId } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    
    const gifts = await GiftTransaction.getStreamGifts(livestreamId, limit);
    
    res.json({
      success: true,
      data: gifts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get top gifters for a user
exports.getTopGifters = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    const topGifters = await GiftTransaction.getTopGifters(userId, limit);
    
    res.json({
      success: true,
      data: topGifters
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get gifting leaderboard
exports.getGiftingLeaderboard = async (req, res) => {
  try {
    const { period = 'alltime', limit = 100 } = req.query;
    
    const leaderboard = await GiftTransaction.getLeaderboard(period, parseInt(limit));
    
    res.json({
      success: true,
      data: leaderboard,
      period
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Thank you for gift
exports.thankYouForGift = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { message } = req.body;
    const userId = req.user._id;
    
    const transaction = await GiftTransaction.findById(transactionId);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Gift transaction not found'
      });
    }
    
    if (transaction.receiver.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    await transaction.addThankYou(message);
    
    res.json({
      success: true,
      message: 'Thank you sent',
      data: transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============ Badge Controllers ============

// Get all supporter badges
exports.getSupporterBadges = async (req, res) => {
  try {
    const { category, status, featured } = req.query;
    
    const query = {};
    if (category) query.category = category;
    if (status) query.status = status;
    if (featured) query.featured = featured === 'true';
    
    const badges = await SupporterBadge.find(query)
      .sort({ tier: 1, order: 1 });
    
    res.json({
      success: true,
      data: badges
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get user badges
exports.getUserBadges = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const includeExpired = req.query.includeExpired === 'true';
    
    const badges = await UserBadge.getUserBadges(userId, includeExpired);
    
    res.json({
      success: true,
      data: badges
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Award badge (admin)
exports.awardBadge = async (req, res) => {
  try {
    const { userId, badgeId, note } = req.body;
    
    const result = await UserBadge.awardBadge(userId, badgeId, 'admin', req.user._id);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    // Audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'award_badge',
      entityType: 'user_badge',
      entityId: result.badge._id,
      changes: {
        userId,
        badgeId,
        note
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.json({
      success: true,
      message: 'Badge awarded successfully',
      data: result.badge
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get supporter tiers
exports.getSupporterTiers = async (req, res) => {
  try {
    const tiers = await SupporterTier.find({ status: 'active' })
      .sort({ tier: 1 });
    
    res.json({
      success: true,
      data: tiers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get top spenders leaderboard
exports.getTopSpenders = async (req, res) => {
  try {
    const { period = 'alltime', limit = 10 } = req.query;
    
    const topSpenders = await UserCreditBalance.getTopSpenders(parseInt(limit), period);
    
    res.json({
      success: true,
      data: topSpenders,
      period
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = exports;
