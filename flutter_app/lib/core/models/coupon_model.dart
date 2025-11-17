/// Coupon Model - Discount system
/// Matches backend/src/models/Coupon.js
enum CouponType {
  percentage,
  fixed,
  freeShipping,
  buyOneGetOne;

  static CouponType fromString(String value) {
    return CouponType.values.firstWhere(
      (e) => e.name == value,
      orElse: () => CouponType.percentage,
    );
  }
}

enum CouponStatus {
  active,
  inactive,
  expired;

  static CouponStatus fromString(String value) {
    return CouponStatus.values.firstWhere(
      (e) => e.name == value,
      orElse: () => CouponStatus.active,
    );
  }
}

class CouponModel {
  final String id;
  final String code;
  final String name;
  final String description;
  final CouponType type;
  final double discountValue;
  final double? minPurchaseAmount;
  final double? maxDiscountAmount;
  final CouponStatus status;
  final DateTime? startDate;
  final DateTime? endDate;
  final int? usageLimit;
  final int usageCount;
  final int? usageLimitPerUser;
  final List<String>? applicableProducts;
  final List<String>? applicableCategories;
  final List<String>? excludedProducts;
  final bool firstPurchaseOnly;
  final Map<String, dynamic>? metadata;
  final DateTime createdAt;
  final DateTime updatedAt;

  CouponModel({
    required this.id,
    required this.code,
    required this.name,
    required this.description,
    required this.type,
    required this.discountValue,
    this.minPurchaseAmount,
    this.maxDiscountAmount,
    this.status = CouponStatus.active,
    this.startDate,
    this.endDate,
    this.usageLimit,
    this.usageCount = 0,
    this.usageLimitPerUser,
    this.applicableProducts,
    this.applicableCategories,
    this.excludedProducts,
    this.firstPurchaseOnly = false,
    this.metadata,
    required this.createdAt,
    required this.updatedAt,
  });

  factory CouponModel.fromJson(Map<String, dynamic> json) {
    return CouponModel(
      id: json['_id'] ?? json['id'],
      code: json['code'],
      name: json['name'],
      description: json['description'] ?? '',
      type: CouponType.fromString(json['type'] ?? 'percentage'),
      discountValue: (json['discountValue'] ?? 0).toDouble(),
      minPurchaseAmount: json['minPurchaseAmount']?.toDouble(),
      maxDiscountAmount: json['maxDiscountAmount']?.toDouble(),
      status: CouponStatus.fromString(json['status'] ?? 'active'),
      startDate:
          json['startDate'] != null ? DateTime.parse(json['startDate']) : null,
      endDate: json['endDate'] != null ? DateTime.parse(json['endDate']) : null,
      usageLimit: json['usageLimit'],
      usageCount: json['usageCount'] ?? 0,
      usageLimitPerUser: json['usageLimitPerUser'],
      applicableProducts: json['applicableProducts'] != null
          ? List<String>.from(json['applicableProducts'])
          : null,
      applicableCategories: json['applicableCategories'] != null
          ? List<String>.from(json['applicableCategories'])
          : null,
      excludedProducts: json['excludedProducts'] != null
          ? List<String>.from(json['excludedProducts'])
          : null,
      firstPurchaseOnly: json['firstPurchaseOnly'] ?? false,
      metadata: json['metadata'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'code': code,
      'name': name,
      'description': description,
      'type': type.name,
      'discountValue': discountValue,
      if (minPurchaseAmount != null) 'minPurchaseAmount': minPurchaseAmount,
      if (maxDiscountAmount != null) 'maxDiscountAmount': maxDiscountAmount,
      'status': status.name,
      if (startDate != null) 'startDate': startDate!.toIso8601String(),
      if (endDate != null) 'endDate': endDate!.toIso8601String(),
      if (usageLimit != null) 'usageLimit': usageLimit,
      'usageCount': usageCount,
      if (usageLimitPerUser != null) 'usageLimitPerUser': usageLimitPerUser,
      if (applicableProducts != null) 'applicableProducts': applicableProducts,
      if (applicableCategories != null)
        'applicableCategories': applicableCategories,
      if (excludedProducts != null) 'excludedProducts': excludedProducts,
      'firstPurchaseOnly': firstPurchaseOnly,
      if (metadata != null) 'metadata': metadata,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  bool get isActive {
    if (status != CouponStatus.active) return false;

    final now = DateTime.now();
    if (startDate != null && now.isBefore(startDate!)) return false;
    if (endDate != null && now.isAfter(endDate!)) return false;
    if (usageLimit != null && usageCount >= usageLimit!) return false;

    return true;
  }

  bool get isExpired {
    if (endDate != null && DateTime.now().isAfter(endDate!)) return true;
    if (usageLimit != null && usageCount >= usageLimit!) return true;
    return false;
  }

  String get discountDisplay {
    switch (type) {
      case CouponType.percentage:
        return '${discountValue.toInt()}% OFF';
      case CouponType.fixed:
        return '\$${discountValue.toStringAsFixed(2)} OFF';
      case CouponType.freeShipping:
        return 'FREE SHIPPING';
      case CouponType.buyOneGetOne:
        return 'BOGO';
    }
  }

  double calculateDiscount(double amount) {
    if (!isActive) return 0;

    double discount = 0;

    switch (type) {
      case CouponType.percentage:
        discount = amount * (discountValue / 100);
        break;
      case CouponType.fixed:
        discount = discountValue;
        break;
      case CouponType.freeShipping:
        // Shipping cost should be passed separately
        discount = 0;
        break;
      case CouponType.buyOneGetOne:
        // Logic depends on cart items
        discount = 0;
        break;
    }

    if (maxDiscountAmount != null && discount > maxDiscountAmount!) {
      discount = maxDiscountAmount!;
    }

    return discount;
  }
}
