# ⚡ Quick Reference Card - Mixillo Flutter App

## 🚀 ONE-COMMAND START

```bash
cd flutter_app && flutter pub get && flutter run
```

## 📁 PROJECT STRUCTURE

```
lib/
├── core/theme/          # Colors, gradients, typography
├── core/widgets/        # Reusable components
├── features/
│   ├── auth/           # Welcome, Login, Register
│   ├── feed/           # Video feed
│   └── camera/         # Camera UI
└── main.dart
```

## 🎨 QUICK IMPORT REFERENCE

```dart
// Theme
import 'core/theme/app_colors.dart';
import 'core/theme/app_gradients.dart';
import 'core/theme/app_typography.dart';
import 'core/theme/app_shadows.dart';
import 'core/theme/app_theme.dart';

// Widgets
import 'core/widgets/glass_widgets.dart';
import 'core/widgets/custom_bottom_nav.dart';

// Packages
import 'package:flutter/material.dart';
import 'package:iconsax/iconsax.dart';
import 'package:animate_do/animate_do.dart';
```

## 🎯 COMMON CODE SNIPPETS

### Glass Container
```dart
GlassContainer(
  padding: EdgeInsets.all(16),
  borderRadius: BorderRadius.circular(12),
  blur: 10.0,
  child: Text('Hello'),
)
```

### Gradient Button
```dart
GradientButton(
  text: 'Click Me',
  onPressed: () {},
  width: double.infinity,
  gradient: AppGradients.primary,
)
```

### Animated Icon Button
```dart
AnimatedIconButton(
  icon: Iconsax.heart,
  onPressed: () {},
  gradient: AppGradients.primary,
  hasGlow: true,
)
```

### Gradient Text
```dart
ShaderMask(
  shaderCallback: (bounds) =>
      AppGradients.primary.createShader(bounds),
  child: Text(
    'Hello',
    style: AppTypography.titleLarge,
  ),
)
```

### Page Navigation
```dart
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => NextPage(),
  ),
);
```

## 🎨 COLOR QUICK ACCESS

```dart
AppColors.primary        // #FF006E (Pink)
AppColors.accent         // #00F5FF (Cyan)
AppColors.neonPurple     // #BB00FF
AppColors.neonGreen      // #00FF94
AppColors.background     // #000000 (Black)
AppColors.textPrimary    // #FFFFFF (White)
AppColors.textSecondary  // #B0B0B0 (Gray)
```

## 📐 SPACING QUICK ACCESS

```dart
AppSpacing.xs    // 4px
AppSpacing.sm    // 8px
AppSpacing.md    // 16px
AppSpacing.lg    // 24px
AppSpacing.xl    // 32px
AppSpacing.xxl   // 48px
AppSpacing.xxxl  // 64px
```

## 🌈 GRADIENT QUICK ACCESS

```dart
AppGradients.primary           // Pink → Purple
AppGradients.accent            // Blue → Purple
AppGradients.neonRainbow       // Multi-color
AppGradients.overlayTop        // Top fade
AppGradients.overlayBottom     // Bottom fade
AppGradients.backgroundDark    // Dark BG
```

## ✍️ TYPOGRAPHY QUICK ACCESS

```dart
AppTypography.displayLarge   // 57px, Bold
AppTypography.headlineMedium // 28px, SemiBold
AppTypography.titleLarge     // 22px, SemiBold
AppTypography.bodyLarge      // 16px, Regular
AppTypography.bodyMedium     // 14px, Regular
AppTypography.labelLarge     // 14px, Medium
AppTypography.button         // 16px, SemiBold
```

## 💫 SHADOW QUICK ACCESS

```dart
AppShadows.small          // Small depth
AppShadows.medium         // Medium depth
AppShadows.large          // Large depth
AppShadows.neonPink       // Pink glow
AppShadows.neonBlue       // Blue glow
AppShadows.neonPurple     // Purple glow
AppShadows.neonRainbow    // Multi-color glow
AppShadows.textShadowMedium // Text shadow
```

## 🎭 ICON QUICK ACCESS

```dart
// Navigation
Iconsax.home
Iconsax.discover
Iconsax.notification
Iconsax.user

// Actions
Icons.favorite
Iconsax.message
Iconsax.send_2
Icons.more_vert

// Camera
Iconsax.flash_1
Iconsax.timer_1
Iconsax.music
Iconsax.camera
Iconsax.magic_star

// Forms
Iconsax.sms          // Email
Iconsax.lock         // Password
Iconsax.eye          // Show password
Iconsax.eye_slash    // Hide password
```

## 🔧 FLUTTER COMMANDS

```bash
# Install dependencies
flutter pub get

# Run app
flutter run

# Hot reload
r (in terminal)

# Hot restart
R (in terminal)

# Clean build
flutter clean

# Build APK
flutter build apk --release

# Build iOS
flutter build ios --release

# Generate code
flutter pub run build_runner build

# Check for errors
flutter analyze

# List devices
flutter devices
```

## 📱 DEVICE TESTING

```bash
# Android
flutter run -d android

# iOS
flutter run -d ios

# Specific device
flutter run -d <device-id>

# Check devices
flutter devices
```

## 🐛 DEBUGGING

```bash
# View logs
flutter logs

# Clear cache
flutter clean

# Fix gradle issues
cd android && ./gradlew clean && cd ..

# Fix pod issues
cd ios && pod install && cd ..
```

