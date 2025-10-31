const PKBattleService = require('../services/pkBattleService');

/**
 * PK Battle Controller
 */

exports.createBattle = async (req, res) => {
  try {
    const { host2Id, stream2Id, duration } = req.body;
    const host1Id = req.user._id;
    
    // Get user's active stream
    const stream1Id = req.body.stream1Id; // Should be current live stream
    
    const battle = await PKBattleService.createBattle(
      host1Id,
      host2Id,
      stream1Id,
      stream2Id,
      duration
    );
    
    res.status(201).json({
      success: true,
      battle
    });
    
  } catch (error) {
    console.error('Error creating battle:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.acceptBattle = async (req, res) => {
  try {
    const { battleId } = req.params;
    
    const battle = await PKBattleService.acceptBattle(
      battleId,
      req.user._id,
      req.app.get('io')
    );
    
    res.json({
      success: true,
      battle
    });
    
  } catch (error) {
    console.error('Error accepting battle:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.sendGift = async (req, res) => {
  try {
    const { battleId } = req.params;
    const { hostNumber, giftId, amount } = req.body;
    
    const battle = await PKBattleService.sendBattleGift(
      battleId,
      req.user._id,
      hostNumber,
      giftId,
      amount,
      req.app.get('io')
    );
    
    res.json({
      success: true,
      battle
    });
    
  } catch (error) {
    console.error('Error sending gift:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getBattle = async (req, res) => {
  try {
    const { battleId } = req.params;
    
    const PKBattle = require('../models/PKBattle');
    const battle = await PKBattle.findOne({ battleId })
      .populate('host1.user host2.user winner', 'username avatar fullName');
    
    if (!battle) {
      return res.status(404).json({
        success: false,
        message: 'Battle not found'
      });
    }
    
    res.json({
      success: true,
      battle
    });
    
  } catch (error) {
    console.error('Error getting battle:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getActiveBattles = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const battles = await PKBattleService.getActiveBattles(parseInt(limit));
    
    res.json({
      success: true,
      battles
    });
    
  } catch (error) {
    console.error('Error getting active battles:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getUserBattles = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;
    
    const battles = await PKBattleService.getUserBattles(userId, parseInt(limit));
    
    res.json({
      success: true,
      battles
    });
    
  } catch (error) {
    console.error('Error getting user battles:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const { timeRange = 'week' } = req.query;
    
    const leaderboard = await PKBattleService.getLeaderboard(timeRange);
    
    res.json({
      success: true,
      leaderboard
    });
    
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.cancelBattle = async (req, res) => {
  try {
    const { battleId } = req.params;
    
    const battle = await PKBattleService.cancelBattle(battleId, req.user._id);
    
    res.json({
      success: true,
      battle
    });
    
  } catch (error) {
    console.error('Error cancelling battle:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
