class Product {
  final String id;
  final String sellerId;
  final String name;
  final String description;
  final double price;
  final int stock;
  final ProductStatus status;
  final List<String> images;
  final String category;
  final Map<String, dynamic>? specifications;
  final ShippingInfo? shippingInfo;
  final ProductAnalytics analytics;
  final DateTime createdAt;
  final DateTime updatedAt;

  Product({
    required this.id,
    required this.sellerId,
    required this.name,
    required this.description,
    required this.price,
    required this.stock,
    required this.status,
    required this.images,
    required this.category,
    this.specifications,
    this.shippingInfo,
    required this.analytics,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['_id'] ?? json['id'] ?? '',
      sellerId: json['sellerId'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      price: (json['price'] ?? 0.0).toDouble(),
      stock: json['stock'] ?? 0,
      status: ProductStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => ProductStatus.draft,
      ),
      images: List<String>.from(json['images'] ?? []),
      category: json['category'] ?? '',
      specifications: json['specifications'],
      shippingInfo: json['shippingInfo'] != null
          ? ShippingInfo.fromJson(json['shippingInfo'])
          : null,
      analytics: ProductAnalytics.fromJson(json['analytics'] ?? {}),
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'sellerId': sellerId,
      'name': name,
      'description': description,
      'price': price,
      'stock': stock,
      'status': status.name,
      'images': images,
      'category': category,
      if (specifications != null) 'specifications': specifications,
      if (shippingInfo != null) 'shippingInfo': shippingInfo!.toJson(),
      'analytics': analytics.toJson(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  Product copyWith({
    String? id,
    String? sellerId,
    String? name,
    String? description,
    double? price,
    int? stock,
    ProductStatus? status,
    List<String>? images,
    String? category,
    Map<String, dynamic>? specifications,
    ShippingInfo? shippingInfo,
    ProductAnalytics? analytics,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Product(
      id: id ?? this.id,
      sellerId: sellerId ?? this.sellerId,
      name: name ?? this.name,
      description: description ?? this.description,
      price: price ?? this.price,
      stock: stock ?? this.stock,
      status: status ?? this.status,
      images: images ?? this.images,
      category: category ?? this.category,
      specifications: specifications ?? this.specifications,
      shippingInfo: shippingInfo ?? this.shippingInfo,
      analytics: analytics ?? this.analytics,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  bool get isActive => status == ProductStatus.active;
  bool get isDraft => status == ProductStatus.draft;
  bool get isHidden => status == ProductStatus.hidden;
  bool get isOutOfStock => stock == 0;
  String get formattedPrice => '\$${price.toStringAsFixed(2)}';
}

enum ProductStatus {
  active,
  draft,
  hidden,
  archived,
}

class ShippingInfo {
  final double weight;
  final Map<String, double> dimensions; // length, width, height
  final List<String> shippingMethods;
  final double shippingCost;

  ShippingInfo({
    required this.weight,
    required this.dimensions,
    required this.shippingMethods,
    required this.shippingCost,
  });

  factory ShippingInfo.fromJson(Map<String, dynamic> json) {
    return ShippingInfo(
      weight: (json['weight'] ?? 0.0).toDouble(),
      dimensions: Map<String, double>.from(json['dimensions'] ?? {}),
      shippingMethods: List<String>.from(json['shippingMethods'] ?? []),
      shippingCost: (json['shippingCost'] ?? 0.0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'weight': weight,
      'dimensions': dimensions,
      'shippingMethods': shippingMethods,
      'shippingCost': shippingCost,
    };
  }
}

class ProductAnalytics {
  final int views;
  final int sales;
  final double revenue;
  final int favorites;
  final double averageRating;
  final int reviewCount;

  ProductAnalytics({
    this.views = 0,
    this.sales = 0,
    this.revenue = 0.0,
    this.favorites = 0,
    this.averageRating = 0.0,
    this.reviewCount = 0,
  });

  factory ProductAnalytics.fromJson(Map<String, dynamic> json) {
    return ProductAnalytics(
      views: json['views'] ?? 0,
      sales: json['sales'] ?? 0,
      revenue: (json['revenue'] ?? 0.0).toDouble(),
      favorites: json['favorites'] ?? 0,
      averageRating: (json['averageRating'] ?? 0.0).toDouble(),
      reviewCount: json['reviewCount'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'views': views,
      'sales': sales,
      'revenue': revenue,
      'favorites': favorites,
      'averageRating': averageRating,
      'reviewCount': reviewCount,
    };
  }

  String get formattedRevenue => '\$${revenue.toStringAsFixed(2)}';
}
