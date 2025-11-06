import 'package:flutter/material.dart';

/// Enhanced App Color Palette - Premium TikTok/Instagram Level
/// Matches UI folder design assets
class AppColors {
  // ========== PRIMARY BRAND COLORS ==========
  static const Color primary = Color(0xFF6C5CE7);  // Vibrant Purple
  static const Color primaryDark = Color(0xFF5D4DD9);
  static const Color primaryLight = Color(0xFF8B7DE8);
  static const Color primaryVariant = Color(0xFF4A3BC8);
  
  // ========== SECONDARY COLORS ==========
  static const Color secondary = Color(0xFFFF6B9D);  // Pink
  static const Color secondaryDark = Color(0xFFE55A8A);
  static const Color secondaryLight = Color(0xFFFF8DB4);
  
  // ========== ACCENT COLORS ==========
  static const Color accent = Color(0xFF00D4FF);  // Cyan
  static const Color accentDark = Color(0xFF00B8E6);
  static const Color accentLight = Color(0xFF33DDFF);
  
  // ========== STATUS COLORS ==========
  static const Color success = Color(0xFF00D68F);
  static const Color successLight = Color(0xFF33E0A5);
  static const Color successDark = Color(0xFF00B877);
  
  static const Color warning = Color(0xFFFFAA00);
  static const Color warningLight = Color(0xFFFFBB33);
  static const Color warningDark = Color(0xFFE69900);
  
  static const Color error = Color(0xFFFF3D71);
  static const Color errorLight = Color(0xFFFF5C8D);
  static const Color errorDark = Color(0xFFE62D5F);
  
  static const Color info = Color(0xFF0095FF);
  static const Color infoLight = Color(0xFF33AAFF);
  static const Color infoDark = Color(0xFF0077CC);
  
  // ========== LIGHT THEME COLORS ==========
  static const Color lightBackground = Color(0xFFFFFFFF);
  static const Color lightBackgroundSecondary = Color(0xFFFAFAFA);
  static const Color lightSurface = Color(0xFFF8F9FA);
  static const Color lightSurfaceVariant = Color(0xFFF0F1F2);
  static const Color lightCard = Color(0xFFFFFFFF);
  static const Color lightCardElevated = Color(0xFFFFFFFF);
  
  static const Color lightText = Color(0xFF1A1A1A);
  static const Color lightTextPrimary = Color(0xFF000000);
  static const Color lightTextSecondary = Color(0xFF6B7280);
  static const Color lightTextTertiary = Color(0xFF9CA3AF);
  static const Color lightTextDisabled = Color(0xFFD1D5DB);
  
  static const Color lightBorder = Color(0xFFE5E7EB);
  static const Color lightBorderLight = Color(0xFFF3F4F6);
  static const Color lightDivider = Color(0xFFEEEEEE);
  static const Color lightOverlay = Color(0x80000000);
  
  // ========== DARK THEME COLORS ==========
  static const Color darkBackground = Color(0xFF000000);  // Pure black like TikTok
  static const Color darkBackgroundSecondary = Color(0xFF0F0F0F);
  static const Color darkSurface = Color(0xFF1A1A1A);
  static const Color darkSurfaceVariant = Color(0xFF262626);
  static const Color darkCard = Color(0xFF1F1F1F);
  static const Color darkCardElevated = Color(0xFF2A2A2A);
  
  static const Color darkText = Color(0xFFFFFFFF);
  static const Color darkTextPrimary = Color(0xFFFFFFFF);
  static const Color darkTextSecondary = Color(0xFF9CA3AF);
  static const Color darkTextTertiary = Color(0xFF6B7280);
  static const Color darkTextDisabled = Color(0xFF4B5563);
  
  static const Color darkBorder = Color(0xFF333333);
  static const Color darkBorderLight = Color(0xFF2A2A2A);
  static const Color darkDivider = Color(0xFF2A2A2A);
  static const Color darkOverlay = Color(0x80000000);
  
  // ========== GRADIENT COLORS ==========
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
  
