import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/wallet_model.dart';
import '../providers/profile_providers.dart';

class WalletScreen extends ConsumerStatefulWidget {
  const WalletScreen({super.key});

  @override
  ConsumerState<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends ConsumerState<WalletScreen> {
  // Future filter functionality
  // TransactionType? _filterType;
  // TransactionStatus? _filterStatus;

  @override
  Widget build(BuildContext context) {
    final walletDataAsync = ref.watch(walletDataProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Wallet'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: _showFilterDialog,
          ),
        ],
      ),
      body: walletDataAsync.when(
        data: (walletData) => _buildWalletContent(walletData),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              Text('Error: $error'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.refresh(walletDataProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildWalletContent(WalletData walletData) {
    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(walletDataProvider);
      },
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildBalanceCard(walletData),
          const SizedBox(height: 16),
          _buildQuickActions(),
          const SizedBox(height: 24),
          _buildTransactionHeader(),
          const SizedBox(height: 8),
          _buildTransactionsList(walletData.recentTransactions),
        ],
      ),
    );
  }

  Widget _buildBalanceCard(WalletData walletData) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Theme.of(context).primaryColor,
            Theme.of(context).primaryColor.withOpacity(0.7),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Theme.of(context).primaryColor.withOpacity(0.3),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Total Balance',
            style: TextStyle(
              color: Colors.white70,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            walletData.formattedBalance,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 36,
              fontWeight: FontWeight.bold,
            ),
          ),
          if (walletData.pendingBalance > 0) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.pending, color: Colors.white, size: 16),
                  const SizedBox(width: 8),
                  Text(
                    'Pending: ${walletData.formattedPendingBalance}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    return Row(
      children: [
        Expanded(
          child: _buildActionButton(
            icon: Icons.add_circle,
            label: 'Add Coins',
            color: Colors.green,
            onTap: _showPurchaseCoinsDialog,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildActionButton(
            icon: Icons.remove_circle,
            label: 'Withdraw',
            color: Colors.blue,
            onTap: _showWithdrawDialog,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildActionButton(
            icon: Icons.receipt,
            label: 'Receipts',
            color: Colors.orange,
            onTap: () {
              // Show receipts
            },
          ),
        ),
      ],
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 8),
            Text(
              label,
              style: TextStyle(
                color: color,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTransactionHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          'Recent Transactions',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        TextButton(
          onPressed: () {
            // View all transactions
          },
          child: const Text('View All'),
        ),
      ],
    );
  }

  Widget _buildTransactionsList(List<Transaction> transactions) {
    if (transactions.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            children: [
              Icon(
                Icons.receipt_long,
                size: 64,
                color: Colors.grey.withOpacity(0.5),
              ),
              const SizedBox(height: 16),
              Text(
                'No transactions yet',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: Colors.grey,
                    ),
              ),
            ],
          ),
        ),
      );
    }

    return Column(
      children: transactions.map((tx) => _buildTransactionTile(tx)).toList(),
    );
  }

  Widget _buildTransactionTile(Transaction transaction) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: _buildTransactionIcon(transaction.type),
        title: Text(
          transaction.description ?? _getTransactionTypeLabel(transaction.type),
          style: const TextStyle(fontWeight: FontWeight.w500),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(_formatDate(transaction.createdAt)),
            if (!transaction.isCompleted)
              Chip(
                label: Text(
                  transaction.status.name.toUpperCase(),
                  style: const TextStyle(fontSize: 10),
                ),
                visualDensity: VisualDensity.compact,
                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
          ],
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              transaction.formattedAmount,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
                color: transaction.type == TransactionType.credit
                    ? Colors.green
                    : Colors.red,
              ),
            ),
            if (transaction.receiptUrl != null)
              const Icon(Icons.receipt, size: 16, color: Colors.grey),
          ],
        ),
        onTap: () => _showTransactionDetails(transaction),
      ),
    );
  }

  Widget _buildTransactionIcon(TransactionType type) {
    IconData icon;
    Color color;

    switch (type) {
      case TransactionType.credit:
        icon = Icons.arrow_downward;
        color = Colors.green;
        break;
      case TransactionType.debit:
        icon = Icons.arrow_upward;
        color = Colors.red;
        break;
      case TransactionType.purchase:
        icon = Icons.shopping_cart;
        color = Colors.orange;
        break;
      case TransactionType.withdrawal:
        icon = Icons.account_balance;
        color = Colors.blue;
        break;
      case TransactionType.refund:
        icon = Icons.refresh;
        color = Colors.teal;
        break;
      case TransactionType.coinPurchase:
        icon = Icons.monetization_on;
        color = Colors.amber;
        break;
      default:
        icon = Icons.swap_horiz;
        color = Colors.grey;
    }

    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        shape: BoxShape.circle,
      ),
      child: Icon(icon, color: color, size: 20),
    );
  }

  String _getTransactionTypeLabel(TransactionType type) {
    switch (type) {
      case TransactionType.credit:
        return 'Money Received';
      case TransactionType.debit:
        return 'Money Sent';
      case TransactionType.purchase:
        return 'Purchase';
      case TransactionType.withdrawal:
        return 'Withdrawal';
      case TransactionType.refund:
        return 'Refund';
      case TransactionType.coinPurchase:
        return 'Coin Purchase';
      default:
        return 'Transaction';
    }
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year} at ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
  }

  void _showPurchaseCoinsDialog() {
    final amountController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Purchase Coins'),
        content: TextField(
          controller: amountController,
          decoration: const InputDecoration(
            labelText: 'Amount',
            prefixText: '\$',
            border: OutlineInputBorder(),
          ),
          keyboardType: TextInputType.number,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final amount = double.tryParse(amountController.text);
              if (amount != null && amount > 0) {
                await ref.read(walletDataProvider.notifier).purchaseCoins(amount);
                if (mounted) Navigator.pop(context);
              }
            },
            child: const Text('Purchase'),
          ),
        ],
      ),
    );
  }

  void _showWithdrawDialog() {
    final amountController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Withdraw Funds'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: amountController,
              decoration: const InputDecoration(
                labelText: 'Amount',
                prefixText: '\$',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 16),
            const Text(
              'Withdrawals are processed within 3-5 business days',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final amount = double.tryParse(amountController.text);
              if (amount != null && amount > 0) {
                await ref.read(walletDataProvider.notifier).withdrawFunds(
                      amount,
                      {'method': 'bank_transfer'},
                    );
                if (mounted) Navigator.pop(context);
              }
            },
            child: const Text('Withdraw'),
          ),
        ],
      ),
    );
  }

  void _showTransactionDetails(Transaction transaction) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Transaction Details'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildDetailRow('Type', _getTransactionTypeLabel(transaction.type)),
            _buildDetailRow('Amount', transaction.formattedAmount),
            _buildDetailRow('Status', transaction.status.name.toUpperCase()),
            _buildDetailRow('Date', _formatDate(transaction.createdAt)),
            if (transaction.description != null)
              _buildDetailRow('Description', transaction.description!),
          ],
        ),
        actions: [
          if (transaction.receiptUrl != null)
            TextButton.icon(
              onPressed: () {
                // Download receipt
              },
              icon: const Icon(Icons.download),
              label: const Text('Download Receipt'),
            ),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            '$label:',
            style: const TextStyle(fontWeight: FontWeight.w500),
          ),
          Text(value),
        ],
      ),
    );
  }

  void _showFilterDialog() {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Filter Transactions',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            // Add filter options here
          ],
        ),
      ),
    );
  }
}
