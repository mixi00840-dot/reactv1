/// Message Model - Chat messages
/// Matches backend/src/models/Message.js
enum MessageType {
  text,
  image,
  video,
  audio,
  file,
  gif,
  sticker,
  location,
  contact;

  static MessageType fromString(String value) {
    return MessageType.values.firstWhere(
      (e) => e.name == value,
      orElse: () => MessageType.text,
    );
  }
}

enum MessageStatus {
  sending,
  sent,
  delivered,
  read,
  failed;

  static MessageStatus fromString(String value) {
    return MessageStatus.values.firstWhere(
      (e) => e.name == value,
      orElse: () => MessageStatus.sent,
    );
  }
}

class MessageModel {
  final String id;
  final String conversationId;
  final String senderId;
  final String content;
  final MessageType type;
  final MessageStatus status;
  final String? mediaUrl;
  final String? thumbnailUrl;
  final Map<String, dynamic>? metadata;
  final String? replyToId;
  final bool read;
  final List<String> readBy;
  final DateTime? readAt;
  final bool deleted;
  final DateTime createdAt;
  final DateTime updatedAt;

  MessageModel({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.content,
    this.type = MessageType.text,
    this.status = MessageStatus.sent,
    this.mediaUrl,
    this.thumbnailUrl,
    this.metadata,
    this.replyToId,
    this.read = false,
    this.readBy = const [],
    this.readAt,
    this.deleted = false,
    required this.createdAt,
    required this.updatedAt,
  });

  factory MessageModel.fromJson(Map<String, dynamic> json) {
    return MessageModel(
      id: json['_id'] ?? json['id'],
      conversationId: json['conversation'] ?? json['conversationId'],
      senderId: json['sender'] ?? json['senderId'],
      content: json['content'] ?? '',
      type: MessageType.fromString(json['type'] ?? 'text'),
      status: MessageStatus.fromString(json['status'] ?? 'sent'),
      mediaUrl: json['mediaUrl'],
      thumbnailUrl: json['thumbnailUrl'],
      metadata: json['metadata'],
      replyToId: json['replyTo'],
      read: json['read'] ?? false,
      readBy: json['readBy'] != null ? List<String>.from(json['readBy']) : [],
      readAt: json['readAt'] != null ? DateTime.parse(json['readAt']) : null,
      deleted: json['deleted'] ?? false,
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'conversation': conversationId,
      'sender': senderId,
      'content': content,
      'type': type.name,
      'status': status.name,
      if (mediaUrl != null) 'mediaUrl': mediaUrl,
      if (thumbnailUrl != null) 'thumbnailUrl': thumbnailUrl,
      if (metadata != null) 'metadata': metadata,
      if (replyToId != null) 'replyTo': replyToId,
      'read': read,
      'readBy': readBy,
      if (readAt != null) 'readAt': readAt!.toIso8601String(),
      'deleted': deleted,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  bool get hasMedia =>
      type == MessageType.image ||
      type == MessageType.video ||
      type == MessageType.audio ||
      type == MessageType.file;

  bool get isReadByRecipient => status == MessageStatus.read;

  MessageModel copyWith({
    String? id,
    String? conversationId,
    String? senderId,
    String? content,
    MessageType? type,
    MessageStatus? status,
    String? mediaUrl,
    String? thumbnailUrl,
    Map<String, dynamic>? metadata,
    String? replyToId,
    bool? read,
    List<String>? readBy,
    DateTime? readAt,
    bool? deleted,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return MessageModel(
      id: id ?? this.id,
      conversationId: conversationId ?? this.conversationId,
      senderId: senderId ?? this.senderId,
      content: content ?? this.content,
      type: type ?? this.type,
      status: status ?? this.status,
      mediaUrl: mediaUrl ?? this.mediaUrl,
      thumbnailUrl: thumbnailUrl ?? this.thumbnailUrl,
      metadata: metadata ?? this.metadata,
      replyToId: replyToId ?? this.replyToId,
      read: read ?? this.read,
      readBy: readBy ?? this.readBy,
      readAt: readAt ?? this.readAt,
      deleted: deleted ?? this.deleted,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
