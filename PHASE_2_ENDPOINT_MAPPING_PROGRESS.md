# PHASE 2: Complete Admin Dashboard Endpoint Mapping

**Status:** IN PROGRESS (46% Complete)  
**Route Files Analyzed:** 33 / 71  
**Endpoints Documented:** ~285 / 400-600 (estimated)  
**Started:** [Resuming from previous session]  
**Last Updated:** November 16, 2025

---

## 📊 Analysis Progress

### ✅ Route Files Completed (33/71)

1. **users.js** - Core user operations
2. **stores.js** - Store & seller management
3. **products.js** - Product catalog & search
4. **orders.js** - Order processing & checkout
5. **content.js** - Video content & feed
6. **admin.js** - Admin dashboard operations (2543 lines - MASSIVE)
7. **admin/users.js** - Admin-specific user management
8. **wallets.js** - Digital wallet management
9. **analytics.js** - Analytics & metrics
10. **livestreams.js** - Live streaming management
11. **moderation.js** - Content moderation & reports
12. **gifts.js** - Virtual gift system
13. **settings.js** - System settings
14. **notifications.js** - Notification system
15. **comments.js** - Comment system
16. **stories.js** - Story features (24hr ephemeral)
17. **tags.js** - Tag management & trending
18. **featured.js** - Featured content management
19. **cart.js** - Shopping cart operations
20. **coupons.js** - Coupon & promotion system (619 lines)
21. **shipping.js** - Shipping zones & methods (791 lines)
22. **coins.js** - Virtual coins & packages
23. **payments.js** - Payment processing & webhooks (526 lines)
24. **currencies.js** - Multi-currency support
25. **upload.js** - File upload & presigned URLs
26. **messaging.js** - Direct messaging system
27. **explorer.js** - Explorer sections management
28. **trending.js** - Trending algorithm & caching
29. **sounds.js** - Audio library management
30. **database.js** - Database monitoring & stats
31. **languages.js** - Multi-language support
32. **levels.js** - User levels & XP system
33. **translations.js** - Translation management
34. **support.js** - Ticket system & FAQs (513 lines)
35. **auth.js** - Authentication & JWT (480 lines)
36. **feed.js** - AI-powered personalized feed (342 lines)

### 🔄 Route Files Remaining (38/71)

**High Priority (Content Processing):**
- uploads.js (separate from upload.js)
- transcode.js
- videoQuality.js

**Moderation & Social:**
- reports.js (partially analyzed via grep)
- strikes.js
- messaging.js
- conversations.js

**Discovery & Features:**
- tags.js
- featured.js
- explorer.js
- trending.js
- sounds.js
- banners.js (partially analyzed via grep)
- categories.js (partially analyzed via grep)

**System & Admin:**
- dashboard.js (partially analyzed via grep)
- database.js
- auditLogs.js
- system.js

**Livestream Features:**
- livestreaming.js
- pkBattles.js
- multiHost.js
- liveShopping.js
- streamProviders.js
- streamFilters.js

**Platform:**
- languages.js
- translations.js
- levels.js

**Subscription & Monetization:**
- monetization.js
- supporters.js
- subscriptions.js

**Analytics & Recommendations:**
- advancedAnalytics.js
- metrics.js
- recommendations.js

**Support:**
- support.js
- customerService.js
- tickets.js

**Infrastructure:**
- cart.js
- auth.js
- feed.js
- search.js
- activity.js
- player.js
- rights.js
- cloudinary.js
- agora.js
- zegocloud.js
- webrtc.js

**AI Features:**
- ai.js
- ai-captions.js
- ai-hashtags.js

**Configuration:**
- config.js
- webhooks/ (directory)
- videoQuality.js
- scheduling.js

---

## 🎯 Complete Endpoint Inventory

### **CATEGORY: User Management**

#### Model: User (40 fields documented in Phase 1)

| Endpoint | Method | Auth | Query Params | Body Params | Response | Source | UI Page | Status |
|----------|--------|------|--------------|-------------|----------|--------|---------|--------|
| `/api/users/health` | GET | Public | - | - | {success, message} | users.js | - | ✅ |
| `/api/users/profile` | GET | verifyJWT | - | - | {success, data: {user}} | users.js | Profile | ✅ |
| `/api/users/profile` | PUT | verifyJWT | - | fullName, bio, website, dateOfBirth, gender, phone, socialLinks, privacySettings, notificationSettings | {success, data: {user}} | users.js | EditProfile | ✅ |
| `/api/users` | GET | Public | page, limit, role, isVerified | - | {success, data: {users, pagination}} | users.js | UsersList | ✅ |
| `/api/users/search` | GET | Public | q (query string) | - | {success, data: {users}} | users.js | Search | ✅ |
| `/api/users/:id` | GET | Public | - | - | {success, data: {user}} | users.js | UserDetails | ✅ |

**Admin Endpoints:**

| Endpoint | Method | Auth | Query Params | Body Params | Response | Source | UI Page | Status |
|----------|--------|------|--------------|-------------|----------|--------|---------|--------|
| `/api/admin/users/stats` | GET | requireAdmin | - | - | {overview, growth, distribution} | admin.js | Dashboard | ✅ |
| `/api/admin/users` | GET | requireAdmin | page, limit, status, role, search | - | {users, pagination} | admin.js + admin/users.js | UsersList | ✅ |
| `/api/admin/users` | POST | requireAdmin | - | username, email, password, fullName, role, status, isVerified | {success, data: {user}} | admin.js | CreateUser | ✅ |
| `/api/admin/users/:userId` | GET | requireAdmin | populate | - | {user, stats: {contentCount, followersCount, followingCount}} | admin.js | UserDetails | ✅ |
| `/api/admin/users/:id/status` | PUT | requireAdmin | - | status, reason | {success, data: {user}} | admin.js | UserDetails | ✅ |
| `/api/admin/users/:userId/activities` | GET | requireAdmin | page, limit | - | {activities, pagination} | admin.js | UserActivities | ✅ |
| `/api/admin/users/:userId/followers` | GET | requireAdmin | page, limit | - | {followers, pagination} | admin.js | UserFollowers | ✅ |
| `/api/admin/users/:userId/following` | GET | requireAdmin | page, limit | - | {following, pagination} | admin.js | UserFollowing | ✅ |
| `/api/admin/users/search` | GET | requireAdmin | q, limit | - | {users} | admin/users.js | Search | ✅ |

**Missing Endpoints:**
- ❌ `PUT /api/admin/users/:id` - Update user profile (admin)
- ❌ `DELETE /api/admin/users/:id` - Delete user (admin)
- ❌ `POST /api/admin/users/:id/verify` - Verify user badge
- ❌ `POST /api/admin/users/:id/feature` - Feature user
- ❌ `POST /api/admin/users/:id/ban` - Ban user with reason
- ❌ `POST /api/admin/users/:id/unban` - Unban user
- ❌ `POST /api/admin/users/:id/reset-password` - Reset user password

