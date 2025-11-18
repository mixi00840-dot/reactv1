class Message {
  final String id;
  final String conversationId;
  final String senderId;
  final String? senderUsername;
  final String? senderAvatar;
  final String text;
  final String? mediaUrl;
  final String? mediaType;
  final bool isRead;
  final DateTime? createdAt;
  final DateTime? readAt;

  Message({
    required this.id,
    required this.conversationId,
    required this.senderId,
    this.senderUsername,
    this.senderAvatar,
    required this.text,
    this.mediaUrl,
    this.mediaType,
    this.isRead = false,
    this.createdAt,
    this.readAt,
  });

  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['_id'] ?? json['id'] ?? '',
      conversationId: json['conversationId'] ?? json['conversation'] ?? '',
      senderId: json['senderId'] ?? json['sender']?['_id'] ?? '',
      senderUsername: json['senderUsername'] ?? json['sender']?['username'],
      senderAvatar: json['senderAvatar'] ?? json['sender']?['avatar'],
      text: json['text'] ?? '',
      mediaUrl: json['mediaUrl'],
      mediaType: json['mediaType'],
      isRead: json['isRead'] ?? false,
      createdAt:
          json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
      readAt: json['readAt'] != null ? DateTime.parse(json['readAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'conversationId': conversationId,
      'senderId': senderId,
      if (senderUsername != null) 'senderUsername': senderUsername,
      if (senderAvatar != null) 'senderAvatar': senderAvatar,
      'text': text,
      if (mediaUrl != null) 'mediaUrl': mediaUrl,
      if (mediaType != null) 'mediaType': mediaType,
      'isRead': isRead,
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
      if (readAt != null) 'readAt': readAt!.toIso8601String(),
    };
  }
}
