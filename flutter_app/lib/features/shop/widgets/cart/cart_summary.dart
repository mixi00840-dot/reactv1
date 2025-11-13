import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../constants/shop_constants.dart';

/// Cart summary showing subtotal, shipping, tax, and total
class CartSummary extends StatelessWidget {
  final double subtotal;
  final double shipping;
  final double tax;
  final double total;
  final bool showDetails;

  const CartSummary({
    Key? key,
    required this.subtotal,
    required this.shipping,
    required this.tax,
    required this.total,
    this.showDetails = true,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(ShopConstants.defaultPadding),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(ShopConstants.defaultBorderRadius),
        border: Border.all(
          color: AppColors.border,
          width: 1,
        ),
      ),
      child: Column(
        children: [
          // Subtotal
          _buildSummaryRow(
            label: 'Subtotal',
            value: subtotal,
            isTotal: false,
          ),
          
          if (showDetails) ...[
            const SizedBox(height: ShopConstants.defaultPaddingSmall),
            
            // Shipping
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Text(
                      'Shipping',
                      style: TextStyle(
                        fontSize: 14,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    if (shipping == 0) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.success.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'FREE',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: AppColors.success,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                Text(
                  shipping == 0 ? '\$0.00' : '\$${shipping.toStringAsFixed(2)}',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: shipping == 0 ? AppColors.success : AppColors.textPrimary,
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: ShopConstants.defaultPaddingSmall),
            
            // Tax
            _buildSummaryRow(
              label: 'Tax (8%)',
              value: tax,
              isTotal: false,
            ),
            
            const SizedBox(height: ShopConstants.defaultPadding),
            
            // Divider
            Divider(
              color: AppColors.border,
              height: 1,
            ),
            
            const SizedBox(height: ShopConstants.defaultPadding),
          ],
          
          // Total
          _buildSummaryRow(
            label: 'Total',
            value: total,
            isTotal: true,
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryRow({
    required String label,
    required double value,
    required bool isTotal,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: isTotal ? 18 : 14,
            fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
            color: isTotal ? AppColors.textPrimary : AppColors.textSecondary,
          ),
        ),
        Text(
          '\$${value.toStringAsFixed(2)}',
          style: TextStyle(
            fontSize: isTotal ? 24 : 14,
            fontWeight: isTotal ? FontWeight.bold : FontWeight.w600,
            color: isTotal ? AppColors.primary : AppColors.textPrimary,
          ),
        ),
      ],
    );
  }
}
