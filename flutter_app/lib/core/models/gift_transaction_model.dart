/// GiftTransaction Model - Gift sending records
/// Matches backend/src/models/GiftTransaction.js
class GiftTransactionModel {
  final String id;
  final String giftId;
  final String senderId;
  final String recipientId;
  final String? contentId;
  final String? liveStreamId;
  final int quantity;
  final double totalCoinCost;
  final Map<String, dynamic>? metadata;
  final DateTime createdAt;

  GiftTransactionModel({
    required this.id,
    required this.giftId,
    required this.senderId,
    required this.recipientId,
    this.contentId,
    this.liveStreamId,
    this.quantity = 1,
    required this.totalCoinCost,
    this.metadata,
    required this.createdAt,
  });

  factory GiftTransactionModel.fromJson(Map<String, dynamic> json) {
    return GiftTransactionModel(
      id: json['_id'] ?? json['id'],
      giftId: json['gift'] ?? json['giftId'],
      senderId: json['sender'] ?? json['senderId'],
      recipientId: json['recipient'] ?? json['recipientId'],
      contentId: json['content'],
      liveStreamId: json['liveStream'],
      quantity: json['quantity'] ?? 1,
      totalCoinCost: (json['totalCoinCost'] ?? 0).toDouble(),
      metadata: json['metadata'],
      createdAt: DateTime.parse(json['createdAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'gift': giftId,
      'sender': senderId,
      'recipient': recipientId,
      if (contentId != null) 'content': contentId,
      if (liveStreamId != null) 'liveStream': liveStreamId,
      'quantity': quantity,
      'totalCoinCost': totalCoinCost,
      if (metadata != null) 'metadata': metadata,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  bool get isSentInLiveStream => liveStreamId != null;
  bool get isSentOnContent => contentId != null;
}
