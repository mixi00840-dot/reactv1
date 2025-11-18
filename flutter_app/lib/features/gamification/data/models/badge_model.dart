/// Badge model for gamification features

enum BadgeTier {
  bronze,
  silver,
  gold,
  platinum,
  diamond;

  static BadgeTier fromString(String value) {
    return BadgeTier.values.firstWhere(
      (e) => e.name == value,
      orElse: () => BadgeTier.bronze,
    );
  }
}

class BadgeModel {
  final String id;
  final String name;
  final String description;
  final String iconUrl;
    final BadgeTier tier;
  final String category;
  final int requiredPoints;
  final bool isEarned;
  final DateTime? earnedAt;

  BadgeModel({
      this.tier = BadgeTier.bronze,
    required this.id,
    required this.name,
    required this.description,
    required this.iconUrl,
    required this.category,
    required this.requiredPoints,
    this.isEarned = false,
    this.earnedAt,
  });

  // Compatibility getter for rarity (same as tier)
  BadgeTier get rarity => tier;

  factory BadgeModel.fromJson(Map<String, dynamic> json) {
    return BadgeModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      iconUrl: json['iconUrl'] ?? json['icon'] ?? '',
        tier: BadgeTier.fromString(json['tier'] ?? 'bronze'),
      category: json['category'] ?? 'general',
      requiredPoints: json['requiredPoints'] ?? 0,
      isEarned: json['isEarned'] ?? false,
      earnedAt: json['earnedAt'] != null ? DateTime.parse(json['earnedAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'iconUrl': iconUrl,
        'tier': tier.name,
      'category': category,
      'requiredPoints': requiredPoints,
      'isEarned': isEarned,
      if (earnedAt != null) 'earnedAt': earnedAt!.toIso8601String(),
    };
  }
}
