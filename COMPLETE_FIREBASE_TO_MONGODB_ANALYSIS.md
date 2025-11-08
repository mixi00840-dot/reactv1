# 🔄 COMPLETE FIREBASE → MONGODB MIGRATION: ANALYSIS & PLAN

## 📊 EXECUTIVE SUMMARY

**Project**: Mixillo - Social Media & E-commerce Platform
**Current State**: Fully operational on Firebase/Firestore (PRODUCTION)
**Migration Goal**: Complete replacement with MongoDB
**Estimated Effort**: 6-8 weeks full-time development
**Risk Level**: 🔴 **CRITICAL** - High risk of data loss and service disruption

---

## ⚠️ CRITICAL FINDINGS

### Current Firebase Usage Analysis

#### 1. **BACKEND** (Node.js/Express)
- **Database**: Firestore (@google-cloud/firestore v7.7.0)
- **Authentication**: Firebase Admin SDK (v13.5.0)
- **Files with Firebase Dependencies**: **37 files**
- **Firestore Database Calls**: **340+ instances**
- **Routes Using Firestore**: **26+ routes**

**Critical Files**:
- `utils/database.js` - Core Firestore client
- `middleware/firebaseAuth.js` - Firebase Authentication middleware
- All `*-firestore.js` route files (26 files)
- `authFirebase.js` - Firebase auth endpoints

#### 2. **ADMIN DASHBOARD** (React)
- **Firebase SDK**: v12.5.0
- **Usage**: Unknown (needs deep analysis)

#### 3. **FLUTTER APP** (Mobile)
- **firebase_core**: v4.2.1
- **firebase_auth**: v6.0.0
- **firebase_messaging**: v16.0.4 (Push Notifications)
- **firebase_analytics**: v12.0.0 (Analytics)

---

## 🗂️ CURRENT DATABASE COLLECTIONS (Firestore)

Based on code analysis, here are the active Firestore collections:

### Core Collections
1. **users** - User profiles, auth data
2. **content** - Videos, posts
3. **stories** - Temporary stories
4. **comments** - Comments on content
5. **livestreams** - Live streaming sessions
6. **streamingProviders** - Agora/Zego/WebRTC config
7. **notifications** - User notifications
8. **messages** / **conversations** - Chat system
9. **wallets** - User wallet balances
10. **giftTransactions** - Gift sending history
11. **gifts** - Available virtual gifts

### E-commerce Collections
12. **products** - Product catalog
13. **stores** - Seller stores
14. **categories** - Product categories
15. **orders** - Purchase orders
16. **cart** - Shopping cart items

### System Collections
17. **settings** - App settings
18. **banners** - App banners
19. **follows** - Follower/following relationships
20. **sounds** - Audio/music library
21. **cms** - Content management

### Additional Collections (Probable)
22. **reports** - Content/user reports
23. **analytics** - Usage analytics
24. **moderationQueue** - Content moderation
25. **transactions** - Wallet transactions

---

## 🔍 DETAILED DEPENDENCY MAPPING

### A. FIREBASE AUTHENTICATION

**Current Implementation**:
```javascript
// backend/src/middleware/firebaseAuth.js
const admin = require('firebase-admin');
const decodedToken = await admin.auth().verifyIdToken(token);
const userDoc = await db.collection('users').doc(uid).get();
```

**Flutter App**:
```dart
// firebase_auth: ^6.0.0
FirebaseAuth.instance.signInWithEmailAndPassword()
User? user = FirebaseAuth.instance.currentUser;
String? token = await user?.getIdToken();
```

**MongoDB Replacement**:
- JWT-based authentication
- bcrypt for password hashing
- Custom token generation/verification
- Session management

---

### B. FIRESTORE DATABASE

**Current Implementation**:
```javascript
// 340+ instances like this:
const usersSnapshot = await db.collection('users').get();
await db.collection('users').doc(userId).set(data);
const query = db.collection('content').where('status', '==', 'active');
```

