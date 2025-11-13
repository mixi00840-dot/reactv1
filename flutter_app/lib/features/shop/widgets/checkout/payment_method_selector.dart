import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../constants/shop_constants.dart';

/// Payment method selector with credit card, PayPal, and cash options
class PaymentMethodSelector extends StatelessWidget {
  final String? selectedMethod;
  final Function(String) onMethodSelected;

  const PaymentMethodSelector({
    Key? key,
    this.selectedMethod,
    required this.onMethodSelected,
  }) : super(key: key);

  static final List<Map<String, dynamic>> _paymentMethods = [
    {
      'id': 'credit_card',
      'name': 'Credit/Debit Card',
      'icon': Icons.credit_card,
      'description': 'Visa, Mastercard, Amex',
    },
    {
      'id': 'paypal',
      'name': 'PayPal',
      'icon': Icons.paypal,
      'description': 'Fast and secure',
    },
    {
      'id': 'cash',
      'name': 'Cash on Delivery',
      'icon': Icons.money,
      'description': 'Pay when you receive',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      children: List.generate(
        _paymentMethods.length,
        (index) => _buildPaymentMethodCard(
          context,
          _paymentMethods[index],
        ),
      ),
    );
  }

  Widget _buildPaymentMethodCard(
    BuildContext context,
    Map<String, dynamic> method,
  ) {
    final isSelected = selectedMethod == method['id'];
    
    return Padding(
      padding: const EdgeInsets.only(bottom: ShopConstants.defaultPadding),
      child: GestureDetector(
        onTap: () => onMethodSelected(method['id']),
        child: AnimatedContainer(
          duration: ShopConstants.animationDurationShort,
          padding: const EdgeInsets.all(ShopConstants.defaultPadding),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(
              ShopConstants.defaultBorderRadius,
            ),
            border: Border.all(
              color: isSelected ? AppColors.primary : AppColors.border,
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Row(
            children: [
              // Payment Method Icon
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: isSelected
                      ? AppColors.primary.withOpacity(0.1)
                      : AppColors.backgroundLight,
                  borderRadius: BorderRadius.circular(
                    ShopConstants.defaultBorderRadiusSmall,
                  ),
                ),
                child: Center(
                  child: Icon(
                    method['icon'] as IconData,
                    color: isSelected ? AppColors.primary : AppColors.textSecondary,
                    size: 24,
                  ),
                ),
              ),
              
              const SizedBox(width: ShopConstants.defaultPadding),
              
              // Payment Method Details
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      method['name'],
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: isSelected
                            ? AppColors.primary
                            : AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      method['description'],
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              
              // Selected Indicator
              if (isSelected)
                Icon(
                  Icons.check_circle,
                  color: AppColors.primary,
                  size: 24,
                ),
            ],
          ),
        ),
      ),
    );
  }
}
