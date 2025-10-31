class ProductModel {
  final String id;
  final String name;
  final String description;
  final double price;
  final double? originalPrice;
  final String sellerId;
  final String sellerName;
  final String sellerAvatar;
  final List<String> images;
  final String category;
  final double rating;
  final int reviewCount;
  final int stock;
  final List<ProductVariant> variants;
  final bool isFeatured;
  final bool isTrending;

  ProductModel({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    this.originalPrice,
    required this.sellerId,
    required this.sellerName,
    required this.sellerAvatar,
    required this.images,
    required this.category,
    required this.rating,
    required this.reviewCount,
    required this.stock,
    required this.variants,
    this.isFeatured = false,
    this.isTrending = false,
  });

  double get discountPercentage {
    if (originalPrice == null || originalPrice! <= price) return 0;
    return ((originalPrice! - price) / originalPrice!) * 100;
  }

  bool get hasDiscount => originalPrice != null && originalPrice! > price;
  bool get isInStock => stock > 0;
}

class ProductVariant {
  final String id;
  final String name;
  final String type; // color, size, etc.
  final double? priceAdjustment;
  final String? imageUrl;

  ProductVariant({
    required this.id,
    required this.name,
    required this.type,
    this.priceAdjustment,
    this.imageUrl,
  });
}

class CartItem {
  final String id;
  final ProductModel product;
  final int quantity;
  final ProductVariant? selectedVariant;

  CartItem({
    required this.id,
    required this.product,
    required this.quantity,
    this.selectedVariant,
  });

  double get totalPrice {
    final basePrice = product.price;
    final variantPrice = selectedVariant?.priceAdjustment ?? 0;
    return (basePrice + variantPrice) * quantity;
  }
}

class OrderModel {
  final String id;
  final List<CartItem> items;
  final double subtotal;
  final double shipping;
  final double tax;
  final double total;
  final String status;
  final DateTime orderDate;
  final String? trackingNumber;
  final Map<String, String> shippingAddress;
  final String paymentMethod;

  OrderModel({
    required this.id,
    required this.items,
    required this.subtotal,
    required this.shipping,
    required this.tax,
    required this.total,
    required this.status,
    required this.orderDate,
    this.trackingNumber,
    required this.shippingAddress,
    required this.paymentMethod,
  });
}