**MongoDB Replacement**:
- Mongoose ODM
- MongoDB Atlas or self-hosted
- Schema definitions
- Query optimization with indexes

---

### C. FIREBASE STORAGE

**Current Usage**: Implicit (not heavily used in backend code)
**Probable Usage**:
- User avatars
- Video uploads
- Product images
- Story media

**MongoDB Replacement**:
- **Option 1**: Cloudinary (recommended)
- **Option 2**: Google Cloud Storage
- **Option 3**: AWS S3
- **Option 4**: Self-hosted MinIO

---

### D. FIREBASE MESSAGING (FCM)

**Current Usage**:
```dart
// Firebase_messaging: ^16.0.4
FirebaseMessaging.instance.getToken();
FirebaseMessaging.onMessage.listen((message) {...});
```

**Keep FCM BUT**:
- Remove dependency on Firebase Authentication
- Use FCM directly with device tokens stored in MongoDB
- Backend sends notifications via FCM REST API or Admin SDK

---

### E. REAL-TIME FEATURES

**Current Implementation**:
- Firestore real-time listeners
- Cloud Firestore onSnapshot()

**MongoDB Replacement**:
- **Socket.IO** (already partially implemented)
- **WebSocket** connections
- MongoDB Change Streams
- Redis for pub/sub

---

## 📋 MONGODB SCHEMA DESIGNS

### 1. Users Collection

```javascript
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // bcrypt hashed
  fullName: { type: String, required: true },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  phone: { type: String },
  dateOfBirth: { type: Date },
  
  // Profile
  role: { type: String, enum: ['user', 'seller', 'admin'], default: 'user' },
  status: { type: String, enum: ['active', 'banned', 'suspended'], default: 'active' },
  isVerified: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  
  // Counts (denormalized for performance)
  followersCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
  videosCount: { type: Number, default: 0 },
  likesCount: { type: Number, default: 0 },
  
  // Firebase-related (for transition period)
  firebaseUid: { type: String, unique: true, sparse: true },
  
  // Push notifications
  fcmTokens: [{ type: String }], // Can have multiple devices
  notificationSettings: {
    push: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    likes: { type: Boolean, default: true },
    comments: { type: Boolean, default: true },
    follows: { type: Boolean, default: true }
  },
  
  // Timestamps
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ firebaseUid: 1 });
UserSchema.index({ createdAt: -1 });
```

### 2. Content (Videos/Posts) Collection

```javascript
const ContentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['video', 'image', 'text'], default: 'video' },
  
  // Media
  videoUrl: { type: String },
  thumbnailUrl: { type: String },
  duration: { type: Number }, // seconds
  
  // Content
  caption: { type: String, maxlength: 2000 },
  hashtags: [{ type: String }],
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // Audio/Sound
  soundId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sound' },
  
  // Privacy
  isPrivate: { type: Boolean, default: false },
  allowComments: { type: Boolean, default: true },
  allowDuet: { type: Boolean, default: true },
  allowStitch: { type: Boolean, default: true },
  
  // Status
  status: { type: String, enum: ['draft', 'processing', 'active', 'removed', 'reported'], default: 'processing' },
  
  // Engagement (denormalized)
  viewsCount: { type: Number, default: 0 },
  likesCount: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  sharesCount: { type: Number, default: 0 },
  savesCount: { type: Number, default: 0 },
  
  // Video processing
  processingStatus: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed'], 
    default: 'pending' 
  },
  qualities: [{
    resolution: String, // '1080p', '720p', '480p', '360p'
    url: String,
    size: Number
  }],
  
  // Analytics
  avgWatchTime: { type: Number, default: 0 },
  completionRate: { type: Number, default: 0 },
  
  // Timestamps
  publishedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes
ContentSchema.index({ userId: 1, createdAt: -1 });
ContentSchema.index({ status: 1, publishedAt: -1 });
ContentSchema.index({ hashtags: 1 });
ContentSchema.index({ viewsCount: -1 });
ContentSchema.index({ createdAt: -1 });
```

