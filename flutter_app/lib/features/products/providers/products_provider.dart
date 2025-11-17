import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/product.dart';
import '../data/services/product_service.dart';

// Product service provider
final productServiceProvider = Provider<ProductService>((ref) {
  return ProductService();
});

// Products list provider with pagination
final productsProvider =
    StateNotifierProvider<ProductsNotifier, AsyncValue<List<Product>>>((ref) {
  final service = ref.watch(productServiceProvider);
  return ProductsNotifier(service);
});

class ProductsNotifier extends StateNotifier<AsyncValue<List<Product>>> {
  final ProductService _service;
  int _currentPage = 1;
  bool _hasMore = true;
  String? _currentCategory;
  String? _currentSearchQuery;

  ProductsNotifier(this._service) : super(const AsyncValue.loading()) {
    loadProducts();
  }

  Future<void> loadProducts({String? category, String? searchQuery}) async {
    state = const AsyncValue.loading();
    _currentCategory = category;
    _currentSearchQuery = searchQuery;

    try {
      final products = await _service.getProducts(
        page: 1,
        category: category,
        searchQuery: searchQuery,
      );
      _currentPage = 1;
      _hasMore = products.isNotEmpty;
      state = AsyncValue.data(products);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> loadMore() async {
    if (!_hasMore) return;

    state.whenData((currentProducts) async {
      try {
        final newProducts = await _service.getProducts(
          page: _currentPage + 1,
          category: _currentCategory,
          searchQuery: _currentSearchQuery,
        );

        if (newProducts.isEmpty) {
          _hasMore = false;
        } else {
          _currentPage++;
          state = AsyncValue.data([...currentProducts, ...newProducts]);
        }
      } catch (e, stack) {
        state = AsyncValue.error(e, stack);
      }
    });
  }

  Future<void> refresh() async {
    await loadProducts(
      category: _currentCategory,
      searchQuery: _currentSearchQuery,
    );
  }
}

// Single product provider
final singleProductProvider =
    FutureProvider.family<Product, String>((ref, productId) async {
  final service = ref.watch(productServiceProvider);
  return await service.getProduct(productId);
});

// Featured products provider
final featuredProductsProvider = FutureProvider<List<Product>>((ref) async {
  final service = ref.watch(productServiceProvider);
  return await service.getFeaturedProducts();
});

// Product categories provider
final productCategoriesProvider = FutureProvider<List<String>>((ref) async {
  final service = ref.watch(productServiceProvider);
  return await service.getCategories();
});

// Wishlist provider
final wishlistProvider =
    StateNotifierProvider<WishlistNotifier, AsyncValue<List<Product>>>((ref) {
  final service = ref.watch(productServiceProvider);
  return WishlistNotifier(service);
});

class WishlistNotifier extends StateNotifier<AsyncValue<List<Product>>> {
  final ProductService _service;

  WishlistNotifier(this._service) : super(const AsyncValue.loading()) {
    loadWishlist();
  }

  Future<void> loadWishlist() async {
    state = const AsyncValue.loading();
    try {
      final products = await _service.getWishlist();
      state = AsyncValue.data(products);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> addToWishlist(String productId) async {
    try {
      await _service.addToWishlist(productId);
      await loadWishlist();
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> removeFromWishlist(String productId) async {
    try {
      await _service.removeFromWishlist(productId);
      state.whenData((products) {
        final updatedList = products.where((p) => p.id != productId).toList();
        state = AsyncValue.data(updatedList);
      });
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> refresh() async {
    await loadWishlist();
  }
}

// Product in wishlist check
final isInWishlistProvider = Provider.family<bool, String>((ref, productId) {
  final wishlistState = ref.watch(wishlistProvider);
  return wishlistState.when(
    data: (products) => products.any((p) => p.id == productId),
    loading: () => false,
    error: (_, __) => false,
  );
});
