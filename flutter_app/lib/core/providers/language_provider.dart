import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

// Language provider
final languageProvider = StateNotifierProvider<LanguageNotifier, Locale>((ref) {
  return LanguageNotifier();
});

class LanguageNotifier extends StateNotifier<Locale> {
  static const String _key = 'language_code';

  LanguageNotifier() : super(const Locale('en')) {
    _loadLanguage();
  }

  Future<void> _loadLanguage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final languageCode = prefs.getString(_key);

      if (languageCode != null) {
        state = Locale(languageCode);
      }
    } catch (e) {
      // Use default if loading fails
    }
  }

  Future<void> setLanguage(String languageCode) async {
    state = Locale(languageCode);
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_key, languageCode);
    } catch (e) {
      // Handle error
    }
  }
}

// Supported languages provider
final supportedLanguagesProvider = Provider<List<LanguageOption>>((ref) {
  return [
    LanguageOption(code: 'en', name: 'English', nativeName: 'English'),
    LanguageOption(code: 'es', name: 'Spanish', nativeName: 'Español'),
    LanguageOption(code: 'fr', name: 'French', nativeName: 'Français'),
    LanguageOption(code: 'de', name: 'German', nativeName: 'Deutsch'),
    LanguageOption(code: 'zh', name: 'Chinese', nativeName: '中文'),
    LanguageOption(code: 'ja', name: 'Japanese', nativeName: '日本語'),
    LanguageOption(code: 'ko', name: 'Korean', nativeName: '한국어'),
    LanguageOption(code: 'ar', name: 'Arabic', nativeName: 'العربية'),
    LanguageOption(code: 'hi', name: 'Hindi', nativeName: 'हिन्दी'),
    LanguageOption(code: 'pt', name: 'Portuguese', nativeName: 'Português'),
  ];
});

class LanguageOption {
  final String code;
  final String name;
  final String nativeName;

  LanguageOption({
    required this.code,
    required this.name,
    required this.nativeName,
  });
}
