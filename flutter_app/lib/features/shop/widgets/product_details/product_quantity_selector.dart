import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../constants/shop_constants.dart';

/// Quantity selector with +/- buttons and current quantity display
class ProductQuantitySelector extends StatelessWidget {
  final int quantity;
  final int minQuantity;
  final int maxQuantity;
  final Function(int) onQuantityChanged;

  const ProductQuantitySelector({
    Key? key,
    required this.quantity,
    this.minQuantity = 1,
    required this.maxQuantity,
    required this.onQuantityChanged,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        // Label
        const Text(
          'Quantity',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        
        // Quantity Controls
        Container(
          decoration: BoxDecoration(
            border: Border.all(
              color: AppColors.border,
              width: 1,
            ),
            borderRadius: BorderRadius.circular(
              ShopConstants.defaultBorderRadiusSmall,
            ),
          ),
          child: Row(
            children: [
              // Decrease Button
              _buildButton(
                icon: Icons.remove,
                onPressed: quantity > minQuantity
                    ? () => onQuantityChanged(quantity - 1)
                    : null,
                enabled: quantity > minQuantity,
              ),
              
              // Quantity Display
              Container(
                width: 60,
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  border: Border(
                    left: BorderSide(
                      color: AppColors.border,
                      width: 1,
                    ),
                    right: BorderSide(
                      color: AppColors.border,
                      width: 1,
                    ),
                  ),
                ),
                child: Text(
                  quantity.toString(),
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              
              // Increase Button
              _buildButton(
                icon: Icons.add,
                onPressed: quantity < maxQuantity
                    ? () => onQuantityChanged(quantity + 1)
                    : null,
                enabled: quantity < maxQuantity,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildButton({
    required IconData icon,
    required VoidCallback? onPressed,
    required bool enabled,
  }) {
    return InkWell(
      onTap: onPressed,
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: enabled ? AppColors.primary.withOpacity(0.1) : Colors.transparent,
        ),
        child: Center(
          child: Icon(
            icon,
            size: 20,
            color: enabled ? AppColors.primary : AppColors.textTertiary,
          ),
        ),
      ),
    );
  }
}
