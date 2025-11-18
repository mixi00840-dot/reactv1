/// Payment method model for managing user payment options
class PaymentMethodModel {
  final String id;
  final String type; // 'card', 'paypal', 'apple_pay', 'google_pay', etc.
  final String name;
  final String? cardLast4;
  final String? cardBrand; // 'visa', 'mastercard', 'amex'
  final String? expiryMonth;
  final String? expiryYear;
  final bool isDefault;
  final DateTime createdAt;
  final DateTime updatedAt;

  PaymentMethodModel({
    required this.id,
    required this.type,
    required this.name,
    this.cardLast4,
    this.cardBrand,
    this.expiryMonth,
    this.expiryYear,
    this.isDefault = false,
    required this.createdAt,
    required this.updatedAt,
  });

  factory PaymentMethodModel.fromJson(Map<String, dynamic> json) {
    return PaymentMethodModel(
      id: json['_id'] ?? json['id'] ?? '',
      type: json['type'] ?? '',
      name: json['name'] ?? '',
      cardLast4: json['cardLast4'],
      cardBrand: json['cardBrand'],
      expiryMonth: json['expiryMonth'],
      expiryYear: json['expiryYear'],
      isDefault: json['isDefault'] ?? false,
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'type': type,
      'name': name,
      if (cardLast4 != null) 'cardLast4': cardLast4,
      if (cardBrand != null) 'cardBrand': cardBrand,
      if (expiryMonth != null) 'expiryMonth': expiryMonth,
      if (expiryYear != null) 'expiryYear': expiryYear,
      'isDefault': isDefault,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  String get displayName {
    if (type == 'card' && cardLast4 != null) {
      return '•••• $cardLast4';
    }
    return name;
  }

  String get brand => cardBrand ?? type;

  String get typeIcon {
    switch (type.toLowerCase()) {
      case 'card':
        return '💳';
      case 'paypal':
        return '🅿️';
      case 'apple_pay':
        return '🍎';
      case 'google_pay':
        return '🅖';
      default:
        return '💰';
    }
  }
}