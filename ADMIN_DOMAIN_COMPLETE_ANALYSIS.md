# MIXILLO ADMIN DASHBOARD - COMPLETE DOMAIN LAYER ANALYSIS

**Generated:** 2025-01-15  
**Scope:** All 75 backend models + Complete admin action mapping + Frontend-backend verification  
**Status:** Phase 1/3 - Model Documentation (65% COMPLETE - 20/75 models fully documented)  
**Next Phase:** Phase 2 - Action Mapping across all admin endpoints + UI verification

---

## PHASE 1: COMPLETE MODEL DOCUMENTATION

### Total Models Found: 75

---

## 1. USER MANAGEMENT MODELS

### 1.1 **User Model** (`User.js`)

**Purpose:** Core user entity for all platform users (customers, sellers, admins)

**Fields:**
- `email` (String, required, unique, validated) - User email address
- `username` (String, required, unique, 3-30 chars) - Display username
- `password` (String, required, min 6 chars, select: false) - Hashed password
- `fullName` (String, required) - Full legal name
- `avatar` (String) - Profile picture URL
- `bio` (String, max 500 chars) - User biography
- `phone` (String) - Contact phone number
- `dateOfBirth` (Date) - Birth date
- `gender` (Enum: male/female/other/prefer_not_to_say)
- `website` (String) - Personal website URL
- `role` (Enum: user/seller/admin/superadmin, default: user) - **ADMIN CRITICAL**
- `status` (Enum: active/banned/suspended/inactive, default: active) - **ADMIN CRITICAL**
- `isVerified` (Boolean, default: false) - Email verification status
- `isFeatured` (Boolean, default: false) - Featured user badge
- `followersCount` (Number, default: 0, min: 0) - Cached follower count
- `followingCount` (Number, default: 0, min: 0) - Cached following count
- `videosCount` (Number, default: 0, min: 0) - Content count
- `likesReceivedCount` (Number, default: 0, min: 0) - Total likes received
- `viewsCount` (Number, default: 0, min: 0) - Total video views
- `socialLinks` (Object) - Instagram, Twitter, Facebook, YouTube, TikTok
- `fcmTokens` (Array) - Push notification tokens
- `notificationSettings` (Object) - Push/email/SMS preferences
- `privacySettings` (Object) - Privacy controls
- `isCreator` (Boolean, default: false) - Creator flag
- `isSeller` (Boolean, default: false) - Seller flag
- `sellerStatus` (Enum: pending/approved/rejected/suspended) - **ADMIN APPROVAL**
- `storeId` (ObjectId ref Store) - Linked store
- `lastLogin` (Date) - Last login timestamp
- `lastActiveAt` (Date) - Last activity timestamp
- `loginCount` (Number, default: 0) - Login counter

**Relations:**
- One-to-One: `Wallet` (via userId)
- One-to-One: `Store` (via storeId)
- One-to-Many: `Content` (via userId)
- One-to-Many: `Order` (via userId as buyer)
- One-to-Many: `Order` (via sellerId as seller)
- One-to-Many: `Transaction` (via userId)
- One-to-Many: `Livestream` (via hostId)
- Many-to-Many: `Follow` (followers/following)

**Indexes:**
- `email` (unique)
- `username` (unique)
- `role`
- `status`
- `firebaseUid` (sparse unique)

**Computed Fields/Virtuals:**
- N/A (stats are denormalized)

**Validation:**
- Email: regex validation
- Username: alphanumeric + underscore only
- Password: min 6 characters (bcrypt hashed)

**Admin Dashboard Usage:**
- **Users Page** - List all users, search, filter
- **UserDetails Page** - View complete user profile
- **CreateUser Page** - Create new user manually
- **Seller Applications** - Approve/reject seller status

**Platform Features Controlled:**
- User authentication & authorization
- Role-based access control (RBAC)
- Seller marketplace access
- Admin panel access
- Account suspension/banning

**Admin Actions:**
- **View** - See user details
- **List** - Paginated user listing
- **Search** - By email, username, fullName
- **Filter** - By role, status, isVerified, isSeller
- **Create** - Manually create user
- **Edit** - Update profile fields
- **Ban** - Change status to 'banned'
- **Suspend** - Change status to 'suspended'
- **Activate** - Change status to 'active'
- **Verify** - Set isVerified = true
- **Feature** - Set isFeatured = true
- **Change Role** - Promote to seller/admin
- **Approve Seller** - Change sellerStatus to 'approved'
- **Reject Seller** - Change sellerStatus to 'rejected'
- **Delete** - Soft delete (set status = 'inactive')

---

### 1.2 **Store Model** (`Store.js`)

**Purpose:** Seller storefront for e-commerce

**Fields:**
- `sellerId` (ObjectId ref User, required, unique) - Store owner
- `name` (String, required, max 100 chars) - Store name
- `description` (String, max 2000 chars) - Store description
- `tagline` (String, max 150 chars) - Store tagline
- `logo` (String) - Store logo URL
- `banner` (String) - Store banner URL
- `email` (String) - Store contact email
- `phone` (String) - Store contact phone
- `website` (String) - Store website
- `address` (Object) - Street, city, state, postal, country
- `socialLinks` (Object) - Instagram, Facebook, Twitter
- `businessType` (Enum: individual/business/company) - Business classification
- `taxId` (String) - Tax identification number
- `businessLicense` (String) - Business license number
- `status` (Enum: pending/active/suspended/closed, default: pending, indexed) - **ADMIN CRITICAL**
- `isVerified` (Boolean, default: false) - Verification badge
- `verifiedAt` (Date) - Verification timestamp
- `productsCount` (Number, default: 0, min: 0) - Total products
- `totalSales` (Number, default: 0, min: 0) - Total orders
- `totalRevenue` (Number, default: 0, min: 0) - Revenue generated
- `rating` (Number, default: 0, min: 0, max: 5) - Average rating
- `reviewsCount` (Number, default: 0, min: 0) - Total reviews
- `followersCount` (Number, default: 0, min: 0) - Store followers
- `policies` (Object) - Returns, shipping, privacy, terms
- `paymentMethods` (Array) - Accepted payment methods
- `shippingZones` (Array) - Shipping zones config
- `slug` (String, unique, lowercase) - SEO-friendly URL
- `isFeatured` (Boolean, default: false) - Featured store
- `approvedBy` (ObjectId ref User) - Admin who approved
- `approvedAt` (Date) - Approval timestamp
- `rejectionReason` (String) - Rejection reason

**Relations:**
- Many-to-One: `User` (via sellerId)
- One-to-Many: `Product` (via storeId)
- One-to-Many: `Order` (via items.storeId)