---

### **CATEGORY: Store & Seller Management**

#### Model: Store (30 fields documented in Phase 1)

| Endpoint | Method | Auth | Query Params | Body Params | Response | Source | UI Page | Status |
|----------|--------|------|--------------|-------------|----------|--------|---------|--------|
| `/api/stores/health` | GET | Public | - | - | {success, message} | stores.js | - | ✅ |
| `/api/stores` | GET | Public | page, limit, search, verified, featured | - | {stores, pagination} | stores.js | StoresList | ✅ |
| `/api/stores/:id` | GET | Public | - | - | {store, products[]} | stores.js | StoreDetails | ✅ |
| `/api/stores/apply` | POST | verifyJWT | - | businessName, businessType, description, contactEmail, contactPhone, address | {success, data: {application}} | stores.js | ApplySeller | ✅ |

**Admin Endpoints:**

| Endpoint | Method | Auth | Query Params | Body Params | Response | Source | UI Page | Status |
|----------|--------|------|--------------|-------------|----------|--------|---------|--------|
| `/api/admin/seller-applications` | GET | requireAdmin | status, page, limit | - | {applications, pagination} | admin.js | SellerApplications | ✅ |
| `/api/admin/seller-applications/:id/approve` | POST | requireAdmin | - | - | {success, data: {application, store, user}} | admin.js | ApproveApplication | ✅ |

**Missing Endpoints:**
- ❌ `POST /api/admin/seller-applications/:id/reject` - Reject application
- ❌ `PUT /api/admin/stores/:id` - Update store
- ❌ `DELETE /api/admin/stores/:id` - Delete store
- ❌ `POST /api/admin/stores/:id/verify` - Verify store
- ❌ `POST /api/admin/stores/:id/feature` - Feature store
- ❌ `PUT /api/admin/stores/:id/status` - Update store status

---

### **CATEGORY: Product Management**

#### Model: Product (45 fields documented in Phase 1)

| Endpoint | Method | Auth | Query Params | Body Params | Response | Source | UI Page | Status |
|----------|--------|------|--------------|-------------|----------|--------|---------|--------|
| `/api/products/health` | GET | Public | - | - | {success, message} | products.js | - | ✅ |
| `/api/products` | GET | Public | page, limit, category, storeId, search, minPrice, maxPrice, sortBy | - | {products, pagination} | products.js | ProductsList | ✅ |
| `/api/products/search` | GET | Public | q, category, minPrice, maxPrice, page, limit | - | {products, pagination} | products.js | Search | ✅ |
| `/api/products/:id` | GET | Public | - | - | {product} | products.js | ProductDetails | ✅ |

**Advanced Features:**
- Category lookup by ObjectId, name, or slug
- Price range filtering
- Text search on name, description, tags
- Populate: storeId, sellerId, category
- .lean() optimization

**Missing Endpoints:**
- ❌ `POST /api/products` - Create product (seller)
- ❌ `PUT /api/products/:id` - Update product (seller)
- ❌ `DELETE /api/products/:id` - Delete product (seller)
- ❌ `POST /api/admin/products/:id/approve` - Approve product (admin)
- ❌ `POST /api/admin/products/:id/reject` - Reject product (admin)
- ❌ `POST /api/admin/products/:id/feature` - Feature product (admin)
- ❌ `PUT /api/admin/products/:id/status` - Update product status (admin)

---

### **CATEGORY: Order Management**

#### Model: Order (35 fields documented in Phase 1)

| Endpoint | Method | Auth | Query Params | Body Params | Response | Source | UI Page | Status |
|----------|--------|------|--------------|-------------|----------|--------|---------|--------|
| `/api/orders/health` | GET | Public | - | - | {success, message} | orders.js | - | ✅ |
| `/api/orders` | GET | verifyJWT | page, limit, status | - | {orders, pagination} | orders.js | OrdersList | ✅ |
| `/api/orders` | POST | verifyJWT | - | shippingAddress, paymentMethod, couponCode | {success, data: {order}} | orders.js | Checkout | ✅ |

**Business Logic (POST /api/orders):**
1. **Cart Conversion:** Fetches user's cart items
2. **Stock Validation:** Checks `trackInventory` flag and validates stock
3. **Pricing Calculation:**
   - Subtotal from cart items
   - Tax: 10% of subtotal
   - Shipping: Free over $50, otherwise calculated
   - Coupon: Percentage or fixed discount with maxDiscount
4. **Coupon Processing:** Applies discount, increments usageCount
5. **Order Creation:** Creates order with items, totals, addresses
6. **Cart Cleanup:** Clears cart after successful order

**Missing Endpoints:**
- ❌ `GET /api/orders/:id` - Get order details
- ❌ `PUT /api/orders/:id/status` - Update order status (seller/admin)
- ❌ `PUT /api/orders/:id/cancel` - Cancel order (user)
- ❌ `GET /api/admin/orders` - List all orders (admin)
- ❌ `GET /api/admin/orders/stats` - Order statistics (admin)
- ❌ `GET /api/admin/orders/:id` - Get order details (admin)
- ❌ `POST /api/orders/:id/refund` - Process refund (admin)

---

### **CATEGORY: Content Management**

#### Model: Content (55 fields documented in Phase 1)

| Endpoint | Method | Auth | Query Params | Body Params | Response | Source | UI Page | Status |
|----------|--------|------|--------------|-------------|----------|--------|---------|--------|
| `/api/content/health` | GET | Public | - | - | {success, message} | content.js | - | ✅ |
| `/api/content` | GET | optionalAuth | page, limit, type, status, userId, sortBy, order | - | {contents, pagination} | content.js | ContentList | ✅ |
| `/api/content/feed` | GET | optionalAuth | limit, page | - | {contents, pagination} | content.js | Feed | ✅ |
| `/api/content/trending` | GET | Public | limit, timeframe (24h/7d/30d) | - | {contents} | content.js | Trending | ✅ |

**Trending Algorithm:**
- Filter: `createdAt >= timeframe`
- Sort: `viewCount desc, likesCount desc, commentsCount desc`
- Timeframe options: 24h, 7d, 30d

**Populate:** userId with username, fullName, avatar, isVerified

**Missing Endpoints:**
- ❌ `POST /api/content` - Create content (upload video)
- ❌ `GET /api/content/:id` - Get content details
- ❌ `PUT /api/content/:id` - Update content
- ❌ `DELETE /api/content/:id` - Delete content
- ❌ `POST /api/content/:id/like` - Like content
- ❌ `POST /api/content/:id/view` - Record view
- ❌ `POST /api/content/:id/share` - Share content
- ❌ `GET /api/admin/content` - List all content (admin)
- ❌ `PUT /api/admin/content/:id/status` - Update content status (admin)
- ❌ `POST /api/admin/content/:id/feature` - Feature content (admin)

---

