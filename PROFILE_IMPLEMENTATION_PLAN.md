# 📱 Profile Feature Implementation Plan
**Flutter App Profile with Complete Ecommerce System**

---

## 🎯 Overview
Complete TikTok-style profile with integrated seller/product management system. Backend analysis shows most features are **90% ready** - we just need Flutter UI implementation.

---

## ✅ Backend Status Analysis

### 1. **User Profile Endpoints** ✅ COMPLETE
**Location:** `backend/src/routes/users.js`

```
✅ GET  /api/users/profile - Get current user profile
✅ PUT  /api/users/profile - Update profile (bio, fullName, website, etc.)
✅ GET  /api/users/:userId - Get any user profile (public view)
✅ POST /api/users/:userId/follow - Follow/unfollow user
✅ GET  /api/users/:userId/followers - Get followers list
✅ GET  /api/users/:userId/following - Get following list
```

**User Model Fields Available:**
- ✅ `username, fullName, bio, avatar, website`
- ✅ `followersCount, followingCount, videosCount, likesReceivedCount`
- ✅ `isVerified, isFeatured`
- ✅ `socialLinks` (Instagram, Twitter, Facebook, YouTube, TikTok)
- ✅ `privacySettings` (isPrivate, allowMessages, allowComments)
- ✅ `notificationSettings` (push, email, likes, comments, follows)

---

### 2. **Levels & Badges System** ⚠️ 70% READY

**What's Ready:**
- ✅ Level Model (`backend/src/models/Level.js`)
  - Fields: `level, name, minXP, maxXP, rewards, badges, icon, color`
- ✅ SupporterBadge Model (`backend/src/models/SupporterBadge.js`)
  - Fields: `name, description, icon, requirement, threshold, rarity`
- ✅ Level Routes (`backend/src/routes/levels.js`)
  - Admin endpoints for creating/managing levels

**What's Missing:**
- ❌ User level/XP fields in User model
- ❌ XP calculation logic (based on views, likes, uploads, time)
- ❌ User badge assignment system
- ❌ Public endpoint: `GET /api/users/:userId/levels`
- ❌ Public endpoint: `GET /api/users/:userId/badges`

**Need to Add to User Model:**
```javascript
// In User Schema
currentLevel: { type: Number, default: 1 },
currentXP: { type: Number, default: 0 },
totalXP: { type: Number, default: 0 },
badges: [{
  badgeId: { type: mongoose.Schema.Types.ObjectId, ref: 'SupporterBadge' },
  earnedAt: Date,
  isVisible: { type: Boolean, default: true }
}]
```

---

### 3. **Wallet & Coins System** ✅ COMPLETE

**Location:** `backend/src/routes/wallets.js`

```
✅ GET  /api/wallets/:userId - Get user wallet
✅ GET  /api/wallets/:userId/balance - Get balance only
✅ GET  /api/wallets/:userId/transactions - Transaction history
✅ POST /api/wallets/:userId/add-funds - Add funds (admin)
✅ POST /api/wallets/:userId/deduct - Deduct funds (admin)
```

**Wallet Model Fields:**
- ✅ `balance, totalEarnings, totalSpendings`
- ✅ `monthlyEarnings, supportLevel` (bronze, silver, gold, platinum, diamond)

**Transaction Model:**
- ✅ Full transaction history with `type, amount, status, description`

**What's Missing:**
- ❌ Payment gateway integration (Stripe/PayPal) for top-up
- ❌ Withdrawal system (bank transfer)
- ❌ Coin gifting in live streams (partial implementation exists)

---

### 4. **Supporter System** ✅ 80% READY

**Location:** `backend/src/routes/supporters.js`

```
✅ POST /api/supporters/support/:creatorId - Send support (coins)
✅ GET  /api/supporters/received - My supporters (as creator)
✅ GET  /api/supporters/given - Creators I support
✅ GET  /api/supporters/leaderboard/:creatorId - Top supporters
✅ GET  /api/supporters/badges/user - User's supporter badges
```

