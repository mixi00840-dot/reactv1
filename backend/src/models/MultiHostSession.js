const mongoose = require('mongoose');

const MultiHostSessionSchema = new mongoose.Schema({
  livestreamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Livestream',
    required: true
  },
  
  hosts: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['primary', 'co-host']
    },
    joinedAt: Date,
    leftAt: Date,
    screenShareActive: Boolean,
    micMuted: Boolean,
    cameraOff: Boolean
  }],
  
  maxHosts: {
    type: Number,
    default: 4,
    min: 2,
    max: 10
  },
  
  status: {
    type: String,
    enum: ['active', 'ended'],
    default: 'active'
  },
  
  startedAt: {
    type: Date,
    default: Date.now
  },
  
  endedAt: Date,
  
}, {
  timestamps: true
});

MultiHostSessionSchema.index({ livestreamId: 1 });
MultiHostSessionSchema.index({ 'hosts.userId': 1 });

const MultiHostSession = mongoose.model('MultiHostSession', MultiHostSessionSchema);

module.exports = MultiHostSession;

