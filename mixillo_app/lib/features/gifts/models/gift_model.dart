import 'package:flutter/material.dart';

/// Enhanced Gift Model - Complete backend structure
/// Matches backend Gift model with all fields

class GiftModel {
  final String id;
  final String name;
  final String displayName;
  final String? description;
  final GiftCategory category;
  final GiftRarity rarity;
  final int price; // in coins
  final GiftMedia media;
  final GiftEffects? effects;
  final GiftAvailability? availability;
  final GiftCombo? combo;
  final ReceiverBenefits? receiverBenefits;
  final List<String>? tags;
  final List<GiftTranslation>? translations;
  final bool featured;
  final bool popular;
  final bool newRelease;
  final GiftStatus status;
  final int order;
  final GiftStats? stats;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  GiftModel({
    required this.id,
    required this.name,
    required this.displayName,
    this.description,
    required this.category,
    this.rarity = GiftRarity.common,
    required this.price,
    required this.media,
    this.effects,
    this.availability,
    this.combo,
    this.receiverBenefits,
    this.tags,
    this.translations,
    this.featured = false,
    this.popular = false,
    this.newRelease = false,
    this.status = GiftStatus.active,
    this.order = 0,
    this.stats,
    this.createdAt,
    this.updatedAt,
  });

  factory GiftModel.fromJson(Map<String, dynamic> json) {
    return GiftModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      displayName: json['displayName'] ?? json['display_name'] ?? json['name'] ?? '',
      description: json['description'],
      category: GiftCategory.fromString(json['category'] ?? 'emoji'),
      rarity: GiftRarity.fromString(json['rarity'] ?? 'common'),
      price: json['price'] ?? 1,
      media: GiftMedia.fromJson(json['media'] ?? {}),
      effects: json['effects'] != null ? GiftEffects.fromJson(json['effects']) : null,
      availability: json['availability'] != null
          ? GiftAvailability.fromJson(json['availability'])
          : null,
      combo: json['combo'] != null ? GiftCombo.fromJson(json['combo']) : null,
      receiverBenefits: json['receiverBenefits'] != null
          ? ReceiverBenefits.fromJson(json['receiverBenefits'])
          : null,
      tags: json['tags'] != null ? List<String>.from(json['tags']) : null,
      translations: json['translations'] != null
          ? (json['translations'] as List)
              .map((t) => GiftTranslation.fromJson(t))
              .toList()
          : null,
      featured: json['featured'] ?? json['isFeatured'] ?? false,
      popular: json['popular'] ?? false,
      newRelease: json['newRelease'] ?? json['new_release'] ?? false,
      status: _parseGiftStatus(json['status'] ?? 'active'),
      order: json['order'] ?? 0,
      stats: json['stats'] != null ? GiftStats.fromJson(json['stats']) : null,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'].toString())
          : json['created_at'] != null
              ? DateTime.parse(json['created_at'].toString())
              : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'].toString())
          : json['updated_at'] != null
              ? DateTime.parse(json['updated_at'].toString())
              : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'displayName': displayName,
      if (description != null) 'description': description,
      'category': category.name,
      'rarity': rarity.name,
      'price': price,
      'media': media.toJson(),
      if (effects != null) 'effects': effects!.toJson(),
      if (availability != null) 'availability': availability!.toJson(),
      if (combo != null) 'combo': combo!.toJson(),
      if (receiverBenefits != null) 'receiverBenefits': receiverBenefits!.toJson(),
      if (tags != null) 'tags': tags,
      if (translations != null)
        'translations': translations!.map((t) => t.toJson()).toList(),
      'featured': featured,
      'popular': popular,
      'newRelease': newRelease,
      'status': status.name,
      'order': order,
      if (stats != null) 'stats': stats!.toJson(),
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
    };
  }

  GiftModel copyWith({
    String? id,
    String? name,
    String? displayName,
    String? description,
    GiftCategory? category,
    GiftRarity? rarity,
    int? price,
    GiftMedia? media,
    GiftEffects? effects,
    GiftAvailability? availability,
    GiftCombo? combo,
    ReceiverBenefits? receiverBenefits,
    List<String>? tags,
    List<GiftTranslation>? translations,
    bool? featured,
    bool? popular,
    bool? newRelease,
    GiftStatus? status,
    int? order,
    GiftStats? stats,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return GiftModel(
      id: id ?? this.id,
      name: name ?? this.name,
      displayName: displayName ?? this.displayName,
      description: description ?? this.description,
      category: category ?? this.category,
      rarity: rarity ?? this.rarity,
      price: price ?? this.price,
      media: media ?? this.media,
      effects: effects ?? this.effects,
      availability: availability ?? this.availability,
      combo: combo ?? this.combo,
      receiverBenefits: receiverBenefits ?? this.receiverBenefits,
      tags: tags ?? this.tags,
      translations: translations ?? this.translations,
      featured: featured ?? this.featured,
      popular: popular ?? this.popular,
      newRelease: newRelease ?? this.newRelease,
      status: status ?? this.status,
      order: order ?? this.order,
      stats: stats ?? this.stats,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  // Helper getters
  bool get isAvailable {
    if (status != GiftStatus.active) return false;
    if (availability == null) return true;
    return availability!.isAvailable;
  }

  bool get isLimitedEdition => availability?.limitedEdition ?? false;
  bool get isSoldOut => status == GiftStatus.soldout ||
      (availability != null &&
          availability!.maxQuantity != null &&
          availability!.soldCount >= availability!.maxQuantity!);

  static GiftStatus _parseGiftStatus(dynamic value) {
    if (value is String) {
      return GiftStatus.values.firstWhere(
        (e) => e.name == value.toLowerCase().replaceAll('_', ''),
        orElse: () => GiftStatus.active,
      );
    }
    return GiftStatus.active;
  }
}

class GiftMedia {
  final String icon;
  final String? thumbnail;
  final String? animation; // Lottie JSON URL or path
  final String? sound; // Sound effect URL
  final int? duration; // Animation duration in ms

  GiftMedia({
    required this.icon,
    this.thumbnail,
    this.animation,
    this.sound,
    this.duration,
  });

  factory GiftMedia.fromJson(Map<String, dynamic> json) {
    return GiftMedia(
      icon: json['icon'] ?? '',
      thumbnail: json['thumbnail'],
      animation: json['animation'],
      sound: json['sound'],
      duration: json['duration'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'icon': icon,
      if (thumbnail != null) 'thumbnail': thumbnail,
      if (animation != null) 'animation': animation,
      if (sound != null) 'sound': sound,
      if (duration != null) 'duration': duration,
    };
  }
}

class GiftEffects {
  final String screenEffect; // 'none', 'confetti', 'fireworks', 'hearts', etc.
  final String? customEffect;
  final String? messageStyle;
  final bool vibrate;
  final bool flashScreen;

  GiftEffects({
    this.screenEffect = 'none',
    this.customEffect,
    this.messageStyle,
    this.vibrate = false,
    this.flashScreen = false,
  });

  factory GiftEffects.fromJson(Map<String, dynamic> json) {
    return GiftEffects(
      screenEffect: json['screenEffect'] ?? json['screen_effect'] ?? 'none',
      customEffect: json['customEffect'] ?? json['custom_effect'],
      messageStyle: json['messageStyle'] ?? json['message_style'],
      vibrate: json['vibrate'] ?? false,
      flashScreen: json['flashScreen'] ?? json['flash_screen'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'screenEffect': screenEffect,
      if (customEffect != null) 'customEffect': customEffect,
      if (messageStyle != null) 'messageStyle': messageStyle,
      'vibrate': vibrate,
      'flashScreen': flashScreen,
    };
  }
}

class GiftAvailability {
  final DateTime? startDate;
  final DateTime? endDate;
  final bool limitedEdition;
  final int? maxQuantity;
  final int soldCount;
  final SupportLevel? requiredTier;
  final int? requiredLevel;
  final String? requiredBadge;

  GiftAvailability({
    this.startDate,
    this.endDate,
    this.limitedEdition = false,
    this.maxQuantity,
    this.soldCount = 0,
    this.requiredTier,
    this.requiredLevel,
    this.requiredBadge,
  });

  factory GiftAvailability.fromJson(Map<String, dynamic> json) {
    return GiftAvailability(
      startDate: json['startDate'] != null
          ? DateTime.parse(json['startDate'].toString())
          : json['start_date'] != null
              ? DateTime.parse(json['start_date'].toString())
              : null,
      endDate: json['endDate'] != null
          ? DateTime.parse(json['endDate'].toString())
          : json['end_date'] != null
              ? DateTime.parse(json['end_date'].toString())
              : null,
      limitedEdition: json['limitedEdition'] ?? json['limited_edition'] ?? false,
      maxQuantity: json['maxQuantity'] ?? json['max_quantity'],
      soldCount: json['soldCount'] ?? json['sold_count'] ?? 0,
      requiredTier: json['requiredTier'] != null
          ? _parseSupportLevel(json['requiredTier'])
          : json['required_tier'] != null
              ? _parseSupportLevel(json['required_tier'])
              : null,
      requiredLevel: json['requiredLevel'] ?? json['required_level'],
      requiredBadge: json['requiredBadge'] ?? json['required_badge'],
    );
  }

  Map<String, dynamic> toJson() => {
    if (startDate != null) 'startDate': startDate!.toIso8601String(),
    if (endDate != null) 'endDate': endDate!.toIso8601String(),
    'limitedEdition': limitedEdition,
    if (maxQuantity != null) 'maxQuantity': maxQuantity,
    'soldCount': soldCount,
    if (requiredTier != null) 'requiredTier': requiredTier!.name,
    if (requiredLevel != null) 'requiredLevel': requiredLevel,
    if (requiredBadge != null) 'requiredBadge': requiredBadge,
  };

  bool get isAvailable {
    final now = DateTime.now();
    if (startDate != null && now.isBefore(startDate!)) return false;
    if (endDate != null && now.isAfter(endDate!)) return false;
    if (maxQuantity != null && soldCount >= maxQuantity!) return false;
    return true;
  }

  static SupportLevel _parseSupportLevel(dynamic value) {
    if (value is String) {
      return SupportLevel.values.firstWhere(
        (e) => e.name == value.toLowerCase(),
        orElse: () => SupportLevel.bronze,
      );
    }
    return SupportLevel.bronze;
  }
}

enum SupportLevel { bronze, silver, gold, platinum, diamond }

class GiftCombo {
  final bool enabled;
  final int? minCount;
  final double? bonusMultiplier;
  final int? comboWindow; // Time window in seconds

  GiftCombo({
    this.enabled = false,
    this.minCount,
    this.bonusMultiplier,
    this.comboWindow,
  });

  factory GiftCombo.fromJson(Map<String, dynamic> json) {
    return GiftCombo(
      enabled: json['enabled'] ?? false,
      minCount: json['minCount'] ?? json['min_count'],
      bonusMultiplier: json['bonusMultiplier'] != null
          ? (json['bonusMultiplier'] as num).toDouble()
          : json['bonus_multiplier'] != null
              ? (json['bonus_multiplier'] as num).toDouble()
              : null,
      comboWindow: json['comboWindow'] ?? json['combo_window'],
    );
  }

  Map<String, dynamic> toJson() => {
    'enabled': enabled,
    if (minCount != null) 'minCount': minCount,
    if (bonusMultiplier != null) 'bonusMultiplier': bonusMultiplier,
    if (comboWindow != null) 'comboWindow': comboWindow,
  };
}

class ReceiverBenefits {
  final int? experiencePoints;
  final double? creditsBonus;
  final int? badgeProgress;
  final List<String>? specialAccess;

  ReceiverBenefits({
    this.experiencePoints,
    this.creditsBonus,
    this.badgeProgress,
    this.specialAccess,
  });

  factory ReceiverBenefits.fromJson(Map<String, dynamic> json) {
    return ReceiverBenefits(
      experiencePoints: json['experiencePoints'] ?? json['experience_points'],
      creditsBonus: json['creditsBonus'] != null
          ? (json['creditsBonus'] as num).toDouble()
          : json['credits_bonus'] != null
              ? (json['credits_bonus'] as num).toDouble()
              : null,
      badgeProgress: json['badgeProgress'] ?? json['badge_progress'],
      specialAccess: json['specialAccess'] != null
          ? List<String>.from(json['specialAccess'])
          : json['special_access'] != null
              ? List<String>.from(json['special_access'])
              : null,
    );
  }

  Map<String, dynamic> toJson() => {
    if (experiencePoints != null) 'experiencePoints': experiencePoints,
    if (creditsBonus != null) 'creditsBonus': creditsBonus,
    if (badgeProgress != null) 'badgeProgress': badgeProgress,
    if (specialAccess != null) 'specialAccess': specialAccess,
  };
}

class GiftTranslation {
  final String language;
  final String displayName;
  final String? description;

  GiftTranslation({
    required this.language,
    required this.displayName,
    this.description,
  });

  factory GiftTranslation.fromJson(Map<String, dynamic> json) {
    return GiftTranslation(
      language: json['language'] ?? '',
      displayName: json['displayName'] ?? json['display_name'] ?? '',
      description: json['description'],
    );
  }

  Map<String, dynamic> toJson() => {
    'language': language,
    'displayName': displayName,
    if (description != null) 'description': description,
  };
}

class GiftStats {
  final int totalSent;
  final double totalRevenue;
  final int uniqueSenders;
  final int uniqueReceivers;
  final double? avgRating;
  final int reviewCount;

  GiftStats({
    this.totalSent = 0,
    this.totalRevenue = 0.0,
    this.uniqueSenders = 0,
    this.uniqueReceivers = 0,
    this.avgRating,
    this.reviewCount = 0,
  });

  factory GiftStats.fromJson(Map<String, dynamic> json) {
    return GiftStats(
      totalSent: json['totalSent'] ?? json['total_sent'] ?? 0,
      totalRevenue: (json['totalRevenue'] ?? json['total_revenue'] ?? 0).toDouble(),
      uniqueSenders: json['uniqueSenders'] ?? json['unique_senders'] ?? 0,
      uniqueReceivers: json['uniqueReceivers'] ?? json['unique_receivers'] ?? 0,
      avgRating: json['avgRating'] != null
          ? (json['avgRating'] as num).toDouble()
          : json['avg_rating'] != null
              ? (json['avg_rating'] as num).toDouble()
              : null,
      reviewCount: json['reviewCount'] ?? json['review_count'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'totalSent': totalSent,
      'totalRevenue': totalRevenue,
      'uniqueSenders': uniqueSenders,
      'uniqueReceivers': uniqueReceivers,
      if (avgRating != null) 'avgRating': avgRating,
      'reviewCount': reviewCount,
    };
  }
}

enum GiftCategory {
  emoji,
  sticker,
  animated,
  luxury,
  seasonal,
  badge,
  effect,
  combo;

  static GiftCategory fromString(String value) {
    return GiftCategory.values.firstWhere(
      (e) => e.name == value.toLowerCase(),
      orElse: () => GiftCategory.emoji,
    );
  }
}

enum GiftRarity {
  common,
  rare,
  epic,
  legendary,
  mythic;

  static GiftRarity fromString(String value) {
    return GiftRarity.values.firstWhere(
      (e) => e.name == value.toLowerCase(),
      orElse: () => GiftRarity.common,
    );
  }

  Color get color {
    switch (this) {
      case GiftRarity.common:
        return Colors.grey;
      case GiftRarity.rare:
        return Colors.blue;
      case GiftRarity.epic:
        return Colors.purple;
      case GiftRarity.legendary:
        return Colors.orange;
      case GiftRarity.mythic:
        return Colors.red;
    }
  }
}

enum GiftStatus {
  active,
  inactive,
  soldout,
  comingSoon;

  static GiftStatus fromString(String value) {
    return GiftStatus.values.firstWhere(
      (e) => e.name == value.toLowerCase().replaceAll('_', ''),
      orElse: () => GiftStatus.active,
    );
  }
}

/// Gift Transaction Model - Records of sent gifts
class GiftTransactionModel {
  final String id;
  final String transactionId;
  final String senderId;
  final String receiverId;
  final String giftId;
  final GiftDetails? giftDetails;
  final int quantity;
  final GiftCost cost;
  final GiftContext context;
  final PKBattleContext? pkBattle;
  final String? message;
  final GiftDisplay display;
  final GiftComboInfo? combo;
  final RevenueShare? revenueShare;
  final GiftTransactionStatus status;
  final PaymentInfo? payment;
  final RefundInfo? refund;
  final GiftTransactionStats? stats;
  final Map<String, dynamic>? metadata;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final DateTime? deliveredAt;
  final DateTime? seenAt;
  final DateTime? thankedAt;
  final String? thankYouMessage;

  GiftTransactionModel({
    required this.id,
    required this.transactionId,
    required this.senderId,
    required this.receiverId,
    required this.giftId,
    this.giftDetails,
    this.quantity = 1,
    required this.cost,
    required this.context,
    this.pkBattle,
    this.message,
    required this.display,
    this.combo,
    this.revenueShare,
    required this.status,
    this.payment,
    this.refund,
    this.stats,
    this.metadata,
    required this.createdAt,
    this.updatedAt,
    this.deliveredAt,
    this.seenAt,
    this.thankedAt,
    this.thankYouMessage,
  });

  factory GiftTransactionModel.fromJson(Map<String, dynamic> json) {
    return GiftTransactionModel(
      id: json['id'] ?? json['_id'] ?? '',
      transactionId: json['transactionId'] ?? json['transaction_id'] ?? '',
      senderId: json['sender'] ?? json['senderId'] ?? json['sender_id'] ?? '',
      receiverId: json['receiver'] ?? json['receiverId'] ?? json['receiver_id'] ?? '',
      giftId: json['gift'] ?? json['giftId'] ?? json['gift_id'] ?? '',
      giftDetails: json['giftDetails'] != null
          ? GiftDetails.fromJson(json['giftDetails'])
          : null,
      quantity: json['quantity'] ?? 1,
      cost: GiftCost.fromJson(json['cost'] ?? {}),
      context: GiftContext.fromJson(json['context'] ?? {}),
      pkBattle: json['pkBattle'] != null
          ? PKBattleContext.fromJson(json['pkBattle'])
          : null,
      message: json['message'],
      display: GiftDisplay.fromJson(json['display'] ?? {}),
      combo: json['combo'] != null ? GiftComboInfo.fromJson(json['combo']) : null,
      revenueShare: json['revenueShare'] != null
          ? RevenueShare.fromJson(json['revenueShare'])
          : null,
      status: _parseGiftTransactionStatus(json['status'] ?? 'completed'),
      payment: json['payment'] != null ? PaymentInfo.fromJson(json['payment']) : null,
      refund: json['refund'] != null ? RefundInfo.fromJson(json['refund']) : null,
      stats: json['stats'] != null ? GiftTransactionStats.fromJson(json['stats']) : null,
      metadata: json['metadata'],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'].toString())
          : json['created_at'] != null
              ? DateTime.parse(json['created_at'].toString())
              : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'].toString())
          : json['updated_at'] != null
              ? DateTime.parse(json['updated_at'].toString())
              : null,
      deliveredAt: json['deliveredAt'] != null
          ? DateTime.parse(json['deliveredAt'].toString())
          : json['delivered_at'] != null
              ? DateTime.parse(json['delivered_at'].toString())
              : null,
      seenAt: json['seenAt'] != null
          ? DateTime.parse(json['seenAt'].toString())
          : json['seen_at'] != null
              ? DateTime.parse(json['seen_at'].toString())
              : null,
      thankedAt: json['thankedAt'] != null
          ? DateTime.parse(json['thankedAt'].toString())
          : json['thanked_at'] != null
              ? DateTime.parse(json['thanked_at'].toString())
              : null,
      thankYouMessage: json['thankYouMessage'] ?? json['thank_you_message'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'transactionId': transactionId,
      'senderId': senderId,
      'receiverId': receiverId,
      'giftId': giftId,
      if (giftDetails != null) 'giftDetails': giftDetails!.toJson(),
      'quantity': quantity,
      'cost': cost.toJson(),
      'context': context.toJson(),
      if (pkBattle != null) 'pkBattle': pkBattle!.toJson(),
      if (message != null) 'message': message,
      'display': display.toJson(),
      if (combo != null) 'combo': combo!.toJson(),
      if (revenueShare != null) 'revenueShare': revenueShare!.toJson(),
      'status': status.name,
      if (payment != null) 'payment': payment!.toJson(),
      if (refund != null) 'refund': refund!.toJson(),
      if (stats != null) 'stats': stats!.toJson(),
      if (metadata != null) 'metadata': metadata,
      'createdAt': createdAt.toIso8601String(),
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
      if (deliveredAt != null) 'deliveredAt': deliveredAt!.toIso8601String(),
      if (seenAt != null) 'seenAt': seenAt!.toIso8601String(),
      if (thankedAt != null) 'thankedAt': thankedAt!.toIso8601String(),
      if (thankYouMessage != null) 'thankYouMessage': thankYouMessage,
    };
  }

  static GiftTransactionStatus _parseGiftTransactionStatus(dynamic value) {
    if (value is String) {
      return GiftTransactionStatus.values.firstWhere(
        (e) => e.name == value.toLowerCase(),
        orElse: () => GiftTransactionStatus.completed,
      );
    }
    return GiftTransactionStatus.completed;
  }
}

enum GiftTransactionStatus {
  pending,
  completed,
  failed,
  refunded,
  delivered,
  seen,
  thanked,
}

class GiftDetails {
  final String name;
  final String displayName;
  final String category;
  final String rarity;
  final String icon;

  GiftDetails({
    required this.name,
    required this.displayName,
    required this.category,
    required this.rarity,
    required this.icon,
  });

  factory GiftDetails.fromJson(Map<String, dynamic> json) {
    return GiftDetails(
      name: json['name'] ?? '',
      displayName: json['displayName'] ?? json['display_name'] ?? '',
      category: json['category'] ?? '',
      rarity: json['rarity'] ?? '',
      icon: json['icon'] ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
    'name': name,
    'displayName': displayName,
    'category': category,
    'rarity': rarity,
    'icon': icon,
  };
}

class GiftCost {
  final double total;
  final double perUnit;
  final String currency;

  GiftCost({
    required this.total,
    required this.perUnit,
    this.currency = 'coins',
  });

  factory GiftCost.fromJson(Map<String, dynamic> json) {
    return GiftCost(
      total: (json['total'] ?? 0).toDouble(),
      perUnit: (json['perUnit'] ?? json['per_unit'] ?? 0).toDouble(),
      currency: json['currency'] ?? 'coins',
    );
  }

  Map<String, dynamic> toJson() => {
    'total': total,
    'perUnit': perUnit,
    'currency': currency,
  };
}

class GiftContext {
  final GiftContextType type;
  final String referenceId;
  final String? referenceName;

  GiftContext({
    required this.type,
    required this.referenceId,
    this.referenceName,
  });

  factory GiftContext.fromJson(Map<String, dynamic> json) {
    return GiftContext(
      type: _parseGiftContextType(json['type'] ?? ''),
      referenceId: json['referenceId'] ?? json['reference_id'] ?? '',
      referenceName: json['referenceName'] ?? json['reference_name'],
    );
  }

  Map<String, dynamic> toJson() => {
    'type': type.name,
    'referenceId': referenceId,
    if (referenceName != null) 'referenceName': referenceName,
  };

  static GiftContextType _parseGiftContextType(dynamic value) {
    if (value is String) {
      return GiftContextType.values.firstWhere(
        (e) => e.name == value.toLowerCase().replaceAll('_', ''),
        orElse: () => GiftContextType.livestream,
      );
    }
    return GiftContextType.livestream;
  }
}

enum GiftContextType {
  livestream,
  pkBattle,
  multihost,
  video,
  post,
  directMessage,
}

class PKBattleContext {
  final String? battleId;
  final String? side; // 'host1' or 'host2'
  final int? pointsAwarded;

  PKBattleContext({
    this.battleId,
    this.side,
    this.pointsAwarded,
  });

  factory PKBattleContext.fromJson(Map<String, dynamic> json) {
    return PKBattleContext(
      battleId: json['battleId'] ?? json['battle_id'],
      side: json['side'],
      pointsAwarded: json['pointsAwarded'] ?? json['points_awarded'],
    );
  }

  Map<String, dynamic> toJson() => {
    if (battleId != null) 'battleId': battleId,
    if (side != null) 'side': side,
    if (pointsAwarded != null) 'pointsAwarded': pointsAwarded,
  };
}

class GiftDisplay {
  final bool isPublic;
  final bool isAnonymous;
  final bool showInFeed;

  GiftDisplay({
    this.isPublic = true,
    this.isAnonymous = false,
    this.showInFeed = true,
  });

  factory GiftDisplay.fromJson(Map<String, dynamic> json) {
    return GiftDisplay(
      isPublic: json['isPublic'] ?? json['is_public'] ?? true,
      isAnonymous: json['isAnonymous'] ?? json['is_anonymous'] ?? false,
      showInFeed: json['showInFeed'] ?? json['show_in_feed'] ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
    'isPublic': isPublic,
    'isAnonymous': isAnonymous,
    'showInFeed': showInFeed,
  };
}

class GiftComboInfo {
  final bool isCombo;
  final int comboCount;
  final double comboMultiplier;

  GiftComboInfo({
    this.isCombo = false,
    this.comboCount = 1,
    this.comboMultiplier = 1.0,
  });

  factory GiftComboInfo.fromJson(Map<String, dynamic> json) {
    return GiftComboInfo(
      isCombo: json['isCombo'] ?? json['is_combo'] ?? false,
      comboCount: json['comboCount'] ?? json['combo_count'] ?? 1,
      comboMultiplier: (json['comboMultiplier'] ?? json['combo_multiplier'] ?? 1.0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() => {
    'isCombo': isCombo,
    'comboCount': comboCount,
    'comboMultiplier': comboMultiplier,
  };
}

class RevenueShare {
  final double receiverShare;
  final double receiverPercentage;
  final double platformShare;
  final double platformPercentage;

  RevenueShare({
    this.receiverShare = 0.0,
    this.receiverPercentage = 70.0,
    this.platformShare = 0.0,
    this.platformPercentage = 30.0,
  });

  factory RevenueShare.fromJson(Map<String, dynamic> json) {
    return RevenueShare(
      receiverShare: (json['receiverShare'] ?? json['receiver_share'] ?? 0).toDouble(),
      receiverPercentage: (json['receiverPercentage'] ?? json['receiver_percentage'] ?? 70).toDouble(),
      platformShare: (json['platformShare'] ?? json['platform_share'] ?? 0).toDouble(),
      platformPercentage: (json['platformPercentage'] ?? json['platform_percentage'] ?? 30).toDouble(),
    );
  }

  Map<String, dynamic> toJson() => {
    'receiverShare': receiverShare,
    'receiverPercentage': receiverPercentage,
    'platformShare': platformShare,
    'platformPercentage': platformPercentage,
  };
}

class PaymentInfo {
  final String? method;
  final String? transactionId;
  final DateTime? processedAt;

  PaymentInfo({
    this.method,
    this.transactionId,
    this.processedAt,
  });

  factory PaymentInfo.fromJson(Map<String, dynamic> json) {
    return PaymentInfo(
      method: json['method'],
      transactionId: json['transactionId'] ?? json['transaction_id'],
      processedAt: json['processedAt'] != null
          ? DateTime.parse(json['processedAt'].toString())
          : json['processed_at'] != null
              ? DateTime.parse(json['processed_at'].toString())
              : null,
    );
  }

  Map<String, dynamic> toJson() => {
    if (method != null) 'method': method,
    if (transactionId != null) 'transactionId': transactionId,
    if (processedAt != null) 'processedAt': processedAt!.toIso8601String(),
  };
}

class RefundInfo {
  final String? reason;
  final String? refundedBy;
  final DateTime? refundedAt;
  final double? refundAmount;

  RefundInfo({
    this.reason,
    this.refundedBy,
    this.refundedAt,
    this.refundAmount,
  });

  factory RefundInfo.fromJson(Map<String, dynamic> json) {
    return RefundInfo(
      reason: json['reason'],
      refundedBy: json['refundedBy'] ?? json['refunded_by'],
      refundedAt: json['refundedAt'] != null
          ? DateTime.parse(json['refundedAt'].toString())
          : json['refunded_at'] != null
              ? DateTime.parse(json['refunded_at'].toString())
              : null,
      refundAmount: json['refundAmount'] != null
          ? (json['refundAmount'] as num).toDouble()
          : json['refund_amount'] != null
              ? (json['refund_amount'] as num).toDouble()
              : null,
    );
  }

  Map<String, dynamic> toJson() => {
    if (reason != null) 'reason': reason,
    if (refundedBy != null) 'refundedBy': refundedBy,
    if (refundedAt != null) 'refundedAt': refundedAt!.toIso8601String(),
    if (refundAmount != null) 'refundAmount': refundAmount,
  };
}

class GiftTransactionStats {
  final int impressions;
  final int reactions;

  GiftTransactionStats({
    this.impressions = 0,
    this.reactions = 0,
  });

  factory GiftTransactionStats.fromJson(Map<String, dynamic> json) {
    return GiftTransactionStats(
      impressions: json['impressions'] ?? 0,
      reactions: json['reactions'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'impressions': impressions,
    'reactions': reactions,
  };
}
