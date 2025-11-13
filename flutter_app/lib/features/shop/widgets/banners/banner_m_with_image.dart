import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../constants/shop_constants.dart';

/// Medium banner (120px height) with background image and call-to-action
/// Perfect for product promotions and category highlights
class BannerMWithImage extends StatelessWidget {
  final String imageUrl;
  final String title;
  final String? subtitle;
  final String? buttonText;
  final VoidCallback? onTap;
  final Color? overlayColor;
  final Alignment alignment;

  const BannerMWithImage({
    Key? key,
    required this.imageUrl,
    required this.title,
    this.subtitle,
    this.buttonText,
    this.onTap,
    this.overlayColor,
    this.alignment = Alignment.centerLeft,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: ShopConstants.bannerHeightMedium,
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
                          size: 40,
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
                          overlayColor!,
                          overlayColor!.withOpacity(0.3),
                        ],
                        begin: alignment == Alignment.centerLeft
                            ? Alignment.centerLeft
                            : Alignment.centerRight,
                        end: alignment == Alignment.centerLeft
                            ? Alignment.centerRight
                            : Alignment.centerLeft,
                      ),
                    ),
                  ),
                ),
              
              // Content
              Positioned.fill(
                child: Padding(
                  padding: const EdgeInsets.all(ShopConstants.defaultPadding),
                  child: Align(
                    alignment: alignment,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: alignment == Alignment.centerLeft
                          ? CrossAxisAlignment.start
                          : CrossAxisAlignment.end,
                      children: [
                        // Title
                        Text(
                          title,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                            shadows: [
                              Shadow(
                                color: Colors.black45,
                                blurRadius: 4,
                              ),
                            ],
                          ),
                        ),
                        
                        // Subtitle
                        if (subtitle != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            subtitle!,
                            style: const TextStyle(
                              fontSize: 12,
                              color: Colors.white,
                              shadows: [
                                Shadow(
                                  color: Colors.black45,
                                  blurRadius: 4,
                                ),
                              ],
                            ),
                          ),
                        ],
                        
                        // Button
                        if (buttonText != null) ...[
                          const SizedBox(height: ShopConstants.defaultPaddingSmall),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: ShopConstants.defaultPadding,
                              vertical: ShopConstants.defaultPaddingSmall,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(
                                ShopConstants.defaultBorderRadiusCircular,
                              ),
                            ),
                            child: Text(
                              buttonText!,
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primary,
                              ),
                            ),
                          ),
                        ],
                      ],
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