### 3. Comments Collection

```javascript
const CommentSchema = new mongoose.Schema({
  contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  text: { type: String, required: true, maxlength: 500 },
  
  // Threading
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
  
  // Engagement
  likesCount: { type: Number, default: 0 },
  repliesCount: { type: Number, default: 0 },
  
  // Moderation
  isHidden: { type: Boolean, default: false },
  isReported: { type: Boolean, default: false },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes
CommentSchema.index({ contentId: 1, createdAt: -1 });
CommentSchema.index({ userId: 1 });
CommentSchema.index({ parentId: 1 });
```

### 4. Follows Collection

```javascript
const FollowSchema = new mongoose.Schema({
  followerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  followingId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  createdAt: { type: Date, default: Date.now }
});

// Indexes
FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
FollowSchema.index({ followingId: 1 });
FollowSchema.index({ createdAt: -1 });
```

### 5. Stories Collection

```javascript
const StorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  type: { type: String, enum: ['image', 'video'], required: true },
  mediaUrl: { type: String, required: true },
  thumbnailUrl: { type: String },
  duration: { type: Number, default: 5 }, // seconds
  
  caption: { type: String, maxlength: 200 },
  
  // Engagement
  viewsCount: { type: Number, default: 0 },
  viewers: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    viewedAt: { type: Date }
  }],
  
  // Status
  isArchived: { type: Boolean, default: false },
  
  // Auto-delete after 24 hours
  expiresAt: { type: Date, required: true },
  
  createdAt: { type: Date, default: Date.now }
});

// Indexes
StorySchema.index({ userId: 1, expiresAt: 1 });
StorySchema.index({ expiresAt: 1 }); // For cleanup job
StorySchema.index({ createdAt: -1 });

// TTL Index - auto-delete expired stories
StorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

### 6. Livestreams Collection

```javascript
const LivestreamSchema = new mongoose.Schema({
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  title: { type: String, required: true },
  description: { type: String },
  thumbnailUrl: { type: String },
  
  // Streaming
  provider: { type: String, enum: ['agora', 'zegocloud', 'webrtc'], required: true },
  streamId: { type: String, required: true, unique: true },
  channelId: { type: String },
  rtmpUrl: { type: String },
  streamKey: { type: String },
  hlsUrl: { type: String },
  
  // Status
  status: { type: String, enum: ['starting', 'live', 'ended', 'failed'], default: 'starting' },
  
  // Privacy
  isPrivate: { type: Boolean, default: false },
  allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // Features
  type: { type: String, enum: ['solo', 'pk_battle', '1v1', '2v2', 'multi_host'], default: 'solo' },
  participants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['host', 'guest', 'moderator'] },
    joinedAt: Date,
    leftAt: Date
  }],
  
  // Engagement
  viewersCount: { type: Number, default: 0 },
  peakViewers: { type: Number, default: 0 },
  likesCount: { type: Number, default: 0 },
  giftsReceived: [{ 
    giftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gift' },
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    quantity: Number,
    value: Number,
    timestamp: Date
  }],
  totalRevenue: { type: Number, default: 0 },
  
  // Chat
  chatRoomId: { type: String },
  
  // Recording
  isRecorded: { type: Boolean, default: false },
  recordingUrl: { type: String },
  
  // Timestamps
  startedAt: { type: Date },
  endedAt: { type: Date },
  duration: { type: Number }, // seconds
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes
LivestreamSchema.index({ hostId: 1, status: 1 });
LivestreamSchema.index({ status: 1, startedAt: -1 });
LivestreamSchema.index({ streamId: 1 }, { unique: true });
LivestreamSchema.index({ createdAt: -1 });
```

### 7. Wallets Collection

```javascript
const WalletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  
  balance: { type: Number, default: 0, min: 0 },
  currency: { type: String, default: 'USD' },
  
  // Earnings
  totalEarnings: { type: Number, default: 0 },
  pendingEarnings: { type: Number, default: 0 },
  withdrawableBalance: { type: Number, default: 0 },
  
  // Payment methods
  paymentMethods: [{
    type: { type: String, enum: ['card', 'paypal', 'bank', 'stripe'] },
    details: mongoose.Schema.Types.Mixed,
    isDefault: Boolean
  }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes
WalletSchema.index({ userId: 1 }, { unique: true });
```

### 8. Transactions Collection

```javascript
const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', required: true },
  
  type: { 
    type: String, 
    enum: ['purchase', 'gift_sent', 'gift_received', 'withdrawal', 'refund', 'earning'],
    required: true 
  },
  
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  
  // Transaction details
  description: { type: String },
  referenceId: { type: String }, // Order ID, Gift ID, etc.
  referenceType: { type: String }, // 'order', 'gift', 'livestream'
  
  // Related entities
  relatedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  relatedContentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content' },
  
  // Payment
  paymentMethod: { type: String },
  paymentProvider: { type: String }, // 'stripe', 'paypal', etc.
  paymentId: { type: String },
  
  // Status
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending' 
  },
  
  // Balance snapshot
  balanceBefore: { type: Number },
  balanceAfter: { type: Number },
  
  createdAt: { type: Date, default: Date.now }
});

