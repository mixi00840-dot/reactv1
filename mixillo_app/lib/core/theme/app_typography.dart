import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'design_tokens.dart';

/// Typography System - Premium font system matching TikTok/Instagram quality
/// Now powered by DesignTokens for consistency across the entire app
class AppTypography {
  // Font families (from DesignTokens)
  static String get primaryFont => DesignTokens.primaryFont;
  static String get secondaryFont => DesignTokens.secondaryFont;
  static String get displayFont => DesignTokens.displayFont;
  
  // Font weights (from DesignTokens)
  static const FontWeight light = DesignTokens.fontWeightLight;
  static const FontWeight regular = DesignTokens.fontWeightRegular;
  static const FontWeight medium = DesignTokens.fontWeightMedium;
  static const FontWeight semiBold = DesignTokens.fontWeightSemiBold;
  static const FontWeight bold = DesignTokens.fontWeightBold;
  static const FontWeight extraBold = DesignTokens.fontWeightExtraBold;
  static const FontWeight black = DesignTokens.fontWeightBlack;
  
  // ========== HELPER METHODS ==========
  
  /// Get text color based on theme brightness
  static Color getTextColor(BuildContext context, {bool secondary = false}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    if (secondary) {
      return isDark ? DesignTokens.darkTextSecondary : DesignTokens.lightTextSecondary;
    }
    return isDark ? DesignTokens.darkTextPrimary : DesignTokens.lightTextPrimary;
  }
  
  /// Get text color for specific backgrounds
  static Color getContrastColor(Color backgroundColor) {
    final luminance = backgroundColor.computeLuminance();
    return luminance > 0.5 ? DesignTokens.lightTextPrimary : DesignTokens.darkTextPrimary;
  }
  
  // ========== DISPLAY TEXT (48-32px - Hero sections, Splash screens) ==========
  
  static TextStyle displayLarge(BuildContext context, {Color? color}) {
    return GoogleFonts.getFont(
      displayFont,
      fontSize: DesignTokens.fontSize6xl,
      fontWeight: DesignTokens.fontWeightBlack,
      letterSpacing: DesignTokens.letterSpacingTight,
      height: DesignTokens.lineHeightTight,
      color: color ?? getTextColor(context),
    );
  }
  
  static TextStyle displayMedium(BuildContext context, {Color? color}) {
    return GoogleFonts.getFont(
      displayFont,
      fontSize: DesignTokens.fontSize5xl,
      fontWeight: DesignTokens.fontWeightBlack,
      letterSpacing: DesignTokens.letterSpacingTight,
      height: DesignTokens.lineHeightTight,
      color: color ?? getTextColor(context),
    );
  }
  
  static TextStyle displaySmall(BuildContext context, {Color? color}) {
    return GoogleFonts.getFont(
      displayFont,
      fontSize: DesignTokens.fontSize4xl,
      fontWeight: DesignTokens.fontWeightBold,
      letterSpacing: DesignTokens.letterSpacingTight,
      height: DesignTokens.lineHeightNormal,
      color: color ?? getTextColor(context),
    );
  }
  
  // ========== HEADLINE TEXT (28-20px - Page titles, Section headers) ==========
  
  static TextStyle h1(BuildContext context, {Color? color}) {
    return GoogleFonts.getFont(
      primaryFont,
      fontSize: DesignTokens.fontSize3xl,
      fontWeight: DesignTokens.fontWeightBold,
      letterSpacing: DesignTokens.letterSpacingTight,
      height: DesignTokens.lineHeightNormal,
      color: color ?? getTextColor(context),
    );
  }
  
  static TextStyle h2(BuildContext context, {Color? color}) {
    return GoogleFonts.getFont(
      primaryFont,
      fontSize: DesignTokens.fontSize2xl,
      fontWeight: DesignTokens.fontWeightBold,
      letterSpacing: DesignTokens.letterSpacingNormal,
      height: DesignTokens.lineHeightNormal,
      color: color ?? getTextColor(context),
    );
  }
  
  static TextStyle h3(BuildContext context, {Color? color}) {
    return GoogleFonts.getFont(
      primaryFont,
      fontSize: DesignTokens.fontSizeXl,
      fontWeight: DesignTokens.fontWeightSemiBold,
      letterSpacing: DesignTokens.letterSpacingNormal,
      height: DesignTokens.lineHeightNormal,
      color: color ?? getTextColor(context),
    );
  }
  
  // ========== TITLE TEXT (18-14px - Card titles, List items) ==========
  
