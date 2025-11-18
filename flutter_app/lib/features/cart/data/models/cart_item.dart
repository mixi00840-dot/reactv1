class CartItem {
  final String id;
  final String productId;
  final String productName;
  final String? productImage;
  final double price;
  final int quantity;
  final String? variantId;
  final String? variantName;
  final double total;

  CartItem({
    required this.id,
    required this.productId,
    required this.productName,
    this.productImage,
    required this.price,
    required this.quantity,
    this.variantId,
    this.variantName,
    required this.total,
  });

  factory CartItem.fromJson(Map<String, dynamic> json) {
    return CartItem(
      id: json['_id'] ?? json['id'] ?? '',
      productId: json['productId'] ?? json['product']?['_id'] ?? '',
      productName: json['productName'] ?? json['product']?['name'] ?? '',
      productImage: json['productImage'] ?? json['product']?['images']?[0],
      price: (json['price'] ?? 0).toDouble(),
      quantity: json['quantity'] ?? 1,
      variantId: json['variantId'],
      variantName: json['variantName'],
      total: (json['total'] ?? (json['price'] ?? 0) * (json['quantity'] ?? 1))
          .toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'productId': productId,
      'productName': productName,
      if (productImage != null) 'productImage': productImage,
      'price': price,
      'quantity': quantity,
      if (variantId != null) 'variantId': variantId,
      if (variantName != null) 'variantName': variantName,
      'total': total,
    };
  }

  CartItem copyWith({
    String? id,
    String? productId,
    String? productName,
    String? productImage,
    double? price,
    int? quantity,
    String? variantId,
    String? variantName,
    double? total,
  }) {
    return CartItem(
      id: id ?? this.id,
      productId: productId ?? this.productId,
      productName: productName ?? this.productName,
      productImage: productImage ?? this.productImage,
      price: price ?? this.price,
      quantity: quantity ?? this.quantity,
      variantId: variantId ?? this.variantId,
      variantName: variantName ?? this.variantName,
      total: total ?? this.total,
    );
  }
}
