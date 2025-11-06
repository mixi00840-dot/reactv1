/// Enhanced Product Model - Complete backend structure
/// Matches backend Product model with all fields

class ProductModel {
  // Basic Information
  final String id;
  final String title;
  final String? name; // Alias for title
  final String? slug;
  final String description;
  final String? shortDescription;
  
  // Store Information
  final String storeId;
  final String? storeName;
  final String ownerId;
  
  // Product Identification
  final String? sku;
  final String? barcode;
  final String? brand;
  
  // Categorization
  final List<String>? categoryIds;
  final String category; // Primary category
  final List<String>? tags;
  
  // Pricing
  final double price;
  final double? originalPrice; // Alias for salePrice
  final double? salePrice;
  final double? costPrice;
  final String currency;
  
  // Inventory Management
  final ProductInventory inventory;
  final int stock; // Legacy alias
  final bool hasVariants;
  final List<ProductVariant> variants;
  final VariantOptions? variantOptions;
  
  // Media
  final List<ProductImage> images;
  final List<ProductVideo>? videos;
  
  // Physical Properties
  final ProductWeight? weight;
  final ProductDimensions? dimensions;
  
  // Shipping
  final String? shippingClass;
  final bool requiresShipping;
  final bool freeShipping;
  
  // Tax
  final String? taxClass;
  final bool taxable;
  
  // Product Attributes
  final Map<String, dynamic>? attributes;
  final List<CustomField>? customFields;
  
  // Status & Visibility
  final ProductStatus status;
  final ProductVisibility visibility;
  final bool isFeatured;
  final bool isTrending;
  final bool isDigital;
  
  // SEO
  final ProductSEO? seo;
  
  // Product Metrics
  final ProductMetrics metrics;
  final double? rating; // Legacy alias
  final int reviewCount; // Legacy alias
  final int? views;
  final int? likes;
  
  // Dates
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final DateTime? publishedAt;
  final DateTime? featuredAt;
  final DateTime? lastSoldAt;
  
  // Processing
  final ProcessingTime? processingTime;
  
  // Admin
  final String? rejectionReason;
  final List<AdminNote>? adminNotes;

  ProductModel({
    required this.id,
    required this.title,
    this.name,
    this.slug,
    required this.description,
    this.shortDescription,
    required this.storeId,
    this.storeName,
    required this.ownerId,
    this.sku,
    this.barcode,
    this.brand,
    this.categoryIds,
    required this.category,
    this.tags,
    required this.price,
    this.originalPrice,
    this.salePrice,
    this.costPrice,
    this.currency = 'USD',
    required this.inventory,
    this.stock = 0,
    this.hasVariants = false,
    this.variants = const [],
    this.variantOptions,
    required this.images,
    this.videos,
    this.weight,
    this.dimensions,
    this.shippingClass,
    this.requiresShipping = true,
    this.freeShipping = false,
    this.taxClass,
    this.taxable = true,
    this.attributes,
    this.customFields,
    this.status = ProductStatus.draft,
    this.visibility = ProductVisibility.public,
    this.isFeatured = false,
    this.isTrending = false,
    this.isDigital = false,
    this.seo,
    required this.metrics,
    this.rating,
    this.reviewCount = 0,
    this.views,
    this.likes,
    this.createdAt,
    this.updatedAt,
    this.publishedAt,
    this.featuredAt,
    this.lastSoldAt,
    this.processingTime,
    this.rejectionReason,
    this.adminNotes,
  });

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    // Handle inventory from different formats
    ProductInventory inventory;
    if (json['inventory'] is Map) {
      inventory = ProductInventory.fromJson(json['inventory']);
    } else {
      inventory = ProductInventory(
        quantity: json['inventory'] ?? json['stock'] ?? 0,
        trackQuantity: true,
      );
    }

    // Handle metrics from different formats
    ProductMetrics metrics;
    if (json['metrics'] is Map) {
      metrics = ProductMetrics.fromJson(json['metrics']);
    } else {
      metrics = ProductMetrics(
        views: json['views'] ?? 0,
        favorites: json['likes'] ?? 0,
        averageRating: json['rating'] != null ? (json['rating'] as num).toDouble() : null,
        totalReviews: json['reviewCount'] ?? json['review_count'] ?? 0,
      );
    }

