import 'package:flutter/material.dart';

/// Design Tokens - Premium Design System
/// Inspired by TikTok, Instagram, Twitter design language
/// Last Updated: November 2025
class DesignTokens {
  DesignTokens._();

  // ============================================================================
  // COLOR SYSTEM - Semantic & Brand Colors
  // ============================================================================
  
  /// Brand Colors (Primary Palette)
  static const Color brandPrimary = Color(0xFFFF006B); // Hot Pink - Main brand
  static const Color brandSecondary = Color(0xFF00F2EA); // Cyan - Secondary actions
  static const Color brandAccent = Color(0xFFFFC700); // Gold - Premium features
  
  /// Brand Gradients
  static const List<Color> brandGradient = [
    Color(0xFFFF006B),
    Color(0xFFFF4D8A),
  ];
  
  static const List<Color> premiumGradient = [
    Color(0xFFFFD700),
    Color(0xFFFFC700),
    Color(0xFFFFB700),
  ];
  
  static const List<Color> liveGradient = [
    Color(0xFFFF006B),
    Color(0xFFFF4500),
  ];

  // ============================================================================
  // NEUTRAL COLORS - Light Mode
  // ============================================================================
  
  static const Color lightBackground = Color(0xFFFFFFFF);
  static const Color lightSurface = Color(0xFFF8F9FA);
  static const Color lightSurfaceElevated = Color(0xFFFFFFFF);
  static const Color lightCard = Color(0xFFFFFFFF);
  static const Color lightOverlay = Color(0x40000000);
  
  /// Text Colors - Light Mode
  static const Color lightTextPrimary = Color(0xFF1A1A1A);
  static const Color lightTextSecondary = Color(0xFF6B7280);
  static const Color lightTextTertiary = Color(0xFF9CA3AF);
  static const Color lightTextDisabled = Color(0xFFD1D5DB);
  static const Color lightTextInverse = Color(0xFFFFFFFF);
  
  /// Border Colors - Light Mode
  static const Color lightBorder = Color(0xFFE5E7EB);
  static const Color lightBorderStrong = Color(0xFFD1D5DB);
  static const Color lightDivider = Color(0xFFF3F4F6);

  // ============================================================================
  // NEUTRAL COLORS - Dark Mode
  // ============================================================================
  
  static const Color darkBackground = Color(0xFF000000);
  static const Color darkSurface = Color(0xFF1A1A1A);
  static const Color darkSurfaceElevated = Color(0xFF2D2D2D);
  static const Color darkCard = Color(0xFF1F1F1F);
  static const Color darkOverlay = Color(0x80000000);
  
  /// Text Colors - Dark Mode
  static const Color darkTextPrimary = Color(0xFFFFFFFF);
  static const Color darkTextSecondary = Color(0xFFD1D5DB);
  static const Color darkTextTertiary = Color(0xFF9CA3AF);
  static const Color darkTextDisabled = Color(0xFF6B7280);
  static const Color darkTextInverse = Color(0xFF000000);
  
  /// Border Colors - Dark Mode
  static const Color darkBorder = Color(0xFF2D2D2D);
  static const Color darkBorderStrong = Color(0xFF404040);
  static const Color darkDivider = Color(0xFF262626);

  // ============================================================================
  // SEMANTIC COLORS - Status & Feedback
  // ============================================================================
  
  /// Success (Green)
  static const Color successDefault = Color(0xFF10B981);
  static const Color successLight = Color(0xFF6EE7B7);
  static const Color successDark = Color(0xFF059669);
  static const Color successBg = Color(0xFFECFDF5);
  
  /// Warning (Yellow/Orange)
  static const Color warningDefault = Color(0xFFF59E0B);
  static const Color warningLight = Color(0xFFFBBF24);
  static const Color warningDark = Color(0xFFD97706);
  static const Color warningBg = Color(0xFFFEF3C7);
  
  /// Error (Red)
  static const Color errorDefault = Color(0xFFEF4444);
  static const Color errorLight = Color(0xFFF87171);
  static const Color errorDark = Color(0xFFDC2626);
  static const Color errorBg = Color(0xFFFEE2E2);
  
  /// Info (Blue)
  static const Color infoDefault = Color(0xFF3B82F6);
  static const Color infoLight = Color(0xFF60A5FA);
  static const Color infoDark = Color(0xFF2563EB);
  static const Color infoBg = Color(0xFFDBEAFE);

  // ============================================================================
  // SOCIAL FEATURE COLORS
  // ============================================================================
  
  /// Engagement Colors
  static const Color likeRed = Color(0xFFFF2D55);
  static const Color shareBlue = Color(0xFF007AFF);
  static const Color commentGreen = Color(0xFF34C759);
  static const Color bookmarkYellow = Color(0xFFFFCC00);
  
  /// Live Streaming Colors
  static const Color liveActive = Color(0xFFFF006B);
  static const Color liveViewers = Color(0xFFFFFFFF);
  static const Color livePkBattle = Color(0xFFFFC700);
  static const Color liveGift = Color(0xFFFF4500);
  
