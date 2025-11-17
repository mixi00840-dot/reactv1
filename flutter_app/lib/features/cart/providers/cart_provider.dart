import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/cart.dart';
import '../data/models/cart_item.dart';
import '../data/services/cart_service.dart';

// Cart service provider
final cartServiceProvider = Provider<CartService>((ref) {
  return CartService();
});

// Cart provider
final cartProvider =
    StateNotifierProvider<CartNotifier, AsyncValue<Cart>>((ref) {
  final service = ref.watch(cartServiceProvider);
  return CartNotifier(service);
});

class CartNotifier extends StateNotifier<AsyncValue<Cart>> {
  final CartService _service;

  CartNotifier(this._service) : super(const AsyncValue.loading()) {
    loadCart();
  }

  Future<void> loadCart() async {
    state = const AsyncValue.loading();
    try {
      final cart = await _service.getCart();
      state = AsyncValue.data(cart);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> addItem(String productId, int quantity,
      {String? variantId}) async {
    try {
      await _service.addItem(productId, quantity, variantId: variantId);
      await loadCart();
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> updateQuantity(String itemId, int quantity) async {
    try {
      await _service.updateQuantity(itemId, quantity);
      await loadCart();
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> removeItem(String itemId) async {
    try {
      await _service.removeItem(itemId);
      await loadCart();
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> clearCart() async {
    try {
      await _service.clearCart();
      await loadCart();
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> applyCoupon(String couponCode) async {
    try {
      await _service.applyCoupon(couponCode);
      await loadCart();
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> removeCoupon() async {
    try {
      await _service.removeCoupon();
      await loadCart();
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> refresh() async {
    await loadCart();
  }
}

// Cart item count provider
final cartItemCountProvider = Provider<int>((ref) {
  final cartState = ref.watch(cartProvider);
  return cartState.when(
    data: (cart) => cart.items.fold(0, (sum, item) => sum + item.quantity),
    loading: () => 0,
    error: (_, __) => 0,
  );
});

// Cart total provider
final cartTotalProvider = Provider<double>((ref) {
  final cartState = ref.watch(cartProvider);
  return cartState.when(
    data: (cart) => cart.total,
    loading: () => 0.0,
    error: (_, __) => 0.0,
  );
});

// Cart subtotal provider
final cartSubtotalProvider = Provider<double>((ref) {
  final cartState = ref.watch(cartProvider);
  return cartState.when(
    data: (cart) => cart.subtotal,
    loading: () => 0.0,
    error: (_, __) => 0.0,
  );
});

// Cart discount provider
final cartDiscountProvider = Provider<double>((ref) {
  final cartState = ref.watch(cartProvider);
  return cartState.when(
    data: (cart) => cart.discount,
    loading: () => 0.0,
    error: (_, __) => 0.0,
  );
});
