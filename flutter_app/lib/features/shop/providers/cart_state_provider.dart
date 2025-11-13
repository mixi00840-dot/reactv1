import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:state_notifier/state_notifier.dart';
import '../models/product_model.dart';
import '../services/cart_api_service.dart';
import 'product_provider.dart';

// Cart API Service Provider
final cartApiServiceProvider = Provider<CartApiService>(
  (ref) => CartApiService(ref.watch(apiServiceProvider)),
);

// Cart State Notifier
class CartNotifier extends StateNotifier<AsyncValue<List<CartItem>>> {
  final CartApiService _service;

  CartNotifier(this._service) : super(const AsyncValue.loading()) {
    loadCart();
  }

  /// Load cart from API
  Future<void> loadCart() async {
    state = const AsyncValue.loading();
    try {
      final items = await _service.getCart();
      state = AsyncValue.data(items);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  /// Add item to cart
  Future<void> addToCart({
    required String productId,
    required int quantity,
    String? size,
    String? color,
  }) async {
    try {
      final newItem = await _service.addToCart(
        productId: productId,
        quantity: quantity,
        size: size,
        color: color,
      );

      state.whenData((items) {
        // Check if item already exists and update it, otherwise add
        final existingIndex =
            items.indexWhere((item) => item.id == newItem.id);
        if (existingIndex != -1) {
          final updatedItems = [...items];
          updatedItems[existingIndex] = newItem;
          state = AsyncValue.data(updatedItems);
        } else {
          state = AsyncValue.data([...items, newItem]);
        }
      });
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }

  /// Update cart item quantity
  Future<void> updateQuantity(String cartItemId, int quantity) async {
    try {
      final updatedItem = await _service.updateCartItem(
        cartItemId: cartItemId,
        quantity: quantity,
      );

      state.whenData((items) {
        final updatedItems = items
            .map((item) => item.id == cartItemId ? updatedItem : item)
            .toList();
        state = AsyncValue.data(updatedItems);
      });
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }

  /// Remove item from cart
  Future<void> removeItem(String cartItemId) async {
    // Optimistic update
    final previousState = state;
    state.whenData((items) {
      state = AsyncValue.data(
        items.where((item) => item.id != cartItemId).toList(),
      );
    });

    try {
      await _service.removeFromCart(cartItemId);
    } catch (e, stack) {
      // Revert on error
      state = previousState;
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }

  /// Clear entire cart
  Future<void> clearCart() async {
    final previousState = state;
    state = const AsyncValue.data([]);

    try {
      await _service.clearCart();
    } catch (e, stack) {
      state = previousState;
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }

  /// Get cart item count
  int get itemCount {
    return state.when(
      data: (items) => items.fold(0, (sum, item) => sum + item.quantity),
      loading: () => 0,
      error: (_, __) => 0,
    );
  }

  /// Get cart subtotal
  double get subtotal {
    return state.when(
      data: (items) => items.fold(0.0, (sum, item) => sum + item.subtotal),
      loading: () => 0.0,
      error: (_, __) => 0.0,
    );
  }
}

final cartStateProvider =
    StateNotifierProvider<CartNotifier, AsyncValue<List<CartItem>>>((ref) {
  final service = ref.watch(cartApiServiceProvider);
  return CartNotifier(service);
});

// Computed providers for cart totals
final cartItemCountProvider = Provider<int>((ref) {
  final cart = ref.watch(cartStateProvider);
  return cart.when(
    data: (items) => items.fold(0, (sum, item) => sum + item.quantity),
    loading: () => 0,
    error: (_, __) => 0,
  );
});

final cartSubtotalProvider = Provider<double>((ref) {
  final cart = ref.watch(cartStateProvider);
  return cart.when(
    data: (items) => items.fold(0.0, (sum, item) => sum + item.subtotal),
    loading: () => 0.0,
    error: (_, __) => 0.0,
  );
});

final cartShippingProvider = Provider<double>((ref) {
  final subtotal = ref.watch(cartSubtotalProvider);
  return subtotal >= 50.0 ? 0.0 : 9.99;
});

final cartTaxProvider = Provider<double>((ref) {
  final subtotal = ref.watch(cartSubtotalProvider);
  return subtotal * 0.08; // 8% tax
});

final cartTotalProvider = Provider<double>((ref) {
  final subtotal = ref.watch(cartSubtotalProvider);
  final shipping = ref.watch(cartShippingProvider);
  final tax = ref.watch(cartTaxProvider);
  return subtotal + shipping + tax;
});
