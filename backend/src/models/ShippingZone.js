const mongoose = require('mongoose');

const ShippingZoneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  countries: [{ type: String }],
  regions: [{ type: String }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

ShippingZoneSchema.index({ isActive: 1, createdAt: -1 });

const ShippingZone = mongoose.model('ShippingZone', ShippingZoneSchema);
module.exports = ShippingZone;
