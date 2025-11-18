class NotificationModel {
  final String id;
  final String userId;
  final String type; // like, comment, follow, gift, message, system
  final String title;
  final String? body;
  final String? imageUrl;
  final bool isRead;
  final String? actionUrl;
  final Map<String, dynamic>? data;
  final DateTime? createdAt;

  NotificationModel({
    required this.id,
    required this.userId,
    required this.type,
    required this.title,
    this.body,
    this.imageUrl,
    this.isRead = false,
    this.actionUrl,
    this.data,
    this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['_id'] ?? json['id'] ?? '',
      userId: json['userId'] ?? json['user'] ?? '',
      type: json['type'] ?? 'system',
      title: json['title'] ?? '',
      body: json['body'] ?? json['message'],
      imageUrl: json['imageUrl'] ?? json['image'],
      isRead: json['isRead'] ?? false,
      actionUrl: json['actionUrl'] ?? json['link'],
      data: json['data'],
      createdAt:
          json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'type': type,
      'title': title,
      if (body != null) 'body': body,
      if (imageUrl != null) 'imageUrl': imageUrl,
      'isRead': isRead,
      if (actionUrl != null) 'actionUrl': actionUrl,
      if (data != null) 'data': data,
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
    };
  }
}
