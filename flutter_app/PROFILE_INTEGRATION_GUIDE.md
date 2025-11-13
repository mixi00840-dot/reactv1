# Profile Feature Integration Guide

## 📁 Files Created (16 Total)

### Services Layer
- `lib/features/profile/services/profile_service.dart` - HTTP API client for all profile operations

### State Management
- `lib/features/profile/providers/profile_provider.dart` - ChangeNotifier for profile state

### Data Models
- `lib/features/profile/data/models/user_profile_model.dart` - Updated with API parsing

### Screens (10 screens)
1. `lib/features/profile/screens/profile_screen.dart` - Main profile with tabs
2. `lib/features/profile/screens/edit_profile_screen.dart` - Edit profile form
3. `lib/features/profile/screens/followers_list_screen.dart` - Followers/following lists
4. `lib/features/profile/screens/settings_screen.dart` - App settings
5. `lib/features/profile/screens/wallet_screen.dart` - Wallet dashboard
6. `lib/features/profile/screens/wallet_topup_screen.dart` - Top-up wallet
7. `lib/features/profile/screens/transaction_history_screen.dart` - Transaction list
8. `lib/features/profile/screens/supporters_screen.dart` - Supporters leaderboard
9. `lib/features/profile/screens/levels_badges_screen.dart` - Levels & badges

### Widgets (3 widgets)
1. `lib/features/profile/widgets/profile_header.dart` - Avatar, bio, action buttons
2. `lib/features/profile/widgets/profile_stats_row.dart` - Followers/Following/Likes stats
3. `lib/features/profile/widgets/video_grid.dart` - 3-column video grid

---

## 🔌 Step 1: Add Provider to App

### Update `lib/main.dart`:

```dart
import 'package:provider/provider.dart';
import 'features/profile/providers/profile_provider.dart';
import 'features/profile/services/profile_service.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        // Add ProfileProvider
        ChangeNotifierProvider(
          create: (_) => ProfileProvider(
            profileService: ProfileService(
              baseUrl: 'https://mixillo-backend-xxx.run.app', // Your backend URL
              authToken: 'Bearer YOUR_JWT_TOKEN', // Get from auth
            ),
          ),
        ),
        // ... other providers
      ],
      child: MyApp(),
    ),
  );
}
```

---

## 🧭 Step 2: Add Routes

### Create `lib/routes/app_routes.dart`:

```dart
import 'package:flutter/material.dart';
import '../features/profile/screens/profile_screen.dart';
import '../features/profile/screens/edit_profile_screen.dart';
import '../features/profile/screens/followers_list_screen.dart';
import '../features/profile/screens/settings_screen.dart';
import '../features/profile/screens/wallet_screen.dart';
import '../features/profile/screens/wallet_topup_screen.dart';
import '../features/profile/screens/transaction_history_screen.dart';
import '../features/profile/screens/supporters_screen.dart';
import '../features/profile/screens/levels_badges_screen.dart';

class AppRoutes {
  static const String profile = '/profile';
  static const String editProfile = '/edit-profile';
  static const String followersList = '/followers-list';
  static const String settings = '/settings';
  static const String wallet = '/wallet';
  static const String walletTopup = '/wallet-topup';
  static const String transactionHistory = '/transaction-history';
  static const String supporters = '/supporters';
  static const String levelsBadges = '/levels-badges';

  static Map<String, WidgetBuilder> routes = {
    profile: (context) => const ProfileScreen(),
    editProfile: (context) => const EditProfileScreen(),
    followersList: (context) {
      final args = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>?;
      return FollowersListScreen(
        userId: args?['userId'] ?? '',
        initialTab: args?['initialTab'] ?? 0,
      );
    },
    settings: (context) => const SettingsScreen(),
    wallet: (context) => const WalletScreen(),
    walletTopup: (context) => const WalletTopUpScreen(),
    transactionHistory: (context) => const TransactionHistoryScreen(),
    supporters: (context) {
      final args = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>?;
      return SupportersScreen(userId: args?['userId'] ?? '');
    },
    levelsBadges: (context) => const LevelsBadgesScreen(),
  };
}
```

### Update `lib/main.dart` MaterialApp:

```dart
class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Mixillo',
      theme: ThemeData.dark(),
      routes: AppRoutes.routes,
      initialRoute: '/', // Your home route
      // ... other config
    );
  }
}
```

---

## 🎯 Step 3: Usage Examples

