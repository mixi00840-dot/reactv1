import 'package:flutter/material.dart';
import '../models/product_model.dart';

class CartService extends ChangeNotifier {
  final List<CartItem> _items = [];

  List<CartItem> get items => List.unmodifiable(_items);

  int get itemCount => _items.fold(0, (sum, item) => sum + item.quantity);

  double get subtotal => _items.fold(0.0, (sum, item) => sum + item.totalPrice);

  double get shipping => subtotal > 50 ? 0.0 : 5.99;

  double get tax => subtotal * 0.08; // 8% tax

  double get total => subtotal + shipping + tax;

  bool get isEmpty => _items.isEmpty;

  void addItem(ProductModel product, {ProductVariant? variant, int quantity = 1}) {
    final existingIndex = _items.indexWhere(
      (item) =>
          item.product.id == product.id &&
          item.selectedVariant?.id == variant?.id,
    );

    if (existingIndex >= 0) {
      _items[existingIndex] = CartItem(
        id: _items[existingIndex].id,
        product: product,
        quantity: _items[existingIndex].quantity + quantity,
        selectedVariant: variant,
      );
    } else {
      _items.add(CartItem(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        product: product,
        quantity: quantity,
        selectedVariant: variant,
      ));
    }

    notifyListeners();
  }

  void updateQuantity(String itemId, int quantity) {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    final index = _items.indexWhere((item) => item.id == itemId);
    if (index >= 0) {
      _items[index] = CartItem(
        id: _items[index].id,
        product: _items[index].product,
        quantity: quantity,
        selectedVariant: _items[index].selectedVariant,
      );
      notifyListeners();
    }
  }

  void removeItem(String itemId) {
    _items.removeWhere((item) => item.id == itemId);
    notifyListeners();
  }

  void clear() {
    _items.clear();
    notifyListeners();
  }

  CartItem? getItem(String itemId) {
    try {
      return _items.firstWhere((item) => item.id == itemId);
    } catch (e) {
      return null;
    }
  }
}
