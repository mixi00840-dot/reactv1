class UserSettings {
  final String userId;
  final ThemePreference theme;
  final PrivacySettings privacy;
  final NotificationSettings notifications;
  final ShopSettings? shopSettings;
  final DateTime updatedAt;

  UserSettings({
    required this.userId,
    required this.theme,
    required this.privacy,
    required this.notifications,
    this.shopSettings,
    required this.updatedAt,
  });

  factory UserSettings.fromJson(Map<String, dynamic> json) {
    return UserSettings(
      userId: json['userId'] ?? '',
      theme: ThemePreference.values.firstWhere(
        (e) => e.name == json['theme'],
        orElse: () => ThemePreference.system,
      ),
      privacy: PrivacySettings.fromJson(json['privacy'] ?? {}),
      notifications: NotificationSettings.fromJson(json['notifications'] ?? {}),
      shopSettings: json['shopSettings'] != null
          ? ShopSettings.fromJson(json['shopSettings'])
          : null,
      updatedAt: DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'theme': theme.name,
      'privacy': privacy.toJson(),
      'notifications': notifications.toJson(),
      if (shopSettings != null) 'shopSettings': shopSettings!.toJson(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  UserSettings copyWith({
    String? userId,
    ThemePreference? theme,
    PrivacySettings? privacy,
    NotificationSettings? notifications,
    ShopSettings? shopSettings,
    DateTime? updatedAt,
  }) {
    return UserSettings(
      userId: userId ?? this.userId,
      theme: theme ?? this.theme,
      privacy: privacy ?? this.privacy,
      notifications: notifications ?? this.notifications,
      shopSettings: shopSettings ?? this.shopSettings,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

enum ThemePreference { light, dark, system }

class PrivacySettings {
  final bool showLikes;
  final bool showFollowers;
  final bool showFollowing;
  final bool allowComments;
  final bool allowDuet;
  final bool allowStitch;
  final ProfileVisibility profileVisibility;

  PrivacySettings({
    this.showLikes = true,
    this.showFollowers = true,
    this.showFollowing = true,
    this.allowComments = true,
    this.allowDuet = true,
    this.allowStitch = true,
    this.profileVisibility = ProfileVisibility.public,
  });

  factory PrivacySettings.fromJson(Map<String, dynamic> json) {
    return PrivacySettings(
      showLikes: json['showLikes'] ?? true,
      showFollowers: json['showFollowers'] ?? true,
      showFollowing: json['showFollowing'] ?? true,
      allowComments: json['allowComments'] ?? true,
      allowDuet: json['allowDuet'] ?? true,
      allowStitch: json['allowStitch'] ?? true,
      profileVisibility: ProfileVisibility.values.firstWhere(
        (e) => e.name == json['profileVisibility'],
        orElse: () => ProfileVisibility.public,
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'showLikes': showLikes,
      'showFollowers': showFollowers,
      'showFollowing': showFollowing,
      'allowComments': allowComments,
      'allowDuet': allowDuet,
      'allowStitch': allowStitch,
      'profileVisibility': profileVisibility.name,
    };
  }

  PrivacySettings copyWith({
    bool? showLikes,
    bool? showFollowers,
    bool? showFollowing,
    bool? allowComments,
    bool? allowDuet,
    bool? allowStitch,
    ProfileVisibility? profileVisibility,
  }) {
    return PrivacySettings(
      showLikes: showLikes ?? this.showLikes,
      showFollowers: showFollowers ?? this.showFollowers,
      showFollowing: showFollowing ?? this.showFollowing,
      allowComments: allowComments ?? this.allowComments,
      allowDuet: allowDuet ?? this.allowDuet,
      allowStitch: allowStitch ?? this.allowStitch,
      profileVisibility: profileVisibility ?? this.profileVisibility,
    );
  }
}

enum ProfileVisibility { public, friendsOnly, private }

class NotificationSettings {
  final bool likes;
  final bool comments;
  final bool newFollowers;
  final bool mentions;
  final bool directMessages;
  final bool videoUpdates;

  NotificationSettings({
    this.likes = true,
    this.comments = true,
    this.newFollowers = true,
    this.mentions = true,
    this.directMessages = true,
    this.videoUpdates = true,
  });

  factory NotificationSettings.fromJson(Map<String, dynamic> json) {
    return NotificationSettings(
      likes: json['likes'] ?? true,
      comments: json['comments'] ?? true,
      newFollowers: json['newFollowers'] ?? true,
      mentions: json['mentions'] ?? true,
      directMessages: json['directMessages'] ?? true,
      videoUpdates: json['videoUpdates'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'likes': likes,
      'comments': comments,
      'newFollowers': newFollowers,
      'mentions': mentions,
      'directMessages': directMessages,
      'videoUpdates': videoUpdates,
    };
  }

  NotificationSettings copyWith({
    bool? likes,
    bool? comments,
    bool? newFollowers,
    bool? mentions,
    bool? directMessages,
    bool? videoUpdates,
  }) {
    return NotificationSettings(
      likes: likes ?? this.likes,
      comments: comments ?? this.comments,
      newFollowers: newFollowers ?? this.newFollowers,
      mentions: mentions ?? this.mentions,
      directMessages: directMessages ?? this.directMessages,
      videoUpdates: videoUpdates ?? this.videoUpdates,
    );
  }
}

class ShopSettings {
  final bool isActive;
  final String? shopName;
  final String? description;
  final Map<String, dynamic>? businessHours;
  final String? returnPolicy;
  final Map<String, dynamic>? shippingInfo;

  ShopSettings({
    this.isActive = false,
    this.shopName,
    this.description,
    this.businessHours,
    this.returnPolicy,
    this.shippingInfo,
  });

  factory ShopSettings.fromJson(Map<String, dynamic> json) {
    return ShopSettings(
      isActive: json['isActive'] ?? false,
      shopName: json['shopName'],
      description: json['description'],
      businessHours: json['businessHours'],
      returnPolicy: json['returnPolicy'],
      shippingInfo: json['shippingInfo'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'isActive': isActive,
      if (shopName != null) 'shopName': shopName,
      if (description != null) 'description': description,
      if (businessHours != null) 'businessHours': businessHours,
      if (returnPolicy != null) 'returnPolicy': returnPolicy,
      if (shippingInfo != null) 'shippingInfo': shippingInfo,
    };
  }
}
