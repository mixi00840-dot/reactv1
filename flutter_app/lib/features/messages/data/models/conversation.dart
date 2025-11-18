class Conversation {
  final String id;
  final List<String> participantIds;
  final String? lastMessageText;
  final String? lastMessageSenderId;
  final DateTime? lastMessageAt;
  final int unreadCount;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Conversation({
    required this.id,
    this.participantIds = const [],
    this.lastMessageText,
    this.lastMessageSenderId,
    this.lastMessageAt,
    this.unreadCount = 0,
    this.createdAt,
    this.updatedAt,
  });

  factory Conversation.fromJson(Map<String, dynamic> json) {
    return Conversation(
      id: json['_id'] ?? json['id'] ?? '',
      participantIds: json['participants'] != null
          ? List<String>.from(json['participants'])
          : [],
      lastMessageText: json['lastMessage']?['text'],
      lastMessageSenderId: json['lastMessage']?['sender'],
      lastMessageAt: json['lastMessageAt'] != null
          ? DateTime.parse(json['lastMessageAt'])
          : null,
      unreadCount: json['unreadCount'] ?? 0,
      createdAt:
          json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
      updatedAt:
          json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'participants': participantIds,
      if (lastMessageText != null) 'lastMessageText': lastMessageText,
      if (lastMessageSenderId != null)
        'lastMessageSenderId': lastMessageSenderId,
      if (lastMessageAt != null)
        'lastMessageAt': lastMessageAt!.toIso8601String(),
      'unreadCount': unreadCount,
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
    };
  }
}
