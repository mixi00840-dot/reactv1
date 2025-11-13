import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../../../core/theme/app_colors.dart';
import '../constants/shop_constants.dart';

/// Shimmer loading effect for product cards
class ProductCardShimmer extends StatelessWidget {
  const ProductCardShimmer({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(ShopConstants.defaultBorderRadius),
      ),
      child: Shimmer.fromColors(
        baseColor: AppColors.surface,
        highlightColor: AppColors.background,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image placeholder
            Container(
              height: 180,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(
                  top: Radius.circular(ShopConstants.defaultBorderRadius),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(ShopConstants.defaultPaddingSmall),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title placeholder
                  Container(
                    width: double.infinity,
                    height: 16,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(height: 8),
                  // Price placeholder
                  Container(
                    width: 80,
                    height: 14,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(height: 8),
                  // Rating placeholder
                  Row(
                    children: List.generate(
                      5,
                      (index) => const Padding(
                        padding: EdgeInsets.only(right: 2),
                        child: Icon(
                          Icons.star,
                          size: 14,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Shimmer loading grid for products
class ProductGridShimmer extends StatelessWidget {
  final int itemCount;

  const ProductGridShimmer({
    Key? key,
    this.itemCount = 6,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.all(ShopConstants.defaultPadding),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.7,
        crossAxisSpacing: ShopConstants.defaultPadding,
        mainAxisSpacing: ShopConstants.defaultPadding,
      ),
      itemCount: itemCount,
      itemBuilder: (context, index) => const ProductCardShimmer(),
    );
  }
}

/// Shimmer loading for list items
class ListItemShimmer extends StatelessWidget {
  const ListItemShimmer({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(
        horizontal: ShopConstants.defaultPadding,
        vertical: ShopConstants.defaultPaddingSmall,
      ),
      padding: const EdgeInsets.all(ShopConstants.defaultPadding),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(ShopConstants.defaultBorderRadius),
      ),
      child: Shimmer.fromColors(
        baseColor: AppColors.surface,
        highlightColor: AppColors.background,
        child: Row(
          children: [
            // Image placeholder
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(ShopConstants.defaultBorderRadiusSmall),
              ),
            ),
            const SizedBox(width: ShopConstants.defaultPadding),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: double.infinity,
                    height: 16,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    width: 120,
                    height: 14,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    width: 80,
                    height: 14,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Shimmer loading for horizontal product list
class HorizontalProductShimmer extends StatelessWidget {
  const HorizontalProductShimmer({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 280,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: ShopConstants.defaultPadding),
        itemCount: 3,
        itemBuilder: (context, index) => Container(
          width: 160,
          margin: const EdgeInsets.only(right: ShopConstants.defaultPadding),
          child: const ProductCardShimmer(),
        ),
      ),
    );
  }
}

/// Shimmer loading for category chips
class CategoryChipsShimmer extends StatelessWidget {
  const CategoryChipsShimmer({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppColors.surface,
      highlightColor: AppColors.background,
      child: SizedBox(
        height: 40,
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: ShopConstants.defaultPadding),
          itemCount: 5,
          itemBuilder: (context, index) => Container(
            margin: const EdgeInsets.only(right: ShopConstants.defaultPaddingSmall),
            padding: const EdgeInsets.symmetric(
              horizontal: ShopConstants.defaultPadding,
              vertical: ShopConstants.defaultPaddingSmall,
            ),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
            ),
            child: const SizedBox(width: 60),
          ),
        ),
      ),
    );
  }
}

/// Shimmer loading for banner
class BannerShimmer extends StatelessWidget {
  final double height;

  const BannerShimmer({
    Key? key,
    this.height = 120,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: ShopConstants.defaultPadding),
      child: Shimmer.fromColors(
        baseColor: AppColors.surface,
        highlightColor: AppColors.background,
        child: Container(
          height: height,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(ShopConstants.defaultBorderRadius),
          ),
        ),
      ),
    );
  }
}
