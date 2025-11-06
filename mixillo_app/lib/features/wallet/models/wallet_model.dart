/// Enhanced Wallet Model - Complete backend structure
/// Matches backend Wallet model with all fields

class WalletModel {
  // Basic identification
  final String id;
  final String userId;
  
  // Balance Information
  final double balance;
  final double coins; // In-app currency
  final double pendingCredit;
  final double pendingDebit;
  final double availableBalance; // balance - pendingDebit
  
  // Enhanced tracking
  final double totalEarnings;
  final double totalSpendings;
  final double monthlyEarnings;
  final double monthlySpendings;
  
  // Currency
  final String currency;
  
  // Support Level
  final SupportLevel supportLevel;
  
  // Wallet Status
  final WalletStatus status;
  final bool isActive;
  final bool isFrozen;
  
  // Security Settings
  final WalletSecurity? security;
  
  // Limits and Settings
  final WalletLimits? limits;
  
  // Timestamps
  final DateTime createdAt;
  final DateTime? updatedAt;
  final DateTime? lastUpdated;

  WalletModel({
    required this.id,
    required this.userId,
    this.balance = 0.0,
    this.coins = 0.0,
    this.pendingCredit = 0.0,
    this.pendingDebit = 0.0,
    this.availableBalance = 0.0,
    this.totalEarnings = 0.0,
    this.totalSpendings = 0.0,
    this.monthlyEarnings = 0.0,
    this.monthlySpendings = 0.0,
    this.currency = 'USD',
    this.supportLevel = SupportLevel.bronze,
    this.status = WalletStatus.active,
    this.isActive = true,
    this.isFrozen = false,
    this.security,
    this.limits,
    required this.createdAt,
    this.updatedAt,
    this.lastUpdated,
  });

  factory WalletModel.fromJson(Map<String, dynamic> json) {
    final walletId = json['id'] ?? json['_id'] ?? json['walletId'] ?? '';
    final userId = json['userId'] ?? json['user_id'] ?? '';
    
    return WalletModel(
      id: walletId,
      userId: userId,
      balance: (json['balance'] ?? 0).toDouble(),
      coins: (json['coins'] ?? json['balance'] ?? 0).toDouble(), // Coins may be same as balance
      pendingCredit: (json['pendingCredit'] ?? json['pending_credit'] ?? 0).toDouble(),
      pendingDebit: (json['pendingDebit'] ?? json['pending_debit'] ?? 0).toDouble(),
      availableBalance: (json['availableBalance'] ?? json['available_balance'] ?? json['balance'] ?? 0).toDouble(),
      totalEarnings: (json['totalEarnings'] ?? json['total_earnings'] ?? 0).toDouble(),
      totalSpendings: (json['totalSpendings'] ?? json['total_spendings'] ?? 0).toDouble(),
      monthlyEarnings: (json['monthlyEarnings'] ?? json['monthly_earnings'] ?? 0).toDouble(),
      monthlySpendings: (json['monthlySpendings'] ?? json['monthly_spendings'] ?? 0).toDouble(),
      currency: json['currency'] ?? 'USD',
      supportLevel: _parseSupportLevel(json['supportLevel'] ?? json['support_level'] ?? 'bronze'),
      status: _parseWalletStatus(json['status'] ?? 'active'),
      isActive: json['isActive'] ?? json['is_active'] ?? true,
      isFrozen: json['isFrozen'] ?? json['is_frozen'] ?? false,
      security: json['security'] != null ? WalletSecurity.fromJson(json['security']) : null,
      limits: json['limits'] != null ? WalletLimits.fromJson(json['limits']) : null,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'].toString())
          : json['created_at'] != null
              ? DateTime.parse(json['created_at'].toString())
              : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'].toString())
          : json['updated_at'] != null
              ? DateTime.parse(json['updated_at'].toString())
              : null,
      lastUpdated: json['lastUpdated'] != null
          ? DateTime.parse(json['lastUpdated'].toString())
          : json['last_updated'] != null
              ? DateTime.parse(json['last_updated'].toString())
              : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'balance': balance,
      'coins': coins,
      'pendingCredit': pendingCredit,
      'pendingDebit': pendingDebit,
      'availableBalance': availableBalance,
      'totalEarnings': totalEarnings,
      'totalSpendings': totalSpendings,
      'monthlyEarnings': monthlyEarnings,
      'monthlySpendings': monthlySpendings,
      'currency': currency,
      'supportLevel': supportLevel.name,
      'status': status.name,
      'isActive': isActive,
      'isFrozen': isFrozen,
      if (security != null) 'security': security!.toJson(),
      if (limits != null) 'limits': limits!.toJson(),
      'createdAt': createdAt.toIso8601String(),
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
      if (lastUpdated != null) 'lastUpdated': lastUpdated!.toIso8601String(),
    };
  }

