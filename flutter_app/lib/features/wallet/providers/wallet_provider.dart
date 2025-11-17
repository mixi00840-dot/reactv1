import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/wallet.dart';
import '../data/models/transaction.dart';
import '../data/services/wallet_service.dart';

// Wallet service provider
final walletServiceProvider = Provider<WalletService>((ref) {
  return WalletService();
});

// Wallet provider
final walletProvider =
    StateNotifierProvider<WalletNotifier, AsyncValue<Wallet>>((ref) {
  final service = ref.watch(walletServiceProvider);
  return WalletNotifier(service);
});

class WalletNotifier extends StateNotifier<AsyncValue<Wallet>> {
  final WalletService _service;

  WalletNotifier(this._service) : super(const AsyncValue.loading()) {
    loadWallet();
  }

  Future<void> loadWallet() async {
    state = const AsyncValue.loading();
    try {
      final wallet = await _service.getWallet();
      state = AsyncValue.data(wallet);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> topUp(double amount, String paymentMethod) async {
    try {
      await _service.topUp(amount, paymentMethod);
      await loadWallet();
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> transfer(String recipientId, double amount) async {
    try {
      await _service.transfer(recipientId, amount);
      await loadWallet();
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> withdrawal(double amount, String method, double fee) async {
    try {
      await _service.withdrawal({
        'amount': amount,
        'method': method,
        'fee': fee,
      });
      await loadWallet();
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> refresh() async {
    await loadWallet();
  }
}

// Transactions provider
final transactionsProvider =
    StateNotifierProvider<TransactionsNotifier, AsyncValue<List<Transaction>>>(
        (ref) {
  final service = ref.watch(walletServiceProvider);
  return TransactionsNotifier(service);
});

class TransactionsNotifier
    extends StateNotifier<AsyncValue<List<Transaction>>> {
  final WalletService _service;

  TransactionsNotifier(this._service) : super(const AsyncValue.loading()) {
    loadTransactions();
  }

  Future<void> loadTransactions(
      {String? type, DateTime? startDate, DateTime? endDate}) async {
    state = const AsyncValue.loading();
    try {
      final transactions = await _service.getTransactions(
        type: type,
        startDate: startDate,
        endDate: endDate,
      );
      state = AsyncValue.data(transactions);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> refresh() async {
    await loadTransactions();
  }
}

// Wallet balance provider
final walletBalanceProvider = Provider<double>((ref) {
  final walletState = ref.watch(walletProvider);
  return walletState.when(
    data: (wallet) => wallet.balance,
    loading: () => 0.0,
    error: (_, __) => 0.0,
  );
});

// Filtered transactions by type
final filteredTransactionsProvider =
    Provider.family<List<Transaction>, String?>((ref, type) {
  final transactionsState = ref.watch(transactionsProvider);
  return transactionsState.when(
    data: (transactions) {
      if (type == null || type == 'all') {
        return transactions;
      }
      return transactions.where((t) => t.type == type).toList();
    },
    loading: () => [],
    error: (_, __) => [],
  );
});
