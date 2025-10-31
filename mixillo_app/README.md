# Mixillo Mobile App

A high-end social media and e-commerce mobile application built with Flutter, combining the best features of TikTok, Instagram, and modern shopping platforms.

## 🎯 Features

### 📱 Content Experience
- **Video Feed**: TikTok-style vertical video player with swipe navigation
- **Photo Posts**: Instagram-style feed with carousel support
- **Stories**: 24-hour expiring content with interactive features
- **Live Streaming**: Real-time broadcasting with gifts and interactions

### 👤 Social Features
- User profiles with followers/following
- Comments and replies
- Direct messaging
- Search (users, videos, sounds, hashtags, live streams)
- Notifications and activity feed

### 🎬 Content Creation
- Camera integration with filters and effects
- Video and photo editing
- Sound library integration
- Templates and effects
- Upload from gallery

### 🛍️ E-commerce
- Shop creation and management
- Product listings with media
- Shopping cart and checkout
- Order tracking
- Wallet and transactions
- Seller dashboard

### 💰 Monetization
- Virtual gifts system
- Creator earnings
- Wallet management
- Withdrawal options

### 🎮 Interactive Features
- PK Battles (live competitions)
- Duets and stitches
- Trending sounds and hashtags
- Discover page
- Rising stars and rankings

## 🏗️ Architecture

```
lib/
├── core/
│   ├── constants/
│   ├── theme/
│   ├── utils/
│   └── widgets/
├── data/
│   ├── models/
│   ├── repositories/
│   └── services/
├── features/
│   ├── auth/
│   ├── feed/
│   ├── profile/
│   ├── upload/
│   ├── shop/
│   ├── live/
│   ├── messages/
│   └── wallet/
└── main.dart
```

## 🚀 Getting Started

### Prerequisites
- Flutter SDK (3.0.0 or higher)
- Dart SDK (3.0.0 or higher)
- Android Studio / Xcode
- VS Code with Flutter extension

### Installation

1. Clone the repository
2. Install dependencies:
```bash
flutter pub get
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your API keys
```

4. Run the app:
```bash
flutter run
```

## 🔧 Configuration

### Backend API
Update `lib/core/constants/api_constants.dart` with your backend URL:
```dart
static const String baseUrl = 'http://your-backend-url:5000/api';
```

### Firebase
1. Add `google-services.json` (Android) to `android/app/`
2. Add `GoogleService-Info.plist` (iOS) to `ios/Runner/`

## 📦 Dependencies

See `pubspec.yaml` for complete list of packages.

## 🎨 Design

The app implements a comprehensive UI kit with:
- 88+ pre-designed screens
- Dark and light themes
- Smooth animations and transitions
- Responsive layouts

## 🤝 Contributing

This is a private project for Mixillo platform.

## 📄 License

Proprietary - All rights reserved

## 📧 Contact

For questions or support, contact the Mixillo team.
