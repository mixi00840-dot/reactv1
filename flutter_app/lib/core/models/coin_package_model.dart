/// CoinPackage Model - Virtual currency packages
/// Matches backend/src/models/CoinPackage.js
class CoinPackageModel {
  final String id;
  final String name;
  final int coinAmount;
  final double price;
  final String currency;
  final int? bonusCoins;
  final bool popular;
  final bool active;
  final String? description;
  final String? imageUrl;
  final int sortOrder;
  final Map<String, dynamic>? metadata;
  final DateTime createdAt;
  final DateTime updatedAt;

  CoinPackageModel({
    required this.id,
    required this.name,
    required this.coinAmount,
    required this.price,
    this.currency = 'USD',
    this.bonusCoins,
    this.popular = false,
    this.active = true,
    this.description,
    this.imageUrl,
    this.sortOrder = 0,
    this.metadata,
    required this.createdAt,
    required this.updatedAt,
  });

  factory CoinPackageModel.fromJson(Map<String, dynamic> json) {
    return CoinPackageModel(
      id: json['_id'] ?? json['id'],
      name: json['name'],
      coinAmount: json['coinAmount'] ?? 0,
      price: (json['price'] ?? 0).toDouble(),
      currency: json['currency'] ?? 'USD',
      bonusCoins: json['bonusCoins'],
      popular: json['popular'] ?? false,
      active: json['active'] ?? true,
      description: json['description'],
      imageUrl: json['imageUrl'],
      sortOrder: json['sortOrder'] ?? 0,
      metadata: json['metadata'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'coinAmount': coinAmount,
      'price': price,
      'currency': currency,
      if (bonusCoins != null) 'bonusCoins': bonusCoins,
      'popular': popular,
      'active': active,
      if (description != null) 'description': description,
      if (imageUrl != null) 'imageUrl': imageUrl,
      'sortOrder': sortOrder,
      if (metadata != null) 'metadata': metadata,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  int get totalCoins => coinAmount + (bonusCoins ?? 0);

  double get pricePerCoin => price / coinAmount;

  String get displayPrice => '\$$price';

  bool get hasBonus => bonusCoins != null && bonusCoins! > 0;

  String get bonusText => hasBonus ? '+${bonusCoins} bonus' : '';
}
