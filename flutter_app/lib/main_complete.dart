import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'core/theme/app_theme.dart';
import 'core/widgets/custom_bottom_nav_new.dart';
import 'features/feed/presentation/pages/video_feed_page.dart';
import 'features/camera/presentation/pages/camera_page.dart';
import 'features/shop/presentation/pages/shop_page.dart';
import 'features/shop/providers/cart_provider.dart';
import 'features/discover/presentation/pages/discover_page.dart';
import 'features/profile/presentation/pages/profile_page.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Set system UI
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Colors.black,
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );
  
  // Set preferred orientations
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  
  runApp(const MixilloApp());
}

class MixilloApp extends StatelessWidget {
  const MixilloApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Mixillo',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: const MainNavigator(),
      // For testing, use WelcomePage:
      // home: const WelcomePage(),
    );
  }
}

/// Main navigation controller with custom bottom nav
class MainNavigator extends StatefulWidget {
  const MainNavigator({super.key});

  @override
  State<MainNavigator> createState() => _MainNavigatorState();
}

class _MainNavigatorState extends State<MainNavigator> {
  int _currentIndex = 0;
  final CartProvider _cartProvider = CartProvider();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      body: IndexedStack(
        index: _currentIndex,
        children: [
          const VideoFeedPage(),              // Home (index 0)
          const DiscoverPage(),               // Post (index 1) - Has Posts + Activity tabs
          const CameraPage(),                 // Camera (index 2)
          ShopPage(cartProvider: _cartProvider), // Shop (index 3)
          const ProfilePage(),                // Profile (index 4)
        ],
      ),
      bottomNavigationBar: CustomBottomNav(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
      ),
    );
  }
}
