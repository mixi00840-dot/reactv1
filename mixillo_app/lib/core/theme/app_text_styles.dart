import 'package:flutter/material.dart';

/// High-end typography system inspired by TikTok
/// Font hierarchy optimized for social media content
class AppTextStyles {
  AppTextStyles._();

  // ==================== FONT FAMILIES ====================
  
  static const String primaryFont = 'SF Pro Display'; // iOS-style
  static const String secondaryFont = 'Inter'; // Modern alternative
  static const String displayFont = 'Poppins'; // Bold headlines
  static const String monoFont = 'SF Mono'; // Code/Numbers

  // ==================== DISPLAY STYLES (Heroes & Headlines) ====================
  
  /// Display 1 - Largest text (Splash, Welcome screens)
  static const TextStyle display1 = TextStyle(
    fontFamily: displayFont,
    fontSize: 64,
    fontWeight: FontWeight.w800,
    height: 1.1,
    letterSpacing: -1.5,
  );
  
  /// Display 2 - Large headlines
  static const TextStyle display2 = TextStyle(
    fontFamily: displayFont,
    fontSize: 48,
    fontWeight: FontWeight.w700,
    height: 1.2,
    letterSpacing: -1.0,
  );
  
  /// Display 3 - Medium headlines
  static const TextStyle display3 = TextStyle(
    fontFamily: displayFont,
    fontSize: 36,
    fontWeight: FontWeight.w700,
    height: 1.2,
    letterSpacing: -0.5,
  );

  // ==================== HEADING STYLES ====================
  
  /// H1 - Page titles
  static const TextStyle h1 = TextStyle(
    fontFamily: primaryFont,
    fontSize: 32,
    fontWeight: FontWeight.w700,
    height: 1.25,
    letterSpacing: -0.5,
  );
  
  /// H2 - Section titles
  static const TextStyle h2 = TextStyle(
    fontFamily: primaryFont,
    fontSize: 28,
    fontWeight: FontWeight.w600,
    height: 1.3,
    letterSpacing: -0.3,
  );
  
  /// H3 - Subsection titles
  static const TextStyle h3 = TextStyle(
    fontFamily: primaryFont,
    fontSize: 24,
    fontWeight: FontWeight.w600,
    height: 1.3,
    letterSpacing: -0.2,
  );
  
  /// H4 - Card titles
  static const TextStyle h4 = TextStyle(
    fontFamily: primaryFont,
    fontSize: 20,
    fontWeight: FontWeight.w600,
    height: 1.4,
    letterSpacing: -0.1,
  );
  
  /// H5 - Small titles
  static const TextStyle h5 = TextStyle(
    fontFamily: primaryFont,
    fontSize: 18,
    fontWeight: FontWeight.w600,
    height: 1.4,
    letterSpacing: 0,
  );
  
  /// H6 - Tiny titles
  static const TextStyle h6 = TextStyle(
    fontFamily: primaryFont,
    fontSize: 16,
    fontWeight: FontWeight.w600,
    height: 1.5,
    letterSpacing: 0,
  );

  // ==================== BODY TEXT STYLES ====================
  
  /// Body Large - Main content
  static const TextStyle bodyLarge = TextStyle(
    fontFamily: primaryFont,
    fontSize: 16,
    fontWeight: FontWeight.w400,
    height: 1.5,
    letterSpacing: 0,
  );
  
  /// Body Large Bold
  static const TextStyle bodyLargeBold = TextStyle(
    fontFamily: primaryFont,
    fontSize: 16,
    fontWeight: FontWeight.w600,
    height: 1.5,
    letterSpacing: 0,
  );
  
  /// Body Medium - Standard text
  static const TextStyle bodyMedium = TextStyle(
    fontFamily: primaryFont,
    fontSize: 14,
    fontWeight: FontWeight.w400,
    height: 1.5,
    letterSpacing: 0,
  );
  
  /// Body Medium Bold
  static const TextStyle bodyMediumBold = TextStyle(
    fontFamily: primaryFont,
    fontSize: 14,
    fontWeight: FontWeight.w600,
    height: 1.5,
    letterSpacing: 0,
  );
  
  /// Body Small - Secondary text
  static const TextStyle bodySmall = TextStyle(
    fontFamily: primaryFont,
    fontSize: 12,
    fontWeight: FontWeight.w400,
    height: 1.5,
    letterSpacing: 0,
  );
  
  /// Body Small Bold
  static const TextStyle bodySmallBold = TextStyle(
    fontFamily: primaryFont,
    fontSize: 12,
    fontWeight: FontWeight.w600,
    height: 1.5,
    letterSpacing: 0,
  );

