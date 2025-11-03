const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username must not exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio must not exceed 500 characters'],
    default: ''
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  phone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'seller'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'banned', 'pending'],
    default: 'active'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isLimitedFromExplore: {
    type: Boolean,
    default: false
  },
  // Social stats
  followersCount: {
    type: Number,
    default: 0
  },
  followingCount: {
    type: Number,
    default: 0
  },
  videosCount: {
    type: Number,
    default: 0
  },
  postsCount: {
    type: Number,
    default: 0
  },
  commentsCount: {
    type: Number,
    default: 0
  },
  likesReceived: {
    type: Number,
    default: 0
  },
  profileViews: {
    type: Number,
    default: 0
  },
  // E-commerce fields
  shippingAddresses: [{
    label: { type: String, default: 'Home' }, // Home, Work, etc.
    fullName: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    phone: String,
    isDefault: { type: Boolean, default: false }
  }],
  billingAddress: {
    fullName: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    phone: String
  },
  // Seller-specific fields
  sellerProfile: {
    businessName: String,
    businessType: { 
      type: String, 
      enum: ['individual', 'business', 'company'],
      default: 'individual'
    },
    taxId: String,
    businessAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    bankDetails: {
      accountHolderName: String,
      accountNumber: String, // Encrypted
      routingNumber: String,
      bankName: String,
      swiftCode: String
    },
    sellerVerificationDocuments: [{
      type: { type: String, enum: ['id', 'business_license', 'tax_certificate', 'bank_statement'] },
      url: String,
      verified: { type: Boolean, default: false },
      uploadedAt: { type: Date, default: Date.now }
    }],
    sellerApplicationDate: Date,
    sellerApprovedDate: Date,
    sellerRejectedDate: Date,
    sellerRejectionReason: String,
    hasActiveStore: { type: Boolean, default: false }
  },
  // Purchase preferences
  preferences: {
    currency: { type: String, default: 'USD' },
    language: { type: String, default: 'en' },
    marketingEmails: { type: Boolean, default: true },
    orderNotifications: { type: Boolean, default: true },
    promoNotifications: { type: Boolean, default: false }
  },
  // Timestamps
  lastLogin: {
    type: Date,
    default: null
  },
  emailVerifiedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for seller status
userSchema.virtual('sellerStatus', {
  ref: 'SellerApplication',
  localField: '_id',
  foreignField: 'userId',
  justOne: true
});

// Virtual for wallet
userSchema.virtual('wallet', {
  ref: 'Wallet',
  localField: '_id',
  foreignField: 'userId',
  justOne: true
});

// Virtual for strikes
userSchema.virtual('strikes', {
  ref: 'Strike',
  localField: '_id',
  foreignField: 'userId'
});

// E-commerce virtuals
userSchema.virtual('store', {
  ref: 'Store',
  localField: '_id',
  foreignField: 'ownerId',
  justOne: true
});

userSchema.virtual('cart', {
  ref: 'Cart',
  localField: '_id',
  foreignField: 'userId',
  justOne: true
});

userSchema.virtual('orders', {
  ref: 'Order',
  localField: '_id',
  foreignField: 'userId'
});

userSchema.virtual('transactions', {
  ref: 'Transaction',
  localField: '_id',
  foreignField: 'userId'
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Static method to find by email or username
userSchema.statics.findByLogin = function(login) {
  return this.findOne({
    $or: [{ email: login }, { username: login }]
  });
};

// Index for performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);