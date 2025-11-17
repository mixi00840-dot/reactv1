import 'package:flutter/material.dart';
import '../../data/models/withdrawal_model.dart';
import '../../data/services/wallet_service.dart';

class WithdrawalPage extends StatefulWidget {
  const WithdrawalPage({super.key});

  @override
  State<WithdrawalPage> createState() => _WithdrawalPageState();
}

class _WithdrawalPageState extends State<WithdrawalPage> {
  final WalletService _walletService = WalletService();
  final _formKey = GlobalKey<FormState>();

  final _amountController = TextEditingController();
  String _withdrawalMethod = 'bank';
  bool _isProcessing = false;

  double _availableBalance = 0.0;
  double _minimumWithdrawal = 10.0;
  double _processingFee = 0.0;

  final Map<String, String> _withdrawalMethods = {
    'bank': 'Bank Transfer',
    'paypal': 'PayPal',
    'stripe': 'Stripe',
  };

  @override
  void initState() {
    super.initState();
    _loadBalance();
  }

  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }

  Future<void> _loadBalance() async {
    try {
      final wallet = await _walletService.getWallet();
      setState(() {
        _availableBalance = wallet.balance;
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load balance: $e')),
      );
    }
  }

  void _calculateFee(String amount) {
    if (amount.isEmpty) {
      setState(() {
        _processingFee = 0.0;
      });
      return;
    }

    final value = double.tryParse(amount) ?? 0.0;
    setState(() {
      // 2.5% processing fee
      _processingFee = value * 0.025;
    });
  }

  Future<void> _processWithdrawal() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isProcessing = true;
    });

    try {
      final amount = double.parse(_amountController.text);

      await _walletService.withdrawal({
        'amount': amount,
        'method': _withdrawalMethod,
        'fee': _processingFee,
      });

      if (!mounted) return;

      Navigator.of(context).pop();

      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Withdrawal Requested'),
          content: Text(
            'Your withdrawal request of \$${amount.toStringAsFixed(2)} has been submitted. '
            'Processing typically takes 3-5 business days.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('OK'),
            ),
          ],
        ),
      );
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Withdrawal failed: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isProcessing = false;
        });
      }
    }
  }

  String? _validateAmount(String? value) {
    if (value == null || value.isEmpty) {
      return 'Please enter an amount';
    }

    final amount = double.tryParse(value);
    if (amount == null) {
      return 'Please enter a valid number';
    }

    if (amount < _minimumWithdrawal) {
      return 'Minimum withdrawal is \$${_minimumWithdrawal.toStringAsFixed(2)}';
    }

    if (amount > _availableBalance) {
      return 'Insufficient balance';
    }

    return null;
  }

  @override
  Widget build(BuildContext context) {
    final netAmount =
        (double.tryParse(_amountController.text) ?? 0.0) - _processingFee;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Withdraw Earnings'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Balance card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.green.shade400, Colors.green.shade700],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Available Balance',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '\$${_availableBalance.toStringAsFixed(2)}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 36,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Minimum withdrawal: \$${_minimumWithdrawal.toStringAsFixed(2)}',
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Amount input
              TextFormField(
                controller: _amountController,
                decoration: InputDecoration(
                  labelText: 'Withdrawal Amount',
                  hintText: 'Enter amount',
                  prefixText: '\$',
                  border: const OutlineInputBorder(),
                  suffixIcon: IconButton(
                    icon: const Icon(Icons.clear),
                    onPressed: () {
                      _amountController.clear();
                      _calculateFee('');
                    },
                  ),
                ),
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                validator: _validateAmount,
                onChanged: _calculateFee,
              ),
              const SizedBox(height: 16),

              // Quick amount buttons
              const Text(
                'Quick Select',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: [25.0, 50.0, 100.0, 200.0].map((amount) {
                  return ChoiceChip(
                    label: Text('\$$amount'),
                    selected: _amountController.text == amount.toString(),
                    onSelected: amount <= _availableBalance
                        ? (selected) {
                            if (selected) {
                              _amountController.text = amount.toString();
                              _calculateFee(amount.toString());
                            }
                          }
                        : null,
                  );
                }).toList(),
              ),
              const SizedBox(height: 24),

              // Withdrawal method
              const Text(
                'Withdrawal Method',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              ..._withdrawalMethods.entries.map((entry) {
                return _buildMethodOption(entry.key, entry.value);
              }),
              const SizedBox(height: 24),

              // Fee breakdown
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.shade300),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Withdrawal Amount'),
                        Text(
                          '\$${_amountController.text.isEmpty ? '0.00' : double.parse(_amountController.text).toStringAsFixed(2)}',
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Processing Fee (2.5%)'),
                        Text(
                          '-\$${_processingFee.toStringAsFixed(2)}',
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            color: Colors.red,
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'You Will Receive',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                        Text(
                          '\$${netAmount > 0 ? netAmount.toStringAsFixed(2) : '0.00'}',
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.green,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Important information
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.info_outline, color: Colors.blue.shade700),
                        const SizedBox(width: 8),
                        const Text(
                          'Important Information',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      '• Processing time: 3-5 business days\n'
                      '• A 2.5% processing fee applies\n'
                      '• Ensure your payment details are up to date\n'
                      '• Withdrawals are non-reversible once processed\n'
                      '• You will receive an email confirmation',
                      style: TextStyle(fontSize: 12, height: 1.5),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Withdraw button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isProcessing ? null : _processWithdrawal,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _isProcessing
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text(
                          'Request Withdrawal',
                          style: TextStyle(fontSize: 16),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMethodOption(String value, String label) {
    final isSelected = _withdrawalMethod == value;
    IconData icon;

    switch (value) {
      case 'bank':
        icon = Icons.account_balance;
        break;
      case 'paypal':
        icon = Icons.paypal;
        break;
      case 'stripe':
        icon = Icons.credit_card;
        break;
      default:
        icon = Icons.payment;
    }

    return InkWell(
      onTap: () {
        setState(() {
          _withdrawalMethod = value;
        });
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          border: Border.all(
            color: isSelected ? Colors.green : Colors.grey.shade300,
            width: isSelected ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(8),
          color: isSelected ? Colors.green.shade50 : null,
        ),
        child: Row(
          children: [
            Icon(
              icon,
              color: isSelected ? Colors.green : Colors.grey,
            ),
            const SizedBox(width: 12),
            Text(
              label,
              style: TextStyle(
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                color: isSelected ? Colors.green : Colors.black,
              ),
            ),
            const Spacer(),
            if (isSelected)
              const Icon(
                Icons.check_circle,
                color: Colors.green,
              ),
          ],
        ),
      ),
    );
  }
}