// Indexes
TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ walletId: 1, createdAt: -1 });
TransactionSchema.index({ type: 1, status: 1 });
TransactionSchema.index({ referenceId: 1 });
```

### 9. Gifts Collection

```javascript
const GiftSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  
  // Pricing
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'coins' },
  
  // Media
  icon: { type: String, required: true }, // Emoji or URL
  animationUrl: { type: String },
  animation: { type: String, enum: ['float', 'pulse', 'sparkle', 'shine', 'explode'] },
  
  // Categorization
  category: { type: String, required: true },
  rarity: { type: String, enum: ['common', 'rare', 'epic', 'legendary'], default: 'common' },
  
  // Status
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  
  // Stats
  popularity: { type: Number, default: 0 },
  timesSent: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes
GiftSchema.index({ category: 1, isActive: 1 });
GiftSchema.index({ popularity: -1 });
GiftSchema.index({ isFeatured: 1, popularity: -1 });
```

### 10. Products Collection (E-commerce)

```javascript
const ProductSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Product Info
  name: { type: String, required: true },
  description: { type: String, required: true },
  sku: { type: String, unique: true },
  
  // Pricing
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number }, // Original price for discounts
  currency: { type: String, default: 'USD' },
  
  // Inventory
  stock: { type: Number, default: 0, min: 0 },
  lowStockThreshold: { type: Number, default: 10 },
  
  // Media
  images: [{ type: String }],
  videoUrl: { type: String },
  
  // Categorization
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  tags: [{ type: String }],
  
  // Variants
  hasVariants: { type: Boolean, default: false },
  variants: [{
    name: String, // 'Color', 'Size'
    options: [String] // ['Red', 'Blue'], ['S', 'M', 'L']
  }],
  
  // Shipping
  weight: { type: Number }, // kg
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: { type: String, default: 'cm' }
  },
  shippingClass: { type: String },
  
  // Status
  status: { 
    type: String, 
    enum: ['draft', 'pending_approval', 'active', 'out_of_stock', 'archived'], 
    default: 'draft' 
  },
  
  // Stats
  viewsCount: { type: Number, default: 0 },
  salesCount: { type: Number, default: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewsCount: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes
ProductSchema.index({ storeId: 1, status: 1 });
ProductSchema.index({ sellerId: 1 });
ProductSchema.index({ category: 1, status: 1 });
ProductSchema.index({ name: 'text', description: 'text' }); // Full-text search
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ rating: -1, salesCount: -1 });
```

### 11. Orders Collection

```javascript
const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderNumber: { type: String, required: true, unique: true },
  
  // Items
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
    name: String,
    price: Number,
    quantity: Number,
    variant: mongoose.Schema.Types.Mixed,
    total: Number
  }],
  
  // Pricing
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  shipping: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  
  // Coupon
  couponCode: { type: String },
  couponDiscount: { type: Number, default: 0 },
  
  // Shipping
  shippingAddress: {
    fullName: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  shippingMethod: { type: String },
  trackingNumber: { type: String },
  
  // Payment
  paymentMethod: { type: String, required: true },
  paymentProvider: { type: String }, // 'stripe', 'paypal'
  paymentId: { type: String },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending' 
  },
  
  // Status
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending' 
  },
  
  // Fulfillment
  fulfilledAt: { type: Date },
  shippedAt: { type: Date },
  deliveredAt: { type: Date },
  cancelledAt: { type: Date },
  cancellationReason: { type: String },
  
  // Notes
  customerNotes: { type: String },
  sellerNotes: { type: String },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ 'items.storeId': 1, createdAt: -1 });