    return ProductModel(
      id: json['id'] ?? json['_id'] ?? '',
      title: json['title'] ?? json['name'] ?? '',
      name: json['name'] ?? json['title'],
      slug: json['slug'],
      description: json['description'] ?? '',
      shortDescription: json['shortDescription'] ?? json['short_description'],
      storeId: json['storeId'] ?? json['store_id'] ?? '',
      storeName: json['storeName'] ?? json['store_name'],
      ownerId: json['ownerId'] ?? json['owner_id'] ?? '',
      sku: json['sku'],
      barcode: json['barcode'],
      brand: json['brand'],
      categoryIds: json['categoryIds'] != null
          ? List<String>.from(json['categoryIds'])
          : json['category_ids'] != null
              ? List<String>.from(json['category_ids'])
              : null,
      category: json['category'] ?? 'general',
      tags: json['tags'] != null ? List<String>.from(json['tags']) : null,
      price: (json['price'] ?? 0).toDouble(),
      originalPrice: json['originalPrice'] != null
          ? (json['originalPrice'] as num).toDouble()
          : json['original_price'] != null
              ? (json['original_price'] as num).toDouble()
              : json['salePrice'] != null
                  ? (json['salePrice'] as num).toDouble()
                  : null,
      salePrice: json['salePrice'] != null
          ? (json['salePrice'] as num).toDouble()
          : json['sale_price'] != null
              ? (json['sale_price'] as num).toDouble()
              : null,
      costPrice: json['costPrice'] != null
          ? (json['costPrice'] as num).toDouble()
          : json['cost_price'] != null
              ? (json['cost_price'] as num).toDouble()
              : null,
      currency: json['currency'] ?? 'USD',
      inventory: inventory,
      stock: inventory.quantity,
      hasVariants: json['hasVariants'] ?? json['has_variants'] ?? false,
      variants: (json['variants'] ?? []).map((v) => ProductVariant.fromJson(v)).toList(),
      variantOptions: json['variantOptions'] != null
          ? VariantOptions.fromJson(json['variantOptions'])
          : json['variant_options'] != null
              ? VariantOptions.fromJson(json['variant_options'])
              : null,
      images: (json['images'] ?? []).map((img) {
        if (img is String) {
          return ProductImage(url: img, isPrimary: false);
        }
        return ProductImage.fromJson(img);
      }).toList(),
      videos: json['videos'] != null
          ? (json['videos'] as List).map((v) => ProductVideo.fromJson(v)).toList()
          : null,
      weight: json['weight'] != null ? ProductWeight.fromJson(json['weight']) : null,
      dimensions: json['dimensions'] != null
          ? ProductDimensions.fromJson(json['dimensions'])
          : null,
      shippingClass: json['shippingClass'] ?? json['shipping_class'],
      requiresShipping: json['requiresShipping'] ?? json['requires_shipping'] ?? true,
      freeShipping: json['freeShipping'] ?? json['free_shipping'] ?? false,
      taxClass: json['taxClass'] ?? json['tax_class'],
      taxable: json['taxable'] ?? true,
      attributes: json['attributes'],
      customFields: json['customFields'] != null
          ? (json['customFields'] as List).map((f) => CustomField.fromJson(f)).toList()
          : json['custom_fields'] != null
              ? (json['custom_fields'] as List).map((f) => CustomField.fromJson(f)).toList()
              : null,
      status: _parseProductStatus(json['status'] ?? 'draft'),
      visibility: _parseProductVisibility(json['visibility'] ?? 'public'),
      isFeatured: json['isFeatured'] ?? json['is_featured'] ?? false,
      isTrending: json['isTrending'] ?? json['is_trending'] ?? false,
      isDigital: json['isDigital'] ?? json['is_digital'] ?? false,
      seo: json['seo'] != null ? ProductSEO.fromJson(json['seo']) : null,
      metrics: metrics,
      rating: metrics.averageRating,
      reviewCount: metrics.totalReviews,
      views: metrics.views,
      likes: metrics.favorites,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'].toString())
          : json['created_at'] != null
              ? DateTime.parse(json['created_at'].toString())
              : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'].toString())
          : json['updated_at'] != null
              ? DateTime.parse(json['updated_at'].toString())
              : null,
      publishedAt: json['publishedAt'] != null
          ? DateTime.parse(json['publishedAt'].toString())
          : json['published_at'] != null
              ? DateTime.parse(json['published_at'].toString())
              : null,
      featuredAt: json['featuredAt'] != null
          ? DateTime.parse(json['featuredAt'].toString())
          : json['featured_at'] != null
              ? DateTime.parse(json['featured_at'].toString())
              : null,
      lastSoldAt: json['lastSoldAt'] != null
          ? DateTime.parse(json['lastSoldAt'].toString())
          : json['last_sold_at'] != null
              ? DateTime.parse(json['last_sold_at'].toString())
              : null,
      processingTime: json['processingTime'] != null
          ? ProcessingTime.fromJson(json['processingTime'])
          : json['processing_time'] != null
              ? ProcessingTime.fromJson(json['processing_time'])
              : null,
      rejectionReason: json['rejectionReason'] ?? json['rejection_reason'],
      adminNotes: json['adminNotes'] != null
          ? (json['adminNotes'] as List).map((n) => AdminNote.fromJson(n)).toList()
          : json['admin_notes'] != null
              ? (json['admin_notes'] as List).map((n) => AdminNote.fromJson(n)).toList()
              : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      if (name != null) 'name': name,
      if (slug != null) 'slug': slug,
      'description': description,
      if (shortDescription != null) 'shortDescription': shortDescription,
      'storeId': storeId,
      if (storeName != null) 'storeName': storeName,
      'ownerId': ownerId,
      if (sku != null) 'sku': sku,
      if (barcode != null) 'barcode': barcode,
      if (brand != null) 'brand': brand,
      if (categoryIds != null) 'categoryIds': categoryIds,
      'category': category,
      if (tags != null) 'tags': tags,
      'price': price,
      if (originalPrice != null) 'originalPrice': originalPrice,
      if (salePrice != null) 'salePrice': salePrice,
      if (costPrice != null) 'costPrice': costPrice,
      'currency': currency,
      'inventory': inventory.toJson(),
      'hasVariants': hasVariants,
      'variants': variants.map((v) => v.toJson()).toList(),
      if (variantOptions != null) 'variantOptions': variantOptions!.toJson(),
      'images': images.map((img) => img.toJson()).toList(),
      if (videos != null) 'videos': videos!.map((v) => v.toJson()).toList(),
      if (weight != null) 'weight': weight!.toJson(),
      if (dimensions != null) 'dimensions': dimensions!.toJson(),
      if (shippingClass != null) 'shippingClass': shippingClass,
      'requiresShipping': requiresShipping,
      'freeShipping': freeShipping,
      if (taxClass != null) 'taxClass': taxClass,
      'taxable': taxable,
      if (attributes != null) 'attributes': attributes,
      if (customFields != null)
        'customFields': customFields!.map((f) => f.toJson()).toList(),
      'status': status.name,
      'visibility': visibility.name,
      'isFeatured': isFeatured,
      'isTrending': isTrending,
      'isDigital': isDigital,
      if (seo != null) 'seo': seo!.toJson(),
      'metrics': metrics.toJson(),
      if (views != null) 'views': views,
      if (likes != null) 'likes': likes,
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
      if (publishedAt != null) 'publishedAt': publishedAt!.toIso8601String(),
      if (featuredAt != null) 'featuredAt': featuredAt!.toIso8601String(),
      if (lastSoldAt != null) 'lastSoldAt': lastSoldAt!.toIso8601String(),
      if (processingTime != null) 'processingTime': processingTime!.toJson(),
      if (rejectionReason != null) 'rejectionReason': rejectionReason,
      if (adminNotes != null) 'adminNotes': adminNotes!.map((n) => n.toJson()).toList(),
    };
  }

  ProductModel copyWith({
    String? id,
    String? title,
    String? name,
    String? slug,
    String? description,
    String? shortDescription,
    String? storeId,
    String? storeName,
    String? ownerId,
    String? sku,
    String? barcode,
    String? brand,
    List<String>? categoryIds,
    String? category,
    List<String>? tags,
    double? price,
    double? originalPrice,
    double? salePrice,
    double? costPrice,
    String? currency,
    ProductInventory? inventory,
    int? stock,
    bool? hasVariants,
    List<ProductVariant>? variants,
    VariantOptions? variantOptions,
    List<ProductImage>? images,
    List<ProductVideo>? videos,
    ProductWeight? weight,
    ProductDimensions? dimensions,
    String? shippingClass,
    bool? requiresShipping,
    bool? freeShipping,
    String? taxClass,
    bool? taxable,
    Map<String, dynamic>? attributes,
    List<CustomField>? customFields,
    ProductStatus? status,
    ProductVisibility? visibility,
    bool? isFeatured,
    bool? isTrending,
    bool? isDigital,
    ProductSEO? seo,
    ProductMetrics? metrics,
    double? rating,
    int? reviewCount,
    int? views,
    int? likes,
    DateTime? createdAt,
    DateTime? updatedAt,
    DateTime? publishedAt,
    DateTime? featuredAt,
    DateTime? lastSoldAt,
    ProcessingTime? processingTime,
    String? rejectionReason,
    List<AdminNote>? adminNotes,
  }) {
    return ProductModel(
      id: id ?? this.id,
      title: title ?? this.title,
      name: name ?? this.name,
      slug: slug ?? this.slug,
      description: description ?? this.description,
      shortDescription: shortDescription ?? this.shortDescription,
      storeId: storeId ?? this.storeId,
      storeName: storeName ?? this.storeName,
      ownerId: ownerId ?? this.ownerId,
      sku: sku ?? this.sku,
      barcode: barcode ?? this.barcode,
      brand: brand ?? this.brand,
      categoryIds: categoryIds ?? this.categoryIds,
      category: category ?? this.category,
      tags: tags ?? this.tags,
      price: price ?? this.price,
      originalPrice: originalPrice ?? this.originalPrice,
      salePrice: salePrice ?? this.salePrice,
      costPrice: costPrice ?? this.costPrice,
      currency: currency ?? this.currency,
      inventory: inventory ?? this.inventory,
      stock: stock ?? this.stock,
      hasVariants: hasVariants ?? this.hasVariants,
      variants: variants ?? this.variants,
      variantOptions: variantOptions ?? this.variantOptions,
      images: images ?? this.images,
      videos: videos ?? this.videos,
      weight: weight ?? this.weight,
      dimensions: dimensions ?? this.dimensions,
      shippingClass: shippingClass ?? this.shippingClass,
      requiresShipping: requiresShipping ?? this.requiresShipping,
      freeShipping: freeShipping ?? this.freeShipping,
      taxClass: taxClass ?? this.taxClass,
      taxable: taxable ?? this.taxable,
      attributes: attributes ?? this.attributes,
      customFields: customFields ?? this.customFields,
      status: status ?? this.status,
      visibility: visibility ?? this.visibility,
      isFeatured: isFeatured ?? this.isFeatured,
      isTrending: isTrending ?? this.isTrending,
      isDigital: isDigital ?? this.isDigital,
      seo: seo ?? this.seo,
      metrics: metrics ?? this.metrics,
      rating: rating ?? this.rating,
      reviewCount: reviewCount ?? this.reviewCount,
      views: views ?? this.views,
      likes: likes ?? this.likes,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      publishedAt: publishedAt ?? this.publishedAt,
      featuredAt: featuredAt ?? this.featuredAt,
      lastSoldAt: lastSoldAt ?? this.lastSoldAt,
      processingTime: processingTime ?? this.processingTime,
      rejectionReason: rejectionReason ?? this.rejectionReason,
      adminNotes: adminNotes ?? this.adminNotes,
    );
  }

  // Helper getters
  String get sellerId => ownerId;
  String get sellerName => storeName ?? 'Store';
  String get sellerAvatar => ''; // Will be loaded from store
  int get inventoryCount => inventory.quantity;
  bool get isInStock => inventory.quantity > 0 && status == ProductStatus.active;
  bool get isLowStock => inventory.quantity <= inventory.lowStockThreshold;
  bool get isOutOfStock => inventory.quantity == 0;
  double get discountPercentage {
    final original = salePrice ?? originalPrice;
    if (original == null || original <= price) return 0;
    return ((original - price) / original) * 100;
  }
  bool get hasDiscount => (salePrice ?? originalPrice) != null && 
                          (salePrice ?? originalPrice)! > price;
  double get displayPrice => salePrice ?? price;
  String? get primaryImageUrl => images.isNotEmpty ? images.first.url : null;

  static ProductStatus _parseProductStatus(dynamic value) {
    if (value is String) {
      return ProductStatus.values.firstWhere(
        (e) => e.name == value.toLowerCase().replaceAll('_', ''),
        orElse: () => ProductStatus.draft,
      );
    }
    return ProductStatus.draft;
  }

  static ProductVisibility _parseProductVisibility(dynamic value) {
    if (value is String) {
      return ProductVisibility.values.firstWhere(
        (e) => e.name == value.toLowerCase(),
        orElse: () => ProductVisibility.public,
      );
    }
    return ProductVisibility.public;
  }
}