  WalletModel copyWith({
    String? id,
    String? userId,
    double? balance,
    double? coins,
    double? pendingCredit,
    double? pendingDebit,
    double? availableBalance,
    double? totalEarnings,
    double? totalSpendings,
    double? monthlyEarnings,
    double? monthlySpendings,
    String? currency,
    SupportLevel? supportLevel,
    WalletStatus? status,
    bool? isActive,
    bool? isFrozen,
    WalletSecurity? security,
    WalletLimits? limits,
    DateTime? createdAt,
    DateTime? updatedAt,
    DateTime? lastUpdated,
  }) {
    return WalletModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      balance: balance ?? this.balance,
      coins: coins ?? this.coins,
      pendingCredit: pendingCredit ?? this.pendingCredit,
      pendingDebit: pendingDebit ?? this.pendingDebit,
      availableBalance: availableBalance ?? this.availableBalance,
      totalEarnings: totalEarnings ?? this.totalEarnings,
      totalSpendings: totalSpendings ?? this.totalSpendings,
      monthlyEarnings: monthlyEarnings ?? this.monthlyEarnings,
      monthlySpendings: monthlySpendings ?? this.monthlySpendings,
      currency: currency ?? this.currency,
      supportLevel: supportLevel ?? this.supportLevel,
      status: status ?? this.status,
      isActive: isActive ?? this.isActive,
      isFrozen: isFrozen ?? this.isFrozen,
      security: security ?? this.security,
      limits: limits ?? this.limits,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      lastUpdated: lastUpdated ?? this.lastUpdated,
    );
  }

  // Helper getters
  bool get canWithdraw => isActive && !isFrozen && availableBalance > 0;
  bool get canDeposit => isActive && !isFrozen;
  double get netBalance => balance - pendingDebit;

  static SupportLevel _parseSupportLevel(dynamic value) {
    if (value is String) {
      return SupportLevel.values.firstWhere(
        (e) => e.name == value.toLowerCase(),
        orElse: () => SupportLevel.bronze,
      );
    }
    return SupportLevel.bronze;
  }

  static WalletStatus _parseWalletStatus(dynamic value) {
    if (value is String) {
      return WalletStatus.values.firstWhere(
        (e) => e.name == value.toLowerCase(),
        orElse: () => WalletStatus.active,
      );
    }
    return WalletStatus.active;
  }
}

// Enums
enum SupportLevel { bronze, silver, gold, platinum, diamond }
enum WalletStatus { active, frozen, suspended, closed }

// Supporting Models
class WalletSecurity {
  final bool twoFactorEnabled;
  final int? pinAttempts;
  final DateTime? lastPinAttempt;

  WalletSecurity({
    this.twoFactorEnabled = false,
    this.pinAttempts,
    this.lastPinAttempt,
  });

  factory WalletSecurity.fromJson(Map<String, dynamic> json) {
    return WalletSecurity(
      twoFactorEnabled: json['twoFactorEnabled'] ?? json['two_factor_enabled'] ?? false,
      pinAttempts: json['pinAttempts'] ?? json['pin_attempts'],
      lastPinAttempt: json['lastPinAttempt'] != null
          ? DateTime.parse(json['lastPinAttempt'].toString())
          : json['last_pin_attempt'] != null
              ? DateTime.parse(json['last_pin_attempt'].toString())
              : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'twoFactorEnabled': twoFactorEnabled,
    if (pinAttempts != null) 'pinAttempts': pinAttempts,
    if (lastPinAttempt != null) 'lastPinAttempt': lastPinAttempt!.toIso8601String(),
  };
}

class WalletLimits {
  final double? dailyWithdrawalLimit;
  final double? monthlyWithdrawalLimit;
  final double? transactionLimit;
  final int? dailyTransactionCount;

