# 🔴 Real-Time Video Interactions - Socket.io Implementation

## Overview
Complete real-time interaction system for TikTok-style video platform using Socket.io. Broadcasts likes, comments, views, and shares with sub-second latency.

---

## ✅ Implemented Features

### 1. **Video Interaction Events**
Real-time broadcasting of user interactions on videos:

#### Like/Unlike (`video:like`)
```javascript
// Client sends like action
POST /api/content/:id/like

// Server broadcasts to all watching
io.to(`video_${contentId}`).emit('video:like', {
  contentId: '123',
  userId: 'user_456',
  isLiked: true,
  likesCount: 1251,
  timestamp: '2025-11-11T10:30:00Z'
});
```

#### New Comment (`video:comment`)
```javascript
// Client posts comment
POST /api/content/:id/comments

// Server broadcasts
io.to(`video_${contentId}`).emit('video:comment', {
  contentId: '123',
  comment: {
    _id: 'comment_789',
    text: 'Great video!',
    user: {
      _id: 'user_456',
      username: '@johndoe',
      avatar: 'https://...',
      isVerified: true
    },
    createdAt: '2025-11-11T10:30:00Z'
  },
  commentsCount: 345,
  timestamp: '2025-11-11T10:30:00Z'
});
```

#### View Count (`video:view`)
```javascript
// Client records view
POST /api/content/:id/view

// Server broadcasts
io.to(`video_${contentId}`).emit('video:view', {
  contentId: '123',
  viewsCount: 15234,
  timestamp: '2025-11-11T10:30:00Z'
});
```

#### Share (`video:share`)
```javascript
// Client shares video
POST /api/content/:id/share

// Server broadcasts
io.to(`video_${contentId}`).emit('video:share', {
  contentId: '123',
  userId: 'user_456',
  sharesCount: 89,
  timestamp: '2025-11-11T10:30:00Z'
});
```

---

### 2. **Video Room Management**
Join/leave video rooms to receive real-time updates:

```javascript
// Join video room
socket.emit('video:join', { contentId: '123' });
socket.on('video:joined', (data) => {
  console.log(`Joined video ${data.contentId}`);
});

// Leave video room
socket.emit('video:leave', { contentId: '123' });
socket.on('video:left', (data) => {
  console.log(`Left video ${data.contentId}`);
});
```

---

### 3. **Feed Updates**
Notify followers when new content is posted:

#### Subscribe to Feed Updates
```javascript
// Subscribe to personalized feed updates
socket.emit('feed:subscribe');
socket.on('feed:subscribed', (data) => {
  console.log(`Subscribed to feed updates`);
});

// Listen for new content from followed users
socket.on('feed:refresh', (data) => {
  console.log('New content available:', data);
  // data = {
  //   type: 'new_content',
  //   contentId: '123',
  //   contentType: 'video',
  //   creator: {
  //     id: 'user_456',
  //     username: '@creator',
  //     avatar: 'https://...'
  //   },
  //   timestamp: '2025-11-11T10:30:00Z'
  // }
});

// Unsubscribe
socket.emit('feed:unsubscribe');
```

#### Broadcast New Content to Followers
```javascript
// Creator posts new content
socket.emit('feed:new_content', {
  contentId: '123',
  contentType: 'video'
});

// Server notifies all followers
socket.on('feed:content_broadcasted', (data) => {
  console.log(`Notified ${data.followersNotified} followers`);
});
```

---

### 4. **Typing Indicators**
Show when users are typing comments:

```javascript
// User starts typing
socket.emit('video:comment_typing', { contentId: '123' });

// Other users see typing indicator
socket.on('video:user_typing', (data) => {
  console.log(`${data.username} is typing...`);
  // data = {
  //   contentId: '123',
  //   userId: 'user_456',
  //   username: '@johndoe'
  // }
});
```

---

### 5. **Engagement Analytics**
Track watch time and quality for analytics:

```javascript
// Track watch progress
socket.emit('video:watch_progress', {
  contentId: '123',
  watchTime: 45.5, // seconds
  completed: false
});

socket.on('video:progress_tracked', (data) => {
  console.log('Progress saved');
});

// Track quality changes
socket.emit('video:quality_change', {
  contentId: '123',
  quality: '720p',
  buffering: false
});
```

