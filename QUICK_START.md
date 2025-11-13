# 🚀 Mixillo Quick Start - Multi-Provider Streaming

## Environment Variables

### Backend (.env)
```bash
# Server
PORT=5000
NODE_ENV=production

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/mixillo?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars
JWT_EXPIRES_IN=7d

# Agora Configuration
AGORA_APP_ID=your_agora_app_id_here
AGORA_APP_CERTIFICATE=your_agora_app_certificate_here

# ZegoCloud Configuration
ZEGO_APP_ID=1234567890
ZEGO_SERVER_SECRET=your_zego_server_secret_here

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=100MB

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Socket.io
SOCKET_CORS_ORIGIN=*
```

---

## Installation Commands

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
```

**Backend runs on:** `http://localhost:5000`

### 2. Admin Dashboard Setup
```bash
cd admin-dashboard
npm install
npm start
```

**Dashboard runs on:** `http://localhost:3000`

### 3. Flutter App Setup
```bash
cd flutter_app
flutter pub get
flutter run
```

---

## Testing Live Streaming

### Test Agora Provider
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Test Agora token
curl -X POST http://localhost:5000/api/agora/generate-token \
  -H "Content-Type: application/json" \
  -d '{
    "channelName": "test_stream_123",
    "uid": 0,
    "role": "publisher"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "token": "006abc123...",
  "channelName": "test_stream_123",
  "uid": 0,
  "expiresAt": "2024-01-16T10:00:00Z"
}
```

### Test ZegoCloud Provider
```bash
curl -X POST http://localhost:5000/api/zegocloud/generate-token \
  -H "Content-Type: application/json" \
  -d '{
    "roomID": "test_room_456",
    "userID": "user_789"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "token": "04eJxV...",
  "roomID": "test_room_456",
  "userID": "user_789",
  "expiresAt": "2024-01-16T12:00:00Z"
}
```

### Start Live Stream (Unified)
```bash
curl -X POST http://localhost:5000/api/livestreaming/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "My First Stream",
    "description": "Testing multi-provider streaming",
    "provider": "zegocloud"
  }'
```

**Expected Response (ZegoCloud):**
```json
{
  "success": true,
  "streamId": "stream_xyz123",
  "provider": "zegocloud",
  "config": {
    "appID": 1234567890,
    "appSign": "abc123...",
    "channelId": "room_xyz123",
    "token": "04eJxV...",
    "role": "host"
  }
}
```

---

## Provider Credentials Setup

### Get Agora Credentials
1. Go to: https://console.agora.io/
2. Create new project
3. Copy **App ID** → `AGORA_APP_ID`
4. Generate **App Certificate** → `AGORA_APP_CERTIFICATE`

### Get ZegoCloud Credentials
1. Go to: https://console.zegocloud.com/
2. Create new project
3. Copy **App ID** (number) → `ZEGO_APP_ID`
4. Copy **Server Secret** → `ZEGO_SERVER_SECRET`

---

## Flutter Configuration

### Android Permissions
**File:** `android/app/src/main/AndroidManifest.xml`
```xml
<manifest>
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.CAMERA"/>
    <uses-permission android:name="android.permission.RECORD_AUDIO"/>
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS"/>
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
    <uses-permission android:name="android.permission.BLUETOOTH"/>
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT"/>
</manifest>
```

### iOS Permissions
**File:** `ios/Runner/Info.plist`
```xml
<dict>
    <key>NSCameraUsageDescription</key>
    <string>Mixillo needs camera access for live streaming and video recording</string>
    
    <key>NSMicrophoneUsageDescription</key>
    <string>Mixillo needs microphone access for live streaming and video recording</string>
    
    <key>NSPhotoLibraryUsageDescription</key>
    <string>Mixillo needs photo library access to save and share videos</string>
</dict>
```

---

## Provider Switching (Admin)

### Enable/Disable Provider
```bash
curl -X PUT http://localhost:5000/api/admin/stream-providers/PROVIDER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -d '{
    "enabled": true,
    "isDefault": true
  }'
