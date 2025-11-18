import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/models/models.dart';
import '../../services/wallet_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/loading_indicator.dart';
import '../../../../core/widgets/error_widget.dart';
import '../widgets/transaction_item.dart';

/// Wallet transactions history page
class WalletTransactionsPage extends ConsumerStatefulWidget {
  const WalletTransactionsPage({super.key});

  @override
  ConsumerState<WalletTransactionsPage> createState() =>
      _WalletTransactionsPageState();
}

class _WalletTransactionsPageState extends ConsumerState<WalletTransactionsPage>
    with SingleTickerProviderStateMixin {
  final WalletService _walletService = WalletService();
  List<TransactionModel> _transactions = [];
  bool _isLoading = true;
  String? _error;
  int _currentPage = 1;
  bool _hasMore = true;
  String? _selectedType;
  double _balance = 0.0;

  late TabController _tabController;
  final List<String> _tabs = ['All', 'Income', 'Expense'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
    _tabController.addListener(_onTabChanged);
    _loadBalance();
    _loadTransactions();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _onTabChanged() {
    if (_tabController.indexIsChanging) return;
    setState(() {
      switch (_tabController.index) {
        case 0:
          _selectedType = null;
          break;
        case 1:
          _selectedType = 'income'; // topup, gift_received, earnings
          break;
        case 2:
          _selectedType =
              'expense'; // transfer, gift_sent, purchase, withdrawal
          break;
      }
      _transactions.clear();
      _currentPage = 1;
      _hasMore = true;
    });
    _loadTransactions();
  }

  Future<void> _loadBalance() async {
    try {
      final balance = await _walletService.getBalance();
      if (mounted) {
        setState(() {
          _balance = balance;
        });
      }
    } catch (e) {
      // Silent fail
    }
  }

  Future<void> _loadTransactions() async {
    if (!_hasMore || _isLoading) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final transactions = await _walletService.getTransactions(
        page: _currentPage,
        limit: 20,
        type: _selectedType,
      );

      setState(() {
        if (transactions.isEmpty) {
          _hasMore = false;
        } else {
          _transactions.addAll(transactions);
          _currentPage++;
        }
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _refreshTransactions() async {
    setState(() {
      _transactions.clear();
      _currentPage = 1;
      _hasMore = true;
    });
    await _loadBalance();
    await _loadTransactions();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Transactions'),
        backgroundColor: AppColors.surface,
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(100),
          child: Column(
            children: [
              // Balance display
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Text(
                      'Current Balance',
                      style: TextStyle(
                        fontSize: 14,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '\$${_balance.toStringAsFixed(2)}',
                      style: TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
              TabBar(
                controller: _tabController,
                indicatorColor: AppColors.primary,
                labelColor: AppColors.primary,
                unselectedLabelColor: AppColors.textSecondary,
                tabs: _tabs.map((tab) => Tab(text: tab)).toList(),
              ),
            ],
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {
              Navigator.pushNamed(context, '/wallet/search');
            },
          ),
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: _showFilterOptions,
          ),
        ],
      ),
      body: _buildBody(),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.pushNamed(context, '/wallet/topup').then((_) {
            _refreshTransactions();
          });
        },
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.add),
        label: const Text('Top Up'),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading && _transactions.isEmpty) {
      return const Center(child: LoadingIndicator());
    }

    if (_error != null && _transactions.isEmpty) {
      return Center(
        child: ErrorDisplay(
          message: _error!,
          onRetry: _loadTransactions,
        ),
      );
    }

    if (_transactions.isEmpty) {
      return _buildEmptyState();
    }

    return RefreshIndicator(
      onRefresh: _refreshTransactions,
      child: NotificationListener<ScrollNotification>(
        onNotification: (scrollInfo) {
          if (scrollInfo.metrics.pixels >=
              scrollInfo.metrics.maxScrollExtent * 0.8) {
            _loadTransactions();
          }
          return false;
        },
        child: ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: _transactions.length + (_hasMore ? 1 : 0),
          itemBuilder: (context, index) {
            if (index == _transactions.length) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.all(16.0),
                  child: LoadingIndicator(),
                ),
              );
            }

            final transaction = _transactions[index];
            return TransactionItem(
              transaction: transaction,
              onTap: () => _viewTransactionDetails(transaction),
            );
          },
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.receipt_long,
            size: 80,
            color: AppColors.textSecondary.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          Text(
            'No transactions yet',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Your transaction history will appear here',
            style: TextStyle(
              fontSize: 14,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.pushNamed(context, '/wallet/topup').then((_) {
                _refreshTransactions();
              });
            },
            icon: const Icon(Icons.add),
            label: const Text('Top Up Wallet'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            ),
          ),
        ],
      ),
    );
  }

  void _showFilterOptions() {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Padding(
              padding: EdgeInsets.all(16),
              child: Text(
                'Filter by Type',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ),
            ...TransactionType.values.map((type) {
              return ListTile(
                title: Text(type.name.toUpperCase()),
                onTap: () {
                  Navigator.pop(context);
                  setState(() {
                    _selectedType = type.name;
                    _transactions.clear();
                    _currentPage = 1;
                    _hasMore = true;
                  });
                  _loadTransactions();
                },
              );
            }).toList(),
            ListTile(
              title: const Text('Clear Filter'),
              leading: const Icon(Icons.clear),
              onTap: () {
                Navigator.pop(context);
                setState(() {
                  _selectedType = null;
                  _transactions.clear();
                  _currentPage = 1;
                  _hasMore = true;
                });
                _loadTransactions();
              },
            ),
          ],
        ),
      ),
    );
  }

  void _viewTransactionDetails(TransactionModel transaction) {
    Navigator.pushNamed(
      context,
      '/wallet/transactions/${transaction.id}',
      arguments: transaction,
    );
  }
}