**What's Ready:**
- ✅ Supporter tiers (Bronze, Silver, Gold, Platinum, Diamond)
- ✅ Leaderboard system (daily/monthly)
- ✅ Badge awarding system
- ✅ Notification on new supporter

**What's Missing:**
- ❌ Real-time support animations (need Socket.io integration)
- ❌ Support during live streams

---

### 5. **Content/Videos System** ✅ COMPLETE

**Location:** `backend/src/routes/content.js`

```
✅ GET  /api/content/user/:userId - Get user's videos
✅ GET  /api/content/:contentId - Get single video
✅ POST /api/content - Upload new video
✅ PUT  /api/content/:contentId - Edit video
✅ DELETE /api/content/:contentId - Delete video
✅ POST /api/content/:contentId/like - Like/unlike video
✅ GET  /api/content/:contentId/comments - Get comments
✅ POST /api/content/:contentId/comments - Add comment
```

**Content Model Features:**
- ✅ Video metadata (caption, hashtags, mentions)
- ✅ Stats (views, likes, comments, shares)
- ✅ Privacy settings (public, followers, private)
- ✅ Cloudinary integration for video storage

---

### 6. **Seller Application System** ✅ COMPLETE

**Location:** `backend/src/routes/admin.js`

```
✅ GET  /api/admin/seller-applications - Get all applications (admin)
✅ POST /api/admin/seller-applications/:id/approve - Approve seller
✅ POST /api/admin/seller-applications/:id/reject - Reject application
```

**SellerApplication Model:**
- ✅ Fields: `userId, businessName, businessType, description, documents`
- ✅ Status: pending, approved, rejected
- ✅ Document upload support (ID, passport, business license)

**Approval Process:**
1. User submits application with documents
2. Admin reviews in admin dashboard
3. On approval:
   - User role → `seller`
   - Create Store document
   - Link store to user
4. User can now access seller panel

**What's Missing:**
- ❌ Public endpoint: `POST /api/sellers/apply` (currently only in admin routes)
- ❌ Public endpoint: `GET /api/sellers/application/status`

---

### 7. **Products & Store System** ✅ COMPLETE

**Location:** `backend/src/routes/products.js`

```
✅ GET  /api/products - Get all products (with filters)
✅ GET  /api/products/featured - Featured products
✅ GET  /api/products/:id - Get single product
✅ POST /api/products - Create product (seller)
✅ PUT  /api/products/:id - Update product (seller)
✅ DELETE /api/products/:id - Delete product (seller)
✅ GET  /api/products/store/:storeId - Get store products
```

**Product Model Features:**
- ✅ Basic: name, description, price, stock, images, videos
- ✅ Variants: colors, sizes, attributes
- ✅ Shipping: weight, dimensions, shipping terms
- ✅ Categories & tags
- ✅ Status: draft, published, archived
- ✅ Return/refund policy fields
- ✅ Seller/store association

**Store Model Features:**
- ✅ Store profile (name, logo, description)
- ✅ Seller verification status
- ✅ Store rating & reviews
- ✅ Store stats (products, orders, revenue)

---

### 8. **Settings & Account Management** ✅ 90% READY

**Available Settings:**

**Account Settings:**
- ✅ `PUT /api/users/profile` - Update profile
- ✅ Privacy settings in User model
- ✅ Notification settings in User model
- ✅ Social links integration

**What's Missing:**
- ❌ Block/unblock users endpoint
- ❌ Report user endpoint
- ❌ Delete account endpoint (soft delete exists in model)
- ❌ Security settings (2FA, login sessions)

**Need to Add:**
```javascript
POST /api/users/block/:userId - Block user
POST /api/users/report/:userId - Report user
POST /api/users/account/delete - Request deletion
GET  /api/users/settings/security - Get security settings
PUT  /api/users/settings/security - Update security
```

---

