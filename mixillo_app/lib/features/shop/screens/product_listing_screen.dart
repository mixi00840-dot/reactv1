import 'package:flutter/material.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/common_widgets.dart';
import 'product_details_screen.dart';

/// Product Listing Screen with Filters and Sort
class ProductListingScreen extends StatefulWidget {
  final String? category;
  final String? searchQuery;

  const ProductListingScreen({
    Key? key,
    this.category,
    this.searchQuery,
  }) : super(key: key);

  @override
  State<ProductListingScreen> createState() => _ProductListingScreenState();
}

class _ProductListingScreenState extends State<ProductListingScreen> {
  String _sortBy = 'popular';
  List<String> _selectedCategories = [];
  RangeValues _priceRange = const RangeValues(0, 1000);
  double _minRating = 0;
  bool _inStock = false;

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

  final List<Map<String, dynamic>> _sortOptions = [
    {'value': 'popular', 'label': 'Most Popular'},
    {'value': 'newest', 'label': 'Newest First'},
    {'value': 'price_low', 'label': 'Price: Low to High'},
    {'value': 'price_high', 'label': 'Price: High to Low'},
    {'value': 'rating', 'label': 'Highest Rated'},
  ];

  // Mock products data
  final List<Map<String, dynamic>> _mockProducts = [
    {
      'id': '1',
      'name': 'Premium Wireless Headphones',
      'price': 129.99,
      'originalPrice': 199.99,
      'rating': 4.8,
      'reviews': 1250,
      'stock': 45,
      'category': 'Electronics',
      'image': null,
      'discount': 35,
    },
    {
      'id': '2',
      'name': 'Stylish Summer Dress',
      'price': 45.99,
      'originalPrice': null,
      'rating': 4.5,
      'reviews': 320,
      'stock': 120,
      'category': 'Fashion',
      'image': null,
      'discount': null,
    },
    {
      'id': '3',
      'name': 'Smart Watch Pro',
      'price': 299.99,
      'originalPrice': 399.99,
      'rating': 4.9,
      'reviews': 2100,
      'stock': 0,
      'category': 'Electronics',
      'image': null,
      'discount': 25,
    },
    {
      'id': '4',
      'name': 'Organic Face Cream',
      'price': 34.99,
      'originalPrice': null,
      'rating': 4.6,
      'reviews': 890,
      'stock': 200,
      'category': 'Beauty',
      'image': null,
      'discount': null,
    },
    {
      'id': '5',
      'name': 'Running Shoes',
      'price': 89.99,
      'originalPrice': 120.00,
      'rating': 4.7,
      'reviews': 1500,
      'stock': 75,
      'category': 'Sports',
      'image': null,
      'discount': 25,
    },
    {
      'id': '6',
      'name': 'Modern Table Lamp',
      'price': 59.99,
      'originalPrice': null,
      'rating': 4.4,
      'reviews': 456,
      'stock': 30,
      'category': 'Home',
      'image': null,
      'discount': null,
    },
  ];

  List<Map<String, dynamic>> get _filteredProducts {
    var products = List<Map<String, dynamic>>.from(_mockProducts);

    // Apply category filter
    if (_selectedCategories.isNotEmpty && !_selectedCategories.contains('All')) {
      products = products.where((p) => _selectedCategories.contains(p['category'])).toList();
    }

    // Apply price filter
    products = products.where((p) {
      final price = p['price'] as double;
      return price >= _priceRange.start && price <= _priceRange.end;
    }).toList();

    // Apply rating filter
    if (_minRating > 0) {
      products = products.where((p) => (p['rating'] as double) >= _minRating).toList();
    }

    // Apply stock filter
    if (_inStock) {
      products = products.where((p) => (p['stock'] as int) > 0).toList();
    }

    // Apply sorting
    switch (_sortBy) {
      case 'newest':
        // In real app, would sort by creation date
        break;
      case 'price_low':
        products.sort((a, b) => (a['price'] as double).compareTo(b['price'] as double));
        break;
      case 'price_high':
        products.sort((a, b) => (b['price'] as double).compareTo(a['price'] as double));
        break;
      case 'rating':
        products.sort((a, b) => (b['rating'] as double).compareTo(a['rating'] as double));
        break;
      case 'popular':
      default:
        products.sort((a, b) => (b['reviews'] as int).compareTo(a['reviews'] as int));
    }

    return products;
  }

