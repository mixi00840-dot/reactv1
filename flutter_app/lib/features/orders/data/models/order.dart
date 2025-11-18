class Order {
  final String id;
  final String userId;
  final List<OrderItem> items;
  final double subtotal;
  final double tax;
  final double shipping;
  final double discount;
  final double total;
  final String status; // pending, processing, shipped, delivered, cancelled
  final String? trackingNumber;
  final String? shippingAddress;
  final String? paymentMethod;
  final DateTime? orderDate;
  final DateTime? estimatedDelivery;
  final DateTime? deliveredAt;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Order({
    required this.id,
    required this.userId,
    required this.items,
    required this.subtotal,
    required this.tax,
    required this.shipping,
    this.discount = 0,
    required this.total,
    this.status = 'pending',
    this.trackingNumber,
    this.shippingAddress,
    this.paymentMethod,
    this.orderDate,
    this.estimatedDelivery,
    this.deliveredAt,
    this.createdAt,
    this.updatedAt,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['_id'] ?? json['id'] ?? '',
      userId: json['userId'] ?? json['user'] ?? '',
      items: json['items'] != null
          ? (json['items'] as List)
              .map((item) => OrderItem.fromJson(item))
              .toList()
          : [],
      subtotal: (json['subtotal'] ?? 0).toDouble(),
      tax: (json['tax'] ?? 0).toDouble(),
      shipping: (json['shipping'] ?? 0).toDouble(),
      discount: (json['discount'] ?? 0).toDouble(),
      total: (json['total'] ?? 0).toDouble(),
      status: json['status'] ?? 'pending',
      trackingNumber: json['trackingNumber'],
      shippingAddress: json['shippingAddress'],
      paymentMethod: json['paymentMethod'],
      orderDate:
          json['orderDate'] != null ? DateTime.parse(json['orderDate']) : null,
      estimatedDelivery: json['estimatedDelivery'] != null
          ? DateTime.parse(json['estimatedDelivery'])
          : null,
      deliveredAt: json['deliveredAt'] != null
          ? DateTime.parse(json['deliveredAt'])
          : null,
      createdAt:
          json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
      updatedAt:
          json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'items': items.map((item) => item.toJson()).toList(),
      'subtotal': subtotal,
      'tax': tax,
      'shipping': shipping,
      'discount': discount,
      'total': total,
      'status': status,
      if (trackingNumber != null) 'trackingNumber': trackingNumber,
      if (shippingAddress != null) 'shippingAddress': shippingAddress,
      if (paymentMethod != null) 'paymentMethod': paymentMethod,
      if (orderDate != null) 'orderDate': orderDate!.toIso8601String(),
      if (estimatedDelivery != null)
        'estimatedDelivery': estimatedDelivery!.toIso8601String(),
      if (deliveredAt != null) 'deliveredAt': deliveredAt!.toIso8601String(),
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
    };
  }
}

class OrderItem {
  final String id;
  final String productId;
  final String productName;
  final String? productImage;
  final double price;
  final int quantity;
  final String? variantId;
  final String? variantName;
  final double total;

  OrderItem({
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

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      id: json['_id'] ?? json['id'] ?? '',
      productId: json['productId'] ?? json['product']?['_id'] ?? '',
      productName: json['productName'] ?? json['product']?['name'] ?? '',
      productImage: json['productImage'] ?? json['product']?['images']?[0],
      price: (json['price'] ?? 0).toDouble(),
      quantity: json['quantity'] ?? 1,
      variantId: json['variantId'],
      variantName: json['variantName'],
      total: (json['total'] ?? 0).toDouble(),
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
}
