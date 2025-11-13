import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class TransactionHistoryScreen extends StatefulWidget {
  const TransactionHistoryScreen({Key? key}) : super(key: key);

  @override
  State<TransactionHistoryScreen> createState() =>
      _TransactionHistoryScreenState();
}

class _TransactionHistoryScreenState extends State<TransactionHistoryScreen> {
  String selectedFilter = 'all';
  bool isLoading = false;

  // TODO: Replace with actual API call
  final List<Transaction> transactions = [
    Transaction(
      id: '1',
      type: 'received',
      amount: 50,
      description: 'Support from @johndoe',
      timestamp: DateTime.now().subtract(const Duration(hours: 2)),
      status: 'completed',
    ),
    Transaction(
      id: '2',
      type: 'earned',
      amount: 120,
      description: 'Video views earnings',
      timestamp: DateTime.now().subtract(const Duration(days: 1)),
      status: 'completed',
    ),
    Transaction(
      id: '3',
      type: 'sent',
      amount: 30,
      description: 'Support to @janedoe',
      timestamp: DateTime.now().subtract(const Duration(days: 2)),
      status: 'completed',
    ),
    Transaction(
      id: '4',
      type: 'topup',
      amount: 500,
      description: 'Wallet top-up',
      timestamp: DateTime.now().subtract(const Duration(days: 3)),
      status: 'completed',
    ),
    Transaction(
      id: '5',
      type: 'earned',
      amount: 85,
      description: 'Product sale',
      timestamp: DateTime.now().subtract(const Duration(days: 4)),
      status: 'completed',
    ),
    Transaction(
      id: '6',
      type: 'withdrawal',
      amount: 200,
      description: 'Withdrawal to bank',
      timestamp: DateTime.now().subtract(const Duration(days: 5)),
      status: 'pending',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final filteredTransactions = selectedFilter == 'all'
        ? transactions
        : transactions.where((t) => t.type == selectedFilter).toList();

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text('Transaction History'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: _showFilterBottomSheet,
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                _buildFilterChip('All', 'all'),
                const SizedBox(width: 8),
                _buildFilterChip('Received', 'received'),
                const SizedBox(width: 8),
                _buildFilterChip('Sent', 'sent'),
                const SizedBox(width: 8),
                _buildFilterChip('Earned', 'earned'),
                const SizedBox(width: 8),
                _buildFilterChip('Top-up', 'topup'),
                const SizedBox(width: 8),
                _buildFilterChip('Withdrawal', 'withdrawal'),
              ],
            ),
          ),

          // Transactions list
          Expanded(
            child: isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: Colors.blue),
                  )
                : filteredTransactions.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.receipt_long_outlined,
                              color: Colors.grey[600],
                              size: 64,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'No transactions yet',
                              style: TextStyle(
                                color: Colors.grey[400],
                                fontSize: 16,
                              ),
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _refreshTransactions,
                        color: Colors.blue,
                        backgroundColor: Colors.grey[900],
                        child: ListView.builder(
                          itemCount: filteredTransactions.length,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemBuilder: (context, index) {
                            return _buildTransactionItem(
                                filteredTransactions[index]);
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = selectedFilter == value;

    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        setState(() {
          selectedFilter = value;
        });
      },
      backgroundColor: Colors.grey[900],
      selectedColor: Colors.blue,
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : Colors.grey[400],
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
      ),
      checkmarkColor: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(
          color: isSelected ? Colors.blue : Colors.grey[800]!,
        ),
      ),
    );
  }

  Widget _buildTransactionItem(Transaction transaction) {
    final isPositive = transaction.type == 'received' ||
        transaction.type == 'earned' ||
        transaction.type == 'topup';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[900],
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          // Icon
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: _getTransactionColor(transaction.type).withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              _getTransactionIcon(transaction.type),
              color: _getTransactionColor(transaction.type),
              size: 24,
            ),
          ),

          const SizedBox(width: 16),

          // Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  transaction.description,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Text(
                      DateFormat('MMM d, y • h:mm a').format(transaction.timestamp),
                      style: TextStyle(
                        color: Colors.grey[500],
                        fontSize: 13,
                      ),
                    ),
                    if (transaction.status == 'pending') ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.orange.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          'Pending',
                          style: TextStyle(
                            color: Colors.orange,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),

          // Amount
          Text(
            '${isPositive ? '+' : '-'}${transaction.amount}',
            style: TextStyle(
              color: isPositive ? Colors.green : Colors.red,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  IconData _getTransactionIcon(String type) {
    switch (type) {
      case 'received':
        return Icons.call_received;
      case 'sent':
        return Icons.call_made;
      case 'earned':
        return Icons.monetization_on;
      case 'topup':
        return Icons.add_circle;
      case 'withdrawal':
        return Icons.account_balance;
      default:
        return Icons.swap_horiz;
    }
  }

  Color _getTransactionColor(String type) {
    switch (type) {
      case 'received':
      case 'earned':
      case 'topup':
        return Colors.green;
      case 'sent':
        return Colors.blue;
      case 'withdrawal':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  Future<void> _refreshTransactions() async {
    setState(() {
      isLoading = true;
    });

    // TODO: Implement API call to fetch transactions
    await Future.delayed(const Duration(seconds: 1));

    setState(() {
      isLoading = false;
    });
  }

  void _showFilterBottomSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.grey[900],
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Filter Transactions',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              _buildFilterOption('All Transactions', 'all'),
              _buildFilterOption('Received', 'received'),
              _buildFilterOption('Sent', 'sent'),
              _buildFilterOption('Earned', 'earned'),
              _buildFilterOption('Top-up', 'topup'),
              _buildFilterOption('Withdrawal', 'withdrawal'),
              const SizedBox(height: 20),
            ],
          ),
        );
      },
    );
  }

  Widget _buildFilterOption(String label, String value) {
    final isSelected = selectedFilter == value;

    return ListTile(
      title: Text(
        label,
        style: TextStyle(
          color: isSelected ? Colors.blue : Colors.white,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
      ),
      trailing: isSelected
          ? const Icon(Icons.check, color: Colors.blue)
          : null,
      onTap: () {
        setState(() {
          selectedFilter = value;
        });
        Navigator.pop(context);
      },
    );
  }
}

class Transaction {
  final String id;
  final String type;
  final double amount;
  final String description;
  final DateTime timestamp;
  final String status;

  Transaction({
    required this.id,
    required this.type,
    required this.amount,
    required this.description,
    required this.timestamp,
    required this.status,
  });
}
