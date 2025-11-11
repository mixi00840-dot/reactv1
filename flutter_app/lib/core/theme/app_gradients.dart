import 'package:flutter/material.dart';
import 'app_colors.dart';

/// Clean blue gradients for professional UI
class AppGradients {
  // Primary Gradients (Blue only)
  static const LinearGradient primary = LinearGradient(
    colors: [AppColors.lightBlue, AppColors.electricBlue],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient primaryHorizontal = LinearGradient(
    colors: [AppColors.lightBlue, AppColors.electricBlue],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );
  
  static const LinearGradient primaryVertical = LinearGradient(
    colors: [AppColors.lightBlue, AppColors.electricBlue],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );
  
  // Accent Gradients (Blue variations)
  static const LinearGradient accent = LinearGradient(
    colors: [AppColors.softSkyBlue, AppColors.lightBlue],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient accentReverse = LinearGradient(
    colors: [AppColors.lightBlue, AppColors.softSkyBlue],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  // Soft Blue Gradient
  static const LinearGradient softBlue = LinearGradient(
    colors: [
      AppColors.softSkyBlue,
      AppColors.lightBlue,
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient blueGlow = LinearGradient(
    colors: [AppColors.lightBlue, AppColors.electricBlue],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient blueVertical = LinearGradient(
    colors: [AppColors.softSkyBlue, AppColors.electricBlue],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );
  
  static const LinearGradient blueHorizontal = LinearGradient(
    colors: [AppColors.softSkyBlue, AppColors.electricBlue],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );
  
  // Background Gradients
  static const LinearGradient backgroundDark = LinearGradient(
    colors: [AppColors.backgroundDark, AppColors.background],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );
  
  static const LinearGradient backgroundLight = LinearGradient(
    colors: [AppColors.background, AppColors.backgroundLight],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );
  
  // Glass Gradients
  static const LinearGradient glassLight = LinearGradient(
    colors: [AppColors.glassLight, AppColors.glassDark],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient glassMedium = LinearGradient(
    colors: [AppColors.glassMedium, AppColors.glassLight],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  // Overlay Gradients
  static const LinearGradient overlayTop = LinearGradient(
    colors: [AppColors.overlayDark, Colors.transparent],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    stops: [0.0, 0.3],
  );
  
  static const LinearGradient overlayBottom = LinearGradient(
    colors: [Colors.transparent, AppColors.overlayDark],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    stops: [0.7, 1.0],
  );
  
  static const LinearGradient overlayFull = LinearGradient(
    colors: [
      AppColors.overlayDark,
      Colors.transparent,
      Colors.transparent,
      AppColors.overlayDark,
    ],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    stops: [0.0, 0.3, 0.7, 1.0],
  );
  
  // Status Gradients
  static const LinearGradient success = LinearGradient(
    colors: [AppColors.successGreen, Color(0xFF30D158)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient error = LinearGradient(
    colors: [AppColors.error, Color(0xFFCC0000)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient warning = LinearGradient(
    colors: [AppColors.warningYellow, Color(0xFFFFAA00)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  // Shimmer Gradient
  static const LinearGradient shimmer = LinearGradient(
    colors: [
      AppColors.shimmerBase,
      AppColors.shimmerHighlight,
      AppColors.shimmerBase,
    ],
    stops: [0.1, 0.3, 0.4],
    begin: Alignment(-1.0, -0.3),
    end: Alignment(1.0, 0.3),
  );
  
  // Live Streaming Gradients (Blue-based)
  static const LinearGradient liveBackground = LinearGradient(
    colors: [
      Color(0xFF001A33),
      Color(0xFF000D1A),
      AppColors.background,
    ],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );
  
  static const LinearGradient pkBattle = LinearGradient(
    colors: [
      AppColors.lightBlue,
      AppColors.electricBlue,
      AppColors.softSkyBlue,
    ],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );
  
  AppGradients._();
}
