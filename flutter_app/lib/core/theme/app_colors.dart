import 'package:flutter/material.dart';

/// Unified purple e-commerce theme with pink accents for video features
class AppColors {
  // Primary Colors (Purple E-commerce Theme)
  static const Color primary = Color(0xFF7B61FF);        // Main Purple
  static const Color primaryDark = Color(0xFF684FFF);    // Dark Purple
  static const Color primaryLight = Color(0xFF9581FF);   // Light Purple
  
  // E-commerce Accent Colors
  static const Color accent = Color(0xFFEA5B5B);         // Red accent for discounts
  static const Color accentDark = Color(0xFFD43F3F);
  static const Color accentLight = Color(0xFFF07777);
  
  // Video/Camera Feature Colors (TikTok-style)
  static const Color videoAccent = Color(0xFFFF006B);    // Pink for camera/video
  static const Color cameraButton = Color(0xFFFF006B);
  static const Color liveIndicator = Color(0xFFFF3B30);
  static const Color liveRed = Color(0xFFFF3B30);        // Live streaming red
  
  // Blue Colors (for gradients and UI accents)
  static const Color lightBlue = Color(0xFF4DB8FF);      // Light Blue
  static const Color electricBlue = Color(0xFF0080FF);   // Electric Blue
  static const Color softSkyBlue = Color(0xFF87CEEB);    // Soft Sky Blue
  
  // Status Colors (E-commerce Standard)
  static const Color successGreen = Color(0xFF2ED573);   // Order success, in stock
  static const Color warningYellow = Color(0xFFFFBE21);  // Low stock, pending
  static const Color errorRed = Color(0xFFEA5B5B);       // Out of stock, error
  
  // Dark Theme (Shop & App)
  static const Color background = Color(0xFF000000);
  static const Color backgroundDark = Color(0xFF16161E);      // Deeper black
  static const Color backgroundLight = Color(0xFF1A1A1A);
  static const Color surface = Color(0xFF1E1E1E);
  static const Color surfaceDark = Color(0xFF16161E);
  static const Color surfaceLight = Color(0xFF2A2A2A);
  
  // Light Theme Colors (for shop sections if needed)
  static const Color white = Color(0xFFFFFFFF);
  static const Color softWhite = Color(0xFFF8F8F9);
  static const Color lightGrey = Color(0xFFE5E8EC);
  static const Color darkGrey = Color(0xFF16161E);
  
  // Grayscale System (UI Kit Standard)
  static const Color black = Color(0xFF16161E);
  static const Color black80 = Color(0xFF45454B);
  static const Color black60 = Color(0xFF737378);
  static const Color black40 = Color(0xFFA2A2A5);
  static const Color black20 = Color(0xFFD0D0D2);
  static const Color black10 = Color(0xFFE8E8E9);
  static const Color black5 = Color(0xFFF3F3F4);
  
  static const Color white80 = Color(0xFFCCCCCC);
  static const Color white60 = Color(0xFF999999);
  static const Color white40 = Color(0xFF666666);
  static const Color white20 = Color(0xFF333333);
  
  static const Color grey = Color(0xFFB8B5C3);
  static const Color lightGreyShop = Color(0xFFF8F8F9);
  static const Color darkGreyShop = Color(0xFF1C1C25);
  
  // Text Colors
  static const Color textPrimary = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0xFFB0B0B0);
  static const Color textTertiary = Color(0xFF707070);
  static const Color textDisabled = Color(0xFF404040);
  
  // Status Colors
  static const Color error = Color(0xFFEA5B5B);
  static const Color success = Color(0xFF2ED573);
  static const Color warning = Color(0xFFFFBE21);
  static const Color info = Color(0xFF7B61FF);
  
  // Social Colors (Purple for engagement, pink for video features)
  static const Color like = Color(0xFFFF3B30);               // Keep red for likes
  static const Color comment = Color(0xFF7B61FF);            // Purple for comments
  static const Color share = Color(0xFF7B61FF);              // Purple for shares
  static const Color live = Color(0xFFFF3B30);               // Keep red for live
  static const Color save = Color(0xFFFFBE21);               // Yellow for bookmarks
  
  // Glass Colors (Purple tint)
  static const Color glassLight = Color(0x1AFFFFFF);
  static const Color glassMedium = Color(0x33FFFFFF);
  static const Color glassDark = Color(0x0DFFFFFF);
  static const Color glassPrimary = Color(0x207B61FF);       // Purple glass overlay
  
  // Overlay Colors
  static const Color overlay = Color(0x80000000);
  static const Color overlayLight = Color(0x40000000);
  static const Color overlayDark = Color(0xB3000000);
  static const Color overlayPrimary = Color(0xCC16161E);     // Dark overlay with purple hint
  
  // Border Colors
  static const Color border = Color(0xFF2A2A2A);
  static const Color borderLight = Color(0xFF404040);
  static const Color borderDark = Color(0xFF1A1A1A);
  static const Color borderPrimary = Color(0xFF7B61FF);      // Purple accent borders
  
  // Shimmer Colors (Loading states)
  static const Color shimmerBase = Color(0xFF1E1E1E);
  static const Color shimmerHighlight = Color(0xFF2A2A2A);
  static const Color shimmerPrimary = Color(0x407B61FF);     // Purple shimmer effect
  
  AppColors._();
}
