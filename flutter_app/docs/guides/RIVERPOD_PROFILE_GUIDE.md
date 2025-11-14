# Using Profile Feature with Riverpod

## ✅ You Already Have Riverpod Installed!

Your app uses `flutter_riverpod` (already in pubspec.yaml). No need to install `provider` package.

---

## 🎯 What is a Provider?

A **Provider** stores data that multiple screens need to share. For example:
- Your user profile information
- Followers count
- Videos you posted
- Wallet balance

Instead of loading this data separately on each screen, the **ProfileProvider** loads it once and shares it everywhere.

---

## 📁 Files You Need

I've created a Riverpod version: `profile_provider_riverpod.dart`

This replaces the old `profile_provider.dart` (which was for the `provider` package).

---

## 🔧 How to Use It

### 1. **In Your Profile Screen** - View Profile

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/profile_provider_riverpod.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  @override
  void initState() {
    super.initState();
    // Load profile when screen opens
    Future.microtask(() {
      ref.read(profileProvider.notifier).loadCurrentProfile();
    });
  }

  @override
  Widget build(BuildContext context) {
    // Watch profile state for changes
    final profileState = ref.watch(profileProvider);
    
    // Show loading spinner
    if (profileState.isLoading) {
      return Center(child: CircularProgressIndicator());
    }
    
    // Show error
    if (profileState.error != null) {
      return Center(child: Text('Error: ${profileState.error}'));
    }
    
    // Show profile
    final profile = profileState.currentProfile;
    if (profile == null) {
      return Center(child: Text('No profile found'));
    }
    
    return Column(
      children: [
        // Avatar
        CircleAvatar(
          radius: 50,
          backgroundImage: NetworkImage(profile.avatar),
        ),
        
        // Name
        Text(profile.fullName, style: TextStyle(fontSize: 24)),
        
        // Username
        Text('@${profile.username}', style: TextStyle(color: Colors.grey)),
        
        // Stats
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Followers: ${profile.followersCount}'),
            SizedBox(width: 20),
            Text('Following: ${profile.followingCount}'),
          ],
        ),
      ],
    );
  }
}
```

---

### 2. **Edit Profile** - Update Profile

```dart
// In your edit profile screen
ElevatedButton(
  onPressed: () async {
    final success = await ref.read(profileProvider.notifier).updateProfile(
      fullName: 'New Name',
      bio: 'My new bio',
      website: 'https://example.com',
    );
    
    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Profile updated!')),
      );
    }
  },
  child: Text('Save'),
)
```

---

### 3. **Follow a User** - Toggle Follow

```dart
// In another user's profile screen
ElevatedButton(
  onPressed: () async {
    final success = await ref.read(profileProvider.notifier).toggleFollow(userId);
    
    if (success) {
      // Followers count updates automatically!
    }
  },
  child: Text('Follow'),
)
```

---

### 4. **View Another User's Profile**

```dart
@override
void initState() {
  super.initState();
  Future.microtask(() {
    ref.read(profileProvider.notifier).loadUserProfile('user123');
  });
}

