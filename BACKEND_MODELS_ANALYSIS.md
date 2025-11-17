# Backend Models Comprehensive Analysis

**Generated:** November 16, 2025  
**Total Models Analyzed:** 19 Critical Models for Flutter Integration  
**Source:** `backend/src/models/` directory

## Executive Summary

This document provides a complete analysis of backend Mongoose models required for Flutter integration. Each model has been analyzed for field types, relationships, defaults, and methods to enable accurate Dart model creation.

---

## Model Categories

### 💰 Financial & Wallet System (4 models)
1. **Wallet** - User digital wallet with balance tracking
2. **Transaction** - Financial transaction history
3. **CoinPackage** - Virtual currency purchase packages
4. **Currency** - Multi-currency support system

### 🎁 Gifting System (2 models)
5. **Gift** - Virtual gift catalog
6. **GiftTransaction** - Gift sending/receiving records

### 💬 Messaging & Communication (3 models)
7. **Message** - Individual chat messages
8. **Conversation** - Chat conversation containers
9. **Notification** - Push notification system

### 🎫 Commerce & Orders (3 models)
10. **Coupon** - Discount coupon system
11. **Shipping** - Order shipping tracking
12. **CustomerService** - Support ticket system

### 📺 Live Streaming Features (4 models)
13. **PKBattle** - Live PK battle contests
14. **LiveShoppingSession** - Live shopping integration
15. **StreamProvider** - Stream provider management
16. **ScheduledContent** - Content scheduling

### 🏆 Gamification (2 models)
17. **Level** - User level system
18. **SupporterBadge** - Supporter badge achievements
19. **Report** - Content/user reporting

---

## Critical Field Patterns

### ObjectId References
All ObjectId fields reference other models and should be converted to `String` in Dart:
- `userId` → User
- `walletId` → Wallet
- `contentId` → Content
- `livestreamId` → Livestream
- `orderId` → Order
- `productId` → Product

### Common Timestamps
Most models use `timestamps: true` adding:
- `createdAt: Date` (auto-generated)
- `updatedAt: Date` (auto-generated)

### Status Enums Pattern
Many models follow a status enum pattern:
- Wallet: currency enum
- Transaction: type, status enums
- Notification: type, priority enums
- Message: type enum
- Order/Shipping: status enums

### Embedded Arrays
Complex nested arrays requiring sub-models:
- `Wallet.paymentMethods[]`
- `Message.reactions[]`
- `Conversation.participantStatus[]`
- `Gift.featuredProducts[]`
- `CustomerService.messages[]`

---

## Model-by-Model Breakdown

### 1. Wallet Model
**Purpose:** Manage user digital wallet, balance, earnings, withdrawals

**Key Fields:**
- `userId`: ObjectId (unique) - User reference
- `balance`: Number (default: 0) - Current wallet balance
- `currency`: String (enum) - USD, EUR, GBP, coins
- `totalEarnings`: Number - Lifetime earnings
- `pendingEarnings`: Number - Earnings not yet withdrawable
- `withdrawableBalance`: Number - Available for withdrawal
- `paymentMethods[]`: Array - Payment method cards

**Relationships:**
- User (1:1) - Each user has one wallet
- Transaction (1:many) - Wallet has many transactions

**Methods:**
- `addFunds(amount, description)` - Add money to wallet
- `deductFunds(amount, description)` - Subtract money
- `transferTo(recipientWalletId, amount)` - Transfer between wallets

**Dart Considerations:**
- Create `PaymentMethod` class for nested array
- Use `double` for balance with 2 decimal places
- Enum for currency types

---

### 2. Transaction Model
**Purpose:** Record all financial transactions (purchases, gifts, withdrawals)

**Key Fields:**
- `userId`: ObjectId (indexed) - Transaction owner
- `walletId`: ObjectId (indexed) - Associated wallet
- `type`: String (enum) - purchase, gift_sent, gift_received, withdrawal, etc.
- `amount`: Number (2 decimals) - Transaction amount (negative for debits)
- `currency`: String (enum) - USD, EUR, GBP, coins
- `description`: String (required) - Transaction description
- `status`: String (enum) - pending, processing, completed, failed, refunded
- `balanceBefore`: Number - Balance snapshot before
- `balanceAfter`: Number - Balance snapshot after
- `paymentMethod`: String (enum) - Payment method used
- `referenceId`: ObjectId - Related entity reference
- `referenceType`: String (enum) - Type of reference

