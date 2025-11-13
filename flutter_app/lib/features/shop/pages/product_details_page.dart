import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../constants/shop_constants.dart';
import '../widgets/product_details/product_images_carousel.dart';
import '../widgets/product_details/product_info_section.dart';
import '../widgets/product_details/product_variants_selector.dart';
import '../widgets/product_details/product_quantity_selector.dart';
import '../widgets/product_details/product_description.dart';
import '../widgets/reviews/reviews_section.dart';
import '../widgets/product_card.dart';
import '../models/product_model.dart';
import '../providers/product_provider.dart';
import '../providers/cart_state_provider.dart';

/// Product details page with image carousel, variants, quantity, and reviews
/// Matches e-commerce UI kit design with purple theme
class ProductDetailsPage extends ConsumerStatefulWidget {
  final String productId;

  const ProductDetailsPage({
    Key? key,
    required this.productId,
  }) : super(key: key);

  @override
  ConsumerState<ProductDetailsPage> createState() => _ProductDetailsPageState();
}

class _ProductDetailsPageState extends ConsumerState<ProductDetailsPage> {
  bool _isFavorite = false;
  String? _selectedSize;
  String? _selectedColor;
  int _quantity = 1;
  bool _isAddingToCart = false;

  @override
  Widget build(BuildContext context) {
    final productAsync = ref.watch(productByIdProvider(widget.productId));
    
    return productAsync.when(
      data: (product) => _buildProductDetails(context, product),
      loading: () => _buildLoadingState(),
      error: (error, stack) => _buildErrorState(error.toString()),
    );
  }