## 📋 MISSING ENDPOINTS - Implementation Required

### **Priority 1: Essential for Profile**

#### 1. User Levels & XP
```javascript
// File: backend/src/routes/users.js

// GET /api/users/:userId/level
router.get('/:userId/level', async (req, res) => {
  const user = await User.findById(req.params.userId);
  const currentLevel = await Level.findOne({ 
    minXP: { $lte: user.currentXP }, 
    maxXP: { $gte: user.currentXP } 
  });
  const nextLevel = await Level.findOne({ level: currentLevel.level + 1 });
  
  res.json({
    currentLevel: currentLevel.level,
    currentXP: user.currentXP,
    totalXP: user.totalXP,
    nextLevelXP: nextLevel?.minXP || null,
    progress: ((user.currentXP - currentLevel.minXP) / (currentLevel.maxXP - currentLevel.minXP)) * 100
  });
});

// GET /api/users/:userId/badges
router.get('/:userId/badges', async (req, res) => {
  const user = await User.findById(req.params.userId).populate('badges.badgeId');
  res.json({ badges: user.badges.filter(b => b.isVisible) });
});
```

#### 2. Seller Application (Public)
```javascript
// File: backend/src/routes/sellers.js (CREATE THIS FILE)

// POST /api/sellers/apply
router.post('/apply', verifyJWT, uploadMiddleware, async (req, res) => {
  const { businessName, businessType, description, contactEmail, contactPhone, address } = req.body;
  
  // Check if already applied
  const existing = await SellerApplication.findOne({ userId: req.userId });
  if (existing) {
    return res.status(400).json({ message: 'Application already submitted' });
  }
  
  const application = new SellerApplication({
    userId: req.userId,
    businessName,
    businessType,
    description,
    contactEmail,
    contactPhone,
    address,
    documents: req.files.map(f => f.path), // Uploaded docs
    status: 'pending'
  });
  
  await application.save();
  res.json({ success: true, application });
});

// GET /api/sellers/application/status
router.get('/application/status', verifyJWT, async (req, res) => {
  const application = await SellerApplication.findOne({ userId: req.userId });
  res.json({ application: application || null });
});
```

#### 3. Account Management
```javascript
// File: backend/src/routes/users.js

// POST /api/users/block/:userId
router.post('/block/:userId', verifyJWT, async (req, res) => {
  await User.findByIdAndUpdate(req.userId, {
    $addToSet: { blockedUsers: req.params.userId }
  });
  res.json({ message: 'User blocked' });
});

// POST /api/users/report/:userId
router.post('/report/:userId', verifyJWT, async (req, res) => {
  const Report = require('../models/Report');
  await Report.create({
    reporterId: req.userId,
    reportedUserId: req.params.userId,
    reason: req.body.reason,
    description: req.body.description
  });
  res.json({ message: 'Report submitted' });
});
```

### **Priority 2: Enhanced Features**

#### 4. Payment Gateway Integration
```javascript
// File: backend/src/routes/payments.js (CREATE THIS FILE)

// POST /api/payments/topup
router.post('/topup', verifyJWT, async (req, res) => {
  const { amount, paymentMethod } = req.body; // Stripe, PayPal
  
  // Integrate with Stripe/PayPal API
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // Convert to cents
    currency: 'usd',
    customer: req.user.stripeCustomerId
  });
  
  res.json({ clientSecret: paymentIntent.client_secret });
});

// POST /api/payments/withdraw
router.post('/withdraw', verifyJWT, async (req, res) => {
  const { amount, bankAccount } = req.body;
  const wallet = await Wallet.findOne({ userId: req.userId });
  
  if (wallet.balance < amount) {
    return res.status(400).json({ message: 'Insufficient balance' });
  }
  
  // Create withdrawal request
  const withdrawal = new Withdrawal({
    userId: req.userId,
    amount,
    bankAccount,
    status: 'pending'
  });
  await withdrawal.save();
  
  res.json({ withdrawal });
});
```