  static TextStyle titleLarge(BuildContext context, {Color? color}) {
    return GoogleFonts.getFont(
      primaryFont,
      fontSize: DesignTokens.fontSizeLg,
      fontWeight: DesignTokens.fontWeightSemiBold,
      letterSpacing: DesignTokens.letterSpacingNormal,
      height: DesignTokens.lineHeightNormal,
      color: color ?? getTextColor(context),
    );
  }
  
  static TextStyle titleMedium(BuildContext context, {Color? color}) {
    return GoogleFonts.getFont(
      primaryFont,
      fontSize: DesignTokens.fontSizeMd,
      fontWeight: DesignTokens.fontWeightMedium,
      letterSpacing: DesignTokens.letterSpacingNormal,
      height: DesignTokens.lineHeightNormal,
      color: color ?? getTextColor(context),
    );
  }
  
  static TextStyle titleSmall(BuildContext context, {Color? color}) {
    return GoogleFonts.getFont(
      primaryFont,
      fontSize: DesignTokens.fontSizeSm,
      fontWeight: DesignTokens.fontWeightMedium,
      letterSpacing: DesignTokens.letterSpacingWide,
      height: DesignTokens.lineHeightNormal,
      color: color ?? getTextColor(context),
    );
  }
  
  // ========== BODY TEXT (16-14px - Paragraphs, Content) ==========
  
  static TextStyle bodyLarge(BuildContext context, {Color? color}) {
    return GoogleFonts.getFont(
      secondaryFont,
      fontSize: DesignTokens.fontSizeMd,
      fontWeight: DesignTokens.fontWeightRegular,
      letterSpacing: DesignTokens.letterSpacingNormal,
      height: DesignTokens.lineHeightRelaxed,
      color: color ?? getTextColor(context),
    );
  }
  
  static TextStyle bodyMedium(BuildContext context, {Color? color}) {
    return GoogleFonts.getFont(
      secondaryFont,
      fontSize: DesignTokens.fontSizeSm,
      fontWeight: DesignTokens.fontWeightRegular,
      letterSpacing: DesignTokens.letterSpacingNormal,
      height: DesignTokens.lineHeightRelaxed,
      color: color ?? getTextColor(context, secondary: true),
    );
  }
  
  static TextStyle bodySmall(BuildContext context, {Color? color}) {
    return GoogleFonts.getFont(
      secondaryFont,
      fontSize: DesignTokens.fontSizeXs,
      fontWeight: DesignTokens.fontWeightRegular,
      letterSpacing: DesignTokens.letterSpacingNormal,
      height: DesignTokens.lineHeightRelaxed,
      color: color ?? getTextColor(context, secondary: true),
    );
  }
  
  // ========== LABEL TEXT (14-10px - Buttons, Tags, Badges) ==========
  
  static TextStyle labelLarge(BuildContext context, {Color? color}) {
    return GoogleFonts.getFont(
      primaryFont,
      fontSize: DesignTokens.fontSizeSm,
      fontWeight: DesignTokens.fontWeightSemiBold,
      letterSpacing: DesignTokens.letterSpacingWide,
      height: DesignTokens.lineHeightNormal,
      color: color ?? getTextColor(context),
    );
  }
  
  static TextStyle labelMedium(BuildContext context, {Color? color}) {
    return GoogleFonts.getFont(
      primaryFont,
      fontSize: DesignTokens.fontSizeXs,
      fontWeight: DesignTokens.fontWeightMedium,
      letterSpacing: DesignTokens.letterSpacingWide,
      height: DesignTokens.lineHeightNormal,
      color: color ?? getTextColor(context, secondary: true),
    );
  }
  
  static TextStyle labelSmall(BuildContext context, {Color? color}) {
    return GoogleFonts.getFont(
      primaryFont,
      fontSize: DesignTokens.fontSizeXxs,
      fontWeight: DesignTokens.fontWeightMedium,
      letterSpacing: DesignTokens.letterSpacingWide,
      height: DesignTokens.lineHeightNormal,
      color: color ?? getTextColor(context, secondary: true),
    );
  }
  
  // ========== SPECIAL PURPOSE ==========
  
  /// Username style (bold, medium size)
  static TextStyle username(BuildContext context, {Color? color, bool verified = false}) {
    return GoogleFonts.getFont(
      primaryFont,
      fontSize: DesignTokens.fontSizeMd,
      fontWeight: DesignTokens.fontWeightSemiBold,
      letterSpacing: DesignTokens.letterSpacingNormal,
      height: DesignTokens.lineHeightNormal,
      color: color ?? (verified ? DesignTokens.verifiedBlue : getTextColor(context)),
    );
  }
  
