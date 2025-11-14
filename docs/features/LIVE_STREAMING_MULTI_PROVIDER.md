# Live Streaming - Multi-Provider Support

## Overview
The Mixillo Live Streaming feature supports **two streaming providers** with admin-controlled switching:
- **Agora RTC Engine** (primary)
- **ZegoCloud Express Engine** (alternative)

Admins can enable/disable providers from the dashboard, and the system seamlessly switches between them.

---

## Architecture

### Provider Abstraction Layer
```
┌─────────────────────────────────────┐
│   UnifiedLiveBroadcastPage (UI)    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│    StreamProviderManager            │
│    (Strategy Pattern)               │
└──────┬──────────────────────────────┘
       │
       ├─────────────┬─────────────────┐
       ▼             ▼                 ▼
┌─────────────┐ ┌──────────────┐ ┌───────────────┐
│   Agora     │ │  ZegoCloud   │ │  Future: AWS  │
│   Manager   │ │   Manager    │ │   Kinesis...  │
└─────────────┘ └──────────────┘ └───────────────┘
```

### Key Components

1. **StreamProviderManager** (`lib/core/services/stream_provider_manager.dart`)
   - Singleton managing active provider
   - Unified API for all streaming operations
   - Dynamic provider switching
   - Quality preset mapping

2. **AgoraStreamManager** (`lib/core/services/agora_stream_manager.dart`)
   - Agora RTC Engine wrapper
   - Token-based authentication
   - Quality: 480p, 720p, 1080p, 1440p

3. **ZegoStreamManager** (`lib/core/services/zego_stream_manager.dart`)
   - ZegoCloud Express Engine wrapper
   - HMAC-SHA256 token authentication
   - Quality: 360p, 540p, 720p, 1080p

4. **UnifiedLiveBroadcastPage** (`lib/features/live/presentation/pages/unified_live_broadcast_page.dart`)
   - Provider-agnostic UI
   - Automatic video view rendering (Agora vs Zego)
   - Real-time comments, likes, viewer count

---

## Provider Comparison

| Feature | Agora | ZegoCloud |
|---------|-------|-----------|
| **Quality Presets** | 480p, 720p, 1080p, 1440p | 360p, 540p, 720p, 1080p |
| **Max Resolution** | 1440p (2K) | 1080p (Full HD) |
| **Beauty Effects** | ✅ Skin smoothing, whitening | ✅ Skin smoothing, whitening, sharpen |
| **Virtual Background** | ❌ Not included | ✅ Available (requires Effects SDK) |
| **Token Type** | RTC Token (AES-256) | HMAC-SHA256 |
| **Token Expiration** | 24 hours default | 2 hours default |
| **Room Capacity** | 10,000+ viewers | 100,000+ viewers |
| **Latency** | <300ms | <300ms |
| **H.264 Encoding** | ✅ | ✅ |
| **Hardware Encoding** | ✅ | ✅ |
| **Free Tier** | 10,000 mins/month | 10,000 mins/month |

---

## Setup Instructions

### 1. Backend Configuration

#### Environment Variables
Add to `.env`:
```bash
# Agora Configuration
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_certificate

# ZegoCloud Configuration
ZEGO_APP_ID=1234567890
ZEGO_SERVER_SECRET=your_zego_server_secret
```

#### Database Provider Configuration
The `StreamProvider` model stores active provider settings:
```javascript
{
  name: 'agora' | 'zegocloud',
  enabled: true,
  appId: 'xxx',
  certificate: 'xxx', // or serverSecret for Zego
  maxQuality: '1080p',
  features: ['beauty', 'virtualBg', 'screenShare']
}
```

### 2. Flutter Configuration

#### pubspec.yaml
```yaml
dependencies:
  agora_rtc_engine: ^6.3.0
  zego_express_engine: ^3.14.5
```

Install packages:
```bash
cd flutter_app
flutter pub get
```