**Relationships:**
- User (many:1)
- Wallet (many:1)
- Order/Gift/Content/Livestream (optional references)

**Virtuals:**
- `isDebit`: Boolean - Negative amount
- `isCredit`: Boolean - Positive amount

**Static Methods:**
- `getUserTransactions(userId, options)` - Get paginated history
- `calculateEarnings(userId, startDate, endDate)` - Calculate total earnings

**Dart Considerations:**
- Create comprehensive enum for all transaction types
- Handle nullable reference fields
- Virtual fields should be computed properties

---

### 3. Notification Model
**Purpose:** Push notifications for user actions/events

**Key Fields:**
- `userId`: ObjectId (indexed) - Notification recipient
- `type`: String (enum) - like, comment, follow, mention, gift, order, etc.
- `title`: String (max: 200) - Notification title
- `body`: String (max: 500) - Notification body text
- `imageUrl`: String (optional) - Notification image
- `senderId`: ObjectId (optional) - Who triggered notification
- `relatedContentId`: ObjectId (optional) - Related content
- `relatedType`: String (enum) - Type of related content
- `isRead`: Boolean (default: false) - Read status
- `readAt`: Date (optional) - When marked read
- `priority`: String (enum) - low, normal, high, urgent
- `sentViaFCM`: Boolean - Was sent via Firebase
- `fcmMessageId`: String - Firebase message ID

**Special Features:**
- TTL Index: Auto-deletes after 90 days
- No `updatedAt` field (only createdAt)

**Methods:**
- `markAsRead()` - Mark notification as read

**Static Methods:**
- `getUnreadCount(userId)` - Count unread notifications
- `markAllAsRead(userId)` - Mark all as read
- `getUserNotifications(userId, options)` - Get paginated list

**Dart Considerations:**
- Create NotificationType enum with 15+ values
- NotificationPriority enum
- Implement unread badge counter logic

---

### 4. Message Model
**Purpose:** Individual chat messages in conversations

**Key Fields:**
- `conversationId`: ObjectId (indexed) - Parent conversation
- `senderId`: ObjectId (indexed) - Message sender
- `type`: String (enum) - text, image, video, audio, gif, sticker, gift, product, location
- `text`: String (max: 5000) - Message text content
- `mediaUrl`: String (optional) - Media file URL
- `thumbnailUrl`: String (optional) - Thumbnail for media
- `giftId`: ObjectId (optional) - Attached gift reference
- `productId`: ObjectId (optional) - Shared product reference
- `location`: Object - Location data (lat, lng, name)
- `replyTo`: ObjectId (optional) - Reply to another message
- `isRead`: Boolean (default: false) - Read status
- `reactions[]`: Array - User emoji reactions

**Nested Objects:**
- `location`: { latitude, longitude, name }
- `reactions[]`: { userId, emoji, createdAt }

**Methods:**
- `markAsRead()` - Mark message as read
- `addReaction(userId, emoji)` - Add emoji reaction
- `removeReaction(userId, emoji)` - Remove reaction

**Dart Considerations:**
- Create MessageType enum (9 values)
- Create LocationData class
- Create MessageReaction class
- Support for media attachments

---

### 5. Conversation Model
**Purpose:** Container for chat messages between users

**Key Fields:**
- `participants[]`: Array<ObjectId> - List of user IDs
- `type`: String (enum) - private, group
- `groupName`: String (optional) - Group chat name
- `groupAvatar`: String (optional) - Group image
- `adminId`: ObjectId (optional) - Group admin
- `lastMessage`: Object - Last message preview
- `participantStatus[]`: Array - Per-user status
- `messagesCount`: Number (default: 0) - Total messages

**Nested Objects:**
- `lastMessage`: { text, senderId, type, timestamp }
- `participantStatus[]`: { userId, unreadCount, lastReadAt, isMuted, isArchived, joinedAt, leftAt }

**Methods:**
- `addParticipant(userId)` - Add user to conversation
- `removeParticipant(userId)` - Remove user
- `incrementUnread(userId)` - Increment unread count
- `markAsRead(userId)` - Reset unread count

**Static Methods:**
- `findBetweenUsers(user1Id, user2Id)` - Find private chat
- `getUserConversations(userId, options)` - Get user's chats

**Dart Considerations:**
- Create LastMessage class
- Create ParticipantStatus class
- Support private vs group logic
- Implement unread badge per conversation