  WalletLimits({
    this.dailyWithdrawalLimit,
    this.monthlyWithdrawalLimit,
    this.transactionLimit,
    this.dailyTransactionCount,
  });

  factory WalletLimits.fromJson(Map<String, dynamic> json) {
    return WalletLimits(
      dailyWithdrawalLimit: json['dailyWithdrawalLimit'] != null
          ? (json['dailyWithdrawalLimit'] as num).toDouble()
          : json['daily_withdrawal_limit'] != null
              ? (json['daily_withdrawal_limit'] as num).toDouble()
              : null,
      monthlyWithdrawalLimit: json['monthlyWithdrawalLimit'] != null
          ? (json['monthlyWithdrawalLimit'] as num).toDouble()
          : json['monthly_withdrawal_limit'] != null
              ? (json['monthly_withdrawal_limit'] as num).toDouble()
              : null,
      transactionLimit: json['transactionLimit'] != null
          ? (json['transactionLimit'] as num).toDouble()
          : json['transaction_limit'] != null
              ? (json['transaction_limit'] as num).toDouble()
              : null,
      dailyTransactionCount: json['dailyTransactionCount'] ?? json['daily_transaction_count'],
    );
  }

  Map<String, dynamic> toJson() => {
    if (dailyWithdrawalLimit != null) 'dailyWithdrawalLimit': dailyWithdrawalLimit,
    if (monthlyWithdrawalLimit != null) 'monthlyWithdrawalLimit': monthlyWithdrawalLimit,
    if (transactionLimit != null) 'transactionLimit': transactionLimit,
    if (dailyTransactionCount != null) 'dailyTransactionCount': dailyTransactionCount,
  };
}

/// Enhanced Transaction Model - Complete backend structure
class TransactionModel {
  // Transaction Identification
  final String id;
  final String transactionId;
  final String? walletId;
  
  // Related Entities
  final String? orderId;
  final String userId;
  final String? storeId;
  final String? relatedOrderId;
  final String? relatedTransactionId;
  final String? relatedUserId;
  
  // Transaction Details
  final TransactionType type;
  final TransactionSubtype? subtype;
  final double amount;
  final double? coins; // For coin transactions
  final String currency;
  
  // Balance Information
  final double? balanceBefore;
  final double? balanceAfter;
  
  // Fee Breakdown
  final TransactionFees? fees;
  final double? netAmount; // amount - fees
  
  // Payment Method
  final PaymentMethod? paymentMethod;
  
  // Payment Provider Information
  final PaymentProvider? provider;
  
  // Transaction Status
  final TransactionStatus status;
  
  // Failure Information
  final String? failureReason;
  final String? failureCode;
  
  // Description and Reference
  final String? description;
  final String? reference;
  final String? internalNotes;
  
  // Timing
  final DateTime createdAt;
  final DateTime? updatedAt;
  final DateTime? processedAt;
  final DateTime? settledAt;
  
  // Risk Assessment
  final int? riskScore;
  final List<String>? riskFactors;
  
  // Reconciliation
  final bool reconciled;
  final DateTime? reconciledAt;
  
  // Metadata
  final Map<String, dynamic>? metadata;
  final String? processedBy;

  TransactionModel({
    required this.id,
    required this.transactionId,
    this.walletId,
    this.orderId,
    required this.userId,
    this.storeId,
    this.relatedOrderId,
    this.relatedTransactionId,
    this.relatedUserId,
    required this.type,
    this.subtype,
    required this.amount,
    this.coins,
    this.currency = 'USD',
    this.balanceBefore,
    this.balanceAfter,
    this.fees,
    this.netAmount,
    this.paymentMethod,
    this.provider,
    required this.status,
    this.failureReason,
    this.failureCode,
    this.description,
    this.reference,
    this.internalNotes,
    required this.createdAt,
    this.updatedAt,
    this.processedAt,
    this.settledAt,
    this.riskScore,
    this.riskFactors,
    this.reconciled = false,
    this.reconciledAt,
    this.metadata,
    this.processedBy,
  });

