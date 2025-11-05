# 🚀 Cruiser MVP Backlog
**Platform:** Flutter Mobile App (TikTok/Instagram Quality)  
**Backend:** Mixillo Backend API (Cloud Run)  
**Admin:** Mixillo Admin Dashboard  
**Date:** November 5, 2025  
**Target:** MVP Launch (≤12 Tickets)

---

## 📋 **MVP SCOPE DEFINITION**

**Core Features:** Feed, Video Player, Camera Recording, Basic Filters, Profile/Follow, Likes/Comments, Wallet Top-up, One Gift Animation, 1v1 Live Streaming

**Excluded from MVP:** Stories, Shops/Seller Flows, Multi-host Streaming, Advanced AR Filters

---

## 🎯 **MVP BACKLOG (12 Tickets)**

### **TICKET #1: Video Feed & Vertical Scroll Player**
**Priority:** P0 (Critical)  
**Figma Frame:** `Figma > Screens > Feed > Feed_Main_VerticalScroll`  
**Estimate:** 8 days

**User Story:**
> As a user, I want to browse videos in a vertical scroll feed with smooth playback, so I can discover content effortlessly.

**Acceptance Criteria:**
- [ ] Vertical scroll feed loads 10 videos on app start
- [ ] Videos auto-play when 80% visible, pause when scrolled away
- [ ] Smooth 60fps scroll with preloading (3 videos ahead)
- [ ] Video player shows: creator avatar, username, like count, comment count, share button
- [ ] Tap video pauses/plays, double-tap triggers like animation
- [ ] Pull-to-refresh loads new videos from `/api/feed`
- [ ] Infinite scroll loads next page (pagination)
- [ ] Memory usage < 200MB for 10 loaded videos
- [ ] Time-to-first-frame < 500ms

**Figma Mapping:**
- Frame: `Feed_Main_VerticalScroll` (Frame ID: `feed-001`)
- Components: `VideoPlayerCard`, `VideoMetadataBar`, `ActionButtons`
- Spacing: 0px between cards (full-screen), 16px padding for metadata

**API Contract:**
```json
GET /api/feed?page=1&limit=10
Headers: Authorization: Bearer <firebase_token>

Response:
{
  "success": true,
  "data": {
    "videos": [
      {
        "id": "video_123",
        "videoUrl": "https://cdn.mixillo.com/videos/video_123.mp4",
        "thumbnailUrl": "https://cdn.mixillo.com/thumbnails/video_123.jpg",
        "creator": {
          "id": "user_456",
          "username": "@creator",
          "avatar": "https://cdn.mixillo.com/avatars/user_456.jpg",
          "verified": false
        },
        "caption": "Check this out! #viral",
        "hashtags": ["#viral", "#trending"],
        "stats": {
          "likes": 1250,
          "comments": 89,
          "shares": 45,
          "views": 12500
        },
        "duration": 30,
        "createdAt": "2025-11-05T18:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "hasMore": true,
      "nextCursor": "eyJpZCI6InZpZGVvXzEyMyJ9"
    }
  }
}

Error Codes:
- 401: Unauthorized (token expired) → Refresh token, retry
- 429: Rate limit → Show "Too many requests, try again later"
- 500: Server error → Show "Unable to load feed, pull to refresh"
```

**State & Data Model:**
```dart
// models/video_feed_item.dart
class VideoFeedItem {
  final String id;
  final String videoUrl;
  final String thumbnailUrl;
  final Creator creator;
  final String caption;
  final List<String> hashtags;
  final VideoStats stats;
  final int duration;
  final DateTime createdAt;
}

// state/video_feed_state.dart
class VideoFeedState {
  List<VideoFeedItem> videos;
  bool isLoading;
  bool hasMore;
  String? nextCursor;
  int currentIndex;
}
```

**Error Handling:**
- Network error → Show "No internet connection" banner, retry button
- 401 → Auto-refresh token, retry request
- Video load failure → Skip to next video, log error
- Memory pressure → Clear cached videos beyond 3-item window