---

### 6. Gift Model
**Purpose:** Virtual gift catalog for livestreams/videos

**Key Fields:**
- `name`: String (required) - Gift name
- `description`: String (max: 500) - Gift description
- `price`: Number (min: 0) - Cost in coins/currency
- `currency`: String (enum) - coins, USD, EUR
- `icon`: String (required) - Emoji or icon URL
- `animationUrl`: String (optional) - Animation file
- `animation`: String (enum) - none, float, pulse, sparkle, etc.
- `category`: String (indexed) - Gift category
- `rarity`: String (enum) - common, rare, epic, legendary
- `isActive`: Boolean (indexed) - Available for purchase
- `isFeatured`: Boolean - Featured in store
- `isLimitedEdition`: Boolean - Time-limited
- `availableFrom`: Date (optional) - Start date
- `availableUntil`: Date (optional) - End date
- `popularity`: Number - Popularity score
- `timesSent`: Number - Total times sent
- `creatorEarningsPercent`: Number (default: 50) - Creator cut

**Virtual:**
- `effectivePrice`: Computed price with promotions

**Methods:**
- `isAvailable()` - Check if gift can be purchased

**Static Methods:**
- `getPopularGifts(limit)` - Get most popular
- `getByCategory(category, limit)` - Get by category

**Dart Considerations:**
- Create GiftRarity enum
- Create GiftAnimation enum
- Support time-based availability checks
- Display sorted by popularity/sortOrder

---

### 7. GiftTransaction Model
**Purpose:** Record of gifts sent between users

**Key Fields:**
- `giftId`: ObjectId (indexed) - Gift catalog reference
- `senderId`: ObjectId (indexed) - Gift sender
- `recipientId`: ObjectId (indexed) - Gift receiver
- `context`: String (enum) - livestream, video, profile, message
- `livestreamId`: ObjectId (optional) - If sent in stream
- `contentId`: ObjectId (optional) - If sent on video
- `quantity`: Number (min: 1) - Number of gifts sent
- `unitPrice`: Number - Price per gift
- `totalCost`: Number - Total transaction cost
- `creatorEarnings`: Number - Amount to creator
- `platformFee`: Number - Amount to platform
- `giftName`: String - Snapshot of gift name
- `giftIcon`: String - Snapshot of gift icon
- `status`: String (enum) - pending, completed, failed, refunded
- `message`: String (max: 200) - Optional message
- `isAnonymous`: Boolean - Hide sender identity
- `isPublic`: Boolean (default: true) - Show in public feed

**Hooks:**
- Pre-save: Auto-calculate earnings split based on gift's creatorEarningsPercent

**Static Methods:**
- `getLivestreamGifts(livestreamId)` - Get gifts for stream
- `calculateTotalReceived(userId, startDate, endDate)` - Calculate earnings

**Dart Considerations:**
- Create GiftContext enum
- Store gift snapshot data (name, icon) for history
- Calculate splits before saving

---

### 8. CoinPackage Model
**Purpose:** Virtual currency purchase packages

**Key Fields:**
- `name`: String (required) - Package name ("100 Coins")
- `coins`: Number (min: 1) - Base coin amount
- `bonusCoins`: Number (default: 0) - Bonus coins
- `price`: Number (min: 0) - Price in real currency
- `currency`: String (default: USD) - Currency code
- `isPopular`: Boolean - Show "Popular" badge
- `isBestValue`: Boolean - Show "Best Value" badge
- `isActive`: Boolean (indexed) - Available for purchase
- `sortOrder`: Number (default: 0) - Display order
- `purchaseCount`: Number - Times purchased

**Virtual:**
- `totalCoins`: coins + bonusCoins

**Dart Considerations:**
- Virtual field should be computed property
- Sort by sortOrder when displaying
- Highlight popular/best value badges

---

### 9. Coupon Model
**Purpose:** Discount coupons for e-commerce

**Key Fields:**
- `code`: String (unique, uppercase) - Coupon code
- `type`: String (enum) - percentage, fixed
- `value`: Number (min: 0) - Discount value
- `minPurchase`: Number (default: 0) - Minimum order amount
- `maxDiscount`: Number (optional) - Max discount cap
- `usageLimit`: Number (optional) - Max uses
- `usageCount`: Number (default: 0) - Current uses
- `validFrom`: Date (optional) - Valid start date
- `validUntil`: Date (optional) - Valid end date
- `isActive`: Boolean - Can be used
- `applicableProducts[]`: Array<ObjectId> - Specific products
- `applicableCategories[]`: Array<ObjectId> - Specific categories

