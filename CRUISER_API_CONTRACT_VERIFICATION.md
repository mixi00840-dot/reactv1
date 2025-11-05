# 🔌 Cruiser API Contract Verification

**Backend URL:** https://mixillo-backend-52242135857.europe-west1.run.app  
**Date:** November 5, 2025  
**Status:** ⚠️ **VERIFICATION REQUIRED**

---

## 📋 **MVP ENDPOINT CHECKLIST**

### **✅ VERIFIED (Exist in Backend)**

| Endpoint | Method | Status | File | Notes |
|----------|--------|--------|------|-------|
| `/api/feed` | GET | ✅ Exists | `feed-firestore.js` | Returns empty array (stub) |
| `/api/content` | GET | ✅ Exists | `content-firestore.js` | Returns empty array (stub) |
| `/api/content/:id` | GET | ✅ Exists | `content-firestore.js` | Returns stub data |
| `/api/content/:id/like` | POST | ⚠️ **MISSING** | - | Need to add |
| `/api/comments` | GET | ✅ Exists | `comments-firestore.js` | Returns empty array |
| `/api/comments` | POST | ✅ Exists | `comments-firestore.js` | Creates comment (stub) |
| `/api/users/:id` | GET | ✅ Exists | `users-firestore.js` | Returns user data |
| `/api/users/:id/follow` | POST | ⚠️ **MISSING** | - | Need to verify |
| `/api/uploads/presigned-url` | POST | ✅ Exists | `uploads-firestore.js` | Returns upload URL |
| `/api/wallets/balance` | GET | ✅ Exists | `wallets-firestore.js` | Returns balance |
| `/api/wallets/purchase` | POST | ⚠️ **MISSING** | - | Need to add |
| `/api/streaming/livestreams` | GET | ✅ Exists | `streaming-firestore.js` | Returns empty array |
| `/api/streaming/start` | POST | ⚠️ **MISSING** | - | Need to add |
| `/api/notifications` | GET | ⚠️ **CHECK** | - | Need to verify |
| `/api/search` | GET | ⚠️ **MISSING** | - | Need to add |

---

## 🔧 **MISSING ENDPOINTS TO ADD**

### **1. POST /api/content/:contentId/like**
**File:** `backend/src/routes/content-firestore.js`

