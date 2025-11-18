class Product {
  final String id;
  final String name;
  final String description;
  final double price;
  final double? salePrice;
  final String? currency;
  final List<String> images;
  final String? category;
  final String? brand;
  final int stock;
  final bool inStock;
  final List<ProductVariant> variants;
  final Map<String, dynamic>? specifications;
  final double rating;
  final int reviewCount;
  final String sellerId;
  final String? sellerName;
  final bool featured;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Product({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    this.salePrice,
    this.currency = 'USD',
    this.images = const [],
    this.category,
    this.brand,
    this.stock = 0,
    this.inStock = true,
    this.variants = const [],
    this.specifications,
    this.rating = 0.0,
    this.reviewCount = 0,
    required this.sellerId,
    this.sellerName,
    this.featured = false,
    this.createdAt,
    this.updatedAt,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      price: (json['price'] ?? 0).toDouble(),
      salePrice:
          json['salePrice'] != null ? (json['salePrice']).toDouble() : null,
      currency: json['currency'] ?? 'USD',
      images: json['images'] != null ? List<String>.from(json['images']) : [],
      category: json['category'],
      brand: json['brand'],
      stock: json['stock'] ?? 0,
      inStock: json['inStock'] ?? true,
      variants: json['variants'] != null
          ? (json['variants'] as List)
              .map((v) => ProductVariant.fromJson(v))
              .toList()
          : [],
      specifications: json['specifications'],
      rating: (json['rating'] ?? 0).toDouble(),
      reviewCount: json['reviewCount'] ?? 0,
      sellerId: json['sellerId'] ?? json['seller']?['_id'] ?? '',
      sellerName: json['sellerName'] ?? json['seller']?['username'],
      featured: json['featured'] ?? false,
      createdAt:
          json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
      updatedAt:
          json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'price': price,
      if (salePrice != null) 'salePrice': salePrice,
      'currency': currency,
      'images': images,
      if (category != null) 'category': category,
      if (brand != null) 'brand': brand,
      'stock': stock,
      'inStock': inStock,
      'variants': variants.map((v) => v.toJson()).toList(),
      if (specifications != null) 'specifications': specifications,
      'rating': rating,
      'reviewCount': reviewCount,
      'sellerId': sellerId,
      if (sellerName != null) 'sellerName': sellerName,
      'featured': featured,
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
    };
  }

  double get finalPrice => salePrice ?? price;
  bool get onSale => salePrice != null && salePrice! < price;
  double get discountPercentage =>
      onSale ? ((price - salePrice!) / price * 100) : 0;
}

class ProductVariant {
  final String id;
  final String name;
  final Map<String, String> attributes; // color, size, etc.
  final double? priceAdjustment;
  final int stock;
  final String? sku;

  ProductVariant({
    required this.id,
    required this.name,
    this.attributes = const {},
    this.priceAdjustment,
    this.stock = 0,
    this.sku,
  });

  factory ProductVariant.fromJson(Map<String, dynamic> json) {
    return ProductVariant(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      attributes: json['attributes'] != null
          ? Map<String, String>.from(json['attributes'])
          : {},
      priceAdjustment: json['priceAdjustment'] != null
          ? (json['priceAdjustment']).toDouble()
          : null,
      stock: json['stock'] ?? 0,
      sku: json['sku'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'attributes': attributes,
      if (priceAdjustment != null) 'priceAdjustment': priceAdjustment,
      'stock': stock,
      if (sku != null) 'sku': sku,
    };
  }
}
