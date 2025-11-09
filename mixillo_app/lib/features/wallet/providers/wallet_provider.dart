import 'package:flutter/material.dart';
import '../../../core/services/api_helper.dart';
import '../models/wallet_model.dart';

class WalletProvider extends ChangeNotifier {
  final ApiHelper _api = ApiHelper();
  
  WalletModel? _wallet;
  List<TransactionModel> _transactions = [];
  bool _isLoading = false;
  bool _isLoadingTransactions = false;
  String? _error;
  
  WalletModel? get wallet => _wallet;
  List<TransactionModel> get transactions => _transactions;
  bool get isLoading => _isLoading;
  bool get isLoadingTransactions => _isLoadingTransactions;
  String? get error => _error;
  
  /// Load wallet balance
  Future<void> loadWallet() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final response = await _api.dio.get('/wallet/balance');
      final data = response.data['data'];
      _wallet = WalletModel.fromJson(data);
      _error = null;
    } catch (e) {
      _error = e.toString();
      print('Error loading wallet: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  /// Load transaction history
  Future<void> loadTransactions({bool refresh = false}) async {
    if (_isLoadingTransactions && !refresh) return;
    
    _isLoadingTransactions = true;
    _error = null;
    notifyListeners();
    
    try {
      if (refresh) {
        _transactions = [];
      }
      
      final response = await _api.dio.get('/wallet/transactions', 
        queryParameters: {'limit': 50}
      );
      final transactionsData = response.data['data'] ?? [];
      final List<TransactionModel> newTransactions = transactionsData
          .map((json) => TransactionModel.fromJson(json))
          .toList();
      
      if (refresh) {
        _transactions = newTransactions;
      } else {
        _transactions.addAll(newTransactions);
      }
      
      _error = null;
    } catch (e) {
      _error = e.toString();
      print('Error loading transactions: $e');
    } finally {
      _isLoadingTransactions = false;
      notifyListeners();
    }
  }
  
  /// Purchase coins
  Future<Map<String, dynamic>?> purchaseCoins({
    required String packageId,
    required double amount,
    required String paymentMethod,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      // Generate idempotency key to prevent duplicate charges
      final idempotencyKey = 'purchase_${DateTime.now().millisecondsSinceEpoch}';
      
      final response = await _api.dio.post('/wallet/purchase', data: {
        'packageId': packageId,
        'amount': amount,
        'paymentMethod': paymentMethod,
        'idempotencyKey': idempotencyKey,
      });
      final result = response.data['data'] ?? {};
      
      // Update wallet balance
      if (result['newBalance'] != null) {
        _wallet = WalletModel(
          id: _wallet?.id ?? 'temp_${DateTime.now().millisecondsSinceEpoch}',
          userId: _wallet?.userId ?? 'current_user',
          coins: result['newBalance'].toDouble(),
          balance: result['newBalance'].toDouble(),
          currency: _wallet?.currency ?? 'USD',
          lastUpdated: DateTime.now(),
          createdAt: _wallet?.createdAt ?? DateTime.now(),
        );
      }
      
      // Reload transactions to show new purchase
      await loadTransactions(refresh: true);
      
      _error = null;
      notifyListeners();
      return result;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      print('Error purchasing coins: $e');
      return null;
    }
  }
  
  /// Refresh wallet data
  Future<void> refresh() async {
    await Future.wait([
      loadWallet(),
      loadTransactions(refresh: true),
    ]);
  }
}