```javascript
router.post('/:contentId/like', verifyFirebaseToken, async (req, res) => {
  try {
    const { contentId } = req.params;
    const userId = req.user.id;
    
    // Check if already liked
    const likeDoc = await db.collection('contentLikes')
      .doc(`${contentId}_${userId}`)
      .get();
    
    if (likeDoc.exists) {
      // Unlike
      await likeDoc.ref.delete();
      const likeCount = await db.collection('contentLikes')
        .where('contentId', '==', contentId)
        .count()
        .get();
      
      return res.json({
        success: true,
        data: { liked: false, likeCount: likeCount.data().count }
      });
    } else {
      // Like
      await db.collection('contentLikes').doc(`${contentId}_${userId}`).set({
        contentId,
        userId,
        createdAt: new Date()
      });
      
      const likeCount = await db.collection('contentLikes')
        .where('contentId', '==', contentId)
        .count()
        .get();
      
      return res.json({
        success: true,
        data: { liked: true, likeCount: likeCount.data().count }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

### **2. POST /api/users/:userId/follow**
**File:** `backend/src/routes/users-firestore.js`

```javascript
router.post('/:userId/follow', verifyFirebaseToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    
    if (userId === currentUserId) {
      return res.status(400).json({ success: false, message: 'Cannot follow yourself' });
    }
    
    const followDoc = await db.collection('follows')
      .doc(`${currentUserId}_${userId}`)
      .get();
    
    if (followDoc.exists) {
      // Unfollow
      await followDoc.ref.delete();
      return res.json({
        success: true,
        data: { isFollowing: false, followerCount: 0 } // TODO: Calculate
      });
    } else {
      // Follow
      await db.collection('follows').doc(`${currentUserId}_${userId}`).set({
        followerId: currentUserId,
        followingId: userId,
        createdAt: new Date()
      });
      
      return res.json({
        success: true,
        data: { isFollowing: true, followerCount: 0 } // TODO: Calculate
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

### **3. POST /api/wallets/purchase**
**File:** `backend/src/routes/wallets-firestore.js`

```javascript
router.post('/purchase', verifyFirebaseToken, async (req, res) => {
  try {
    const { packageId, amount, paymentMethod, transactionId, idempotencyKey } = req.body;
    const userId = req.user.id;
    
    // Check idempotency
    if (idempotencyKey) {
      const existingTxn = await db.collection('transactions')
        .where('idempotencyKey', '==', idempotencyKey)
        .get();
      
      if (!existingTxn.empty) {
        return res.json(existingTxn.docs[0].data());
      }
    }
    
    // Verify package
    const packages = {
      'package_100': { coins: 100, price: 0.99 },
      'package_500': { coins: 500, price: 4.99 },
      'package_1000': { coins: 1000, price: 9.99 },
      'package_5000': { coins: 5000, price: 49.99 }
    };
    
    const package = packages[packageId];
    if (!package || package.price !== amount) {
      return res.status(400).json({ success: false, message: 'Invalid package' });
    }
    
    // Get current balance
    const walletDoc = await db.collection('wallets').doc(userId).get();
    const currentCoins = walletDoc.exists ? walletDoc.data().coins || 0 : 0;
    
    // Create transaction
    const transaction = {
      id: `txn_${Date.now()}`,
      userId,
      type: 'purchase',
      packageId,
      coins: package.coins,
      amount,
      currency: 'USD',
      paymentMethod,
      transactionId,
      idempotencyKey,
      status: 'completed',
      createdAt: new Date()
    };
    
    await db.collection('transactions').doc(transaction.id).set(transaction);
    
    // Update wallet
    await db.collection('wallets').doc(userId).set({
      coins: currentCoins + package.coins,
      updatedAt: new Date()
    }, { merge: true });
    
    // Create receipt
    const receipt = {
      id: `receipt_${transaction.id}`,
      transactionId: transaction.id,
      amount,
      currency: 'USD',
      timestamp: new Date()
    };
    
    res.json({
      success: true,
      data: {
        transactionId: transaction.id,
        coins: package.coins,
        newBalance: currentCoins + package.coins,
        receipt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

### **4. POST /api/streaming/start**
**File:** `backend/src/routes/streaming-firestore.js`

```javascript
router.post('/start', verifyFirebaseToken, async (req, res) => {
  try {
    const { title, isPrivate = false } = req.body;
    const userId = req.user.id;
    
    const streamId = `stream_${Date.now()}_${userId}`;
    const chatRoomId = `chat_${streamId}`;
    
    // Create stream record
    await db.collection('livestreams').doc(streamId).set({
      id: streamId,
      userId,
      title: title || 'My Live Stream',
      status: 'starting',
      isPrivate,
      viewers: 0,
      chatRoomId,
      rtmpUrl: `rtmp://stream.mixillo.com/live/${streamId}`,
      streamKey: `key_${streamId}`,
      hlsUrl: `https://cdn.mixillo.com/hls/${streamId}/master.m3u8`,
      websocketUrl: `wss://mixillo-backend-52242135857.europe-west1.run.app/streaming`,
      createdAt: new Date()
    });
    
    res.json({
      success: true,
      data: {
        streamId,
        rtmpUrl: `rtmp://stream.mixillo.com/live/${streamId}`,
        streamKey: `key_${streamId}`,
        chatRoomId,
        websocketUrl: `wss://mixillo-backend-52242135857.europe-west1.run.app/streaming`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

### **5. GET /api/search**
**File:** Create `backend/src/routes/search-firestore.js`

```javascript
const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/firebaseAuth');
const db = require('../utils/database');

router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const { q, type = 'all', page = 1, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({ success: false, message: 'Query required' });
    }
    
    if (type === 'hashtag' || type === 'all') {
      // Search hashtags
      const hashtag = q.startsWith('#') ? q.substring(1) : q;
      const hashtagDocs = await db.collection('content')
        .where('hashtags', 'array-contains', hashtag)
        .limit(parseInt(limit))
        .get();
      
      return res.json({
        success: true,
        data: {
          hashtags: [{
            hashtag: `#${hashtag}`,
            videoCount: hashtagDocs.size,
            trending: false
          }],
          videos: hashtagDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        }
      });
    }
    
    // Search users
    if (type === 'user' || type === 'all') {
      const userDocs = await db.collection('users')
        .where('username', '>=', q)
        .where('username', '<=', q + '\uf8ff')
        .limit(parseInt(limit))
        .get();
      
      return res.json({
        success: true,
        data: {
          users: userDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        }
      });
    }
    
    res.json({ success: true, data: { results: [] } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
```

---

## ✅ **VERIFICATION STEPS**

### **Step 1: Test Existing Endpoints**
```bash
# Test feed
curl -H "Authorization: Bearer <token>" \
  https://mixillo-backend-52242135857.europe-west1.run.app/api/feed

# Test content
curl -H "Authorization: Bearer <token>" \
  https://mixillo-backend-52242135857.europe-west1.run.app/api/content

# Test users
curl -H "Authorization: Bearer <token>" \
  https://mixillo-backend-52242135857.europe-west1.run.app/api/users/:userId
```

### **Step 2: Add Missing Endpoints**
- Add like endpoint to `content-firestore.js`
- Add follow endpoint to `users-firestore.js`
- Add purchase endpoint to `wallets-firestore.js`
- Add start stream endpoint to `streaming-firestore.js`
- Create `search-firestore.js` route

### **Step 3: Update app.js**
```javascript
// Add search route
app.use('/api/search', require('./routes/search-firestore'));
```

### **Step 4: Deploy & Test**
```bash
cd backend
gcloud run deploy mixillo-backend --source . --region europe-west1
```

---

## 📋 **NEXT 3 ACTIONS**

1. **Backend:** Add missing endpoints (like, follow, purchase, start stream, search)
2. **Backend:** Deploy updated routes to Cloud Run
3. **QA:** Test all MVP endpoints with Firebase tokens

---

**Status:** ⚠️ **5 ENDPOINTS NEED TO BE ADDED**