  // ==================== CAPTION & LABEL STYLES ====================
  
  /// Caption Large - Timestamps, metadata
  static const TextStyle captionLarge = TextStyle(
    fontFamily: secondaryFont,
    fontSize: 13,
    fontWeight: FontWeight.w400,
    height: 1.4,
    letterSpacing: 0.1,
  );
  
  /// Caption Medium
  static const TextStyle captionMedium = TextStyle(
    fontFamily: secondaryFont,
    fontSize: 12,
    fontWeight: FontWeight.w400,
    height: 1.4,
    letterSpacing: 0.1,
  );
  
  /// Caption Small - Micro text
  static const TextStyle captionSmall = TextStyle(
    fontFamily: secondaryFont,
    fontSize: 10,
    fontWeight: FontWeight.w400,
    height: 1.4,
    letterSpacing: 0.2,
  );
  
  /// Overline - All caps labels
  static const TextStyle overline = TextStyle(
    fontFamily: secondaryFont,
    fontSize: 11,
    fontWeight: FontWeight.w600,
    height: 1.3,
    letterSpacing: 1.5,
  );

  // ==================== BUTTON STYLES ====================
  
  /// Button Large - Primary CTAs
  static const TextStyle buttonLarge = TextStyle(
    fontFamily: primaryFont,
    fontSize: 16,
    fontWeight: FontWeight.w600,
    height: 1.2,
    letterSpacing: 0.5,
  );
  
  /// Button Medium - Standard buttons
  static const TextStyle buttonMedium = TextStyle(
    fontFamily: primaryFont,
    fontSize: 14,
    fontWeight: FontWeight.w600,
    height: 1.2,
    letterSpacing: 0.5,
  );
  
  /// Button Small - Compact buttons
  static const TextStyle buttonSmall = TextStyle(
    fontFamily: primaryFont,
    fontSize: 12,
    fontWeight: FontWeight.w600,
    height: 1.2,
    letterSpacing: 0.5,
  );

  // ==================== SOCIAL MEDIA SPECIFIC ====================
  
  /// Username style (bold, slightly larger)
  static const TextStyle username = TextStyle(
    fontFamily: primaryFont,
    fontSize: 15,
    fontWeight: FontWeight.w700,
    height: 1.3,
    letterSpacing: -0.1,
  );
  
  /// Username small (for lists)
  static const TextStyle usernameSmall = TextStyle(
    fontFamily: primaryFont,
    fontSize: 13,
    fontWeight: FontWeight.w600,
    height: 1.3,
    letterSpacing: 0,
  );
  
  /// Handle/@ mention
  static const TextStyle handle = TextStyle(
    fontFamily: primaryFont,
    fontSize: 14,
    fontWeight: FontWeight.w400,
    height: 1.4,
    letterSpacing: 0,
  );
  
  /// Bio/Description
  static const TextStyle bio = TextStyle(
    fontFamily: primaryFont,
    fontSize: 14,
    fontWeight: FontWeight.w400,
    height: 1.6,
    letterSpacing: 0,
  );
  
  /// Hashtag style
  static const TextStyle hashtag = TextStyle(
    fontFamily: primaryFont,
    fontSize: 14,
    fontWeight: FontWeight.w600,
    height: 1.4,
    letterSpacing: 0,
  );
  
  /// Comment text
  static const TextStyle comment = TextStyle(
    fontFamily: primaryFont,
    fontSize: 14,
    fontWeight: FontWeight.w400,
    height: 1.5,
    letterSpacing: 0,
  );
  
  /// Video description
  static const TextStyle videoDescription = TextStyle(
    fontFamily: primaryFont,
    fontSize: 14,
    fontWeight: FontWeight.w400,
    height: 1.6,
    letterSpacing: 0,
  );

  // ==================== NUMERIC STYLES ====================
  
  /// Large numbers (follower counts, likes)
  static const TextStyle numberLarge = TextStyle(
    fontFamily: primaryFont,
    fontSize: 20,
    fontWeight: FontWeight.w700,
    height: 1.2,
    letterSpacing: -0.5,
    fontFeatures: [FontFeature.tabularFigures()],
  );
  
  /// Medium numbers
  static const TextStyle numberMedium = TextStyle(
    fontFamily: primaryFont,
    fontSize: 16,
    fontWeight: FontWeight.w600,
    height: 1.2,
    letterSpacing: 0,
    fontFeatures: [FontFeature.tabularFigures()],
  );
  