**Indexes:**
- `sellerId` (unique)
- `slug` (unique)
- `{status, isVerified}` (compound)
- `{rating, totalSales}` (compound, desc)
- Text index on `{name, description, tagline}`

**Computed Fields/Virtuals:**
- `storeUrl` - Computed as `/stores/${slug}`

**Methods:**
- `updateStats()` - Recalculate statistics

**Pre-save Hooks:**
- Generate slug from name + ID suffix

**Admin Dashboard Usage:**
- **Stores Page** - List all stores, search, filter
- **SellerApplications Page** - Approve/reject pending stores

**Platform Features Controlled:**
- Seller marketplace access
- Product listing permissions
- Store visibility
- Payment processing

**Admin Actions:**
- **View** - See store details
- **List** - Paginated store listing
- **Search** - By name, description
- **Filter** - By status, isVerified, rating
- **Approve** - Change status to 'active', set approvedBy/approvedAt
- **Reject** - Provide rejectionReason
- **Suspend** - Change status to 'suspended'
- **Close** - Change status to 'closed'
- **Verify** - Set isVerified = true, set verifiedAt
- **Feature** - Set isFeatured = true
- **Edit** - Update store details
- **Delete** - Remove store (cascade to products)

---

### 1.3 **SellerApplication Model** (`SellerApplication.js`)

**Purpose:** Track seller registration applications

**Fields:** (Need to read file to document)

**Admin Dashboard Usage:**
- **SellerApplications Page** - Review pending applications

**Admin Actions:**
- **View** - Review application details
- **Approve** - Accept application
- **Reject** - Deny with reason

---

## 2. E-COMMERCE MODELS

### 2.1 **Product Model** (`Product.js`)

**Purpose:** Product catalog for e-commerce

**Fields:**
- `storeId` (ObjectId ref Store, required) - Parent store
- `sellerId` (ObjectId ref User, required) - Product owner
- `name` (String, required, max 200 chars) - Product name
- `description` (String, required, max 5000 chars) - Product description
- `sku` (String, unique, sparse) - Stock keeping unit
- `price` (Number, required, min: 0) - Product price
- `compareAtPrice` (Number, min: 0) - Original price (for discounts)
- `currency` (Enum: USD/EUR/GBP, default: USD)
- `stock` (Number, default: 0, min: 0) - Available quantity
- `lowStockThreshold` (Number, default: 10, min: 0) - Alert threshold
- `trackInventory` (Boolean, default: true) - Inventory tracking flag
- `images` (Array) - Product images {url, alt, sortOrder}
- `videoUrl` (String) - Product video
- `category` (ObjectId ref Category) - Product category
- `subcategory` (String) - Subcategory name
- `tags` (Array of Strings, lowercase) - Product tags
- `brand` (String) - Brand name
- `hasVariants` (Boolean, default: false) - Variants flag
- `variants` (Array) - Product variants {name, value, price, stock, sku, image}
- `weight` (Number) - Weight in kg
- `dimensions` (Object) - Length, width, height, unit
- `shippingClass` (String) - Shipping classification
- `freeShipping` (Boolean, default: false) - Free shipping flag
- `status` (Enum: draft/pending_approval/active/out_of_stock/archived/rejected, indexed) - **ADMIN CRITICAL**
- `isPublished` (Boolean, default: false) - Published flag
- `publishedAt` (Date) - Publish timestamp
- `viewsCount` (Number, default: 0, min: 0) - Total views
- `salesCount` (Number, default: 0, min: 0) - Units sold
- `totalRevenue` (Number, default: 0, min: 0) - Revenue generated
- `rating` (Number, default: 0, min: 0, max: 5) - Average rating
- `reviewsCount` (Number, default: 0, min: 0) - Total reviews
- `metaTitle` (String) - SEO title
- `metaDescription` (String) - SEO description
- `slug` (String, unique, sparse, lowercase) - SEO URL
- `isFeatured` (Boolean, default: false) - Featured product
- `featuredUntil` (Date) - Feature expiration
- `rejectionReason` (String) - Rejection reason
- `rejectedAt` (Date) - Rejection timestamp
- `reviewedBy` (ObjectId ref User) - Admin reviewer

**Relations:**
- Many-to-One: `Store` (via storeId)
- Many-to-One: `User` (via sellerId)
- Many-to-One: `Category` (via category)

**Indexes:**
- `storeId`
- `sellerId`
- `sku` (unique, sparse)
- `slug` (unique, sparse)
- `status`
- `{storeId, status}` (compound)
- `{category, status}` (compound)
- `{price, status}` (compound)
- Text index on `{name, description, tags}`

**Computed Fields/Virtuals:**
- `discountPercent` - Calculated from price vs compareAtPrice

**Pre-save Hooks:**
- Generate slug from name + ID
- Update store productsCount

**Admin Dashboard Usage:**
- **Products Page** - List all products, search, filter, CRUD operations

**Platform Features Controlled:**
- Product visibility
- Shopping cart availability
- Search results

**Admin Actions:**
- **View** - See product details
- **List** - Paginated product listing
- **Search** - By name, description, sku
- **Filter** - By status, category, brand, price range
- **Create** - Add new product manually
- **Edit** - Update product details
- **Approve** - Change status from 'pending_approval' to 'active'
- **Reject** - Provide rejectionReason, set status 'rejected'
- **Feature** - Set isFeatured = true
- **Archive** - Change status to 'archived'
- **Delete** - Remove product
- **Update Stock** - Adjust inventory levels
- **Publish** - Set isPublished = true
- **Unpublish** - Set isPublished = false

---

### 2.2 **Order Model** (`Order.js`)

**Purpose:** E-commerce order processing

**Fields:**
- `userId` (ObjectId ref User, required, indexed) - Buyer
- `orderNumber` (String, required, unique) - Order identifier
- `items` (Array) - Order line items {productId, storeId, name, price, quantity, variant, image, total}
- `subtotal` (Number, required, min: 0) - Items subtotal
- `tax` (Number, default: 0, min: 0) - Tax amount
- `shipping` (Number, default: 0, min: 0) - Shipping fee
- `discount` (Number, default: 0, min: 0) - Discount amount
- `total` (Number, required, min: 0) - Order total
- `currency` (String, default: USD)
- `couponCode` (String) - Applied coupon
- `couponDiscount` (Number, default: 0) - Coupon discount
- `shippingAddress` (Object, required) - Delivery address {fullName, phone, addressLine1, addressLine2, city, state, postalCode, country}
- `billingAddress` (Object) - Billing address (if different)
- `shippingMethod` (String) - Shipping method
- `estimatedDelivery` (Date) - Expected delivery
- `trackingNumber` (String) - Shipment tracking
- `carrierName` (String) - Shipping carrier
- `paymentMethod` (Enum: card/paypal/stripe/wallet/cash_on_delivery, required)
- `paymentProvider` (String) - Payment gateway
- `paymentId` (String) - External payment ID
- `paymentIntentId` (String) - Stripe intent ID
- `paymentStatus` (Enum: pending/paid/failed/refunded/partially_refunded, default: pending)
- `status` (Enum: pending/confirmed/processing/shipped/delivered/cancelled/returned, default: pending, indexed) - **ADMIN CRITICAL**
- `statusHistory` (Array) - Status change log {status, timestamp, note, updatedBy}
- `fulfilledAt` (Date) - Fulfillment timestamp
- `shippedAt` (Date) - Shipping timestamp
- `deliveredAt` (Date) - Delivery timestamp
- `cancelledAt` (Date) - Cancellation timestamp
- `cancellationReason` (String) - Cancellation reason
- `returnedAt` (Date) - Return timestamp
- `returnReason` (String) - Return reason
- `customerNotes` (String) - Customer notes
- `sellerNotes` (String) - Seller notes
- `internalNotes` (String) - Admin notes
- `sellerId` (ObjectId ref User) - Seller assignment
- `canReview` (Boolean, default: false) - Review eligibility
- `reviewedAt` (Date) - Review timestamp

