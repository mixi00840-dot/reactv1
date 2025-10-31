class WalletData {
  final String id;
  final String userId;
  final double balance;
  final double pendingBalance;
  final String currency;
  final List<Transaction> recentTransactions;
  final DateTime lastUpdated;

  WalletData({
    required this.id,
    required this.userId,
    required this.balance,
    this.pendingBalance = 0.0,
    this.currency = 'USD',
    required this.recentTransactions,
    required this.lastUpdated,
  });

  factory WalletData.fromJson(Map<String, dynamic> json) {
    return WalletData(
      id: json['_id'] ?? json['id'] ?? '',
      userId: json['userId'] ?? '',
      balance: (json['balance'] ?? 0.0).toDouble(),
      pendingBalance: (json['pendingBalance'] ?? 0.0).toDouble(),
      currency: json['currency'] ?? 'USD',
      recentTransactions: (json['recentTransactions'] as List<dynamic>?)
              ?.map((tx) => Transaction.fromJson(tx))
              .toList() ??
          [],
      lastUpdated: DateTime.parse(json['lastUpdated'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'balance': balance,
      'pendingBalance': pendingBalance,
      'currency': currency,
      'recentTransactions': recentTransactions.map((tx) => tx.toJson()).toList(),
      'lastUpdated': lastUpdated.toIso8601String(),
    };
  }

  String get formattedBalance => '\$$balance';
  String get formattedPendingBalance => '\$$pendingBalance';
}

class Transaction {
  final String id;
  final String walletId;
  final TransactionType type;
  final double amount;
  final String currency;
  final TransactionStatus status;
  final String? description;
  final Map<String, dynamic>? metadata;
  final String? receiptUrl;
  final DateTime createdAt;

  Transaction({
    required this.id,
    required this.walletId,
    required this.type,
    required this.amount,
    this.currency = 'USD',
    required this.status,
    this.description,
    this.metadata,
    this.receiptUrl,
    required this.createdAt,
  });

  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      id: json['_id'] ?? json['id'] ?? '',
      walletId: json['walletId'] ?? '',
      type: TransactionType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => TransactionType.other,
      ),
      amount: (json['amount'] ?? 0.0).toDouble(),
      currency: json['currency'] ?? 'USD',
      status: TransactionStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => TransactionStatus.pending,
      ),
      description: json['description'],
      metadata: json['metadata'],
      receiptUrl: json['receiptUrl'],
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'walletId': walletId,
      'type': type.name,
      'amount': amount,
      'currency': currency,
      'status': status.name,
      if (description != null) 'description': description,
      if (metadata != null) 'metadata': metadata,
      if (receiptUrl != null) 'receiptUrl': receiptUrl,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  String get formattedAmount {
    final sign = type == TransactionType.credit ? '+' : '-';
    return '$sign\$${amount.toStringAsFixed(2)}';
  }

  bool get isPending => status == TransactionStatus.pending;
  bool get isCompleted => status == TransactionStatus.completed;
  bool get isFailed => status == TransactionStatus.failed;
}

enum TransactionType {
  credit,
  debit,
  purchase,
  withdrawal,
  refund,
  coinPurchase,
  gift,
  other,
}

enum TransactionStatus {
  pending,
  processing,
  completed,
  failed,
  cancelled,
}
