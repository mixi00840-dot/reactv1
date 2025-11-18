import '../../../core/services/api_service.dart';
import '../../../core/models/models.dart';

/// Wallet Service - Digital wallet operations
/// Integrates with backend /api/wallets endpoints
class WalletService {
  final ApiService _apiService = ApiService();

  /// Get user's wallet (auto-creates if doesn't exist)
  Future<WalletModel> getWallet() async {
    try {
      final response = await _apiService.get('/wallets');
      return WalletModel.fromJson(response['data']['wallet']);
    } catch (e) {
      rethrow;
    }
  }

  /// Get wallet balance
  Future<double> getBalance() async {
    try {
      final wallet = await getWallet();
      return wallet.balance;
    } catch (e) {
      rethrow;
    }
  }

  /// Get wallet by user ID
  Future<WalletModel> getWalletByUserId(String userId) async {
    try {
      final response = await _apiService.get('/wallets/$userId/balance');
      return WalletModel.fromJson(response['data']['wallet']);
    } catch (e) {
      rethrow;
    }
  }

  /// Top up wallet
  Future<TransactionModel> topUp({
    required double amount,
    required String paymentMethodId,
    String? currency,
  }) async {
    try {
      final response = await _apiService.post('/wallets/top-up', data: {
        'amount': amount,
        'paymentMethodId': paymentMethodId,
        'currency': currency ?? 'USD',
      });
      return TransactionModel.fromJson(response['data']['transaction']);
    } catch (e) {
      rethrow;
    }
  }

  /// Transfer money to another user
  Future<TransactionModel> transfer({
    required String recipientId,
    required double amount,
    String? note,
  }) async {
    try {
      final response = await _apiService.post('/wallets/transfer', data: {
        'recipientId': recipientId,
        'amount': amount,
        if (note != null) 'note': note,
      });
      return TransactionModel.fromJson(response['data']['transaction']);
    } catch (e) {
      rethrow;
    }
  }

  /// Withdraw funds from wallet
  Future<TransactionModel> withdraw({
    required double amount,
    required String method,
    required Map<String, dynamic> accountDetails,
  }) async {
    try {
      final response = await _apiService.post('/wallets/withdraw', data: {
        'amount': amount,
        'method': method,
        'accountDetails': accountDetails,
      });
      return TransactionModel.fromJson(response['data']['transaction']);
    } catch (e) {
      rethrow;
    }
  }

  /// Get transaction history
  Future<List<TransactionModel>> getTransactions({
    String? userId,
    int page = 1,
    int limit = 20,
    String? type,
  }) async {
    try {
      final targetUserId = userId ?? await _getCurrentUserId();
      final response = await _apiService.get(
        '/wallets/$targetUserId/transactions',
        queryParameters: {
          'page': page,
          'limit': limit,
          if (type != null) 'type': type,
        },
      );
      return (response['data']['transactions'] as List)
          .map((json) => TransactionModel.fromJson(json))
          .toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Get single transaction details
  Future<TransactionModel> getTransaction(String transactionId) async {
    try {
      final response =
          await _apiService.get('/wallets/transactions/$transactionId');
      return TransactionModel.fromJson(response['data']['transaction']);
    } catch (e) {
      rethrow;
    }
  }

  /// Freeze wallet (admin only)
  Future<WalletModel> freezeWallet(String userId) async {
    try {
      final response = await _apiService.post('/wallets/$userId/freeze');
      return WalletModel.fromJson(response['data']['wallet']);
    } catch (e) {
      rethrow;
    }
  }

  /// Unfreeze wallet (admin only)
  Future<WalletModel> unfreezeWallet(String userId) async {
    try {
      final response = await _apiService.post('/wallets/$userId/unfreeze');
      return WalletModel.fromJson(response['data']['wallet']);
    } catch (e) {
      rethrow;
    }
  }

  /// Helper: Get current user ID
  Future<String> _getCurrentUserId() async {
    final response = await _apiService.get('/auth/me');
    return response['data']['user']['_id'];
  }
}
