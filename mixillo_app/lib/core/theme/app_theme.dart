import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

class AppTheme {
  // Light Theme
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      primaryColor: AppColors.primary,
      scaffoldBackgroundColor: AppColors.lightBackground,
      
      // Color Scheme
      colorScheme: const ColorScheme.light(
        primary: AppColors.primary,
        secondary: AppColors.secondary,
        surface: AppColors.lightSurface,
        background: AppColors.lightBackground,
        error: AppColors.error,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: AppColors.lightText,
        onBackground: AppColors.lightText,
        onError: Colors.white,
      ),
      
      // Text Theme
      textTheme: GoogleFonts.poppinsTextTheme().copyWith(
        displayLarge: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: AppColors.lightText),
        displayMedium: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.lightText),
        displaySmall: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.lightText),
        headlineLarge: const TextStyle(fontSize: 22, fontWeight: FontWeight.w600, color: AppColors.lightText),
        headlineMedium: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: AppColors.lightText),
        headlineSmall: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: AppColors.lightText),
        titleLarge: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.lightText),
        titleMedium: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.lightText),
        titleSmall: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.lightText),
        bodyLarge: const TextStyle(fontSize: 16, color: AppColors.lightText),
        bodyMedium: const TextStyle(fontSize: 14, color: AppColors.lightText),
        bodySmall: const TextStyle(fontSize: 12, color: AppColors.lightTextSecondary),
        labelLarge: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.lightText),
        labelMedium: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.lightTextSecondary),
        labelSmall: const TextStyle(fontSize: 10, fontWeight: FontWeight.w500, color: AppColors.lightTextSecondary),
      ),
      
      // App Bar Theme
      appBarTheme: const AppBarTheme(
        elevation: 0,
        centerTitle: true,
        backgroundColor: AppColors.lightBackground,
        foregroundColor: AppColors.lightText,
        iconTheme: IconThemeData(color: AppColors.lightText),
      ),
      
      // Bottom Navigation Bar Theme
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.lightBackground,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.lightTextSecondary,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
      
      // Card Theme
      cardTheme: CardThemeData(
        color: AppColors.lightCard,
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      
      // Input Decoration Theme
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.lightSurface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.lightBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.lightBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.error),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
      
      // Elevated Button Theme
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ),
      
      // Text Button Theme
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primary,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
        ),
      ),
      
      // Icon Theme
      iconTheme: const IconThemeData(color: AppColors.lightText),
      
      // Divider Theme
      dividerTheme: const DividerThemeData(
        color: AppColors.lightDivider,
        thickness: 1,
      ),
    );
  }
  
  // Dark Theme
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      primaryColor: AppColors.primary,
      scaffoldBackgroundColor: AppColors.darkBackground,
      
      // Color Scheme
      colorScheme: const ColorScheme.dark(
        primary: AppColors.primary,
        secondary: AppColors.secondary,
        surface: AppColors.darkSurface,
        background: AppColors.darkBackground,
        error: AppColors.error,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: AppColors.darkText,
        onBackground: AppColors.darkText,
        onError: Colors.white,
      ),
      
      // Text Theme
      textTheme: GoogleFonts.poppinsTextTheme().copyWith(
        displayLarge: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: AppColors.darkText),
        displayMedium: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.darkText),
        displaySmall: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.darkText),
        headlineLarge: const TextStyle(fontSize: 22, fontWeight: FontWeight.w600, color: AppColors.darkText),
        headlineMedium: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: AppColors.darkText),
        headlineSmall: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: AppColors.darkText),
        titleLarge: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.darkText),
        titleMedium: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.darkText),
        titleSmall: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.darkText),
        bodyLarge: const TextStyle(fontSize: 16, color: AppColors.darkText),
        bodyMedium: const TextStyle(fontSize: 14, color: AppColors.darkText),
        bodySmall: const TextStyle(fontSize: 12, color: AppColors.darkTextSecondary),
        labelLarge: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.darkText),
        labelMedium: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.darkTextSecondary),
        labelSmall: const TextStyle(fontSize: 10, fontWeight: FontWeight.w500, color: AppColors.darkTextSecondary),
      ),
      
      // App Bar Theme
      appBarTheme: const AppBarTheme(
        elevation: 0,
        centerTitle: true,
        backgroundColor: AppColors.darkBackground,
        foregroundColor: AppColors.darkText,
        iconTheme: IconThemeData(color: AppColors.darkText),
      ),
      
      // Bottom Navigation Bar Theme
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.darkBackground,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.darkTextSecondary,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
      
      // Card Theme
      cardTheme: CardThemeData(
        color: AppColors.darkCard,
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      
      // Input Decoration Theme
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.darkSurface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.darkBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.darkBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.error),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
      
      // Elevated Button Theme
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ),
      
      // Text Button Theme
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primary,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
        ),
      ),
      
      // Icon Theme
      iconTheme: const IconThemeData(color: AppColors.darkText),
      
      // Divider Theme
      dividerTheme: const DividerThemeData(
        color: AppColors.darkDivider,
        thickness: 1,
      ),
    );
  }
}
