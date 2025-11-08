const mongoose = require('mongoose');

const PKBattleSchema = new mongoose.Schema({
  host1Id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  host2Id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  livestreamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Livestream' },
  status: {
    type: String,
    enum: ['pending', 'active', 'ended'],
    default: 'pending'
  },
  host1Score: { type: Number, default: 0 },
  host2Score: { type: Number, default: 0 },
  winnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  startedAt: Date,
  endedAt: Date,
  duration: Number
}, {
  timestamps: true
});

PKBattleSchema.index({ livestreamId: 1 });
PKBattleSchema.index({ host1Id: 1, host2Id: 1 });

const PKBattle = mongoose.model('PKBattle', PKBattleSchema);

module.exports = PKBattle;
