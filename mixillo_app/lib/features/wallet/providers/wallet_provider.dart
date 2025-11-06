import 'package:flutter/material.dart';
import '../../../core/services/api_service.dart';
import '../models/wallet_model.dart';

class WalletProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  
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
      final data = await _apiService.getWalletBalance();
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
      
      final transactionsData = await _apiService.getTransactions(limit: 50);
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
      
      final result = await _apiService.purchaseCoins(
        packageId: packageId,
        amount: amount,
        paymentMethod: paymentMethod,
        idempotencyKey: idempotencyKey,
      );
      
      // Update wallet balance
      if (result['newBalance'] != null) {
        _wallet = WalletModel(
          coins: result['newBalance'].toDouble(),
          balance: result['newBalance'].toDouble(),
          currency: _wallet?.currency ?? 'USD',
          lastUpdated: DateTime.now(),
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

