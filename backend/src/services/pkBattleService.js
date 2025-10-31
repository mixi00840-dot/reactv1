const PKBattle = require('../models/PKBattle');
const LiveStream = require('../models/LiveStream');
const GiftTransaction = require('../models/GiftTransaction');
const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * PK Battle Service
 * 
 * Handles competitive live streaming battles between hosts
 */

class PKBattleService {
  /**
   * Create PK battle
   */
  static async createBattle(host1Id, host2Id, stream1Id, stream2Id, duration = 300) {
    try {
      // Verify both streams exist and are live
      const stream1 = await LiveStream.findById(stream1Id);
      const stream2 = await LiveStream.findById(stream2Id);
      
      if (!stream1 || !stream2) {
        throw new Error('One or both streams not found');
      }
      
      if (stream1.status !== 'live' || stream2.status !== 'live') {
        throw new Error('Both streams must be live');
      }
      
      // Create battle
      const battle = await PKBattle.create({
        host1: {
          user: host1Id,
          stream: stream1Id,
          score: 0,
          gifts: []
        },
        host2: {
          user: host2Id,
          stream: stream2Id,
          score: 0,
          gifts: []
        },
        duration,
        status: 'pending'
      });
      
      await battle.populate('host1.user host2.user', 'username avatar fullName');
      
      // Notify host2
      await Notification.create({
        user: host2Id,
        type: 'system',
        actor: host1Id,
        title: 'PK Battle Challenge',
        body: 'You have been challenged to a PK battle!',
        actionUrl: `/battle/${battle.battleId}`,
        priority: 'high'
      });
      
      return battle;
      
    } catch (error) {
      console.error('Error creating battle:', error);
      throw error;
    }
  }
  
  /**
   * Accept battle challenge
   */
  static async acceptBattle(battleId, host2Id, io = null) {
    try {
      const battle = await PKBattle.findOne({ battleId });
      
      if (!battle) {
        throw new Error('Battle not found');
      }
      
      if (battle.host2.user.toString() !== host2Id.toString()) {
        throw new Error('Not authorized');
      }
      
      if (battle.status !== 'pending') {
        throw new Error('Battle is not in pending state');
      }
      
      // Start the battle
      await battle.startBattle();
      
      // Notify both hosts and viewers
      if (io) {
        io.to(`stream_${battle.host1.stream}`).emit('battle:started', battle);
        io.to(`stream_${battle.host2.stream}`).emit('battle:started', battle);
      }
      
      // Schedule battle end
      setTimeout(async () => {
        await this.endBattle(battleId, io);
      }, battle.duration * 1000);
      
      return battle;
      
    } catch (error) {
      console.error('Error accepting battle:', error);
      throw error;
    }
  }
  
  /**
   * Send gift in battle
   */
  static async sendBattleGift(battleId, senderId, hostNumber, giftId, amount, io = null) {
    try {
      const battle = await PKBattle.findOne({ battleId });
      
      if (!battle) {
        throw new Error('Battle not found');
      }
      
      if (battle.status !== 'active') {
        throw new Error('Battle is not active');
      }
      
      // Get gift value
      const giftTransaction = await GiftTransaction.findOne({ gift: giftId }).populate('gift');
      const giftValue = giftTransaction.gift.value * amount;
      
      // Add gift to host's score
      await battle.addGift(hostNumber, {
        giftId,
        senderId,
        amount,
        value: giftValue
      });
      
      // Emit real-time update
      if (io) {
        io.to(`battle_${battleId}`).emit('battle:gift', {
          battleId,
          hostNumber,
          sender: senderId,
          gift: giftId,
          amount,
          value: giftValue,
          host1Score: battle.host1.score,
          host2Score: battle.host2.score
        });
      }
      
      return battle;
      
    } catch (error) {
      console.error('Error sending battle gift:', error);
      throw error;
    }
  }
  
  /**
   * End battle
   */
  static async endBattle(battleId, io = null) {
    try {
      const battle = await PKBattle.findOne({ battleId });
      
      if (!battle) {
        throw new Error('Battle not found');
      }
      
      if (battle.status !== 'active') {
        throw new Error('Battle is not active');
      }
      
      // Complete battle and determine winner
      await battle.completeBattle();
      
      await battle.populate('winner host1.user host2.user', 'username avatar fullName');
      
      // Award rewards
      if (battle.winner) {
        const winnerId = battle.winner.toString();
        const loserId = winnerId === battle.host1.user._id.toString() 
          ? battle.host2.user._id 
          : battle.host1.user._id;
        
        // Update user coins and experience
        await User.findByIdAndUpdate(winnerId, {
          $inc: {
            'wallet.coins': battle.rewards.winner.coins,
            experience: battle.rewards.winner.experience
          }
        });
        
        await User.findByIdAndUpdate(loserId, {
          $inc: {
            'wallet.coins': battle.rewards.loser.coins,
            experience: battle.rewards.loser.experience
          }
        });
        
        // Notify both users
        await Notification.create({
          user: winnerId,
          type: 'system',
          title: 'PK Battle Victory!',
          body: `You won! +${battle.rewards.winner.coins} coins`,
          priority: 'high'
        });
        
        await Notification.create({
          user: loserId,
          type: 'system',
          title: 'PK Battle Ended',
          body: `Good effort! +${battle.rewards.loser.coins} coins`,
          priority: 'normal'
        });
      }
      
      // Emit battle results
      if (io) {
        io.to(`battle_${battleId}`).emit('battle:ended', battle);
      }
      
      return battle;
      
    } catch (error) {
      console.error('Error ending battle:', error);
      throw error;
    }
  }
  
  /**
   * Get active battles
   */
  static async getActiveBattles(limit = 20) {
    try {
      return await PKBattle.getActiveBattles(limit);
    } catch (error) {
      console.error('Error getting active battles:', error);
      throw error;
    }
  }
  
  /**
   * Get user battle history
   */
  static async getUserBattles(userId, limit = 50) {
    try {
      return await PKBattle.getUserBattles(userId, limit);
    } catch (error) {
      console.error('Error getting user battles:', error);
      throw error;
    }
  }
  
  /**
   * Get leaderboard
   */
  static async getLeaderboard(timeRange = 'week') {
    try {
      return await PKBattle.getLeaderboard(timeRange);
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }
  
  /**
   * Cancel battle
   */
  static async cancelBattle(battleId, userId) {
    try {
      const battle = await PKBattle.findOne({ battleId });
      
      if (!battle) {
        throw new Error('Battle not found');
      }
      
      // Only hosts can cancel
      const isHost = 
        battle.host1.user.toString() === userId.toString() ||
        battle.host2.user.toString() === userId.toString();
      
      if (!isHost) {
        throw new Error('Not authorized');
      }
      
      if (battle.status === 'active') {
        throw new Error('Cannot cancel active battle');
      }
      
      await battle.cancelBattle();
      
      return battle;
      
    } catch (error) {
      console.error('Error cancelling battle:', error);
      throw error;
    }
  }
  
  /**
   * Add viewer to battle
   */
  static async addViewer(battleId, viewerId) {
    try {
      const battle = await PKBattle.findOne({ battleId });
      
      if (!battle) {
        throw new Error('Battle not found');
      }
      
      await battle.addViewer(viewerId);
      
      return battle;
      
    } catch (error) {
      console.error('Error adding viewer:', error);
      throw error;
    }
  }
}

module.exports = PKBattleService;