  @override
  void initState() {
    super.initState();
    if (widget.category != null) {
      _selectedCategories = [widget.category!];
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final products = _filteredProducts;

    return Scaffold(
      backgroundColor: isDark ? DesignTokens.darkBackground : DesignTokens.lightBackground,
      appBar: _buildAppBar(isDark),
      body: Column(
        children: [
          _buildFilterChips(isDark),
          _buildSortBar(isDark, products.length),
          Expanded(
            child: products.isEmpty
                ? _buildEmptyState(isDark)
                : _buildProductGrid(products, isDark),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showFilterSheet(context, isDark),
        backgroundColor: DesignTokens.brandPrimary,
        icon: const Icon(Icons.tune, color: Colors.white),
        label: const Text(
          'Filters',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar(bool isDark) {
    return AppBar(
      backgroundColor: isDark ? DesignTokens.darkBackground : DesignTokens.lightBackground,
      elevation: 0,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back),
        onPressed: () => Navigator.pop(context),
      ),
      title: Text(
        widget.category ?? 'All Products',
        style: AppTypography.h2(context).copyWith(
          fontWeight: DesignTokens.fontWeightBold,
        ),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.search),
          onPressed: () {
            // Open search
          },
        ),
        IconButton(
          icon: const Icon(Icons.shopping_cart_outlined),
          onPressed: () {
            // Navigate to cart
          },
        ),
      ],
    );
  }

  Widget _buildFilterChips(bool isDark) {
    return Container(
      height: 50,
      padding: const EdgeInsets.symmetric(horizontal: DesignTokens.space2),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: _categories.length,
        itemBuilder: (context, index) {
          final category = _categories[index];
          final isSelected = _selectedCategories.contains(category) ||
              (_selectedCategories.isEmpty && category == 'All');

          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: FilterChip(
              label: Text(category),
              selected: isSelected,
              onSelected: (selected) {
                setState(() {
                  if (category == 'All') {
                    _selectedCategories.clear();
                  } else {
                    if (selected) {
                      _selectedCategories.remove('All');
                      _selectedCategories.add(category);
                    } else {
                      _selectedCategories.remove(category);
                    }
                  }
                });
              },
              backgroundColor: isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface,
              selectedColor: DesignTokens.brandPrimary,
              checkmarkColor: Colors.white,
              labelStyle: TextStyle(
                color: isSelected
                    ? Colors.white
                    : (isDark ? DesignTokens.darkTextPrimary : DesignTokens.lightTextPrimary),
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSortBar(bool isDark, int productCount) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: DesignTokens.space4,
        vertical: DesignTokens.space2,
      ),
      decoration: BoxDecoration(
        color: isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface,
        border: Border(
          top: BorderSide(color: isDark ? DesignTokens.darkBorder : DesignTokens.lightBorder),
          bottom: BorderSide(color: isDark ? DesignTokens.darkBorder : DesignTokens.lightBorder),
        ),
      ),
      child: Row(
        children: [
          Text(
            '$productCount Products',
            style: AppTypography.titleSmall(context).copyWith(
              fontWeight: DesignTokens.fontWeightSemiBold,
            ),
          ),
          const Spacer(),
          GestureDetector(
            onTap: () => _showSortSheet(context, isDark),
            child: Row(
              children: [
                const Icon(Icons.sort, size: 20),
                const SizedBox(width: 4),
                Text(
                  _sortOptions.firstWhere((o) => o['value'] == _sortBy)['label'],
                  style: AppTypography.labelLarge(context),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProductGrid(List<Map<String, dynamic>> products, bool isDark) {
    return GridView.builder(
      padding: const EdgeInsets.all(DesignTokens.space4),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.7,
        crossAxisSpacing: DesignTokens.space3,
        mainAxisSpacing: DesignTokens.space3,
      ),
      itemCount: products.length,
      itemBuilder: (context, index) {
        return _buildProductCard(products[index], isDark);
      },
    );
  }

  Widget _buildProductCard(Map<String, dynamic> product, bool isDark) {
    final hasDiscount = product['originalPrice'] != null;
    final isOutOfStock = product['stock'] == 0;

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => ProductDetailsScreen(product: product),
          ),
        );
      },
      child: Container(
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
            // Image
            Expanded(
              child: Stack(
                children: [
                  Container(
                    width: double.infinity,
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
                  if (hasDiscount)
                    Positioned(
                      top: 8,
                      left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: DesignTokens.errorDefault,
                          borderRadius: BorderRadius.circular(DesignTokens.radiusSm),
                        ),
                        child: Text(
                          '-${product['discount']}%',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  if (isOutOfStock)
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.7),
                          borderRadius: BorderRadius.circular(DesignTokens.radiusSm),
                        ),
                        child: const Text(
                          'Out of Stock',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: (isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface)
                            .withOpacity(0.9),
                        shape: BoxShape.circle,
                      ),
                      child: IconButton(
                        padding: EdgeInsets.zero,
                        icon: const Icon(Icons.favorite_border, size: 18),
                        onPressed: () {},
                      ),
                    ),
                  ),
                ],
              ),
            ),
            // Info
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
                      const Icon(Icons.star, size: 14, color: DesignTokens.bookmarkYellow),
                      const SizedBox(width: 2),
                      Text(
                        '${product['rating']}',
                        style: AppTypography.labelSmall(context),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '(${product['reviews']})',
                        style: AppTypography.labelSmall(context).copyWith(
                          color: isDark
                              ? DesignTokens.darkTextSecondary
                              : DesignTokens.lightTextSecondary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text(
                        '\$${product['price']}',
                        style: AppTypography.titleSmall(context).copyWith(
                          color: DesignTokens.brandPrimary,
                          fontWeight: DesignTokens.fontWeightBold,
                        ),
                      ),
                      if (hasDiscount) ...[
                        const SizedBox(width: 6),
                        Text(
                          '\$${product['originalPrice']}',
                          style: AppTypography.labelSmall(context).copyWith(
                            decoration: TextDecoration.lineThrough,
                            color: isDark
                                ? DesignTokens.darkTextSecondary
                                : DesignTokens.lightTextSecondary,
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

  Widget _buildEmptyState(bool isDark) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.search_off,
            size: 80,
            color: (isDark ? DesignTokens.darkTextPrimary : DesignTokens.lightTextPrimary)
                .withOpacity(0.3),
          ),
          const SizedBox(height: DesignTokens.space4),
          Text(
            'No products found',
            style: AppTypography.h2(context),
          ),
          const SizedBox(height: DesignTokens.space2),
          Text(
            'Try adjusting your filters',
            style: AppTypography.bodyMedium(context).copyWith(
              color: isDark ? DesignTokens.darkTextSecondary : DesignTokens.lightTextSecondary,
            ),
          ),
          const SizedBox(height: DesignTokens.space4),
          PrimaryButton(
            text: 'Clear Filters',
            onPressed: () {
              setState(() {
                _selectedCategories.clear();
                _priceRange = const RangeValues(0, 1000);
                _minRating = 0;
                _inStock = false;
              });
            },
          ),
        ],
      ),
    );
  }

  void _showSortSheet(BuildContext context, bool isDark) {
    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(DesignTokens.radiusLg)),
      ),
      builder: (context) {
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: isDark ? DesignTokens.darkBorder : DesignTokens.lightBorder,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(DesignTokens.space4),
              child: Text(
                'Sort By',
                style: AppTypography.h3(context).copyWith(
                  fontWeight: DesignTokens.fontWeightBold,
                ),
              ),
            ),
            ..._sortOptions.map((option) {
              final isSelected = _sortBy == option['value'];
              return ListTile(
                title: Text(option['label']),
                trailing: isSelected
                    ? const Icon(Icons.check, color: DesignTokens.brandPrimary)
                    : null,
                selected: isSelected,
                onTap: () {
                  setState(() {
                    _sortBy = option['value'];
                  });
                  Navigator.pop(context);
                },
              );
            }).toList(),
            SizedBox(height: MediaQuery.of(context).padding.bottom),
          ],
        );
      },
    );
  }

  void _showFilterSheet(BuildContext context, bool isDark) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(DesignTokens.radiusLg)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return DraggableScrollableSheet(
              initialChildSize: 0.7,
              minChildSize: 0.5,
              maxChildSize: 0.95,
              expand: false,
              builder: (context, scrollController) {
                return Column(
                  children: [
                    Container(
                      margin: const EdgeInsets.only(top: 12),
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: isDark ? DesignTokens.darkBorder : DesignTokens.lightBorder,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(DesignTokens.space4),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Filters',
                            style: AppTypography.h3(context).copyWith(
                              fontWeight: DesignTokens.fontWeightBold,
                            ),
                          ),
                          TextButton(
                            onPressed: () {
                              setModalState(() {
                                _selectedCategories.clear();
                                _priceRange = const RangeValues(0, 1000);
                                _minRating = 0;
                                _inStock = false;
                              });
                              setState(() {});
                            },
                            child: const Text('Reset'),
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: ListView(
                        controller: scrollController,
                        padding: const EdgeInsets.all(DesignTokens.space4),
                        children: [
                          // Price Range
                          Text(
                            'Price Range',
                            style: AppTypography.titleMedium(context).copyWith(
                              fontWeight: DesignTokens.fontWeightBold,
                            ),
                          ),
                          const SizedBox(height: DesignTokens.space2),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('\$${_priceRange.start.round()}'),
                              Text('\$${_priceRange.end.round()}'),
                            ],
                          ),
                          RangeSlider(
                            values: _priceRange,
                            min: 0,
                            max: 1000,
                            divisions: 20,
                            activeColor: DesignTokens.brandPrimary,
                            onChanged: (values) {
                              setModalState(() {
                                _priceRange = values;
                              });
                            },
                          ),
                          const SizedBox(height: DesignTokens.space4),
                          
                          // Minimum Rating
                          Text(
                            'Minimum Rating',
                            style: AppTypography.titleMedium(context).copyWith(
                              fontWeight: DesignTokens.fontWeightBold,
                            ),
                          ),
                          const SizedBox(height: DesignTokens.space2),
                          Wrap(
                            spacing: 8,
                            children: [0, 1, 2, 3, 4].map((rating) {
                              final isSelected = _minRating == rating.toDouble();
                              return ChoiceChip(
                                label: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.star, size: 16, color: DesignTokens.bookmarkYellow),
                                    const SizedBox(width: 4),
                                    Text('$rating${rating > 0 ? '+' : ''}'),
                                  ],
                                ),
                                selected: isSelected,
                                onSelected: (selected) {
                                  setModalState(() {
                                    _minRating = rating.toDouble();
                                  });
                                },
                              );
                            }).toList(),
                          ),
                          const SizedBox(height: DesignTokens.space4),
                          
                          // In Stock Only
                          SwitchListTile(
                            title: const Text('In Stock Only'),
                            value: _inStock,
                            activeColor: DesignTokens.brandPrimary,
                            onChanged: (value) {
                              setModalState(() {
                                _inStock = value;
                              });
                            },
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: EdgeInsets.only(
                        left: DesignTokens.space4,
                        right: DesignTokens.space4,
                        top: DesignTokens.space3,
                        bottom: DesignTokens.space3 + MediaQuery.of(context).padding.bottom,
                      ),
                      decoration: BoxDecoration(
                        color: isDark ? DesignTokens.darkBackground : DesignTokens.lightBackground,
                        border: Border(
                          top: BorderSide(
                            color: isDark ? DesignTokens.darkBorder : DesignTokens.lightBorder,
                          ),
                        ),
                      ),
                      child: PrimaryButton(
                        text: 'Apply Filters',
                        onPressed: () {
                          setState(() {});
                          Navigator.pop(context);
                        },
                      ),
                    ),
                  ],
                );
              },
            );
          },
        );
      },
    );
  }
}
