// Simple non-Freezed product models to get the app running
// TODO: Convert back to Freezed when issue is resolved

/// Order status enum
enum OrderStatus {
  pending,
  processing,
  shipped,
  delivered,
  cancelled,
  refunded;

  @override
  String toString() {
    switch (this) {
      case OrderStatus.pending:
        return 'Pending';
      case OrderStatus.processing:
        return 'Processing';
      case OrderStatus.shipped:
        return 'Shipped';
      case OrderStatus.delivered:
        return 'Delivered';
      case OrderStatus.cancelled:
        return 'Cancelled';
      case OrderStatus.refunded:
        return 'Refunded';
    }
  }
}

/// Product model for e-commerce
class Product {
  final String id;
  final String title;
  final String name; // Alias for title for backward compatibility
  final String description;
  final double price;
  final double originalPrice;
  final List<String> images;
  final double rating;
  final int reviewCount;
  final int stock;
  final String category;
  final List<String> sizes;
  final List<String> colors;
  final List<String> features;
  final String? sellerId;
  final String? sellerName;
  final bool isSellerVerified;
  final double sellerRating;
  final bool isFeatured;
  final bool isNew;
  final DateTime? createdAt;

  const Product({
    required this.id,
    required this.title,
    String? name,
    required this.description,
    required this.price,
    this.originalPrice = 0,
    this.images = const [],
    this.rating = 0.0,
    this.reviewCount = 0,
    this.stock = 0,
    required this.category,
    this.sizes = const [],
    this.colors = const [],
    this.features = const [],
    this.sellerId,
    this.sellerName,
    this.isSellerVerified = false,
    this.sellerRating = 0.0,
    this.isFeatured = false,
    this.isNew = false,
    this.createdAt,
  }) : name = name ?? title;

  factory Product.fromJson(Map<String, dynamic> json) => Product(
    id: json['_id'] ?? json['id'] ?? '',
    title: json['title'] ?? json['name'] ?? '',
    name: json['name'] ?? json['title'] ?? '',
    description: json['description'] ?? '',
    price: (json['price'] ?? 0).toDouble(),
    originalPrice: (json['originalPrice'] ?? json['price'] ?? 0).toDouble(),
    images: List<String>.from(json['images'] ?? [json['imageUrl'] ?? '']),
    rating: (json['rating'] ?? json['avgRating'] ?? 0.0).toDouble(),
    reviewCount: json['reviewCount'] ?? json['reviewsCount'] ?? 0,
    stock: json['stock'] ?? json['quantity'] ?? 0,
    category: json['category'] ?? '',
    sizes: List<String>.from(json['sizes'] ?? json['variants']?['sizes'] ?? []),
    colors: List<String>.from(json['colors'] ?? json['variants']?['colors'] ?? []),
    features: List<String>.from(json['features'] ?? []),
    sellerId: json['sellerId'] ?? json['seller']?['_id'],
    sellerName: json['sellerName'] ?? json['seller']?['name'],
    isSellerVerified: json['isSellerVerified'] ?? json['seller']?['verified'] ?? false,
    sellerRating: (json['sellerRating'] ?? json['seller']?['rating'] ?? 0.0).toDouble(),
    isFeatured: json['isFeatured'] ?? json['featured'] ?? false,
    isNew: json['isNew'] ?? false,
    createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'name': name,
    'description': description,
    'price': price,
    'originalPrice': originalPrice,
    'images': images,
    'rating': rating,
    'reviewCount': reviewCount,
    'stock': stock,
    'category': category,
    'sizes': sizes,
    'colors': colors,
    'features': features,
    'sellerId': sellerId,
    'sellerName': sellerName,
    'isSellerVerified': isSellerVerified,
    'sellerRating': sellerRating,
    'isFeatured': isFeatured,
    'isNew': isNew,
    'createdAt': createdAt?.toIso8601String(),
  };
}

/// Cart item model
class CartItem {
  final String id;
  final Product product;
  final int quantity;
  final String? selectedSize;
  final String? selectedColor;
  final double subtotal;

  const CartItem({
    required this.id,
    required this.product,
    required this.quantity,
    this.selectedSize,
    this.selectedColor,
    required this.subtotal,
  });

  factory CartItem.fromJson(Map<String, dynamic> json) => CartItem(
    id: json['id'] ?? '',
    product: Product.fromJson(json['product'] ?? {}),
    quantity: json['quantity'] ?? 1,
    selectedSize: json['selectedSize'],
    selectedColor: json['selectedColor'],
    subtotal: (json['subtotal'] ?? 0).toDouble(),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'product': product.toJson(),
    'quantity': quantity,
    'selectedSize': selectedSize,
    'selectedColor': selectedColor,
    'subtotal': subtotal,
  };
}

/// Address model
class Address {
  final String id;
  final String name;
  final String addressLine1;
  final String? addressLine2;
  final String city;
  final String state;
  final String zipCode;
  final String phone;
  final bool isDefault;

  const Address({
    required this.id,
    required this.name,
    required this.addressLine1,
    this.addressLine2,
    required this.city,
    required this.state,
    required this.zipCode,
    required this.phone,
    this.isDefault = false,
  });

  factory Address.fromJson(Map<String, dynamic> json) => Address(
    id: json['id'] ?? '',
    name: json['name'] ?? '',
    addressLine1: json['addressLine1'] ?? '',
    addressLine2: json['addressLine2'],
    city: json['city'] ?? '',
    state: json['state'] ?? '',
    zipCode: json['zipCode'] ?? '',
    phone: json['phone'] ?? '',
    isDefault: json['isDefault'] ?? false,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'addressLine1': addressLine1,
    'addressLine2': addressLine2,
    'city': city,
    'state': state,
    'zipCode': zipCode,
    'phone': phone,
    'isDefault': isDefault,
  };
}

