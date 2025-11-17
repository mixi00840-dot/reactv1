/// Level Model - User progression system
/// Matches backend/src/models/Level.js
class LevelReward {
  final String type; // 'coins', 'badge', 'feature', 'title'
  final dynamic value;
  final String? description;

  LevelReward({
    required this.type,
    required this.value,
    this.description,
  });

  factory LevelReward.fromJson(Map<String, dynamic> json) {
    return LevelReward(
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

class LevelModel {
  final String id;
  final int level;
  final String name;
  final String description;
  final int requiredXP;
  final String? iconUrl;
  final String? badgeUrl;
  final List<LevelReward> rewards;
  final Map<String, dynamic>? benefits;
  final String color;
  final DateTime createdAt;
  final DateTime updatedAt;

  LevelModel({
    required this.id,
    required this.level,
    required this.name,
    required this.description,
    required this.requiredXP,
    this.iconUrl,
    this.badgeUrl,
    this.rewards = const [],
    this.benefits,
    this.color = '#3498db',
    required this.createdAt,
    required this.updatedAt,
  });

  factory LevelModel.fromJson(Map<String, dynamic> json) {
    return LevelModel(
      id: json['_id'] ?? json['id'],
      level: json['level'] ?? 1,
      name: json['name'],
      description: json['description'] ?? '',
      requiredXP: json['requiredXP'] ?? 0,
      iconUrl: json['iconUrl'],
      badgeUrl: json['badgeUrl'],
      rewards: json['rewards'] != null
          ? (json['rewards'] as List)
              .map((r) => LevelReward.fromJson(r))
              .toList()
          : [],
      benefits: json['benefits'],
      color: json['color'] ?? '#3498db',
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'level': level,
      'name': name,
      'description': description,
      'requiredXP': requiredXP,
      if (iconUrl != null) 'iconUrl': iconUrl,
      if (badgeUrl != null) 'badgeUrl': badgeUrl,
      'rewards': rewards.map((r) => r.toJson()).toList(),
      if (benefits != null) 'benefits': benefits,
      'color': color,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  bool get hasRewards => rewards.isNotEmpty;
  bool get hasBenefits => benefits != null && benefits!.isNotEmpty;
}
