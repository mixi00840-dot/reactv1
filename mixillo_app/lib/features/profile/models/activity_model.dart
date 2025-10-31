class ActivityEvent {
  final String id;
  final String userId;
  final ActivityType type;
  final String title;
  final String description;
  final Map<String, dynamic>? metadata;
  final bool isRead;
  final DateTime createdAt;

  ActivityEvent({
    required this.id,
    required this.userId,
    required this.type,
    required this.title,
    required this.description,
    this.metadata,
    this.isRead = false,
    required this.createdAt,
  });

  factory ActivityEvent.fromJson(Map<String, dynamic> json) {
    return ActivityEvent(
      id: json['_id'] ?? json['id'] ?? '',
      userId: json['userId'] ?? '',
      type: ActivityType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => ActivityType.other,
      ),
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      metadata: json['metadata'],
      isRead: json['isRead'] ?? false,
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'type': type.name,
      'title': title,
      'description': description,
      if (metadata != null) 'metadata': metadata,
      'isRead': isRead,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  ActivityEvent copyWith({bool? isRead}) {
    return ActivityEvent(
      id: id,
      userId: userId,
      type: type,
      title: title,
      description: description,
      metadata: metadata,
      isRead: isRead ?? this.isRead,
      createdAt: createdAt,
    );
  }
}

enum ActivityType {
  profileView,
  newFollower,
  purchase,
  comment,
  like,
  mention,
  share,
  violation,
  warning,
  systemNotification,
  other,
}

class UserLevel {
  final int level;
  final int currentXP;
  final int xpForNextLevel;
  final double progressPercentage;
  final List<String> unlockedFeatures;
  final DateTime lastUpdated;

  UserLevel({
    required this.level,
    required this.currentXP,
    required this.xpForNextLevel,
    required this.progressPercentage,
    required this.unlockedFeatures,
    required this.lastUpdated,
  });

  factory UserLevel.fromJson(Map<String, dynamic> json) {
    return UserLevel(
      level: json['level'] ?? 1,
      currentXP: json['currentXP'] ?? 0,
      xpForNextLevel: json['xpForNextLevel'] ?? 100,
      progressPercentage: (json['progressPercentage'] ?? 0.0).toDouble(),
      unlockedFeatures: List<String>.from(json['unlockedFeatures'] ?? []),
      lastUpdated: DateTime.parse(json['lastUpdated'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'level': level,
      'currentXP': currentXP,
      'xpForNextLevel': xpForNextLevel,
      'progressPercentage': progressPercentage,
      'unlockedFeatures': unlockedFeatures,
      'lastUpdated': lastUpdated.toIso8601String(),
    };
  }
}

class UserBadge {
  final String id;
  final String name;
  final String description;
  final String iconUrl;
  final BadgeRarity rarity;
  final DateTime earnedAt;
  final bool isDisplayed;

  UserBadge({
    required this.id,
    required this.name,
    required this.description,
    required this.iconUrl,
    required this.rarity,
    required this.earnedAt,
    this.isDisplayed = false,
  });

  factory UserBadge.fromJson(Map<String, dynamic> json) {
    return UserBadge(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      iconUrl: json['iconUrl'] ?? '',
      rarity: BadgeRarity.values.firstWhere(
        (e) => e.name == json['rarity'],
        orElse: () => BadgeRarity.common,
      ),
      earnedAt: DateTime.parse(json['earnedAt'] ?? DateTime.now().toIso8601String()),
      isDisplayed: json['isDisplayed'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'iconUrl': iconUrl,
      'rarity': rarity.name,
      'earnedAt': earnedAt.toIso8601String(),
      'isDisplayed': isDisplayed,
    };
  }
}

enum BadgeRarity {
  common,
  rare,
  epic,
  legendary,
}
