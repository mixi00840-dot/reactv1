import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../constants/shop_constants.dart';

/// Small banner (80px height) with background image
/// Compact design for secondary promotions and quick links
class BannerSWithImage extends StatelessWidget {
  final String imageUrl;
  final String title;
  final VoidCallback? onTap;
  final Color? overlayColor;

  const BannerSWithImage({
    Key? key,
    required this.imageUrl,
    required this.title,
    this.onTap,
    this.overlayColor,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: ShopConstants.bannerHeightSmall,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(ShopConstants.defaultBorderRadius),
          boxShadow: [ShopConstants.productCardShadowLight],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(ShopConstants.defaultBorderRadius),
          child: Stack(
            children: [
              // Background Image
              Positioned.fill(
                child: Image.network(
                  imageUrl,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      color: AppColors.backgroundLight,
                      child: const Center(
                        child: Icon(
                          Icons.image_not_supported,
                          size: 24,
                          color: AppColors.textTertiary,
                        ),
                      ),
                    );
                  },
                ),
              ),
              
              // Overlay
              if (overlayColor != null)
                Positioned.fill(
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          overlayColor!.withOpacity(0.7),
                          overlayColor!.withOpacity(0.3),
                        ],
                        begin: Alignment.centerLeft,
                        end: Alignment.centerRight,
                      ),
                    ),
                  ),
                ),
              
              // Title
              Positioned.fill(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: ShopConstants.defaultPadding,
                  ),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      title,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                        shadows: [
                          Shadow(
                            color: Colors.black45,
                            blurRadius: 4,
                          ),
                        ],
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