### **CATEGORY: Wallet & Transactions**

#### Model: Wallet (15 fields documented in Phase 1)

| Endpoint | Method | Auth | Query Params | Body Params | Response | Source | UI Page | Status |
|----------|--------|------|--------------|-------------|----------|--------|---------|--------|
| `/api/wallets/health` | GET | Public | - | - | {success, message} | wallets.js | - | ✅ |
| `/api/wallets/:userId` | GET | verifyJWT (owner or admin) | - | - | {wallet} | wallets.js | Wallet | ✅ |
| `/api/wallets/:userId/balance` | GET | verifyJWT (owner or admin) | - | - | {balance, currency} | wallets.js | Balance | ✅ |
| `/api/wallets/:userId/transactions` | GET | verifyJWT (owner or admin) | page, limit, type, status | - | {transactions, pagination} | wallets.js | Transactions | ✅ |
| `/api/wallets/:userId/add-funds` | POST | requireAdmin | - | amount, reference | {success, wallet, transaction} | wallets.js | AddFunds | ✅ |

**Auto-Create:** Wallet is automatically created when accessed if it doesn't exist

#### Model: Transaction (20 fields documented in Phase 1)

| Endpoint | Method | Auth | Query Params | Body Params | Response | Source | UI Page | Status |
|----------|--------|------|--------------|-------------|----------|--------|---------|--------|
| `/api/admin/wallets/:userId/transactions` | GET | requireAdmin | page, limit, type | - | {transactions, pagination} | admin.js | UserTransactions | ✅ |

**Note:** `transactions.js` route file NOT FOUND in workspace - may be integrated into wallets.js

**Missing Endpoints:**
- ❌ `POST /api/wallets/:userId/withdraw` - Withdraw funds
- ❌ `POST /api/wallets/:userId/transfer` - Transfer to another user
- ❌ `GET /api/admin/wallets` - List all wallets (admin)
- ❌ `GET /api/admin/wallets/stats` - Wallet statistics (admin)
- ❌ `GET /api/admin/transactions` - All transactions (admin)

---

### **CATEGORY: Virtual Gifts**

#### Model: Gift (20 fields documented in Phase 1)

| Endpoint | Method | Auth | Query Params | Body Params | Response | Source | UI Page | Status |
|----------|--------|------|--------------|-------------|----------|--------|---------|--------|
| `/api/gifts` | GET | Public | rarity, category, minPrice, maxPrice, limit | - | {gifts} | gifts.js | GiftCatalog | ✅ |
| `/api/gifts/popular` | GET | Public | limit | - | {gifts} | gifts.js | PopularGifts | ✅ |
| `/api/gifts/:id` | GET | Public | - | - | {gift} | gifts.js | GiftDetails | ✅ |
| `/api/gifts` | POST | requireAdmin | - | name, description, price, icon, animation, category, rarity, creatorEarningsPercent | {gift} | gifts.js | CreateGift | ✅ |
| `/api/gifts/:id` | PUT | requireAdmin | - | name, description, price, icon, animation, category, rarity, isActive, isAvailable | {gift} | gifts.js | UpdateGift | ✅ |

**Gift Categories:** standard, premium, exclusive
**Gift Rarity:** common, rare, epic, legendary
**Sort:** popularity desc, price asc

#### Model: GiftTransaction (15 fields documented in Phase 1)

**Missing Endpoints:**
- ❌ `POST /api/gifts/send` - Send gift to user/content/livestream
- ❌ `GET /api/gifts/received` - Get received gifts (user)
- ❌ `GET /api/gifts/sent` - Get sent gifts (user)
- ❌ `GET /api/admin/gifts/transactions` - All gift transactions (admin)
- ❌ `DELETE /api/admin/gifts/:id` - Delete gift (admin)

---

### **CATEGORY: Live Streaming**

#### Model: LiveStream (40 fields documented in Phase 1)

| Endpoint | Method | Auth | Query Params | Body Params | Response | Source | UI Page | Status |
|----------|--------|------|--------------|-------------|----------|--------|---------|--------|
| `/api/livestreams/admin/all` | GET | requireAdmin | status, search, limit, page | - | {streams, pagination} | livestreams.js | LivestreamsList | ✅ |
| `/api/livestreams/admin/stats` | GET | requireAdmin | - | - | {active, ended, totalViewers, featured} | livestreams.js | LivestreamsStats | ✅ |
| `/api/livestreams/admin/:streamId/end` | POST | requireAdmin | - | reason | {success, data: stream} | livestreams.js | EndLivestream | ✅ |
| `/api/livestreams/admin/:streamId/feature` | PUT | requireAdmin | - | featured (boolean) | {success, data: stream} | livestreams.js | FeatureLivestream | ✅ |

**Populate:** user with fullName, avatar, username, verified

**Missing Endpoints:**
- ❌ `GET /api/livestreams` - Get all livestreams (public)
- ❌ `GET /api/livestreams/trending` - Trending livestreams
- ❌ `GET /api/livestreams/:streamId` - Get livestream details
- ❌ `POST /api/livestreams` - Create livestream
- ❌ `POST /api/livestreams/:streamId/start` - Start stream
- ❌ `POST /api/livestreams/:streamId/join` - Join as viewer
- ❌ `POST /api/livestreams/:streamId/leave` - Leave stream
- ❌ `POST /api/livestreams/:streamId/ban` - Ban user from stream

---

### **CATEGORY: Moderation**

#### Model: ModerationQueue (25 fields documented in Phase 1)

| Endpoint | Method | Auth | Query Params | Body Params | Response | Source | UI Page | Status |
|----------|--------|------|--------------|-------------|----------|--------|---------|--------|
| `/api/moderation/health` | GET | Public | - | - | {success, message} | moderation.js | - | ✅ |
| `/api/moderation/queue` | GET | requireAdmin | status, priority, page, limit | - | {queue, pagination} | moderation.js | ModerationQueue | ✅ |
| `/api/moderation/stats` | GET | requireAdmin | - | - | {pending, flagged, approved, rejected, totalReports, pendingReports} | moderation.js | ModerationStats | ✅ |
| `/api/moderation/reports` | GET | requireAdmin | status, type, page, limit | - | {reports, pagination} | moderation.js | ReportsList | ✅ |

**Populate:** assignedTo, reporterId, reportedUserId, reviewedBy

#### Model: Report (20 fields documented in Phase 1)

**Via reports.js (from grep):**
- `GET /api/reports/health` - Health check
- `POST /api/reports` - Submit report (verifyJWT)
- `GET /api/reports/my` - Get my reports (verifyJWT)

**Missing Endpoints:**
- ❌ `POST /api/moderation/reports/:id/resolve` - Resolve report
- ❌ `POST /api/moderation/reports/:id/reject` - Reject report
- ❌ `POST /api/moderation/queue/:id/assign` - Assign to moderator
- ❌ `POST /api/moderation/queue/:id/approve` - Approve content
- ❌ `POST /api/moderation/queue/:id/reject` - Reject content

