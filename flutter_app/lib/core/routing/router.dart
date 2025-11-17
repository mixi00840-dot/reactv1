import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app_routes.dart';
import '../providers/auth_provider.dart';
import '../../features/auth/presentation/pages/splash_screen.dart';
import '../../features/auth/presentation/pages/onboarding_screen.dart';
import '../../features/auth/presentation/pages/login_screen.dart';
import '../../features/auth/presentation/pages/register_screen.dart';
import '../../features/home/presentation/pages/main_navigation.dart';
import '../../features/home/presentation/pages/home_screen.dart';
import '../../features/explore/presentation/pages/explore_screen.dart';
import '../../features/profile/presentation/pages/profile_screen.dart';
import '../../features/messages/presentation/pages/messages_list_page.dart';
import '../../features/messages/presentation/pages/chat_page.dart';
import '../../features/notifications/presentation/pages/notifications_page.dart';
import '../../features/notifications/presentation/pages/notification_settings_page.dart';
import '../../features/wallet/presentation/pages/wallet_page.dart';
import '../../features/wallet/presentation/pages/transaction_history_page.dart';
import '../../features/wallet/presentation/pages/top_up_page.dart';
import '../../features/profile/presentation/pages/withdrawal_page.dart';
import '../../features/cart/presentation/pages/cart_page.dart';
import '../../features/orders/presentation/pages/orders_page.dart';
import '../../features/products/presentation/pages/product_list_page.dart';
import '../../features/profile/presentation/pages/settings_page.dart';
import '../../features/profile/presentation/pages/privacy_settings_page.dart';
import '../../features/profile/presentation/pages/edit_profile_page.dart';
import '../../features/profile/presentation/pages/about_page.dart';
import '../../features/support/presentation/pages/faq_page.dart';
import '../../features/analytics/presentation/pages/analytics_page.dart';
import '../../features/content/presentation/pages/scheduled_posts_page.dart';
import '../../features/content/presentation/pages/schedule_post_page.dart';
import '../../features/live/presentation/pages/live_schedule_page.dart';
import '../../features/addresses/presentation/pages/addresses_page.dart';
import '../../features/payments/presentation/pages/payment_methods_page.dart';
import '../../features/coupons/presentation/pages/coupons_page.dart';
import '../../features/badges/presentation/pages/badges_page.dart';
import '../../features/coins/presentation/pages/coins_page.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(currentUserProvider);

  return GoRouter(
    initialLocation: AppRoutes.splash,
    debugLogDiagnostics: true,
    redirect: (context, state) {
      final isAuthenticated = authState.asData?.value != null;
      final isOnSplash = state.matchedLocation == AppRoutes.splash;
      final isOnAuth = state.matchedLocation == AppRoutes.login ||
          state.matchedLocation == AppRoutes.register ||
          state.matchedLocation == AppRoutes.onboarding;

      // If loading, stay on splash
      if (authState.isLoading && !isOnSplash) {
        return AppRoutes.splash;
      }

      // If authenticated and on auth pages, redirect to home
      if (isAuthenticated && isOnAuth) {
        return AppRoutes.home;
      }

      // If not authenticated and not on auth pages, redirect to login
      if (!isAuthenticated && !isOnAuth && !isOnSplash) {
        return AppRoutes.login;
      }

      return null;
    },
    routes: [
      // Splash & Onboarding
      GoRoute(
        path: AppRoutes.splash,
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: AppRoutes.onboarding,
        builder: (context, state) => const OnboardingScreen(),
      ),

      // Auth routes
      GoRoute(
        path: AppRoutes.login,
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: AppRoutes.register,
        builder: (context, state) => const RegisterScreen(),
      ),

      // Main navigation with shell
      ShellRoute(
        builder: (context, state, child) => MainNavigation(child: child),
        routes: [
          GoRoute(
            path: AppRoutes.home,
            pageBuilder: (context, state) => NoTransitionPage(
              child: const HomeScreen(),
            ),
          ),
          GoRoute(
            path: AppRoutes.explore,
            pageBuilder: (context, state) => NoTransitionPage(
              child: const ExploreScreen(),
            ),
          ),
          GoRoute(
            path: AppRoutes.messages,
            pageBuilder: (context, state) => NoTransitionPage(
              child: const MessagesListPage(),
            ),
          ),
          GoRoute(
            path: AppRoutes.profile,
            pageBuilder: (context, state) => NoTransitionPage(
              child: const ProfileScreen(),
            ),
          ),
        ],
      ),

      // Chat
      GoRoute(
        path: AppRoutes.chat,
        builder: (context, state) {
          final conversationId = state.pathParameters['id']!;
          return ChatPage(conversationId: conversationId);
        },
      ),

      // Notifications
      GoRoute(
        path: AppRoutes.notifications,
        builder: (context, state) => const NotificationsPage(),
      ),
      GoRoute(
        path: AppRoutes.notificationSettings,
        builder: (context, state) => const NotificationSettingsPage(),
      ),

      // Wallet
      GoRoute(
        path: AppRoutes.wallet,
        builder: (context, state) => const WalletPage(),
      ),
      GoRoute(
        path: AppRoutes.transactions,
        builder: (context, state) => const TransactionHistoryPage(),
      ),
      GoRoute(
        path: AppRoutes.topUp,
        builder: (context, state) => const TopUpPage(),
      ),
      GoRoute(
        path: AppRoutes.withdrawal,
        builder: (context, state) => const WithdrawalPage(),
      ),

      // Shopping
      GoRoute(
        path: AppRoutes.cart,
        builder: (context, state) => const CartPage(),
      ),
      GoRoute(
        path: AppRoutes.orders,
        builder: (context, state) => const OrdersPage(),
      ),
      GoRoute(
        path: AppRoutes.products,
        builder: (context, state) => const ProductListPage(),
      ),

      // Settings
      GoRoute(
        path: AppRoutes.settings,
        builder: (context, state) => const SettingsPage(),
      ),
      GoRoute(
        path: AppRoutes.privacySettings,
        builder: (context, state) => const PrivacySettingsPage(),
      ),
      GoRoute(
        path: AppRoutes.editProfile,
        builder: (context, state) => const EditProfilePage(),
      ),
      GoRoute(
        path: AppRoutes.about,
        builder: (context, state) => const AboutPage(),
      ),

      // Support
      GoRoute(
        path: AppRoutes.faq,
        builder: (context, state) => const FAQPage(),
      ),

      // Creator features
      GoRoute(
        path: AppRoutes.analytics,
        builder: (context, state) => const AnalyticsPage(),
      ),
      GoRoute(
        path: AppRoutes.scheduledPosts,
        builder: (context, state) => const ScheduledPostsPage(),
      ),
      GoRoute(
        path: AppRoutes.schedulePost,
        builder: (context, state) => const SchedulePostPage(),
      ),
      GoRoute(
        path: AppRoutes.liveSchedule,
        builder: (context, state) => const LiveSchedulePage(),
      ),

      // Profile features
      GoRoute(
        path: AppRoutes.addresses,
        builder: (context, state) => const AddressesPage(),
      ),
      GoRoute(
        path: AppRoutes.paymentMethods,
        builder: (context, state) => const PaymentMethodsPage(),
      ),
      GoRoute(
        path: AppRoutes.coupons,
        builder: (context, state) => const CouponsPage(),
      ),
      GoRoute(
        path: AppRoutes.badges,
        builder: (context, state) => const BadgesPage(),
      ),
      GoRoute(
        path: AppRoutes.coins,
        builder: (context, state) => const CoinsPage(),
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              'Page not found',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(state.uri.toString()),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.go(AppRoutes.home),
              child: const Text('Go Home'),
            ),
          ],
        ),
      ),
    ),
  );
});