#### Permissions (Android)
`android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.CAMERA"/>
<uses-permission android:name="android.permission.RECORD_AUDIO"/>
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS"/>
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
```

#### Permissions (iOS)
`ios/Runner/Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>Mixillo needs camera access for live streaming</string>
<key>NSMicrophoneUsageDescription</key>
<string>Mixillo needs microphone access for live streaming</string>
```

### 3. Backend Routes

#### Agora Token Generation
```javascript
POST /api/agora/generate-token
{
  "channelName": "live_stream_123",
  "uid": 0,
  "role": "publisher", // or "subscriber"
  "expirationTime": 86400
}

Response:
{
  "token": "006abc...",
  "channelName": "live_stream_123",
  "uid": 0,
  "expiresAt": "2024-01-15T10:30:00Z"
}
```

#### ZegoCloud Token Generation
```javascript
POST /api/zegocloud/generate-token
{
  "roomID": "room_123",
  "userID": "user_456",
  "expirationTime": 7200
}

Response:
{
  "token": "04eJxV...base64...",
  "roomID": "room_123",
  "userID": "user_456",
  "expiresAt": "2024-01-15T12:00:00Z"
}
```

#### Start Live Stream (Unified)
```javascript
POST /api/livestreaming/start
{
  "title": "My Awesome Stream",
  "description": "Check out my new products",
  "provider": "zegocloud" // or "agora"
}

Response (Agora):
{
  "streamId": "stream_123",
  "provider": "agora",
  "config": {
    "appId": "abc123",
    "channelId": "live_stream_123",
    "token": "006abc...",
    "role": "broadcaster"
  }
}

Response (ZegoCloud):
{
  "streamId": "stream_123",
  "provider": "zegocloud",
  "config": {
    "appID": 1234567890,
    "appSign": "def456...",
    "channelId": "room_123",
    "token": "04eJxV...",
    "role": "host"
  }
}
```

---

## Usage Examples

### Starting a Live Stream

```dart
import 'package:mixillo/core/services/stream_provider_manager.dart';

// Initialize manager
final providerManager = StreamProviderManager();

// Get active provider from backend
final providers = await LiveStreamingService().getProviders();
final activeProvider = providers.firstWhere((p) => p['enabled'] == true);

// Set provider
providerManager.setProvider(
  StreamProviderManager.parseProvider(activeProvider['name']),
);

// Create stream
final streamConfig = await LiveStreamingService().createLiveStream(
  title: 'My Stream',
  provider: activeProvider['name'],
);

// Initialize provider
await providerManager.initialize(streamConfig.config);

// Start broadcasting
await providerManager.startBroadcasting(
  streamConfig: streamConfig,
  quality: 'high',
);
```

### Switching Quality Mid-Stream

```dart
// Change quality preset
await providerManager.setStreamQuality('ultra');

// Get quality description
final description = providerManager.getQualityDescription('ultra');
print(description); // "1080p, 30fps" (for ZegoCloud)
```

### Toggling Beauty Effects

```dart
// Enable beauty
await providerManager.enableBeautyEffects(
  whitenIntensity: 70,
  smoothIntensity: 50,
  sharpenIntensity: 30,
);

// Disable beauty
await providerManager.disableBeautyEffects();
```

### Camera Controls

```dart
// Toggle camera on/off
await providerManager.toggleCamera();

// Switch front/back camera
await providerManager.switchCamera();

// Mute/unmute audio
await providerManager.toggleMute();
```

---

## Admin Dashboard Integration

### Provider Management Page
Location: `admin-dashboard/src/pages/StreamProviders.js`

Features:
- Enable/disable providers
- Set default provider
- Configure max quality per provider
- View usage statistics
- Test provider connectivity

### Toggle Provider API
```javascript
PUT /api/admin/stream-providers/:id
{
  "enabled": true,
  "isDefault": true
}
```

---

## Testing

