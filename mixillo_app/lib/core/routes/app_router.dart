import 'package:go_router/go_router.dart';
import '../../features/auth/screens/splash_screen.dart';
import '../../features/auth/screens/walkthrough_screen.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/register_screen.dart';
import '../../features/auth/screens/interest_selection_screen.dart';
import '../../features/auth/screens/profile_setup_screen.dart';
import '../../features/auth/screens/birthday_screen.dart';
import '../../features/auth/screens/pin_setup_screen.dart';
import '../../features/auth/screens/biometric_setup_screen.dart';
import '../../features/auth/screens/onboarding_success_screen.dart';
import '../../features/auth/screens/forgot_password_screen.dart';
import '../../features/auth/screens/verify_otp_screen.dart';
import '../../features/auth/screens/reset_password_screen.dart';
import '../../features/auth/screens/reset_success_screen.dart';
import '../../features/home/screens/main_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/profile/screens/settings_screen.dart';
import '../../features/wallet/screens/wallet_screen.dart';
import '../../features/wallet/screens/coin_purchase_screen.dart';
import '../../features/search/screens/search_screen.dart';
import '../../features/upload/screens/upload_screen.dart';
import '../../features/messages/screens/messages_screen.dart';
import '../../features/shop/screens/shop_home_screen.dart';
import '../../features/live/screens/pk_battle_screen.dart';
import '../../features/stories/screens/stories_feed_screen.dart';
//import '../../features/stories/screens/story_viewer_screen.dart';

class AppRouter {
  static final GoRouter router = GoRouter(
    initialLocation: '/splash',
    routes: [
      // Splash & Onboarding
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/walkthrough',
        builder: (context, state) => const WalkthroughScreen(),
      ),
      
      // Authentication
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      
      // Password Recovery
      GoRoute(
        path: '/auth/forgot-password',
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/auth/verify-otp',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          return VerifyOtpScreen(
            email: extra?['email'] ?? '',
            method: extra?['method'] ?? 'email',
          );
        },
      ),
      GoRoute(
        path: '/auth/reset-password',
        builder: (context, state) => const ResetPasswordScreen(),
      ),
      GoRoute(
        path: '/auth/reset-success',
        builder: (context, state) => const ResetSuccessScreen(),
      ),
      
      // Onboarding Flow
      GoRoute(
        path: '/onboarding/interests',
        builder: (context, state) => const InterestSelectionScreen(),
      ),
      GoRoute(
        path: '/onboarding/profile-setup',
        builder: (context, state) => const ProfileSetupScreen(),
      ),
      GoRoute(
        path: '/onboarding/birthday',
        builder: (context, state) => const BirthdayScreen(),
      ),
      GoRoute(
        path: '/onboarding/pin-setup',
        builder: (context, state) => const PinSetupScreen(),
      ),
      GoRoute(
        path: '/onboarding/biometric-setup',
        builder: (context, state) => const BiometricSetupScreen(),
      ),
      GoRoute(
        path: '/onboarding/success',
        builder: (context, state) => const OnboardingSuccessScreen(),
      ),
      
      // Main App
      GoRoute(
        path: '/main',
        builder: (context, state) => const MainScreen(),
      ),
      
      // Profile Routes
      GoRoute(
        path: '/profile/:userId',
        builder: (context, state) {
          final userId = state.pathParameters['userId'] ?? '';
          return ProfileScreen(userId: userId);
        },
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfileScreen(),
      ),
      GoRoute(
        path: '/settings',
        builder: (context, state) => const SettingsScreen(),
      ),
      
      // Wallet Routes
      GoRoute(
        path: '/wallet',
        builder: (context, state) => const WalletScreen(),
      ),
      GoRoute(
        path: '/wallet/purchase',
        builder: (context, state) => const CoinPurchaseScreen(),
      ),
      
      // Search Routes
      GoRoute(
        path: '/search',
        builder: (context, state) => const SearchScreen(),
      ),
      GoRoute(
        path: '/hashtag/:hashtag',
        builder: (context, state) {
          // TODO: Pass hashtag to SearchScreen when implemented
          return const SearchScreen();
        },
      ),
      
      // Upload Routes
      GoRoute(
        path: '/upload',
        builder: (context, state) => const UploadScreen(),
      ),
      
      // Messages Routes
      GoRoute(
        path: '/messages',
        builder: (context, state) => const MessagesScreen(),
      ),
      
      // Shop Routes
      GoRoute(
        path: '/shop',
        builder: (context, state) => const ShopHomeScreen(),
      ),
      
      // Live Streaming & PK Battle Routes
      GoRoute(
        path: '/pk-battle/:battleId',
        builder: (context, state) {
          final battleId = state.pathParameters['battleId'] ?? '';
          final isHost = state.uri.queryParameters['isHost'] == 'true';
          return PKBattleScreen(
            battleId: battleId,
            isHost: isHost,
          );
        },
      ),
      
      // Stories Routes
      GoRoute(
        path: '/stories',
        builder: (context, state) => const StoriesFeedScreen(),
      ),
    ],
  );
}