// Enums
enum ProductStatus { draft, pending, active, inactive, rejected, blocked }
enum ProductVisibility { public, private, unlisted }

// Supporting Models
class ProductInventory {
  final bool trackQuantity;
  final int quantity;
  final int reserved;
  final int lowStockThreshold;
  final StockStatus stockStatus;
  final bool allowBackorders;

  ProductInventory({
    this.trackQuantity = true,
    this.quantity = 0,
    this.reserved = 0,
    this.lowStockThreshold = 5,
    this.stockStatus = StockStatus.inStock,
    this.allowBackorders = false,
  });

  factory ProductInventory.fromJson(Map<String, dynamic> json) {
    return ProductInventory(
      trackQuantity: json['trackQuantity'] ?? json['track_quantity'] ?? true,
      quantity: json['quantity'] ?? 0,
      reserved: json['reserved'] ?? 0,
      lowStockThreshold: json['lowStockThreshold'] ?? json['low_stock_threshold'] ?? 5,
      stockStatus: _parseStockStatus(json['stockStatus'] ?? json['stock_status'] ?? 'in_stock'),
      allowBackorders: json['allowBackorders'] ?? json['allow_backorders'] ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
    'trackQuantity': trackQuantity,
    'quantity': quantity,
    'reserved': reserved,
    'lowStockThreshold': lowStockThreshold,
    'stockStatus': stockStatus.name,
    'allowBackorders': allowBackorders,
  };

  int get availableQuantity => quantity - reserved;
  bool get isInStock => quantity > 0;
  bool get isLowStock => quantity <= lowStockThreshold;

  static StockStatus _parseStockStatus(dynamic value) {
    if (value is String) {
      return StockStatus.values.firstWhere(
        (e) => e.name == value.toLowerCase().replaceAll('_', ''),
        orElse: () => StockStatus.inStock,
      );
    }
    return StockStatus.inStock;
  }
}

enum StockStatus { inStock, lowStock, outOfStock, onBackorder }

class ProductVariant {
  final String id;
  final String? sku;
  final String name;
  final String type; // color, size, etc.
  final Map<String, String>? attributes;
  final double? price;
  final double? salePrice;
  final VariantStock stock;
  final double? weight;
  final VariantDimensions? dimensions;
  final bool isActive;