  /// Creator Badge Colors
  static const Color verifiedBlue = Color(0xFF1DA1F2);
  static const Color premiumGold = Color(0xFFFFD700);
  static const Color topCreatorPurple = Color(0xFF9B59B6);

  // ============================================================================
  // TYPOGRAPHY SYSTEM
  // ============================================================================
  
  /// Font Families
  static const String primaryFont = 'Poppins';
  static const String secondaryFont = 'Inter';
  static const String displayFont = 'Urbanist';
  
  /// Font Sizes
  static const double fontSizeXxs = 10.0;
  static const double fontSizeXs = 12.0;
  static const double fontSizeSm = 14.0;
  static const double fontSizeMd = 16.0;
  static const double fontSizeLg = 18.0;
  static const double fontSizeXl = 20.0;
  static const double fontSize2xl = 24.0;
  static const double fontSize3xl = 28.0;
  static const double fontSize4xl = 32.0;
  static const double fontSize5xl = 40.0;
  static const double fontSize6xl = 48.0;
  
  /// Font Weights
  static const FontWeight fontWeightLight = FontWeight.w300;
  static const FontWeight fontWeightRegular = FontWeight.w400;
  static const FontWeight fontWeightMedium = FontWeight.w500;
  static const FontWeight fontWeightSemiBold = FontWeight.w600;
  static const FontWeight fontWeightBold = FontWeight.w700;
  static const FontWeight fontWeightExtraBold = FontWeight.w800;
  static const FontWeight fontWeightBlack = FontWeight.w900;
  
  /// Line Heights
  static const double lineHeightTight = 1.2;
  static const double lineHeightNormal = 1.5;
  static const double lineHeightRelaxed = 1.75;
  static const double lineHeightLoose = 2.0;
  
  /// Letter Spacing
  static const double letterSpacingTight = -0.5;
  static const double letterSpacingNormal = 0.0;
  static const double letterSpacingWide = 0.5;

  // ============================================================================
  // SPACING SYSTEM - 4px base unit
  // ============================================================================
  
  static const double space0 = 0.0;
  static const double space1 = 4.0;   // 4px
  static const double space2 = 8.0;   // 8px
  static const double space3 = 12.0;  // 12px
  static const double space4 = 16.0;  // 16px
  static const double space5 = 20.0;  // 20px
  static const double space6 = 24.0;  // 24px
  static const double space8 = 32.0;  // 32px
  static const double space10 = 40.0; // 40px
  static const double space12 = 48.0; // 48px
  static const double space16 = 64.0; // 64px
  static const double space20 = 80.0; // 80px
  static const double space24 = 96.0; // 96px

  // ============================================================================
  // BORDER RADIUS - Rounded corners
  // ============================================================================
  
  static const double radiusNone = 0.0;
  static const double radiusXs = 4.0;
  static const double radiusSm = 8.0;
  static const double radiusMd = 12.0;
  static const double radiusLg = 16.0;
  static const double radiusXl = 20.0;
  static const double radius2xl = 24.0;
  static const double radius3xl = 32.0;
  static const double radiusFull = 9999.0;
  
  /// Component-specific radius
  static const double radiusButton = 12.0;
  static const double radiusCard = 16.0;
  static const double radiusModal = 24.0;
  static const double radiusAvatar = 9999.0;
  static const double radiusInput = 12.0;

  // ============================================================================
  // ELEVATION & SHADOWS
  // ============================================================================
  
  /// Shadow Levels
  static const List<BoxShadow> shadowNone = [];
  
  static const List<BoxShadow> shadowXs = [
    BoxShadow(
      color: Color(0x0F000000),
      offset: Offset(0, 1),
      blurRadius: 2,
      spreadRadius: 0,
    ),
  ];
  
  static const List<BoxShadow> shadowSm = [
    BoxShadow(
      color: Color(0x1A000000),
      offset: Offset(0, 2),
      blurRadius: 4,
      spreadRadius: -1,
    ),
  ];
  
  static const List<BoxShadow> shadowMd = [
    BoxShadow(
      color: Color(0x1F000000),
      offset: Offset(0, 4),
      blurRadius: 8,
      spreadRadius: -2,
    ),
  ];
  
  static const List<BoxShadow> shadowLg = [
    BoxShadow(
      color: Color(0x26000000),
      offset: Offset(0, 8),
      blurRadius: 16,
      spreadRadius: -4,
    ),
  ];
  
  static const List<BoxShadow> shadowXl = [
    BoxShadow(
      color: Color(0x33000000),
      offset: Offset(0, 12),
      blurRadius: 24,
      spreadRadius: -6,
    ),
  ];
  
  static const List<BoxShadow> shadow2xl = [
    BoxShadow(
      color: Color(0x40000000),
      offset: Offset(0, 20),
      blurRadius: 40,
      spreadRadius: -8,
    ),
  ];

