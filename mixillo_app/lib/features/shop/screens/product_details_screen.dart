import 'package:flutter/material.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/common_widgets.dart';

/// Product Details Screen - Instagram/TikTok Shop style
class ProductDetailsScreen extends StatefulWidget {
  final Map<String, dynamic> product;

  const ProductDetailsScreen({
    Key? key,
    required this.product,
  }) : super(key: key);

  @override
  State<ProductDetailsScreen> createState() => _ProductDetailsScreenState();
}

class _ProductDetailsScreenState extends State<ProductDetailsScreen> {
  int _currentImageIndex = 0;
  int _quantity = 1;
  String? _selectedSize;
  String? _selectedColor;

  final List<String> _sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  final List<Color> _colors = [
    Colors.black,
    Colors.white,
    Colors.red,
    Colors.blue,
    Colors.green,
  ];

  final List<Map<String, dynamic>> _similarProducts = [
    {'id': '1', 'name': 'Similar Product 1', 'price': 45.99, 'rating': 4.5},
    {'id': '2', 'name': 'Similar Product 2', 'price': 67.99, 'rating': 4.3},
    {'id': '3', 'name': 'Similar Product 3', 'price': 89.99, 'rating': 4.7},
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? DesignTokens.darkBackground : DesignTokens.lightBackground,
      body: CustomScrollView(
        slivers: [
          _buildAppBar(isDark),
          SliverToBoxAdapter(child: _buildImageCarousel(isDark)),
          SliverToBoxAdapter(child: _buildProductInfo(isDark)),
          SliverToBoxAdapter(child: _buildVariants(isDark)),
          SliverToBoxAdapter(child: _buildQuantitySelector(isDark)),
          SliverToBoxAdapter(child: _buildDescription(isDark)),
          SliverToBoxAdapter(child: _buildSellerInfo(isDark)),
          SliverToBoxAdapter(child: _buildReviews(isDark)),
          SliverToBoxAdapter(child: _buildSimilarProducts(isDark)),
          const SliverToBoxAdapter(child: SizedBox(height: 100)),
        ],
      ),
      bottomNavigationBar: _buildBottomBar(isDark),
    );
  }

  Widget _buildAppBar(bool isDark) {
    return SliverAppBar(
      backgroundColor: isDark ? DesignTokens.darkBackground : DesignTokens.lightBackground,
      elevation: 0,
      pinned: true,
      leading: IconButton(
        icon: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: (isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface).withOpacity(0.8),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.arrow_back),
        ),
        onPressed: () => Navigator.pop(context),
      ),
      actions: [
        IconButton(
          icon: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: (isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface).withOpacity(0.8),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.share),
          ),
          onPressed: () {},
        ),
        IconButton(
          icon: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: (isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface).withOpacity(0.8),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.favorite_border),
          ),
          onPressed: () {},
        ),
        const SizedBox(width: DesignTokens.space2),
      ],
    );
  }

  Widget _buildImageCarousel(bool isDark) {
    return Container(
      height: 400,
      color: isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface,
      child: Stack(
        children: [
          PageView.builder(
            itemCount: 3,
            onPageChanged: (index) {
              setState(() {
                _currentImageIndex = index;
              });
            },
            itemBuilder: (context, index) {
              return Container(
                color: isDark ? DesignTokens.darkBackground : DesignTokens.lightBackground,
                child: Center(
                  child: Icon(
                    Icons.shopping_bag_outlined,
                    size: 120,
                    color: (isDark ? DesignTokens.darkTextPrimary : DesignTokens.lightTextPrimary)
                        .withOpacity(0.3),
                  ),
                ),
              );
            },
          ),

          // Page Indicator
          Positioned(
            bottom: DesignTokens.space4,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                3,
                (index) => Container(
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: index == _currentImageIndex ? 24 : 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: index == _currentImageIndex
                        ? DesignTokens.brandPrimary
                        : (isDark ? DesignTokens.darkTextSecondary : DesignTokens.lightTextSecondary)
                            .withOpacity(0.5),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
            ),
          ),

          // Discount Badge
          if (widget.product['originalPrice'] != null)
            Positioned(
              top: DesignTokens.space4,
              left: DesignTokens.space4,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: DesignTokens.space3,
                  vertical: DesignTokens.space2,
                ),
                decoration: BoxDecoration(
                  color: DesignTokens.errorDefault,
                  borderRadius: BorderRadius.circular(DesignTokens.radiusSm),
                ),
                child: Text(
                  '-${widget.product['discount']}% OFF',
                  style: AppTypography.labelLarge(context).copyWith(
                    color: DesignTokens.darkTextPrimary,
                    fontWeight: DesignTokens.fontWeightBold,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildProductInfo(bool isDark) {
    return Padding(
      padding: const EdgeInsets.all(DesignTokens.space4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Price
          Row(
            children: [
              Text(
                '\$${widget.product['price']}',
                style: AppTypography.h1(context).copyWith(
                  color: DesignTokens.brandPrimary,
                  fontWeight: DesignTokens.fontWeightBold,
                ),
              ),
              if (widget.product['originalPrice'] != null) ...[
                const SizedBox(width: DesignTokens.space3),
                Text(
                  '\$${widget.product['originalPrice']}',
                  style: AppTypography.titleMedium(context).copyWith(
                    decoration: TextDecoration.lineThrough,
                    color: isDark ? DesignTokens.darkTextSecondary : DesignTokens.lightTextSecondary,
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: DesignTokens.space2),

          // Title
          Text(
            widget.product['name'],
            style: AppTypography.h2(context).copyWith(
              fontWeight: DesignTokens.fontWeightBold,
            ),
          ),
          const SizedBox(height: DesignTokens.space3),

          // Rating & Stock
          Row(
            children: [
              const Icon(
                Icons.star,
                size: 20,
                color: DesignTokens.bookmarkYellow,
              ),
              const SizedBox(width: 4),
              Text(
                '${widget.product['rating']}',
                style: AppTypography.titleSmall(context).copyWith(
                  fontWeight: DesignTokens.fontWeightSemiBold,
                ),
              ),
              const SizedBox(width: 4),
              Text(
                '(${widget.product['reviews']} reviews)',
                style: AppTypography.bodyMedium(context).copyWith(
                  color: isDark ? DesignTokens.darkTextSecondary : DesignTokens.lightTextSecondary,
                ),
              ),
              const SizedBox(width: DesignTokens.space3),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: DesignTokens.space2,
                  vertical: DesignTokens.space1,
                ),
                decoration: BoxDecoration(
                  color: DesignTokens.successDefault.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(DesignTokens.radiusSm),
                  border: Border.all(color: DesignTokens.successDefault),
                ),
                child: Text(
                  '${widget.product['stock']} in stock',
                  style: AppTypography.labelSmall(context).copyWith(
                    color: DesignTokens.successDefault,
                    fontWeight: DesignTokens.fontWeightSemiBold,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildVariants(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Size Selector
        Padding(
          padding: const EdgeInsets.all(DesignTokens.space4),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Size',
                style: AppTypography.titleMedium(context).copyWith(
                  fontWeight: DesignTokens.fontWeightBold,
                ),
              ),
              const SizedBox(height: DesignTokens.space3),
              Wrap(
                spacing: DesignTokens.space2,
                runSpacing: DesignTokens.space2,
                children: _sizes.map((size) {
                  final isSelected = _selectedSize == size;
                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        _selectedSize = size;
                      });
                    },
                    child: Container(
                      width: 60,
                      height: 44,
                      decoration: BoxDecoration(
                        color: isSelected
                            ? DesignTokens.brandPrimary
                            : (isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface),
                        borderRadius: BorderRadius.circular(DesignTokens.radiusSm),
                        border: Border.all(
                          color: isSelected
                              ? DesignTokens.brandPrimary
                              : (isDark ? DesignTokens.darkBorder : DesignTokens.lightBorder),
                        ),
                      ),
                      child: Center(
                        child: Text(
                          size,
                          style: AppTypography.labelLarge(context).copyWith(
                            color: isSelected
                                ? DesignTokens.darkTextPrimary
                                : (isDark ? DesignTokens.darkTextPrimary : DesignTokens.lightTextPrimary),
                            fontWeight: DesignTokens.fontWeightSemiBold,
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          ),
        ),

        // Color Selector
        Padding(
          padding: const EdgeInsets.all(DesignTokens.space4),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Color',
                style: AppTypography.titleMedium(context).copyWith(
                  fontWeight: DesignTokens.fontWeightBold,
                ),
              ),
              const SizedBox(height: DesignTokens.space3),
              Wrap(
                spacing: DesignTokens.space2,
                children: _colors.map((color) {
                  final isSelected = _selectedColor == color.toString();
                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        _selectedColor = color.toString();
                      });
                    },
                    child: Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: color,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: isSelected
                              ? DesignTokens.brandPrimary
                              : (isDark ? DesignTokens.darkBorder : DesignTokens.lightBorder),
                          width: isSelected ? 3 : 1,
                        ),
                      ),
                      child: isSelected
                          ? const Icon(
                              Icons.check,
                              color: Colors.white,
                              size: 20,
                            )
                          : null,
                    ),
                  );
                }).toList(),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildQuantitySelector(bool isDark) {
    return Padding(
      padding: const EdgeInsets.all(DesignTokens.space4),
      child: Row(
        children: [
          Text(
            'Quantity',
            style: AppTypography.titleMedium(context).copyWith(
              fontWeight: DesignTokens.fontWeightBold,
            ),
          ),
          const Spacer(),
          Row(
            children: [
              _buildQuantityButton(
                icon: Icons.remove,
                onTap: () {
                  if (_quantity > 1) {
                    setState(() {
                      _quantity--;
                    });
                  }
                },
                isDark: isDark,
              ),
              Container(
                width: 60,
                height: 44,
                margin: const EdgeInsets.symmetric(horizontal: DesignTokens.space2),
                decoration: BoxDecoration(
                  color: isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface,
                  borderRadius: BorderRadius.circular(DesignTokens.radiusSm),
                  border: Border.all(
                    color: isDark ? DesignTokens.darkBorder : DesignTokens.lightBorder,
                  ),
                ),
                child: Center(
                  child: Text(
                    '$_quantity',
                    style: AppTypography.titleMedium(context).copyWith(
                      fontWeight: DesignTokens.fontWeightBold,
                    ),
                  ),
                ),
              ),
              _buildQuantityButton(
                icon: Icons.add,
                onTap: () {
                  if (_quantity < (widget.product['stock'] ?? 99)) {
                    setState(() {
                      _quantity++;
                    });
                  }
                },
                isDark: isDark,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuantityButton({
    required IconData icon,
    required VoidCallback onTap,
    required bool isDark,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface,
          borderRadius: BorderRadius.circular(DesignTokens.radiusSm),
          border: Border.all(
            color: isDark ? DesignTokens.darkBorder : DesignTokens.lightBorder,
          ),
        ),
        child: Icon(
          icon,
          color: isDark ? DesignTokens.darkTextPrimary : DesignTokens.lightTextPrimary,
        ),
      ),
    );
  }

  Widget _buildDescription(bool isDark) {
    return Padding(
      padding: const EdgeInsets.all(DesignTokens.space4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Description',
            style: AppTypography.titleMedium(context).copyWith(
              fontWeight: DesignTokens.fontWeightBold,
            ),
          ),
          const SizedBox(height: DesignTokens.space3),
          Text(
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
            style: AppTypography.bodyMedium(context),
          ),
        ],
      ),
    );
  }

  Widget _buildSellerInfo(bool isDark) {
    return Padding(
      padding: const EdgeInsets.all(DesignTokens.space4),
      child: Container(
        padding: const EdgeInsets.all(DesignTokens.space4),
        decoration: BoxDecoration(
          color: isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface,
          borderRadius: BorderRadius.circular(DesignTokens.radiusCard),
          border: Border.all(
            color: isDark ? DesignTokens.darkBorder : DesignTokens.lightBorder,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: DesignTokens.brandGradient),
                shape: BoxShape.circle,
              ),
              child: const Center(
                child: Icon(
                  Icons.store,
                  color: DesignTokens.darkTextPrimary,
                  size: 28,
                ),
              ),
            ),
            const SizedBox(width: DesignTokens.space3),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.product['store'] ?? 'Store Name',
                    style: AppTypography.titleMedium(context).copyWith(
                      fontWeight: DesignTokens.fontWeightBold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(
                        Icons.star,
                        size: 16,
                        color: DesignTokens.bookmarkYellow,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '4.8 (1.2K reviews)',
                        style: AppTypography.labelSmall(context),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            PrimaryButton(
              text: 'Visit',
              height: 36,
              width: 80,
              gradient: null,
              backgroundColor: isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface,
              textColor: DesignTokens.brandPrimary,
              onPressed: () {},
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReviews(bool isDark) {
    return Padding(
      padding: const EdgeInsets.all(DesignTokens.space4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Reviews (${widget.product['reviews']})',
                style: AppTypography.titleMedium(context).copyWith(
                  fontWeight: DesignTokens.fontWeightBold,
                ),
              ),
              GestureDetector(
                onTap: () {},
                child: Text(
                  'See All',
                  style: AppTypography.link(context),
                ),
              ),
            ],
          ),
          const SizedBox(height: DesignTokens.space3),
          
          // Review Item
          Container(
            padding: const EdgeInsets.all(DesignTokens.space3),
            decoration: BoxDecoration(
              color: isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface,
              borderRadius: BorderRadius.circular(DesignTokens.radiusCard),
              border: Border.all(
                color: isDark ? DesignTokens.darkBorder : DesignTokens.lightBorder,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(colors: DesignTokens.premiumGradient),
                        shape: BoxShape.circle,
                      ),
                      child: const Center(
                        child: Icon(
                          Icons.person,
                          color: DesignTokens.darkTextPrimary,
                          size: 20,
                        ),
                      ),
                    ),
                    const SizedBox(width: DesignTokens.space2),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'John Doe',
                            style: AppTypography.titleSmall(context).copyWith(
                              fontWeight: DesignTokens.fontWeightSemiBold,
                            ),
                          ),
                          Row(
                            children: List.generate(
                              5,
                              (index) => const Icon(
                                Icons.star,
                                size: 14,
                                color: DesignTokens.bookmarkYellow,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      '2 days ago',
                      style: AppTypography.labelSmall(context).copyWith(
                        color: isDark ? DesignTokens.darkTextSecondary : DesignTokens.lightTextSecondary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: DesignTokens.space2),
                Text(
                  'Great product! Highly recommended. The quality is amazing and delivery was super fast.',
                  style: AppTypography.bodyMedium(context),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSimilarProducts(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.all(DesignTokens.space4),
          child: Text(
            'Similar Products',
            style: AppTypography.titleMedium(context).copyWith(
              fontWeight: DesignTokens.fontWeightBold,
            ),
          ),
        ),
        SizedBox(
          height: 240,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: DesignTokens.space4),
            itemCount: _similarProducts.length,
            itemBuilder: (context, index) {
              final product = _similarProducts[index];
              return Container(
                width: 160,
                margin: const EdgeInsets.only(right: DesignTokens.space3),
                decoration: BoxDecoration(
                  color: isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface,
                  borderRadius: BorderRadius.circular(DesignTokens.radiusCard),
                  border: Border.all(
                    color: isDark ? DesignTokens.darkBorder : DesignTokens.lightBorder,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      height: 140,
                      decoration: BoxDecoration(
                        color: isDark ? DesignTokens.darkBackground : DesignTokens.lightBackground,
                        borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(DesignTokens.radiusCard),
                        ),
                      ),
                      child: Center(
                        child: Icon(
                          Icons.shopping_bag_outlined,
                          size: 48,
                          color: (isDark ? DesignTokens.darkTextPrimary : DesignTokens.lightTextPrimary)
                              .withOpacity(0.3),
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(DesignTokens.space2),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            product['name'],
                            style: AppTypography.labelLarge(context),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(
                                Icons.star,
                                size: 14,
                                color: DesignTokens.bookmarkYellow,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                '${product['rating']}',
                                style: AppTypography.labelSmall(context),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '\$${product['price']}',
                            style: AppTypography.titleSmall(context).copyWith(
                              color: DesignTokens.brandPrimary,
                              fontWeight: DesignTokens.fontWeightBold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildBottomBar(bool isDark) {
    return Container(
      padding: EdgeInsets.only(
        left: DesignTokens.space4,
        right: DesignTokens.space4,
        top: DesignTokens.space3,
        bottom: DesignTokens.space3 + MediaQuery.of(context).padding.bottom,
      ),
      decoration: BoxDecoration(
        color: isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface,
        border: Border(
          top: BorderSide(
            color: isDark ? DesignTokens.darkBorder : DesignTokens.lightBorder,
          ),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: PrimaryButton(
              text: 'Add to Cart',
              gradient: null,
              backgroundColor: isDark ? DesignTokens.darkBackground : DesignTokens.lightBackground,
              textColor: DesignTokens.brandPrimary,
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Added $_quantity item(s) to cart'),
                    behavior: SnackBarBehavior.floating,
                    backgroundColor: DesignTokens.successDefault,
                  ),
                );
              },
            ),
          ),
          const SizedBox(width: DesignTokens.space3),
          Expanded(
            child: PrimaryButton(
              text: 'Buy Now',
              onPressed: () {},
            ),
          ),
        ],
      ),
    );
  }
}
