import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:state_notifier/state_notifier.dart';
import '../models/product_model.dart';
import '../services/api_service.dart';
import '../services/product_api_service.dart';

// API Service Providers
final apiServiceProvider = Provider<ApiService>((ref) => ApiService());

final productApiServiceProvider = Provider<ProductApiService>(
  (ref) => ProductApiService(ref.watch(apiServiceProvider)),
);

// Product Providers

/// Featured products provider
final featuredProductsProvider = FutureProvider<List<Product>>((ref) async {
  final service = ref.watch(productApiServiceProvider);
  return service.getFeaturedProducts(limit: 10);
});

/// Product by ID provider
final productByIdProvider =
    FutureProvider.family<Product, String>((ref, productId) async {
  final service = ref.watch(productApiServiceProvider);
  return service.getProductById(productId);
});

/// Product reviews provider
final productReviewsProvider =
    FutureProvider.family<List<Review>, String>((ref, productId) async {
  final service = ref.watch(productApiServiceProvider);
  return service.getProductReviews(productId, limit: 10);
});

/// Related products provider
final relatedProductsProvider =
    FutureProvider.family<List<Product>, String>((ref, productId) async {
  final service = ref.watch(productApiServiceProvider);
  return service.getRelatedProducts(productId, limit: 6);
});

/// Categories provider
final categoriesProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final service = ref.watch(productApiServiceProvider);
  return service.getCategories();
});

/// Products by category provider with state
class ProductsByCategoryNotifier
    extends StateNotifier<AsyncValue<List<Product>>> {
  final ProductApiService _service;
  String? _currentCategory;
  int _currentPage = 1;
  bool _hasMore = true;

  ProductsByCategoryNotifier(this._service) : super(const AsyncValue.loading());

  Future<void> loadProducts(String category) async {
    if (_currentCategory != category) {
      _currentCategory = category;
      _currentPage = 1;
      _hasMore = true;
      state = const AsyncValue.loading();
    }

    try {
      final products = await _service.getProductsByCategory(
        category,
        page: _currentPage,
        limit: 20,
      );

      state = AsyncValue.data(products);
      _hasMore = products.length == 20;
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> loadMore() async {
    if (!_hasMore || state.isLoading || _currentCategory == null) return;

    try {
      _currentPage++;
      final products = await _service.getProductsByCategory(
        _currentCategory!,
        page: _currentPage,
        limit: 20,
      );

      state.whenData((currentProducts) {
        state = AsyncValue.data([...currentProducts, ...products]);
      });

      _hasMore = products.length == 20;
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }
}

final productsByCategoryProvider = StateNotifierProvider<
    ProductsByCategoryNotifier, AsyncValue<List<Product>>>((ref) {
  final service = ref.watch(productApiServiceProvider);
  return ProductsByCategoryNotifier(service);
});

/// Search products provider
class SearchProductsNotifier extends StateNotifier<AsyncValue<List<Product>>> {
  final ProductApiService _service;

  SearchProductsNotifier(this._service) : super(const AsyncValue.data([]));

  Future<void> search({
    required String query,
    String? category,
    double? minPrice,
    double? maxPrice,
    double? minRating,
    String? sortBy,
  }) async {
    if (query.isEmpty) {
      state = const AsyncValue.data([]);
      return;
    }

    state = const AsyncValue.loading();

    try {
      final products = await _service.searchProducts(
        query,
        category: category,
        minPrice: minPrice,
        maxPrice: maxPrice,
        minRating: minRating,
        sortBy: sortBy,
      );
      state = AsyncValue.data(products);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  void clear() {
    state = const AsyncValue.data([]);
  }
}

final searchProductsProvider =
    StateNotifierProvider<SearchProductsNotifier, AsyncValue<List<Product>>>(
        (ref) {
  final service = ref.watch(productApiServiceProvider);
  return SearchProductsNotifier(service);
});