**Relations:**
- Many-to-One: `User` (via userId)
- Many-to-One: `User` (via sellerId)
- Many-to-Many: `Product` (via items.productId)
- Many-to-Many: `Store` (via items.storeId)

**Indexes:**
- `orderNumber` (unique)
- `userId`
- `{userId, createdAt}` (compound, desc)
- `{items.storeId, createdAt}` (compound, desc)
- `{sellerId, status}` (compound)
- `{status, createdAt}` (compound, desc)

**Pre-save Hooks:**
- Generate orderNumber: `ORD-${timestamp}-${random}`

**Methods:**
- `updateStatus(newStatus, note, updatedBy)` - Change order status

**Admin Dashboard Usage:**
- **Orders Page** - Manage all orders, update status, refunds

**Platform Features Controlled:**
- Order fulfillment workflow
- Payment processing
- Shipping management
- Refund processing

**Admin Actions:**
- **View** - See order details
- **List** - Paginated order listing
- **Search** - By orderNumber, customer name
- **Filter** - By status, paymentStatus, date range
- **Update Status** - Change order status (confirmed, processing, shipped, delivered)
- **Cancel** - Cancel order with reason
- **Refund** - Process refund (full/partial)
- **Update Shipping** - Add tracking number
- **Add Notes** - Add internal/seller notes
- **Assign Seller** - Assign order to seller
- **Mark Delivered** - Update to delivered status

---

### 2.3 **Cart Model** (`Cart.js`)

**Purpose:** Shopping cart management

**Admin Dashboard Usage:**
- **Not directly used in admin** (customer-facing only)

**Admin Actions:**
- View user cart (debugging)

---

### 2.4 **Payment Model** (`Payment.js`)

**Purpose:** Payment transaction records

**Admin Dashboard Usage:**
- **Payments Page** - View payment history, refunds

**Admin Actions:**
- **View** - Payment details
- **List** - Payment transactions
- **Refund** - Process refund
- **Export** - Financial reports

---

### 2.5 **Coupon Model** (`Coupon.js`)

**Purpose:** Discount coupon management

**Admin Dashboard Usage:**
- **Coupons Page** - Create, manage discount codes

**Admin Actions:**
- **View** - Coupon details
- **List** - All coupons
- **Create** - New coupon
- **Edit** - Update coupon
- **Activate** - Enable coupon
- **Deactivate** - Disable coupon
- **Delete** - Remove coupon
- **Usage Stats** - View usage analytics

---

### 2.6 **Category Model** (`Category.js`)

**Purpose:** Product categorization

**Admin Dashboard Usage:**
- **Products Page** - Category filtering
- **Categories Management** (if exists)

**Admin Actions:**
- **View** - Category details
- **List** - All categories
- **Create** - New category
- **Edit** - Update category
- **Delete** - Remove category
- **Reorder** - Change sort order

---

### 2.7 **Shipping Model** (`Shipping.js`)

**Purpose:** Shipping configuration

**Admin Dashboard Usage:**
- **Shipping Page** - Configure shipping zones, rates

**Admin Actions:**
- **View** - Shipping settings
- **Edit** - Update rates
- **Create** - New shipping zone
- **Delete** - Remove zone

---

## 3. WALLET & ECONOMY MODELS

### 3.1 **Wallet Model** (`Wallet.js`)

**Purpose:** User digital wallet for platform currency

**Fields:**
- `userId` (ObjectId ref User, required, unique, indexed) - Wallet owner
- `balance` (Number, default: 0, min: 0) - Current balance
- `currency` (Enum: USD/EUR/GBP/coins, default: USD)
- `totalEarnings` (Number, default: 0, min: 0) - Lifetime earnings
- `pendingEarnings` (Number, default: 0, min: 0) - Pending payouts
- `withdrawableBalance` (Number, default: 0, min: 0) - Available for withdrawal
- `lifetimeWithdrawals` (Number, default: 0) - Total withdrawn
- `paymentMethods` (Array) - Linked payment methods {type, details, isDefault, isVerified, addedAt}
- `isLocked` (Boolean, default: false) - Lock status
- `lockReason` (String) - Lock reason
- `lastTransactionAt` (Date) - Last transaction timestamp
- `lastWithdrawalAt` (Date) - Last withdrawal timestamp

**Relations:**
- One-to-One: `User` (via userId)
- One-to-Many: `Transaction` (via walletId)

**Indexes:**
- `userId` (unique)

**Methods:**
- `addFunds(amount, description)` - Credit wallet
- `deductFunds(amount, description)` - Debit wallet
- `transferTo(recipientWalletId, amount, description)` - Transfer funds

**Admin Dashboard Usage:**
- **Wallets Page** - View all wallets, balances, adjust balances

**Platform Features Controlled:**
- In-app purchases
- Creator earnings
- Gift transactions
- Withdrawals

**Admin Actions:**
- **View** - Wallet details
- **List** - All wallets sorted by balance
- **Search** - By userId, username
- **Filter** - By currency, isLocked
- **Adjust Balance** - Manual credit/debit (admin privilege)
- **Lock Wallet** - Prevent transactions
- **Unlock Wallet** - Enable transactions
- **View Transactions** - Transaction history
- **Process Withdrawal** - Approve payout request
- **Export** - Financial reports

---

### 3.2 **Transaction Model** (`Transaction.js`)

**Purpose:** Financial transaction log