  ProductVariant({
    required this.id,
    this.sku,
    required this.name,
    required this.type,
    this.attributes,
    this.price,
    this.salePrice,
    required this.stock,
    this.weight,
    this.dimensions,
    this.isActive = true,
  });

  factory ProductVariant.fromJson(Map<String, dynamic> json) {
    return ProductVariant(
      id: json['id'] ?? json['_id'] ?? '',
      sku: json['sku'],
      name: json['name'] ?? '',
      type: json['type'] ?? 'color',
      attributes: json['attributes'] != null
          ? Map<String, String>.from(json['attributes'])
          : null,
      price: json['price'] != null ? (json['price'] as num).toDouble() : null,
      salePrice: json['salePrice'] != null
          ? (json['salePrice'] as num).toDouble()
          : json['sale_price'] != null
              ? (json['sale_price'] as num).toDouble()
              : null,
      stock: VariantStock.fromJson(json['stock'] ?? {}),
      weight: json['weight'] != null ? (json['weight'] as num).toDouble() : null,
      dimensions: json['dimensions'] != null
          ? VariantDimensions.fromJson(json['dimensions'])
          : null,
      isActive: json['isActive'] ?? json['is_active'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      if (sku != null) 'sku': sku,
      'name': name,
      'type': type,
      if (attributes != null) 'attributes': attributes,
      if (price != null) 'price': price,
      if (salePrice != null) 'salePrice': salePrice,
      'stock': stock.toJson(),
      if (weight != null) 'weight': weight,
      if (dimensions != null) 'dimensions': dimensions!.toJson(),
      'isActive': isActive,
    };
  }

  // Legacy getters for backward compatibility
  double? get priceAdjustment => price;
  String? get imageUrl => null; // Will be in attributes
  int? get stockQuantity => stock.quantity;
}

class VariantStock {
  final int quantity;
  final int reserved;
  final int lowStockThreshold;

