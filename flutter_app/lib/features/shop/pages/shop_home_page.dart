import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../constants/shop_constants.dart';
import '../widgets/product_card.dart';
import '../widgets/error_widgets.dart';
import '../widgets/banners/banner_m_with_image.dart';
import '../widgets/banners/banner_s_with_image.dart';
import '../widgets/banners/banner_m_with_counter.dart';
import '../models/product_model_simple.dart';
import '../providers/product_provider.dart';
import '../providers/cart_state_provider.dart';

/// Main shop home page with search, categories, products, and promotional banners
/// Matches e-commerce UI kit design with purple theme
class ShopHomePage extends ConsumerStatefulWidget {
  const ShopHomePage({Key? key}) : super(key: key);

  @override
  ConsumerState<ShopHomePage> createState() => _ShopHomePageState();
}

class _ShopHomePageState extends ConsumerState<ShopHomePage> {
  String _selectedCategory = 'All';

  final List<String> _categories = [
    'All',
    'Electronics',
    'Fashion',
    'Home',
    'Beauty',
    'Sports',
    'Books',
    'Toys',
  ];

  @override
  void initState() {
    super.initState();
    // Load initial category products
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_selectedCategory != 'All') {
        ref.read(productsByCategoryProvider.notifier)
            .loadProducts(_selectedCategory);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // App Bar
            _buildAppBar(),
            
            // Search Bar
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(ShopConstants.defaultPadding),
                child: _buildSearchBar(),
              ),
            ),
            
            // Flash Sale Banner
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: ShopConstants.defaultPadding,
                ),
                child: BannerMWithCounter(
                  imageUrl: 'https://via.placeholder.com/400x120/7B61FF/FFFFFF?text=Flash+Sale',
                  title: '🔥 Flash Sale',
                  subtitle: 'Up to 50% OFF',
                  endTime: DateTime.now().add(const Duration(hours: 12)),
                  overlayColor: AppColors.primary,
                  onTap: () {
                    // Navigate to flash sale page
                  },
                ),
              ),
            ),
            
            const SliverToBoxAdapter(
              child: SizedBox(height: ShopConstants.defaultPaddingLarge),
            ),
            
            // Categories
            SliverToBoxAdapter(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: ShopConstants.defaultPadding,
                    ),
                    child: Text(
                      'Categories',
                      style: ShopConstants.sectionTitleStyle,
                    ),
                  ),
                  const SizedBox(height: ShopConstants.defaultPadding),
                  _buildCategoriesRow(),
                ],
              ),
            ),
            
            const SliverToBoxAdapter(
              child: SizedBox(height: ShopConstants.defaultPaddingLarge),
            ),
            
            // Small Banners Row
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: ShopConstants.defaultPadding,
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: BannerSWithImage(
                        imageUrl: 'https://via.placeholder.com/200x80/7B61FF/FFFFFF?text=New+Arrivals',
                        title: 'New Arrivals',
                        overlayColor: AppColors.primary,
                        onTap: () {
                          // Navigate to new arrivals
                        },
                      ),
                    ),
                    const SizedBox(width: ShopConstants.defaultPadding),
                    Expanded(
                      child: BannerSWithImage(
                        imageUrl: 'https://via.placeholder.com/200x80/EA5B5B/FFFFFF?text=Trending',
                        title: '🔥 Trending',
                        overlayColor: AppColors.accent,
                        onTap: () {
                          // Navigate to trending
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            const SliverToBoxAdapter(
              child: SizedBox(height: ShopConstants.defaultPaddingLarge),
            ),
            
            // Featured Products Section
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: ShopConstants.defaultPadding,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Featured Products',
                      style: ShopConstants.sectionTitleStyle,
                    ),
                    TextButton(
                      onPressed: () {
                        // Navigate to all products
                      },
                      child: const Text(
                        'See All',
                        style: TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            // Products Grid
            _buildProductsGrid(),
            
            const SliverToBoxAdapter(
              child: SizedBox(height: ShopConstants.defaultPaddingLarge),
            ),
            
            // Medium Banner
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: ShopConstants.defaultPadding,
                ),
                child: BannerMWithImage(
                  imageUrl: 'https://via.placeholder.com/400x120/2ED573/FFFFFF?text=Free+Shipping',
                  title: 'Free Shipping',
                  subtitle: 'On orders over \$50',
                  buttonText: 'Shop Now',
                  overlayColor: AppColors.success,
                  onTap: () {
                    // Navigate to promotions
                  },
                ),
              ),
            ),
            
            const SliverToBoxAdapter(
              child: SizedBox(height: ShopConstants.defaultPaddingLarge),
            ),
            
            // Popular Products Section
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: ShopConstants.defaultPadding,
                ),
                child: Text(
                  'Popular Products',
                  style: ShopConstants.sectionTitleStyle,
                ),
              ),
            ),
            
            const SliverToBoxAdapter(
              child: SizedBox(height: ShopConstants.defaultPadding),
            ),
            
            // Popular Products Grid
            _buildPopularProductsGrid(),
            
            // Bottom Padding
            const SliverToBoxAdapter(
              child: SizedBox(height: 100), // Space for bottom navigation
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAppBar() {
    return SliverAppBar(
      floating: true,
      backgroundColor: AppColors.background,
      elevation: 0,
      title: const Text(
        'Shop',
        style: TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.bold,
          color: AppColors.textPrimary,
        ),
      ),
      actions: [
        // Cart icon with badge
        IconButton(
          onPressed: () {
            // Navigate to cart
          },
          icon: Stack(
            children: [
              const Icon(
                Icons.shopping_cart_outlined,
                color: AppColors.textPrimary,
              ),
              // Cart item count badge
              Consumer(
                builder: (context, ref, child) {
                  final cartCount = ref.watch(cartItemCountProvider);
                  if (cartCount == 0) return const SizedBox.shrink();
                  
                  return Positioned(
                    right: 0,
                    top: 0,
                    child: Container(
                      padding: const EdgeInsets.all(2),
                      decoration: const BoxDecoration(
                        color: AppColors.accent,
                        shape: BoxShape.circle,
                      ),
                      constraints: const BoxConstraints(
                        minWidth: 16,
                        minHeight: 16,
                      ),
                      child: Text(
                        cartCount > 99 ? '99+' : '$cartCount',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
        IconButton(
          onPressed: () {
            // Navigate to notifications
          },
          icon: const Icon(
            Icons.notifications_outlined,
            color: AppColors.textPrimary,
          ),
        ),
      ],
    );
  }

  Widget _buildSearchBar() {
    return GestureDetector(
      onTap: () {
        // Navigate to search page
        Navigator.pushNamed(context, '/shop/search');
      },
      child: Container(
        height: 48,
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
            const Padding(
              padding: EdgeInsets.symmetric(
                horizontal: ShopConstants.defaultPadding,
              ),
              child: Icon(
                Icons.search,
                color: AppColors.textSecondary,
              ),
            ),
            const Expanded(
              child: Text(
                'Search products...',
                style: TextStyle(
                  color: AppColors.textTertiary,
                  fontSize: 14,
                ),
              ),
            ),
            const SizedBox(width: ShopConstants.defaultPadding),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoriesRow() {
    return SizedBox(
      height: 40,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(
          horizontal: ShopConstants.defaultPadding,
        ),
        itemCount: _categories.length,
        itemBuilder: (context, index) {
          final category = _categories[index];
          final isSelected = category == _selectedCategory;
          
          return Padding(
            padding: const EdgeInsets.only(
              right: ShopConstants.defaultPaddingSmall,
            ),
            child: GestureDetector(
              onTap: () {
                setState(() {
                  _selectedCategory = category;
                  // Load products for selected category
                  if (category != 'All') {
                    ref.read(productsByCategoryProvider.notifier)
                        .loadProducts(category);
                  }
                });
              },
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: ShopConstants.defaultPadding,
                  vertical: ShopConstants.defaultPaddingSmall,
                ),
                decoration: BoxDecoration(
                  color: isSelected ? AppColors.primary : AppColors.surface,
                  borderRadius: BorderRadius.circular(
                    ShopConstants.defaultBorderRadiusCircular,
                  ),
                  border: Border.all(
                    color: isSelected ? AppColors.primary : AppColors.border,
                    width: 1,
                  ),
                ),
                child: Center(
                  child: Text(
                    category,
                    style: ShopConstants.categoryTextStyle.copyWith(
                      color: isSelected
                          ? Colors.white
                          : AppColors.textPrimary,
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

  Widget _buildProductsGrid() {
    // Get products based on selected category
    if (_selectedCategory == 'All') {
      // Show featured products for "All" category
      final productsAsync = ref.watch(featuredProductsProvider);
      
      return productsAsync.when(
        data: (products) => _buildProductsGridContent(products),
        loading: () => _buildLoadingGrid(),
        error: (error, stack) => _buildErrorGrid(error.toString()),
      );
    } else {
      // Show category-specific products
      final productsAsync = ref.watch(productsByCategoryProvider);
      
      return productsAsync.when(
        data: (products) => _buildProductsGridContent(products),
        loading: () => _buildLoadingGrid(),
        error: (error, stack) => _buildErrorGrid(error.toString()),
      );
    }
  }

  Widget _buildProductsGridContent(List<Product> products) {
    if (products.isEmpty) {
      return SliverToBoxAdapter(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(ShopConstants.defaultPaddingLarge),
            child: Column(
              children: [
                Icon(
                  Icons.inventory_2_outlined,
                  size: 64,
                  color: AppColors.textTertiary,
                ),
                const SizedBox(height: ShopConstants.defaultPadding),
                Text(
                  'No products found',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: ShopConstants.defaultPaddingSmall),
                Text(
                  'Try selecting a different category',
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return SliverPadding(
      padding: const EdgeInsets.symmetric(
        horizontal: ShopConstants.defaultPadding,
      ),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: ShopConstants.productGridCrossAxisCount,
          crossAxisSpacing: ShopConstants.productGridCrossAxisSpacing,
          mainAxisSpacing: ShopConstants.productGridMainAxisSpacing,
          childAspectRatio: ShopConstants.productGridChildAspectRatio,
        ),
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            final product = products[index];
            return ProductCard(
              imageUrl: product.images.isNotEmpty 
                  ? product.images.first 
                  : 'https://via.placeholder.com/140x140/7B61FF/FFFFFF?text=${Uri.encodeComponent(product.title)}',
              title: product.title,
              price: product.price,
              originalPrice: product.originalPrice > 0 
                  ? product.originalPrice 
                  : product.price,
              discountPercent: product.originalPrice > 0
                  ? ((product.originalPrice - product.price) / product.originalPrice * 100).round()
                  : 0,
              rating: product.rating,
              reviewCount: product.reviewCount,
              onTap: () {
                // Navigate to product details
                // Navigator.push(
                //   context,
                //   MaterialPageRoute(
                //     builder: (_) => ProductDetailsPage(productId: product.id),
                //   ),
                // );
              },
              onFavoriteToggle: () {
                // Toggle favorite
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Favorite feature coming soon!'),
                    duration: Duration(seconds: 1),
                  ),
                );
              },
            );
          },
          childCount: products.length,
        ),
      ),
    );
  }

  Widget _buildPopularProductsGrid() {
    // Show featured products as popular products
    final productsAsync = ref.watch(featuredProductsProvider);
    
    return productsAsync.when(
      data: (products) {
        // Take only first 4 for popular section
        final popularProducts = products.take(4).toList();
        
        if (popularProducts.isEmpty) {
          return const SliverToBoxAdapter(child: SizedBox.shrink());
        }
        
        return SliverPadding(
          padding: const EdgeInsets.symmetric(
            horizontal: ShopConstants.defaultPadding,
          ),
          sliver: SliverGrid(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: ShopConstants.productGridCrossAxisCount,
              crossAxisSpacing: ShopConstants.productGridCrossAxisSpacing,
              mainAxisSpacing: ShopConstants.productGridMainAxisSpacing,
              childAspectRatio: ShopConstants.productGridChildAspectRatio,
            ),
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final product = popularProducts[index];
                return ProductCard(
                  imageUrl: product.images.isNotEmpty 
                      ? product.images.first 
                      : 'https://via.placeholder.com/140x140/EA5B5B/FFFFFF?text=${Uri.encodeComponent(product.title)}',
                  title: product.title,
                  price: product.price,
                  originalPrice: product.originalPrice > 0 
                      ? product.originalPrice 
                      : product.price,
                  discountPercent: product.originalPrice > 0
                      ? ((product.originalPrice - product.price) / product.originalPrice * 100).round()
                      : 0,
                  rating: product.rating,
                  reviewCount: product.reviewCount,
                  onTap: () {
                    // Navigate to product details
                  },
                  onFavoriteToggle: () {
                    // Toggle favorite
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Favorite feature coming soon!'),
                        duration: Duration(seconds: 1),
                      ),
                    );
                  },
                );
              },
              childCount: popularProducts.length,
            ),
          ),
        );
      },
      loading: () => _buildLoadingGrid(),
      error: (error, stack) => const SliverToBoxAdapter(child: SizedBox.shrink()),
    );
  }

  Widget _buildLoadingGrid() {
    return SliverPadding(
      padding: const EdgeInsets.symmetric(
        horizontal: ShopConstants.defaultPadding,
      ),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: ShopConstants.productGridCrossAxisCount,
          crossAxisSpacing: ShopConstants.productGridCrossAxisSpacing,
          mainAxisSpacing: ShopConstants.productGridMainAxisSpacing,
          childAspectRatio: ShopConstants.productGridChildAspectRatio,
        ),
        delegate: SliverChildBuilderDelegate(
          (context, index) => Container(
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(
                ShopConstants.defaultBorderRadius,
              ),
            ),
            child: const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
              ),
            ),
          ),
          childCount: 6,
        ),
      ),
    );
  }

  Widget _buildErrorGrid(String error) {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.all(ShopConstants.defaultPaddingLarge),
        child: ErrorRetryWidget(
          message: error,
          onRetry: () {
            // Retry loading
            if (_selectedCategory == 'All') {
              ref.invalidate(featuredProductsProvider);
            } else {
              ref.read(productsByCategoryProvider.notifier)
                  .loadProducts(_selectedCategory);
            }
          },
        ),
      ),
    );
  }
}
