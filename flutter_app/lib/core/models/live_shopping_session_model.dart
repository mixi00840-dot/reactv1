/// LiveShoppingSession Model - Live commerce
/// Matches backend/src/models/LiveShoppingSession.js
enum LiveShoppingStatus {
  scheduled,
  live,
  ended,
  cancelled;

  static LiveShoppingStatus fromString(String value) {
    return LiveShoppingStatus.values.firstWhere(
      (e) => e.name == value,
      orElse: () => LiveShoppingStatus.scheduled,
    );
  }
}

class FeaturedProduct {
  final String productId;
  final double? discountPercent;
  final int? stockLimit;
  final int soldCount;
  final DateTime? addedAt;

  FeaturedProduct({
    required this.productId,
    this.discountPercent,
    this.stockLimit,
    this.soldCount = 0,
    this.addedAt,
  });

  factory FeaturedProduct.fromJson(Map<String, dynamic> json) {
    return FeaturedProduct(
      productId: json['productId'],
      discountPercent: json['discountPercent']?.toDouble(),
      stockLimit: json['stockLimit'],
      soldCount: json['soldCount'] ?? 0,
      addedAt: json['addedAt'] != null ? DateTime.parse(json['addedAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'productId': productId,
      if (discountPercent != null) 'discountPercent': discountPercent,
      if (stockLimit != null) 'stockLimit': stockLimit,
      'soldCount': soldCount,
      if (addedAt != null) 'addedAt': addedAt!.toIso8601String(),
    };
  }

  bool get isOutOfStock => stockLimit != null && soldCount >= stockLimit!;
  bool get hasDiscount => discountPercent != null && discountPercent! > 0;
}

class LiveShoppingSessionModel {
  final String id;
  final String liveStreamId;
  final String hostId;
  final LiveShoppingStatus status;
  final List<FeaturedProduct> featuredProducts;
  final String? currentProductId;
  final int totalOrders;
  final double totalRevenue;
  final int viewerCount;
  final DateTime? startTime;
  final DateTime? endTime;
  final Map<String, dynamic>? metadata;
  final DateTime createdAt;
  final DateTime updatedAt;

  LiveShoppingSessionModel({
    required this.id,
    required this.liveStreamId,
    required this.hostId,
    this.status = LiveShoppingStatus.scheduled,
    this.featuredProducts = const [],
    this.currentProductId,
    this.totalOrders = 0,
    this.totalRevenue = 0,
    this.viewerCount = 0,
    this.startTime,
    this.endTime,
    this.metadata,
    required this.createdAt,
    required this.updatedAt,
  });

  factory LiveShoppingSessionModel.fromJson(Map<String, dynamic> json) {
    return LiveShoppingSessionModel(
      id: json['_id'] ?? json['id'],
      liveStreamId: json['liveStream'] ?? json['liveStreamId'],
      hostId: json['host'] ?? json['hostId'],
      status: LiveShoppingStatus.fromString(json['status'] ?? 'scheduled'),
      featuredProducts: json['featuredProducts'] != null
          ? (json['featuredProducts'] as List)
              .map((p) => FeaturedProduct.fromJson(p))
              .toList()
          : [],
      currentProductId: json['currentProduct'],
      totalOrders: json['totalOrders'] ?? 0,
      totalRevenue: (json['totalRevenue'] ?? 0).toDouble(),
      viewerCount: json['viewerCount'] ?? 0,
      startTime:
          json['startTime'] != null ? DateTime.parse(json['startTime']) : null,
      endTime: json['endTime'] != null ? DateTime.parse(json['endTime']) : null,
      metadata: json['metadata'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'liveStream': liveStreamId,
      'host': hostId,
      'status': status.name,
      'featuredProducts': featuredProducts.map((p) => p.toJson()).toList(),
      if (currentProductId != null) 'currentProduct': currentProductId,
      'totalOrders': totalOrders,
      'totalRevenue': totalRevenue,
      'viewerCount': viewerCount,
      if (startTime != null) 'startTime': startTime!.toIso8601String(),
      if (endTime != null) 'endTime': endTime!.toIso8601String(),
      if (metadata != null) 'metadata': metadata,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  bool get isLive => status == LiveShoppingStatus.live;
  bool get isEnded => status == LiveShoppingStatus.ended;
  bool get hasProducts => featuredProducts.isNotEmpty;

  // Convenience getters for backward compatibility
  String get streamUrl => 'https://stream.mixillo.com/live/$liveStreamId';
  String get title => 'Live Shopping Session ${id.substring(0, 8)}';

  double get conversionRate {
    if (viewerCount == 0) return 0;
    return (totalOrders / viewerCount) * 100;
  }

  double get averageOrderValue {
    if (totalOrders == 0) return 0;
    return totalRevenue / totalOrders;
  }

  FeaturedProduct? getCurrentProduct() {
    if (currentProductId == null) return null;
    try {
      return featuredProducts.firstWhere(
        (p) => p.productId == currentProductId,
      );
    } catch (e) {
      return null;
    }
  }
}
