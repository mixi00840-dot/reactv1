const mongoose = require('mongoose');

const StreamProviderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['agora', 'zegocloud', 'webrtc']
  },
  displayName: String,
  enabled: { type: Boolean, default: true },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'inactive'],
    default: 'active'
  },
  priority: { type: Number, default: 0 },
  config: mongoose.Schema.Types.Mixed,
  features: mongoose.Schema.Types.Mixed,
  monthlyUsage: { type: Number, default: 0 },
  usageLimit: Number,
  lastHealthCheck: Date,
  healthStatus: String
}, {
  timestamps: true
});

StreamProviderSchema.index({ name: 1 }, { unique: true });
StreamProviderSchema.index({ enabled: 1, priority: 1 });

const StreamProvider = mongoose.model('StreamProvider', StreamProviderSchema);

module.exports = StreamProvider;