/// Payment method model
class PaymentMethod {
  final String id;
  final String type; // 'card', 'paypal', 'cod'
  final String name;
  final String? description;
  final String? cardLast4;
  final bool isDefault;

  const PaymentMethod({
    required this.id,
    required this.type,
    required this.name,
    this.description,
    this.cardLast4,
    this.isDefault = false,
  });

  factory PaymentMethod.fromJson(Map<String, dynamic> json) => PaymentMethod(
    id: json['id'] ?? '',
    type: json['type'] ?? '',
    name: json['name'] ?? '',
    description: json['description'],
    cardLast4: json['cardLast4'],
    isDefault: json['isDefault'] ?? false,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'type': type,
    'name': name,
    'description': description,
    'cardLast4': cardLast4,
    'isDefault': isDefault,
  };
}

/// Order model
class Order {
  final String id;
  final String orderNumber;
  final DateTime date;
  final String status; // 'pending', 'shipped', 'delivered', 'canceled'
  final List<OrderItem> items;
  final double subtotal;
  final double shipping;
  final double tax;
  final double total;
  final Address shippingAddress;
  final PaymentMethod paymentMethod;
  final String? trackingNumber;
  final DateTime? estimatedDelivery;

  const Order({
    required this.id,
    required this.orderNumber,
    required this.date,
    required this.status,
    required this.items,
    required this.subtotal,
    required this.shipping,
    required this.tax,
    required this.total,
    required this.shippingAddress,
    required this.paymentMethod,
    this.trackingNumber,
    this.estimatedDelivery,
  });

  factory Order.fromJson(Map<String, dynamic> json) => Order(
    id: json['id'] ?? '',
    orderNumber: json['orderNumber'] ?? '',
    date: DateTime.parse(json['date'] ?? DateTime.now().toIso8601String()),
    status: json['status'] ?? 'pending',
    items: (json['items'] as List? ?? [])
        .map((item) => OrderItem.fromJson(item))
        .toList(),
    subtotal: (json['subtotal'] ?? 0).toDouble(),
    shipping: (json['shipping'] ?? 0).toDouble(),
    tax: (json['tax'] ?? 0).toDouble(),
    total: (json['total'] ?? 0).toDouble(),
    shippingAddress: Address.fromJson(json['shippingAddress'] ?? {}),
    paymentMethod: PaymentMethod.fromJson(json['paymentMethod'] ?? {}),
    trackingNumber: json['trackingNumber'],
    estimatedDelivery: json['estimatedDelivery'] != null 
        ? DateTime.parse(json['estimatedDelivery']) 
        : null,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'orderNumber': orderNumber,
    'date': date.toIso8601String(),
    'status': status,
    'items': items.map((item) => item.toJson()).toList(),
    'subtotal': subtotal,
    'shipping': shipping,
    'tax': tax,
    'total': total,
    'shippingAddress': shippingAddress.toJson(),
    'paymentMethod': paymentMethod.toJson(),
    'trackingNumber': trackingNumber,
    'estimatedDelivery': estimatedDelivery?.toIso8601String(),
  };
}

/// Order item model
class OrderItem {
  final String id;
  final String productId;
  final String title;
  final String image;
  final int quantity;
  final double price;
  final String? selectedSize;
  final String? selectedColor;

  const OrderItem({
    required this.id,
    required this.productId,
    required this.title,
    required this.image,
    required this.quantity,
    required this.price,
    this.selectedSize,
    this.selectedColor,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) => OrderItem(
    id: json['id'] ?? '',
    productId: json['productId'] ?? '',
    title: json['title'] ?? '',
    image: json['image'] ?? '',
    quantity: json['quantity'] ?? 1,
    price: (json['price'] ?? 0).toDouble(),
    selectedSize: json['selectedSize'],
    selectedColor: json['selectedColor'],
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'productId': productId,
    'title': title,
    'image': image,
    'quantity': quantity,
    'price': price,
    'selectedSize': selectedSize,
    'selectedColor': selectedColor,
  };
}

/// Review model
class Review {
  final String id;
  final String userId;
  final String userName;
  final String? userAvatar;
  final double rating;
  final String comment;
  final DateTime date;
  final bool isVerifiedPurchase;
  final int helpfulCount;

  const Review({
    required this.id,
    required this.userId,
    required this.userName,
    this.userAvatar,
    required this.rating,
    required this.comment,
    required this.date,
    this.isVerifiedPurchase = false,
    this.helpfulCount = 0,
  });

  factory Review.fromJson(Map<String, dynamic> json) => Review(
    id: json['id'] ?? '',
    userId: json['userId'] ?? '',
    userName: json['userName'] ?? '',
    userAvatar: json['userAvatar'],
    rating: (json['rating'] ?? 0.0).toDouble(),
    comment: json['comment'] ?? '',
    date: DateTime.parse(json['date'] ?? DateTime.now().toIso8601String()),
    isVerifiedPurchase: json['isVerifiedPurchase'] ?? false,
    helpfulCount: json['helpfulCount'] ?? 0,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'userId': userId,
    'userName': userName,
    'userAvatar': userAvatar,
    'rating': rating,
    'comment': comment,
    'date': date.toIso8601String(),
    'isVerifiedPurchase': isVerifiedPurchase,
    'helpfulCount': helpfulCount,
  };
}