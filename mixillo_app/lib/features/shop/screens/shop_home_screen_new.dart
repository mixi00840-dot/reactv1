import 'package:flutter/material.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/common_widgets.dart';
import 'shopping_cart_screen.dart';

/// Modern E-commerce Shop Home Screen
class ShopHomeScreenNew extends StatefulWidget {
  const ShopHomeScreenNew({Key? key}) : super(key: key);

  @override
  State<ShopHomeScreenNew> createState() => _ShopHomeScreenNewState();
}

class _ShopHomeScreenNewState extends State<ShopHomeScreenNew> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  String _selectedCategory = 'All';

  final List<String> _categories = [
    'All',
    'Fashion',
    'Electronics',
    'Beauty',
    'Home',
    'Sports',
    'Books',
    'Toys',
  ];

  // Mock products
  final List<Map<String, dynamic>> _products = [
    {
      'id': '1',
      'name': 'Wireless Headphones Pro',
      'price': 89.99,
      'originalPrice': 129.99,
      'image': null,
      'rating': 4.5,
      'reviews': 128,
      'category': 'Electronics',
      'store': 'TechStore',
      'discount': 31,
      'isFeatured': true,
      'isTrending': true,
      'stock': 45,
    },
    {
      'id': '2',
      'name': 'Smart Watch Pro',
      'price': 199.99,
      'originalPrice': null,
      'image': null,
      'rating': 4.8,
      'reviews': 256,
      'category': 'Electronics',
      'store': 'WearablesTech',
      'discount': 0,
      'isFeatured': true,
      'stock': 23,
    },
    {
      'id': '3',
      'name': 'Designer Backpack',
      'price': 49.99,
      'originalPrice': 79.99,
      'image': null,
      'rating': 4.3,
      'reviews': 89,
      'category': 'Fashion',
      'store': 'FashionHub',
      'discount': 37,
      'isTrending': true,
      'stock': 67,
    },
    {
      'id': '4',
      'name': 'Organic Face Cream',
      'price': 29.99,
      'originalPrice': null,
      'image': null,
      'rating': 4.7,
      'reviews': 342,
      'category': 'Beauty',
      'store': 'BeautyNaturals',
      'discount': 0,
      'stock': 156,
    },
    {
      'id': '5',
      'name': 'Yoga Mat Premium',
      'price': 39.99,
      'originalPrice': 59.99,
      'image': null,
      'rating': 4.6,
      'reviews': 234,
      'category': 'Sports',
      'store': 'FitnessGear',
      'discount': 33,
      'isFeatured': true,
      'stock': 89,
    },
    {
      'id': '6',
      'name': 'LED Desk Lamp',
      'price': 34.99,
      'originalPrice': null,
      'image': null,
      'rating': 4.4,
      'reviews': 167,
      'category': 'Home',
      'store': 'HomeEssentials',
      'discount': 0,
      'stock': 112,
    },
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  List<Map<String, dynamic>> get _filteredProducts {
    var products = _products;

    if (_selectedCategory != 'All') {
      products = products.where((p) => p['category'] == _selectedCategory).toList();
    }

    if (_searchController.text.isNotEmpty) {
      final query = _searchController.text.toLowerCase();
      products = products
          .where((p) => (p['name'] as String).toLowerCase().contains(query))
          .toList();
    }

    return products;
  }

  List<Map<String, dynamic>> get _featuredProducts =>
      _products.where((p) => p['isFeatured'] == true).toList();

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? DesignTokens.darkBackground : DesignTokens.lightBackground,
      body: CustomScrollView(
        slivers: [
          _buildAppBar(isDark),
          SliverToBoxAdapter(child: _buildSearchBar(isDark)),
          SliverToBoxAdapter(child: _buildCategories(isDark)),
          SliverToBoxAdapter(child: _buildBanners(isDark)),
          SliverToBoxAdapter(child: _buildSectionHeader('Featured Products', () {})),
          SliverToBoxAdapter(child: _buildFeaturedProducts(isDark)),
          SliverToBoxAdapter(child: _buildSectionHeader('Trending Now', () {})),
          _buildProductsGrid(isDark),
        ],
      ),
    );
  }

  Widget _buildAppBar(bool isDark) {
    return SliverAppBar(
      backgroundColor: isDark ? DesignTokens.darkBackground : DesignTokens.lightBackground,
      elevation: 0,
      pinned: true,
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: DesignTokens.space2,
              vertical: DesignTokens.space1,
            ),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: DesignTokens.brandGradient),
              borderRadius: BorderRadius.circular(DesignTokens.radiusSm),
            ),
            child: const Icon(
              Icons.shopping_bag,
              color: DesignTokens.darkTextPrimary,
              size: 20,
            ),
          ),
          const SizedBox(width: DesignTokens.space2),
          Text(
            'Shop',
            style: AppTypography.h2(context).copyWith(
              fontWeight: DesignTokens.fontWeightBold,
            ),
          ),
        ],
      ),
      actions: [
        IconButton(
          icon: Stack(
            clipBehavior: Clip.none,
            children: [
              const Icon(Icons.shopping_cart_outlined),
              Positioned(
                right: -4,
                top: -4,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: DesignTokens.errorDefault,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isDark ? DesignTokens.darkBackground : DesignTokens.lightBackground,
                      width: 2,
                    ),
                  ),
                  constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                  child: Center(
                    child: Text(
                      '3',
                      style: AppTypography.labelSmall(context).copyWith(
                        color: DesignTokens.darkTextPrimary,
                        fontSize: 10,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const ShoppingCartScreen()),
            );
          },
        ),
        IconButton(
          icon: const Icon(Icons.favorite_border),
          onPressed: () {
            // Navigate to wishlist
          },
        ),
        const SizedBox(width: DesignTokens.space2),
      ],
    );
  }

  Widget _buildSearchBar(bool isDark) {
    return Padding(
      padding: const EdgeInsets.all(DesignTokens.space4),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: DesignTokens.space3),
        decoration: BoxDecoration(
          color: isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface,
          borderRadius: BorderRadius.circular(DesignTokens.radiusFull),
          border: Border.all(
            color: isDark ? DesignTokens.darkBorder : DesignTokens.lightBorder,
          ),
        ),
        child: Row(
          children: [
            Icon(
              Icons.search,
              color: isDark ? DesignTokens.darkTextSecondary : DesignTokens.lightTextSecondary,
            ),
            const SizedBox(width: DesignTokens.space2),
            Expanded(
              child: TextField(
                controller: _searchController,
                style: AppTypography.bodyMedium(context),
                decoration: InputDecoration(
                  hintText: 'Search products...',
                  hintStyle: AppTypography.bodyMedium(context).copyWith(
                    color: isDark ? DesignTokens.darkTextSecondary : DesignTokens.lightTextSecondary,
                  ),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(vertical: 12),
                ),
                onChanged: (value) => setState(() {}),
              ),
            ),
            Icon(
              Icons.tune,
              color: isDark ? DesignTokens.darkTextSecondary : DesignTokens.lightTextSecondary,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategories(bool isDark) {
    return SizedBox(
      height: 50,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: DesignTokens.space4),
        itemCount: _categories.length,
        itemBuilder: (context, index) {
          final category = _categories[index];
          final isSelected = _selectedCategory == category;

          return Padding(
            padding: const EdgeInsets.only(right: DesignTokens.space2),
            child: GestureDetector(
              onTap: () {
                setState(() {
                  _selectedCategory = category;
                });
              },
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: DesignTokens.space4,
                  vertical: DesignTokens.space2,
                ),
                decoration: BoxDecoration(
                  gradient: isSelected
                      ? LinearGradient(colors: DesignTokens.brandGradient)
                      : null,
                  color: isSelected
                      ? null
                      : (isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface),
                  borderRadius: BorderRadius.circular(DesignTokens.radiusFull),
                  border: Border.all(
                    color: isSelected
                        ? Colors.transparent
                        : (isDark ? DesignTokens.darkBorder : DesignTokens.lightBorder),
                  ),
                ),
                child: Center(
                  child: Text(
                    category,
                    style: AppTypography.labelLarge(context).copyWith(
                      color: isSelected
                          ? DesignTokens.darkTextPrimary
                          : (isDark ? DesignTokens.darkTextPrimary : DesignTokens.lightTextPrimary),
                      fontWeight: isSelected
                          ? DesignTokens.fontWeightBold
                          : DesignTokens.fontWeightMedium,
                    ),
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildBanners(bool isDark) {
    return Container(
      height: 180,
      margin: const EdgeInsets.all(DesignTokens.space4),
      child: PageView.builder(
        itemCount: 3,
        itemBuilder: (context, index) {
          return Container(
            margin: const EdgeInsets.symmetric(horizontal: DesignTokens.space2),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: index == 0
                    ? DesignTokens.brandGradient
                    : index == 1
                        ? DesignTokens.premiumGradient
                        : DesignTokens.liveGradient,
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(DesignTokens.radiusCard),
              boxShadow: [
                BoxShadow(
                  color: DesignTokens.brandPrimary.withOpacity(0.3),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Padding(
              padding: const EdgeInsets.all(DesignTokens.space4),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    index == 0
                        ? '🎉 Flash Sale'
                        : index == 1
                            ? '⭐ Premium Deals'
                            : '🔥 Hot Offers',
                    style: AppTypography.h2(context).copyWith(
                      color: DesignTokens.darkTextPrimary,
                      fontWeight: DesignTokens.fontWeightBold,
                    ),
                  ),
                  const SizedBox(height: DesignTokens.space2),
                  Text(
                    'Up to 50% OFF',
                    style: AppTypography.h3(context).copyWith(
                      color: DesignTokens.darkTextPrimary,
                    ),
                  ),
                  const Spacer(),
                  PrimaryButton(
                    text: 'Shop Now',
                    height: 36,
                    width: 120,
                    backgroundColor: DesignTokens.darkTextPrimary,
                    textColor: DesignTokens.brandPrimary,
                    gradient: null,
                    onPressed: () {},
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSectionHeader(String title, VoidCallback onSeeAll) {
    return Padding(
      padding: const EdgeInsets.all(DesignTokens.space4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: AppTypography.h3(context).copyWith(
              fontWeight: DesignTokens.fontWeightBold,
            ),
          ),
          GestureDetector(
            onTap: onSeeAll,
            child: Text(
              'See All',
              style: AppTypography.link(context),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeaturedProducts(bool isDark) {
    return SizedBox(
      height: 280,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: DesignTokens.space4),
        itemCount: _featuredProducts.length,
        itemBuilder: (context, index) {
          final product = _featuredProducts[index];
          return _buildProductCard(product, isDark, width: 200);
        },
      ),
    );
  }

  Widget _buildProductsGrid(bool isDark) {
    final products = _filteredProducts;

    return SliverPadding(
      padding: const EdgeInsets.all(DesignTokens.space4),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: DesignTokens.space3,
          crossAxisSpacing: DesignTokens.space3,
          childAspectRatio: 0.7,
        ),
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            final product = products[index];
            return _buildProductCard(product, isDark);
          },
          childCount: products.length,
        ),
      ),
    );
  }

  Widget _buildProductCard(Map<String, dynamic> product, bool isDark, {double? width}) {
    final hasDiscount = product['originalPrice'] != null;

    return GestureDetector(
      onTap: () {
        // TODO: Navigate to product details screen when ready
        // Navigator.push(context, MaterialPageRoute(builder: (_) => ProductDetailsScreen(product: product)));
      },
      child: Container(
        width: width,
        margin: const EdgeInsets.only(right: DesignTokens.space2),
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
            // Product Image
            Stack(
              children: [
                Container(
                  height: 160,
                  decoration: BoxDecoration(
                    color: isDark ? DesignTokens.darkBackground : DesignTokens.lightBackground,
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(DesignTokens.radiusCard),
                    ),
                  ),
                  child: Center(
                    child: Icon(
                      Icons.shopping_bag_outlined,
                      size: 64,
                      color: (isDark ? DesignTokens.darkTextPrimary : DesignTokens.lightTextPrimary)
                          .withOpacity(0.3),
                    ),
                  ),
                ),
                
                // Discount Badge
                if (hasDiscount)
                  Positioned(
                    top: DesignTokens.space2,
                    left: DesignTokens.space2,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: DesignTokens.space2,
                        vertical: DesignTokens.space1,
                      ),
                      decoration: BoxDecoration(
                        color: DesignTokens.errorDefault,
                        borderRadius: BorderRadius.circular(DesignTokens.radiusSm),
                      ),
                      child: Text(
                        '-${product['discount']}%',
                        style: AppTypography.labelSmall(context).copyWith(
                          color: DesignTokens.darkTextPrimary,
                          fontWeight: DesignTokens.fontWeightBold,
                        ),
                      ),
                    ),
                  ),
                
                // Favorite Button
                Positioned(
                  top: DesignTokens.space2,
                  right: DesignTokens.space2,
                  child: GestureDetector(
                    onTap: () {},
                    child: Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: (isDark ? DesignTokens.darkBackground : DesignTokens.lightBackground)
                            .withOpacity(0.8),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.favorite_border,
                        size: 18,
                        color: DesignTokens.likeRed,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            
            // Product Info
            Padding(
              padding: const EdgeInsets.all(DesignTokens.space3),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product['name'],
                    style: AppTypography.titleSmall(context),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: DesignTokens.space1),
                  
                  // Rating
                  Row(
                    children: [
                      const Icon(
                        Icons.star,
                        size: 16,
                        color: DesignTokens.bookmarkYellow,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${product['rating']}',
                        style: AppTypography.labelSmall(context).copyWith(
                          fontWeight: DesignTokens.fontWeightSemiBold,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '(${product['reviews']})',
                        style: AppTypography.labelSmall(context).copyWith(
                          color: isDark ? DesignTokens.darkTextSecondary : DesignTokens.lightTextSecondary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: DesignTokens.space2),
                  
                  // Price
                  Row(
                    children: [
                      Text(
                        '\$${product['price']}',
                        style: AppTypography.titleMedium(context).copyWith(
                          fontWeight: DesignTokens.fontWeightBold,
                          color: DesignTokens.brandPrimary,
                        ),
                      ),
                      if (hasDiscount) ...[
                        const SizedBox(width: DesignTokens.space2),
                        Text(
                          '\$${product['originalPrice']}',
                          style: AppTypography.labelSmall(context).copyWith(
                            decoration: TextDecoration.lineThrough,
                            color: isDark ? DesignTokens.darkTextSecondary : DesignTokens.lightTextSecondary,
                          ),
                        ),
                      ],
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
}