**Performance KPIs:**
- Time-to-first-frame: < 500ms
- Scroll FPS: 60fps
- Memory per video: < 20MB
- Rebuffer ratio: < 1%

**Next 3 Actions:**
- **Designer:** Export video card assets from Figma, confirm spacing (16px padding)
- **Flutter Dev:** Implement `VideoFeedPage` with `PageView.builder`, integrate `video_player` package
- **Backend:** Verify `/api/feed` endpoint returns correct format, add pagination cursor

---

### **TICKET #2: Video Player with Interactions (Like/Comment/Share)**
**Priority:** P0 (Critical)  
**Figma Frame:** `Figma > Screens > Feed > Video_Player_Interactions`  
**Estimate:** 5 days

**User Story:**
> As a user, I want to like, comment, and share videos with smooth animations, so I can engage with content.

**Acceptance Criteria:**
- [ ] Double-tap shows heart animation + increments like count
- [ ] Like button shows filled state when liked
- [ ] Comment button opens bottom sheet with comments list
- [ ] Share button shows share sheet (native share dialog)
- [ ] Like count updates immediately (optimistic UI)
- [ ] All interactions persist to backend
- [ ] Animations are smooth (60fps, < 200ms duration)

**Figma Mapping:**
- Frame: `Video_Player_Interactions` (Frame ID: `interactions-001`)
- Components: `LikeButton`, `CommentButton`, `ShareButton`, `HeartAnimation`
- Spacing: 16px between buttons, 24px from screen edge

**API Contract:**
```json
POST /api/content/:videoId/like
Headers: Authorization: Bearer <firebase_token>
Body: {}

Response:
{
  "success": true,
  "data": {
    "liked": true,
    "likeCount": 1251
  }
}

POST /api/comments
Headers: Authorization: Bearer <firebase_token>
Body: {
  "contentId": "video_123",
  "text": "Great video!"
}

Response:
{
  "success": true,
  "data": {
    "comment": {
      "id": "comment_789",
      "text": "Great video!",
      "creator": { "id": "user_456", "username": "@me" },
      "createdAt": "2025-11-05T18:30:00Z"
    }
  }
}
```

**Next 3 Actions:**
- **Designer:** Export heart animation frames (10 frames), confirm button states (default/pressed/liked)
- **Flutter Dev:** Implement `VideoInteractionOverlay` with gesture detector, integrate `lottie` for animations
- **Backend:** Verify `/api/content/:id/like` and `/api/comments` endpoints, add idempotency for likes

---

### **TICKET #3: Camera Recording with Multi-Clip Support**
**Priority:** P0 (Critical)  
**Figma Frame:** `Figma > Screens > Camera > Camera_Recording_MultiClip`  
**Estimate:** 10 days

**User Story:**
> As a user, I want to record video clips with multiple segments, so I can create engaging content.

**Acceptance Criteria:**
- [ ] Camera opens with preview (front/back toggle)
- [ ] Hold-to-record button captures video (max 60s per clip)
- [ ] Multiple clips show as timeline segments
- [ ] Delete clip button removes last segment
- [ ] Flip camera button works
- [ ] Flash toggle (on/off/auto)
- [ ] Video quality: 1080p @ 30fps
- [ ] Recordings saved to local temp directory

**Figma Mapping:**
- Frame: `Camera_Recording_MultiClip` (Frame ID: `camera-001`)
- Components: `CameraPreview`, `RecordButton`, `ClipTimeline`, `FlipButton`, `FlashButton`

**API Contract:**
```json
POST /api/uploads/presigned-url
Headers: Authorization: Bearer <firebase_token>
Body: {
  "fileName": "video_123.mp4",
  "fileSize": 15728640,
  "mimeType": "video/mp4",
  "contentType": "video"
}

Response:
{
  "success": true,
  "data": {
    "uploadUrl": "https://s3.amazonaws.com/bucket/video_123.mp4?signature=...",
    "key": "videos/user_456/video_123.mp4",
    "contentId": "content_123"
  }
}
```

