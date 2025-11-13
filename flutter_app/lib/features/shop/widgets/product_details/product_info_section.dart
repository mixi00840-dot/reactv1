import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../constants/shop_constants.dart';

/// Product information section with title, price, rating, seller, and stock
class ProductInfoSection extends StatelessWidget {
  final String title;
  final double price;
  final double? originalPrice;
  final int? discountPercent;
  final double rating;
  final int reviewCount;
  final bool inStock;
  final int? stockCount;
  final String sellerName;
  final double sellerRating;
  final bool sellerVerified;

  const ProductInfoSection({
    Key? key,
    required this.title,
    required this.price,
    this.originalPrice,
    this.discountPercent,
    required this.rating,
    required this.reviewCount,
    this.inStock = true,
    this.stockCount,
    required this.sellerName,
    required this.sellerRating,
    this.sellerVerified = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Product Title
        Text(
          title,
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
            height: 1.3,
          ),
        ),
        
        const SizedBox(height: ShopConstants.defaultPadding),
        
        // Rating and Reviews
        _buildRatingSection(),
        
        const SizedBox(height: ShopConstants.defaultPadding),
        
        // Price Section
        _buildPriceSection(),
        
        const SizedBox(height: ShopConstants.defaultPadding),
        
        // Stock Status
        _buildStockStatus(),
        
        const SizedBox(height: ShopConstants.defaultPaddingLarge),
        
        // Seller Info
        _buildSellerInfo(),
      ],
    );
  }

  Widget _buildRatingSection() {
    return Row(
      children: [
        // Star Rating
        Row(
          children: List.generate(5, (index) {
            return Icon(
              index < rating.floor()
                  ? Icons.star
                  : index < rating
                      ? Icons.star_half
                      : Icons.star_border,
              size: 20,
              color: AppColors.warning,
            );
          }),
        ),
        
        const SizedBox(width: 8),
        
        // Rating Text
        Text(
          rating.toStringAsFixed(1),
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        
        const SizedBox(width: 8),
        
        // Review Count
        Text(
          '($reviewCount reviews)',
          style: const TextStyle(
            fontSize: 14,
            color: AppColors.textSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildPriceSection() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Current Price
        Text(
          '\$${price.toStringAsFixed(2)}',
          style: const TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.bold,
            color: AppColors.primary,
          ),
        ),
        
        if (originalPrice != null && originalPrice! > price) ...[
          const SizedBox(width: ShopConstants.defaultPadding),
          
          // Original Price
          Text(
            '\$${originalPrice!.toStringAsFixed(2)}',
            style: const TextStyle(
              fontSize: 18,
              color: AppColors.textTertiary,
              decoration: TextDecoration.lineThrough,
            ),
          ),
          
          const SizedBox(width: ShopConstants.defaultPaddingSmall),
          
          // Discount Badge
          if (discountPercent != null)
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: ShopConstants.defaultPaddingSmall,
                vertical: 4,
              ),
              decoration: BoxDecoration(
                color: AppColors.accent,
                borderRadius: BorderRadius.circular(
                  ShopConstants.defaultBorderRadiusSmall,
                ),
              ),
              child: Text(
                '-$discountPercent%',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
        ],
      ],
    );
  }

  Widget _buildStockStatus() {
    return Row(
      children: [
        // Stock Icon
        Icon(
          inStock ? Icons.check_circle : Icons.cancel,
          size: 20,
          color: inStock ? AppColors.success : AppColors.error,
        ),
        
        const SizedBox(width: 8),
        
        // Stock Text
        Text(
          inStock ? 'In Stock' : 'Out of Stock',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: inStock ? AppColors.success : AppColors.error,
          ),
        ),
        
        // Stock Count
        if (inStock && stockCount != null && stockCount! < 50) ...[
          const SizedBox(width: 8),
          Text(
            '(Only $stockCount left)',
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.warning,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildSellerInfo() {
    return Container(
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
        children: [
          // Seller Avatar
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                sellerName[0].toUpperCase(),
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
            ),
          ),
          
          const SizedBox(width: ShopConstants.defaultPadding),
          
          // Seller Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Seller Name with Verification
                Row(
                  children: [
                    Text(
                      sellerName,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    if (sellerVerified) ...[
                      const SizedBox(width: 4),
                      Icon(
                        Icons.verified,
                        size: 16,
                        color: AppColors.primary,
                      ),
                    ],
                  ],
                ),
                
                const SizedBox(height: 4),
                
                // Seller Rating
                Row(
                  children: [
                    Icon(
                      Icons.star,
                      size: 14,
                      color: AppColors.warning,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      sellerRating.toStringAsFixed(1),
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Store Rating',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textTertiary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          
          // Visit Store Button
          IconButton(
            onPressed: () {
              // Navigate to seller store
            },
            icon: Icon(
              Icons.arrow_forward_ios,
              size: 16,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}
