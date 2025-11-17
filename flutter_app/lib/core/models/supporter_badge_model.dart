/// SupporterBadge Model - Achievement badges
/// Matches backend/src/models/SupporterBadge.js
enum BadgeRarity {
  common,
  uncommon,
  rare,
  epic,
  legendary;

  static BadgeRarity fromString(String value) {
    return BadgeRarity.values.firstWhere(
      (e) => e.name == value,
      orElse: () => BadgeRarity.common,
    );
  }
}

class BadgeRequirement {
  final String type; // 'giftValue', 'watchTime', 'consecutiveDays', 'level'
  final dynamic value;
  final String? description;

  BadgeRequirement({
    required this.type,
    required this.value,
    this.description,
  });

  factory BadgeRequirement.fromJson(Map<String, dynamic> json) {
    return BadgeRequirement(
      type: json['type'],
      value: json['value'],
      description: json['description'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'type': type,
      'value': value,
      if (description != null) 'description': description,
    };
  }
}

class SupporterBadgeModel {
  final String id;
  final String name;
  final String description;
  final BadgeRarity rarity;
  final String imageUrl;
  final List<BadgeRequirement> requirements;
  final Map<String, dynamic>? benefits;
  final bool active;
  final int sortOrder;
  final DateTime createdAt;
  final DateTime updatedAt;

  SupporterBadgeModel({
    required this.id,
    required this.name,
    required this.description,
    this.rarity = BadgeRarity.common,
    required this.imageUrl,
    this.requirements = const [],
    this.benefits,
    this.active = true,
    this.sortOrder = 0,
    required this.createdAt,
    required this.updatedAt,
  });

  factory SupporterBadgeModel.fromJson(Map<String, dynamic> json) {
    return SupporterBadgeModel(
      id: json['_id'] ?? json['id'],
      name: json['name'],
      description: json['description'] ?? '',
      rarity: BadgeRarity.fromString(json['rarity'] ?? 'common'),
      imageUrl: json['imageUrl'] ?? '',
      requirements: json['requirements'] != null
          ? (json['requirements'] as List)
              .map((r) => BadgeRequirement.fromJson(r))
              .toList()
          : [],
      benefits: json['benefits'],
      active: json['active'] ?? true,
      sortOrder: json['sortOrder'] ?? 0,
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'description': description,
      'rarity': rarity.name,
      'imageUrl': imageUrl,
      'requirements': requirements.map((r) => r.toJson()).toList(),
      if (benefits != null) 'benefits': benefits,
      'active': active,
      'sortOrder': sortOrder,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  bool get hasRequirements => requirements.isNotEmpty;
  bool get hasBenefits => benefits != null && benefits!.isNotEmpty;

  String get rarityDisplay {
    switch (rarity) {
      case BadgeRarity.common:
        return 'Common';
      case BadgeRarity.uncommon:
        return 'Uncommon';
      case BadgeRarity.rare:
        return 'Rare';
      case BadgeRarity.epic:
        return 'Epic';
      case BadgeRarity.legendary:
        return 'Legendary';
    }
  }
}