**Next 3 Actions:**
- **Designer:** Export camera UI assets, confirm button sizes (56x56px for record button)
- **Flutter Dev:** Implement `CameraRecordingPage` using `camera` package, build clip timeline widget
- **Backend:** Verify `/api/uploads/presigned-url` endpoint, test S3 upload flow

---

### **TICKET #4: Basic Video Filters (Beauty, Contrast, Saturation)**
**Priority:** P1 (High)  
**Figma Frame:** `Figma > Screens > Camera > Camera_Filters_Panel`  
**Estimate:** 6 days

**User Story:**
> As a user, I want to apply basic beauty and color filters to my video, so I can enhance my appearance.

**Acceptance Criteria:**
- [ ] Filter panel slides up from bottom
- [ ] 5 preset filters: Original, Beauty, Vibrant, B&W, Warm
- [ ] Beauty filter applies skin smoothing (real-time preview)
- [ ] Filter thumbnails show preview
- [ ] Apply filter updates preview instantly
- [ ] Filter applied to final video export

**Figma Mapping:**
- Frame: `Camera_Filters_Panel` (Frame ID: `filters-001`)
- Components: `FilterThumbnail`, `FilterSlider`, `BeautyToggle`

**Next 3 Actions:**
- **Designer:** Export filter preview thumbnails, confirm panel height (300px)
- **Flutter Dev:** Implement `FilterPanel` using `flutter_ffmpeg` for video processing
- **Backend:** No backend changes (client-side processing)

---

### **TICKET #5: Video Upload & Processing Status**
**Priority:** P0 (Critical)  
**Figma Frame:** `Figma > Screens > Camera > Upload_Progress_Modal`  
**Estimate:** 4 days

**User Story:**
> As a user, I want to see upload progress and know when my video is ready, so I can share it confidently.

**Acceptance Criteria:**
- [ ] Upload modal shows progress bar (0-100%)
- [ ] Upload speed displayed (MB/s)
- [ ] Processing status shown after upload (0-100%)
- [ ] Success message when complete
- [ ] Error handling with retry button
- [ ] Upload continues in background if app minimized

**API Contract:**
```json
POST /api/content
Headers: Authorization: Bearer <firebase_token>
Body: {
  "videoKey": "videos/user_456/video_123.mp4",
  "caption": "My awesome video! #viral",
  "hashtags": ["viral", "trending"],
  "visibility": "public"
}

Response:
{
  "success": true,
  "data": {
    "contentId": "content_123",
    "status": "processing",
    "processingProgress": 0
  }
}

GET /api/content/:contentId/status
Response:
{
  "success": true,
  "data": {
    "status": "published",
    "processingProgress": 100,
    "videoUrl": "https://cdn.mixillo.com/videos/content_123.mp4"
  }
}
```

**Next 3 Actions:**
- **Designer:** Export upload modal design, confirm progress bar style
- **Flutter Dev:** Implement `UploadProgressModal` with `flutter_uploader` package
- **Backend:** Add `/api/content/:id/status` endpoint for processing status polling

---

### **TICKET #6: User Profile with Follow/Unfollow**
**Priority:** P0 (Critical)  
**Figma Frame:** `Figma > Screens > Profile > Profile_User_View`  
**Estimate:** 5 days

**User Story:**
> As a user, I want to view profiles and follow/unfollow creators, so I can curate my feed.

**Acceptance Criteria:**
- [ ] Profile shows: avatar, username, bio, follower/following counts, video grid
- [ ] Follow button toggles to "Following" state
- [ ] Video grid loads user's videos (paginated)
- [ ] Tap video opens full-screen player
- [ ] Profile stats update immediately (optimistic UI)
- [ ] "Edit Profile" button shown for own profile

**Figma Mapping:**
- Frame: `Profile_User_View` (Frame ID: `profile-001`)
- Components: `ProfileHeader`, `VideoGrid`, `FollowButton`

