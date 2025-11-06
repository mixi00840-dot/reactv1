import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../services/cart_service.dart';
import 'order_confirmation_screen.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _formKey = GlobalKey<FormState>();
  
  // Address fields
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();
  final _zipController = TextEditingController();
  
  String _selectedPaymentMethod = 'credit_card';
  bool _saveAddress = true;
  bool _isProcessing = false;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _zipController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cartService = Provider.of<CartService>(context);

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      appBar: AppBar(
        title: const Text('Checkout'),
        backgroundColor: isDark ? AppColors.darkCard : AppColors.lightCard,
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Shipping Address Section
                    _SectionHeader(
                      title: 'Shipping Address',
                      isDark: isDark,
                    ),
                    const SizedBox(height: 16),

                    _CustomTextField(
                      controller: _nameController,
                      label: 'Full Name',
                      hint: 'John Doe',
                      icon: Icons.person_outline,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter your name';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 12),

                    _CustomTextField(
                      controller: _phoneController,
                      label: 'Phone Number',
                      hint: '+1 234 567 8900',
                      icon: Icons.phone_outlined,
                      keyboardType: TextInputType.phone,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter your phone number';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 12),

                    _CustomTextField(
                      controller: _addressController,
                      label: 'Street Address',
                      hint: '123 Main Street',
                      icon: Icons.location_on_outlined,
                      maxLines: 2,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter your address';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 12),

                    Row(
                      children: [
                        Expanded(
                          child: _CustomTextField(
                            controller: _cityController,
                            label: 'City',
                            hint: 'New York',
                            icon: Icons.location_city_outlined,
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Required';
                              }
                              return null;
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _CustomTextField(
                            controller: _stateController,
                            label: 'State',
                            hint: 'NY',
                            icon: Icons.map_outlined,
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Required';
                              }
                              return null;
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    _CustomTextField(
                      controller: _zipController,
                      label: 'ZIP Code',
                      hint: '10001',
                      icon: Icons.pin_drop_outlined,
                      keyboardType: TextInputType.number,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter ZIP code';
                        }
                        return null;
                      },
                    ),

                    const SizedBox(height: 12),

                    // Save Address Checkbox
                    CheckboxListTile(
                      value: _saveAddress,
                      onChanged: (value) {
                        setState(() {
                          _saveAddress = value ?? true;
                        });
                      },
                      title: Text(
                        'Save this address for future orders',
                        style: TextStyle(
                          color: isDark ? Colors.white : Colors.black,
                        ),
                      ),
                      controlAffinity: ListTileControlAffinity.leading,
                      activeColor: AppColors.primary,
                      contentPadding: EdgeInsets.zero,
                    ),

                    const SizedBox(height: 24),

                    // Payment Method Section
                    _SectionHeader(
                      title: 'Payment Method',
                      isDark: isDark,
                    ),
                    const SizedBox(height: 16),

                    _PaymentMethodTile(
                      value: 'credit_card',
                      groupValue: _selectedPaymentMethod,
                      title: 'Credit/Debit Card',
                      icon: Icons.credit_card,
                      isDark: isDark,
                      onChanged: (value) {
                        setState(() {
                          _selectedPaymentMethod = value!;
                        });
                      },
                    ),
                    const SizedBox(height: 12),

                    _PaymentMethodTile(
                      value: 'paypal',
                      groupValue: _selectedPaymentMethod,
                      title: 'PayPal',
                      icon: Icons.account_balance_wallet,
                      isDark: isDark,
                      onChanged: (value) {
                        setState(() {
                          _selectedPaymentMethod = value!;
                        });
                      },
                    ),
                    const SizedBox(height: 12),

                    _PaymentMethodTile(
                      value: 'cash_on_delivery',
                      groupValue: _selectedPaymentMethod,
                      title: 'Cash on Delivery',
                      icon: Icons.money,
                      isDark: isDark,
                      onChanged: (value) {
                        setState(() {
                          _selectedPaymentMethod = value!;
                        });
                      },
                    ),

                    const SizedBox(height: 24),

                    // Order Summary Section
                    _SectionHeader(
                      title: 'Order Summary',
                      isDark: isDark,
                    ),
                    const SizedBox(height: 16),

                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.darkCard : AppColors.lightCard,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isDark ? Colors.white10 : Colors.black12,
                        ),
                      ),
                      child: Column(
                        children: [
                          _SummaryRow(
                            label: 'Items (${cartService.itemCount})',
                            value: '\$${cartService.subtotal.toStringAsFixed(2)}',
                            isDark: isDark,
                          ),
                          const SizedBox(height: 8),
                          _SummaryRow(
                            label: 'Shipping',
                            value: cartService.shipping == 0
                                ? 'FREE'
                                : '\$${cartService.shipping.toStringAsFixed(2)}',
                            isDark: isDark,
                            valueColor: cartService.shipping == 0
                                ? AppColors.success
                                : null,
                          ),
                          const SizedBox(height: 8),
                          _SummaryRow(
                            label: 'Tax',
                            value: '\$${cartService.tax.toStringAsFixed(2)}',
                            isDark: isDark,
                          ),
                          const Divider(height: 24),
                          _SummaryRow(
                            label: 'Total',
                            value: '\$${cartService.total.toStringAsFixed(2)}',
                            isDark: isDark,
                            isTotal: true,
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 100),
                  ],
                ),
              ),
            ),
          ),

          // Place Order Button
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkCard : AppColors.lightCard,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 10,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: SafeArea(
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isProcessing ? null : _placeOrder,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: _isProcessing
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : Text(
                          'Place Order - \$${cartService.total.toStringAsFixed(2)}',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _placeOrder() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isProcessing = true;
    });

    // Simulate order processing
    await Future.delayed(const Duration(seconds: 2));

    if (!mounted) return;

    final cartService = Provider.of<CartService>(context, listen: false);

    // Create order data (for future API integration)
    // final shippingAddress = {
    //   'name': _nameController.text,
    //   'phone': _phoneController.text,
    //   'address': _addressController.text,
    //   'city': _cityController.text,
    //   'state': _stateController.text,
    //   'zip': _zipController.text,
    // };

    // In a real app, send this to the backend
    // final orderId = await apiService.createOrder(shippingAddress, ...)
    
    final orderId = 'ORD-${DateTime.now().millisecondsSinceEpoch}';
    final trackingNumber = 'TRK-${DateTime.now().millisecondsSinceEpoch.toString().substring(5)}';

    // Clear cart
    cartService.clear();

    setState(() {
      _isProcessing = false;
    });

    // Navigate to confirmation
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (context) => OrderConfirmationScreen(
          orderId: orderId,
          trackingNumber: trackingNumber,
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final bool isDark;

  const _SectionHeader({
    required this.title,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.bold,
        color: isDark ? Colors.white : Colors.black,
      ),
    );
  }
}