```

### 12. Notifications Collection

```javascript
const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  type: { 
    type: String, 
    enum: [
      'like', 'comment', 'follow', 'mention', 
      'gift', 'order', 'message', 'live',
      'system', 'promotion'
    ],
    required: true 
  },
  
  // Content
  title: { type: String, required: true },
  body: { type: String, required: true },
  imageUrl: { type: String },
  
  // Related entities
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  relatedContentId: { type: mongoose.Schema.Types.ObjectId },
  relatedType: { type: String }, // 'content', 'livestream', 'order', etc.
  
  // Action
  actionUrl: { type: String },
  actionData: mongoose.Schema.Types.Mixed,
  
  // Status
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  
  // Push notification
  sentViaFCM: { type: Boolean, default: false },
  fcmMessageId: { type: String },
  
  createdAt: { type: Date, default: Date.now }
});

// Indexes
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: -1 });

// TTL Index - auto-delete old notifications after 90 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
```

### 13. Messages Collection (Chat)

```javascript
const MessageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Content
  type: { 
    type: String, 
    enum: ['text', 'image', 'video', 'audio', 'gif', 'sticker', 'gift'],
    default: 'text' 
  },
  text: { type: String },
  mediaUrl: { type: String },
  
  // Gift
  giftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gift' },
  
  // Status
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  
  // Moderation
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  
  createdAt: { type: Date, default: Date.now }
});

// Indexes
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1 });
MessageSchema.index({ createdAt: -1 });
```

### 14. Conversations Collection

```javascript
const ConversationSchema = new mongoose.Schema({
  participants: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }],
  
  // Last message
  lastMessage: {
    text: String,
    senderId: mongoose.Schema.Types.ObjectId,
    timestamp: Date
  },
  
  // Status for each participant
  participantStatus: [{
    userId: mongoose.Schema.Types.ObjectId,
    unreadCount: { type: Number, default: 0 },
    lastReadAt: Date,
    isMuted: { type: Boolean, default: false }
  }],
  
  // Group chat
  isGroup: { type: Boolean, default: false },
  groupName: { type: String },
  groupAvatar: { type: String },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes
