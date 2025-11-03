const mongoose = require('mongoose');

const shippingZoneSchema = new mongoose.Schema({
  // Zone Details
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  
  // Store Reference
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
    index: true
  },
  
  // Coverage Areas
  countries: [{
    code: String, // ISO country code
    name: String,
    regions: [String], // State/province codes
    postalCodes: [{
      min: String,
      max: String
    }],
    cities: [String]
  }],
  
  // Shipping Methods for this zone
  shippingMethods: [{
    method: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShippingMethod',
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    customRates: mongoose.Schema.Types.Mixed // Override default rates for this zone
  }],
  
  // Zone Settings
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Order fulfillment settings
  fulfillmentSettings: {
    processingTime: {
      min: Number, // days
      max: Number
    },
    cutoffTime: String, // "14:00" for 2 PM
    businessDays: [String], // ["monday", "tuesday", ...]
    holidays: [Date]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const shippingMethodSchema = new mongoose.Schema({
  // Method Details
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  
  // Store Reference (null for global methods)
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    index: true
  },
  
  // Method Type
  type: {
    type: String,
    enum: ['standard', 'express', 'overnight', 'same_day', 'pickup', 'digital', 'free_shipping'],
    required: true
  },
  
  // Carrier Information
  carrier: {
    name: String, // UPS, FedEx, USPS, DHL, etc.
    service: String, // Ground, Air, Express, etc.
    trackingUrl: String, // Template with {trackingNumber} placeholder
    apiIntegration: {
      enabled: Boolean,
      provider: String, // shippo, easypost, etc.
      settings: mongoose.Schema.Types.Mixed
    }
  },
  
  // Pricing Structure
  pricing: {
    type: {
      type: String,
      enum: ['flat_rate', 'weight_based', 'price_based', 'distance_based', 'free', 'calculated'],
      required: true
    },
    
    // Flat Rate
    flatRate: {
      amount: Number,
      currency: {
        type: String,
        default: 'USD'
      }
    },
    
    // Weight-based tiers
    weightTiers: [{
      maxWeight: Number, // in grams
      rate: Number
    }],
    
    // Price-based tiers
    priceTiers: [{
      minAmount: Number,
      maxAmount: Number,
      rate: Number,
      isPercentage: Boolean
    }],
    
    // Distance-based zones
    distanceZones: [{
      maxDistance: Number, // in kilometers
      rate: Number
    }],
    
    // Free shipping conditions
    freeShippingThreshold: {
      amount: Number,
      currency: String
    },
    
    // Additional fees
    additionalFees: {
      handlingFee: Number,
      fuelSurcharge: Number,
      residentialDelivery: Number,
      signatureRequired: Number,
      insurance: {
        isPercentage: Boolean,
        rate: Number,
        minFee: Number,
        maxFee: Number
      }
    }
  },
  
  // Delivery Times
  deliveryTime: {
    min: Number, // business days
    max: Number,
    description: String // "1-3 business days"
  },
  
  // Restrictions
  restrictions: {
    minWeight: Number, // grams
    maxWeight: Number,
    minDimensions: {
      length: Number, // cm
      width: Number,
      height: Number
    },
    maxDimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    prohibitedItems: [String],
    requiresSignature: Boolean,
    requiresAdultSignature: Boolean,
    allowsWeekendDelivery: Boolean
  },
  
  // Availability
  availability: {
    countries: [String], // ISO codes
    excludedCountries: [String],
    regions: [String],
    postalCodes: [{
      country: String,
      codes: [String]
    }]
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Display settings
  displaySettings: {
    showToCustomers: {
      type: Boolean,
      default: true
    },
    sortOrder: {
      type: Number,
      default: 0
    },
    icon: String,
    estimatedDeliveryMessage: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const shippingLabelSchema = new mongoose.Schema({
  // Label Identification
  labelId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Related Order
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  
  // Store Information
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
    index: true
  },
  
  // Carrier Information
  carrier: {
    name: String,
    service: String,
    trackingNumber: {
      type: String,
      index: true
    }
  },
  
  // Shipping Details
  fromAddress: {
    name: String,
    company: String,
    street1: String,
    street2: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
    phone: String
  },
  
  toAddress: {
    name: String,
    company: String,
    street1: String,
    street2: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
    phone: String
  },
  
  // Package Information
  package: {
    weight: Number, // grams
    dimensions: {
      length: Number, // cm
      width: Number,
      height: Number
    },
    value: Number,
    currency: String,
    description: String,
    contents: [String]
  },
  
  // Label Details
  labelFormat: {
    type: String,
    enum: ['PDF', 'PNG', 'EPL2', 'ZPL'],
    default: 'PDF'
  },
  labelSize: {
    type: String,
    enum: ['4x6', '4x4', '6x4', 'A4'],
    default: '4x6'
  },
  labelUrl: String,
  
  // Cost Information
  cost: {
    shipping: Number,
    insurance: Number,
    tax: Number,
    total: Number,
    currency: String
  },
  
  // Status
  status: {
    type: String,
    enum: ['created', 'purchased', 'printed', 'shipped', 'delivered', 'exception', 'returned', 'cancelled'],
    default: 'created'
  },
  
  // Tracking Events
  trackingEvents: [{
    status: String,
    message: String,
    location: String,
    timestamp: Date,
    source: String // carrier, system, manual
  }],
  
  // Dates
  purchasedAt: Date,
  printedAt: Date,
  shippedAt: Date,
  estimatedDeliveryDate: Date,
  actualDeliveryDate: Date,
  
  // Provider Integration
  provider: {
    name: String, // shippo, easypost, etc.
    labelId: String,
    rateId: String,
    metadata: mongoose.Schema.Types.Mixed
  },
  
  // Insurance
  insurance: {
    amount: Number,
    provider: String,
    policyNumber: String
  },
  
  // Return Information
  returnLabel: {
    isGenerated: Boolean,
    labelUrl: String,
    trackingNumber: String
  },
  
  // Notes
  notes: String,
  customerNotes: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const shippingRateSchema = new mongoose.Schema({
  // Rate Identification
  rateId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Store Reference
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
    index: true
  },
  
  // Shipping Method
  shippingMethodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShippingMethod',
    required: true
  },
  
  // Geographic Scope
  fromLocation: {
    country: String,
    state: String,
    city: String,
    postalCode: String
  },
  
  toLocation: {
    country: String,
    state: String,
    city: String,
    postalCode: String,
    zones: [String] // Zone identifiers
  },
  
  // Rate Structure
  rateType: {
    type: String,
    enum: ['flat', 'weight_based', 'distance_based', 'value_based'],
    required: true
  },
  
  // Base Rate
  baseRate: {
    amount: Number,
    currency: String
  },
  
  // Weight-based rates
  weightRates: [{
    minWeight: Number, // grams
    maxWeight: Number,
    rate: Number,
    additionalWeightRate: Number // per additional gram/kg
  }],
  
  // Distance-based rates
  distanceRates: [{
    minDistance: Number, // km
    maxDistance: Number,
    rate: Number
  }],
  
  // Value-based rates
  valueRates: [{
    minValue: Number,
    maxValue: Number,
    rate: Number,
    isPercentage: Boolean
  }],
  
  // Additional Charges
  surcharges: {
    fuelSurcharge: {
      isPercentage: Boolean,
      rate: Number
    },
    residentialDelivery: Number,
    signatureRequired: Number,
    saturdayDelivery: Number,
    oversizePackage: Number
  },
  
  // Conditions
  conditions: {
    minOrderValue: Number,
    maxOrderValue: Number,
    eligibleProducts: [String], // Product category IDs
    excludedProducts: [String],
    customerTypes: [String], // retail, wholesale, vip
    promotionCodes: [String]
  },
  
  // Validity
  validFrom: Date,
  validTo: Date,
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Usage Statistics
  usage: {
    timesUsed: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    lastUsed: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
shippingZoneSchema.virtual('store', {
  ref: 'Store',
  localField: 'storeId',
  foreignField: '_id',
  justOne: true
});

shippingMethodSchema.virtual('store', {
  ref: 'Store',
  localField: 'storeId',
  foreignField: '_id',
  justOne: true
});

shippingLabelSchema.virtual('order', {
  ref: 'Order',
  localField: 'orderId',
  foreignField: '_id',
  justOne: true
});

shippingLabelSchema.virtual('store', {
  ref: 'Store',
  localField: 'storeId',
  foreignField: '_id',
  justOne: true
});

shippingRateSchema.virtual('store', {
  ref: 'Store',
  localField: 'storeId',
  foreignField: '_id',
  justOne: true
});

shippingRateSchema.virtual('shippingMethod', {
  ref: 'ShippingMethod',
  localField: 'shippingMethodId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware
shippingLabelSchema.pre('save', function(next) {
  if (!this.labelId) {
    this.labelId = 'LBL-' + Date.now() + '-' + Math.random().toString(36).substr(2, 8).toUpperCase();
  }
  next();
});

shippingRateSchema.pre('save', function(next) {
  if (!this.rateId) {
    this.rateId = 'RATE-' + Date.now() + '-' + Math.random().toString(36).substr(2, 8).toUpperCase();
  }
  next();
});

// Instance methods
shippingMethodSchema.methods.calculateRate = function(weight, value, distance, destination) {
  let rate = 0;
  
  switch (this.pricing.type) {
    case 'flat_rate':
      rate = this.pricing.flatRate.amount;
      break;
      
    case 'weight_based':
      const weightTier = this.pricing.weightTiers.find(tier => weight <= tier.maxWeight);
      if (weightTier) {
        rate = weightTier.rate;
      }
      break;
      
    case 'price_based':
      const priceTier = this.pricing.priceTiers.find(tier => 
        value >= tier.minAmount && value <= tier.maxAmount
      );
      if (priceTier) {
        rate = priceTier.isPercentage ? (value * priceTier.rate / 100) : priceTier.rate;
      }
      break;
      
    case 'distance_based':
      const distanceTier = this.pricing.distanceZones.find(zone => distance <= zone.maxDistance);
      if (distanceTier) {
        rate = distanceTier.rate;
      }
      break;
      
    case 'free':
      if (!this.pricing.freeShippingThreshold || value >= this.pricing.freeShippingThreshold.amount) {
        rate = 0;
      }
      break;
  }
  
  // Add additional fees
  if (this.pricing.additionalFees) {
    rate += this.pricing.additionalFees.handlingFee || 0;
    rate += this.pricing.additionalFees.fuelSurcharge || 0;
  }
  
  return rate;
};

shippingZoneSchema.methods.coversLocation = function(country, state, postalCode, city) {
  return this.countries.some(c => {
    if (c.code !== country) return false;
    
    // Check regions (states/provinces)
    if (c.regions && c.regions.length > 0 && !c.regions.includes(state)) {
      return false;
    }
    
    // Check postal codes
    if (c.postalCodes && c.postalCodes.length > 0) {
      const isInRange = c.postalCodes.some(range => 
        postalCode >= range.min && postalCode <= range.max
      );
      if (!isInRange) return false;
    }
    
    // Check cities
    if (c.cities && c.cities.length > 0 && !c.cities.includes(city)) {
      return false;
    }
    
    return true;
  });
};

shippingLabelSchema.methods.addTrackingEvent = function(status, message, location, source = 'system') {
  this.trackingEvents.push({
    status,
    message,
    location,
    timestamp: new Date(),
    source
  });
  
  // Update main status if needed
  if (['shipped', 'delivered', 'exception', 'returned'].includes(status)) {
    this.status = status;
  }
  
  if (status === 'delivered') {
    this.actualDeliveryDate = new Date();
  }
  
  return this.save();
};

// Static methods
shippingMethodSchema.statics.findByStore = function(storeId) {
  return this.find({ 
    $or: [
      { storeId: storeId },
      { storeId: null } // Global methods
    ],
    isActive: true
  }).sort({ 'displaySettings.sortOrder': 1 });
};

shippingZoneSchema.statics.findZoneForLocation = function(storeId, country, state, postalCode, city) {
  return this.findOne({
    storeId,
    isActive: true
  }).then(zones => {
    return zones.find(zone => zone.coversLocation(country, state, postalCode, city));
  });
};

shippingRateSchema.statics.calculateShippingCost = async function(storeId, destination, weight, value, methodId) {
  const ShippingMethod = mongoose.model('ShippingMethod');
  const ShippingZone = mongoose.model('ShippingZone');
  
  // Find applicable zone
  const zone = await ShippingZone.findZoneForLocation(
    storeId, 
    destination.country, 
    destination.state, 
    destination.postalCode, 
    destination.city
  );
  
  if (!zone) {
    throw new Error('Shipping not available to this location');
  }
  
  // Find shipping method in zone
  const zoneMethod = zone.shippingMethods.find(m => 
    m.method.toString() === methodId && m.isActive
  );
  
  if (!zoneMethod) {
    throw new Error('Shipping method not available in this zone');
  }
  
  // Get method details
  const method = await ShippingMethod.findById(methodId);
  
  // Calculate rate (use custom rates if available)
  const rates = zoneMethod.customRates || method.pricing;
  const cost = method.calculateRate(weight, value, 0, destination);
  
  return {
    cost,
    method: method.name,
    estimatedDays: method.deliveryTime,
    carrier: method.carrier
  };
};

// Indexes
shippingZoneSchema.index({ storeId: 1 });
shippingZoneSchema.index({ 'countries.code': 1 });
shippingZoneSchema.index({ isActive: 1 });

shippingMethodSchema.index({ storeId: 1 });
shippingMethodSchema.index({ code: 1 });
shippingMethodSchema.index({ type: 1 });
shippingMethodSchema.index({ isActive: 1 });
shippingMethodSchema.index({ 'displaySettings.sortOrder': 1 });

shippingLabelSchema.index({ labelId: 1 });
shippingLabelSchema.index({ orderId: 1 });
shippingLabelSchema.index({ storeId: 1 });
shippingLabelSchema.index({ 'carrier.trackingNumber': 1 });
shippingLabelSchema.index({ status: 1 });

shippingRateSchema.index({ rateId: 1 });
shippingRateSchema.index({ storeId: 1 });
shippingRateSchema.index({ shippingMethodId: 1 });
shippingRateSchema.index({ 'toLocation.country': 1 });
shippingRateSchema.index({ isActive: 1 });
shippingRateSchema.index({ validFrom: 1, validTo: 1 });

const ShippingZone = mongoose.model('ShippingZone', shippingZoneSchema);
const ShippingMethod = mongoose.model('ShippingMethod', shippingMethodSchema);
const ShippingLabel = mongoose.model('ShippingLabel', shippingLabelSchema);
const ShippingRate = mongoose.model('ShippingRate', shippingRateSchema);

module.exports = { ShippingZone, ShippingMethod, ShippingLabel, ShippingRate };