import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

/// Shop feature constants matching e-commerce UI kit standards
class ShopConstants {
  ShopConstants._();
  
  // ============================================================================
  // SPACING & PADDING
  // ============================================================================
  
  /// Standard padding for most UI elements (16px)
  static const double defaultPadding = 16.0;
  
  /// Half of default padding (8px)
  static const double defaultPaddingSmall = 8.0;
  
  /// Large padding for sections (24px)
  static const double defaultPaddingLarge = 24.0;
  
  /// Extra small padding (4px)
  static const double defaultPaddingTiny = 4.0;
  
  // ============================================================================
  // BORDER RADIUS
  // ============================================================================
  
  /// Default border radius for cards and buttons (12px)
  static const double defaultBorderRadius = 12.0;
  
  /// Small border radius (8px)
  static const double defaultBorderRadiusSmall = 8.0;
  
  /// Large border radius (16px)
  static const double defaultBorderRadiusLarge = 16.0;
  
  /// Circular border radius (100px)
  static const double defaultBorderRadiusCircular = 100.0;
  
  // ============================================================================
  // PRODUCT CARD DIMENSIONS
  // ============================================================================
  
  /// Standard vertical product card width (140px)
  static const double productCardWidth = 140.0;
  
  /// Standard vertical product card height (220px)
  static const double productCardHeight = 220.0;
  
  /// Product card image height (140px)
  static const double productCardImageHeight = 140.0;
  
  /// Secondary (horizontal) product card size (80x80)
  static const double secondaryProductCardSize = 80.0;
  
  // ============================================================================
  // BANNER DIMENSIONS
  // ============================================================================
  
  /// Large banner height (192px)
  static const double bannerHeightLarge = 192.0;
  
  /// Medium banner height (120px)
  static const double bannerHeightMedium = 120.0;
  
  /// Small banner height (80px)
  static const double bannerHeightSmall = 80.0;
  
  // ============================================================================
  // ICON SIZES
  // ============================================================================
  
  /// Small icon size (16px)
  static const double iconSizeSmall = 16.0;
  
  /// Default icon size (24px)
  static const double iconSizeDefault = 24.0;
  
  /// Large icon size (32px)
  static const double iconSizeLarge = 32.0;
  
  /// Extra large icon size (48px)
  static const double iconSizeExtraLarge = 48.0;
  
  // ============================================================================
  // TEXT STYLES
  // ============================================================================
  
  /// Product title text style
  static const TextStyle productTitleStyle = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w600,
    color: AppColors.textPrimary,
    height: 1.4,
  );
  
  /// Product price text style
  static const TextStyle productPriceStyle = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.bold,
    color: AppColors.primary,
  );
  
  /// Product original price (strikethrough) style
  static const TextStyle productOriginalPriceStyle = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w400,
    color: AppColors.textTertiary,
    decoration: TextDecoration.lineThrough,
  );
  
  /// Product discount badge text style
  static const TextStyle discountBadgeStyle = TextStyle(
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  );
  
  /// Section title text style
  static const TextStyle sectionTitleStyle = TextStyle(
    fontSize: 20,
    fontWeight: FontWeight.bold,
    color: AppColors.textPrimary,
  );
  
  /// Category text style
  static const TextStyle categoryTextStyle = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w600,
    color: AppColors.textPrimary,
  );
  
  // ============================================================================
  // DURATIONS
  // ============================================================================
  
  /// Short animation duration (200ms)
  static const Duration animationDurationShort = Duration(milliseconds: 200);
  
  /// Default animation duration (300ms)
  static const Duration animationDurationDefault = Duration(milliseconds: 300);
  
  /// Long animation duration (500ms)
  static const Duration animationDurationLong = Duration(milliseconds: 500);
  
  // ============================================================================
  // GRID CONFIGURATIONS
  // ============================================================================
  
  /// Product grid cross axis count (2 columns)
  static const int productGridCrossAxisCount = 2;
  
  /// Product grid cross axis spacing (16px)
  static const double productGridCrossAxisSpacing = 16.0;
  
  /// Product grid main axis spacing (16px)
  static const double productGridMainAxisSpacing = 16.0;
  
  /// Product grid child aspect ratio (width/height)
  static const double productGridChildAspectRatio = 140.0 / 220.0;
  
  // ============================================================================
  // SHADOWS
  // ============================================================================
  
  /// Light shadow for product cards
  static final BoxShadow productCardShadowLight = BoxShadow(
    color: Colors.black.withOpacity(0.05),
    blurRadius: 8,
    offset: const Offset(0, 2),
  );
  
  /// Default shadow for cards
  static final BoxShadow defaultShadow = BoxShadow(
    color: Colors.black.withOpacity(0.1),
    blurRadius: 12,
    offset: const Offset(0, 4),
  );
  
  /// Heavy shadow for elevated elements
  static final BoxShadow heavyShadow = BoxShadow(
    color: Colors.black.withOpacity(0.2),
    blurRadius: 20,
    offset: const Offset(0, 8),
  );
  
  // ============================================================================
  // RATING & REVIEWS
  // ============================================================================
  
  /// Star rating size (14px)
  static const double starRatingSize = 14.0;
  
  /// Maximum rating value
  static const double maxRating = 5.0;
  
  // ============================================================================
  // CART & CHECKOUT
  // ============================================================================
  
  /// Maximum quantity per product
  static const int maxProductQuantity = 99;
  
  /// Minimum order amount (if needed)
  static const double minOrderAmount = 0.0;
  
  // ============================================================================
  // SEARCH
  // ============================================================================
  
  /// Search debounce duration (500ms)
  static const Duration searchDebounceDuration = Duration(milliseconds: 500);
  
  /// Minimum search query length
  static const int minSearchQueryLength = 2;
  
  // ============================================================================
  // PAGINATION
  // ============================================================================
  
  /// Default page size for product listings
  static const int defaultPageSize = 20;
  
  /// Products per row on tablet/desktop
  static const int productsPerRowTablet = 3;
  static const int productsPerRowDesktop = 4;
}