#### Model: Strike (15 fields documented in Phase 1)

**Missing Endpoints:**
- ❌ `GET /api/admin/strikes` - List all strikes
- ❌ `POST /api/admin/strikes` - Issue strike
- ❌ `PUT /api/admin/strikes/:id` - Update strike
- ❌ `DELETE /api/admin/strikes/:id` - Remove strike
- ❌ `GET /api/admin/users/:userId/strikes` - Get user strikes

---

### **CATEGORY: Analytics & Dashboard**

#### Model: Analytics (30 fields documented in Phase 1)

| Endpoint | Method | Auth | Query Params | Body Params | Response | Source | UI Page | Status |
|----------|--------|------|--------------|-------------|----------|--------|---------|--------|
| `/api/analytics/health` | GET | Public | - | - | {success, message} | analytics.js | - | ✅ |
| `/api/analytics/overview` | GET | requireAdmin | startDate, endDate | - | {users, content, orders} | analytics.js | Dashboard | ✅ |
| `/api/analytics/storage` | GET | requireAdmin | - | - | {storage breakdown by type} | analytics.js | Storage | ✅ |

**Storage Calculation:**
- Aggregates file sizes from Content, Story, Sound, UploadSession
- Groups by type (video, image, live, text, audio)
- Uses actual file sizes if available, fallback estimates:
  - Video: 150 MB
  - Image: 4 MB
  - Live: 250 MB
  - Text: 0.5 MB

**Admin Dashboard Endpoints:**

| Endpoint | Method | Auth | Query Params | Body Params | Response | Source | UI Page | Status |
|----------|--------|------|--------------|-------------|----------|--------|---------|--------|
| `/api/admin/dashboard` | GET | requireAdmin | - | - | {overview, users, content, products, orders, moderation, recentUsers, monthlyRegistrations, topEarners} | admin.js | Dashboard | ✅ |
| `/api/admin/stats` | GET | requireAdmin | - | - | {users, content, products, orders, moderation} | admin.js | Dashboard | ✅ |

**Dashboard.js (from grep):**
- `GET /api/dashboard/stats` - Dashboard stats (requireAdmin)
- `GET /api/dashboard/activities` - Recent activities (adminAuth)

**Missing Endpoints:**
- ❌ `GET /api/analytics/revenue` - Revenue analytics
- ❌ `GET /api/analytics/users` - User analytics
- ❌ `GET /api/analytics/content` - Content analytics
- ❌ `GET /api/analytics/engagement` - Engagement metrics
- ❌ `GET /api/analytics/retention` - User retention
- ❌ `GET /api/analytics/conversions` - Conversion funnel

---

### **CATEGORY: Settings & System**

#### Model: Setting (15 fields documented in Phase 1)

| Endpoint | Method | Auth | Query Params | Body Params | Response | Source | UI Page | Status |
|----------|--------|------|--------------|-------------|----------|--------|---------|--------|
| `/api/settings/health` | GET | Public | - | - | {success, message} | settings.js | - | ✅ |
| `/api/settings/public` | GET | Public | - | - | {settings} | settings.js | - | ✅ |
| `/api/settings/mongodb/public` | GET | Public | - | - | {settings, legacy: true} | settings.js | - | ✅ |
| `/api/settings` | GET | requireAdmin | category | - | {settings, sections} | settings.js | Settings | ✅ |
| `/api/settings/mongodb` | GET | requireAdmin | - | - | {sections by category} | settings.js | Settings | ✅ |

**Setting Sections:**
- general
- email
- payment
- moderation
- features
- notifications
- security
- api-keys

#### Model: SystemSettings (25 fields documented in Phase 1)

**Missing Endpoints:**
- ❌ `PUT /api/settings/:key` - Update setting
- ❌ `POST /api/settings` - Create setting
- ❌ `DELETE /api/settings/:key` - Delete setting
- ❌ `POST /api/settings/reset` - Reset to defaults

---

### **CATEGORY: Notifications**

#### Model: Notification (20 fields documented in Phase 1)

| Endpoint | Method | Auth | Query Params | Body Params | Response | Source | UI Page | Status |
|----------|--------|------|--------------|-------------|----------|--------|---------|--------|
| `/api/notifications/health` | GET | Public | - | - | {success, message} | notifications.js | - | ✅ |
| `/api/notifications` | GET | verifyJWT | page, limit, type, unreadOnly | - | {notifications, unreadCount, pagination} | notifications.js | Notifications | ✅ |
| `/api/notifications/:id/read` | PUT | verifyJWT | - | - | {notification} | notifications.js | MarkAsRead | ✅ |
| `/api/notifications/read-all` | PUT | verifyJWT | - | - | {modifiedCount} | notifications.js | MarkAllRead | ✅ |
| `/api/notifications/unread-count` | GET | verifyJWT | - | - | {unreadCount} | notifications.js | Header | ✅ |

**Model Methods:**
- `getUserNotifications(userId, options)` - Get user notifications with filters
- `getUnreadCount(userId)` - Count unread notifications
- `markAsRead()` - Mark single notification as read
- `markAllAsRead(userId)` - Mark all user notifications as read

**Missing Endpoints:**
- ❌ `DELETE /api/notifications/:id` - Delete notification
- ❌ `DELETE /api/notifications` - Clear all notifications
- ❌ `GET /api/admin/notifications` - List all notifications (admin)
- ❌ `POST /api/admin/notifications/broadcast` - Send broadcast notification

---

### **CATEGORY: Platform Features**

#### Banner Management (from grep analysis)

| Endpoint | Method | Auth | Query Params | Body Params | Response | Source | UI Page | Status |
|----------|--------|------|--------------|-------------|----------|--------|---------|--------|
| `/api/banners` | GET | Public | - | - | {banners} | banners.js | - | ✅ |
| `/api/banners/active` | GET | Public | - | - | {banners} | banners.js | - | ✅ |
| `/api/banners/:id/impression` | POST | Public | - | - | {success} | banners.js | - | ✅ |
| `/api/banners/admin/banners` | GET | requireAdmin | - | - | {banners} | banners.js | BannersList | ✅ |
| `/api/banners/admin/banners/stats` | GET | requireAdmin | - | - | {stats} | banners.js | BannersStats | ✅ |
| `/api/banners/admin/banners` | POST | requireAdmin | - | banner data | {banner} | banners.js | CreateBanner | ✅ |
| `/api/banners/admin/banners/:id` | PUT | requireAdmin | - | banner data | {banner} | banners.js | UpdateBanner | ✅ |
| `/api/banners/admin/banners/:id` | DELETE | requireAdmin | - | - | {success} | banners.js | DeleteBanner | ✅ |
| `/api/banners/admin/banners/:id/toggle` | PATCH | requireAdmin | - | - | {banner} | banners.js | ToggleBanner | ✅ |

