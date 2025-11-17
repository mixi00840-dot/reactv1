import 'message_model.dart';

/// Conversation Model - Chat containers
/// Matches backend/src/models/Conversation.js
enum ConversationType {
  direct,
  group;

  static ConversationType fromString(String value) {
    return ConversationType.values.firstWhere(
      (e) => e.name == value,
      orElse: () => ConversationType.direct,
    );
  }
}

class ConversationModel {
  final String id;
  final ConversationType type;
  final List<String> participants;
  final String? name;
  final String? imageUrl;
  final MessageModel? lastMessage;
  final int unreadCount;
  final Map<String, int> unreadCountByUser;
  final bool archived;
  final bool muted;
  final Map<String, dynamic>? metadata;
  final DateTime createdAt;
  final DateTime updatedAt;

  ConversationModel({
    required this.id,
    this.type = ConversationType.direct,
    required this.participants,
    this.name,
    this.imageUrl,
    this.lastMessage,
    this.unreadCount = 0,
    this.unreadCountByUser = const {},
    this.archived = false,
    this.muted = false,
    this.metadata,
    required this.createdAt,
    required this.updatedAt,
  });

  factory ConversationModel.fromJson(Map<String, dynamic> json) {
    return ConversationModel(
      id: json['_id'] ?? json['id'],
      type: ConversationType.fromString(json['type'] ?? 'direct'),
      participants: json['participants'] != null
          ? List<String>.from(json['participants'])
          : [],
      name: json['name'],
      imageUrl: json['imageUrl'],
      lastMessage: json['lastMessage'] != null
          ? MessageModel.fromJson(json['lastMessage'])
          : null,
      unreadCount: json['unreadCount'] ?? 0,
      unreadCountByUser: json['unreadCountByUser'] != null
          ? Map<String, int>.from(json['unreadCountByUser'])
          : {},
      archived: json['archived'] ?? false,
      muted: json['muted'] ?? false,
      metadata: json['metadata'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'type': type.name,
      'participants': participants,
      if (name != null) 'name': name,
      if (imageUrl != null) 'imageUrl': imageUrl,
      if (lastMessage != null) 'lastMessage': lastMessage!.toJson(),
      'unreadCount': unreadCount,
      'unreadCountByUser': unreadCountByUser,
      'archived': archived,
      'muted': muted,
      if (metadata != null) 'metadata': metadata,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  bool get isGroup => type == ConversationType.group;
  bool get isDirect => type == ConversationType.direct;
  bool get hasUnread => unreadCount > 0;

  String getDisplayName(String currentUserId) {
    if (name != null) return name!;

    if (isDirect) {
      final otherUserId = participants.firstWhere(
        (id) => id != currentUserId,
        orElse: () => 'Unknown',
      );
      return otherUserId; // Should be replaced with actual user name in UI
    }

    return 'Group Chat';
  }

  ConversationModel copyWith({
    String? id,
    ConversationType? type,
    List<String>? participants,
    String? name,
    String? imageUrl,
    MessageModel? lastMessage,
    int? unreadCount,
    Map<String, int>? unreadCountByUser,
    bool? archived,
    bool? muted,
    Map<String, dynamic>? metadata,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return ConversationModel(
      id: id ?? this.id,
      type: type ?? this.type,
      participants: participants ?? this.participants,
      name: name ?? this.name,
      imageUrl: imageUrl ?? this.imageUrl,
      lastMessage: lastMessage ?? this.lastMessage,
      unreadCount: unreadCount ?? this.unreadCount,
      unreadCountByUser: unreadCountByUser ?? this.unreadCountByUser,
      archived: archived ?? this.archived,
      muted: muted ?? this.muted,
      metadata: metadata ?? this.metadata,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
