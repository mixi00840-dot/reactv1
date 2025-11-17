const mongoose = require('mongoose');

const LiveChatSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['active', 'ended', 'abandoned'],
    default: 'active',
    index: true
  },
  messages: [{
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: String,
    type: { type: String, enum: ['text', 'system'], default: 'text' },
    timestamp: { type: Date, default: Date.now }
  }],
  startedAt: { type: Date, default: Date.now },
  endedAt: Date,
  rating: { type: Number, min: 1, max: 5 },
  notes: String
}, { timestamps: true });

LiveChatSchema.index({ status: 1, startedAt: -1 });

const LiveChat = mongoose.model('LiveChat', LiveChatSchema);
module.exports = LiveChat;