#### 5. Collections/Saved Content
```javascript
// File: backend/src/routes/content.js

// POST /api/content/:contentId/save
router.post('/:contentId/save', verifyJWT, async (req, res) => {
  await User.findByIdAndUpdate(req.userId, {
    $addToSet: { savedContent: req.params.contentId }
  });
  res.json({ message: 'Content saved' });
});

// GET /api/content/saved
router.get('/saved', verifyJWT, async (req, res) => {
  const user = await User.findById(req.userId).populate('savedContent');
  res.json({ savedContent: user.savedContent });
});
```

---

## 🎨 Flutter Profile Screens Architecture

### **Screen Structure**

```
lib/features/profile/
├── screens/
│   ├── profile_screen.dart              # Main profile (user & visitor views)
│   ├── edit_profile_screen.dart         # Edit profile form
│   ├── wallet_screen.dart               # Wallet & coins
│   ├── wallet_topup_screen.dart         # Top-up coins
│   ├── transaction_history_screen.dart  # Transaction list
│   ├── supporters_screen.dart           # Supporters leaderboard
│   ├── levels_badges_screen.dart        # Level progress & badges
│   ├── settings_screen.dart             # Account settings
│   ├── privacy_settings_screen.dart     # Privacy controls
│   ├── notifications_settings_screen.dart
│   ├── seller_application_screen.dart   # Apply to be seller
│   ├── seller_dashboard_screen.dart     # Seller CMS panel
│   ├── product_management_screen.dart   # Product CRUD
│   ├── add_edit_product_screen.dart     # Product form
│   ├── store_settings_screen.dart       # Store profile
│   └── follower_list_screen.dart        # Followers/following lists
├── widgets/
│   ├── profile_header.dart              # Profile photo, stats, buttons
│   ├── profile_stats_row.dart           # Followers, likes, videos count
│   ├── profile_tabs.dart                # Videos, Liked, Saved tabs
│   ├── video_grid_item.dart             # Grid video thumbnail
│   ├── level_progress_card.dart         # Level bar with XP
│   ├── badge_item.dart                  # Badge icon with tooltip
│   ├── wallet_card.dart                 # Coin balance display
│   ├── supporter_rank_item.dart         # Supporter in leaderboard
│   ├── transaction_item.dart            # Transaction history row
│   ├── product_card.dart                # Product thumbnail
│   └── setting_tile.dart                # Settings list item
├── data/
│   ├── models/
│   │   ├── user_profile_model.dart      # ✅ Already exists
│   │   ├── level_model.dart
│   │   ├── badge_model.dart
│   │   ├── wallet_model.dart
│   │   ├── supporter_model.dart
│   │   └── product_model.dart
│   ├── repositories/
│   │   ├── profile_repository.dart
│   │   ├── wallet_repository.dart
│   │   ├── seller_repository.dart
│   │   └── product_repository.dart
│   └── providers/
│       ├── profile_provider.dart
│       ├── wallet_provider.dart
│       └── seller_provider.dart
└── services/
    ├── profile_service.dart             # API calls
    ├── wallet_service.dart
    ├── seller_service.dart
    └── product_service.dart
```

---

## 🚀 Implementation Roadmap

### **Phase 1: Core Profile (Week 1)**
1. ✅ Profile header with stats (use existing `/api/users/:userId`)
2. ✅ Follow/unfollow functionality
3. ✅ Edit profile screen
4. ✅ Profile tabs: Videos, Liked
5. ✅ Video grid display
6. ✅ Visitor vs User POV logic

### **Phase 2: Wallet & Supporters (Week 2)**
1. ✅ Wallet screen (balance display)
2. ✅ Transaction history
3. ⚠️ Implement top-up (need payment gateway)
4. ✅ Supporters screen (leaderboard)
5. ✅ Send support (coins to creator)
6. ✅ Supporter badges display

