const express = require('express');
const router = express.Router();
const pkBattleController = require('../controllers/pkBattleController');
const { authenticate } = require('../middleware/auth');

/**
 * PK Battle Routes
 */

// Create battle
router.post('/', authenticate, pkBattleController.createBattle);

// Accept battle
router.post('/:battleId/accept', authenticate, pkBattleController.acceptBattle);

// Send gift in battle
router.post('/:battleId/gift', authenticate, pkBattleController.sendGift);

// Get battle details
router.get('/:battleId', authenticate, pkBattleController.getBattle);

// Get active battles
router.get('/active/list', authenticate, pkBattleController.getActiveBattles);

// Get user's battles
router.get('/user/:userId', authenticate, pkBattleController.getUserBattles);

// Get leaderboard
router.get('/leaderboard/rankings', authenticate, pkBattleController.getLeaderboard);

// Cancel battle
router.delete('/:battleId', authenticate, pkBattleController.cancelBattle);

module.exports = router;