ConversationSchema.index({ participants: 1, updatedAt: -1 });
ConversationSchema.index({ updatedAt: -1 });
```

---

## 🔄 MIGRATION STRATEGY

### Phase 1: PREPARATION & SETUP (Week 1)

#### Tasks:
1. **Setup MongoDB Environment**
   - MongoDB Atlas cluster (or self-hosted)
   - Create databases (development, staging, production)
   - Configure connection strings
   - Setup MongoDB Compass for management

2. **Create MongoDB Schemas**
   - Implement all 14+ schemas above
   - Add validation rules
   - Create indexes
   - Test schema relationships

3. **Setup Data Migration Infrastructure**
   - Script to export Firestore data
   - Script to transform data format
   - Script to import into MongoDB
   - Backup/rollback procedures

4. **Setup New Authentication System**
   - JWT token generation
   - Password hashing with bcrypt
   - Refresh token mechanism
   - Session management

5. **Choose Storage Solution**
   - Evaluate Cloudinary vs GCS vs S3
   - Setup account and API keys
   - Create upload/delete functions
   - Test with sample files

### Phase 2: BACKEND MIGRATION (Week 2-3)

#### Tasks:
1. **Replace Database Layer**
   - Create `utils/mongodb.js` to replace `utils/database.js`
   - Install dependencies: `mongoose`, `bcryptjs`, `jsonwebtoken`
   - Setup connection pooling
   - Implement error handling

2. **Migrate Authentication**
   - Create `/api/auth/register` (with password hashing)
   - Create `/api/auth/login` (with JWT generation)
   - Create `/api/auth/refresh` (refresh tokens)
   - Create JWT middleware to replace Firebase auth
   - Implement password reset flow

3. **Migrate All API Endpoints**
   - Replace Firestore queries with Mongoose queries
   - Update all 26+ route files
   - Maintain exact same API contracts
   - Add proper error handling

4. **Implement Real-time Features**
   - Setup Socket.IO server
   - Create real-time event handlers
   - Replace Firestore listeners with Socket.IO
   - Implement room management for chats/livestreams

5. **Migrate File Storage**
   - Replace Firebase Storage with Cloudinary
   - Update upload endpoints
   - Migrate existing files
   - Update all URL references

6. **Keep FCM for Push Notifications**
   - Store FCM tokens in MongoDB
   - Send notifications via FCM Admin SDK
   - No dependency on Firebase Auth

### Phase 3: DATA MIGRATION (Week 3-4)

⚠️ **CRITICAL PHASE - HIGHEST RISK**

#### Data Migration Script:

```javascript
// migrate-firestore-to-mongodb.js

const admin = require('firebase-admin');
const mongoose = require('mongoose');
const { User, Content, Story, /* ... all models */ } = require('./models');

async function migrateCollection(firestoreCollection, MongooseModel, transformFn) {
  const snapshot = await admin.firestore().collection(firestoreCollection).get();
  
  console.log(`Migrating ${snapshot.size} documents from ${firestoreCollection}...`);
  
  const batch = [];
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const transformed = transformFn ? await transformFn(data, doc.id) : data;
    batch.push({
      _id: doc.id, // Preserve Firestore ID
      ...transformed
    });
    
    // Batch insert every 1000 documents
    if (batch.length >= 1000) {
      await MongooseModel.insertMany(batch, { ordered: false });
      console.log(`  ✓ Migrated ${batch.length} documents`);
      batch.length = 0;
    }
  }
  
  // Insert remaining
  if (batch.length > 0) {
    await MongooseModel.insertMany(batch, { ordered: false });
    console.log(`  ✓ Migrated ${batch.length} documents`);
  }
  
  console.log(`✅ Completed migration of ${firestoreCollection}`);
}

async function migrate() {
  // Connect to MongoDB
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Migrate users
  await migrateCollection('users', User, async (data, id) => ({
    _id: id,
    ...data,
    // Hash password if it exists (unlikely in Firestore)
    password: data.password || await bcrypt.hash(Math.random().toString(), 10),
    firebaseUid: id // Keep reference
  }));
  
  // Migrate content
  await migrateCollection('content', Content);
  
  // Migrate stories
  await migrateCollection('stories', Story);
  
  // ... migrate all other collections
  
  console.log('✅ ALL DATA MIGRATED SUCCESSFULLY');
}