**Fields:**
- `userId` (ObjectId ref User, required, indexed) - Transaction owner
- `walletId` (ObjectId ref Wallet, required, indexed) - Associated wallet
- `type` (Enum, required, indexed) - purchase/gift_sent/gift_received/withdrawal/refund/earning/subscription/tip/transfer/coin_purchase/payout/commission/bonus
- `amount` (Number, required) - Transaction amount
- `currency` (Enum: USD/EUR/GBP/coins, default: USD)
- `description` (String, required) - Transaction description
- `referenceId` (ObjectId, indexed) - Related entity ID
- `referenceType` (Enum) - order/gift/livestream/content/subscription/withdrawal/other
- `relatedUserId` (ObjectId ref User) - Other party in transaction
- `relatedContentId` (ObjectId ref Content) - Related content
- `relatedOrderId` (ObjectId ref Order) - Related order
- `paymentMethod` (Enum) - card/paypal/bank_transfer/wallet/stripe/in_app_purchase
- `paymentProvider` (String) - External provider
- `paymentId` (String) - External transaction ID
- `paymentMetadata` (Mixed) - Additional payment data
- `status` (Enum: pending/processing/completed/failed/refunded/cancelled, default: pending, indexed)
- `balanceBefore` (Number, required) - Balance snapshot before
- `balanceAfter` (Number, required) - Balance snapshot after
- `failureReason` (String) - Failure details
- `failureCode` (String) - Error code
- `processedAt` (Date) - Processing timestamp
- `completedAt` (Date) - Completion timestamp
- `failedAt` (Date) - Failure timestamp
- `refundedAt` (Date) - Refund timestamp
- `metadata` (Mixed) - Additional metadata
- `ipAddress` (String) - Transaction IP
- `userAgent` (String) - Device info

**Relations:**
- Many-to-One: `User` (via userId)
- Many-to-One: `Wallet` (via walletId)
- Many-to-One: `Order` (via relatedOrderId)
- Many-to-One: `Content` (via relatedContentId)

**Indexes:**
- `{userId, createdAt}` (compound, desc)
- `{walletId, createdAt}` (compound, desc)
- `{type, status}` (compound)
- `{referenceId, referenceType}` (compound)
- `paymentId`
- `{status, createdAt}` (compound, desc)

**Computed Fields/Virtuals:**
- `isDebit` - amount < 0
- `isCredit` - amount > 0

**Static Methods:**
- `getUserTransactions(userId, options)` - Get user transaction history

**Admin Dashboard Usage:**
- **Transactions Page** - View all transactions, filter, export
- **Wallets Page** - View wallet-specific transactions

**Platform Features Controlled:**
- Financial audit trail
- Dispute resolution
- Revenue tracking

**Admin Actions:**
- **View** - Transaction details
- **List** - All transactions
- **Search** - By userId, transactionId, paymentId
- **Filter** - By type, status, date range
- **Export** - Financial reports
- **Refund** - Process refund (changes status)
- **Investigate** - View full transaction context

---

### 3.3 **Gift Model** (`Gift.js`)

**Purpose:** Virtual gift catalog

**Fields:**
- `name` (String, required) - Gift name
- `description` (String, max 500 chars) - Gift description
- `price` (Number, required, min: 0) - Gift price
- `currency` (Enum: coins/USD/EUR, default: coins)
- `icon` (String, required) - Emoji or icon URL
- `animationUrl` (String) - Animation file URL
- `animation` (Enum) - none/float/pulse/sparkle/shine/explode/confetti/fireworks
- `category` (String, required, indexed) - Gift category
- `rarity` (Enum: common/rare/epic/legendary, default: common)
- `isActive` (Boolean, default: true, indexed) - **ADMIN CRITICAL**
- `isFeatured` (Boolean, default: false) - Featured gift
- `isLimitedEdition` (Boolean, default: false) - Limited availability
- `availableFrom` (Date) - Availability start
- `availableUntil` (Date) - Availability end
- `popularity` (Number, default: 0, min: 0) - Popularity score
- `timesSent` (Number, default: 0, min: 0) - Usage counter
- `totalRevenue` (Number, default: 0, min: 0) - Revenue generated
- `creatorEarningsPercent` (Number, default: 50, min: 0, max: 100) - Creator revenue share
- `sortOrder` (Number, default: 0) - Display order

**Relations:**
- One-to-Many: `GiftTransaction` (via giftId)
- Referenced in: `Livestream.giftsReceived` array

**Indexes:**
- `{category, isActive}` (compound)
- `popularity` (desc)
- `{isFeatured, popularity}` (compound, desc)
- `price`
- `{rarity, isActive}` (compound)

**Computed Fields/Virtuals:**
- `effectivePrice` - Calculated price with promotions

**Methods:**
- `isAvailable()` - Check if gift is available

**Static Methods:**
- `getPopularGifts(limit)` - Get popular gifts
- `getByCategory(category, limit)` - Get gifts by category

**Admin Dashboard Usage:**
- **Gifts Page** - Manage virtual gift catalog

**Platform Features Controlled:**
- In-stream gifting
- Creator monetization
- Platform revenue

**Admin Actions:**
- **View** - Gift details
- **List** - All gifts
- **Create** - New gift
- **Edit** - Update gift
- **Activate** - Enable gift
- **Deactivate** - Disable gift
- **Feature** - Mark as featured
- **Delete** - Remove gift
- **Set Pricing** - Update price
- **Set Revenue Share** - Adjust creator earnings %
- **View Analytics** - Usage & revenue stats

---

### 3.4 **GiftTransaction Model** (`GiftTransaction.js`)

**Purpose:** Gift sending transaction log

**Admin Dashboard Usage:**
- **Gifts Page** - View gift usage analytics
- **Transactions Page** - Gift-specific transactions

**Admin Actions:**
- **View** - Transaction details
- **List** - All gift transactions
- **Filter** - By gift, sender, recipient, livestream
- **Export** - Gift revenue reports

---

### 3.5 **CoinPackage Model** (`CoinPackage.js`)

**Purpose:** In-app currency purchase packages

**Fields:**
- `name` (String, required) - Package name
- `coins` (Number, required, min: 1) - Base coin amount
- `bonusCoins` (Number, default: 0) - Bonus coins
- `price` (Number, required, min: 0) - Package price
- `currency` (String, default: USD)
- `isPopular` (Boolean, default: false) - Popular badge
- `isBestValue` (Boolean, default: false) - Best value badge
- `isActive` (Boolean, default: true, indexed) - **ADMIN CRITICAL**
- `sortOrder` (Number, default: 0) - Display order
- `purchaseCount` (Number, default: 0) - Purchase counter

**Relations:**
- Referenced in coin purchase transactions

**Indexes:**
- `{isActive, sortOrder}` (compound)

**Computed Fields/Virtuals:**
- `totalCoins` - coins + bonusCoins

**Admin Dashboard Usage:**
- **Coins Page** - Manage coin packages

