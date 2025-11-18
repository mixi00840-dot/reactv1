/// Coin package model for purchasing virtual coins
class CoinPackageModel {
  final String id;
  final String name;
  final String description;
  final int coinAmount;
  final double price;
  final String currency;
  final double? discountPercentage;
  final bool isPopular;
  final bool isLimitedTime;
  final DateTime? validUntil;
  final Map<String, dynamic>? metadata;
  final DateTime createdAt;
  final DateTime updatedAt;

  CoinPackageModel({
    required this.id,
    required this.name,
    required this.description,
    required this.coinAmount,
    required this.price,
    this.currency = 'USD',
    this.discountPercentage,
    this.isPopular = false,
    this.isLimitedTime = false,
    this.validUntil,
    this.metadata,
    required this.createdAt,
    required this.updatedAt,
  });

  factory CoinPackageModel.fromJson(Map<String, dynamic> json) {
    return CoinPackageModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      coinAmount: json['coinAmount'] ?? 0,
      price: (json['price'] ?? 0).toDouble(),
      currency: json['currency'] ?? 'USD',
      discountPercentage: json['discountPercentage']?.toDouble(),
      isPopular: json['isPopular'] ?? false,
      isLimitedTime: json['isLimitedTime'] ?? false,
      validUntil: json['validUntil'] != null ? DateTime.parse(json['validUntil']) : null,
      metadata: json['metadata'],
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'description': description,
      'coinAmount': coinAmount,
      'price': price,
      'currency': currency,
      if (discountPercentage != null) 'discountPercentage': discountPercentage,
      'isPopular': isPopular,
      'isLimitedTime': isLimitedTime,
      if (validUntil != null) 'validUntil': validUntil!.toIso8601String(),
      if (metadata != null) 'metadata': metadata,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  double get pricePerCoin => coinAmount > 0 ? price / coinAmount : 0;
  
  double get finalPrice {
    if (discountPercentage != null && discountPercentage! > 0) {
      return price * (1 - discountPercentage! / 100);
    }
    return price;
  }

  double get savings => price - finalPrice;
  
  bool get hasDiscount => discountPercentage != null && discountPercentage! > 0;
  
  bool get isExpired {
    if (validUntil == null) return false;
    return DateTime.now().isAfter(validUntil!);
  }

  String get displayPrice => '\$${finalPrice.toStringAsFixed(2)}';
  
  String get coinAmountDisplay => '${coinAmount.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')} Coins';
  
  // Backward compatibility getters
  int get coins => coinAmount;
  int? get bonus => discountPercentage != null && discountPercentage! > 0 ? 
    (coinAmount * (discountPercentage! / 100)).round() : null;
}