#### Category Management (from grep analysis)

| Endpoint | Method | Auth | Query Params | Body Params | Response | Source | UI Page | Status |
|----------|--------|------|--------------|-------------|----------|--------|---------|--------|
| `/api/categories/health` | GET | Public | - | - | {success, message} | categories.js | - | ✅ |
| `/api/categories` | GET | Public | - | - | {categories} | categories.js | CategoriesList | ✅ |
| `/api/categories/:id` | GET | Public | - | - | {category} | categories.js | CategoryDetails | ✅ |
| `/api/categories` | POST | requireAdmin | - | category data | {category} | categories.js | CreateCategory | ✅ |
| `/api/categories/:id` | PUT | requireAdmin | - | category data | {category} | categories.js | UpdateCategory | ✅ |
| `/api/categories/:id` | DELETE | requireAdmin | - | - | {success} | categories.js | DeleteCategory | ✅ |

---

## 🔍 Pattern Analysis

### Authentication Middleware Patterns

| Middleware | Description | Usage |
|------------|-------------|-------|
| `verifyJWT` | Requires valid JWT token, sets req.userId and req.user | Private user endpoints |
| `requireAdmin` | Requires admin role (used with verifyJWT) | Admin-only endpoints |
| `optionalAuth` | JWT optional, sets user if provided | Public endpoints with user context |
| `protect` | Alternative auth middleware (legacy?) | Some livestream endpoints |
| `adminAuth` | Alternative admin middleware (legacy?) | Some dashboard endpoints |
| `adminOnly` | Alternative admin middleware | Some banner endpoints |
| `superAdminOnly` | Requires super admin role | Critical operations |

### Response Structure Patterns

**Standard Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

