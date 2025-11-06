import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:firebase_core/firebase_core.dart';
import 'core/theme/app_theme.dart';
import 'core/routes/app_router.dart';
import 'core/services/api_service.dart';
import 'data/services/storage_service.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/feed/providers/feed_provider.dart';
import 'features/wallet/providers/wallet_provider.dart';
import 'features/live/providers/live_streaming_provider.dart';
import 'features/live/providers/pk_battle_provider.dart';
import 'features/gifts/providers/gifts_provider.dart';
import 'features/shop/services/cart_service.dart';
import 'features/shop/providers/seller_provider.dart';
import 'features/shop/providers/store_provider.dart';
import 'features/shop/providers/products_provider.dart';
import 'features/stories/providers/stories_provider.dart';
import 'features/search/providers/search_provider.dart';
import 'features/profile/providers/profile_provider.dart';
import 'features/upload/providers/camera_provider.dart';
import 'features/upload/providers/sound_provider.dart';
import 'features/live/widgets/streaming_provider_refresh_handler.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase
  await Firebase.initializeApp();
  
  // Load environment variables
  try {
    await dotenv.load(fileName: ".env");
  } catch (e) {
    print('Warning: .env file not found. Using defaults.');
  }
  
  // Initialize storage
  await StorageService.init();
  
  // Initialize API service
  await ApiService().initialize();
  
  // Set preferred orientations
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  
  // Set system UI overlay style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );
  
  runApp(const MixilloApp());
}

class MixilloApp extends StatelessWidget {
  const MixilloApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => FeedProvider()),
        ChangeNotifierProvider(create: (_) => WalletProvider()),
        ChangeNotifierProvider(create: (_) => LiveStreamingProvider()),
        ChangeNotifierProvider(create: (_) => PKBattleProvider()),
        ChangeNotifierProvider(create: (_) => GiftsProvider()),
        ChangeNotifierProvider(create: (_) => SellerProvider()),
        ChangeNotifierProvider(create: (_) => StoreProvider()),
        ChangeNotifierProvider(create: (_) => ProductsProvider()),
        ChangeNotifierProvider(create: (_) => StoriesProvider()),
        ChangeNotifierProvider(create: (_) => SearchProvider()),
        ChangeNotifierProvider(create: (_) => ProfileProvider()),
        ChangeNotifierProvider(create: (_) => CameraProvider()),
        ChangeNotifierProvider(create: (_) => SoundProvider()),
        ChangeNotifierProvider(create: (_) => CartService()),
        // Add more providers here as we build features
      ],
      child: StreamingProviderRefreshHandler(
        child: Consumer<AuthProvider>(
          builder: (context, authProvider, _) {
            // Initialize streaming provider on app start
            WidgetsBinding.instance.addPostFrameCallback((_) {
              context.read<LiveStreamingProvider>().initialize();
            });
            
            return MaterialApp.router(
              title: 'Mixillo',
              debugShowCheckedModeBanner: false,
              theme: AppTheme.lightTheme,
              darkTheme: AppTheme.darkTheme,
              themeMode: ThemeMode.system, // TODO: Add user preference
              routerConfig: AppRouter.router,
            );
          },
        ),
      ),
    );
  }
}