**API Contract:**
```json
GET /api/users/:userId
Headers: Authorization: Bearer <firebase_token>

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "user_456",
      "username": "@creator",
      "displayName": "Creator Name",
      "bio": "Content creator | Love making videos",
      "avatar": "https://cdn.mixillo.com/avatars/user_456.jpg",
      "verified": false,
      "stats": {
        "followers": 12500,
        "following": 450,
        "videos": 89
      },
      "isFollowing": false
    }
  }
}

POST /api/users/:userId/follow
Response:
{
  "success": true,
  "data": {
    "isFollowing": true,
    "followerCount": 12501
  }
}
```

**Next 3 Actions:**
- **Designer:** Export profile layout, confirm grid spacing (2px gap)
- **Flutter Dev:** Implement `UserProfilePage` with `GridView` for videos
- **Backend:** Verify `/api/users/:id` and `/api/users/:id/follow` endpoints

---

### **TICKET #7: Comments Feed & Post Comment**
**Priority:** P1 (High)  
**Figma Frame:** `Figma > Screens > Feed > Comments_BottomSheet`  
**Estimate:** 4 days

**User Story:**
> As a user, I want to view and post comments on videos, so I can engage in discussions.

**Acceptance Criteria:**
- [ ] Bottom sheet slides up with comments list
- [ ] Comments show: avatar, username, text, timestamp, like button
- [ ] Post comment input at bottom
- [ ] Comments load paginated (20 per page)
- [ ] New comment appears immediately (optimistic UI)
- [ ] Like comment updates count instantly

**API Contract:**
```json
GET /api/comments?contentId=video_123&page=1&limit=20
Response:
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": "comment_789",
        "text": "Amazing video!",
        "creator": {
          "id": "user_456",
          "username": "@creator",
          "avatar": "https://cdn.mixillo.com/avatars/user_456.jpg"
        },
        "likes": 45,
        "isLiked": false,
        "createdAt": "2025-11-05T18:30:00Z"
      }
    ],
    "pagination": { "page": 1, "hasMore": true }
  }
}
```

**Next 3 Actions:**
- **Designer:** Export comments bottom sheet design, confirm height (70% screen)
- **Flutter Dev:** Implement `CommentsBottomSheet` with `DraggableScrollableSheet`
- **Backend:** Verify `/api/comments` endpoint pagination

---

### **TICKET #8: Wallet & Coins Purchase Flow**
**Priority:** P0 (Critical)  
**Figma Frame:** `Figma > Screens > Wallet > Wallet_Coins_Purchase`  
**Estimate:** 8 days

**User Story:**
> As a user, I want to purchase coins securely, so I can send gifts during live streams.

**Acceptance Criteria:**
- [ ] Wallet page shows current coin balance
- [ ] Coin packages: 100 ($0.99), 500 ($4.99), 1000 ($9.99), 5000 ($49.99)
- [ ] Tap package opens payment sheet (Apple Pay/Google Pay)
- [ ] Payment processing shows loading state
- [ ] Success shows receipt with transaction ID
- [ ] Balance updates immediately after purchase
- [ ] Purchase history list shows all transactions
- [ ] Failed payments show error with retry option

**Figma Mapping:**
- Frame: `Wallet_Coins_Purchase` (Frame ID: `wallet-001`)
- Components: `CoinBalanceCard`, `CoinPackageCard`, `PaymentButton`

**API Contract:**
```json
GET /api/wallets/balance
Headers: Authorization: Bearer <firebase_token>

Response:
{
  "success": true,
  "data": {
    "coins": 1250,
    "balance": 12.50
  }
}

POST /api/wallets/purchase
Headers: Authorization: Bearer <firebase_token>
Body: {
  "packageId": "package_100",
  "amount": 0.99,
  "paymentMethod": "apple_pay",
  "transactionId": "txn_abc123",
  "idempotencyKey": "idemp_xyz789"
}

Response:
{
  "success": true,
  "data": {
    "transactionId": "txn_abc123",
    "coins": 100,
    "newBalance": 1350,
    "receipt": {
      "id": "receipt_123",
      "amount": 0.99,
      "currency": "USD",
      "timestamp": "2025-11-05T18:30:00Z"
    }
  }
}

Error Codes:
- 400: Invalid package → Show "Package not available"
- 402: Payment failed → Show "Payment failed, try again"
- 409: Duplicate transaction → Ignore (idempotency)
- 500: Server error → Show "Purchase failed, contact support"
```