  Widget _buildLoadingState() {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
        ),
      ),
      body: const Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
        ),
      ),
    );
  }

  Widget _buildErrorState(String error) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
        ),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(ShopConstants.defaultPaddingLarge),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.error_outline,
                size: 64,
                color: AppColors.error,
              ),
              const SizedBox(height: ShopConstants.defaultPadding),
              Text(
                'Failed to load product',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: ShopConstants.defaultPaddingSmall),
              Text(
                error,
                style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: ShopConstants.defaultPadding),
              ElevatedButton(
                onPressed: () {
                  ref.invalidate(productByIdProvider(widget.productId));
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                ),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProductDetails(BuildContext context, Product product) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          // Scrollable Content
          CustomScrollView(
            slivers: [
              // Custom App Bar
              _buildAppBar(),
              
              // Product Images Carousel
              SliverToBoxAdapter(
                child: ProductImagesCarousel(
                  images: product.images.isNotEmpty 
                      ? product.images 
                      : ['https://via.placeholder.com/400x400/7B61FF/FFFFFF?text=${Uri.encodeComponent(product.title)}'],
                ),
              ),
              
              // Product Info Section
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(ShopConstants.defaultPadding),
                  child: ProductInfoSection(
                    title: product.title,
                    price: product.price,
                    originalPrice: product.originalPrice > 0 ? product.originalPrice : product.price,
                    discountPercent: product.originalPrice > 0
                        ? ((product.originalPrice - product.price) / product.originalPrice * 100).round()
                        : 0,
                    rating: product.rating,
                    reviewCount: product.reviewCount,
                    inStock: product.stock > 0,
                    stockCount: product.stock,
                    sellerName: product.sellerName ?? 'Unknown Seller',
                    sellerRating: product.sellerRating,
                    sellerVerified: product.isSellerVerified,
                  ),
                ),
              ),
              
              // Divider
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: ShopConstants.defaultPadding,
                  ),
                  child: Divider(
                    color: AppColors.border,
                    height: 1,
                  ),
                ),
              ),
              
              // Size Selector
              if (product.sizes.isNotEmpty)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(ShopConstants.defaultPadding),
                    child: ProductVariantsSelector(
                      label: 'Size',
                      options: product.sizes,
                      selectedOption: _selectedSize,
                      onOptionSelected: (size) {
                        setState(() {
                          _selectedSize = size;
                        });
                      },
                    ),
                  ),
                ),
              
              // Color Selector
              if (product.colors.isNotEmpty)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: ShopConstants.defaultPadding,
                    ),
                    child: ProductVariantsSelector(
                      label: 'Color',
                      options: product.colors,
                      colorOptions: product.colors,
                      selectedOption: _selectedColor,
                      onOptionSelected: (color) {
                        setState(() {
                          _selectedColor = color;
                        });
                      },
                      isColorSelector: true,
                    ),
                  ),
                ),
              
              const SliverToBoxAdapter(
                child: SizedBox(height: ShopConstants.defaultPadding),
              ),
              
              // Quantity Selector
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: ShopConstants.defaultPadding,
                  ),
                  child: ProductQuantitySelector(
                    quantity: _quantity,
                    maxQuantity: product.stock,
                    onQuantityChanged: (newQuantity) {
                      setState(() {
                        _quantity = newQuantity;
                      });
                    },
                  ),
                ),
              ),
              
              const SliverToBoxAdapter(
                child: SizedBox(height: ShopConstants.defaultPaddingLarge),
              ),
              
              // Product Description
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: ShopConstants.defaultPadding,
                  ),
                  child: ProductDescription(
                    description: product.description,
                    features: product.features,
                  ),
                ),
              ),
              
              const SliverToBoxAdapter(
                child: SizedBox(height: ShopConstants.defaultPaddingLarge),
              ),
              
              // Reviews Section
              _buildReviewsSection(product),
              
              const SliverToBoxAdapter(
                child: SizedBox(height: ShopConstants.defaultPaddingLarge),
              ),
              
              // Related Products
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: ShopConstants.defaultPadding,
                  ),
                  child: Text(
                    'You May Also Like',
                    style: ShopConstants.sectionTitleStyle,
                  ),
                ),
              ),
              
              const SliverToBoxAdapter(
                child: SizedBox(height: ShopConstants.defaultPadding),
              ),
              
              // Related Products Grid
              _buildRelatedProductsGrid(),
              
              // Bottom Padding (for action bar)
              const SliverToBoxAdapter(
                child: SizedBox(height: 100),
              ),
            ],
          ),
          
          // Bottom Action Bar
          _buildBottomActionBar(),
        ],
      ),
    );
  }

  Widget _buildAppBar() {
    return SliverAppBar(
      floating: true,
      backgroundColor: AppColors.background,
      elevation: 0,
      leading: IconButton(
        onPressed: () => Navigator.pop(context),
        icon: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.surface,
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.arrow_back,
            color: AppColors.textPrimary,
          ),
        ),
      ),
      actions: [
        IconButton(
          onPressed: () {
            // Navigate to cart
          },
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.surface,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.shopping_cart_outlined,
              color: AppColors.textPrimary,
            ),
          ),
        ),
        IconButton(
          onPressed: () {
            setState(() {
              _isFavorite = !_isFavorite;
            });
          },
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.surface,
              shape: BoxShape.circle,
            ),
            child: Icon(
              _isFavorite ? Icons.favorite : Icons.favorite_border,
              color: _isFavorite ? AppColors.like : AppColors.textPrimary,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildReviewsSection(Product product) {
    final reviewsAsync = ref.watch(productReviewsProvider(product.id));
    
    return reviewsAsync.when(
      data: (reviews) {
        // Calculate rating breakdown from reviews
        final ratingBreakdown = <int, int>{5: 0, 4: 0, 3: 0, 2: 0, 1: 0};
        for (var review in reviews) {
          final rating = review.rating.round();
          ratingBreakdown[rating] = (ratingBreakdown[rating] ?? 0) + 1;
        }
        
        return SliverToBoxAdapter(
          child: ReviewsSection(
            averageRating: product.rating,
            totalReviews: product.reviewCount,
            ratingBreakdown: ratingBreakdown,
            onSeeAllReviews: () {
              // Navigate to all reviews page
            },
          ),
        );
      },
      loading: () => const SliverToBoxAdapter(
        child: Center(
          child: Padding(
            padding: EdgeInsets.all(ShopConstants.defaultPadding),
            child: CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
            ),
          ),
        ),
      ),
      error: (_, __) => SliverToBoxAdapter(
        child: ReviewsSection(
          averageRating: product.rating,
          totalReviews: product.reviewCount,
          ratingBreakdown: {5: 0, 4: 0, 3: 0, 2: 0, 1: 0},
          onSeeAllReviews: () {},
        ),
      ),
    );
  }

  Widget _buildRelatedProductsGrid() {
    final relatedProductsAsync = ref.watch(relatedProductsProvider(widget.productId));
    
    return relatedProductsAsync.when(
      data: (products) {
        if (products.isEmpty) return const SliverToBoxAdapter(child: SizedBox.shrink());
        
        return SliverToBoxAdapter(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: ShopConstants.defaultPadding,
                ),
                child: Text(
                  'Related Products',
                  style: ShopConstants.sectionTitleStyle,
                ),
              ),
              const SizedBox(height: ShopConstants.defaultPadding),
              SizedBox(
                height: ShopConstants.productCardHeight + 20,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(
                    horizontal: ShopConstants.defaultPadding,
                  ),
                  itemCount: products.length,
                  itemBuilder: (context, index) {
                    final product = products[index];
                    return Padding(
                      padding: const EdgeInsets.only(
                        right: ShopConstants.defaultPadding,
                      ),
                      child: ProductCard(
                        imageUrl: product.images.isNotEmpty 
                            ? product.images.first 
                            : 'https://via.placeholder.com/140x140/7B61FF/FFFFFF?text=${Uri.encodeComponent(product.title)}',
                        title: product.title,
                        price: product.price,
                        originalPrice: product.originalPrice > 0 ? product.originalPrice : product.price,
                        discountPercent: product.originalPrice > 0
                            ? ((product.originalPrice - product.price) / product.originalPrice * 100).round()
                            : 0,
                        rating: product.rating,
                        reviewCount: product.reviewCount,
                        onTap: () {
                          // Navigate to product details
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => ProductDetailsPage(productId: product.id),
                            ),
                          );
                        },
                        onFavoriteToggle: () {
                          // Toggle favorite
                        },
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
      loading: () => const SliverToBoxAdapter(child: SizedBox.shrink()),
      error: (_, __) => const SliverToBoxAdapter(child: SizedBox.shrink()),
    );
  }

  Widget _buildBottomActionBar() {
    final productAsync = ref.watch(productByIdProvider(widget.productId));
    
    return productAsync.maybeWhen(
      data: (product) => Positioned(
        bottom: 0,
        left: 0,
        right: 0,
        child: Container(
          padding: const EdgeInsets.all(ShopConstants.defaultPadding),
          decoration: BoxDecoration(
            color: AppColors.surface,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 10,
                offset: const Offset(0, -5),
              ),
            ],
          ),
          child: SafeArea(
            child: Row(
              children: [
                // Add to Cart Button
                Expanded(
                  child: OutlinedButton(
                    onPressed: _isAddingToCart
                        ? null
                        : () => _handleAddToCart(product),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.primary,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(
                          ShopConstants.defaultBorderRadius,
                        ),
                        side: BorderSide(
                          color: AppColors.primary,
                          width: 2,
                        ),
                      ),
                    ),
                    child: _isAddingToCart
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
                            ),
                          )
                        : const Text(
                            'Add to Cart',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                  ),
                ),
                
                const SizedBox(width: ShopConstants.defaultPadding),
                
                // Buy Now Button
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isAddingToCart
                        ? null
                        : () => _handleBuyNow(product),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(
                          ShopConstants.defaultBorderRadius,
                        ),
                      ),
                    ),
                    child: const Text(
                      'Buy Now',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      orElse: () => const SizedBox.shrink(),
    );
  }

  Future<void> _handleAddToCart(Product product) async {
    // Validate selections
    if (product.sizes.isNotEmpty && _selectedSize == null) {
      _showError('Please select a size');
      return;
    }
    if (product.colors.isNotEmpty && _selectedColor == null) {
      _showError('Please select a color');
      return;
    }
    
    setState(() {
      _isAddingToCart = true;
    });
    
    try {
      await ref.read(cartStateProvider.notifier).addToCart(
        productId: product.id,
        quantity: _quantity,
        size: _selectedSize,
        color: _selectedColor,
      );
      
      _showAddToCartSuccess();
    } catch (e) {
      _showError(e.toString());
    } finally {
      if (mounted) {
        setState(() {
          _isAddingToCart = false;
        });
      }
    }
  }

  void _showAddToCartSuccess() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(
              Icons.check_circle,
              color: AppColors.success,
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Text('Added to cart successfully!'),
            ),
          ],
        ),
        backgroundColor: AppColors.surface,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _handleBuyNow(Product product) {
    // Validate selections
    if (product.sizes.isNotEmpty && _selectedSize == null) {
      _showError('Please select a size');
      return;
    }
    if (product.colors.isNotEmpty && _selectedColor == null) {
      _showError('Please select a color');
      return;
    }
    
    // Add to cart first, then navigate to checkout
    _handleAddToCart(product).then((_) {
      // Navigator.push(context, MaterialPageRoute(builder: (_) => CheckoutPage()));
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Checkout feature coming soon!'),
          duration: Duration(seconds: 1),
        ),
      );
    });
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(
              Icons.error_outline,
              color: AppColors.error,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(message),
            ),
          ],
        ),
        backgroundColor: AppColors.surface,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}
