import 'package:flutter/material.dart';

/// Notification Model - Push notifications
/// Matches backend/src/models/Notification.js
enum NotificationType {
  like,
  comment,
  follow,
  mention,
  share,
  gift,
  purchase,
  order,
  message,
  liveStart,
  system,
  promotion,
  milestone,
  badge,
  earnings;

  static NotificationType fromString(String value) {
    return NotificationType.values.firstWhere(
      (e) => e.name == value,
      orElse: () => NotificationType.system,
    );
  }
}

class NotificationModel {
  final String id;
  final String userId;
  final NotificationType type;
  final String title;
  final String message;
  final Map<String, dynamic>? data;
  final String? actionUrl;
  final String? imageUrl;
  final bool read;
  final bool clicked;
  final String? fromUserId;
  final String? contentId;
  final DateTime createdAt;

  NotificationModel({
    required this.id,
    required this.userId,
    required this.type,
    required this.title,
    required this.message,
    this.data,
    this.actionUrl,
    this.imageUrl,
    this.read = false,
    this.clicked = false,
    this.fromUserId,
    this.contentId,
    required this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['_id'] ?? json['id'],
      userId: json['user'] ?? json['userId'],
      type: NotificationType.fromString(json['type'] ?? 'system'),
      title: json['title'],
      message: json['message'],
      data: json['data'],
      actionUrl: json['actionUrl'],
      imageUrl: json['imageUrl'],
      read: json['read'] ?? false,
      clicked: json['clicked'] ?? false,
      fromUserId: json['fromUser'],
      contentId: json['content'],
      createdAt: DateTime.parse(json['createdAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'user': userId,
      'type': type.name,
      'title': title,
      'message': message,
      if (data != null) 'data': data,
      if (actionUrl != null) 'actionUrl': actionUrl,
      if (imageUrl != null) 'imageUrl': imageUrl,
      'read': read,
      'clicked': clicked,
      if (fromUserId != null) 'fromUser': fromUserId,
      if (contentId != null) 'content': contentId,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  IconData get icon {
    switch (type) {
      case NotificationType.like:
        return Icons.favorite;
      case NotificationType.comment:
        return Icons.comment;
      case NotificationType.follow:
        return Icons.person_add;
      case NotificationType.mention:
        return Icons.alternate_email;
      case NotificationType.share:
        return Icons.share;
      case NotificationType.gift:
        return Icons.card_giftcard;
      case NotificationType.purchase:
      case NotificationType.order:
        return Icons.shopping_bag;
      case NotificationType.message:
        return Icons.message;
      case NotificationType.liveStart:
        return Icons.video_call;
      case NotificationType.promotion:
        return Icons.local_offer;
      case NotificationType.milestone:
        return Icons.emoji_events;
      case NotificationType.badge:
        return Icons.military_tech;
      case NotificationType.earnings:
        return Icons.attach_money;
      default:
        return Icons.notifications;
    }
  }

  Color get color {
    switch (type) {
      case NotificationType.like:
        return Colors.red;
      case NotificationType.comment:
        return Colors.blue;
      case NotificationType.follow:
        return Colors.green;
      case NotificationType.mention:
        return Colors.orange;
      case NotificationType.share:
        return Colors.purple;
      case NotificationType.gift:
        return Colors.pink;
      case NotificationType.purchase:
      case NotificationType.order:
        return Colors.amber;
      case NotificationType.message:
        return Colors.cyan;
      case NotificationType.liveStart:
        return Colors.deepPurple;
      case NotificationType.milestone:
        return Colors.yellow;
      case NotificationType.badge:
        return Colors.teal;
      case NotificationType.earnings:
        return Colors.green.shade700;
      default:
        return Colors.grey;
    }
  }

  NotificationModel copyWith({
    String? id,
    String? userId,
    NotificationType? type,
    String? title,
    String? message,
    Map<String, dynamic>? data,
    String? actionUrl,
    String? imageUrl,
    bool? read,
    bool? clicked,
    String? fromUserId,
    String? contentId,
    DateTime? createdAt,
  }) {
    return NotificationModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      type: type ?? this.type,
      title: title ?? this.title,
      message: message ?? this.message,
      data: data ?? this.data,
      actionUrl: actionUrl ?? this.actionUrl,
      imageUrl: imageUrl ?? this.imageUrl,
      read: read ?? this.read,
      clicked: clicked ?? this.clicked,
      fromUserId: fromUserId ?? this.fromUserId,
      contentId: contentId ?? this.contentId,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