**Security Requirements:**
- All purchases verified server-side
- Idempotency keys prevent duplicate charges
- Receipts stored in Firestore with audit trail
- PCI compliance: Use Stripe/Apple Pay (no card storage)

**Next 3 Actions:**
- **Designer:** Export wallet UI, coin package cards, payment flow
- **Flutter Dev:** Implement `WalletPage` with `in_app_purchase` package
- **Backend:** Add `/api/wallets/purchase` endpoint with idempotency, integrate payment processor

---

### **TICKET #9: Basic Gift Animation (Heart Gift)**
**Priority:** P1 (High)  
**Figma Frame:** `Figma > Screens > Live > Gift_Animation_Heart`  
**Estimate:** 5 days

**User Story:**
> As a user, I want to send a heart gift animation during live streams, so I can show appreciation.

**Acceptance Criteria:**
- [ ] Gift button opens gift selection (only Heart gift in MVP)
- [ ] Heart gift costs 10 coins
- [ ] Tap "Send" triggers animation on stream
- [ ] Animation plays from bottom, floats up (3s duration)
- [ ] Coin balance decreases immediately
- [ ] Gift sent to backend via WebSocket
- [ ] Animation concurrent support (max 3 simultaneous)

**Figma Mapping:**
- Frame: `Gift_Animation_Heart` (Frame ID: `gift-001`)
- Components: `GiftSelectionModal`, `HeartAnimationLottie`

**API Contract:**
```json
WebSocket Message (Send Gift):
{
  "type": "send_gift",
  "streamId": "stream_123",
  "giftId": "gift_heart",
  "coins": 10,
  "timestamp": 1699200000
}

WebSocket Message (Receive Gift):
{
  "type": "gift_received",
  "giftId": "gift_heart",
  "sender": {
    "id": "user_456",
    "username": "@sender"
  },
  "coins": 10,
  "timestamp": 1699200000
}
```

**Next 3 Actions:**
- **Designer:** Export heart animation Lottie file (10 frames, 3s duration)
- **Flutter Dev:** Implement `GiftAnimationOverlay` with `lottie` package, WebSocket integration
- **Backend:** Add WebSocket gift events to `/api/streaming` socket handlers

---

### **TICKET #10: 1v1 Live Streaming with Chat**
**Priority:** P0 (Critical)  
**Figma Frame:** `Figma > Screens > Live > Live_Stream_1v1`  
**Estimate:** 12 days

**User Story:**
> As a user, I want to start or join 1v1 live streams with real-time chat, so I can interact with creators.

**Acceptance Criteria:**
- [ ] "Go Live" button opens camera preview
- [ ] Start stream creates room, begins broadcasting
- [ ] Join stream shows video player with chat overlay
- [ ] Chat messages appear in real-time (WebSocket)
- [ ] Send message posts to backend
- [ ] Stream reconnects automatically if connection lost
- [ ] End stream shows confirmation, saves recording
- [ ] Viewer count updates in real-time

**Figma Mapping:**
- Frame: `Live_Stream_1v1` (Frame ID: `live-001`)
- Components: `StreamVideoPlayer`, `ChatOverlay`, `ViewerCount`, `EndStreamButton`

