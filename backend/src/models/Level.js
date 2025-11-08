const mongoose = require('mongoose');

const LevelSchema = new mongoose.Schema({
  level: {
    type: Number,
    required: true,
    unique: true,
    min: 1
  },
  
  name: String,
  
  minXP: {
    type: Number,
    required: true,
    default: 0
  },
  
  maxXP: {
    type: Number,
    required: true
  },
  
  rewards: {
    coins: { type: Number, default: 0 },
    badges: [String],
    features: [String]
  },
  
  icon: String,
  color: String,
  
}, {
  timestamps: true
});

LevelSchema.index({ level: 1 }, { unique: true });

const Level = mongoose.model('Level', LevelSchema);

module.exports = Level;