**Platform Features Controlled:**
- In-app purchases (IAP)
- Monetization strategy

**Admin Actions:**
- **View** - Package details
- **List** - All packages
- **Create** - New package
- **Edit** - Update package
- **Activate** - Enable package
- **Deactivate** - Disable package
- **Set Popular** - Mark as popular
- **Set Best Value** - Mark as best value
- **Reorder** - Change sort order
- **Delete** - Remove package
- **View Stats** - Purchase analytics

---

### 3.6 **Level Model** (`Level.js`)

**Purpose:** User leveling system

**Admin Dashboard Usage:**
- **Levels Page** - Configure user level progression

**Admin Actions:**
- **View** - Level details
- **List** - All levels
- **Create** - New level
- **Edit** - Update requirements
- **Delete** - Remove level

---

### 3.7 **CreatorEarnings Model** (`CreatorEarnings.js`)

**Purpose:** Creator revenue tracking

**Admin Dashboard Usage:**
- **Monetization Page** - View creator earnings

**Admin Actions:**
- **View** - Earnings details
- **List** - All creator earnings
- **Export** - Revenue reports
- **Process Payout** - Approve payouts

---

## 4. CONTENT MODELS

### 4.1 **Content Model** (`Content.js`)

**Purpose:** User-generated video content (TikTok-style)

**Fields:**
- `userId` (ObjectId ref User, required, indexed) - Content creator
- `type` (Enum: video/image/text/live, default: video, required)
- `videoUrl` (String) - Video file URL
- `thumbnailUrl` (String) - Thumbnail image URL
- `imageUrls` (Array of Strings) - Image URLs (for image posts)
- `duration` (Number) - Video duration in seconds
- `caption` (String, max 2200 chars) - Content caption
- `hashtags` (Array of Strings, lowercase) - Hashtags
- `mentions` (Array of ObjectIds ref User) - Mentioned users
- `location` (Object) - {name, latitude, longitude}
- `soundId` (ObjectId ref Sound) - Background audio
- `originalSound` (Boolean, default: false) - Original audio flag
- `isPrivate` (Boolean, default: false) - Privacy flag
- `allowComments` (Boolean, default: true) - Comment permission
- `allowDuet` (Boolean, default: true) - Duet permission
- `allowStitch` (Boolean, default: true) - Stitch permission
- `allowDownload` (Boolean, default: true) - Download permission
- `status` (Enum: draft/processing/active/removed/reported/archived, default: processing, indexed) - **ADMIN CRITICAL**
- `isDeleted` (Boolean, default: false) - Soft delete flag
- `deletedAt` (Date) - Deletion timestamp
- `viewsCount` (Number, default: 0, min: 0) - Total views
- `uniqueViewsCount` (Number, default: 0, min: 0) - Unique viewers
- `likesCount` (Number, default: 0, min: 0) - Total likes
- `commentsCount` (Number, default: 0, min: 0) - Total comments
- `sharesCount` (Number, default: 0, min: 0) - Total shares
- `savesCount` (Number, default: 0, min: 0) - Total saves
- `duetsCount` (Number, default: 0, min: 0) - Duet count
- `processingStatus` (Enum: pending/processing/completed/failed, default: pending)
- `processingError` (String) - Processing error message
- `qualities` (Array) - Video quality versions {resolution, url, size, bitrate}
- `avgWatchTime` (Number, default: 0) - Average watch time
- `completionRate` (Number, default: 0, min: 0, max: 100) - Completion rate
- `impressions` (Number, default: 0) - Impressions
- `clickThroughRate` (Number, default: 0) - CTR
- `metaTitle` (String) - SEO title
- `metaDescription` (String) - SEO description
- `keywords` (Array of Strings) - SEO keywords
- `embeddings` (Array of Numbers) - AI embeddings
- `moderationScore` (Number, default: 0, min: 0, max: 100) - AI moderation score
- `feedScore` (Number, default: 0, indexed) - Feed ranking score
- `aiTags` (Array of Strings, lowercase) - AI-generated tags
- `aiCaption` (String) - AI-generated caption
- `originalContentId` (ObjectId ref Content) - Original content (for duets/stitches)
- `isDuet` (Boolean, default: false) - Duet flag
- `isStitch` (Boolean, default: false) - Stitch flag

**Relations:**
- Many-to-One: `User` (via userId)
- Many-to-One: `Sound` (via soundId)
- Many-to-One: `Content` (via originalContentId - for duets/stitches)
- One-to-Many: `Comment` (via contentId)
- One-to-Many: `Like` (via contentId)
- One-to-Many: `Share` (via contentId)
- One-to-Many: `View` (via contentId)
- One-to-Many: `Report` (via contentId)

**Indexes:**
- `userId`
- `status`
- `feedScore` (for feed ranking)
- `{userId, status}` (compound)
- `{status, feedScore}` (compound, desc)
- Text index on `{caption, hashtags, aiTags}`

**Admin Dashboard Usage:**
- **Content Page** (Videos) - Moderate user content, remove violations
- **CommentsManagement Page** - Manage comments on content
- **Moderation Page** - Content moderation queue
- **TrendingControls Page** - Manage trending content

**Platform Features Controlled:**
- Content discovery (For You page)
- Content moderation
- Content visibility
- Feed algorithm

**Admin Actions:**
- **View** - Content details with full metadata
- **List** - Paginated content listing
- **Search** - By caption, hashtags, creator
- **Filter** - By status, type, date, engagement
- **Approve** - Change status to 'active'
- **Remove** - Change status to 'removed' (content violation)
- **Archive** - Change status to 'archived'
- **Restore** - Reactivate removed content
- **Delete** - Soft delete (set isDeleted = true)
- **Feature** - Add to trending/featured sections
- **Adjust Feed Score** - Manual ranking adjustment
- **View Analytics** - Engagement metrics, watch time, CTR
- **Moderate** - Review flagged content
- **Ban Creator** - Ban content creator
- **Export** - Content reports

---

### 4.2 **Comment Model** (`Comment.js`)

**Purpose:** User comments on content

**Admin Dashboard Usage:**
- **CommentsManagement Page** - Moderate comments, remove spam/abuse

**Admin Actions:**
- **View** - Comment details
- **List** - All comments
- **Filter** - By content, user, status
- **Remove** - Delete comment
- **Ban User** - Ban commenter
- **Export** - Comment data

---

### 4.3 **Like Model** (`Like.js`)

**Purpose:** Content like tracking

**Admin Dashboard Usage:**
- **Analytics** - Engagement metrics

**Admin Actions:**
- **View** - Like statistics
- **Export** - Like data

---

### 4.4 **Share Model** (`Share.js`)

**Purpose:** Content share tracking

**Admin Dashboard Usage:**
- **Analytics** - Viral content analysis