**Dart Considerations:**
- Create CouponType enum
- Validate date ranges before applying
- Check usage limits
- Apply to cart calculation

---

### 10. Level Model
**Purpose:** User progression/leveling system

**Key Fields:**
- `level`: Number (unique, min: 1) - Level number
- `name`: String (optional) - Level name
- `minXP`: Number (default: 0) - XP required to reach
- `maxXP`: Number (required) - XP to next level
- `rewards`: Object - Rewards for reaching level
  - `coins`: Number - Coin reward
  - `badges[]`: Array<String> - Badge IDs
  - `features[]`: Array<String> - Unlocked features
- `icon`: String (optional) - Level icon
- `color`: String (optional) - Level color

**Dart Considerations:**
- Create LevelRewards class
- Calculate user level from total XP
- Display progress bar: (userXP - minXP) / (maxXP - minXP)

---

### 11. SupporterBadge Model
**Purpose:** Badges for loyal supporters/subscribers

**Key Fields:**
- `name`: String (unique) - Badge name
- `description`: String - Badge description
- `icon`: String - Badge icon URL
- `color`: String - Badge color
- `requirement`: String (enum) - subscription, gifts, duration, engagement, special
- `threshold`: Number - Minimum value (e.g., $100 gifts)
- `isActive`: Boolean - Available to earn
- `rarity`: String (enum) - common, rare, epic, legendary

**Dart Considerations:**
- Create BadgeRequirement enum
- Create BadgeRarity enum
- Check user eligibility logic

---

### 12. Report Model
**Purpose:** User reports for content/user moderation

**Key Fields:**
- `reporterId`: ObjectId (indexed) - User who reported
- `reportedType`: String (enum) - content, user, comment, livestream, message, product, store
- `reportedId`: ObjectId (indexed) - ID of reported entity
- `reportedUserId`: ObjectId (optional) - Owner of reported content
- `reason`: String (enum) - spam, harassment, hate_speech, violence, nudity, copyright, false_info, scam, inappropriate, other
- `description`: String (max: 1000) - Detailed explanation
- `screenshots[]`: Array<String> - Evidence URLs
- `status`: String (enum) - pending, under_review, resolved, dismissed
- `reviewedBy`: ObjectId (optional) - Admin who reviewed
- `reviewedAt`: Date (optional) - Review timestamp
- `reviewNotes`: String - Admin notes
- `actionTaken`: String (enum) - none, warning, content_removed, account_suspended, account_banned

**Dart Considerations:**
- Create ReportReason enum (10 values)
- Create ReportedType enum (7 values)
- Create ReportStatus enum
- Create ActionTaken enum
- Support multiple screenshots

---

### 13. CustomerService Model (Support Tickets)
**Purpose:** Customer support ticket system

**Key Fields:**
- `userId`: ObjectId (indexed) - Ticket creator
- `ticketNumber`: String (unique) - Ticket ID
- `subject`: String (required) - Ticket subject
- `category`: String (enum) - account, payment, technical, content, order, other
- `description`: String (required) - Issue description
- `status`: String (enum) - open, in_progress, resolved, closed
- `priority`: String (enum) - low, medium, high, urgent
- `assignedTo`: ObjectId (optional) - Support agent
- `messages[]`: Array - Conversation thread
  - `from`: ObjectId - Message sender
  - `message`: String - Message text
  - `timestamp`: Date - Message time
  - `isStaff`: Boolean - From support team
- `resolvedAt`: Date (optional) - Resolution time
- `resolvedBy`: ObjectId (optional) - Resolver

**Dart Considerations:**
- Create TicketCategory enum
- Create TicketStatus enum
- Create TicketPriority enum
- Create TicketMessage class
- Show conversation thread UI

---

### 14. ScheduledContent Model
**Purpose:** Schedule content for future publishing

**Key Fields:**
- `userId`: ObjectId (indexed) - Content creator
- `contentId`: ObjectId (optional) - Published content ref
- `scheduledFor`: Date (indexed) - Publish timestamp
- `status`: String (enum) - scheduled, published, failed, cancelled
- `contentData`: Mixed - Draft content JSON
- `publishedAt`: Date (optional) - Actual publish time
- `error`: String (optional) - Failure reason

