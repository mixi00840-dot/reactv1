import 'package:flutter/material.dart';
import '../../data/models/payment_method_model.dart';
import '../../data/services/payment_service.dart';

class PaymentMethodsPage extends StatefulWidget {
  const PaymentMethodsPage({super.key});

  @override
  State<PaymentMethodsPage> createState() => _PaymentMethodsPageState();
}

class _PaymentMethodsPageState extends State<PaymentMethodsPage> {
  final PaymentService _paymentService = PaymentService();
  List<PaymentMethodModel> _paymentMethods = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadPaymentMethods();
  }

  Future<void> _loadPaymentMethods() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final methods = await _paymentService.getPaymentMethods();
      setState(() {
        _paymentMethods = methods;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _setDefault(String methodId) async {
    try {
      await _paymentService.setDefaultPaymentMethod(methodId);
      _loadPaymentMethods();

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Default payment method updated'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to update: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _deletePaymentMethod(String methodId) async {
    try {
      await _paymentService.deletePaymentMethod(methodId);
      _loadPaymentMethods();

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Payment method deleted'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to delete: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _showDeleteConfirmation(String methodId) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Payment Method'),
        content: const Text(
          'Are you sure you want to delete this payment method?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              _deletePaymentMethod(methodId);
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  void _addPaymentMethod() async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => const _AddPaymentMethodDialog(),
    );

    if (result == true) {
      _loadPaymentMethods();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Payment Methods'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline,
                          size: 48, color: Colors.red),
                      const SizedBox(height: 16),
                      Text(_error!),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadPaymentMethods,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : _paymentMethods.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.credit_card_off,
                            size: 64,
                            color: Colors.grey.shade400,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'No payment methods added',
                            style: TextStyle(
                              color: Colors.grey.shade600,
                              fontSize: 16,
                            ),
                          ),
                          const SizedBox(height: 24),
                          ElevatedButton.icon(
                            onPressed: _addPaymentMethod,
                            icon: const Icon(Icons.add),
                            label: const Text('Add Payment Method'),
                          ),
                        ],
                      ),
                    )
                  : ListView(
                      padding: const EdgeInsets.all(16),
                      children: [
                        ..._paymentMethods
                            .map((method) => _buildPaymentCard(method)),
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.blue.shade50,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.security, color: Colors.blue.shade700),
                              const SizedBox(width: 12),
                              const Expanded(
                                child: Text(
                                  'Your payment information is encrypted and secure',
                                  style: TextStyle(fontSize: 12),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
      floatingActionButton: _paymentMethods.isNotEmpty
          ? FloatingActionButton(
              onPressed: _addPaymentMethod,
              child: const Icon(Icons.add),
            )
          : null,
    );
  }

  Widget _buildPaymentCard(PaymentMethodModel method) {
    IconData cardIcon;
    Color cardColor;

    switch (method.brand.toLowerCase()) {
      case 'visa':
        cardIcon = Icons.credit_card;
        cardColor = Colors.blue;
        break;
      case 'mastercard':
        cardIcon = Icons.credit_card;
        cardColor = Colors.orange;
        break;
      case 'amex':
        cardIcon = Icons.credit_card;
        cardColor = Colors.teal;
        break;
      default:
        cardIcon = Icons.credit_card;
        cardColor = Colors.grey;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: cardColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(cardIcon, color: cardColor),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            method.brand.toUpperCase(),
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          const SizedBox(width: 8),
                          if (method.isDefault)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.blue.shade50,
                                borderRadius: BorderRadius.circular(4),
                                border: Border.all(color: Colors.blue),
                              ),
                              child: const Text(
                                'Default',
                                style: TextStyle(
                                  color: Colors.blue,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '**** **** **** ${method.last4}',
                        style: TextStyle(
                          color: Colors.grey.shade700,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Text(
                  'Expires: ${method.expiryMonth.toString().padLeft(2, '0')}/${method.expiryYear}',
                  style: TextStyle(
                    color: Colors.grey.shade600,
                    fontSize: 12,
                  ),
                ),
                const Spacer(),
                if (!method.isDefault)
                  TextButton(
                    onPressed: () => _setDefault(method.id),
                    child: const Text('Set as Default'),
                  ),
                IconButton(
                  onPressed: () => _showDeleteConfirmation(method.id),
                  icon: const Icon(Icons.delete),
                  color: Colors.red,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _AddPaymentMethodDialog extends StatefulWidget {
  const _AddPaymentMethodDialog();

  @override
  State<_AddPaymentMethodDialog> createState() =>
      _AddPaymentMethodDialogState();
}

class _AddPaymentMethodDialogState extends State<_AddPaymentMethodDialog> {
  final _formKey = GlobalKey<FormState>();
  final PaymentService _paymentService = PaymentService();

  final _cardNumberController = TextEditingController();
  final _cardHolderController = TextEditingController();
  final _expiryController = TextEditingController();
  final _cvvController = TextEditingController();

  bool _isDefault = false;
  bool _isSaving = false;

  @override
  void dispose() {
    _cardNumberController.dispose();
    _cardHolderController.dispose();
    _expiryController.dispose();
    _cvvController.dispose();
    super.dispose();
  }

  String? _validateCardNumber(String? value) {
    if (value == null || value.isEmpty) return 'Required';
    final cleaned = value.replaceAll(' ', '');
    if (cleaned.length != 16) return 'Invalid card number';
    if (!RegExp(r'^\d+$').hasMatch(cleaned)) return 'Numbers only';
    return null;
  }

  String? _validateExpiry(String? value) {
    if (value == null || value.isEmpty) return 'Required';
    if (!RegExp(r'^\d{2}/\d{2}$').hasMatch(value)) return 'Format: MM/YY';
    final parts = value.split('/');
    final month = int.tryParse(parts[0]);
    if (month == null || month < 1 || month > 12) return 'Invalid month';
    return null;
  }

  String? _validateCVV(String? value) {
    if (value == null || value.isEmpty) return 'Required';
    if (value.length < 3 || value.length > 4) return 'Invalid CVV';
    if (!RegExp(r'^\d+$').hasMatch(value)) return 'Numbers only';
    return null;
  }

  Future<void> _savePaymentMethod() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSaving = true;
    });

    try {
      final expiry = _expiryController.text.split('/');

      await _paymentService.addPaymentMethod({
        'cardNumber': _cardNumberController.text.replaceAll(' ', ''),
        'cardHolder': _cardHolderController.text,
        'expiryMonth': int.parse(expiry[0]),
        'expiryYear': int.parse('20${expiry[1]}'),
        'cvv': _cvvController.text,
        'isDefault': _isDefault,
      });

      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to add payment method: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Add Payment Method',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 20),
                TextFormField(
                  controller: _cardNumberController,
                  decoration: const InputDecoration(
                    labelText: 'Card Number',
                    hintText: '1234 5678 9012 3456',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.credit_card),
                  ),
                  keyboardType: TextInputType.number,
                  maxLength: 19,
                  validator: _validateCardNumber,
                  onChanged: (value) {
                    // Auto-format card number with spaces
                    final text = value.replaceAll(' ', '');
                    if (text.length <= 16) {
                      final buffer = StringBuffer();
                      for (int i = 0; i < text.length; i++) {
                        buffer.write(text[i]);
                        if ((i + 1) % 4 == 0 && i + 1 != text.length) {
                          buffer.write(' ');
                        }
                      }
                      final newValue = buffer.toString();
                      _cardNumberController.value = TextEditingValue(
                        text: newValue,
                        selection: TextSelection.collapsed(
                          offset: newValue.length,
                        ),
                      );
                    }
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _cardHolderController,
                  decoration: const InputDecoration(
                    labelText: 'Cardholder Name',
                    hintText: 'JOHN DOE',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.person),
                  ),
                  textCapitalization: TextCapitalization.characters,
                  validator: (value) =>
                      value?.isEmpty ?? true ? 'Required' : null,
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _expiryController,
                        decoration: const InputDecoration(
                          labelText: 'Expiry Date',
                          hintText: 'MM/YY',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.calendar_today),
                        ),
                        keyboardType: TextInputType.number,
                        maxLength: 5,
                        validator: _validateExpiry,
                        onChanged: (value) {
                          // Auto-format expiry date
                          if (value.length == 2 && !value.contains('/')) {
                            _expiryController.text = '$value/';
                            _expiryController.selection =
                                TextSelection.fromPosition(
                              TextPosition(
                                  offset: _expiryController.text.length),
                            );
                          }
                        },
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: TextFormField(
                        controller: _cvvController,
                        decoration: const InputDecoration(
                          labelText: 'CVV',
                          hintText: '123',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.lock),
                        ),
                        keyboardType: TextInputType.number,
                        maxLength: 4,
                        obscureText: true,
                        validator: _validateCVV,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                CheckboxListTile(
                  value: _isDefault,
                  onChanged: (value) {
                    setState(() {
                      _isDefault = value ?? false;
                    });
                  },
                  title: const Text('Set as default payment method'),
                  controlAffinity: ListTileControlAffinity.leading,
                  contentPadding: EdgeInsets.zero,
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.security,
                          size: 20, color: Colors.blue.shade700),
                      const SizedBox(width: 8),
                      const Expanded(
                        child: Text(
                          'Your payment information is encrypted and secure',
                          style: TextStyle(fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed:
                          _isSaving ? null : () => Navigator.of(context).pop(),
                      child: const Text('Cancel'),
                    ),
                    const SizedBox(width: 12),
                    ElevatedButton(
                      onPressed: _isSaving ? null : _savePaymentMethod,
                      child: _isSaving
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Save'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
