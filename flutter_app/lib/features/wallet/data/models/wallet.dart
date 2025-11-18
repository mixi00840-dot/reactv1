class Wallet {
  final String id;
  final String userId;
  final double balance;
  final int coins;
  final String currency;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Wallet({
    required this.id,
    required this.userId,
    this.balance = 0.0,
    this.coins = 0,
    this.currency = 'USD',
    this.createdAt,
    this.updatedAt,
  });

  factory Wallet.fromJson(Map<String, dynamic> json) {
    return Wallet(
      id: json['_id'] ?? json['id'] ?? '',
      userId: json['userId'] ?? json['user'] ?? '',
      balance: (json['balance'] ?? 0).toDouble(),
      coins: json['coins'] ?? 0,
      currency: json['currency'] ?? 'USD',
      createdAt:
          json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
      updatedAt:
          json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'balance': balance,
      'coins': coins,
      'currency': currency,
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
    };
  }
}

class Transaction {
  final String id;
  final String walletId;
  final String type; // credit, debit, transfer, gift, purchase, topup
  final double amount;
  final int? coins;
  final String status; // pending, completed, failed, cancelled
  final String? description;
  final String? fromUserId;
  final String? toUserId;
  final String? referenceId;
  final Map<String, dynamic>? metadata;
  final DateTime? createdAt;

  Transaction({
    required this.id,
    required this.walletId,
    required this.type,
    required this.amount,
    this.coins,
    this.status = 'completed',
    this.description,
    this.fromUserId,
    this.toUserId,
    this.referenceId,
    this.metadata,
    this.createdAt,
  });

  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      id: json['_id'] ?? json['id'] ?? '',
      walletId: json['walletId'] ?? json['wallet'] ?? '',
      type: json['type'] ?? 'credit',
      amount: (json['amount'] ?? 0).toDouble(),
      coins: json['coins'],
      status: json['status'] ?? 'completed',
      description: json['description'],
      fromUserId: json['fromUserId'] ?? json['from'],
      toUserId: json['toUserId'] ?? json['to'],
      referenceId: json['referenceId'],
      metadata: json['metadata'],
      createdAt:
          json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'walletId': walletId,
      'type': type,
      'amount': amount,
      if (coins != null) 'coins': coins,
      'status': status,
      if (description != null) 'description': description,
      if (fromUserId != null) 'fromUserId': fromUserId,
      if (toUserId != null) 'toUserId': toUserId,
      if (referenceId != null) 'referenceId': referenceId,
      if (metadata != null) 'metadata': metadata,
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
    };
  }

  bool get isCredit => type == 'credit' || type == 'topup' || type == 'gift';
  bool get isDebit =>
      type == 'debit' || type == 'transfer' || type == 'purchase';
}
