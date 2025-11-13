import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../constants/shop_constants.dart';

/// Horizontal product card (80x80) for cart, orders, and wishlists
/// Compact layout with image on left, details on right
class SecondaryProductCard extends StatelessWidget {
  final String imageUrl;
  final String title;
  final double price;
  final double? originalPrice;
  final String? variant; // e.g., "Size: M, Color: Blue"
  final int? quantity;
  final bool showQuantity;
  final bool showRemoveButton;
  final VoidCallback? onTap;
  final VoidCallback? onRemove;
  final VoidCallback? onQuantityIncrease;
  final VoidCallback? onQuantityDecrease;

  const SecondaryProductCard({
    Key? key,
    required this.imageUrl,
    required this.title,
    required this.price,
    this.originalPrice,
    this.variant,
    this.quantity,
    this.showQuantity = false,
    this.showRemoveButton = false,
    this.onTap,
    this.onRemove,
    this.onQuantityIncrease,
    this.onQuantityDecrease,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(ShopConstants.defaultPaddingSmall),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(ShopConstants.defaultBorderRadius),
          border: Border.all(
            color: AppColors.border,
            width: 1,
          ),
        ),
        child: Row(
          children: [
            // Product Image
            _buildProductImage(),
            
            const SizedBox(width: ShopConstants.defaultPadding),
            
            // Product Details
            Expanded(
              child: _buildProductDetails(),
            ),
            
            // Remove Button or Quantity Controls
            if (showRemoveButton)
              _buildRemoveButton()
            else if (showQuantity && quantity != null)
              _buildQuantityControls(),
          ],
        ),
      ),
    );
  }

  Widget _buildProductImage() {
    return Container(
      width: ShopConstants.secondaryProductCardSize,
      height: ShopConstants.secondaryProductCardSize,
      decoration: BoxDecoration(
        color: AppColors.backgroundLight,
        borderRadius: BorderRadius.circular(
          ShopConstants.defaultBorderRadiusSmall,
        ),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(
          ShopConstants.defaultBorderRadiusSmall,
        ),
        child: Image.network(
          imageUrl,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            return Center(
              child: Icon(
                Icons.image_not_supported,
                size: ShopConstants.iconSizeDefault,
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
                strokeWidth: 2,
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildProductDetails() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // Product Title
        Text(
          title,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        
        // Variant (Size, Color, etc.)
        if (variant != null) ...[
          const SizedBox(height: 4),
          Text(
            variant!,
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textSecondary,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
        
        const SizedBox(height: ShopConstants.defaultPaddingSmall),
        
        // Price Section
        Row(
          children: [
            Text(
              '\$${price.toStringAsFixed(2)}',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppColors.primary,
              ),
            ),
            if (originalPrice != null && originalPrice! > price) ...[
              const SizedBox(width: ShopConstants.defaultPaddingSmall),
              Text(
                '\$${originalPrice!.toStringAsFixed(2)}',
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textTertiary,
                  decoration: TextDecoration.lineThrough,
                ),
              ),
            ],
          ],
        ),
      ],
    );
  }

  Widget _buildRemoveButton() {
    return IconButton(
      onPressed: onRemove,
      icon: const Icon(
        Icons.close,
        size: ShopConstants.iconSizeDefault,
        color: AppColors.textTertiary,
      ),
      padding: EdgeInsets.zero,
      constraints: const BoxConstraints(),
    );
  }

  Widget _buildQuantityControls() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // Increase Button
        GestureDetector(
          onTap: onQuantityIncrease,
          child: Container(
            width: 24,
            height: 24,
            decoration: BoxDecoration(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(4),
            ),
            child: const Icon(
              Icons.add,
              size: 16,
              color: Colors.white,
            ),
          ),
        ),
        
        const SizedBox(height: 8),
        
        // Quantity Display
        Text(
          quantity.toString(),
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        
        const SizedBox(height: 8),
        
        // Decrease Button
        GestureDetector(
          onTap: onQuantityDecrease,
          child: Container(
            width: 24,
            height: 24,
            decoration: BoxDecoration(
              color: quantity! > 1 ? AppColors.primary : AppColors.border,
              borderRadius: BorderRadius.circular(4),
            ),
            child: Icon(
              Icons.remove,
              size: 16,
              color: quantity! > 1 ? Colors.white : AppColors.textTertiary,
            ),
          ),
        ),
      ],
    );
  }
}

/// Shimmer placeholder for SecondaryProductCard loading state
class SecondaryProductCardShimmer extends StatelessWidget {
  const SecondaryProductCardShimmer({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(ShopConstants.defaultPaddingSmall),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(ShopConstants.defaultBorderRadius),
        border: Border.all(
          color: AppColors.border,
          width: 1,
        ),
      ),
      child: Row(
        children: [
          // Image Placeholder
          Container(
            width: ShopConstants.secondaryProductCardSize,
            height: ShopConstants.secondaryProductCardSize,
            decoration: BoxDecoration(
              color: AppColors.shimmerBase,
              borderRadius: BorderRadius.circular(
                ShopConstants.defaultBorderRadiusSmall,
              ),
            ),
          ),
          
          const SizedBox(width: ShopConstants.defaultPadding),
          
          // Details Placeholder
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
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
                  width: 120,
                  decoration: BoxDecoration(
                    color: AppColors.shimmerBase,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                
                const SizedBox(height: 8),
                
                // Variant
                Container(
                  height: 12,
                  width: 80,
                  decoration: BoxDecoration(
                    color: AppColors.shimmerBase,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                
                const SizedBox(height: 8),
                
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