**Dart Considerations:**
- Create ScheduleStatus enum
- Store draft content as JSON
- Show upcoming scheduled posts
- Allow editing before publish

---

### 15. StreamProvider Model
**Purpose:** Live streaming provider configuration

**Key Fields:**
- `name`: String (unique, enum) - agora, zegocloud, webrtc
- `displayName`: String - Human-readable name
- `enabled`: Boolean (default: true) - Provider active
- `status`: String (enum) - active, maintenance, inactive
- `priority`: Number (default: 0) - Failover priority
- `config`: Mixed - Provider config JSON
- `features`: Mixed - Feature flags
- `monthlyUsage`: Number - Usage counter
- `usageLimit`: Number (optional) - Usage cap
- `lastHealthCheck`: Date - Last ping time
- `healthStatus`: String - Health check result

**Dart Considerations:**
- Create StreamProviderName enum
- Create ProviderStatus enum
- Config is provider-specific JSON
- Check health before streaming

---

### 16. PKBattle Model
**Purpose:** PK (Player Killing) battle feature for livestreams

**Key Fields:**
- `host1Id`: ObjectId (required) - First battler
- `host2Id`: ObjectId (required) - Second battler
- `livestreamId`: ObjectId (optional) - Associated stream
- `status`: String (enum) - pending, active, ended
- `host1Score`: Number (default: 0) - Host 1 score
- `host2Score`: Number (default: 0) - Host 2 score
- `winnerId`: ObjectId (optional) - Winner user ID
- `startedAt`: Date - Battle start time
- `endedAt`: Date - Battle end time
- `duration`: Number - Battle length in seconds

**Dart Considerations:**
- Create PKBattleStatus enum
- Real-time score updates via WebSocket
- Display countdown timer
- Animate score changes

---

### 17. LiveShoppingSession Model
**Purpose:** Live shopping feature during livestreams

**Key Fields:**
- `livestreamId`: ObjectId (required, unique) - Parent stream
- `hostId`: ObjectId (required) - Stream host
- `featuredProducts[]`: Array - Products shown
  - `productId`: ObjectId - Product reference
  - `displayOrder`: Number - Show order
  - `featuredAt`: Date - When featured
- `orders[]`: Array - Orders placed during stream
  - `orderId`: ObjectId - Order reference
  - `placedAt`: Date - Order time
  - `total`: Number - Order value
- `totalRevenue`: Number (default: 0) - Session revenue
- `totalOrders`: Number (default: 0) - Order count
- `conversionRate`: Number (default: 0) - Conversion %

**Dart Considerations:**
- Create FeaturedProduct class
- Create SessionOrder class
- Real-time product carousel
- Track conversions

---

### 18. Currency Model
**Purpose:** Multi-currency support system

**Key Fields:**
- `code`: String (unique, 3 chars, uppercase) - ISO code (USD, EUR)
- `name`: String (required) - Currency name
- `symbol`: String (required) - Currency symbol ($, €)
- `exchangeRate`: Number (default: 1) - Rate vs base
- `baseCurrency`: String (default: USD) - Base for rates
- `isActive`: Boolean (default: true) - Available
- `isDefault`: Boolean (default: false) - Default currency
- `decimalPlaces`: Number (default: 2) - Decimal precision
- `country`: String (optional) - Country name
- `flag`: String (optional) - Flag emoji/URL
- `lastUpdated`: Date - Last rate update

**Hooks:**
- Pre-save: Ensure only one default currency

**Static Methods:**
- `getActive()` - Get active currencies
- `getDefault()` - Get default currency

**Methods:**
- `updateRate(newRate)` - Update exchange rate

**Dart Considerations:**
- ISO 4217 currency codes
- Currency conversion logic
- Format by decimalPlaces
- Display flag icons

---

### 19. Shipping Model
**Purpose:** Order shipping and tracking

**Key Fields:**
- `orderId`: ObjectId (unique, indexed) - Parent order
- `userId`: ObjectId (indexed) - Order owner
- `carrier`: String (enum) - USPS, FedEx, UPS, DHL, Other
- `trackingNumber`: String - Tracking ID
- `trackingUrl`: String - Carrier tracking URL
- `status`: String (enum) - pending, in_transit, out_for_delivery, delivered, failed, returned
- `shippedAt`: Date - Ship date
- `estimatedDelivery`: Date - Expected delivery
- `deliveredAt`: Date - Actual delivery
- `currentLocation`: String - Current location
- `events[]`: Array - Tracking timeline
  - `status`: String - Event type
  - `location`: String - Event location
  - `timestamp`: Date - Event time
  - `description`: String - Event details