**API Contract:**
```json
POST /api/streaming/start
Headers: Authorization: Bearer <firebase_token>
Body: {
  "title": "My Live Stream",
  "isPrivate": false
}

Response:
{
  "success": true,
  "data": {
    "streamId": "stream_123",
    "rtmpUrl": "rtmp://stream.mixillo.com/live/stream_123",
    "streamKey": "key_abc123",
    "chatRoomId": "chat_123",
    "websocketUrl": "wss://mixillo-backend-52242135857.europe-west1.run.app/streaming"
  }
}

WebSocket Connection:
wss://mixillo-backend-52242135857.europe-west1.run.app/streaming?streamId=stream_123&token=<firebase_token>

WebSocket Messages:
- chat_message: { type: "chat", text: "Hello!", sender: {...} }
- viewer_count: { type: "viewers", count: 125 }
- stream_ended: { type: "stream_ended" }
```

**Real-time Requirements:**
- WebSocket reconnection with exponential backoff
- Chat message delivery < 500ms latency
- Stream latency < 3s (use low-latency streaming provider)
- Recommended: Agora.io or Cloudflare Stream

**Next 3 Actions:**
- **Designer:** Export live stream UI, chat overlay, confirm chat message height (60px)
- **Flutter Dev:** Implement `LiveStreamPage` with `agora_rtc_engine` or similar, WebSocket chat
- **Backend:** Verify `/api/streaming/start` endpoint, set up WebSocket handlers for chat

---

### **TICKET #11: Search & Discovery (Hashtags)**
**Priority:** P1 (High)  
**Figma Frame:** `Figma > Screens > Search > Search_Hashtags`  
**Estimate:** 5 days

**User Story:**
> As a user, I want to search for videos and hashtags, so I can discover trending content.

**Acceptance Criteria:**
- [ ] Search bar at top of feed
- [ ] Search by hashtag shows videos with that tag
- [ ] Trending hashtags shown below search
- [ ] Search results paginated (20 per page)
- [ ] Tap hashtag opens hashtag feed
- [ ] Search history saved locally

**API Contract:**
```json
GET /api/search?q=#viral&type=hashtag&page=1
Response:
{
  "success": true,
  "data": {
    "results": [
      {
        "hashtag": "#viral",
        "videoCount": 12500,
        "trending": true
      }
    ]
  }
}

GET /api/feed?hashtag=viral&page=1
Response: (same as Ticket #1 feed response)
```

**Next 3 Actions:**
- **Designer:** Export search UI, hashtag chip design
- **Flutter Dev:** Implement `SearchPage` with `Debouncer` for search input
- **Backend:** Add `/api/search` endpoint with hashtag search

---

### **TICKET #12: Notifications (In-App)**
**Priority:** P1 (High)  
**Figma Frame:** `Figma > Screens > Profile > Notifications_List`  
**Estimate:** 4 days

**User Story:**
> As a user, I want to receive notifications for likes, comments, and follows, so I stay engaged.

**Acceptance Criteria:**
- [ ] Notification bell icon in app bar
- [ ] Notification list shows: type, user, message, timestamp
- [ ] Tap notification opens relevant content
- [ ] Mark as read updates badge count
- [ ] Notifications load from `/api/notifications`
- [ ] Real-time updates via WebSocket (optional for MVP)

**API Contract:**
```json
GET /api/notifications?page=1&limit=20
Response:
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_123",
        "type": "like",
        "user": {
          "id": "user_456",
          "username": "@creator",
          "avatar": "https://cdn.mixillo.com/avatars/user_456.jpg"
        },
        "content": {
          "id": "video_123",
          "thumbnail": "https://cdn.mixillo.com/thumbnails/video_123.jpg"
        },
        "read": false,
        "createdAt": "2025-11-05T18:30:00Z"
      }
    ]
  }
}
```

**Next 3 Actions:**
- **Designer:** Export notification list item design, badge indicator
- **Flutter Dev:** Implement `NotificationsPage` with `PullToRefresh`
- **Backend:** Verify `/api/notifications` endpoint exists (check `notifications-firestore.js`)

---

## 🧪 **INTEGRATION SMOKE TEST**