@override
Widget build(BuildContext context) {
  final profileState = ref.watch(profileProvider);
  final profile = profileState.viewedProfile; // Use viewedProfile for other users
  
  // ... rest of your UI
}
```

---

## 🔑 Key Concepts

### **ref.watch()** - Listen to changes
```dart
final profileState = ref.watch(profileProvider);
// UI rebuilds when profile changes
```

### **ref.read()** - Call methods once
```dart
ref.read(profileProvider.notifier).loadCurrentProfile();
// Loads profile, doesn't rebuild UI
```

### **ref.listen()** - React to changes
```dart
ref.listen(profileProvider, (previous, next) {
  if (next.error != null) {
    // Show error dialog
  }
});
```

---

## 🎯 What's Inside ProfileState?

```dart
profileState.currentProfile      // Your own profile
profileState.viewedProfile       // Another user's profile you're viewing
profileState.userVideos          // List of videos
profileState.followers           // List of followers
profileState.following           // List of following
profileState.isLoading           // true when loading data
profileState.isFollowLoading     // true when following/unfollowing
profileState.error               // Error message if something fails
```

---

## 🔗 Connecting to Your Backend

Update the auth token in `profile_provider_riverpod.dart`:

```dart
final profileServiceProvider = Provider<ProfileService>((ref) {
  // TODO: Get token from your auth system
  final authToken = ref.watch(authProvider).token; // Your existing auth provider
  
  return ProfileService(
    baseUrl: 'https://mixillo-backend-676176652089.europe-west1.run.app',
    authToken: 'Bearer $authToken',
  );
});
```

---

## 🚀 Quick Start

### Option 1: Use the Existing Profile Page
Your app already has `ProfilePage()` at index 4 in `MainNavigator`. Just update it to use the new profile screens.

### Option 2: Navigate to New Profile Screens
```dart
// Go to profile
Navigator.push(
  context,
  MaterialPageRoute(builder: (context) => ProfileScreen()),
);

// Go to edit profile
Navigator.push(
  context,
  MaterialPageRoute(builder: (context) => EditProfileScreen()),
);

// Go to wallet
Navigator.push(
  context,
  MaterialPageRoute(builder: (context) => WalletScreen()),
);
```

---

## 🎨 Example: Complete Profile Screen with Riverpod

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/profile_provider_riverpod.dart';
import '../widgets/profile_header.dart';
import '../widgets/profile_stats_row.dart';
import '../widgets/video_grid.dart';

class MyProfileScreen extends ConsumerStatefulWidget {
  const MyProfileScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<MyProfileScreen> createState() => _MyProfileScreenState();
}

class _MyProfileScreenState extends ConsumerState<MyProfileScreen> {
  @override
  void initState() {
    super.initState();
    // Load profile on screen open
    Future.microtask(() {
      ref.read(profileProvider.notifier).loadCurrentProfile();
    });
  }

  @override
  Widget build(BuildContext context) {
    final profileState = ref.watch(profileProvider);

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: Text(profileState.currentProfile?.username ?? 'Profile'),
        actions: [
          IconButton(
            icon: Icon(Icons.settings),
            onPressed: () {
              // Navigate to settings
            },
          ),
        ],
      ),
      body: profileState.isLoading
          ? Center(child: CircularProgressIndicator())
          : profileState.error != null
              ? Center(child: Text('Error: ${profileState.error}'))
              : profileState.currentProfile == null
                  ? Center(child: Text('No profile'))
                  : RefreshIndicator(
                      onRefresh: () async {
                        await ref.read(profileProvider.notifier).refresh();
                      },
                      child: SingleChildScrollView(
                        child: Column(
                          children: [
                            // Profile Header (avatar, bio, buttons)
                            ProfileHeader(
                              profile: profileState.currentProfile!,
                              isOwnProfile: true,
                              onEditPressed: () {
                                // Navigate to edit screen
                              },
                            ),
                            
                            // Stats (followers, following, likes)
                            ProfileStatsRow(
                              followersCount: profileState.currentProfile!.followersCount,
                              followingCount: profileState.currentProfile!.followingCount,
                              likesCount: profileState.currentProfile!.likesReceivedCount,
                              onFollowersPressed: () {
                                // Navigate to followers list
                              },
                              onFollowingPressed: () {
                                // Navigate to following list
                              },
                            ),
                            
                            // Video Grid
                            VideoGrid(
                              videos: profileState.userVideos,
                              onVideoTap: (video) {
                                // Open video player
                              },
                            ),
                          ],
                        ),
                      ),
                    ),
    );
  }
}
```

---

## ✅ Summary

1. **ProfileProvider** = Stores profile data
2. **ref.watch()** = Get data and listen for changes
3. **ref.read().notifier** = Call methods to load/update data
4. All your profile screens can access the same data automatically!

No need to pass data between screens or load it multiple times. The provider handles everything! 🎉
