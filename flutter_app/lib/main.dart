import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'core/theme/app_theme.dart';
import 'core/services/api_service.dart';
import 'core/widgets/custom_bottom_nav_new.dart';
import 'features/feed/presentation/pages/video_feed_page.dart';
import 'features/posts/presentation/pages/posts_feed_page_new.dart';
import 'features/camera_editor/presentation/pages/tiktok_camera_page_new.dart';
import 'features/shop/pages/shop_home_page.dart';
import 'features/shop/widgets/network_status_indicator.dart';
import 'features/profile/presentation/pages/profile_page.dart';

void main() {
  runZonedGuarded(() async {
    WidgetsFlutterBinding.ensureInitialized();
    
    // Load environment variables
    await dotenv.load(fileName: ".env");
    
    // Initialize API service
    ApiService().initialize();
    
    // Set system UI overlay style
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
    
    // Global error handling and graceful fallback UI
    FlutterError.onError = (FlutterErrorDetails details) {
      Zone.current.handleUncaughtError(details.exception, details.stack ?? StackTrace.empty);
    };

    ErrorWidget.builder = (FlutterErrorDetails details) {
      // In debug mode, show more details
      final bool isDebug = !kReleaseMode;
      final String errorMessage = isDebug 
        ? details.exception.toString() 
        : 'Something went wrong';
      
      return Material(
        color: Colors.black,
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.warning_amber_rounded, color: Colors.white, size: 48),
                const SizedBox(height: 12),
                Text(
                  errorMessage,
                  style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600),
                  textAlign: TextAlign.center,
                ),
                if (isDebug) ...[
                  const SizedBox(height: 8),
                  Text(
                    details.stack.toString().split('\n').take(3).join('\n'),
                    style: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontSize: 12),
                    textAlign: TextAlign.center,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                const SizedBox(height: 16),
                TextButton.icon(
                  onPressed: () {
                    // Restart the app
                    runApp(const ProviderScope(child: MixilloApp()));
                  },
                  icon: const Icon(Icons.refresh, color: Colors.white),
                  label: const Text('Tap to restart', style: TextStyle(color: Colors.white)),
                  style: TextButton.styleFrom(
                    backgroundColor: Colors.white.withValues(alpha: 0.2),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    };

    runApp(const ProviderScope(child: MixilloApp()));
  }, (error, stack) {
    // TODO: send to crash reporting service
    debugPrint('Uncaught error: $error');
  });
}

class MixilloApp extends ConsumerWidget {
  const MixilloApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp(
      title: 'Mixillo',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: const NetworkStatusIndicator(
        child: MainNavigator(), // Use main navigation with bottom nav
      ),
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      body: IndexedStack(
        index: _currentIndex,
        children: [
          const VideoFeedPage(),                  // Home (index 0) - Video feed
          const PostsFeedPageNew(),               // Post (index 1) - Instagram-style posts
          const TikTokCameraPageNew(),            // Camera (index 2)
          const ShopHomePage(),                   // Shop (index 3) - TikTok-style shop
          const ProfilePage(),                    // Profile (index 4)
        ],
      ),
      bottomNavigationBar: CustomBottomNav(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
      ),
    );
  }
}
