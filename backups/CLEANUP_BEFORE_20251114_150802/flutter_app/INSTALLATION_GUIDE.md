# 🚀 Complete Installation & Setup Guide

## Prerequisites

Before starting, ensure you have:
- ✅ Flutter SDK 3.0+ installed
- ✅ Dart 3.0+ installed
- ✅ Android Studio or Xcode
- ✅ VS Code with Flutter extension

Check your Flutter installation:
```bash
flutter doctor
```

## Step 1: Navigate to Project

```bash
cd c:\Users\ASUS\Desktop\reactv1\flutter_app
```

## Step 2: Install Dependencies

```bash
flutter pub get
```

## Step 3: Download Required Fonts

### Poppins Font
1. Visit: https://fonts.google.com/specimen/Poppins
2. Download these weights:
   - Regular (400)
   - Medium (500)
   - SemiBold (600)
   - Bold (700)

### Inter Font
1. Visit: https://fonts.google.com/specimen/Inter
2. Download these weights:
   - Regular (400)
   - Medium (500)
   - SemiBold (600)
   - Bold (700)

### Font Installation
Create the fonts directory and add the downloaded fonts:

```bash
mkdir -p assets\fonts
```

Place the `.ttf` files in `assets/fonts/` directory:
```
assets/
  fonts/
    Poppins-Regular.ttf
    Poppins-Medium.ttf
    Poppins-SemiBold.ttf
    Poppins-Bold.ttf
    Inter-Regular.ttf
    Inter-Medium.ttf
    Inter-SemiBold.ttf
    Inter-Bold.ttf
```

## Step 4: Create Assets Directories

```bash
mkdir -p assets\images
mkdir -p assets\icons
mkdir -p assets\lottie
mkdir -p assets\rive
```

## Step 5: Configure Environment

Edit the `.env` file with your credentials:

```env
API_BASE_URL=http://192.168.1.100:5000/api  # Use your computer's IP
SOCKET_URL=http://192.168.1.100:5000
ZEGO_APP_ID=your_zego_app_id
ZEGO_APP_SIGN=your_zego_app_sign
AGORA_APP_ID=your_agora_app_id
```

**Important**: When testing on a physical device, replace `localhost` with your computer's IP address.

## Step 6: Setup Android Permissions

Edit `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Required Permissions -->
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.CAMERA"/>
    <uses-permission android:name="android.permission.RECORD_AUDIO"/>
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS"/>
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
    
    <application
        android:label="Mixillo"
        android:icon="@mipmap/ic_launcher">
        <!-- Your activity configuration -->
    </application>
</manifest>
```

## Step 7: Setup iOS Permissions

Edit `ios/Runner/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>This app needs camera access to record videos</string>
<key>NSMicrophoneUsageDescription</key>
<string>This app needs microphone access to record audio</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>This app needs photo library access to save videos</string>
```

## Step 8: Run the App

### For Android:
```bash
flutter run
```

### For iOS:
```bash
flutter run
```

### For specific device:
```bash
flutter devices  # List available devices
flutter run -d <device-id>
```

## Step 9: Build for Release

### Android APK:
```bash
flutter build apk --release
```

Output: `build/app/outputs/flutter-apk/app-release.apk`

### Android App Bundle:
```bash
flutter build appbundle --release
```

Output: `build/app/outputs/bundle/release/app-release.aab`

### iOS:
```bash
flutter build ios --release
```

## 📱 Testing on Physical Device

### Android:
1. Enable Developer Options on your device
2. Enable USB Debugging
3. Connect via USB
4. Run: `flutter run`

### iOS:
1. Connect iPhone via USB
2. Trust the computer
3. In Xcode, select your device
4. Run: `flutter run`

## 🔧 Troubleshooting

### Issue: "Package not found"
```bash
flutter clean
flutter pub get
```

### Issue: "Build failed"
```bash
cd android
./gradlew clean
cd ..
flutter build apk
```