---

## 📡 Socket Service API

Backend service for emitting events from routes:

```javascript
const socketService = require('../services/socketService');

// Initialize (done in server.js)
socketService.initialize(io);

// Emit video like
socketService.emitVideoLike(contentId, userId, isLiked, likesCount);

// Emit video comment
socketService.emitVideoComment(contentId, comment, commentsCount);

// Emit video view
socketService.emitVideoView(contentId, viewsCount);

// Emit video share
socketService.emitVideoShare(contentId, userId, sharesCount);

// Notify followers
await socketService.notifyFollowersNewContent(userId, {
  contentId: '123',
  contentType: 'video',
  creator: { ... }
});

// Emit to specific user
socketService.emitToUser(userId, 'notification', { ... });

// Broadcast to all
socketService.broadcast('event', { ... });

// Get room stats
const stats = socketService.getRoomStats('video_123');
// { size: 45, connected: true }

// Get connected clients
const count = socketService.getConnectedClientsCount();
```

---

## 🔌 API Endpoints with Real-Time Events

### Like/Unlike Content
**POST** `/api/content/:id/like`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isLiked": true,
    "likesCount": 1251
  },
  "message": "Content liked"
}
```

**Socket Event Emitted:** `video:like`

---

### Record View
**POST** `/api/content/:id/view`

**Headers:** Optional (public endpoint)

**Response:**
```json
{
  "success": true,
  "data": {
    "viewsCount": 15234
  }
}
```

**Socket Event Emitted:** `video:view`

---

### Share Content
**POST** `/api/content/:id/share`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sharesCount": 89
  },
  "message": "Share recorded"
}
```

**Socket Event Emitted:** `video:share`

---

### Create Comment
**POST** `/api/content/:id/comments`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Body:**
```json
{
  "text": "Great video!",
  "parentId": null
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "comment": {
      "_id": "comment_789",
      "text": "Great video!",
      "userId": { ... },
      "createdAt": "2025-11-11T10:30:00Z"
    },
    "commentsCount": 345
  },
  "message": "Comment created"
}
```

**Socket Event Emitted:** `video:comment`

---

### Get Comments
**GET** `/api/content/:id/comments?limit=20&page=1`

**Response:**
```json
{
  "success": true,
  "data": {
    "comments": [ ... ],
    "pagination": {
      "total": 345,
      "page": 1,
      "limit": 20,
      "pages": 18
    }
  }
}
```

---

## 🎯 Client Integration Examples

### Flutter/Dart
```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

class VideoSocketService {
  late IO.Socket socket;
  
  void connect(String token) {
    socket = IO.io('https://api.mixillo.com', <String, dynamic>{
      'transports': ['websocket'],
      'auth': {'token': token}
    });
    
    socket.on('connect', (_) => print('Connected'));
    
    // Join video room
    socket.emit('video:join', {'contentId': '123'});
    
    // Listen for likes
    socket.on('video:like', (data) {
      print('New like: ${data['likesCount']}');
      // Update UI
    });
    
    // Listen for comments
    socket.on('video:comment', (data) {
      print('New comment: ${data['comment']['text']}');
      // Add comment to list
    });
    
    // Listen for views
    socket.on('video:view', (data) {
      print('Views: ${data['viewsCount']}');
      // Update view counter
    });
  }
  
  void disconnect() {
    socket.emit('video:leave', {'contentId': '123'});
    socket.disconnect();
  }
}
```

### React/JavaScript
```javascript
import io from 'socket.io-client';

const socket = io('https://api.mixillo.com', {
  auth: { token: localStorage.getItem('token') }
});

// Join video room
socket.emit('video:join', { contentId: '123' });

// Listen for real-time updates
socket.on('video:like', (data) => {
  setLikesCount(data.likesCount);
});

socket.on('video:comment', (data) => {
  setComments(prev => [data.comment, ...prev]);
  setCommentsCount(data.commentsCount);
});

socket.on('video:view', (data) => {
  setViewsCount(data.viewsCount);
});

// Subscribe to feed updates
socket.emit('feed:subscribe');
socket.on('feed:refresh', (data) => {
  showNotification(`New ${data.contentType} from ${data.creator.username}`);
});

// Leave video room on unmount
return () => {
  socket.emit('video:leave', { contentId: '123' });
  socket.disconnect();
};
```