### Navigate to Own Profile
```dart
Navigator.pushNamed(context, AppRoutes.profile);
```

### Navigate to Another User's Profile
```dart
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => ProfileScreen(userId: 'user123'),
  ),
);
```

### Navigate to Followers List (Followers Tab)
```dart
Navigator.pushNamed(
  context,
  AppRoutes.followersList,
  arguments: {
    'userId': currentUserId,
    'initialTab': 0, // 0 = Followers, 1 = Following
  },
);
```

### Navigate to Wallet
```dart
Navigator.pushNamed(context, AppRoutes.wallet);
```

### Navigate to Settings
```dart
Navigator.pushNamed(context, AppRoutes.settings);
```

---

## 🔧 Step 4: Integration with Auth

### Get Auth Token from Your Auth Provider

```dart
// In your ProfileProvider initialization
final authToken = context.read<AuthProvider>().token;

final profileService = ProfileService(
  baseUrl: 'https://mixillo-backend-xxx.run.app',
  authToken: 'Bearer $authToken',
);
```

### Update Token When User Logs In/Out

```dart
class ProfileProvider extends ChangeNotifier {
  ProfileService _profileService;

  void updateAuthToken(String newToken) {
    _profileService = ProfileService(
      baseUrl: _profileService.baseUrl,
      authToken: 'Bearer $newToken',
    );
    notifyListeners();
  }

  void clearProfile() {
    currentProfile = null;
    viewedProfile = null;
    userVideos.clear();
    followers.clear();
    following.clear();
    notifyListeners();
  }
}
```

---

## 📱 Step 5: Add Profile Button to App Bar

### Example: Add to Home Screen

```dart
AppBar(
  title: Text('Home'),
  actions: [
    IconButton(
      icon: CircleAvatar(
        radius: 16,
        backgroundImage: NetworkImage(currentUser.avatar),
      ),
      onPressed: () {
        Navigator.pushNamed(context, AppRoutes.profile);
      },
    ),
  ],
)
```

---

## 🖼️ Step 6: Image Picker Integration

### Add dependency to `pubspec.yaml`:
```yaml
dependencies:
  image_picker: ^1.0.4
```

### Update `edit_profile_screen.dart`:

```dart
import 'package:image_picker/image_picker.dart';

Future<void> _pickImage() async {
  final picker = ImagePicker();
  final pickedFile = await picker.pickImage(
    source: ImageSource.gallery,
    maxWidth: 800,
    maxHeight: 800,
    imageQuality: 85,
  );

  if (pickedFile != null) {
    setState(() {
      _isUploading = true;
    });

    final provider = context.read<ProfileProvider>();
    final success = await provider.uploadAvatar(pickedFile.path);

    setState(() {
      _isUploading = false;
    });

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Avatar updated successfully')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to upload avatar')),
      );
    }
  }
}
```

---

## 🎥 Step 7: Video Player Integration

### Update `video_grid.dart` to handle video taps:

```dart
VideoGridItem(
  video: video,
  onTap: () {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => VideoPlayerScreen(
          videoId: video['_id'],
          videoUrl: video['videoUrl'],
        ),
      ),
    );
  },
)
```

---

## 🔔 Step 8: Real-time Updates

### WebSocket Integration (Optional)

```dart
// In ProfileProvider
void subscribeToProfileUpdates(String userId) {
  // Connect to WebSocket
  socket.on('profile_updated', (data) {
    if (data['userId'] == userId) {
      loadUserProfile(userId);
    }
  });

  socket.on('follower_count_updated', (data) {
    if (data['userId'] == userId) {
      viewedProfile?.followersCount = data['count'];
      notifyListeners();
    }
  });
}
```

---

## ⚙️ Step 9: Environment Configuration

### Create `lib/config/api_config.dart`:

```dart
class ApiConfig {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://mixillo-backend-xxx.run.app',
  );

  static const String profileEndpoint = '/api/users';
  static const String walletEndpoint = '/api/wallets';
  static const String supportersEndpoint = '/api/supporters';
}
```

### Update ProfileService:

```dart
import '../../../config/api_config.dart';

ProfileService({
  String? baseUrl,
  required this.authToken,
}) : baseUrl = baseUrl ?? ApiConfig.baseUrl;
```

---

## 🧪 Step 10: Testing

### Test Profile Flow

1. **View Profile**
   ```dart
   await tester.pumpWidget(MyApp());
   await tester.tap(find.byIcon(Icons.person));
   await tester.pumpAndSettle();
   expect(find.byType(ProfileScreen), findsOneWidget);
   ```