  /// Caption style (hashtags, mentions, descriptions)
  static TextStyle caption(BuildContext context, {Color? color}) {
    return GoogleFonts.getFont(
      secondaryFont,
      fontSize: DesignTokens.fontSizeSm,
      fontWeight: DesignTokens.fontWeightRegular,
      letterSpacing: DesignTokens.letterSpacingNormal,
      height: DesignTokens.lineHeightRelaxed,
      color: color ?? getTextColor(context),
    );
  }
  
  /// Button text (medium weight, uppercase)
  static TextStyle button(BuildContext context, {Color? color}) {
    return GoogleFonts.getFont(
      primaryFont,
      fontSize: DesignTokens.fontSizeMd,
      fontWeight: DesignTokens.fontWeightSemiBold,
      letterSpacing: DesignTokens.letterSpacingWide,
      height: DesignTokens.lineHeightNormal,
      color: color ?? DesignTokens.darkTextPrimary,
    );
  }
  
  /// Count/number text (stats, followers, views)
  static TextStyle count(BuildContext context, {Color? color}) {
    return GoogleFonts.getFont(
      primaryFont,
      fontSize: DesignTokens.fontSizeLg,
      fontWeight: DesignTokens.fontWeightBold,
      letterSpacing: DesignTokens.letterSpacingNormal,
      height: DesignTokens.lineHeightNormal,
      color: color ?? getTextColor(context),
    );
  }
  
  /// Count label text (Followers, Following, Likes)
  static TextStyle countLabel(BuildContext context, {Color? color}) {
    return GoogleFonts.getFont(
      secondaryFont,
      fontSize: DesignTokens.fontSizeXs,
      fontWeight: DesignTokens.fontWeightRegular,
      letterSpacing: DesignTokens.letterSpacingNormal,
      height: DesignTokens.lineHeightNormal,
      color: color ?? getTextColor(context, secondary: true),
    );
  }
  
  /// Link/hashtag text (clickable)
  static TextStyle link(BuildContext context, {Color? color}) {
    return GoogleFonts.getFont(
      secondaryFont,
      fontSize: DesignTokens.fontSizeSm,
      fontWeight: DesignTokens.fontWeightMedium,
      letterSpacing: DesignTokens.letterSpacingNormal,
      height: DesignTokens.lineHeightRelaxed,
      color: color ?? DesignTokens.brandPrimary,
      decoration: TextDecoration.none,
    );
  }
  
  /// Error/validation text
  static TextStyle error(BuildContext context) {
    return GoogleFonts.getFont(
      secondaryFont,
      fontSize: DesignTokens.fontSizeXs,
      fontWeight: DesignTokens.fontWeightRegular,
      letterSpacing: DesignTokens.letterSpacingNormal,
      height: DesignTokens.lineHeightNormal,
      color: DesignTokens.errorDefault,
    );
  }
  
  /// Timestamp text (3h ago, 2 days ago)
  static TextStyle timestamp(BuildContext context) {
    return GoogleFonts.getFont(
      secondaryFont,
      fontSize: DesignTokens.fontSizeXs,
      fontWeight: DesignTokens.fontWeightRegular,
      letterSpacing: DesignTokens.letterSpacingNormal,
      height: DesignTokens.lineHeightNormal,
      color: getTextColor(context, secondary: true),
    );
  }
  
  /// Live indicator text
  static TextStyle liveIndicator() {
    return GoogleFonts.getFont(
      primaryFont,
      fontSize: DesignTokens.fontSizeXs,
      fontWeight: DesignTokens.fontWeightBold,
      letterSpacing: DesignTokens.letterSpacingWide,
      height: DesignTokens.lineHeightNormal,
      color: DesignTokens.darkTextPrimary,
    );
  }
  
  // ========== BACKWARD COMPATIBILITY ==========
  
  /// Headline small (for backward compatibility)
  static TextStyle headlineSmall(BuildContext context, {Color? color}) {
    return h3(context, color: color);
  }
  
  /// Button small (for backward compatibility)
  static TextStyle buttonSmall(BuildContext context) {
    return GoogleFonts.getFont(
      primaryFont,
      fontSize: DesignTokens.fontSizeSm,
      fontWeight: DesignTokens.fontWeightMedium,
      letterSpacing: DesignTokens.letterSpacingWide,
      height: DesignTokens.lineHeightNormal,
      color: DesignTokens.darkTextPrimary,
    );
  }
}