  factory TransactionModel.fromJson(Map<String, dynamic> json) {
    final transId = json['id'] ?? json['_id'] ?? json['transactionId'] ?? '';
    final transIdString = json['transactionId'] ?? json['transaction_id'] ?? transId;
    
    return TransactionModel(
      id: transId,
      transactionId: transIdString,
      walletId: json['walletId'] ?? json['wallet_id'],
      orderId: json['orderId'] ?? json['order_id'],
      userId: json['userId'] ?? json['user_id'] ?? '',
      storeId: json['storeId'] ?? json['store_id'],
      relatedOrderId: json['relatedOrderId'] ?? json['related_order_id'],
      relatedTransactionId: json['relatedTransactionId'] ?? json['related_transaction_id'],
      relatedUserId: json['relatedUserId'] ?? json['related_user_id'],
      type: _parseTransactionType(json['type'] ?? ''),
      subtype: json['subtype'] != null ? _parseTransactionSubtype(json['subtype']) : null,
      amount: (json['amount'] ?? 0).toDouble(),
      coins: json['coins'] != null ? (json['coins'] as num).toDouble() : null,
      currency: json['currency'] ?? 'USD',
      balanceBefore: json['balanceBefore'] != null
          ? (json['balanceBefore'] as num).toDouble()
          : json['balance_before'] != null
              ? (json['balance_before'] as num).toDouble()
              : null,
      balanceAfter: json['balanceAfter'] != null
          ? (json['balanceAfter'] as num).toDouble()
          : json['balance_after'] != null
              ? (json['balance_after'] as num).toDouble()
              : null,
      fees: json['fees'] != null ? TransactionFees.fromJson(json['fees']) : null,
      netAmount: json['netAmount'] != null
          ? (json['netAmount'] as num).toDouble()
          : json['net_amount'] != null
              ? (json['net_amount'] as num).toDouble()
              : null,
      paymentMethod: json['paymentMethod'] != null
          ? _parsePaymentMethod(json['paymentMethod'])
          : null,
      provider: json['provider'] != null ? PaymentProvider.fromJson(json['provider']) : null,
      status: _parseTransactionStatus(json['status'] ?? 'pending'),
      failureReason: json['failureReason'] ?? json['failure_reason'],
      failureCode: json['failureCode'] ?? json['failure_code'],
      description: json['description'],
      reference: json['reference'],
      internalNotes: json['internalNotes'] ?? json['internal_notes'],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'].toString())
          : json['created_at'] != null
              ? DateTime.parse(json['created_at'].toString())
              : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'].toString())
          : json['updated_at'] != null
              ? DateTime.parse(json['updated_at'].toString())
              : null,
      processedAt: json['processedAt'] != null
          ? DateTime.parse(json['processedAt'].toString())
          : json['processed_at'] != null
              ? DateTime.parse(json['processed_at'].toString())
              : null,
      settledAt: json['settledAt'] != null
          ? DateTime.parse(json['settledAt'].toString())
          : json['settled_at'] != null
              ? DateTime.parse(json['settled_at'].toString())
              : null,
      riskScore: json['riskScore'] ?? json['risk_score'],
      riskFactors: json['riskFactors'] != null
          ? List<String>.from(json['riskFactors'])
          : json['risk_factors'] != null
              ? List<String>.from(json['risk_factors'])
              : null,
      reconciled: json['reconciled'] ?? false,
      reconciledAt: json['reconciledAt'] != null
          ? DateTime.parse(json['reconciledAt'].toString())
          : json['reconciled_at'] != null
              ? DateTime.parse(json['reconciled_at'].toString())
              : null,
      metadata: json['metadata'],
      processedBy: json['processedBy'] ?? json['processed_by'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'transactionId': transactionId,
      if (walletId != null) 'walletId': walletId,
      if (orderId != null) 'orderId': orderId,
      'userId': userId,
      if (storeId != null) 'storeId': storeId,
      if (relatedOrderId != null) 'relatedOrderId': relatedOrderId,
      if (relatedTransactionId != null) 'relatedTransactionId': relatedTransactionId,
      if (relatedUserId != null) 'relatedUserId': relatedUserId,
      'type': type.name,
      if (subtype != null) 'subtype': subtype!.name,
      'amount': amount,
      if (coins != null) 'coins': coins,
      'currency': currency,
      if (balanceBefore != null) 'balanceBefore': balanceBefore,
      if (balanceAfter != null) 'balanceAfter': balanceAfter,
      if (fees != null) 'fees': fees!.toJson(),
      if (netAmount != null) 'netAmount': netAmount,
      if (paymentMethod != null) 'paymentMethod': paymentMethod!.name,
      if (provider != null) 'provider': provider!.toJson(),
      'status': status.name,
      if (failureReason != null) 'failureReason': failureReason,
      if (failureCode != null) 'failureCode': failureCode,
      if (description != null) 'description': description,
      if (reference != null) 'reference': reference,
      if (internalNotes != null) 'internalNotes': internalNotes,
      'createdAt': createdAt.toIso8601String(),
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
      if (processedAt != null) 'processedAt': processedAt!.toIso8601String(),
      if (settledAt != null) 'settledAt': settledAt!.toIso8601String(),
      if (riskScore != null) 'riskScore': riskScore,
      if (riskFactors != null) 'riskFactors': riskFactors,
      'reconciled': reconciled,
      if (reconciledAt != null) 'reconciledAt': reconciledAt!.toIso8601String(),
      if (metadata != null) 'metadata': metadata,
      if (processedBy != null) 'processedBy': processedBy,
    };
  }

  TransactionModel copyWith({
    String? id,
    String? transactionId,
    String? walletId,
    String? orderId,
    String? userId,
    String? storeId,
    String? relatedOrderId,
    String? relatedTransactionId,
    String? relatedUserId,
    TransactionType? type,
    TransactionSubtype? subtype,
    double? amount,
    double? coins,
    String? currency,
    double? balanceBefore,
    double? balanceAfter,
    TransactionFees? fees,
    double? netAmount,
    PaymentMethod? paymentMethod,
    PaymentProvider? provider,
    TransactionStatus? status,
    String? failureReason,
    String? failureCode,
    String? description,
    String? reference,
    String? internalNotes,
    DateTime? createdAt,
    DateTime? updatedAt,
    DateTime? processedAt,
    DateTime? settledAt,
    int? riskScore,
    List<String>? riskFactors,
    bool? reconciled,
    DateTime? reconciledAt,
    Map<String, dynamic>? metadata,
    String? processedBy,
  }) {
    return TransactionModel(
      id: id ?? this.id,
      transactionId: transactionId ?? this.transactionId,
      walletId: walletId ?? this.walletId,
      orderId: orderId ?? this.orderId,
      userId: userId ?? this.userId,
      storeId: storeId ?? this.storeId,
      relatedOrderId: relatedOrderId ?? this.relatedOrderId,
      relatedTransactionId: relatedTransactionId ?? this.relatedTransactionId,
      relatedUserId: relatedUserId ?? this.relatedUserId,
      type: type ?? this.type,
      subtype: subtype ?? this.subtype,
      amount: amount ?? this.amount,
      coins: coins ?? this.coins,
      currency: currency ?? this.currency,
      balanceBefore: balanceBefore ?? this.balanceBefore,
      balanceAfter: balanceAfter ?? this.balanceAfter,
      fees: fees ?? this.fees,
      netAmount: netAmount ?? this.netAmount,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      provider: provider ?? this.provider,
      status: status ?? this.status,
      failureReason: failureReason ?? this.failureReason,
      failureCode: failureCode ?? this.failureCode,
      description: description ?? this.description,
      reference: reference ?? this.reference,
      internalNotes: internalNotes ?? this.internalNotes,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      processedAt: processedAt ?? this.processedAt,
      settledAt: settledAt ?? this.settledAt,
      riskScore: riskScore ?? this.riskScore,
      riskFactors: riskFactors ?? this.riskFactors,
      reconciled: reconciled ?? this.reconciled,
      reconciledAt: reconciledAt ?? this.reconciledAt,
      metadata: metadata ?? this.metadata,
      processedBy: processedBy ?? this.processedBy,
    );
  }

  // Helper getters
  bool get isCompleted => status == TransactionStatus.completed;
  bool get isPending => status == TransactionStatus.pending;
  bool get isFailed => status == TransactionStatus.failed;
  bool get isCredit => type == TransactionType.credit || 
                      type == TransactionType.bonus || 
                      type == TransactionType.cashback ||
                      type == TransactionType.reward ||
                      type == TransactionType.earning ||
                      type == TransactionType.transferIn;
  bool get isDebit => type == TransactionType.debit || 
                     type == TransactionType.fee || 
                     type == TransactionType.penalty ||
                     type == TransactionType.transferOut;

  static TransactionType _parseTransactionType(dynamic value) {
    if (value is String) {
      // Handle wallet transaction types
      final walletTypes = {
        'credit': TransactionType.credit,
        'debit': TransactionType.debit,
        'transfer_in': TransactionType.transferIn,
        'transfer_out': TransactionType.transferOut,
        'refund': TransactionType.refund,
        'fee': TransactionType.fee,
        'bonus': TransactionType.bonus,
        'cashback': TransactionType.cashback,
        'reward': TransactionType.reward,
        'penalty': TransactionType.penalty,
        'commission': TransactionType.commission,
        'earning': TransactionType.earning,
      };
      
      // Handle payment transaction types
      final paymentTypes = {
        'payment': TransactionType.payment,
        'payout': TransactionType.payout,
        'adjustment': TransactionType.adjustment,
        'chargeback': TransactionType.chargeback,
      };
      
      // Try wallet types first
      if (walletTypes.containsKey(value.toLowerCase())) {
        return walletTypes[value.toLowerCase()]!;
      }
      
      // Try payment types
      if (paymentTypes.containsKey(value.toLowerCase())) {
        return paymentTypes[value.toLowerCase()]!;
      }
      
      // Try enum directly
      return TransactionType.values.firstWhere(
        (e) => e.name == value.toLowerCase().replaceAll('_', ''),
        orElse: () => TransactionType.credit,
      );
    }
    return TransactionType.credit;
  }

  static TransactionSubtype? _parseTransactionSubtype(dynamic value) {
    if (value is String) {
      return TransactionSubtype.values.firstWhere(
        (e) => e.name == value.toLowerCase().replaceAll('_', ''),
        orElse: () => TransactionSubtype.purchase,
      );
    }
    return null;
  }

  static PaymentMethod? _parsePaymentMethod(dynamic value) {
    if (value is String) {
      return PaymentMethod.values.firstWhere(
        (e) => e.name == value.toLowerCase().replaceAll('_', ''),
        orElse: () => PaymentMethod.wallet,
      );
    }
    return null;
  }

  static TransactionStatus _parseTransactionStatus(dynamic value) {
    if (value is String) {
      return TransactionStatus.values.firstWhere(
        (e) => e.name == value.toLowerCase(),
        orElse: () => TransactionStatus.pending,
      );
    }
    return TransactionStatus.pending;
  }
}

// Enums
enum TransactionType {
  // Wallet transaction types
  credit,
  debit,
  transferIn,
  transferOut,
  refund,
  fee,
  bonus,
  cashback,
  reward,
  penalty,
  commission,
  earning,
  // Payment transaction types
  payment,
  payout,
  adjustment,
  chargeback,
}

enum TransactionSubtype {
  purchase,
  partialRefund,
  fullRefund,
  sellerPayout,
  platformFee,
  processingFee,
  disputeFee,
}

enum TransactionStatus {
  pending,
  processing,
  completed,
  failed,
  cancelled,
  disputed,
  refunded,
}

enum PaymentMethod {
  creditCard,
  debitCard,
  paypal,
  stripe,
  wallet,
  bankTransfer,
  cashOnDelivery,
}

// Supporting Models
class TransactionFees {
  final double platformFee;
  final double processingFee;
  final double? stripeFee;
  final double totalFees;

