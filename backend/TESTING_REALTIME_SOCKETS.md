# 🧪 Testing Real-Time Socket.io Features

## Quick Start

### 1. Start the Backend Server
```bash
cd backend
npm run dev
```

Server should start on `http://localhost:5000`

### 2. Get Test Credentials

You need:
- **JWT Token** - Login via Postman/curl to get token
- **Content ID** - Any video ID from your database

```bash
# Login to get JWT token
curl -X POST http://localhost:5000/api/auth/mongodb/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Get content list to find a video ID
curl http://localhost:5000/api/content/mongodb?limit=1
```

### 3. Run Automated Tests

```bash
# Set environment variables
export TEST_JWT_TOKEN="your_jwt_token_here"
export TEST_CONTENT_ID="60a7f8c9e4b0c72f3c8d5e1a"

# Run test script
node test-realtime-sockets.js
```

Expected output:
```
🧪 Real-Time Socket.io Testing

📡 API URL: http://localhost:5000
🔑 Using JWT: eyJhbGciOiJIUzI1NiIs...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST 1: Socket Connection
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Connected to Socket.io
   Socket ID: abc123xyz

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST 2: Video Room Join
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Joined video room
   Content ID: 60a7f8c9e4b0c72f3c8d5e1a

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST 3: Like/Unlike API + Socket Event
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Like API call successful
   Response: {"success":true,"data":{"isLiked":true,"likesCount":42}}
✅ Received video:like socket event
   Content ID: 60a7f8c9e4b0c72f3c8d5e1a
   Is Liked: true
   Likes Count: 42

... (more tests)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ ALL TESTS COMPLETED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Manual Testing with Postman

### Setup

1. **Create Postman Collection** - Import `POSTMAN_COLLECTION_COMPLETE.json`
2. **Set Environment Variables**:
   - `base_url` = `http://localhost:5000`
   - `jwt_token` = (from login response)
   - `content_id` = (any video ID)

### Test Endpoints

#### 1. Like Video
```
POST {{base_url}}/api/content/mongodb/{{content_id}}/like
Headers:
  Authorization: Bearer {{jwt_token}}
```

Expected Response:
```json
{
  "success": true,
  "data": {
    "isLiked": true,
    "likesCount": 42
  },
  "message": "Content liked"
}
```

#### 2. View Video
```
POST {{base_url}}/api/content/mongodb/{{content_id}}/view
```

Expected Response:
```json
{
  "success": true,
  "data": {
    "viewsCount": 1523
  }
}
```

#### 3. Share Video
```
POST {{base_url}}/api/content/mongodb/{{content_id}}/share
Headers:
  Authorization: Bearer {{jwt_token}}
```

Expected Response:
```json
{
  "success": true,
  "data": {
    "sharesCount": 89
  },
  "message": "Share recorded"
}
```

#### 4. Create Comment
```
POST {{base_url}}/api/content/mongodb/{{content_id}}/comments
Headers:
  Authorization: Bearer {{jwt_token}}
Body (JSON):
{
  "text": "Amazing video! 🔥"
}
```

Expected Response:
```json
{
  "success": true,
  "data": {
    "comment": {
      "_id": "...",
      "text": "Amazing video! 🔥",
      "userId": { ... },
      "createdAt": "2025-11-11T10:30:00Z"
    },
    "commentsCount": 345
  },
  "message": "Comment created"
}
```

#### 5. Get Comments
```
GET {{base_url}}/api/content/mongodb/{{content_id}}/comments?limit=20&page=1
```

---

## Socket.io Client Testing

### Using Socket.io Client Library

```javascript
const io = require('socket.io-client');

// Connect
const socket = io('http://localhost:5000', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});

// Listen for connection
socket.on('connect', () => {
  console.log('✅ Connected:', socket.id);
  
  // Join video room
  socket.emit('video:join', { contentId: 'YOUR_CONTENT_ID' });
});

// Listen for likes
socket.on('video:like', (data) => {
  console.log('👍 Like:', data);
  // Update UI: setLikesCount(data.likesCount)
});

// Listen for comments
socket.on('video:comment', (data) => {
  console.log('💬 Comment:', data);
  // Update UI: addComment(data.comment)
});

// Listen for views
socket.on('video:view', (data) => {
  console.log('👀 View:', data);
  // Update UI: setViewsCount(data.viewsCount)
});

// Listen for shares
socket.on('video:share', (data) => {
  console.log('🔗 Share:', data);
  // Update UI: setSharesCount(data.sharesCount)
});

// Subscribe to feed updates
socket.emit('feed:subscribe');
socket.on('feed:refresh', (data) => {
  console.log('📢 New content:', data);
  // Show notification: "New video from @creator"
});

// Cleanup
socket.on('disconnect', () => {
  console.log('❌ Disconnected');
});
```