**Dart Considerations:**
- Create ShippingCarrier enum
- Create ShippingStatus enum
- Create TrackingEvent class
- Show tracking timeline UI
- Link to carrier website

---

## Relationships Map

```
User
├── 1:1 → Wallet
├── 1:many → Transaction
├── 1:many → Notification
├── 1:many → Message (sent)
├── many:many → Conversation (participants)
├── 1:many → GiftTransaction (sent/received)
├── 1:many → Report (reporter)
├── 1:many → CustomerService (tickets)
└── 1:many → ScheduledContent

Wallet
├── 1:1 → User
└── 1:many → Transaction

Conversation
├── many:many → User (participants)
└── 1:many → Message

Gift
└── 1:many → GiftTransaction

GiftTransaction
├── many:1 → Gift
├── many:1 → User (sender)
├── many:1 → User (recipient)
├── many:1 → Livestream (optional)
└── many:1 → Content (optional)

Order
└── 1:1 → Shipping

Livestream
├── 1:1 → LiveShoppingSession
└── 1:many → PKBattle
```

---

## Dart Model Generation Guidelines

### 1. Class Naming
- MongoDB: `User`, `Content`, `GiftTransaction`
- Dart: Same convention, add suffixes if needed (`UserModel`, `ContentData`)

### 2. Field Type Conversions

| MongoDB Type | Dart Type |
|--------------|-----------|
| String | String |
| Number | int or double |
| Boolean | bool |
| Date | DateTime |
| ObjectId | String |
| Array | List<T> |
| Mixed | Map<String, dynamic> |
| Enum | Dart enum |

### 3. Null Safety
```dart
// Required field
final String name;

// Optional field
final String? bio;

// Default value
final int count = 0;
```

### 4. JSON Serialization Template
```dart
class Wallet {
  final String id;
  final String userId;
  final double balance;
  final String currency;
  final DateTime createdAt;
  final DateTime updatedAt;
  
  Wallet({
    required this.id,
    required this.userId,
    required this.balance,
    required this.currency,
    required this.createdAt,
    required this.updatedAt,
  });
  
  factory Wallet.fromJson(Map<String, dynamic> json) {
    return Wallet(
      id: json['_id'] as String,
      userId: json['userId'] as String,
      balance: (json['balance'] as num).toDouble(),
      currency: json['currency'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'userId': userId,
      'balance': balance,
      'currency': currency,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}
```

### 5. Enum Generation Template
```dart
enum TransactionType {
  purchase,
  giftSent,
  giftReceived,
  withdrawal,
  refund,
  earning,
  subscription,
  tip,
  transfer,
  coinPurchase,
  payout,
  commission,
  bonus;
  
  String toJson() => name;
  
  static TransactionType fromJson(String json) {
    return TransactionType.values.firstWhere(
      (e) => e.name == json,
      orElse: () => TransactionType.purchase,
    );
  }
}
```

### 6. Nested Object Handling
```dart
// MongoDB: paymentMethods: [{ type, details, isDefault, isVerified }]

class PaymentMethod {
  final String type;
  final Map<String, dynamic> details;
  final bool isDefault;
  final bool isVerified;
  final DateTime? addedAt;
  
  PaymentMethod({
    required this.type,
    required this.details,
    required this.isDefault,
    required this.isVerified,
    this.addedAt,
  });
  
  factory PaymentMethod.fromJson(Map<String, dynamic> json) {
    return PaymentMethod(
      type: json['type'] as String,
      details: json['details'] as Map<String, dynamic>,
      isDefault: json['isDefault'] as bool,
      isVerified: json['isVerified'] as bool,
      addedAt: json['addedAt'] != null 
        ? DateTime.parse(json['addedAt'] as String) 
        : null,
    );
  }
  
  Map<String, dynamic> toJson() => {
    'type': type,
    'details': details,
    'isDefault': isDefault,
    'isVerified': isVerified,
    'addedAt': addedAt?.toIso8601String(),
  };
}

// In Wallet model
final List<PaymentMethod> paymentMethods;
```