  VariantStock({
    this.quantity = 0,
    this.reserved = 0,
    this.lowStockThreshold = 5,
  });

  factory VariantStock.fromJson(Map<String, dynamic> json) {
    return VariantStock(
      quantity: json['quantity'] ?? 0,
      reserved: json['reserved'] ?? 0,
      lowStockThreshold: json['lowStockThreshold'] ?? json['low_stock_threshold'] ?? 5,
    );
  }

  Map<String, dynamic> toJson() => {
    'quantity': quantity,
    'reserved': reserved,
    'lowStockThreshold': lowStockThreshold,
  };
}

class VariantDimensions {
  final double? length;
  final double? width;
  final double? height;
  final String unit;

  VariantDimensions({
    this.length,
    this.width,
    this.height,
    this.unit = 'cm',
  });

  factory VariantDimensions.fromJson(Map<String, dynamic> json) {
    return VariantDimensions(
      length: json['length'] != null ? (json['length'] as num).toDouble() : null,
      width: json['width'] != null ? (json['width'] as num).toDouble() : null,
      height: json['height'] != null ? (json['height'] as num).toDouble() : null,
      unit: json['unit'] ?? 'cm',
    );
  }

  Map<String, dynamic> toJson() => {
    if (length != null) 'length': length,
    if (width != null) 'width': width,
    if (height != null) 'height': height,
    'unit': unit,
  };
}

class VariantOptions {
  final List<String>? color;
  final List<String>? size;
  final List<String>? material;
  final List<String>? style;

