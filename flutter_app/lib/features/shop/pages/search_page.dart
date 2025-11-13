import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:async';
import '../../../core/theme/app_colors.dart';
import '../constants/shop_constants.dart';
import '../models/product_model.dart';
import '../providers/product_provider.dart';
import '../widgets/product_card.dart';

/// Search page with filters for products
class SearchPage extends ConsumerStatefulWidget {
  final String? initialQuery;

  const SearchPage({
    Key? key,
    this.initialQuery,
  }) : super(key: key);

  @override
  ConsumerState<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends ConsumerState<SearchPage> {
  final TextEditingController _searchController = TextEditingController();
  Timer? _debounceTimer;
  bool _showFilters = false;
  
  // Filter states
  String? _selectedCategory;
  double _minPrice = 0;
  double _maxPrice = 1000;
  int _minRating = 0;
  String _sortBy = 'relevance';

  @override
  void initState() {
    super.initState();
    if (widget.initialQuery != null) {
      _searchController.text = widget.initialQuery!;
      _performSearch();
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    // Cancel previous timer
    _debounceTimer?.cancel();

    // Start new timer
    _debounceTimer = Timer(ShopConstants.searchDebounceDuration, () {
      if (query.length >= ShopConstants.minSearchQueryLength) {
        _performSearch();
      }
    });
  }

  void _performSearch() {
    if (_searchController.text.isEmpty) return;

    ref.read(searchProductsProvider.notifier).search(
          query: _searchController.text,
          category: _selectedCategory,
          minPrice: _minPrice,
          maxPrice: _maxPrice,
          minRating: _minRating.toDouble(),
          sortBy: _sortBy,
        );
  }

  void _clearSearch() {
    _searchController.clear();
    ref.read(searchProductsProvider.notifier).clear();
  }

  void _applyFilters() {
    setState(() {
      _showFilters = false;
    });
    _performSearch();
  }

  void _resetFilters() {
    setState(() {
      _selectedCategory = null;
      _minPrice = 0;
      _maxPrice = 1000;
      _minRating = 0;
      _sortBy = 'relevance';
    });
    _performSearch();
  }

  @override
  Widget build(BuildContext context) {
    final searchState = ref.watch(searchProductsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 1,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: _buildSearchBar(),
        actions: [
          IconButton(
            icon: Icon(
              _showFilters ? Icons.filter_list : Icons.filter_list_outlined,
              color: _showFilters ? AppColors.primary : AppColors.textPrimary,
            ),
            onPressed: () {
              setState(() {
                _showFilters = !_showFilters;
              });
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Filters Panel
          if (_showFilters) _buildFiltersPanel(),

          // Search Results
          Expanded(
            child: searchState.when(
              data: (products) {
                if (_searchController.text.isEmpty) {
                  return _buildInitialState();
                }
                if (products.isEmpty) {
                  return _buildEmptyState();
                }
                return _buildSearchResults(products);
              },
              loading: () => _buildLoadingState(),
              error: (error, stack) => _buildErrorState(error.toString()),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      height: 40,
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(20),
      ),
      child: TextField(
        controller: _searchController,
        autofocus: widget.initialQuery == null,
        decoration: InputDecoration(
          hintText: 'Search products...',
          hintStyle: const TextStyle(
            color: AppColors.textSecondary,
            fontSize: 14,
          ),
          prefixIcon: const Icon(
            Icons.search,
            color: AppColors.textSecondary,
            size: 20,
          ),
          suffixIcon: _searchController.text.isNotEmpty
              ? IconButton(
                  icon: const Icon(
                    Icons.clear,
                    color: AppColors.textSecondary,
                    size: 20,
                  ),
                  onPressed: _clearSearch,
                )
              : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 10),
        ),
        onChanged: _onSearchChanged,
        onSubmitted: (_) => _performSearch(),
      ),
    );
  }

  Widget _buildFiltersPanel() {
    return Container(
      padding: const EdgeInsets.all(ShopConstants.defaultPadding),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Filters',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              TextButton(
                onPressed: _resetFilters,
                child: const Text('Reset'),
              ),
            ],
          ),

          const SizedBox(height: ShopConstants.defaultPadding),

          // Sort By
          const Text(
            'Sort By',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [
              _buildSortChip('Relevance', 'relevance'),
              _buildSortChip('Price: Low to High', 'price_asc'),
              _buildSortChip('Price: High to Low', 'price_desc'),
              _buildSortChip('Rating', 'rating'),
              _buildSortChip('Newest', 'newest'),
            ],
          ),

          const SizedBox(height: ShopConstants.defaultPadding),

          // Price Range
          const Text(
            'Price Range',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          RangeSlider(
            values: RangeValues(_minPrice, _maxPrice),
            min: 0,
            max: 1000,
            divisions: 20,
            activeColor: AppColors.primary,
            labels: RangeLabels(
              '\$${_minPrice.toStringAsFixed(0)}',
              '\$${_maxPrice.toStringAsFixed(0)}',
            ),
            onChanged: (values) {
              setState(() {
                _minPrice = values.start;
                _maxPrice = values.end;
              });
            },
          ),

          const SizedBox(height: ShopConstants.defaultPadding),

          // Minimum Rating
          const Text(
            'Minimum Rating',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: List.generate(5, (index) {
              final rating = index + 1;
              final isSelected = _minRating >= rating;
              return GestureDetector(
                onTap: () {
                  setState(() {
                    _minRating = rating == _minRating ? 0 : rating;
                  });
                },
                child: Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: Icon(
                    isSelected ? Icons.star : Icons.star_border,
                    color: isSelected ? Colors.amber : AppColors.textSecondary,
                    size: 32,
                  ),
                ),
              );
            }),
          ),

          const SizedBox(height: ShopConstants.defaultPadding),

          // Apply Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _applyFilters,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(
                    ShopConstants.defaultBorderRadius,
                  ),
                ),
              ),
              child: const Text(
                'Apply Filters',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSortChip(String label, String value) {
    final isSelected = _sortBy == value;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      selectedColor: AppColors.primary,
      backgroundColor: AppColors.background,
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : AppColors.textPrimary,
        fontSize: 12,
      ),
      onSelected: (selected) {
        if (selected) {
          setState(() {
            _sortBy = value;
          });
        }
      },
    );
  }

