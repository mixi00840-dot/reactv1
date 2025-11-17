import '../services/api_service.dart';
import '../models/models.dart';

/// Coin Service - Virtual currency system
/// Integrates with backend /api/coins endpoints
class CoinService {
  final ApiService _apiService = ApiService();

  /// Get all coin packages
  Future<List<CoinPackageModel>> getPackages() async {
    try {
      final response = await _apiService.get('/coins/packages');
      return (response['data']['packages'] as List)
          .map((json) => CoinPackageModel.fromJson(json))
          .toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Get package by ID
  Future<CoinPackageModel> getPackage(String packageId) async {
    try {
      final response = await _apiService.get('/coins/packages/$packageId');
      return CoinPackageModel.fromJson(response['data']['package']);
    } catch (e) {
      rethrow;
    }
  }

  /// Purchase coin package
  Future<TransactionModel> purchasePackage({
    required String packageId,
    required String paymentMethodId,
  }) async {
    try {
      final response = await _apiService.post('/coins/purchase', data: {
        'packageId': packageId,
        'paymentMethodId': paymentMethodId,
      });
      return TransactionModel.fromJson(response['data']['transaction']);
    } catch (e) {
      rethrow;
    }
  }

  /// Get user's coin balance
  Future<int> getBalance() async {
    try {
      final response = await _apiService.get('/coins/balance');
      return response['data']['balance'] ?? 0;
    } catch (e) {
      rethrow;
    }
  }

  /// Get coin transaction history
  Future<List<TransactionModel>> getTransactions({
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.get(
        '/coins/transactions',
        queryParameters: {
          'page': page,
          'limit': limit,
        },
      );
      return (response['data']['transactions'] as List)
          .map((json) => TransactionModel.fromJson(json))
          .toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Convert coins to cash (withdrawal)
  Future<TransactionModel> convertToMoney({
    required int coins,
    required String accountDetails,
  }) async {
    try {
      final response = await _apiService.post('/coins/convert', data: {
        'coins': coins,
        'accountDetails': accountDetails,
      });
      return TransactionModel.fromJson(response['data']['transaction']);
    } catch (e) {
      rethrow;
    }
  }

  /// Get conversion rate (coins to USD)
  Future<double> getConversionRate() async {
    try {
      final response = await _apiService.get('/coins/conversion-rate');
      return (response['data']['rate'] ?? 0.01).toDouble();
    } catch (e) {
      rethrow;
    }
  }

  /// Get coin earning history
  Future<List<Map<String, dynamic>>> getEarningHistory({
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.get(
        '/coins/earnings',
        queryParameters: {
          'page': page,
          'limit': limit,
        },
      );
      return List<Map<String, dynamic>>.from(
          response['data']['earnings'] ?? []);
    } catch (e) {
      rethrow;
    }
  }

  /// Get featured/promoted packages
  Future<List<CoinPackageModel>> getFeaturedPackages() async {
    try {
      final response = await _apiService.get('/coins/packages/featured');
      return (response['data']['packages'] as List)
          .map((json) => CoinPackageModel.fromJson(json))
          .toList();
    } catch (e) {
      rethrow;
    }
  }
}