### Issue: "Camera not working"
- Check permissions in `AndroidManifest.xml`
- Restart the app after granting permissions

### Issue: Fonts not showing
- Verify font files are in `assets/fonts/`
- Check `pubspec.yaml` font paths
- Run: `flutter clean && flutter pub get`

## 🎨 Available Screens

### ✅ Completed:
1. **Welcome Page** - Premium landing page
2. **Login Page** - Glass UI with validation
3. **Register Page** - Full signup flow
4. **Video Feed** - TikTok-style vertical swipe
5. **Camera** - Multi-mode recording with filters
6. **Bottom Navigation** - Custom floating nav bar

### 🔄 To Implement:
7. Stories
8. Live Streaming
9. Posts Feed
10. Ecommerce
11. Profile
12. Settings

## 🎯 Quick Start Commands

```bash
# Install dependencies
flutter pub get

# Run app
flutter run

# Run with hot reload
flutter run --hot

# Build for production
flutter build apk --release

# Generate code (for Freezed/Riverpod)
flutter pub run build_runner build --delete-conflicting-outputs

# Check for issues
flutter doctor
flutter analyze
```

## 📦 Package Versions

All packages are specified in `pubspec.yaml`:
- flutter_riverpod: ^2.4.9
- lottie: ^3.0.0
- camera: ^0.10.5+7
- video_player: ^2.8.2
- iconsax: ^0.0.8
- animate_do: ^3.1.2

## 🔐 Backend Integration

The app connects to your Node.js backend running on port 5000.

### Start Backend:
```bash
cd ../backend
npm run dev
```

### API Endpoints:
- Auth: `http://localhost:5000/api/auth/*`
- Users: `http://localhost:5000/api/users/*`
- Videos: `http://localhost:5000/api/videos/*`

## 📱 App Features Overview

### Authentication
- Welcome screen with animations
- Login with email/password
- Registration with validation
- Social login placeholders

### Video Feed
- Vertical swipe navigation
- Auto-play videos
- Like, comment, share buttons
- User profile integration
- Music banner

### Camera
- 15s / 60s / 3min recording modes
- Beauty filter slider
- Flash control
- Camera flip
- Filter selection
- Recording progress

### Navigation
- Custom bottom nav bar
- TikTok-style center button
- Smooth page transitions
- Badge notifications

## 🎨 Customization

### Colors
Edit `lib/core/theme/app_colors.dart`

### Gradients
Edit `lib/core/theme/app_gradients.dart`

### Typography
Edit `lib/core/theme/app_typography.dart`

## 📸 Adding Mock Data

For testing video feed, edit:
`lib/features/feed/presentation/pages/video_feed_page.dart`

Update the `_videos` list with your test videos.

## 🚀 Next Steps

1. **Connect to Backend**: Implement API service layer
2. **Add State Management**: Complete Riverpod providers
3. **Implement Stories**: Create story viewer and creator
4. **Add Live Streaming**: Integrate Zego/Agora SDK
5. **Build Ecommerce**: Product catalog and checkout
6. **Create Profile**: User profile with wallet

## 📚 Resources

- Flutter Documentation: https://docs.flutter.dev
- Riverpod Documentation: https://riverpod.dev
- Camera Plugin: https://pub.dev/packages/camera
- Video Player: https://pub.dev/packages/video_player

## 💡 Tips

1. **Hot Reload**: Press `r` in terminal for hot reload
2. **Hot Restart**: Press `R` for hot restart
3. **Clear Cache**: `flutter clean` if facing build issues
4. **Debug Mode**: Use VS Code debugger for breakpoints
5. **Performance**: Use Flutter DevTools for profiling

## 🆘 Support

If you encounter issues:
1. Check Flutter version: `flutter --version`
2. Update Flutter: `flutter upgrade`
3. Clear cache: `flutter clean`
4. Re-install deps: `flutter pub get`
5. Check logs: `flutter logs`

---

**Happy Coding! 🎉**

Your TikTok-quality app is ready to run!