class _CustomTextField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final String hint;
  final IconData icon;
  final TextInputType? keyboardType;
  final int maxLines;
  final String? Function(String?)? validator;

  const _CustomTextField({
    required this.controller,
    required this.label,
    required this.hint,
    required this.icon,
    this.keyboardType,
    this.maxLines = 1,
    this.validator,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      validator: validator,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        prefixIcon: Icon(icon),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(
            color: Theme.of(context).brightness == Brightness.dark
                ? Colors.white10
                : Colors.black12,
          ),
        ),
      ),
    );
  }
}

class _PaymentMethodTile extends StatelessWidget {
  final String value;
  final String groupValue;
  final String title;
  final IconData icon;
  final bool isDark;
  final ValueChanged<String?> onChanged;

  const _PaymentMethodTile({
    required this.value,
    required this.groupValue,
    required this.title,
    required this.icon,
    required this.isDark,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final isSelected = value == groupValue;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : AppColors.lightCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isSelected
              ? AppColors.primary
              : (isDark ? Colors.white10 : Colors.black12),
          width: isSelected ? 2 : 1,
        ),
      ),
      child: RadioListTile<String>(
        value: value,
        groupValue: groupValue,
        onChanged: onChanged,
        title: Text(
          title,
          style: TextStyle(
            color: isDark ? Colors.white : Colors.black,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
        secondary: Icon(
          icon,
          color: isSelected ? AppColors.primary : null,
        ),
        activeColor: AppColors.primary,
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isDark;
  final bool isTotal;
  final Color? valueColor;

  const _SummaryRow({
    required this.label,
    required this.value,
    required this.isDark,
    this.isTotal = false,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: isTotal ? 18 : 14,
            fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
            color: isDark ? Colors.white : Colors.black,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: isTotal ? 20 : 14,
            fontWeight: isTotal ? FontWeight.bold : FontWeight.w600,
            color: valueColor ??
                (isTotal
                    ? AppColors.primary
                    : (isDark ? Colors.white : Colors.black)),
          ),
        ),
      ],
    );
  }
}