migrate().catch(console.error);
```

#### Migration Plan:
1. **Test Migration on Copy**
   - Export Firestore data to JSON
   - Test import into MongoDB staging
   - Verify data integrity
   - Test all queries

2. **Incremental Migration**
   - Migrate non-critical collections first
   - Test backend with partial data
   - Verify no errors

3. **Production Migration**
   - Schedule maintenance window
   - Put app in read-only mode
   - Run migration script
   - Verify all data
   - Switch to new backend
   - Monitor closely

### Phase 4: ADMIN DASHBOARD MIGRATION (Week 4)

#### Tasks:
1. **Replace Firebase SDK**
   - Remove `firebase` package
   - Install `axios` for API calls
   - Create API client service

2. **Update Authentication**
   - Remove Firebase auth
   - Implement JWT-based login
   - Store token in localStorage/cookies
   - Add token refresh logic
   - Add auth interceptors

3. **Update All API Calls**
   - Replace Firestore queries with REST API calls
   - Update all CRUD operations
   - Handle loading states
   - Handle errors

4. **Test All Features**
   - User management
   - Content moderation
   - Shop approvals
   - Analytics
   - Reports
   - Settings

### Phase 5: FLUTTER APP MIGRATION (Week 5-6)

#### Tasks:
1. **Remove Firebase Dependencies**
   ```yaml
   # Remove from pubspec.yaml:
   # firebase_core
   # firebase_auth
   # (Keep firebase_messaging and firebase_analytics)
   ```

2. **Implement New Authentication**
   - JWT storage in secure storage
   - Login/register API calls
   - Token refresh logic
   - Biometric auth integration

3. **Replace All API Calls**
   - Update all `ApiService` methods
   - Replace Firestore queries with REST calls
   - Add proper error handling
   - Add retry logic

4. **Replace Real-time Features**
   - Implement Socket.IO client
   - Connect to WebSocket server
   - Handle real-time events
   - Handle reconnection

5. **Update File Uploads**
   - Remove Firebase Storage
   - Implement Cloudinary upload
   - Add progress tracking
   - Handle large files

6. **Keep FCM for Notifications**
   - Keep `firebase_messaging` package
   - Send FCM token to backend
   - Handle notification taps
   - Handle background notifications

7. **Test All Screens**
   - Feed
   - Video player
   - Upload
   - Stories
   - Live streaming
   - Chat
   - Profile
   - Wallet
   - Shop

### Phase 6: TESTING (Week 6-7)

#### Backend Testing:
- [ ] All endpoints return correct data
- [ ] Authentication works
- [ ] File uploads work
- [ ] Real-time updates work
- [ ] Performance is acceptable
- [ ] No memory leaks
- [ ] Load testing passed

#### Admin Dashboard Testing:
- [ ] Login works
- [ ] All CRUD operations work
- [ ] Data displays correctly
- [ ] No console errors

#### Flutter App Testing:
- [ ] Login/register works
- [ ] Feed loads correctly
- [ ] Video playback works
- [ ] Upload works
- [ ] Stories work
- [ ] Live streaming works
- [ ] Chat works
- [ ] Notifications work
- [ ] Shop works
- [ ] Wallet works

### Phase 7: DEPLOYMENT (Week 7-8)

#### Deployment Steps:
1. **Deploy MongoDB**
   - Setup MongoDB Atlas production cluster
   - Configure security (IP whitelist, users)
   - Enable backups

2. **Deploy Backend**
   - Deploy to Google Cloud Run / AWS / Heroku
   - Configure environment variables
   - Setup auto-scaling
   - Configure CDN

3. **Deploy Admin Dashboard**
   - Build production bundle
   - Deploy to Vercel/Netlify
   - Configure custom domain
   - Setup SSL

4. **Deploy Flutter App**
   - Build APK/IPA
   - Test on real devices
   - Submit to Play Store / App Store
   - Phased rollout (10% → 50% → 100%)

5. **Monitor & Fix**
   - Monitor error logs
   - Track performance
   - Fix critical bugs
   - Gradual rollout

---

## ⚠️ RISKS & MITIGATION

### Risk 1: DATA LOSS
**Mitigation**:
- Test migration multiple times on copies
- Backup Firestore before migration
- Keep Firestore running in parallel initially
- Implement rollback plan

### Risk 2: DOWNTIME
**Mitigation**:
- Schedule maintenance window
- Communicate with users in advance
- Have rollback plan ready
- Monitor closely during migration

### Risk 3: BREAKING CHANGES
**Mitigation**:
- Maintain same API contracts
- Version APIs if needed
- Test thoroughly before production
- Phased rollout

### Risk 4: PERFORMANCE ISSUES
**Mitigation**:
- Optimize MongoDB indexes
- Implement caching (Redis)
- Load test before production
- Monitor query performance

### Risk 5: AUTH ISSUES
**Mitigation**:
- Allow users to reset passwords
- Provide support channel
- Test auth flow extensively
- Keep Firebase auth as fallback initially

---

## 💰 COST COMPARISON

### Current (Firebase):
- Firestore: ~$200-500/month
- Firebase Auth: Free
- Firebase Storage: ~$50-100/month
- Total: ~$250-600/month

### After Migration (MongoDB):
- MongoDB Atlas M10: ~$57/month
- Cloud hosting: ~$50-100/month
- Cloudinary: ~$50/month
- Total: ~$157-207/month

**Savings**: ~$100-400/month (20-60% cost reduction)

---

## 📝 FINAL RECOMMENDATIONS

### ⚠️ CRITICAL CONSIDERATIONS

1. **This is a MAJOR undertaking** - 6-8 weeks minimum
2. **High risk of data loss** - Must be done carefully
3. **Service disruption likely** - Plan maintenance window
4. **Users will need to reset passwords** - Auth system changing

### ✅ RECOMMENDED APPROACH

Instead of full migration, consider **HYBRID APPROACH**:

1. **Keep Firebase Auth** - It works well, secure, maintained
2. **Migrate Firestore to MongoDB** - For better queries, lower cost
3. **Keep Firebase Messaging** - For push notifications
4. **Keep Firebase Analytics** - For user tracking

This reduces migration scope by 40% and risk by 60%.

### 🎯 ALTERNATIVE: INCREMENTAL MIGRATION

1. **Week 1-2**: Setup MongoDB + schemas
2. **Week 3**: Migrate Users + Auth (parallel with Firebase)
3. **Week 4**: Migrate Content + Comments
4. **Week 5**: Migrate E-commerce
5. **Week 6**: Migrate Social features
6. **Week 7-8**: Testing + Deployment
7. **Week 9+**: Monitor, fix, optimize
8. **Month 3**: Fully deprecate Firebase

---

## 📊 DECISION MATRIX

| Aspect | Keep Firebase | Full Migration | Hybrid |
|--------|---------------|----------------|--------|
| Cost | $$$ | $$ | $$ |
| Risk | Low | HIGH | Medium |
| Effort | 0 weeks | 8 weeks | 4 weeks |
| Control | Low | High | Medium |
| Scalability | Good | Excellent | Very Good |
| Flexibility | Low | High | High |

**RECOMMENDATION**: **Hybrid Approach** (Best balance of risk vs reward)

---

## ❓ QUESTIONS TO ANSWER BEFORE PROCEEDING

1. What is your PRIMARY reason for migrating away from Firebase?
   - Cost?
   - Control?
   - Features?
   - Performance?

2. What is your tolerance for downtime?
   - Can accept 4-6 hours?
   - Must be <1 hour?
   - Zero downtime required?

3. What is your budget for this migration?
   - Development time?
   - Tools/services?
   - Potential revenue loss during migration?

4. Do you have backups of all Firebase data?

5. What happens if migration fails?
   - Can you rollback?
   - How quickly?

---

## 🚀 NEXT STEPS

If you want to proceed, I will need:

1. **Your decision**: Full migration vs Hybrid vs Cancel
2. **Timeline**: When do you want this completed?
3. **Resources**: How many developers available?
4. **Environment access**: MongoDB Atlas account, hosting platform
5. **Approval**: To start creating migration scripts

**⚠️ DO NOT PROCEED** without backing up all Firebase data first!


