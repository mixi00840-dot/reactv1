/// Wallet Model - Digital wallet with balance tracking
/// Matches backend/src/models/Wallet.js
class WalletModel {
  final String id;
  final String userId;
  final double balance;
  final String currency;
  final bool frozen;
  final DateTime createdAt;
  final DateTime updatedAt;

  WalletModel({
    required this.id,
    required this.userId,
    required this.balance,
    this.currency = 'USD',
    this.frozen = false,
    required this.createdAt,
    required this.updatedAt,
  });

  factory WalletModel.fromJson(Map<String, dynamic> json) {
    return WalletModel(
      id: json['_id'] ?? json['id'],
      userId: json['user'] ?? json['userId'],
      balance: (json['balance'] ?? 0).toDouble(),
      currency: json['currency'] ?? 'USD',
      frozen: json['frozen'] ?? false,
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'user': userId,
      'balance': balance,
      'currency': currency,
      'frozen': frozen,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  WalletModel copyWith({
    String? id,
    String? userId,
    double? balance,
    String? currency,
    bool? frozen,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return WalletModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      balance: balance ?? this.balance,
      currency: currency ?? this.currency,
      frozen: frozen ?? this.frozen,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
