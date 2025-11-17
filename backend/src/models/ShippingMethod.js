const mongoose = require('mongoose');

const ShippingMethodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, uppercase: true, unique: true },
  type: { type: String, enum: ['standard', 'express', 'overnight', 'economy'], default: 'standard' },
  description: String,
  carrier: {
    name: { type: String, default: 'Custom' },
    service: { type: String, default: 'Standard' }
  },
  cost: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true, index: true },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
  estimatedDays: { type: Number, default: 5 },
  zonesSupported: [String]
}, { timestamps: true });

ShippingMethodSchema.index({ code: 1 }, { unique: true });
ShippingMethodSchema.index({ isActive: 1, createdAt: -1 });

const ShippingMethod = mongoose.model('ShippingMethod', ShippingMethodSchema);
module.exports = ShippingMethod;
