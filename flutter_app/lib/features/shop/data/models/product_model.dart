/// Product data model
class Product {
  final String id;
  final String name;
  final String description;
  final double price;
  final double originalPrice;
  final List<String> images;
  final String category;
  final String seller;
  final String sellerAvatar;
  final double rating;
  final int reviewsCount;
  final int stockCount;
  final bool isFeatured;
  final List<String> tags;
  final DateTime createdAt;

  Product({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.originalPrice,
    required this.images,
    required this.category,
    required this.seller,
    required this.sellerAvatar,
    required this.rating,
    required this.reviewsCount,
    required this.stockCount,
    this.isFeatured = false,
    required this.tags,
    required this.createdAt,
  });

  double get discount => ((originalPrice - price) / originalPrice * 100);
  bool get hasDiscount => originalPrice > price;
  bool get inStock => stockCount > 0;
}

/// Cart item model
class CartItem {
  final String id;
  final Product product;
  int quantity;
  final String size;
  final String color;

  CartItem({
    required this.id,
    required this.product,
    required this.quantity,
    this.size = 'M',
    this.color = 'Default',
  });

  double get totalPrice => product.price * quantity;
}

/// Product review model
class ProductReview {
  final String id;
  final String userId;
  final String username;
  final String userAvatar;
  final double rating;
  final String comment;
  final List<String> images;
  final DateTime createdAt;
  final int helpfulCount;

  ProductReview({
    required this.id,
    required this.userId,
    required this.username,
    required this.userAvatar,
    required this.rating,
    required this.comment,
    required this.images,
    required this.createdAt,
    required this.helpfulCount,
  });
}

/// Order model
class Order {
  final String id;
  final List<CartItem> items;
  final double subtotal;
  final double shipping;
  final double tax;
  final String shippingAddress;
  final String paymentMethod;
  final OrderStatus status;
  final DateTime createdAt;

  Order({
    required this.id,
    required this.items,
    required this.subtotal,
    required this.shipping,
    required this.tax,
    required this.shippingAddress,
    required this.paymentMethod,
    required this.status,
    required this.createdAt,
  });

  double get total => subtotal + shipping + tax;
}

enum OrderStatus {
  pending,
  processing,
  shipped,
  delivered,
  cancelled,
}