  VariantOptions({
    this.color,
    this.size,
    this.material,
    this.style,
  });

  factory VariantOptions.fromJson(Map<String, dynamic> json) {
    return VariantOptions(
      color: json['color'] != null ? List<String>.from(json['color']) : null,
      size: json['size'] != null ? List<String>.from(json['size']) : null,
      material: json['material'] != null ? List<String>.from(json['material']) : null,
      style: json['style'] != null ? List<String>.from(json['style']) : null,
    );
  }

  Map<String, dynamic> toJson() => {
    if (color != null) 'color': color,
    if (size != null) 'size': size,
    if (material != null) 'material': material,
    if (style != null) 'style': style,
  };
}

class ProductImage {
  final String url;
  final String? alt;
  final bool isPrimary;
  final int order;

  ProductImage({
    required this.url,
    this.alt,
    this.isPrimary = false,
    this.order = 0,
  });

  factory ProductImage.fromJson(Map<String, dynamic> json) {
    return ProductImage(
      url: json['url'] ?? '',
      alt: json['alt'],
      isPrimary: json['isPrimary'] ?? json['is_primary'] ?? false,
      order: json['order'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'url': url,
    if (alt != null) 'alt': alt,
    'isPrimary': isPrimary,
    'order': order,
  };
}

class ProductVideo {
  final String url;
  final String? thumbnail;
  final int? duration;
  final VideoType type;

  ProductVideo({
    required this.url,
    this.thumbnail,
    this.duration,
    this.type = VideoType.productDemo,
  });

  factory ProductVideo.fromJson(Map<String, dynamic> json) {
    return ProductVideo(
      url: json['url'] ?? '',
      thumbnail: json['thumbnail'],
      duration: json['duration'],
      type: _parseVideoType(json['type'] ?? 'product_demo'),
    );
  }

  Map<String, dynamic> toJson() => {
    'url': url,
    if (thumbnail != null) 'thumbnail': thumbnail,
    if (duration != null) 'duration': duration,
    'type': type.name,
  };

  static VideoType _parseVideoType(dynamic value) {
    if (value is String) {
      return VideoType.values.firstWhere(
        (e) => e.name == value.toLowerCase().replaceAll('_', ''),
        orElse: () => VideoType.productDemo,
      );
    }
    return VideoType.productDemo;
  }
}

enum VideoType { productDemo, unboxing, tutorial }

class ProductWeight {
  final double value;
  final WeightUnit unit;

  ProductWeight({
    required this.value,
    this.unit = WeightUnit.kg,
  });

  factory ProductWeight.fromJson(Map<String, dynamic> json) {
    return ProductWeight(
      value: (json['value'] ?? 0).toDouble(),
      unit: _parseWeightUnit(json['unit'] ?? 'kg'),
    );
  }

  Map<String, dynamic> toJson() => {
    'value': value,
    'unit': unit.name,
  };

  static WeightUnit _parseWeightUnit(dynamic value) {
    if (value is String) {
      return WeightUnit.values.firstWhere(
        (e) => e.name == value.toLowerCase(),
        orElse: () => WeightUnit.kg,
      );
    }
    return WeightUnit.kg;
  }
}

enum WeightUnit { g, kg, oz, lb }

class ProductDimensions {
  final double? length;
  final double? width;
  final double? height;
  final DimensionUnit unit;

  ProductDimensions({
    this.length,
    this.width,
    this.height,
    this.unit = DimensionUnit.cm,
  });

  factory ProductDimensions.fromJson(Map<String, dynamic> json) {
    return ProductDimensions(
      length: json['length'] != null ? (json['length'] as num).toDouble() : null,
      width: json['width'] != null ? (json['width'] as num).toDouble() : null,
      height: json['height'] != null ? (json['height'] as num).toDouble() : null,
      unit: _parseDimensionUnit(json['unit'] ?? 'cm'),
    );
  }

  Map<String, dynamic> toJson() => {
    if (length != null) 'length': length,
    if (width != null) 'width': width,
    if (height != null) 'height': height,
    'unit': unit.name,
  };

  static DimensionUnit _parseDimensionUnit(dynamic value) {
    if (value is String) {
      return DimensionUnit.values.firstWhere(
        (e) => e.name == value.toLowerCase(),
        orElse: () => DimensionUnit.cm,
      );
    }
    return DimensionUnit.cm;
  }
}

enum DimensionUnit { cm, in_ }

class ProductSEO {
  final String? metaTitle;
  final String? metaDescription;
  final List<String>? metaKeywords;
  final String? canonicalUrl;

  ProductSEO({
    this.metaTitle,
    this.metaDescription,
    this.metaKeywords,
    this.canonicalUrl,
  });

  factory ProductSEO.fromJson(Map<String, dynamic> json) {
    return ProductSEO(
      metaTitle: json['metaTitle'] ?? json['meta_title'],
      metaDescription: json['metaDescription'] ?? json['meta_description'],
      metaKeywords: json['metaKeywords'] != null
          ? List<String>.from(json['metaKeywords'])
          : json['meta_keywords'] != null
              ? List<String>.from(json['meta_keywords'])
              : null,
      canonicalUrl: json['canonicalUrl'] ?? json['canonical_url'],
    );
  }

  Map<String, dynamic> toJson() => {
    if (metaTitle != null) 'metaTitle': metaTitle,
    if (metaDescription != null) 'metaDescription': metaDescription,
    if (metaKeywords != null) 'metaKeywords': metaKeywords,
    if (canonicalUrl != null) 'canonicalUrl': canonicalUrl,
  };
}

class ProductMetrics {
  final int views;
  final int favorites;
  final int shares;
  final int totalSales;
  final double totalRevenue;
  final double? averageRating;
  final int totalReviews;
  final double? conversionRate;

  ProductMetrics({
    this.views = 0,
    this.favorites = 0,
    this.shares = 0,
    this.totalSales = 0,
    this.totalRevenue = 0.0,
    this.averageRating,
    this.totalReviews = 0,
    this.conversionRate,
  });

  factory ProductMetrics.fromJson(Map<String, dynamic> json) {
    return ProductMetrics(
      views: json['views'] ?? 0,
      favorites: json['favorites'] ?? json['likes'] ?? 0,
      shares: json['shares'] ?? 0,
      totalSales: json['totalSales'] ?? json['total_sales'] ?? 0,
      totalRevenue: (json['totalRevenue'] ?? json['total_revenue'] ?? 0).toDouble(),
      averageRating: json['averageRating'] != null
          ? (json['averageRating'] as num).toDouble()
          : json['average_rating'] != null
              ? (json['average_rating'] as num).toDouble()
              : null,
      totalReviews: json['totalReviews'] ?? json['total_reviews'] ?? 0,
      conversionRate: json['conversionRate'] != null
          ? (json['conversionRate'] as num).toDouble()
          : json['conversion_rate'] != null
              ? (json['conversion_rate'] as num).toDouble()
              : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'views': views,
    'favorites': favorites,
    'shares': shares,
    'totalSales': totalSales,
    'totalRevenue': totalRevenue,
    if (averageRating != null) 'averageRating': averageRating,
    'totalReviews': totalReviews,
    if (conversionRate != null) 'conversionRate': conversionRate,
  };
}

class ProcessingTime {
  final int min;
  final int max;
  final ProcessingUnit unit;

  ProcessingTime({
    this.min = 1,
    this.max = 3,
    this.unit = ProcessingUnit.days,
  });

  factory ProcessingTime.fromJson(Map<String, dynamic> json) {
    return ProcessingTime(
      min: json['min'] ?? 1,
      max: json['max'] ?? 3,
      unit: _parseProcessingUnit(json['unit'] ?? 'days'),
    );
  }

  Map<String, dynamic> toJson() => {
    'min': min,
    'max': max,
    'unit': unit.name,
  };

  static ProcessingUnit _parseProcessingUnit(dynamic value) {
    if (value is String) {
      return ProcessingUnit.values.firstWhere(
        (e) => e.name == value.toLowerCase(),
        orElse: () => ProcessingUnit.days,
      );
    }
    return ProcessingUnit.days;
  }
}

enum ProcessingUnit { hours, days, weeks }

class CustomField {
  final String name;
  final String value;
  final CustomFieldType type;

  CustomField({
    required this.name,
    required this.value,
    this.type = CustomFieldType.text,
  });

  factory CustomField.fromJson(Map<String, dynamic> json) {
    return CustomField(
      name: json['name'] ?? '',
      value: json['value'] ?? '',
      type: _parseCustomFieldType(json['type'] ?? 'text'),
    );
  }

  Map<String, dynamic> toJson() => {
    'name': name,
    'value': value,
    'type': type.name,
  };

  static CustomFieldType _parseCustomFieldType(dynamic value) {
    if (value is String) {
      return CustomFieldType.values.firstWhere(
        (e) => e.name == value.toLowerCase(),
        orElse: () => CustomFieldType.text,
      );
    }
    return CustomFieldType.text;
  }
}

enum CustomFieldType { text, number, boolean, date, url }

class AdminNote {
  final String note;
  final String? adminId;
  final DateTime createdAt;

  AdminNote({
    required this.note,
    this.adminId,
    required this.createdAt,
  });

  factory AdminNote.fromJson(Map<String, dynamic> json) {
    return AdminNote(
      note: json['note'] ?? '',
      adminId: json['adminId'] ?? json['admin_id'],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'].toString())
          : json['created_at'] != null
              ? DateTime.parse(json['created_at'].toString())
              : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
    'note': note,
    if (adminId != null) 'adminId': adminId,
    'createdAt': createdAt.toIso8601String(),
  };
}

// Legacy models for backward compatibility
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
    final basePrice = product.displayPrice;
    final variantPrice = selectedVariant?.price ?? selectedVariant?.salePrice ?? 0;
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