### **Critical Path Test:**
1. **Login** → Firebase Auth → Get token
2. **Load Feed** → `/api/feed` → Display videos
3. **Like Video** → `/api/content/:id/like` → Update UI
4. **Open Comments** → `/api/comments` → Display comments
5. **Post Comment** → `/api/comments` POST → Show in list
6. **View Profile** → `/api/users/:id` → Display profile
7. **Follow User** → `/api/users/:id/follow` → Update button
8. **Purchase Coins** → `/api/wallets/purchase` → Update balance
9. **Start Stream** → `/api/streaming/start` → Connect WebSocket
10. **Send Gift** → WebSocket message → Animation plays

**All 10 steps must pass for MVP release.**

---

## 📊 **MVP SUCCESS METRICS**

- **Time-to-first-video:** < 2s
- **Video playback success rate:** > 99%
- **Purchase success rate:** > 95%
- **Stream connection success:** > 98%
- **App crash rate:** < 0.1%

---

## 🚀 **NEXT ACTIONS SUMMARY**

### **Immediate (Week 1):**
1. **Designer:** Export all Figma frames for Tickets #1-3 (Feed, Interactions, Camera)
2. **Flutter Dev:** Set up project structure, integrate `video_player`, `camera` packages
3. **Backend:** Verify all MVP endpoints exist and return correct format

### **Week 2-3:**
1. **Designer:** Export remaining Figma frames (Tickets #4-12)
2. **Flutter Dev:** Implement Tickets #1-6 (Feed, Interactions, Camera, Filters, Upload, Profile)
3. **Backend:** Add missing endpoints, test WebSocket for streaming

### **Week 4:**
1. **Flutter Dev:** Implement Tickets #7-12 (Comments, Wallet, Gifts, Live, Search, Notifications)
2. **QA:** Run integration smoke test, create bug reports
3. **Backend:** Load testing for streaming endpoints

---

## 📝 **API VERIFICATION CHECKLIST**

## ✅ **MVP ENDPOINTS STATUS (ALL COMPLETE)**

**All MVP endpoints have been added and deployed!**

| Endpoint | Status | File | Notes |
|----------|--------|------|-------|
| `GET /api/feed` | ✅ **ENHANCED** | `feed-firestore.js` | Returns videos with pagination |
| `POST /api/content/:id/like` | ✅ **ADDED** | `content-firestore.js` | Toggles like, returns count |
| `POST /api/comments` | ✅ **EXISTS** | `comments-firestore.js` | Creates comment |
| `GET /api/comments?contentId=:id` | ✅ **EXISTS** | `comments-firestore.js` | Returns comments list |
| `GET /api/users/:id` | ✅ **ENHANCED** | `users-firestore.js` | Returns user profile with stats & isFollowing |
| `POST /api/users/:id/follow` | ✅ **ADDED** | `users-firestore.js` | Toggles follow, returns count |
| `POST /api/uploads/presigned-url` | ✅ **EXISTS** | `uploads-firestore.js` | Returns S3 upload URL |
| `POST /api/content` | ✅ **EXISTS** | `content-firestore.js` | Creates content record |
| `GET /api/wallets/balance` | ✅ **ENHANCED** | `wallets-firestore.js` | Returns coins & balance |
| `POST /api/wallets/purchase` | ✅ **ADDED** | `wallets-firestore.js` | Processes purchase with idempotency |
| `POST /api/streaming/start` | ✅ **ADDED** | `streaming-firestore.js` | Creates stream, returns RTMP/WebSocket URLs |
| `GET /api/notifications` | ✅ **ADDED** | `notifications-firestore.js` | Returns notifications list |
| `GET /api/search?q=:query` | ✅ **ADDED** | `search-firestore.js` | Returns search results (hashtags, users, videos) |

**Deployment Status:** ✅ **DEPLOYED** (Revision: mixillo-backend-00053-7sf)

---

**Status:** ✅ **MVP BACKLOG COMPLETE & DEPLOYED**  
**Backend:** ✅ **All endpoints ready**  
**Ready for:** Flutter development kickoff, Design handoff

