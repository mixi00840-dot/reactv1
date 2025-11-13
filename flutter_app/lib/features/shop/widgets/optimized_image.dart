import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../constants/shop_constants.dart';
import '../../../core/theme/app_colors.dart';

/// Optimized image widget with caching and error handling
class OptimizedNetworkImage extends StatelessWidget {
  final String imageUrl;
  final double? width;
  final double? height;
  final BoxFit fit;
  final BorderRadius? borderRadius;
  final Widget? placeholder;
  final Widget? errorWidget;

  const OptimizedNetworkImage({
    Key? key,
    required this.imageUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.borderRadius,
    this.placeholder,
    this.errorWidget,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: borderRadius ?? BorderRadius.zero,
      child: CachedNetworkImage(
        imageUrl: imageUrl,
        width: width,
        height: height,
        fit: fit,
        placeholder: (context, url) =>
            placeholder ??
            Container(
              color: AppColors.surface,
              child: const Center(
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: AppColors.primary,
                ),
              ),
            ),
        errorWidget: (context, url, error) =>
            errorWidget ??
            Container(
              color: AppColors.surface,
              child: const Center(
                child: Icon(
                  Icons.broken_image_outlined,
                  color: AppColors.textTertiary,
                  size: 48,
                ),
              ),
            ),
        memCacheWidth: width != null ? (width! * 2).toInt() : null,
        memCacheHeight: height != null ? (height! * 2).toInt() : null,
        maxWidthDiskCache: 1000,
        maxHeightDiskCache: 1000,
      ),
    );
  }
}

/// Optimized image for product cards
class ProductImage extends StatelessWidget {
  final String imageUrl;
  final double? size;
  final bool showBadge;
  final String? badgeText;

  const ProductImage({
    Key? key,
    required this.imageUrl,
    this.size,
    this.showBadge = false,
    this.badgeText,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        OptimizedNetworkImage(
          imageUrl: imageUrl,
          width: size,
          height: size,
          fit: BoxFit.cover,
          borderRadius: BorderRadius.circular(ShopConstants.defaultBorderRadius),
        ),
        if (showBadge && badgeText != null)
          Positioned(
            top: 8,
            right: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: 8,
                vertical: 4,
              ),
              decoration: BoxDecoration(
                color: AppColors.error,
                borderRadius: BorderRadius.circular(ShopConstants.defaultBorderRadiusSmall),
              ),
              child: Text(
                badgeText!,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
      ],
    );
  }
}

/// Optimized avatar image
class AvatarImage extends StatelessWidget {
  final String imageUrl;
  final double size;
  final bool showBorder;

  const AvatarImage({
    Key? key,
    required this.imageUrl,
    this.size = 40,
    this.showBorder = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: showBorder
            ? Border.all(
                color: AppColors.primary,
                width: 2,
              )
            : null,
      ),
      child: ClipOval(
        child: OptimizedNetworkImage(
          imageUrl: imageUrl,
          width: size,
          height: size,
          fit: BoxFit.cover,
          errorWidget: Container(
            color: AppColors.surface,
            child: const Center(
              child: Icon(
                Icons.person,
                color: AppColors.textTertiary,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
