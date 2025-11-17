/// Gift Model - Virtual gift catalog
/// Matches backend/src/models/Gift.js
enum GiftCategory {
  sticker,
  emoji,
  animation,
  vip,
  seasonal,
  special;

  static GiftCategory fromString(String value) {
    return GiftCategory.values.firstWhere(
      (e) => e.name == value,
      orElse: () => GiftCategory.sticker,
    );
  }
}

enum GiftRarity {
  common,
  rare,
  epic,
  legendary;

  static GiftRarity fromString(String value) {
    return GiftRarity.values.firstWhere(
      (e) => e.name == value,
      orElse: () => GiftRarity.common,
    );
  }
}

class GiftModel {
  final String id;
  final String name;
  final String description;
  final GiftCategory category;
  final GiftRarity rarity;
  final double coinPrice;
  final String imageUrl;
  final String? animationUrl;
  final Map<String, dynamic>? effects;
  final bool active;
  final bool featured;
  final int sortOrder;
  final DateTime? availableFrom;
  final DateTime? availableUntil;
  final Map<String, dynamic>? metadata;
  final DateTime createdAt;
  final DateTime updatedAt;

  GiftModel({
    required this.id,
    required this.name,
    required this.description,
    required this.category,
    this.rarity = GiftRarity.common,
    required this.coinPrice,
    required this.imageUrl,
    this.animationUrl,
    this.effects,
    this.active = true,
    this.featured = false,
    this.sortOrder = 0,
    this.availableFrom,
    this.availableUntil,
    this.metadata,
    required this.createdAt,
    required this.updatedAt,
  });

  factory GiftModel.fromJson(Map<String, dynamic> json) {
    return GiftModel(
      id: json['_id'] ?? json['id'],
      name: json['name'],
      description: json['description'] ?? '',
      category: GiftCategory.fromString(json['category'] ?? 'sticker'),
      rarity: GiftRarity.fromString(json['rarity'] ?? 'common'),
      coinPrice: (json['coinPrice'] ?? 0).toDouble(),
      imageUrl: json['imageUrl'] ?? '',
      animationUrl: json['animationUrl'],
      effects: json['effects'],
      active: json['active'] ?? true,
      featured: json['featured'] ?? false,
      sortOrder: json['sortOrder'] ?? 0,
      availableFrom: json['availableFrom'] != null
          ? DateTime.parse(json['availableFrom'])
          : null,
      availableUntil: json['availableUntil'] != null
          ? DateTime.parse(json['availableUntil'])
          : null,
      metadata: json['metadata'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'description': description,
      'category': category.name,
      'rarity': rarity.name,
      'coinPrice': coinPrice,
      'imageUrl': imageUrl,
      if (animationUrl != null) 'animationUrl': animationUrl,
      if (effects != null) 'effects': effects,
      'active': active,
      'featured': featured,
      'sortOrder': sortOrder,
      if (availableFrom != null)
        'availableFrom': availableFrom!.toIso8601String(),
      if (availableUntil != null)
        'availableUntil': availableUntil!.toIso8601String(),
      if (metadata != null) 'metadata': metadata,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  bool get hasAnimation => animationUrl != null && animationUrl!.isNotEmpty;
  bool get hasEffects => effects != null && effects!.isNotEmpty;

  bool get isAvailable {
    final now = DateTime.now();
    if (availableFrom != null && now.isBefore(availableFrom!)) return false;
    if (availableUntil != null && now.isAfter(availableUntil!)) return false;
    return active;
  }

  bool get isSeasonal => availableFrom != null || availableUntil != null;
}