## 📦 PACKAGE MANAGEMENT

```bash
# Add package
flutter pub add package_name

# Remove package
flutter pub remove package_name

# Upgrade packages
flutter pub upgrade

# Outdated packages
flutter pub outdated
```

## 🎬 ANIMATION PRESETS

```dart
// From animate_do package
FadeIn(child: Widget())
FadeInDown(child: Widget())
FadeInUp(child: Widget())
FadeInLeft(child: Widget())
SlideInUp(child: Widget())
Pulse(infinite: true, child: Widget())
```

## 🔄 STATE MANAGEMENT (Riverpod)

```dart
// Provider
@riverpod
class Counter extends _$Counter {
  @override
  int build() => 0;
  
  void increment() => state++;
}

// Consumer
Consumer(
  builder: (context, ref, child) {
    final count = ref.watch(counterProvider);
    return Text('$count');
  },
)
```

## 🌐 API CALLS (Dio)

```dart
final dio = Dio();

// GET
final response = await dio.get('/api/users');

// POST
final response = await dio.post(
  '/api/login',
  data: {'email': 'test@test.com', 'password': '123456'},
);

// PUT
final response = await dio.put('/api/users/1', data: data);

// DELETE
final response = await dio.delete('/api/users/1');
```

## 💾 LOCAL STORAGE

```dart
// SharedPreferences
final prefs = await SharedPreferences.getInstance();
await prefs.setString('token', 'abc123');
final token = prefs.getString('token');

// Hive
final box = await Hive.openBox('myBox');
await box.put('key', 'value');
final value = box.get('key');
```

## 🎥 VIDEO PLAYER

```dart
final controller = VideoPlayerController.network(
  'https://example.com/video.mp4',
);
await controller.initialize();
controller.play();

VideoPlayer(controller)
```

## 📸 CAMERA ACCESS

```dart
final cameras = await availableCameras();
final controller = CameraController(
  cameras[0],
  ResolutionPreset.high,
);
await controller.initialize();

CameraPreview(controller)
```

## ✅ FORM VALIDATION

```dart
TextFormField(
  validator: (value) {
    if (value?.isEmpty ?? true) {
      return 'Required field';
    }
    if (!value!.contains('@')) {
      return 'Invalid email';
    }
    return null;
  },
)
```

## 🎯 ENVIRONMENT VARIABLES

```dart
// Load .env
await dotenv.load(fileName: ".env");

// Access
final apiUrl = dotenv.env['API_BASE_URL'];
```

## 📊 USEFUL EXTENSIONS

```dart
// Create file: lib/core/extensions/context_extensions.dart
extension ContextExtensions on BuildContext {
  Size get screenSize => MediaQuery.of(this).size;
  double get width => screenSize.width;
  double get height => screenSize.height;
  
  // Usage: context.width
}
```

## 🎨 CUSTOM WIDGETS TEMPLATE

```dart
class MyWidget extends StatelessWidget {
  final String text;
  final VoidCallback? onTap;
  
  const MyWidget({
    super.key,
    required this.text,
    this.onTap,
  });
  
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Text(text),
    );
  }
}
```

## 🚦 COMMON PATTERNS

### Show SnackBar
```dart
ScaffoldMessenger.of(context).showSnackBar(
  SnackBar(content: Text('Message')),
);
```

### Show Dialog
```dart
showDialog(
  context: context,
  builder: (context) => AlertDialog(
    title: Text('Title'),
    content: Text('Content'),
    actions: [
      TextButton(
        onPressed: () => Navigator.pop(context),
        child: Text('OK'),
      ),
    ],
  ),
);
```

### Show Bottom Sheet
```dart
showModalBottomSheet(
  context: context,
  builder: (context) => Container(
    child: Text('Sheet Content'),
  ),
);
```

## 🔐 PERMISSIONS

```dart
// Check permission
final status = await Permission.camera.status;

// Request permission
final result = await Permission.camera.request();

// Open settings
await openAppSettings();
```

## 📝 USEFUL PACKAGES

```yaml
# State Management
flutter_riverpod: ^2.4.9

# UI/Animation
lottie: ^3.0.0
animate_do: ^3.1.2
shimmer: ^3.0.0
iconsax: ^0.0.8

# Camera/Video
camera: ^0.10.5+7
video_player: ^2.8.2

# Network
dio: ^5.4.0

# Storage
shared_preferences: ^2.2.2
hive: ^2.2.3

# Images
cached_network_image: ^3.3.1
```

## 🎓 LEARNING RESOURCES

- Flutter Docs: https://docs.flutter.dev
- Dart Docs: https://dart.dev
- Pub.dev: https://pub.dev
- Flutter Community: https://flutter.dev/community

## 💡 PRODUCTIVITY TIPS

1. Use `cmd/ctrl + .` for quick fixes
2. Use `cmd/ctrl + space` for autocomplete
3. Use Flutter DevTools for debugging
4. Hot reload with `r` in terminal
5. Use VS Code snippets for faster coding

## 🎯 NEXT STEPS

1. ✅ Download fonts → `assets/fonts/`
2. ✅ Configure `.env` file
3. ✅ Run `flutter pub get`
4. ✅ Run `flutter run`
5. 🔄 Start building remaining features

---

**Keep this card handy for quick reference! 🚀**