2. **Edit Profile**
   ```dart
   await tester.tap(find.text('Edit Profile'));
   await tester.pumpAndSettle();
   
   await tester.enterText(find.byType(TextField).first, 'New Name');
   await tester.tap(find.text('Save'));
   await tester.pumpAndSettle();
   ```

3. **Follow User**
   ```dart
   await tester.tap(find.text('Follow'));
   await tester.pumpAndSettle();
   expect(find.text('Following'), findsOneWidget);
   ```

---

## 🐛 Troubleshooting

### Issue: "No ProfileProvider found"
**Solution**: Ensure ProfileProvider is added to MultiProvider in main.dart above the MaterialApp.

### Issue: "401 Unauthorized"
**Solution**: Check that auth token is correctly passed to ProfileService and is still valid.

### Issue: "Network images not loading"
**Solution**: Add Internet permission in `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET"/>
```

### Issue: "Provider not updating UI"
**Solution**: Use `context.watch<ProfileProvider>()` in build method or wrap with `Consumer<ProfileProvider>`.

---

## 📊 Performance Tips

1. **Cache Profile Data**
   ```dart
   // In ProfileProvider
   final Map<String, UserProfile> _profileCache = {};
   
   Future<void> loadUserProfile(String userId) async {
     if (_profileCache.containsKey(userId)) {
       viewedProfile = _profileCache[userId];
       notifyListeners();
     }
     
     final profile = await _profileService.getUserProfile(userId);
     _profileCache[userId] = profile;
     viewedProfile = profile;
     notifyListeners();
   }
   ```

2. **Lazy Load Videos**
   ```dart
   // Implement pagination in video grid
   final ScrollController _scrollController = ScrollController();
   
   @override
   void initState() {
     super.initState();
     _scrollController.addListener(_onScroll);
   }
   
   void _onScroll() {
     if (_scrollController.position.pixels >= 
         _scrollController.position.maxScrollExtent - 200) {
       _loadMoreVideos();
     }
   }
   ```

3. **Optimize Image Loading**
   ```dart
   dependencies:
     cached_network_image: ^3.3.0
   
   CachedNetworkImage(
     imageUrl: profile.avatar,
     placeholder: (context, url) => CircularProgressIndicator(),
     errorWidget: (context, url, error) => Icon(Icons.person),
   )
   ```

---

## ✅ Completion Checklist

- [ ] Add ProfileProvider to app
- [ ] Configure routes
- [ ] Wire up navigation buttons
- [ ] Test profile viewing
- [ ] Test profile editing
- [ ] Test follow/unfollow
- [ ] Add image picker for avatar
- [ ] Connect video grid to player
- [ ] Test wallet screens
- [ ] Test transaction history
- [ ] Test supporters leaderboard
- [ ] Test levels & badges
- [ ] Test settings
- [ ] Add error handling
- [ ] Add loading states
- [ ] Test offline behavior
- [ ] Optimize performance
- [ ] Add analytics tracking

---

## 🚀 Next Steps

1. **Phase 3: Seller Features**
   - Seller application screen
   - Seller dashboard/CMS
   - Product management screens
   - Order management

2. **Phase 4: Advanced Features**
   - Privacy settings implementation
   - Notification settings implementation
   - Block/Report functionality
   - Profile sharing

3. **Phase 5: Polish**
   - Animations and transitions
   - Loading skeletons
   - Error boundaries
   - Accessibility improvements

---

## 📞 API Backend Status

**Profile APIs: ✅ 100% Ready**
- GET /api/users/profile
- GET /api/users/:userId
- PUT /api/users/profile
- POST /api/users/:userId/follow
- GET /api/users/:userId/followers
- GET /api/users/:userId/following
- POST /api/users/upload-avatar

**Wallet APIs: ✅ 100% Ready**
- GET /api/wallets/:userId
- GET /api/wallets/:userId/transactions

**Supporters APIs: ✅ 80% Ready**
- POST /api/supporters/support/:creatorId
- GET /api/supporters/leaderboard/:creatorId

**Missing APIs (to be implemented):**
- GET /api/users/:userId/level
- GET /api/users/:userId/badges
- POST /api/users/block/:userId
- POST /api/users/report/:userId

For detailed backend analysis, see: `PROFILE_IMPLEMENTATION_PLAN.md`