### Test Agora Streaming
```bash
cd backend
node test-agora-streaming.js
```

### Test ZegoCloud Streaming
```bash
cd backend
node test-zego-streaming.js
```

### Flutter Widget Tests
```bash
cd flutter_app
flutter test test/features/live/stream_provider_test.dart
```

---

## Troubleshooting

### Agora Issues

**Problem:** "Token expired" error
**Solution:** Regenerate token with longer expiration:
```dart
final config = await streamingService.createLiveStream(
  title: 'My Stream',
  provider: 'agora',
  expirationTime: 86400, // 24 hours
);
```

**Problem:** Black screen on Android
**Solution:** Check camera permissions in `AndroidManifest.xml`

### ZegoCloud Issues

**Problem:** "Invalid token" error
**Solution:** Verify `ZEGO_SERVER_SECRET` matches your console settings

**Problem:** "Room login failed"
**Solution:** Check `ZEGO_APP_ID` is an integer, not a string

**Problem:** Virtual background not working
**Solution:** Virtual background requires ZegoEffects SDK license (separate product)

### General Issues

**Problem:** Provider not switching
**Solution:** Check database `StreamProvider` collection:
```javascript
db.streamProviders.find({ enabled: true })
```

**Problem:** No video rendering
**Solution:** Ensure correct view widget for provider:
- Agora: `AgoraVideoView` with engine
- ZegoCloud: `createPreviewView()` widget

---

## Performance Optimization

### Bandwidth Optimization
- Use `low` quality (360p/480p) for mobile networks
- Use `ultra` quality (1080p+) for Wi-Fi only
- Dynamic quality switching based on network conditions

### Battery Optimization
- Disable beauty effects on low battery
- Use hardware encoding (enabled by default)
- Lower frame rate to 15fps for extended streams

### Latency Optimization
- Agora: Use `RtcRole.PUBLISHER` for broadcaster
- ZegoCloud: Use `ZegoScenario.StandardVideoCall` for low latency
- Both: Enable UDP optimization in network settings

---

## API Reference

### StreamProviderManager

#### Properties
```dart
StreamProvider currentProvider
bool get isInitialized
bool get isMuted
bool get isCameraOff
AgoraStreamManager get agoraManager
ZegoStreamManager get zegoManager
```

#### Methods
```dart
void setProvider(StreamProvider provider)
Future<bool> initialize(Map<String, dynamic> config)
Future<bool> startBroadcasting({LiveStreamConfig, String quality})
Future<bool> joinAsViewer({LiveStreamConfig, String quality})
Future<void> toggleMute()
Future<void> toggleCamera()
Future<void> switchCamera()
Future<void> setStreamQuality(String quality)
Future<void> enableBeautyEffects({...})
Future<void> leaveStream()
String getProviderName()
String getQualityDescription(String quality)
```

---

## Roadmap

### Phase 1 (Current)
- ✅ Agora RTC integration
- ✅ ZegoCloud integration
- ✅ Unified provider manager
- ✅ Admin provider switching

### Phase 2 (Q1 2024)
- 🔄 AWS Kinesis Video Streams
- 🔄 Twitch RTMP integration
- 🔄 Multi-host streaming (PK battles)
- 🔄 Screen sharing

### Phase 3 (Q2 2024)
- 📋 AI-powered moderation (real-time)
- 📋 Virtual gifts with animations
- 📋 Live shopping cart integration
- 📋 Analytics dashboard

---

## Support

### Documentation
- Agora: https://docs.agora.io/en/
- ZegoCloud: https://docs.zegocloud.com/

### Community
- Discord: https://discord.gg/mixillo
- GitHub Issues: https://github.com/mixillo/app/issues

### Contact
- Email: support@mixillo.com
- Twitter: @MixilloApp

---

**Last Updated:** January 2024  
**Version:** 1.0.0  
**Contributors:** Mixillo Engineering Team
