const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  // Basic Info
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username must be less than 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },

  // Profile
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: '',
    maxlength: [500, 'Bio must be less than 500 characters']
  },
  phone: {
    type: String,
    default: ''
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    default: 'prefer_not_to_say'
  },
  website: {
    type: String,
    default: ''
  },

  // Role & Status
  role: {
    type: String,
    enum: ['user', 'seller', 'admin', 'superadmin'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'banned', 'suspended', 'inactive'],
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
  
  // Verification
  verificationToken: String,
  verificationTokenExpire: Date,
  emailVerifiedAt: Date,

  // Password Reset
  resetPasswordToken: String,
  resetPasswordExpire: Date,

  // Statistics (denormalized for performance)
  followersCount: {
    type: Number,
    default: 0,
    min: 0
  },
  followingCount: {
    type: Number,
    default: 0,
    min: 0
  },
  videosCount: {
    type: Number,
    default: 0,
    min: 0
  },
  likesReceivedCount: {
    type: Number,
    default: 0,
    min: 0
  },
  viewsCount: {
    type: Number,
    default: 0,
    min: 0
  },

  // Social Media Links
  socialLinks: {
    instagram: String,
    twitter: String,
    facebook: String,
    youtube: String,
    tiktok: String
  },

  // Push Notifications
  fcmTokens: [{
    token: String,
    device: String, // 'ios', 'android', 'web'
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Notification Settings
  notificationSettings: {
    push: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    likes: { type: Boolean, default: true },
    comments: { type: Boolean, default: true },
    follows: { type: Boolean, default: true },
    mentions: { type: Boolean, default: true },
    messages: { type: Boolean, default: true },
    liveStreams: { type: Boolean, default: true },
    orders: { type: Boolean, default: true }
  },

  // Privacy Settings
  privacySettings: {
    isPrivate: { type: Boolean, default: false },
    allowMessages: { type: String, enum: ['everyone', 'followers', 'none'], default: 'everyone' },
    allowComments: { type: String, enum: ['everyone', 'followers', 'none'], default: 'everyone' },
    showOnlineStatus: { type: Boolean, default: true }
  },

  // Creator/Seller Info
  isCreator: {
    type: Boolean,
    default: false
  },
  isSeller: {
    type: Boolean,
    default: false
  },
  sellerStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store'
  },

  // Firebase Migration Fields (temporary)
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true
  },
  migratedFromFirebase: {
    type: Boolean,
    default: false
  },
  migrationDate: Date,

  // Activity
  lastLogin: Date,
  lastActiveAt: Date,
  loginCount: {
    type: Number,
    default: 0
  },

  // IP & Device tracking
  lastLoginIP: String,
  lastLoginDevice: String,
  
  // Account deletion
  deletedAt: Date,
  deletionRequested: Boolean,
  deletionScheduledFor: Date,

}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance (email, username, firebaseUid already have unique indexes from schema)
UserSchema.index({ role: 1, status: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ isVerified: 1, isFeatured: 1 });
UserSchema.index({ lastActiveAt: -1 });

// Text index for search
UserSchema.index({ 
  username: 'text', 
  fullName: 'text', 
  bio: 'text' 
});

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for login
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to generate auth token (will be used with JWT)
UserSchema.methods.generateAuthToken = function() {
  const jwt = require('jsonwebtoken');
  const token = jwt.sign(
    { 
      id: this._id,
      email: this.email,
      role: this.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
  return token;
};

// Method to generate refresh token
UserSchema.methods.generateRefreshToken = function() {
  const jwt = require('jsonwebtoken');
  const refreshToken = jwt.sign(
    { 
      id: this._id,
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );
  return refreshToken;
};

// Virtual for full profile URL
UserSchema.virtual('profileUrl').get(function() {
  return `/users/${this._id}`;
});

// Virtual to check if account is active
UserSchema.virtual('isActive').get(function() {
  return this.status === 'active' && !this.deletedAt;
});

// Static method to find by email or username
UserSchema.statics.findByEmailOrUsername = function(identifier) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier }
    ]
  });
};

// Don't return sensitive fields by default
UserSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  delete obj.verificationToken;
  delete obj.verificationTokenExpire;
  delete obj.fcmTokens;
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', UserSchema);

module.exports = User;