```

### Get Active Providers
```bash
curl http://localhost:5000/api/livestreaming/providers \
  -H "Authorization: Bearer JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "providers": [
    {
      "id": "agora_id",
      "name": "agora",
      "enabled": true,
      "isDefault": true,
      "maxQuality": "1440p"
    },
    {
      "id": "zego_id",
      "name": "zegocloud",
      "enabled": true,
      "isDefault": false,
      "maxQuality": "1080p"
    }
  ]
}
```

---

## Troubleshooting

### Issue: "Token generation failed"
**Solution:**
1. Check environment variables are set correctly
2. Verify Agora/Zego credentials in console
3. Check backend logs: `npm run dev`

### Issue: "Provider not found"
**Solution:**
1. Check database has StreamProvider documents
2. Run seed script: `npm run seed`
3. Verify provider enabled in admin dashboard

### Issue: "Video not rendering"
**Solution:**
1. Check camera/microphone permissions
2. Verify correct provider initialized
3. Check Flutter console for errors

### Issue: "Compilation errors in Flutter"
**Solution:**
```bash
cd flutter_app
flutter clean
flutter pub get
flutter pub upgrade
```

---

## Production Deployment

### 1. Update Environment Variables
```bash
# Backend production .env
NODE_ENV=production
MONGODB_URI=mongodb+srv://prod-user:prod-pass@prod-cluster.mongodb.net/mixillo
CORS_ORIGIN=https://mixillo.com,https://admin.mixillo.com
```

### 2. Build Flutter App
```bash
# Android
flutter build apk --release

# iOS
flutter build ipa --release

# Web
flutter build web --release
```

### 3. Deploy Backend
```bash
# Heroku
heroku create mixillo-api
git push heroku main

# Docker
docker build -t mixillo-backend .
docker run -p 5000:5000 --env-file .env mixillo-backend
```

### 4. Deploy Admin Dashboard
```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod
```

---

## Quick Commands Reference

### Development
```bash
# Start everything
npm run dev           # Backend (terminal 1)
npm start             # Admin Dashboard (terminal 2)
flutter run           # Flutter App (terminal 3)

# Backend only
cd backend && npm run dev

# Admin Dashboard only
cd admin-dashboard && npm start

# Flutter App only
cd flutter_app && flutter run -d chrome
```

### Testing
```bash
# Backend tests
cd backend && npm test

# Flutter tests
cd flutter_app && flutter test

# API tests (Postman)
newman run POSTMAN_COLLECTION.json
```

### Database
```bash
# Seed database
cd backend && npm run seed

# Backup MongoDB
mongodump --uri="MONGODB_URI" --out=./backup

# Restore MongoDB
mongorestore --uri="MONGODB_URI" ./backup
```

---

## Performance Optimization

### Backend
```bash
# Enable compression
npm install compression
# Enable Redis caching
npm install redis ioredis
```

### Flutter
```dart
// Enable release mode optimizations
flutter run --release
flutter build apk --split-per-abi --release
```

### Streaming Quality
```dart
// Auto-adjust based on network
final quality = networkSpeed > 5 ? 'ultra' : 'medium';
await StreamProviderManager().setStreamQuality(quality);
```

---

## Support Resources

### Documentation
- **Main Guide:** `/docs/LIVE_STREAMING_MULTI_PROVIDER.md`
- **API Reference:** `/docs/API.md`
- **Completion Report:** `/docs/PROJECT_COMPLETION_REPORT.md`

### External Docs
- **Agora:** https://docs.agora.io/en/
- **ZegoCloud:** https://docs.zegocloud.com/
- **Flutter:** https://flutter.dev/docs
- **MongoDB:** https://docs.mongodb.com/

### Community
- **GitHub:** https://github.com/mixillo/app
- **Discord:** https://discord.gg/mixillo
- **Twitter:** @MixilloApp

---

## Emergency Contacts

**Backend Issues:** backend@mixillo.com  
**Frontend Issues:** frontend@mixillo.com  
**Streaming Issues:** streaming@mixillo.com  
**General Support:** support@mixillo.com  

---

**Version:** 1.0.0  
**Last Updated:** January 2024  
**Status:** ✅ Production Ready

🎉 **Happy Streaming with Multi-Provider Support!**