  TransactionFees({
    this.platformFee = 0.0,
    this.processingFee = 0.0,
    this.stripeFee,
    this.totalFees = 0.0,
  });

  factory TransactionFees.fromJson(Map<String, dynamic> json) {
    return TransactionFees(
      platformFee: (json['platformFee'] ?? json['platform_fee'] ?? 0).toDouble(),
      processingFee: (json['processingFee'] ?? json['processing_fee'] ?? 0).toDouble(),
      stripeFee: json['stripeFee'] != null
          ? (json['stripeFee'] as num).toDouble()
          : json['stripe_fee'] != null
              ? (json['stripe_fee'] as num).toDouble()
              : null,
      totalFees: (json['totalFees'] ?? json['total_fees'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() => {
    'platformFee': platformFee,
    'processingFee': processingFee,
    if (stripeFee != null) 'stripeFee': stripeFee,
    'totalFees': totalFees,
  };
}

class PaymentProvider {
  final String name;
  final String? transactionId;
  final String? paymentIntentId;
  final String? chargeId;
  final String? payoutId;
  final Map<String, dynamic>? metadata;

  PaymentProvider({
    required this.name,
    this.transactionId,
    this.paymentIntentId,
    this.chargeId,
    this.payoutId,
    this.metadata,
  });

  factory PaymentProvider.fromJson(Map<String, dynamic> json) {
    return PaymentProvider(
      name: json['name'] ?? '',
      transactionId: json['transactionId'] ?? json['transaction_id'],
      paymentIntentId: json['paymentIntentId'] ?? json['payment_intent_id'],
      chargeId: json['chargeId'] ?? json['charge_id'],
      payoutId: json['payoutId'] ?? json['payout_id'],
      metadata: json['metadata'],
    );
  }

  Map<String, dynamic> toJson() => {
    'name': name,
    if (transactionId != null) 'transactionId': transactionId,
    if (paymentIntentId != null) 'paymentIntentId': paymentIntentId,
    if (chargeId != null) 'chargeId': chargeId,
    if (payoutId != null) 'payoutId': payoutId,
    if (metadata != null) 'metadata': metadata,
  };
}

/// Coin Package Model
class CoinPackage {
  final String id;
  final String name;
  final int coins;
  final double price;
  final String? bonus; // e.g., "20% bonus"
  final bool isPopular;
  final String? description;
  final String? currency;
  final int? bonusCoins; // Additional bonus coins

  CoinPackage({
    required this.id,
    required this.name,
    required this.coins,
    required this.price,
    this.bonus,
    this.isPopular = false,
    this.description,
    this.currency = 'USD',
    this.bonusCoins,
  });

  factory CoinPackage.fromJson(Map<String, dynamic> json) {
    return CoinPackage(
      id: json['id'] ?? json['_id'] ?? '',
      name: json['name'] ?? '',
      coins: json['coins'] ?? 0,
      price: (json['price'] ?? 0).toDouble(),
      bonus: json['bonus'],
      isPopular: json['isPopular'] ?? json['is_popular'] ?? false,
      description: json['description'],
      currency: json['currency'] ?? 'USD',
      bonusCoins: json['bonusCoins'] ?? json['bonus_coins'],
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'coins': coins,
    'price': price,
    if (bonus != null) 'bonus': bonus,
    'isPopular': isPopular,
    if (description != null) 'description': description,
    'currency': currency,
    if (bonusCoins != null) 'bonusCoins': bonusCoins,
  };

  int get totalCoins => coins + (bonusCoins ?? 0);
  double get pricePerCoin => price / totalCoins;

  static List<CoinPackage> getDefaultPackages() {
    return [
      CoinPackage(
        id: 'package_100',
        name: 'Starter',
        coins: 100,
        price: 0.99,
      ),
      CoinPackage(
        id: 'package_500',
        name: 'Popular',
        coins: 500,
        price: 4.99,
        bonus: 'Best Value',
        isPopular: true,
      ),
      CoinPackage(
        id: 'package_1000',
        name: 'Pro',
        coins: 1000,
        price: 9.99,
        bonus: '20% Bonus',
        bonusCoins: 200,
      ),
      CoinPackage(
        id: 'package_5000',
        name: 'Mega',
        coins: 5000,
        price: 49.99,
        bonus: '30% Bonus',
        bonusCoins: 1500,
      ),
    ];
  }
}