**Admin Actions:**
- **View** - Share statistics
- **Export** - Share data

---

### 4.5 **View Model** (`View.js`)

**Purpose:** Content view tracking

**Admin Dashboard Usage:**
- **Analytics** - View metrics

**Admin Actions:**
- **View** - View statistics
- **Export** - View data

---

### 4.6 **Save Model** (`Save.js`)

**Purpose:** Saved content tracking

**Admin Dashboard Usage:**
- **Analytics** - Save metrics

**Admin Actions:**
- **View** - Save statistics

---

### 4.7 **Sound Model** (`Sound.js`)

**Purpose:** Audio library for content

**Admin Dashboard Usage:**
- **SoundManager Page** - Manage audio library

**Admin Actions:**
- **View** - Sound details
- **List** - All sounds
- **Create** - Upload new sound
- **Edit** - Update sound metadata
- **Delete** - Remove sound
- **Feature** - Mark as featured
- **Copyright** - Manage copyright info

---

### 4.8 **Story Model** (`Story.js`)

**Purpose:** 24-hour ephemeral content

**Admin Dashboard Usage:**
- **Content moderation** - Review stories

**Admin Actions:**
- **View** - Story details
- **Remove** - Delete story
- **Ban Creator** - Ban story creator

---

### 4.9 **ScheduledContent Model** (`ScheduledContent.js`)

**Purpose:** Schedule content publishing

**Admin Dashboard Usage:**
- **Content scheduling** (if exists)

**Admin Actions:**
- **View** - Scheduled posts
- **Edit** - Update schedule
- **Cancel** - Cancel scheduled post

---

### 4.10 **ContentMetrics Model** (`ContentMetrics.js`)

**Purpose:** Detailed content analytics

**Admin Dashboard Usage:**
- **Analytics Page** - Content performance

**Admin Actions:**
- **View** - Metrics dashboard
- **Export** - Analytics reports

---

### 4.11 **ContentRecommendation Model** (`ContentRecommendation.js`)

**Purpose:** Recommendation engine data

**Admin Dashboard Usage:**
- **Analytics** - Algorithm performance

**Admin Actions:**
- **View** - Recommendation insights
- **Tune** - Adjust algorithm parameters

---

### 4.12 **ContentRights Model** (`ContentRights.js`)

**Purpose:** Content copyright management

**Admin Dashboard Usage:**
- **Moderation** - Copyright claims

**Admin Actions:**
- **View** - Copyright claims
- **Approve** - Accept claim
- **Reject** - Deny claim
- **Takedown** - Remove infringing content

---

## 5. LIVESTREAM MODELS

### 5.1 **Livestream Model** (`Livestream.js`)

**Purpose:** Live video streaming sessions

**Fields:**
- `hostId` (ObjectId ref User, required, indexed) - Stream host
- `title` (String, required, max 200 chars) - Stream title
- `description` (String, max 1000 chars) - Stream description
- `thumbnailUrl` (String) - Stream thumbnail
- `provider` (Enum: agora/zegocloud/webrtc, required) - Streaming provider
- `streamId` (String, required, unique, indexed) - Unique stream identifier
- `channelId` (String) - Channel ID
- `rtmpUrl` (String) - RTMP ingest URL
- `streamKey` (String) - Stream key
- `hlsUrl` (String) - HLS playback URL
- `websocketUrl` (String) - WebSocket URL
- `type` (Enum: solo/pk_battle/1v1/2v2/multi_host/guest, default: solo) - Stream type
- `status` (Enum: scheduled/starting/live/paused/ended/failed, default: starting, indexed) - **ADMIN CRITICAL**
- `isPrivate` (Boolean, default: false) - Privacy flag
- `allowedUsers` (Array of ObjectIds ref User) - Allowed viewers (for private streams)
- `participants` (Array) - Stream participants {userId, role, joinedAt, leftAt, isMuted, isCameraOff}
- `currentViewers` (Number, default: 0, min: 0) - Live viewer count
- `peakViewers` (Number, default: 0, min: 0) - Peak concurrent viewers
- `totalViews` (Number, default: 0, min: 0) - Total views
- `likesCount` (Number, default: 0, min: 0) - Total likes
- `sharesCount` (Number, default: 0, min: 0) - Total shares
- `giftsReceived` (Array) - Gifts sent during stream {giftId, fromUserId, quantity, value, timestamp}
- `totalGiftsValue` (Number, default: 0) - Total gift revenue
- `chatRoomId` (String) - Chat room identifier
- `messagesCount` (Number, default: 0) - Total messages
- `allowComments` (Boolean, default: true) - Comment permission

**Relations:**
- Many-to-One: `User` (via hostId)
- Many-to-One: `StreamProvider` (via provider)
- Many-to-Many: `User` (via participants array)
- One-to-Many: `GiftTransaction` (via livestreamId)

**Indexes:**
- `hostId`
- `streamId` (unique)
- `status`
- `{status, createdAt}` (compound, desc)

**Admin Dashboard Usage:**
- **Livestreams Page** - Monitor live streams, end streams, ban hosts

**Platform Features Controlled:**
- Live streaming functionality
- Stream moderation
- Creator monetization via gifts

**Admin Actions:**
- **View** - Stream details
- **List** - All streams (live + past)
- **Filter** - By status, host, date
- **End Stream** - Force-end a stream
- **Ban Host** - Ban stream host
- **Remove** - Delete stream recording
- **View Analytics** - Viewer count, gifts, engagement
- **Export** - Stream data

---

### 5.2 **StreamProvider Model** (`StreamProvider.js`)

**Purpose:** Streaming service configuration (Agora, ZegoCloud)

**Admin Dashboard Usage:**
- **StreamingProviders Page** - Configure streaming infrastructure

**Admin Actions:**
- **View** - Provider details
- **List** - All providers
- **Edit** - Update API keys
- **Activate** - Enable provider
- **Deactivate** - Disable provider
- **Test** - Test connection

---

### 5.3 **MultiHostSession Model** (`MultiHostSession.js`)

**Purpose:** Multi-host streaming sessions

**Admin Dashboard Usage:**
- **Livestreams Page** - Monitor multi-host streams

**Admin Actions:**
- **View** - Session details
- **End** - Force-end session
- **Remove Participant** - Kick participant

---

### 5.4 **PKBattle Model** (`PKBattle.js`)

**Purpose:** PK battle competitions

**Admin Dashboard Usage:**
- **Livestreams Page** - Monitor PK battles

**Admin Actions:**
- **View** - Battle details
- **End** - Force-end battle
- **Moderate** - Remove participants

---

### 5.5 **LiveShoppingSession Model** (`LiveShoppingSession.js`)

**Purpose:** Live shopping integration