  /// Small numbers (metadata counts)
  static const TextStyle numberSmall = TextStyle(
    fontFamily: primaryFont,
    fontSize: 12,
    fontWeight: FontWeight.w600,
    height: 1.2,
    letterSpacing: 0,
    fontFeatures: [FontFeature.tabularFigures()],
  );
  
  /// Monospace numbers (prices, time)
  static const TextStyle numberMono = TextStyle(
    fontFamily: monoFont,
    fontSize: 16,
    fontWeight: FontWeight.w500,
    height: 1.2,
    letterSpacing: 0,
    fontFeatures: [FontFeature.tabularFigures()],
  );

  // ==================== SPECIAL STYLES ====================
  
  /// Live badge text
  static const TextStyle liveBadge = TextStyle(
    fontFamily: primaryFont,
    fontSize: 11,
    fontWeight: FontWeight.w800,
    height: 1.2,
    letterSpacing: 0.5,
  );
  
  /// Timestamp (e.g., "2m ago")
  static const TextStyle timestamp = TextStyle(
    fontFamily: primaryFont,
    fontSize: 12,
    fontWeight: FontWeight.w400,
    height: 1.2,
    letterSpacing: 0,
  );
  
  /// Price text
  static const TextStyle price = TextStyle(
    fontFamily: primaryFont,
    fontSize: 18,
    fontWeight: FontWeight.w700,
    height: 1.2,
    letterSpacing: -0.3,
    fontFeatures: [FontFeature.tabularFigures()],
  );
  
  /// Price small
  static const TextStyle priceSmall = TextStyle(
    fontFamily: primaryFont,
    fontSize: 14,
    fontWeight: FontWeight.w600,
    height: 1.2,
    letterSpacing: 0,
    fontFeatures: [FontFeature.tabularFigures()],
  );
  
  /// Badge text
  static const TextStyle badge = TextStyle(
    fontFamily: primaryFont,
    fontSize: 10,
    fontWeight: FontWeight.w700,
    height: 1.2,
    letterSpacing: 0.5,
  );
  
  /// Notification text
  static const TextStyle notification = TextStyle(
    fontFamily: primaryFont,
    fontSize: 13,
    fontWeight: FontWeight.w400,
    height: 1.5,
    letterSpacing: 0,
  );

  // ==================== CAMERA INTERFACE ====================
  
  /// Camera timer text (large, bold)
  static const TextStyle cameraTimer = TextStyle(
    fontFamily: monoFont,
    fontSize: 48,
    fontWeight: FontWeight.w700,
    height: 1.0,
    letterSpacing: 0,
    fontFeatures: [FontFeature.tabularFigures()],
  );
  
  /// Camera instruction text
  static const TextStyle cameraInstruction = TextStyle(
    fontFamily: primaryFont,
    fontSize: 14,
    fontWeight: FontWeight.w500,
    height: 1.3,
    letterSpacing: 0.3,
  );
  
  /// Camera label
  static const TextStyle cameraLabel = TextStyle(
    fontFamily: primaryFont,
    fontSize: 11,
    fontWeight: FontWeight.w600,
    height: 1.2,
    letterSpacing: 0.5,
  );

  // ==================== HELPER METHODS ====================
  
  /// Apply color to text style
  static TextStyle withColor(TextStyle style, Color color) {
    return style.copyWith(color: color);
  }
  
  /// Apply opacity to text style
  static TextStyle withOpacity(TextStyle style, double opacity) {
    return style.copyWith(
      color: style.color?.withOpacity(opacity) ?? Colors.white.withOpacity(opacity),
    );
  }
  
  /// Make text style bold
  static TextStyle bold(TextStyle style) {
    return style.copyWith(fontWeight: FontWeight.w700);
  }
  
  /// Make text style italic
  static TextStyle italic(TextStyle style) {
    return style.copyWith(fontStyle: FontStyle.italic);
  }
  
  /// Add underline
  static TextStyle underline(TextStyle style) {
    return style.copyWith(decoration: TextDecoration.underline);
  }
  
  /// Add line-through
  static TextStyle lineThrough(TextStyle style) {
    return style.copyWith(decoration: TextDecoration.lineThrough);
  }
  
  /// Change font size
  static TextStyle withSize(TextStyle style, double size) {
    return style.copyWith(fontSize: size);
  }
  
  /// Change letter spacing
  static TextStyle withLetterSpacing(TextStyle style, double spacing) {
    return style.copyWith(letterSpacing: spacing);
  }
  
  /// Change height/line height
  static TextStyle withHeight(TextStyle style, double height) {
    return style.copyWith(height: height);
  }
}
