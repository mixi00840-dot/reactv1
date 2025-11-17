/// Currency Model - Multi-currency system
/// Matches backend/src/models/Currency.js
class CurrencyModel {
  final String id;
  final String code; // ISO 4217 (e.g., 'USD', 'EUR')
  final String name;
  final String symbol;
  final double exchangeRate; // Rate relative to USD
  final bool active;
  final int decimalPlaces;
  final DateTime createdAt;
  final DateTime updatedAt;

  CurrencyModel({
    required this.id,
    required this.code,
    required this.name,
    required this.symbol,
    required this.exchangeRate,
    this.active = true,
    this.decimalPlaces = 2,
    required this.createdAt,
    required this.updatedAt,
  });

  factory CurrencyModel.fromJson(Map<String, dynamic> json) {
    return CurrencyModel(
      id: json['_id'] ?? json['id'],
      code: json['code'],
      name: json['name'],
      symbol: json['symbol'],
      exchangeRate: (json['exchangeRate'] ?? 1).toDouble(),
      active: json['active'] ?? true,
      decimalPlaces: json['decimalPlaces'] ?? 2,
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'code': code,
      'name': name,
      'symbol': symbol,
      'exchangeRate': exchangeRate,
      'active': active,
      'decimalPlaces': decimalPlaces,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  String formatAmount(double amount) {
    return '$symbol${amount.toStringAsFixed(decimalPlaces)}';
  }

  double convertFromUSD(double usdAmount) {
    return usdAmount * exchangeRate;
  }

  double convertToUSD(double amount) {
    return amount / exchangeRate;
  }
}
