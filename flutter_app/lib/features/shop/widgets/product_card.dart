import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../constants/shop_constants.dart';

/// Standard vertical product card (140x220) for shop grids
/// Matches e-commerce UI kit design with discount badge support
class ProductCard extends StatelessWidget {
  final String imageUrl;
  final String title;
  final double price;
  final double? originalPrice;
  final int? discountPercent;
  final double? rating;
  final int? reviewCount;
  final bool isFavorite;
  final bool showShadow;
  final VoidCallback? onTap;
  final VoidCallback? onFavoriteToggle;

  const ProductCard({
    Key? key,
    required this.imageUrl,
    required this.title,
    required this.price,
    this.originalPrice,
    this.discountPercent,
    this.rating,
    this.reviewCount,
    this.isFavorite = false,
    this.showShadow = true,
    this.onTap,
    this.onFavoriteToggle,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: ShopConstants.productCardWidth,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(ShopConstants.defaultBorderRadius),
          boxShadow: showShadow
              ? [ShopConstants.productCardShadowLight]
              : null,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Product Image with Favorite Button and Discount Badge
            _buildProductImage(),
            
            // Product Details
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(ShopConstants.defaultPaddingSmall),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Product Title
                    _buildProductTitle(),
                    
                    const SizedBox(height: ShopConstants.defaultPaddingTiny),
                    
                    // Rating (if available)
                    if (rating != null) _buildRating(),
                    
                    const Spacer(),
                    
                    // Price Section
                    _buildPriceSection(),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProductImage() {
    return Stack(
      children: [
        // Product Image
        Container(
          height: ShopConstants.productCardImageHeight,
          width: double.infinity,
          decoration: BoxDecoration(
            color: AppColors.backgroundLight,
            borderRadius: const BorderRadius.vertical(
              top: Radius.circular(ShopConstants.defaultBorderRadius),
            ),
          ),
          child: ClipRRect(
            borderRadius: const BorderRadius.vertical(
              top: Radius.circular(ShopConstants.defaultBorderRadius),
            ),
            child: Image.network(
              imageUrl,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) {
                return Center(
                  child: Icon(
                    Icons.image_not_supported,
                    size: ShopConstants.iconSizeLarge,
                    color: AppColors.textTertiary,
                  ),
                );
              },
              loadingBuilder: (context, child, loadingProgress) {
                if (loadingProgress == null) return child;
                return Center(
                  child: CircularProgressIndicator(
                    value: loadingProgress.expectedTotalBytes != null
                        ? loadingProgress.cumulativeBytesLoaded /
                            loadingProgress.expectedTotalBytes!
                        : null,
                    valueColor: const AlwaysStoppedAnimation<Color>(
                      AppColors.primary,
                    ),
                  ),
                );
              },
            ),
          ),
        ),
        
        // Discount Badge (Top Left)
        if (discountPercent != null && discountPercent! > 0)
          Positioned(
            top: ShopConstants.defaultPaddingSmall,
            left: ShopConstants.defaultPaddingSmall,
            child: _buildDiscountBadge(),
          ),
        
        // Favorite Button (Top Right)
        Positioned(
          top: ShopConstants.defaultPaddingSmall,
          right: ShopConstants.defaultPaddingSmall,
          child: _buildFavoriteButton(),
        ),
      ],
    );
  }

  Widget _buildDiscountBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: ShopConstants.defaultPaddingSmall,
        vertical: ShopConstants.defaultPaddingTiny,
      ),
      decoration: BoxDecoration(
        color: AppColors.accent,
        borderRadius: BorderRadius.circular(
          ShopConstants.defaultBorderRadiusSmall,
        ),
      ),
      child: Text(
        '-$discountPercent%',
        style: ShopConstants.discountBadgeStyle,
      ),
    );
  }

  Widget _buildFavoriteButton() {
    return GestureDetector(
      onTap: onFavoriteToggle,
      child: Container(
        padding: const EdgeInsets.all(ShopConstants.defaultPaddingSmall),
        decoration: BoxDecoration(
          color: AppColors.white.withOpacity(0.9),
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Icon(
          isFavorite ? Icons.favorite : Icons.favorite_border,
          size: ShopConstants.iconSizeSmall,
          color: isFavorite ? AppColors.like : AppColors.textTertiary,
        ),
      ),
    );
  }

  Widget _buildProductTitle() {
    return Text(
      title,
      style: ShopConstants.productTitleStyle,
      maxLines: 2,
      overflow: TextOverflow.ellipsis,
    );
  }

  Widget _buildRating() {
    return Row(
      children: [
        Icon(
          Icons.star,
          size: ShopConstants.starRatingSize,
          color: AppColors.warning,
        ),
        const SizedBox(width: 4),
        Text(
          rating!.toStringAsFixed(1),
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        if (reviewCount != null) ...[
          const SizedBox(width: 4),
          Text(
            '($reviewCount)',
            style: const TextStyle(
              fontSize: 10,
              color: AppColors.textTertiary,
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildPriceSection() {
    return Row(
      children: [
        // Current Price
        Text(
          '\$${price.toStringAsFixed(2)}',
          style: ShopConstants.productPriceStyle,
        ),
        
        const SizedBox(width: ShopConstants.defaultPaddingSmall),
        
        // Original Price (Strikethrough)
        if (originalPrice != null && originalPrice! > price)
          Text(
            '\$${originalPrice!.toStringAsFixed(2)}',
            style: ShopConstants.productOriginalPriceStyle,
          ),
      ],
    );
  }
}

/// Shimmer placeholder for ProductCard loading state
class ProductCardShimmer extends StatelessWidget {
  const ProductCardShimmer({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: ShopConstants.productCardWidth,
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(ShopConstants.defaultBorderRadius),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image Placeholder
          Container(
            height: ShopConstants.productCardImageHeight,
            width: double.infinity,
            decoration: BoxDecoration(
              color: AppColors.shimmerBase,
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(ShopConstants.defaultBorderRadius),
              ),
            ),
          ),
          
          // Details Placeholder
          Padding(
            padding: const EdgeInsets.all(ShopConstants.defaultPaddingSmall),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title
                Container(
                  height: 14,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: AppColors.shimmerBase,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                const SizedBox(height: 4),
                Container(
                  height: 14,
                  width: 100,
                  decoration: BoxDecoration(
                    color: AppColors.shimmerBase,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                
                const SizedBox(height: ShopConstants.defaultPaddingSmall),
                
                // Price
                Container(
                  height: 16,
                  width: 60,
                  decoration: BoxDecoration(
                    color: AppColors.shimmerBase,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