  static const LinearGradient accentGradient = LinearGradient(
    colors: [Color(0xFF00D4FF), Color(0xFF33DDFF)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient successGradient = LinearGradient(
    colors: [Color(0xFF00D68F), Color(0xFF33E0A5)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  // TikTok-style gradient (black to transparent)
  static const LinearGradient videoOverlayGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [
      Color(0x00000000),
      Color(0x80000000),
      Color(0xFF000000),
    ],
  );
  
  // Instagram-style gradient
  static const LinearGradient instagramGradient = LinearGradient(
    colors: [
      Color(0xFF833AB4),
      Color(0xFFFD1D1D),
      Color(0xFFFCB045),
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  // ========== SOCIAL ACTION COLORS ==========
  static const Color like = Color(0xFFFF3B5C);  // TikTok red
  static const Color likeActive = Color(0xFFFF1744);
  static const Color comment = Color(0xFF00D68F);
  static const Color share = Color(0xFF0095FF);
  static const Color bookmark = Color(0xFFFFAA00);
  static const Color follow = Color(0xFF6C5CE7);
  static const Color repost = Color(0xFF00D4FF);
  
  // ========== SHIMMER COLORS ==========
  static const Color shimmerBaseLight = Color(0xFFE0E0E0);
  static const Color shimmerHighlightLight = Color(0xFFF5F5F5);
  static const Color shimmerBaseDark = Color(0xFF2A2A2A);
  static const Color shimmerHighlightDark = Color(0xFF3A3A3A);
  
  // ========== ELEVATION/SHADOW COLORS ==========
  static const Color shadowLight = Color(0x1A000000);
  static const Color shadowMedium = Color(0x33000000);
  static const Color shadowDark = Color(0x4D000000);
  
  // ========== INTERACTIVE COLORS ==========
  static const Color interactive = Color(0xFF6C5CE7);
  static const Color interactiveHover = Color(0xFF5D4DD9);
  static const Color interactivePressed = Color(0xFF4A3BC8);
  static const Color interactiveDisabled = Color(0xFFD1D5DB);
  
  // ========== SPECIAL PURPOSE COLORS ==========
  static const Color liveIndicator = Color(0xFFFF3B5C);
  static const Color verifiedBadge = Color(0xFF0095FF);
  static const Color trendingBadge = Color(0xFFFFAA00);
  static const Color newBadge = Color(0xFF00D68F);
  
  // ========== VIDEO PLAYER COLORS ==========
  static const Color videoControls = Color(0xFFFFFFFF);
  static const Color videoControlsBackground = Color(0x80000000);
  static const Color videoProgress = Color(0xFFFFFFFF);
  static const Color videoProgressBackground = Color(0x40FFFFFF);
  
  // ========== PK BATTLE COLORS ==========
  static const Color pkHost1 = Color(0xFFFF3B5C);
  static const Color pkHost2 = Color(0xFF0095FF);
  static const Color pkNeutral = Color(0xFF6B7280);
  
  // ========== GIFT COLORS (by rarity) ==========
  static const Color giftCommon = Color(0xFF9CA3AF);
  static const Color giftRare = Color(0xFF0095FF);
  static const Color giftEpic = Color(0xFF6C5CE7);
  static const Color giftLegendary = Color(0xFFFFAA00);
  static const Color giftMythic = Color(0xFFFF3B5C);
  
  // ========== WALLET COLORS ==========
  static const Color walletBalance = Color(0xFF00D68F);
  static const Color walletCoins = Color(0xFFFFAA00);
  static const Color walletTransaction = Color(0xFF0095FF);
  
  // ========== SHOP COLORS ==========
  static const Color shopPrimary = Color(0xFF6C5CE7);
  static const Color shopSecondary = Color(0xFFFF6B9D);
  static const Color shopDiscount = Color(0xFFFF3B5C);
  static const Color shopRating = Color(0xFFFFAA00);
  
  // ========== UTILITY METHODS ==========
  
  /// Get text color based on background brightness
  static Color getTextColorForBackground(Color backgroundColor) {
    final luminance = backgroundColor.computeLuminance();
    return luminance > 0.5 ? lightText : darkText;
  }
  
  /// Get surface color based on theme
  static Color getSurfaceColor(BuildContext context) {
    return Theme.of(context).brightness == Brightness.dark
        ? darkSurface
        : lightSurface;
  }
  
  /// Get text color based on theme
  static Color getTextColor(BuildContext context) {
    return Theme.of(context).brightness == Brightness.dark
        ? darkText
        : lightText;
  }
  
  /// Get secondary text color based on theme
  static Color getSecondaryTextColor(BuildContext context) {
    return Theme.of(context).brightness == Brightness.dark
        ? darkTextSecondary
        : lightTextSecondary;
  }
  
  /// Get border color based on theme
  static Color getBorderColor(BuildContext context) {
    return Theme.of(context).brightness == Brightness.dark
        ? darkBorder
        : lightBorder;
  }
  
  /// Get card color based on theme
  static Color getCardColor(BuildContext context) {
    return Theme.of(context).brightness == Brightness.dark
        ? darkCard
        : lightCard;
  }
}