---

## 🔐 Authentication

Socket connections use JWT authentication:

```javascript
const token = 'eyJhbGciOiJIUzI1NiIs...';

const socket = io('https://api.mixillo.com', {
  auth: { token }
});

// Or via headers
const socket = io('https://api.mixillo.com', {
  extraHeaders: {
    Authorization: `Bearer ${token}`
  }
});
```

**Authentication Flow:**
1. Client connects with JWT token
2. Server verifies token using `socketAuth` middleware
3. Connection rejected if invalid/expired
4. User ID extracted and stored in `socket.userId`
5. User automatically joins `user_${userId}` room

---

## 📊 Performance Considerations

### Room-Based Broadcasting
Events are scoped to rooms to reduce network traffic:
- `video_${contentId}` - Only users watching this video
- `user_${userId}` - Only this specific user
- `feed_${userId}` - Only this user's feed
- `livestream_${livestreamId}` - Only livestream viewers

### Event Throttling
High-frequency events (views, watch progress) should be throttled client-side:
```javascript
const throttledViewUpdate = throttle(() => {
  socket.emit('video:watch_progress', { ... });
}, 5000); // Every 5 seconds max
```

### Connection Management
- Ping interval: 25 seconds
- Ping timeout: 60 seconds
- Auto-reconnect on disconnect
- Exponential backoff on connection errors

---

## 🧪 Testing

### Local Testing
```bash
# Start backend
cd backend
npm run dev

# Socket.io endpoint
http://localhost:5000

# Test with Socket.io client
npm install socket.io-client
node test-socket.js
```

**test-socket.js:**
```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:5000', {
  auth: { token: 'your_jwt_token' }
});

socket.on('connect', () => {
  console.log('✅ Connected');
  
  // Join video room
  socket.emit('video:join', { contentId: '123' });
  
  // Listen for events
  socket.on('video:like', (data) => {
    console.log('👍 Like received:', data);
  });
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected');
});
```

---

## 🚀 Production Deployment

### Environment Variables
```env
# Socket.io
SOCKET_IO_CORS_ORIGIN=https://mixillo.com
SOCKET_IO_PING_TIMEOUT=60000
SOCKET_IO_PING_INTERVAL=25000

# Redis for socket scaling (optional)
REDIS_HOST=10.167.115.67
REDIS_PORT=6379
```

### Scaling with Redis Adapter
For multi-server deployments:
```javascript
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const pubClient = createClient({ host: process.env.REDIS_HOST });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

---

## 📝 Event Summary

| Event | Direction | Description | Authentication |
|-------|-----------|-------------|----------------|
| `video:join` | Client → Server | Join video room | Required |
| `video:leave` | Client → Server | Leave video room | Required |
| `video:like` | Server → Client | Like/unlike broadcast | - |
| `video:comment` | Server → Client | New comment broadcast | - |
| `video:view` | Server → Client | View count update | - |
| `video:share` | Server → Client | Share count update | - |
| `video:comment_typing` | Client → Server | Typing indicator | Required |
| `video:user_typing` | Server → Client | Someone typing | - |
| `feed:subscribe` | Client → Server | Subscribe to feed updates | Required |
| `feed:unsubscribe` | Client → Server | Unsubscribe from feed | Required |
| `feed:refresh` | Server → Client | New content notification | - |
| `feed:new_content` | Client → Server | Broadcast new content | Required |

---

## 🎯 Next Steps

1. **Redis Integration** - Scale across multiple servers
2. **Presence System** - Show online/offline status
3. **Video Reactions** - Real-time emoji reactions
4. **Live Co-watching** - Watch together feature
5. **Push Notifications** - Native push when app closed

---

**Files Modified:**
- `backend/src/socket/events.js` - Socket event handlers
- `backend/src/services/socketService.js` - Socket service helper
- `backend/src/routes/content.js` - Video interaction routes
- `backend/src/server.js` - Socket initialization

**Status:** ✅ Fully Implemented & Ready for Testing
