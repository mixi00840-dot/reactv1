import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/routing/router.dart';
import 'core/providers/theme_provider.dart';
import 'core/providers/language_provider.dart';

class App extends ConsumerWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final themeMode = ref.watch(themeModeProvider);
    final lightTheme = ref.watch(lightThemeProvider);
    final darkTheme = ref.watch(darkThemeProvider);
    final locale = ref.watch(languageProvider);

    return MaterialApp.router(
      title: 'Mixillo',
      debugShowCheckedModeBanner: false,

      // Theme
      theme: lightTheme,
      darkTheme: darkTheme,
      themeMode: themeMode,

      // Localization
      locale: locale,
      supportedLocales: const [
        Locale('en'),
        Locale('es'),
        Locale('fr'),
        Locale('de'),
        Locale('zh'),
        Locale('ja'),
        Locale('ko'),
        Locale('ar'),
        Locale('hi'),
        Locale('pt'),
      ],

      // Routing
      routerConfig: router,
    );
  }
}
