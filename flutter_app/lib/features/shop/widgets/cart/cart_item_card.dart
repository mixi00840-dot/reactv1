import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../constants/shop_constants.dart';

/// Cart item card with product info, quantity controls, and remove button
/// Enhanced version of SecondaryProductCard for cart-specific functionality
class CartItemCard extends StatelessWidget {
  final String imageUrl;
  final String title;
  final String? variant;
  final double price;
  final double? originalPrice;
  final int quantity;
  final int maxQuantity;
  final Function(int) onQuantityChanged;
  final VoidCallback onRemove;
  final VoidCallback? onTap;

  const CartItemCard({
    Key? key,
    required this.imageUrl,
    required this.title,
    this.variant,
    required this.price,
    this.originalPrice,
    required this.quantity,
    this.maxQuantity = 99,
    required this.onQuantityChanged,
    required this.onRemove,
    this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(ShopConstants.defaultPadding),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(ShopConstants.defaultBorderRadius),
          border: Border.all(
            color: AppColors.border,
            width: 1,
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Product Image
            _buildProductImage(),
            
            const SizedBox(width: ShopConstants.defaultPadding),
            
            // Product Details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title and Remove Button Row
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          title,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      IconButton(
                        onPressed: onRemove,
                        icon: const Icon(
                          Icons.close,
                          size: 20,
                          color: AppColors.textTertiary,
                        ),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                    ],
                  ),
                  
                  // Variant
                  if (variant != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      variant!,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                  
                  const SizedBox(height: ShopConstants.defaultPaddingSmall),
                  
                  // Price Row
                  Row(
                    children: [
                      Text(
                        '\$${price.toStringAsFixed(2)}',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                      ),
                      if (originalPrice != null && originalPrice! > price) ...[
                        const SizedBox(width: 8),
                        Text(
                          '\$${originalPrice!.toStringAsFixed(2)}',
                          style: const TextStyle(
                            fontSize: 14,
                            color: AppColors.textTertiary,
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                      ],
                    ],
                  ),
                  
                  const SizedBox(height: ShopConstants.defaultPadding),
                  
                  // Quantity Controls and Subtotal
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildQuantityControls(),
                      
                      // Item Subtotal
                      Text(
                        '\$${(price * quantity).toStringAsFixed(2)}',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
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

  Widget _buildQuantityControls() {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(
          color: AppColors.border,
          width: 1,
        ),
        borderRadius: BorderRadius.circular(
          ShopConstants.defaultBorderRadiusSmall,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Decrease Button
          _buildQuantityButton(
            icon: Icons.remove,
            onPressed: quantity > 1
                ? () => onQuantityChanged(quantity - 1)
                : null,
            enabled: quantity > 1,
          ),
          
          // Quantity Display
          Container(
            width: 40,
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              border: Border(
                left: BorderSide(
                  color: AppColors.border,
                  width: 1,
                ),
                right: BorderSide(
                  color: AppColors.border,
                  width: 1,
                ),
              ),
            ),
            child: Text(
              quantity.toString(),
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
          ),
          
          // Increase Button
          _buildQuantityButton(
            icon: Icons.add,
            onPressed: quantity < maxQuantity
                ? () => onQuantityChanged(quantity + 1)
                : null,
            enabled: quantity < maxQuantity,
          ),
        ],
      ),
    );
  }

  Widget _buildQuantityButton({
    required IconData icon,
    required VoidCallback? onPressed,
    required bool enabled,
  }) {
    return InkWell(
      onTap: onPressed,
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: enabled ? AppColors.primary.withOpacity(0.1) : Colors.transparent,
        ),
        child: Center(
          child: Icon(
            icon,
            size: 16,
            color: enabled ? AppColors.primary : AppColors.textTertiary,
          ),
        ),
      ),
    );
  }
}
