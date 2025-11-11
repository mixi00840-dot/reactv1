import 'package:flutter/foundation.dart';
import '../data/models/product_model.dart';

/// Simple cart provider for managing shopping cart
class CartProvider extends ChangeNotifier {
  final List<CartItem> _items = [];

  List<CartItem> get items => _items;
  
  int get itemCount => _items.length;
  
  int get totalItems => _items.fold(0, (sum, item) => sum + item.quantity);
  
  double get subtotal => _items.fold(0.0, (sum, item) => sum + item.totalPrice);
  
  double get shipping => subtotal > 0 ? 9.99 : 0.0;
  
  double get tax => subtotal * 0.08; // 8% tax
  
  double get total => subtotal + shipping + tax;

  void addToCart(Product product, {int quantity = 1, String size = 'M', String color = 'Default'}) {
    // Check if product already exists
    final existingIndex = _items.indexWhere((item) => 
      item.product.id == product.id && 
      item.size == size && 
      item.color == color
    );

    if (existingIndex >= 0) {
      _items[existingIndex].quantity += quantity;
    } else {
      _items.add(CartItem(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        product: product,
        quantity: quantity,
        size: size,
        color: color,
      ));
    }
    
    notifyListeners();
  }

  void removeFromCart(String itemId) {
    _items.removeWhere((item) => item.id == itemId);
    notifyListeners();
  }

  void updateQuantity(String itemId, int quantity) {
    final index = _items.indexWhere((item) => item.id == itemId);
    if (index >= 0) {
      if (quantity <= 0) {
        removeFromCart(itemId);
      } else {
        _items[index].quantity = quantity;
        notifyListeners();
      }
    }
  }

  void clearCart() {
    _items.clear();
    notifyListeners();
  }
}