### **Phase 3: Levels & Badges (Week 3)**
1. ❌ Add XP fields to User model
2. ❌ Implement XP calculation logic
3. ❌ Create level progress UI
4. ✅ Badge collection screen
5. ✅ Badge unlock animations

### **Phase 4: Seller System (Week 4-5)**
1. ❌ Create seller application endpoints
2. ✅ Seller application form UI
3. ✅ Document upload (ID, passport)
4. ✅ Application status tracking
5. ✅ Seller dashboard (after approval)
6. ✅ Product management CMS
7. ✅ Product CRUD screens
8. ✅ Product variants (size, color)
9. ✅ Image/video upload for products
10. ✅ Draft/publish workflow

### **Phase 5: Settings & Security (Week 6)**
1. ✅ Settings screen layout
2. ✅ Privacy settings
3. ✅ Notification preferences
4. ✅ Blocked users list
5. ❌ Report user functionality
6. ❌ Delete account flow
7. ✅ Logout

---

## 📊 Feature Completion Status

| Feature | Backend Ready | Flutter UI | Priority |
|---------|---------------|------------|----------|
| Profile Overview | ✅ 100% | ❌ 0% | 🔥 High |
| Follow/Unfollow | ✅ 100% | ❌ 0% | 🔥 High |
| Edit Profile | ✅ 100% | ❌ 0% | 🔥 High |
| Video Grid | ✅ 100% | ❌ 0% | 🔥 High |
| Wallet Display | ✅ 100% | ❌ 0% | 🔥 High |
| Transaction History | ✅ 100% | ❌ 0% | 🟡 Medium |
| Top-up Coins | ❌ 30% | ❌ 0% | 🟡 Medium |
| Withdrawal | ❌ 20% | ❌ 0% | 🔵 Low |
| Supporters System | ✅ 80% | ❌ 0% | 🟡 Medium |
| Levels & XP | ⚠️ 60% | ❌ 0% | 🟡 Medium |
| Badges Display | ✅ 80% | ❌ 0% | 🟡 Medium |
| Seller Application | ⚠️ 70% | ❌ 0% | 🔥 High |
| Product Management | ✅ 100% | ❌ 0% | 🔥 High |
| Store Dashboard | ✅ 90% | ❌ 0% | 🔥 High |
| Settings | ✅ 80% | ❌ 0% | 🟡 Medium |
| Privacy Controls | ✅ 100% | ❌ 0% | 🟡 Medium |
| Block/Report Users | ❌ 0% | ❌ 0% | 🔵 Low |

**Overall Backend Status: 82% Complete**
**Overall Flutter Status: 0% (Not started)**

---

## 🎯 Next Steps

### **Immediate Actions:**

1. **Complete Missing Backend Endpoints** (2-3 days)
   - User levels & XP endpoints
   - Seller application public endpoints
   - Block/report user endpoints
   - Collections/saved content endpoints

2. **Update User Model** (1 day)
   - Add XP fields
   - Add badges array
   - Add blockedUsers array
   - Add savedContent array

3. **Start Flutter Profile Implementation** (After backend complete)
   - Begin with Phase 1: Core Profile
   - Use existing `/api/users/:userId` endpoint
   - Implement user vs visitor view logic

4. **Payment Gateway Research** (Parallel task)
   - Choose: Stripe vs PayPal vs both
   - Set up test accounts
   - Implement top-up flow

---

## 💡 Recommendations

1. **Start with User POV first** - Implement full user profile before seller features
2. **Use existing admin dashboard code** - Copy React components logic to Flutter
3. **Mock payment initially** - Don't block development on payment gateway integration
4. **Levels can wait** - XP system is nice-to-have, not essential for launch
5. **Focus on seller panel** - This is your unique selling point (TikTok + ecommerce)

---

**Status:** Ready to start Flutter implementation
**Backend Completion:** 82%
**Estimated Time to Complete:** 6 weeks (with 1 developer)
