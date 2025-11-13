import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../constants/shop_constants.dart';

/// Order success confirmation page with order details and tracking option
class OrderSuccessPage extends StatelessWidget {
  final String orderNumber;
  final double total;
  final String estimatedDelivery;

  const OrderSuccessPage({
    Key? key,
    required this.orderNumber,
    required this.total,
    this.estimatedDelivery = '3-5 business days',
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Content
            Expanded(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(ShopConstants.defaultPaddingLarge),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Success Icon
                      Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          color: AppColors.success.withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Icon(
                            Icons.check_circle,
                            size: 80,
                            color: AppColors.success,
                          ),
                        ),
                      ),
                      
                      const SizedBox(height: ShopConstants.defaultPaddingLarge),
                      
                      // Success Title
                      const Text(
                        'Order Placed Successfully!',
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      
                      const SizedBox(height: ShopConstants.defaultPaddingSmall),
                      
                      // Success Message
                      const Text(
                        'Thank you for your purchase.\nYou will receive a confirmation email shortly.',
                        style: TextStyle(
                          fontSize: 14,
                          color: AppColors.textSecondary,
                          height: 1.5,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      
                      const SizedBox(height: ShopConstants.defaultPaddingLarge),
                      
                      // Order Details Card
                      Container(
                        padding: const EdgeInsets.all(ShopConstants.defaultPaddingLarge),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(
                            ShopConstants.defaultBorderRadius,
                          ),
                          border: Border.all(
                            color: AppColors.border,
                            width: 1,
                          ),
                        ),
                        child: Column(
                          children: [
                            // Order Number
                            _buildDetailRow(
                              icon: Icons.receipt_long,
                              label: 'Order Number',
                              value: orderNumber,
                              isHighlighted: true,
                            ),
                            
                            const SizedBox(height: ShopConstants.defaultPadding),
                            
                            Divider(
                              color: AppColors.border,
                              height: 1,
                            ),
                            
                            const SizedBox(height: ShopConstants.defaultPadding),
                            
                            // Total Amount
                            _buildDetailRow(
                              icon: Icons.attach_money,
                              label: 'Total Amount',
                              value: '\$${total.toStringAsFixed(2)}',
                            ),
                            
                            const SizedBox(height: ShopConstants.defaultPadding),
                            
                            // Estimated Delivery
                            _buildDetailRow(
                              icon: Icons.local_shipping,
                              label: 'Estimated Delivery',
                              value: estimatedDelivery,
                            ),
                          ],
                        ),
                      ),
                      
                      const SizedBox(height: ShopConstants.defaultPaddingLarge),
                      
                      // Track Order Button
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () {
                            // Navigate to order tracking
                            Navigator.pop(context);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(
                                ShopConstants.defaultBorderRadius,
                              ),
                            ),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.location_on,
                                size: 20,
                              ),
                              const SizedBox(width: 8),
                              const Text(
                                'Track Order',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      
                      const SizedBox(height: ShopConstants.defaultPadding),
                      
                      // View Orders Button
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton(
                          onPressed: () {
                            // Navigate to orders page
                            Navigator.pop(context);
                          },
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.primary,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            side: BorderSide(
                              color: AppColors.primary,
                              width: 2,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(
                                ShopConstants.defaultBorderRadius,
                              ),
                            ),
                          ),
                          child: const Text(
                            'View All Orders',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            
            // Continue Shopping Button
            Padding(
              padding: const EdgeInsets.all(ShopConstants.defaultPadding),
              child: TextButton(
                onPressed: () {
                  // Navigate back to shop home
                  Navigator.popUntil(context, (route) => route.isFirst);
                },
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.shopping_bag_outlined,
                      size: 20,
                      color: AppColors.textSecondary,
                    ),
                    const SizedBox(width: 8),
                    const Text(
                      'Continue Shopping',
                      style: TextStyle(
                        fontSize: 14,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow({
    required IconData icon,
    required String label,
    required String value,
    bool isHighlighted = false,
  }) {
    return Row(
      children: [
        // Icon
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: isHighlighted
                ? AppColors.primary.withOpacity(0.1)
                : AppColors.backgroundLight,
            borderRadius: BorderRadius.circular(
              ShopConstants.defaultBorderRadiusSmall,
            ),
          ),
          child: Center(
            child: Icon(
              icon,
              size: 20,
              color: isHighlighted ? AppColors.primary : AppColors.textSecondary,
            ),
          ),
        ),
        
        const SizedBox(width: ShopConstants.defaultPadding),
        
        // Label and Value
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textTertiary,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: isHighlighted ? AppColors.primary : AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