  // ============================================================================
  // ANIMATION & MOTION
  // ============================================================================
  
  /// Duration
  static const Duration durationInstant = Duration(milliseconds: 0);
  static const Duration durationFast = Duration(milliseconds: 150);
  static const Duration durationNormal = Duration(milliseconds: 300);
  static const Duration durationSlow = Duration(milliseconds: 500);
  static const Duration durationSlower = Duration(milliseconds: 800);
  
  /// Curves
  static const Curve curveEaseIn = Curves.easeIn;
  static const Curve curveEaseOut = Curves.easeOut;
  static const Curve curveEaseInOut = Curves.easeInOut;
  static const Curve curveSpring = Curves.elasticOut;
  static const Curve curveBounce = Curves.bounceOut;
  
  /// Standard motion curve (iOS-like)
  static const Curve curveStandard = Cubic(0.4, 0.0, 0.2, 1.0);
  static const Curve curveDecelerate = Cubic(0.0, 0.0, 0.2, 1.0);
  static const Curve curveAccelerate = Cubic(0.4, 0.0, 1.0, 1.0);

  // ============================================================================
  // ICON SIZES
  // ============================================================================
  
  static const double iconXs = 16.0;
  static const double iconSm = 20.0;
  static const double iconMd = 24.0;
  static const double iconLg = 32.0;
  static const double iconXl = 40.0;
  static const double icon2xl = 48.0;
  static const double icon3xl = 64.0;

  // ============================================================================
  // Z-INDEX / STACK LAYERS
  // ============================================================================
  
  static const int zIndexBase = 0;
  static const int zIndexDropdown = 1000;
  static const int zIndexSticky = 1020;
  static const int zIndexFixed = 1030;
  static const int zIndexModalBackdrop = 1040;
  static const int zIndexModal = 1050;
  static const int zIndexPopover = 1060;
  static const int zIndexTooltip = 1070;
  static const int zIndexToast = 1080;

  // ============================================================================
  // BREAKPOINTS - Responsive Design
  // ============================================================================
  
  static const double breakpointXs = 320.0;  // Small phones
  static const double breakpointSm = 480.0;  // Large phones
  static const double breakpointMd = 768.0;  // Tablets
  static const double breakpointLg = 1024.0; // Laptops
  static const double breakpointXl = 1280.0; // Desktops
  static const double breakpoint2xl = 1536.0; // Large desktops

  // ============================================================================
  // COMPONENT SIZES - Standardized heights/sizes
  // ============================================================================
  
  /// Button Heights
  static const double buttonHeightSm = 32.0;
  static const double buttonHeightMd = 44.0;
  static const double buttonHeightLg = 56.0;
  
  /// Input Heights
  static const double inputHeightSm = 36.0;
  static const double inputHeightMd = 48.0;
  static const double inputHeightLg = 56.0;
  
  /// Avatar Sizes
  static const double avatarXs = 24.0;
  static const double avatarSm = 32.0;
  static const double avatarMd = 40.0;
  static const double avatarLg = 56.0;
  static const double avatarXl = 80.0;
  static const double avatar2xl = 120.0;
  static const double avatar3xl = 160.0;
  
  /// App Bar Height
  static const double appBarHeight = 56.0;
  static const double appBarHeightLarge = 112.0;
  
  /// Bottom Navigation Height
  static const double bottomNavHeight = 72.0;
  
  /// Floating Action Button Size
  static const double fabSizeSm = 40.0;
  static const double fabSizeMd = 56.0;
  static const double fabSizeLg = 72.0;

  // ============================================================================
  // OPACITY LEVELS
  // ============================================================================
  
  static const double opacityDisabled = 0.38;
  static const double opacityMedium = 0.54;
  static const double opacityHigh = 0.87;
  static const double opacityFull = 1.0;
  static const double opacityOverlay = 0.5;
  static const double opacityScrim = 0.32;

  // ============================================================================
  // HELPER METHODS
  // ============================================================================
  
  /// Get spacing value by index
  static double getSpace(int index) {
    const spaces = [
      space0, space1, space2, space3, space4, space5, 
      space6, space8, space10, space12, space16, space20, space24
    ];
    return spaces[index.clamp(0, spaces.length - 1)];
  }
  
  /// Create gradient from colors
  static LinearGradient createGradient(
    List<Color> colors, {
    AlignmentGeometry begin = Alignment.topLeft,
    AlignmentGeometry end = Alignment.bottomRight,
  }) {
    return LinearGradient(
      colors: colors,
      begin: begin,
      end: end,
    );
  }
  
  /// Create shadow with custom parameters
  static List<BoxShadow> createShadow({
    required Color color,
    required double blur,
    Offset offset = Offset.zero,
    double spread = 0,
  }) {
    return [
      BoxShadow(
        color: color,
        blurRadius: blur,
        offset: offset,
        spreadRadius: spread,
      ),
    ];
  }
}