  Widget _buildInitialState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(ShopConstants.defaultPaddingLarge),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.search,
              size: 80,
              color: AppColors.textTertiary,
            ),
            const SizedBox(height: ShopConstants.defaultPadding),
            const Text(
              'Search for products',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: ShopConstants.defaultPaddingSmall),
            const Text(
              'Enter at least 2 characters to start searching',
              style: TextStyle(
                fontSize: 14,
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(ShopConstants.defaultPaddingLarge),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.search_off,
              size: 80,
              color: AppColors.textTertiary,
            ),
            const SizedBox(height: ShopConstants.defaultPadding),
            const Text(
              'No products found',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: ShopConstants.defaultPaddingSmall),
            Text(
              'Try different keywords or filters for "${_searchController.text}"',
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(),
          const SizedBox(height: ShopConstants.defaultPadding),
          Text(
            'Searching for "${_searchController.text}"...',
            style: const TextStyle(
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(ShopConstants.defaultPaddingLarge),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 80,
              color: Colors.red[300],
            ),
            const SizedBox(height: ShopConstants.defaultPadding),
            const Text(
              'Search failed',
              style: TextStyle(
                fontSize: 20,
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
            const SizedBox(height: ShopConstants.defaultPaddingLarge),
            ElevatedButton.icon(
              onPressed: _performSearch,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchResults(List<Product> products) {
    return Column(
      children: [
        // Results header
        Container(
          padding: const EdgeInsets.all(ShopConstants.defaultPadding),
          color: Colors.white,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${products.length} results found',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
              if (_selectedCategory != null ||
                  _minPrice > 0 ||
                  _maxPrice < 1000 ||
                  _minRating > 0)
                TextButton.icon(
                  onPressed: _resetFilters,
                  icon: const Icon(Icons.clear, size: 16),
                  label: const Text('Clear filters'),
                  style: TextButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                  ),
                ),
            ],
          ),
        ),

        // Products grid
        Expanded(
          child: GridView.builder(
            padding: const EdgeInsets.all(ShopConstants.defaultPadding),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: ShopConstants.productGridCrossAxisCount,
              crossAxisSpacing: ShopConstants.productGridCrossAxisSpacing,
              mainAxisSpacing: ShopConstants.productGridMainAxisSpacing,
              childAspectRatio: ShopConstants.productGridChildAspectRatio,
            ),
            itemCount: products.length,
            itemBuilder: (context, index) {
              final product = products[index];
              return ProductCard(
                imageUrl: product.images.isNotEmpty
                    ? product.images.first
                    : 'https://via.placeholder.com/140x140',
                title: product.title,
                price: product.price,
                originalPrice: product.originalPrice,
                rating: product.rating,
                reviewCount: product.reviewCount,
                onTap: () {
                  Navigator.pushNamed(
                    context,
                    '/shop/product-details',
                    arguments: product.id,
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }
}
