# Camera Critical Fixes Required

## Issues Identified from Logs & Screenshots

### 1. ❌ Socket.IO Disconnection (HIGH PRIORITY)
**Problem:** Socket keeps disconnecting every ~30 seconds
```
I/flutter: ❌ Socket.IO disconnected
```

**Root Cause:**
- No auto-reconnect mechanism
- No connection health monitoring
- Token might be expiring

**Fix Required:**
```dart
// Add to socket_service.dart
- Auto-reconnect with exponential backoff
- Connection state management
- Token refresh before reconnection
- Heartbeat/ping mechanism
```

---

### 2. ❌ Missing Post Flow After Photo/Video Capture (CRITICAL)
**Problem:** After capturing photo, user only sees "Retake" and "Use Photo" - no way to add caption, hashtags, or post

**Current Flow:**
```
Camera → Capture Photo → PhotoPreviewPage → ??? (dead end)
```

**Required Flow (TikTok-style):**
```
Camera → Capture → Preview → Post Editor (caption, hashtags, privacy) → Publish
```

**Files to Create:**
1. `post_creation_page.dart` - Main post editor with caption, hashtags
2. `post_service.dart` - API service to upload content
3. Update `photo_preview_page.dart` - Navigate to post creation

---

### 3. ⚠️ Database Locking (PERFORMANCE ISSUE)
**Problem:** Database locked for 10+ seconds blocking UI
```
Warning database has been locked for 0:00:10.000000
```

**Fix Required:**
- Move database operations to isolates
- Use batch transactions
- Add connection pooling

---

### 4. ⚠️ Frame Drops (429 skipped frames!)
**Problem:** UI janky, main thread overloaded
```
Skipped 429 frames! The application may be doing too much work on its main thread
```

**Fix Required:**
- Move image processing to compute()
- Lazy load widgets
- Reduce widget rebuilds with selective watching
- Cache images properly

---

### 5. ⚠️ RenderFlex Overflow (16px bottom)
**Problem:** Still has layout overflow
```
A RenderFlex overflowed by 16 pixels on the bottom
```

**Fix Required:**
- Find and fix remaining overflow widget
- Likely in photo preview or video player UI

---

### 6. ❌ API 404/503 Errors
**Problems:**
```
404: {"success":false,"message":"API endpoint not found"}
503: {"success":false,"message":"Feature being migrated to Firestore"}
```

**Backend Routes Missing:**
- `/api/content/:id/view` - Returns 404
- `/api/feed` - Returns 503

**Fix Required:**
- Update backend or add fallback mock data
- Better error handling in UI

---

## Implementation Priority

### Phase 1: Critical (Do First) ⚡
1. **Fix Socket.IO Auto-Reconnect** (30 min)
2. **Add Post Creation Flow** (2 hours)
3. **Fix RenderFlex Overflow** (15 min)

### Phase 2: Performance (Do Second) 🚀
4. **Optimize Frame Drops** (1 hour)
5. **Fix Database Locking** (1 hour)

### Phase 3: Backend (Can Do Later) 🔧
6. **Fix API Endpoints** (backend work)

---

## Missing Features for TikTok-Level Experience

### Camera Features ✅ (Already Implemented)
- [x] Photo/Video/Live modes
- [x] Flash control
- [x] Speed adjustment
- [x] Beauty effects
- [x] Filters
- [x] Sound picker
- [x] Timer
- [x] Upload from gallery

### Missing Features ❌
- [ ] **Post Creation Screen** - Caption, hashtags, location, privacy
- [ ] **Video Trimming** - Cut/trim imported videos
- [ ] **Text Overlay** - Add text to photos/videos
- [ ] **Stickers** - Add stickers/emojis
- [ ] **Effects** - Transitions, animations
- [ ] **Drafts** - Save posts as drafts
- [ ] **Preview Before Post** - Final review screen
- [ ] **Upload Progress** - Show upload percentage
- [ ] **Post Success** - Confirmation + share options

---

## Third-Party API Keys to Check

### Already Configured:
- ✅ Agora RTC (live streaming)
- ✅ ZegoCloud (alternative streaming)
- ✅ Backend API URL

### Potentially Missing:
- ⚠️ **Google Cloud Storage** - For video/photo uploads
- ⚠️ **Firebase** - If using Firestore (logs mention "migrated to Firestore")
- ⚠️ **CDN** - For serving videos/images
- ⚠️ **Push Notifications** - FCM token

### Check These Files:
```
flutter_app/.env
flutter_app/android/app/google-services.json
flutter_app/ios/Runner/GoogleService-Info.plist
```

---

## Code Structure for Post Creation

### New Files Needed:

#### 1. `lib/features/posts/models/post_model.dart`
```dart
class PostModel {
  final String id;
  final String userId;
  final String mediaUrl;
  final String mediaType; // 'photo', 'video'
  final String? caption;
  final List<String> hashtags;
  final String privacy; // 'public', 'friends', 'private'
  final Map<String, dynamic>? location;
  final DateTime createdAt;
}
```

#### 2. `lib/features/posts/services/post_service.dart`
```dart
class PostService {
  Future<String> uploadMedia(File file);
  Future<PostModel> createPost(PostModel post);
  Future<void> saveAsDraft(PostModel post);
}
```

#### 3. `lib/features/posts/presentation/pages/post_creation_page.dart`
```dart
// Full post editor with:
- Caption input (with @ mentions, # hashtags)
- Privacy selector
- Location picker
- Cover/thumbnail selector
- Post/Draft buttons
```

---

## Immediate Action Items

### 1. Fix Socket.IO (30 minutes)
```dart
// Add exponential backoff reconnection
Timer? _reconnectTimer;
int _reconnectAttempts = 0;

void _reconnectWithBackoff() {
  final delay = Duration(seconds: min(30, pow(2, _reconnectAttempts).toInt()));
  _reconnectTimer = Timer(delay, () {
    _reconnectAttempts++;
    connect();
  });
}
```

### 2. Create Post Flow (2 hours)
1. Create PostCreationPage widget
2. Create PostService for API calls
3. Update PhotoPreviewPage to navigate to PostCreationPage
4. Add media upload functionality

### 3. Fix Overflow (15 minutes)
- Search for widget causing 16px overflow
- Add Flexible/Expanded or ScrollView

---

## Testing Checklist

After implementing fixes, test:

- [ ] Socket.IO stays connected for 5+ minutes
- [ ] Photo capture → Post creation → Publish works
- [ ] Video capture → Post creation → Publish works
- [ ] Upload from gallery → Post creation works
- [ ] No frame drops during camera preview
- [ ] No database locking warnings
- [ ] No RenderFlex overflow errors
- [ ] All buttons respond within 100ms
- [ ] Camera switches smoothly
- [ ] Filters apply without lag

---

## Performance Targets

- **FPS:** Maintain 60 FPS in camera preview
- **Frame Drops:** < 5 skipped frames per minute
- **Socket Uptime:** > 99% connected
- **Database Queries:** < 100ms per query
- **Image Load:** < 500ms for thumbnails
- **Upload Speed:** Progress bar updates every 100ms

---

**Status:** Ready to implement ✅  
**Estimated Time:** 4-5 hours for complete fix  
**Priority:** CRITICAL - App unusable without post flow
