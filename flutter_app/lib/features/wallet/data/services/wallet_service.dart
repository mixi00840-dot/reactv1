import '../../../../core/services/api_service.dart';
import '../models/wallet.dart';

class WalletService {
  final ApiService _apiService = ApiService();

  /// Get wallet balance
  Future<Wallet?> getWallet() async {
    try {
      final response = await _apiService.get('/wallet');

      if (response['success'] == true && response['wallet'] != null) {
        return Wallet.fromJson(response['wallet']);
      }

      return null;
    } catch (e) {
      print('Error fetching wallet: $e');
      return null;
    }
  }

  /// Get balance only
  Future<double> getBalance() async {
    try {
      final response = await _apiService.get('/wallet/balance');

      if (response['success'] == true && response['balance'] != null) {
        return (response['balance']).toDouble();
      }

      return 0.0;
    } catch (e) {
      print('Error fetching balance: $e');
      return 0.0;
    }
  }

  /// Get transaction history
  Future<List<Transaction>> getTransactions({
    int page = 1,
    int limit = 20,
    String? type,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
        if (type != null) 'type': type,
      };

      final response = await _apiService.get(
        '/wallet/transactions',
        queryParameters: queryParams,
      );

      if (response['success'] == true && response['transactions'] != null) {
        return (response['transactions'] as List)
            .map((json) => Transaction.fromJson(json))
            .toList();
      }

      return [];
    } catch (e) {
      print('Error fetching transactions: $e');
      return [];
    }
  }

  /// Top up wallet
  Future<Map<String, dynamic>?> topUp({
    required double amount,
    required String paymentMethodId,
  }) async {
    try {
      final response = await _apiService.post(
        '/wallet/topup',
        data: {
          'amount': amount,
          'paymentMethodId': paymentMethodId,
        },
      );

      if (response['success'] == true) {
        return response;
      }

      return null;
    } catch (e) {
      print('Error topping up wallet: $e');
      return null;
    }
  }

  /// Transfer money to another user
  Future<bool> transfer({
    required String toUserId,
    required double amount,
    String? description,
  }) async {
    try {
      final response = await _apiService.post(
        '/wallet/transfer',
        data: {
          'toUserId': toUserId,
          'amount': amount,
          if (description != null) 'description': description,
        },
      );

      return response['success'] == true;
    } catch (e) {
      print('Error transferring funds: $e');
      return false;
    }
  }

  /// Buy coins
  Future<Map<String, dynamic>?> buyCoins({
    required int coins,
    required String paymentMethodId,
  }) async {
    try {
      final response = await _apiService.post(
        '/wallet/coins/buy',
        data: {
          'coins': coins,
          'paymentMethodId': paymentMethodId,
        },
      );

      if (response['success'] == true) {
        return response;
      }

      return null;
    } catch (e) {
      print('Error buying coins: $e');
      return null;
    }
  }
}