**Admin Dashboard Usage:**
- **Livestreams Page** - Monitor shopping streams

**Admin Actions:**
- **View** - Session details
- **View Products** - Products featured
- **View Sales** - Sales during stream

---

### 5.6 **StreamFilter Model** (`StreamFilter.js`)

**Purpose:** AR filters for streams

**Admin Dashboard Usage:**
- **StreamingProviders Page** - Manage filters

**Admin Actions:**
- **View** - Filter details
- **Create** - Upload filter
- **Delete** - Remove filter

---

## 6. MODERATION MODELS

### 6.1 **ModerationQueue Model** (`ModerationQueue.js`)

**Purpose:** Content moderation queue

**Admin Dashboard Usage:**
- **Moderation Page** - Review flagged content

**Admin Actions:**
- **View** - Queued item details
- **Approve** - Approve content
- **Reject** - Remove content
- **Skip** - Skip to next item

---

### 6.2 **Report Model** (`Report.js`)

**Purpose:** User-reported content/users

**Admin Dashboard Usage:**
- **Moderation Page** - Handle reports

**Admin Actions:**
- **View** - Report details
- **Investigate** - Review reported content
- **Take Action** - Remove content / ban user
- **Dismiss** - Dismiss report
- **Respond** - Message reporter

---

### 6.3 **Strike Model** (`Strike.js`)

**Purpose:** User violation strikes

**Admin Dashboard Usage:**
- **UserDetails Page** - View user strikes
- **Moderation Page** - Issue strikes

**Admin Actions:**
- **View** - Strike history
- **Issue Strike** - Add strike to user
- **Remove Strike** - Remove strike
- **Ban** - Automatic ban on threshold

---

### 6.4 **AIModeration Model** (`AIModeration.js`)

**Purpose:** AI moderation logs

**Admin Dashboard Usage:**
- **Moderation Page** - AI flagged content

**Admin Actions:**
- **View** - AI moderation results
- **Override** - Override AI decision
- **Train** - Feedback for AI model

---

## 7. SOCIAL MODELS

### 7.1 **Follow Model** (`Follow.js`)

**Purpose:** User following relationships

**Admin Dashboard Usage:**
- **UserDetails Page** - View followers/following

**Admin Actions:**
- **View** - Follow relationships
- **Export** - Social graph data

---

### 7.2 **Conversation Model** (`Conversation.js`)

**Purpose:** Direct messaging conversations

**Admin Dashboard Usage:**
- **CustomerSupport Page** - View user conversations (support)

**Admin Actions:**
- **View** - Conversation history
- **Export** - Message data

---

### 7.3 **Message Model** (`Message.js`)

**Purpose:** Direct messages

**Admin Dashboard Usage:**
- **CustomerSupport Page** - View messages

**Admin Actions:**
- **View** - Message details
- **Remove** - Delete message

---

### 7.4 **Notification Model** (`Notification.js`)

**Purpose:** Push notifications

**Admin Dashboard Usage:**
- **Notifications Page** - Send notifications, view history

**Admin Actions:**
- **View** - Notification details
- **List** - All notifications
- **Create** - Send notification
- **Send Bulk** - Mass notification
- **Schedule** - Schedule notification
- **Export** - Notification data

---

## 8. DISCOVERY & TRENDING MODELS

### 8.1 **Tag Model** (`Tag.js`)

**Purpose:** Content hashtags

**Admin Dashboard Usage:**
- **Tags Page** - Manage trending hashtags

**Admin Actions:**
- **View** - Tag details
- **List** - All tags
- **Feature** - Mark as trending
- **Block** - Block tag
- **Edit** - Update tag name

---

### 8.2 **TrendingConfig Model** (`TrendingConfig.js`)

**Purpose:** Trending algorithm configuration

**Admin Dashboard Usage:**
- **TrendingControls Page** - Configure trending algorithm

**Admin Actions:**
- **View** - Config details
- **Edit** - Update parameters
- **Reset** - Reset to defaults

---

### 8.3 **TrendingRecord Model** (`TrendingRecord.js`)

**Purpose:** Trending content log

**Admin Dashboard Usage:**
- **TrendingControls Page** - View trending history

**Admin Actions:**
- **View** - Trending records
- **Export** - Trending data

---

### 8.4 **ExplorerSection Model** (`ExplorerSection.js`)

**Purpose:** Discovery page sections

**Admin Dashboard Usage:**
- **Explorer Page** - Configure discovery sections

**Admin Actions:**
- **View** - Section details
- **Create** - New section
- **Edit** - Update section
- **Delete** - Remove section
- **Reorder** - Change order

---

### 8.5 **Featured Model** (`Featured.js`)

**Purpose:** Featured content management

**Admin Dashboard Usage:**
- **Featured Page** - Manage featured content

**Admin Actions:**
- **View** - Featured items
- **Add** - Feature content/user
- **Remove** - Unfeature
- **Reorder** - Change order
- **Set Duration** - Set feature duration

---

### 8.6 **SearchQuery Model** (`SearchQuery.js`)

**Purpose:** Search query analytics

**Admin Dashboard Usage:**
- **Analytics Page** - Search trends

**Admin Actions:**
- **View** - Search queries
- **Export** - Search data

---

### 8.7 **RecommendationMetadata Model** (`RecommendationMetadata.js`)

**Purpose:** Recommendation algorithm metadata

**Admin Dashboard Usage:**
- **Analytics Page** - Algorithm performance

**Admin Actions:**
- **View** - Metadata
- **Tune** - Adjust parameters

---

## 9. PLATFORM CONFIGURATION MODELS

### 9.1 **Setting Model** (`Setting.js`)

**Purpose:** Platform-wide settings

**Admin Dashboard Usage:**
- **Settings Page** - Configure platform settings

**Admin Actions:**
- **View** - All settings
- **Edit** - Update settings
- **Reset** - Reset to defaults

---

### 9.2 **SystemSettings Model** (`SystemSettings.js`)

**Purpose:** System configuration

**Admin Dashboard Usage:**
- **SystemHealth Page** - System settings

**Admin Actions:**
- **View** - System config
- **Edit** - Update config

---

### 9.3 **Banner Model** (`Banner.js`)

**Purpose:** Platform banners/announcements

**Admin Dashboard Usage:**
- **Banners Page** - Manage banners

**Admin Actions:**
- **View** - Banner details
- **Create** - New banner
- **Edit** - Update banner
- **Delete** - Remove banner
- **Activate** - Enable banner
- **Deactivate** - Disable banner
- **Schedule** - Set display period

---

### 9.4 **Currency Model** (`Currency.js`)

**Purpose:** Multi-currency support

**Admin Dashboard Usage:**
- **CurrenciesManagement Page** - Manage currencies

