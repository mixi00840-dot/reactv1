class ChatModel {
  final String id;
  final String userId;
  final String username;
  final String displayName;
  final String avatarUrl;
  final String lastMessage;
  final DateTime lastMessageTime;
  final int unreadCount;
  final bool isOnline;
  final bool isTyping;

  ChatModel({
    required this.id,
    required this.userId,
    required this.username,
    required this.displayName,
    required this.avatarUrl,
    required this.lastMessage,
    required this.lastMessageTime,
    required this.unreadCount,
    required this.isOnline,
    required this.isTyping,
  });
}

class MessageModel {
  final String id;
  final String senderId;
  final String receiverId;
  final String content;
  final MessageType type;
  final DateTime timestamp;
  final bool isRead;
  final String? mediaUrl;
  final String? replyToId;

  MessageModel({
    required this.id,
    required this.senderId,
    required this.receiverId,
    required this.content,
    required this.type,
    required this.timestamp,
    required this.isRead,
    this.mediaUrl,
    this.replyToId,
  });
}

enum MessageType {
  text,
  image,
  video,
  audio,
  file,
}