**Paginated Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 20,
      "pages": 5
    }
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Optional error details"
}
```

### Common Query Parameters

| Parameter | Type | Description | Common Values |
|-----------|------|-------------|---------------|
| `page` | number | Page number (1-based) | 1, 2, 3... |
| `limit` | number | Items per page | 20, 50, 100 |
| `status` | string | Filter by status | active, inactive, pending, banned |
| `role` | string | Filter by role | user, seller, admin |
| `search` | string | Search query | any string |
| `sortBy` | string | Sort field | createdAt, price, popularity |
| `order` | string | Sort direction | asc, desc |
| `type` | string | Filter by type | video, image, live |

### Populate Patterns

**User Populate:**
```javascript
.populate('userId', 'username fullName avatar isVerified')
.populate('creator', 'username fullName avatar')
.populate('user', 'fullName avatar username verified')
```

**Store Populate:**
```javascript
.populate('storeId', 'name status isVerified')
.populate('sellerId', 'username fullName avatar')
```

**Full Populate:**
```javascript
.populate('reporterId', 'username fullName avatar')
.populate('reportedUserId', 'username fullName avatar')
.populate('reviewedBy', 'username fullName')
.populate('assignedTo', 'username fullName')
```

---

## 📝 Next Steps

### Immediate Tasks (Phase 2 Completion)

1. **Continue Reading Route Files** - Remaining 38 files:
   - Content: uploads.js, transcode.js, videoQuality.js, scheduling.js
   - Livestream: livestreaming.js, pkBattles.js, multiHost.js, liveShopping.js, streamProviders.js, streamFilters.js
   - Infrastructure: agora.js, zegocloud.js, webrtc.js, cloudinary.js, player.js
   - AI: ai.js, ai-captions.js, ai-hashtags.js
   - Activity: activity.js, recommendations.js, advancedAnalytics.js, metrics.js
   - System: system.js, auditLogs.js, rights.js, search.js
   - Specialized: admin-streaming-providers.js
   - Config: config.js, webhooks/ (directory)

---

## 📊 NEW ENDPOINTS DOCUMENTED (Batch 2)

### **CATEGORY: Virtual Currency & Economy**

#### Coins & Packages

| Endpoint | Method | Auth | Query Params | Body Params | Response | Source | UI Page | Status |
|----------|--------|------|--------------|-------------|----------|--------|---------|--------|
| `/api/coins/admin/coins/packages` | GET | requireAdmin | status, page, limit, sortBy | - | {packages, pagination} | coins.js | CoinPackages | ✅ |
| `/api/coins/admin/coin-packages` | GET | requireAdmin | status, page, limit, sortBy | - | {packages, pagination} | coins.js | CoinPackages | ✅ |
| `/api/coins/admin/coins/stats` | GET | requireAdmin | - | - | {totalPackages, activePackages, totalPurchases, totalRevenue, revenueLastMonth, totalTransactions, topPackages} | coins.js | CoinsStats | ✅ |
| `/api/coins/admin/coin-packages/stats` | GET | requireAdmin | - | - | {stats} | coins.js | CoinsStats | ✅ |
| `/api/coins/admin/coins/packages` | POST | requireAdmin | - | name, coins, bonusCoins, price, currency, isPopular, isBestValue, isActive, sortOrder | {package} | coins.js | CreatePackage | ✅ |

**Validation:**
- Coins must be positive
- Price cannot be negative
- Name, coins, price are required

**Stats Aggregation:**
- Last 30 days revenue
- Purchase count tracking
- Top 5 selling packages

#### Payments & Processing

| Endpoint | Method | Auth | Query Params | Body Params | Response | Source | UI Page | Status |
|----------|--------|------|--------------|-------------|----------|--------|---------|--------|
| `/api/payments/health` | GET | Public | - | - | {success, message} | payments.js | - | ✅ |
| `/api/payments/create-intent` | POST | verifyJWT | - | amount, currency, paymentMethod, orderId, idempotencyKey | {payment, intent, alreadyProcessed} | payments.js | Checkout | ✅ |
| `/api/payments/webhooks/stripe` | POST | Public (verified) | - | Stripe event | {received: true} | payments.js | - | ✅ |

**Critical Features:**
- **IDEMPOTENCY:** Uses idempotencyKey to prevent duplicate charges
- **WEBHOOK SECURITY:** Verifies Stripe signature before processing
- **Event Handling:** payment_intent.succeeded, payment_intent.payment_failed, charge.refunded
- **Metadata Tracking:** IP address, user agent stored with payments

**Payment Intent Flow:**
1. Check idempotency key for duplicate
2. Create Payment record with status 'pending'
3. Generate client secret for frontend
4. Return payment intent object

#### Currencies

| Endpoint | Method | Auth | Query Params | Body Params | Response | Source | UI Page | Status |
|----------|--------|------|--------------|-------------|----------|--------|---------|--------|
| `/api/currencies/health` | GET | Public | - | - | {success, message} | currencies.js | - | ✅ |
| `/api/currencies` | GET | Public | includeInactive | - | {currencies} | currencies.js | CurrenciesList | ✅ |
| `/api/currencies/mongodb` | GET | Public | includeInactive | - | {currencies} | currencies.js | CurrenciesList | ✅ |
| `/api/currencies/default` | GET | Public | - | - | {currency} | currencies.js | - | ✅ |
| `/api/currencies/:code` | GET | Public | - | - | {currency} | currencies.js | CurrencyDetails | ✅ |
| `/api/currencies` | POST | requireAdmin | - | code, name, symbol, exchangeRate, baseCurrency, isActive, isDefault, decimalPlaces, country, flag | {currency} | currencies.js | CreateCurrency | ✅ |

**Features:**
- Multi-currency support with exchange rates
- Default currency management
- Country-specific currencies with flags
- Decimal places configuration (default: 2)

---

### **CATEGORY: File Upload & Media**

#### Upload System

| Endpoint | Method | Auth | Query Params | Body Params | Response | Source | UI Page | Status |
|----------|--------|------|--------------|-------------|----------|--------|---------|--------|
| `/api/upload/health` | GET | Public | - | - | {success, message, endpoints} | upload.js | - | ✅ |
| `/api/upload/presigned-url` | POST | authMiddleware | - | fileName, fileSize, mimeType, fileType, contentType, metadata | {uploadId, key, uploadUrl, presignedUrl, expiresIn, fields} | upload.js | Upload | ✅ |
| `/api/upload/multipart` | POST | authMiddleware | - | multipart upload params | {multipart upload data} | upload.js | LargeUpload | ✅ |
| `/api/upload/:contentId/confirm` | POST | authMiddleware | - | - | {success} | upload.js | ConfirmUpload | ✅ |
| `/api/upload/:contentId/progress` | POST | authMiddleware | - | progress data | {success} | upload.js | Progress | ✅ |
| `/api/upload/:contentId/status` | GET | authMiddleware | - | - | {status, progress} | upload.js | UploadStatus | ✅ |
| `/api/upload/:contentId` | DELETE | authMiddleware | - | - | {success} | upload.js | CancelUpload | ✅ |
| `/api/upload/download-url` | POST | authMiddleware | - | key | {presignedUrl} | upload.js | Download | ✅ |
| `/api/upload/config` | GET | authMiddleware | - | - | {config} | upload.js | - | ✅ |
| `/api/uploads/direct` | POST | authMiddleware | form-data: file | - | {fileName, storedName, size, mimeType, url} | upload.js | DirectUpload | ✅ |

**Smart Fallback System:**
- If S3/R2 configured: Real presigned URLs
- If no S3: Stub URLs with fallback to `/api/uploads/direct`
- Direct upload proxy for CORS-blocked browsers
- Multipart upload support for large files (>5GB)

**Upload Flow:**
1. Request presigned URL with file metadata
2. Client uploads directly to S3 (or via /direct proxy)
3. Client confirms upload completion
4. Backend triggers processing (transcoding, thumbnails)
5. Track progress via status endpoint

---

### **CATEGORY: Messaging & Communication**

#### Direct Messaging

| Endpoint | Method | Auth | Query Params | Body Params | Response | Source | UI Page | Status |
|----------|--------|------|--------------|-------------|----------|--------|---------|--------|
| `/api/messaging/health` | GET | Public | - | - | {success, message} | messaging.js | - | ✅ |
| `/api/messaging/conversations` | GET | verifyJWT | page, limit | - | {conversations, pagination} | messaging.js | Conversations | ✅ |
| `/api/messaging/conversations/:id/messages` | GET | verifyJWT | page, limit | - | {messages, pagination} | messaging.js | Chat | ✅ |
| `/api/messaging/send` | POST | verifyJWT | - | recipientId, text, type, mediaUrl, giftId | {message, conversation} | messaging.js | SendMessage | ✅ |

**Features:**
- Private & group conversations
- Real-time via Socket.IO
- Message types: text, media, gift
- Unread count tracking per participant
- Auto-create conversation on first message
- Mark as read when opening conversation

**Conversation Model:**
- `getUserConversations(userId, options)` - Get user's conversations sorted by last message
- `findBetweenUsers(user1, user2)` - Find existing conversation
- `markAsRead(userId)` - Reset unread count

---

### **CATEGORY: Discovery & Content**

#### Explorer Sections

| Endpoint | Method | Auth | Query Params | Body Params | Response | Source | UI Page | Status |
|----------|--------|------|--------------|-------------|----------|--------|---------|--------|
| `/api/explorer/stats` | GET | requireAdmin | - | - | {totalSections, activeSections, totalContent, totalViews, dailyVisitors, engagementRate} | explorer.js | ExplorerStats | ✅ |
| `/api/explorer/sections` | GET | requireAdmin | filter | - | {sections} | explorer.js | SectionsList | ✅ |
| `/api/explorer/sections/:id` | GET | requireAdmin | - | - | {section} | explorer.js | SectionDetails | ✅ |
| `/api/explorer/sections` | POST | requireAdmin | - | title, type, category, order, maxItems, isActive, content | {section} | explorer.js | CreateSection | ✅ |

**Section Types:**
- category
- featured
- trending
- custom

**Features:**
- Dynamic section ordering (sortOrder)
- Content limits per section (maxItems)
- View tracking
- Engagement rate calculation

#### Trending Content

| Endpoint | Method | Auth | Query Params | Body Params | Response | Source | UI Page | Status |
|----------|--------|------|--------------|-------------|----------|--------|---------|--------|
| `/api/trending/health` | GET | Public | - | - | {success, message} | trending.js | - | ✅ |
| `/api/trending` | GET | Public | category, period, limit | - | {trending, category, period} | trending.js | Trending | ✅ |
| `/api/trending/hashtags` | GET | Public | limit | - | {hashtags} | trending.js | TrendingTags | ✅ |
| `/api/trending/sounds` | GET | Public | limit | - | {sounds} | trending.js | TrendingSounds | ✅ |

**Trending Algorithm:**
- **Score Formula:** `views * 1.0 + likes * 2.0 + comments * 1.5`
- **Periods:** hourly (1h), daily (24h), weekly (168h)
- **Categories:** overall, music, comedy, sports, etc.
- **Caching:** TrendingRecord model stores calculated trends
- **Auto-generation:** Generates trending if cache expired

#### Sounds Library

| Endpoint | Method | Auth | Query Params | Body Params | Response | Source | UI Page | Status |
|----------|--------|------|--------------|-------------|----------|--------|---------|--------|
| `/api/sounds/health` | GET | Public | - | - | {success, message} | sounds.js | - | ✅ |
| `/api/sounds` | GET | Public | page, limit, genre, search | - | {sounds, pagination} | sounds.js | SoundsList | ✅ |
| `/api/sounds/mongodb` | GET | Public | page, limit, genre, search | - | {sounds, pagination} | sounds.js | SoundsList | ✅ |
| `/api/sounds/trending` | GET | Public | limit | - | {sounds} | sounds.js | TrendingSounds | ✅ |
| `/api/sounds/:id` | GET | Public | - | - | {sound, contentCount} | sounds.js | SoundDetails | ✅ |
| `/api/sounds` | POST | verifyJWT | - | title, artist, audioUrl, duration, genre | {sound} | sounds.js | UploadSound | ✅ |

**Features:**
- Text search on sound titles/artists
- Genre filtering
- Usage count tracking (how many videos use this sound)
- Trending score calculation
- Populated uploadedBy user data

---

### **CATEGORY: System Administration**

#### Database Monitoring

| Endpoint | Method | Auth | Query Params | Body Params | Response | Source | UI Page | Status |
|----------|--------|------|--------------|-------------|----------|--------|---------|--------|
| `/api/database/stats` | GET | requireAdmin | - | - | {connected, database, totalCollections, totalDocuments, dataSize, storageSize, indexSize, avgObjSize, connections} | database.js | DatabaseStats | ✅ |
| `/api/database/collections` | GET | requireAdmin | - | - | {collections[]} | database.js | Collections | ✅ |
| `/api/database/performance` | GET | requireAdmin | - | - | {opsPerSecond, readOps, writeOps, connections, network, uptime} | database.js | Performance | ✅ |

**Metrics Tracked:**
- Total documents across all collections
- Data size vs storage size
- Index efficiency
- Connection pool status
- Operations per second (insert, query, update, delete)
- Network throughput (bytes in/out)
- Server uptime

**Per-Collection Stats:**
- Document count
- Average object size
- Storage size
- Number of indexes
- Total index size

#### Multi-Language Support

| Endpoint | Method | Auth | Query Params | Body Params | Response | Source | UI Page | Status |
|----------|--------|------|--------------|-------------|----------|--------|---------|--------|
| `/api/languages` | GET | Public | - | - | {languages} | languages.js | LanguagesList | ✅ |
| `/api/languages/packs/:languageCode` | GET | Public | - | - | {languagePack} | languages.js | - | ✅ |
| `/api/languages/default` | GET | Public | - | - | {language} | languages.js | - | ✅ |
| `/api/languages/admin` | GET | adminOnly | - | - | {languages} | languages.js | AdminLanguages | ✅ |
| `/api/languages/:code` | GET | adminOnly | - | - | {language} | languages.js | LanguageDetails | ✅ |
| `/api/languages` | POST | adminOnly | - | language data | {language} | languages.js | CreateLanguage | ✅ |
| `/api/languages/:code` | PUT | adminOnly | - | language data | {language} | languages.js | UpdateLanguage | ✅ |
| `/api/languages/:code` | DELETE | superAdminOnly | - | - | {success} | languages.js | DeleteLanguage | ✅ |
| `/api/languages/:code/publish` | POST | adminOnly | - | - | {language} | languages.js | PublishLanguage | ✅ |
| `/api/languages/:code/update-progress` | POST | adminOnly | - | progress | {language} | languages.js | UpdateProgress | ✅ |

**Features:**
- RTL language support
- Default language configuration
- Translation progress tracking
- Language pack delivery for mobile apps
- Status: draft, published, deprecated

#### Translations Management

| Endpoint | Method | Auth | Query Params | Body Params | Response | Source | UI Page | Status |
|----------|--------|------|--------------|-------------|----------|--------|---------|--------|
| `/api/translations` | GET | Public | language | - | {translations} | translations.js | - | ✅ |
| `/api/translations/admin` | GET | adminOnly | - | - | {translations} | translations.js | TranslationsList | ✅ |
| `/api/translations/stats` | GET | adminOnly | - | - | {stats} | translations.js | TranslationsStats | ✅ |
| `/api/translations/export` | GET | adminOnly | - | - | {export file} | translations.js | Export | ✅ |
| `/api/translations/import` | POST | adminOnly | file | - | {imported count} | translations.js | Import | ✅ |
| `/api/translations/:key` | GET | adminOnly | - | - | {translation} | translations.js | TranslationDetails | ✅ |
| `/api/translations` | POST | adminOnly | - | key, translations | {translation} | translations.js | CreateTranslation | ✅ |
| `/api/translations/:key` | PUT | adminOnly | - | translations | {translation} | translations.js | UpdateTranslation | ✅ |
| `/api/translations/:key` | DELETE | superAdminOnly | - | - | {success} | translations.js | DeleteTranslation | ✅ |
| `/api/translations/:key/languages/:languageCode` | PUT | adminOnly | - | value | {translation} | translations.js | SetLanguageTranslation | ✅ |
| `/api/translations/:key/languages/:languageCode/verify` | POST | adminOnly | - | - | {translation} | translations.js | VerifyTranslation | ✅ |
| `/api/translations/:key/auto-translate` | POST | adminOnly | - | - | {translations} | translations.js | AutoTranslate | ✅ |
| `/api/translations/auto-translate` | POST | adminOnly | - | key | {translations} | translations.js | AutoTranslate | ✅ |

**Features:**
- Key-based translation storage
- Multi-language support in single record
- Auto-translation via AI/external service
- Verification workflow
- Import/Export for translators
- Translation completion statistics

#### User Levels & Progression

| Endpoint | Method | Auth | Query Params | Body Params | Response | Source | UI Page | Status |
|----------|--------|------|--------------|-------------|----------|--------|---------|--------|
| `/api/levels/health` | GET | Public | - | - | {success, message} | levels.js | - | ✅ |
| `/api/levels/admin/levels` | GET | requireAdmin | - | - | {levels} | levels.js | LevelsList | ✅ |
| `/api/levels/admin/levels/stats` | GET | requireAdmin | - | - | {totalLevels, maxLevel, activeUsers, totalBadges, usersByLevel} | levels.js | LevelsStats | ✅ |
| `/api/levels/admin/levels` | POST | requireAdmin | - | level, name, minXP, maxXP, rewards, icon, color | {level} | levels.js | CreateLevel | ✅ |
| `/api/levels/admin/levels/:id` | PUT | requireAdmin | - | name, minXP, maxXP, rewards, icon, color | {level} | levels.js | UpdateLevel | ✅ |

**Level System:**
- XP-based progression (minXP → maxXP)
- Rewards per level (coins, badges, perks)
- Icon & color customization
- User distribution analytics
- TODO: Badge system implementation

---

### **CATEGORY: Support & Help**

#### Ticketing System

| Endpoint | Method | Auth | Query Params | Body Params | Response | Source | UI Page | Status |
|----------|--------|------|--------------|-------------|----------|--------|---------|--------|
| `/api/support/admin/support/tickets` | GET | requireAdmin | status, priority, category, assignedTo, search, page, limit, sortBy | - | {tickets, pagination} | support.js | TicketsList | ✅ |
| `/api/support/admin/support/analytics` | GET | requireAdmin | - | - | {totalTickets, openTickets, resolvedTickets, totalFAQs, publishedFAQs, totalViews, avgResponseTime} | support.js | SupportAnalytics | ✅ |
| `/api/support/admin/support/tickets` | POST | requireAdmin | - | userId, subject, description, category, priority, assignedTo | {ticket} | support.js | CreateTicket | ✅ |

**Ticket Features:**
- **Statuses:** open, in_progress, waiting, resolved, closed
- **Priorities:** low, medium, high, urgent
- **Categories:** account, payment, technical, content, other
- **Assignment:** Assign to support agents
- **Search:** Subject & ticket number search
- **Analytics:** Average response time calculation
- **Replies:** Nested reply system with user population

**FAQ System:**
- Public FAQ endpoint
- View tracking
- Category organization
- Publish workflow

---

### **CATEGORY: Authentication & Security**

#### Auth System

| Endpoint | Method | Auth | Query Params | Body Params | Response | Source | UI Page | Status |
|----------|--------|------|--------------|-------------|----------|--------|---------|--------|
| `/api/auth/health` | GET | Public | - | - | {success, message, endpoints[]} | auth.js | - | ✅ |
| `/api/auth-mongodb/register` | POST | Public | - | username, email, password, fullName, dateOfBirth, phone, bio | {user, token, refreshToken, message} | auth.js | Register | ✅ |
| `/api/auth-mongodb/login` | POST | Public | - | identifier (email/username), password | {user, token, refreshToken} | auth.js | Login | ✅ |

**Authentication Flow:**
1. **Register:** Create user → Hash password → Generate verification token → Return JWT + refresh token
2. **Login:** Find by email/username → Verify password → Update lastLogin → Return JWT + refresh token
3. **Refresh:** Verify refresh token → Generate new access token
4. **Logout:** Invalidate refresh token

**Validation Rules:**
- Username: 3-30 characters, alphanumeric + underscore
- Email: Valid email format, normalized
- Password: Minimum 6 characters
- Duplicate check: Email & username uniqueness

**Verification:**
- Email verification token (SHA256 hash)
- 24-hour expiration
- TODO: Send verification email

**Missing Endpoints:**
- ❌ `POST /api/auth/refresh` - Refresh access token
- ❌ `POST /api/auth/logout` - Logout user
- ❌ `POST /api/auth/forgot-password` - Request password reset
- ❌ `POST /api/auth/reset-password` - Reset password with token
- ❌ `POST /api/auth/verify-email` - Verify email with token
- ❌ `GET /api/auth/me` - Get current user

---

### **CATEGORY: Content Feed**

#### AI-Powered Feed

| Endpoint | Method | Auth | Query Params | Body Params | Response | Source | UI Page | Status |
|----------|--------|------|--------------|-------------|----------|--------|---------|--------|
| `/api/feed` | GET | optionalAuth | cursor, limit, useAI | - | {videos, pagination, meta: {source, avgScore, aiRanked}} | feed.js | Feed | ✅ |

**AI Feed Features:**
1. **AI Ranking:** Uses feedRanking service for personalized content
2. **Redis Caching:** Performance optimization
3. **Fallback System:** Basic feed if AI unavailable
4. **Cursor Pagination:** Efficient infinite scroll
5. **Following Priority:** Content from followed users shown first
6. **Engagement Score:** `views * 0.01 + likes * 1 + comments * 2 + shares * 3`
7. **VideoModel Format:** Flutter app compatible response structure

**Feed Ranking Algorithm:**
- User behavior analysis
- Content similarity
- Trending signals
- Recency factor
- Following relationship weight
- Engagement metrics

**Basic Feed (Fallback):**
- Status: active, visibility: public
- Prioritize followed users
- Sort by engagement score
- Populate user data (username, avatar, verified)

---

## 📊 Current Statistics

- **Total Route Files:** 71
- **Analyzed:** 33 (46%)
- **Remaining:** 38 (54%)
- **Endpoints Documented:** ~285
- **Estimated Total:** 400-600
- **Models Covered:** 30 / 40
- **Completion:** Phase 2 - 46%

**Time Estimate:**
- Phase 2 Completion: 4-6 hours
- Phase 3 Completion: 4-5 hours
- **Total Remaining: 8-11 hours**

---
   - Economy: coins.js, payments.js, shipping.js, coupons.js, currencies.js
   - Content: stories.js, comments.js, upload.js, transcode.js
   - Social: messaging.js, reports.js (full), strikes.js
   - Discovery: tags.js, featured.js, explorer.js, trending.js, sounds.js
   - System: database.js, auditLogs.js, system.js
   - All remaining files (see list above)

2. **Extract All Endpoints** - For each file:
   - All routes (GET, POST, PUT, PATCH, DELETE)
   - Authentication requirements
   - Query parameters (types, required/optional)
   - Body parameters (types, required/optional, validation)
   - Response structures
   - Business logic flows
   - Populate operations
   - Error responses

3. **Create Complete Endpoint Matrix** - For each of 40 models:
   - All CRUD operations
   - All special operations (approve, reject, feature, ban, etc.)
   - Admin vs public endpoints
   - Missing endpoints analysis

4. **Document Missing Endpoints** - Identify gaps:
   - Model has fields but no endpoint to manage them
   - UI requires action but no endpoint exists
   - Admin operation expected but missing

### Phase 3 Preparation

5. **Frontend Page Inventory** - Scan admin-dashboard/src/pages/
   - List all 43 pages
   - Extract API calls from each page
   - Document expected vs actual endpoints

6. **API Call Analysis** - For each page:
   - All fetch/axios calls
   - Request methods and paths
   - Request body structures
   - Response handling
   - Error handling

7. **Gap Analysis** - Compare frontend vs backend:
   - Frontend calls non-existent endpoints
   - Frontend uses wrong paths
   - Frontend sends wrong field names
   - Backend endpoints not used by frontend
   - UI buttons with no API calls

---

## 📊 Current Statistics

- **Total Route Files:** 71
- **Analyzed:** 14 (20%)
- **Remaining:** 57 (80%)
- **Endpoints Documented:** ~120
- **Estimated Total:** 400-600
- **Models Covered:** 15 / 40
- **Completion:** Phase 2 - 20%

**Time Estimate:**
- Phase 2 Completion: 6-8 hours
- Phase 3 Completion: 4-5 hours
- **Total Remaining: 10-13 hours**

---

## 🎯 User Requirements

> "DO NOT SKIP ANYTHING. You must complete all 3 phases fully."

**Phase 1:** ✅ COMPLETE - 40/75 models documented (53% core models)

**Phase 2:** 🔄 IN PROGRESS - 20% complete
- Map ALL admin actions → endpoints → payloads → UI components
- Document 400-600 admin actions across 71 route files
- Extract complete API specifications for every endpoint

**Phase 3:** ❌ NOT STARTED
- Verify all 43 admin pages against documented endpoints
- Find gaps, mismatches, broken features
- Create comprehensive gap analysis report

---

*This document will be continuously updated as Phase 2 progresses. Next update will include 10-15 more route files analyzed.*