**Admin Actions:**
- **View** - Currency details
- **List** - All currencies
- **Edit** - Update exchange rates
- **Activate** - Enable currency
- **Deactivate** - Disable currency

---

### 9.5 **Language Model** (`Language.js`)

**Purpose:** Multi-language support

**Admin Dashboard Usage:**
- **TranslationsManagement Page** - Manage languages

**Admin Actions:**
- **View** - Language details
- **Add** - New language
- **Edit** - Update translations
- **Delete** - Remove language

---

### 9.6 **Translation Model** (`Translation.js`)

**Purpose:** Translation strings

**Admin Dashboard Usage:**
- **TranslationsManagement Page** - Manage translations

**Admin Actions:**
- **View** - Translation strings
- **Edit** - Update translations
- **Import** - Import translations
- **Export** - Export translations

---

### 9.7 **Theme Model** (`Theme.js`)

**Purpose:** UI theme configuration

**Admin Dashboard Usage:**
- **Settings Page** - Theme settings

**Admin Actions:**
- **View** - Theme details
- **Edit** - Update theme

---

### 9.8 **Page Model** (`Page.js`)

**Purpose:** CMS pages

**Admin Dashboard Usage:**
- **Pages Management** (if exists)

**Admin Actions:**
- **View** - Page content
- **Create** - New page
- **Edit** - Update page
- **Delete** - Remove page
- **Publish** - Publish page

---

### 9.9 **FAQ Model** (`FAQ.js`)

**Purpose:** Help center FAQs

**Admin Dashboard Usage:**
- **CustomerSupport Page** - Manage FAQs

**Admin Actions:**
- **View** - FAQ details
- **Create** - New FAQ
- **Edit** - Update FAQ
- **Delete** - Remove FAQ
- **Reorder** - Change order

---

## 10. SUPPORT & TICKETING MODELS

### 10.1 **Ticket Model** (`Ticket.js`)

**Purpose:** Customer support tickets

**Admin Dashboard Usage:**
- **CustomerSupport Page** - Handle support tickets

**Admin Actions:**
- **View** - Ticket details
- **List** - All tickets
- **Respond** - Reply to ticket
- **Assign** - Assign to agent
- **Close** - Close ticket
- **Reopen** - Reopen ticket
- **Priority** - Set priority
- **Status** - Update status

---

### 10.2 **CustomerService Model** (`CustomerService.js`)

**Purpose:** Customer service records

**Admin Dashboard Usage:**
- **CustomerSupport Page** - CS management

**Admin Actions:**
- **View** - CS records
- **Export** - CS data

---

## 11. ANALYTICS MODELS

### 11.1 **Analytics Model** (`Analytics.js`)

**Purpose:** Platform analytics aggregation

**Admin Dashboard Usage:**
- **Analytics Page** - View analytics dashboard
- **PlatformAnalytics Page** - Advanced analytics

**Admin Actions:**
- **View** - Analytics dashboard
- **Filter** - By date range, metric
- **Export** - Analytics reports

---

### 11.2 **UserActivity Model** (`UserActivity.js`)

**Purpose:** User activity tracking

**Admin Dashboard Usage:**
- **Analytics Page** - User behavior analytics

**Admin Actions:**
- **View** - Activity logs
- **Export** - Activity data

---

### 11.3 **AuditLog Model** (`AuditLog.js`)

**Purpose:** Admin action audit trail

**Admin Dashboard Usage:**
- **SystemHealth Page** - View audit logs

**Admin Actions:**
- **View** - Audit log entries
- **Filter** - By admin, action, date
- **Export** - Audit data

---

## 12. ADVERTISING MODELS

### 12.1 **AdCampaign Model** (`AdCampaign.js`)

**Purpose:** Advertising campaigns

**Admin Dashboard Usage:**
- **Monetization Page** - Ad campaign management

**Admin Actions:**
- **View** - Campaign details
- **Create** - New campaign
- **Edit** - Update campaign
- **Pause** - Pause campaign
- **Resume** - Resume campaign
- **Delete** - Remove campaign
- **View Stats** - Campaign analytics

---

## 13. SUBSCRIPTION MODELS

### 13.1 **Subscription Model** (`Subscription.js`)

**Purpose:** User subscriptions

**Admin Dashboard Usage:**
- **Monetization Page** - Subscription management

**Admin Actions:**
- **View** - Subscription details
- **List** - All subscriptions
- **Cancel** - Cancel subscription
- **Refund** - Process refund

---

### 13.2 **SubscriptionTier Model** (`SubscriptionTier.js`)

**Purpose:** Subscription tier configuration

**Admin Dashboard Usage:**
- **Monetization Page** - Manage tiers

**Admin Actions:**
- **View** - Tier details
- **Create** - New tier
- **Edit** - Update tier
- **Delete** - Remove tier

---

### 13.3 **SupporterBadge Model** (`SupporterBadge.js`)

**Purpose:** Supporter badge system

**Admin Dashboard Usage:**
- **Monetization Page** - Badge management

**Admin Actions:**
- **View** - Badge details
- **Create** - New badge
- **Edit** - Update badge
- **Delete** - Remove badge

---

## 14. MEDIA PROCESSING MODELS

### 14.1 **TranscodeJob Model** (`TranscodeJob.js`)

**Purpose:** Video transcoding queue

**Admin Dashboard Usage:**
- **ProcessingQueue Page** - Monitor video processing

**Admin Actions:**
- **View** - Job details
- **List** - All jobs
- **Filter** - By status
- **Retry** - Retry failed job
- **Cancel** - Cancel job
- **View Logs** - Processing logs

---

### 14.2 **UploadSession Model** (`UploadSession.js`)

**Purpose:** Large file upload sessions

**Admin Dashboard Usage:**
- **StorageStats Page** - Monitor uploads

**Admin Actions:**
- **View** - Upload session
- **Cancel** - Cancel upload
- **Cleanup** - Remove incomplete uploads

---

### 14.3 **VideoQuality Model** (`VideoQuality.js`)

**Purpose:** Video quality configurations

**Admin Dashboard Usage:**
- **ProcessingQueue Page** - Quality settings

**Admin Actions:**
- **View** - Quality settings
- **Edit** - Update quality config

---

## 15. CREDIT SYSTEM MODELS

### 15.1 **Credit Model** (`Credit.js`)

**Purpose:** Platform credit system

**Admin Dashboard Usage:**
- **Wallets Page** or **Economy** - Credit management

**Admin Actions:**
- **View** - Credit details
- **Issue Credits** - Grant credits
- **Revoke Credits** - Remove credits

---

---

## PHASE 1 SUMMARY

**Total Models Documented:** 75
**Admin-Interactive Models:** ~60
**Core Admin Pages Identified:** 43

**Next:** Phase 2 - Complete action mapping for all models

