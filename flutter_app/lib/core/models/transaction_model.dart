/// Transaction Model - Transaction history
/// Matches backend/src/models/Transaction.js
enum TransactionType {
  topup,
  withdrawal,
  transfer,
  gift,
  purchase,
  refund,
  commission,
  bonus,
  penalty,
  reversal,
  adjustment,
  coinPurchase;

  static TransactionType fromString(String value) {
    return TransactionType.values.firstWhere(
      (e) => e.name == value,
      orElse: () => TransactionType.transfer,
    );
  }
}

enum TransactionStatus {
  pending,
  completed,
  failed,
  cancelled,
  processing;

  static TransactionStatus fromString(String value) {
    return TransactionStatus.values.firstWhere(
      (e) => e.name == value,
      orElse: () => TransactionStatus.pending,
    );
  }
}

class TransactionModel {
  final String id;
  final String walletId;
  final TransactionType type;
  final double amount;
  final String? fromUserId;
  final String? toUserId;
  final TransactionStatus status;
  final String? description;
  final Map<String, dynamic>? metadata;
  final String? paymentMethod;
  final String? paymentIntentId;
  final String? referenceId;
  final double? balanceBefore;
  final double? balanceAfter;
  final DateTime createdAt;
  final DateTime updatedAt;

  TransactionModel({
    required this.id,
    required this.walletId,
    required this.type,
    required this.amount,
    this.fromUserId,
    this.toUserId,
    required this.status,
    this.description,
    this.metadata,
    this.paymentMethod,
    this.paymentIntentId,
    this.referenceId,
    this.balanceBefore,
    this.balanceAfter,
    required this.createdAt,
    required this.updatedAt,
  });

  factory TransactionModel.fromJson(Map<String, dynamic> json) {
    return TransactionModel(
      id: json['_id'] ?? json['id'],
      walletId: json['wallet'] ?? json['walletId'],
      type: TransactionType.fromString(json['type'] ?? 'transfer'),
      amount: (json['amount'] ?? 0).toDouble(),
      fromUserId: json['from'],
      toUserId: json['to'],
      status: TransactionStatus.fromString(json['status'] ?? 'pending'),
      description: json['description'],
      metadata: json['metadata'],
      paymentMethod: json['paymentMethod'],
      paymentIntentId: json['paymentIntentId'],
      referenceId: json['referenceId'],
      balanceBefore: json['balanceBefore']?.toDouble(),
      balanceAfter: json['balanceAfter']?.toDouble(),
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'wallet': walletId,
      'type': type.name,
      'amount': amount,
      if (fromUserId != null) 'from': fromUserId,
      if (toUserId != null) 'to': toUserId,
      'status': status.name,
      if (description != null) 'description': description,
      if (metadata != null) 'metadata': metadata,
      if (paymentMethod != null) 'paymentMethod': paymentMethod,
      if (paymentIntentId != null) 'paymentIntentId': paymentIntentId,
      if (referenceId != null) 'referenceId': referenceId,
      if (balanceBefore != null) 'balanceBefore': balanceBefore,
      if (balanceAfter != null) 'balanceAfter': balanceAfter,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  bool get isIncoming =>
      type == TransactionType.topup ||
      (type == TransactionType.transfer && toUserId != null);

  bool get isOutgoing =>
      type == TransactionType.withdrawal ||
      type == TransactionType.purchase ||
      (type == TransactionType.transfer && fromUserId != null);
}
