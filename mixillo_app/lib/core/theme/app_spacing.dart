import 'package:flutter/material.dart';

/// Spacing System - Consistent spacing throughout the app
/// Based on 8px grid system (industry standard)
class AppSpacing {
  // Base unit: 8px
  static const double base = 8.0;
  
  // Spacing scale
  static const double xs = 4.0;   // 0.5x base
  static const double sm = 8.0;   // 1x base
  static const double md = 16.0;   // 2x base
  static const double lg = 24.0;   // 3x base
  static const double xl = 32.0;   // 4x base
  static const double xxl = 48.0;  // 6x base
  static const double xxxl = 64.0; // 8x base
  
  // Specific spacing
  static const double screenPadding = 16.0;
  static const double cardPadding = 16.0;
  static const double buttonPadding = 16.0;
  static const double inputPadding = 16.0;
  static const double listItemSpacing = 12.0;
  static const double sectionSpacing = 24.0;
  
  // Border radius
  static const double radiusXs = 4.0;
  static const double radiusSm = 8.0;
  static const double radiusMd = 12.0;
  static const double radiusLg = 16.0;
  static const double radiusXl = 24.0;
  static const double radiusRound = 999.0; // Fully rounded
  
  // Icon sizes
  static const double iconXs = 16.0;
  static const double iconSm = 20.0;
  static const double iconMd = 24.0;
  static const double iconLg = 32.0;
  static const double iconXl = 48.0;
  
  // Avatar sizes
  static const double avatarXs = 24.0;
  static const double avatarSm = 32.0;
  static const double avatarMd = 48.0;
  static const double avatarLg = 64.0;
  static const double avatarXl = 96.0;
  
  // Button heights
  static const double buttonHeightSm = 36.0;
  static const double buttonHeightMd = 48.0;
  static const double buttonHeightLg = 56.0;
  
  // Input heights
  static const double inputHeightSm = 40.0;
  static const double inputHeightMd = 48.0;
  static const double inputHeightLg = 56.0;
  
  // App bar
  static const double appBarHeight = 56.0;
  static const double appBarElevation = 0.0;
  
  // Bottom navigation
  static const double bottomNavHeight = 60.0;
  static const double bottomNavIconSize = 24.0;
  
  // Video player
  static const double videoControlsHeight = 60.0;
  static const double videoProgressHeight = 4.0;
  
  // Card
  static const double cardElevation = 0.0;
  static const double cardElevationHover = 4.0;
  
  // Divider
  static const double dividerHeight = 1.0;
  static const double dividerThickness = 0.5;
  
  // Helper methods
  static EdgeInsets symmetric({double? horizontal, double? vertical}) {
    return EdgeInsets.symmetric(
      horizontal: horizontal ?? 0,
      vertical: vertical ?? 0,
    );
  }
  
  static EdgeInsets all(double value) {
    return EdgeInsets.all(value);
  }
  
  static EdgeInsets only({
    double? top,
    double? bottom,
    double? left,
    double? right,
  }) {
    return EdgeInsets.only(
      top: top ?? 0,
      bottom: bottom ?? 0,
      left: left ?? 0,
      right: right ?? 0,
    );
  }
  
  static EdgeInsets screenPaddingInsets() {
    return const EdgeInsets.all(screenPadding);
  }
  
  static EdgeInsets cardPaddingInsets() {
    return const EdgeInsets.all(cardPadding);
  }
  
  static BorderRadius borderRadius(double radius) {
    return BorderRadius.circular(radius);
  }
  
  static BorderRadius borderRadiusTop(double radius) {
    return BorderRadius.only(
      topLeft: Radius.circular(radius),
      topRight: Radius.circular(radius),
    );
  }
  
  static BorderRadius borderRadiusBottom(double radius) {
    return BorderRadius.only(
      bottomLeft: Radius.circular(radius),
      bottomRight: Radius.circular(radius),
    );
  }
}

