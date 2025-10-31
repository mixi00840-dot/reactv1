import 'package:flutter/material.dart';

/// App color palette based on Mixillo UI Kit
class AppColors {
  // Primary Brand Colors
  static const Color primary = Color(0xFF6C5CE7);  // Purple
  static const Color primaryDark = Color(0xFF5D4DD9);
  static const Color primaryLight = Color(0xFF8B7DE8);
  
  // Secondary Colors
  static const Color secondary = Color(0xFFFF6B9D);  // Pink
  static const Color accent = Color(0xFF00D4FF);  // Cyan
  
  // Success, Warning, Error
  static const Color success = Color(0xFF00D68F);
  static const Color warning = Color(0xFFFFAA00);
  static const Color error = Color(0xFFFF3D71);
  static const Color info = Color(0xFF0095FF);
  
  // Neutral Colors - Light Theme
  static const Color lightBackground = Color(0xFFFFFFFF);
  static const Color lightSurface = Color(0xFFF8F9FA);
  static const Color lightCard = Color(0xFFFFFFFF);
  static const Color lightText = Color(0xFF1A1A1A);
  static const Color lightTextSecondary = Color(0xFF6B7280);
  static const Color lightBorder = Color(0xFFE5E7EB);
  static const Color lightDivider = Color(0xFFEEEEEE);
  
  // Neutral Colors - Dark Theme
  static const Color darkBackground = Color(0xFF0F0F0F);
  static const Color darkSurface = Color(0xFF1A1A1A);
  static const Color darkCard = Color(0xFF262626);
  static const Color darkText = Color(0xFFFFFFFF);
  static const Color darkTextSecondary = Color(0xFF9CA3AF);
  static const Color darkBorder = Color(0xFF333333);
  static const Color darkDivider = Color(0xFF2A2A2A);
  
  // Gradient Colors
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF6C5CE7), Color(0xFF8B7DE8)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient secondaryGradient = LinearGradient(
    colors: [Color(0xFFFF6B9D), Color(0xFFFF8DB4)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  // Social Action Colors
  static const Color like = Color(0xFFFF3B5C);
  static const Color comment = Color(0xFF00D68F);
  static const Color share = Color(0xFF0095FF);
  static const Color bookmark = Color(0xFFFFAA00);
  
  // Shimmer Colors - Light
  static const Color shimmerBaseLight = Color(0xFFE0E0E0);
  static const Color shimmerHighlightLight = Color(0xFFF5F5F5);
  
  // Shimmer Colors - Dark
  static const Color shimmerBaseDark = Color(0xFF2A2A2A);
  static const Color shimmerHighlightDark = Color(0xFF3A3A3A);
}