### 7. Virtual/Computed Properties
```dart
// MongoDB virtual: isDebit (amount < 0)
// Dart: Getter
class Transaction {
  final double amount;
  
  bool get isDebit => amount < 0;
  bool get isCredit => amount > 0;
}
```

### 8. Date Handling
```dart
// Parse from API
DateTime.parse(json['createdAt'] as String)

// Format for API
dateTime.toIso8601String()

// Display format
import 'package:intl/intl.dart';
DateFormat('MMM dd, yyyy').format(dateTime)
```

---

## API Integration Checklist

For each model, ensure Flutter app can:

- [ ] **GET** single entity by ID
- [ ] **GET** list with pagination
- [ ] **POST** create new entity
- [ ] **PUT/PATCH** update existing entity
- [ ] **DELETE** remove entity
- [ ] Handle error responses (400, 401, 404, 500)
- [ ] Implement loading states
- [ ] Cache frequently accessed data
- [ ] Handle offline mode (if applicable)
- [ ] Validate data before sending
- [ ] Parse nested objects correctly
- [ ] Support filtering/sorting (if applicable)
- [ ] Implement search (if applicable)
- [ ] Handle real-time updates (WebSocket/Socket.IO)

---

## Real-Time Features (Socket.IO)

Models that require real-time updates:

1. **Message** - New messages in conversations
2. **Notification** - New notifications
3. **GiftTransaction** - Gifts during livestream
4. **PKBattle** - Live score updates
5. **Conversation** - Unread count changes
6. **Livestream** - Viewer count, status changes

Socket events to implement in Flutter:
```dart
// Listen
socket.on('message:new', (data) => handleNewMessage(data));
socket.on('notification:new', (data) => handleNewNotification(data));
socket.on('gift:sent', (data) => handleGiftSent(data));
socket.on('conversation:update', (data) => handleConversationUpdate(data));
socket.on('pk_battle:score', (data) => handlePKScoreUpdate(data));

// Emit
socket.emit('message:send', messageData);
socket.emit('conversation:read', conversationId);
socket.emit('livestream:join', streamId);
```

---

## Next Steps for Flutter Integration

1. **Generate Dart Models**
   - Create `.dart` files for all 19 models
   - Add JSON serialization (fromJson/toJson)
   - Create enums for all enum fields
   - Add freezed/json_serializable if using code generation

2. **Create API Services**
   - `WalletService` - Wallet & transaction APIs
   - `NotificationService` - Notification APIs
   - `MessageService` - Messaging APIs
   - `GiftService` - Gift catalog & transactions
   - `ShoppingService` - Commerce & shipping
   - `LiveService` - Livestream features
   - `SupportService` - Customer service

3. **Implement State Management**
   - Use Riverpod/Bloc/Provider for state
   - Create providers for each model
   - Handle loading/error states
   - Implement pagination
   - Cache management

4. **Build UI Components**
   - Wallet balance widget
   - Transaction history list
   - Notification badge & list
   - Message bubbles & conversation list
   - Gift picker & animation
   - Shopping cart & checkout
   - Live stream viewer
   - PK battle scoreboard

5. **Testing**
   - Unit tests for models
   - Widget tests for UI
   - Integration tests for flows
   - Mock API responses
   - Test error handling

---

## Additional Models for Complete System

Models not yet detailed but exist in backend:

- **User** - User accounts and profiles
- **Content** - Video/image posts
- **Livestream** - Live streaming sessions
- **Product** - E-commerce products
- **Order** - Purchase orders
- **Cart** - Shopping cart
- **Comment** - Content comments
- **Like** - Content likes
- **Follow** - User following
- **Story** - 24-hour stories
- **Category** - Product categories
- **Store** - Seller stores
- **Analytics** - Usage analytics
- **Setting** - App settings

Total backend models: **64+**

---

## Conclusion

This comprehensive analysis provides all necessary information to create matching Dart models for the Flutter app. Each model includes:

✅ Complete field list with types  
✅ Required vs optional fields  
✅ Default values  
✅ Enums and their values  
✅ Nested objects structure  
✅ Relationships to other models  
✅ Methods and virtual properties  
✅ Indexes for optimization  
✅ Special features (TTL, hooks, etc.)  

Use `BACKEND_MODELS_INVENTORY.json` for the structured data and this document for implementation guidance.

**Ready for Dart model generation!** 🎯