### Using Browser Console

Open browser console on `http://localhost:3000` (React dashboard):

```javascript
// Load Socket.io client (if not already loaded)
const script = document.createElement('script');
script.src = 'https://cdn.socket.io/4.5.4/socket.io.min.js';
document.head.appendChild(script);

// After script loads
const socket = io('http://localhost:5000', {
  auth: { token: localStorage.getItem('token') }
});

socket.on('connect', () => console.log('Connected'));

// Join video room
socket.emit('video:join', { contentId: 'YOUR_CONTENT_ID' });

// Listen for events
socket.on('video:like', console.log);
socket.on('video:comment', console.log);
socket.on('video:view', console.log);
```

---

## Flutter Client Testing

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

class VideoSocketService {
  late IO.Socket socket;
  
  void connect(String token) {
    socket = IO.io('http://localhost:5000', <String, dynamic>{
      'transports': ['websocket'],
      'auth': {'token': token}
    });
    
    socket.on('connect', (_) {
      print('✅ Connected: ${socket.id}');
      
      // Join video room
      socket.emit('video:join', {'contentId': 'YOUR_CONTENT_ID'});
    });
    
    // Listen for likes
    socket.on('video:like', (data) {
      print('👍 Like: ${data['likesCount']}');
      // Update state
    });
    
    // Listen for comments
    socket.on('video:comment', (data) {
      print('💬 Comment: ${data['comment']['text']}');
      // Add to comment list
    });
    
    // Listen for views
    socket.on('video:view', (data) {
      print('👀 View: ${data['viewsCount']}');
      // Update view counter
    });
  }
  
  void disconnect() {
    socket.emit('video:leave', {'contentId': 'YOUR_CONTENT_ID'});
    socket.disconnect();
  }
}
```

---

## Testing Checklist

- [ ] Socket.io connects successfully with JWT
- [ ] Video room join/leave works
- [ ] Like/unlike emits `video:like` event
- [ ] Comment creation emits `video:comment` event
- [ ] View tracking emits `video:view` event
- [ ] Share tracking emits `video:share` event
- [ ] Feed subscription works
- [ ] Feed refresh events received
- [ ] Multiple clients see same events
- [ ] Events include correct data structure
- [ ] Timestamps are accurate
- [ ] Connection handles disconnect/reconnect

---

## Common Issues

### Issue: Connection Refused
**Solution:** Make sure backend is running on correct port
```bash
cd backend
npm run dev
# Should see: Server running on http://localhost:5000
```

### Issue: Authentication Error
**Solution:** Check JWT token is valid and not expired
```bash
# Get fresh token
curl -X POST http://localhost:5000/api/auth/mongodb/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

### Issue: Events Not Received
**Solution:** Ensure you've joined the video room first
```javascript
socket.emit('video:join', { contentId: 'YOUR_CONTENT_ID' });
// Wait for confirmation
socket.on('video:joined', () => {
  // Now you'll receive events
});
```

### Issue: Content ID Not Found
**Solution:** Use valid content ID from database
```bash
curl http://localhost:5000/api/content/mongodb?limit=1
# Copy _id from response
```

---

## Performance Testing

### Load Test with Artillery

```bash
npm install -g artillery

# Create artillery.yml
cat > artillery.yml <<EOF
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 10
  socketio:
    transports: ['websocket']
scenarios:
  - engine: socketio
    flow:
      - emit:
          channel: 'video:join'
          data:
            contentId: 'YOUR_CONTENT_ID'
EOF

# Run load test
artillery run artillery.yml
```

---

## Next Steps

1. **Integrate into Flutter app** - Add socket.io client
2. **Test with multiple users** - Open multiple browser tabs
3. **Monitor performance** - Use Chrome DevTools Network tab
4. **Deploy to staging** - Test on Cloud Run
5. **Scale with Redis** - Add Redis adapter for multi-server

---

**Need help?** Check `docs/REALTIME_VIDEO_INTERACTIONS.md` for full documentation.
