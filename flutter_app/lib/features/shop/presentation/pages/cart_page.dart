import 'package:flutter/material.dart';
import 'package:iconsax/iconsax.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/app_gradients.dart';
import '../../../../core/widgets/glass_widgets.dart';
import '../../providers/cart_provider.dart';

/// Shopping cart page
class CartPage extends StatefulWidget {
  final CartProvider cartProvider;
  
  const CartPage({super.key, required this.cartProvider});

  @override
  State<CartPage> createState() => _CartPageState();
}

class _CartPageState extends State<CartPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Shopping Cart'),
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: widget.cartProvider.items.isEmpty
          ? _buildEmptyCart()
          : Column(
              children: [
                Expanded(child: _buildCartItems()),
                _buildCheckoutSection(),
              ],
            ),
    );
  }

  Widget _buildEmptyCart() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Iconsax.shopping_cart, size: 100, color: AppColors.textTertiary),
          const SizedBox(height: AppSpacing.lg),
          Text(
            'Your cart is empty',
            style: AppTypography.titleMedium.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.xl,
                vertical: AppSpacing.md,
              ),
              decoration: BoxDecoration(
                gradient: AppGradients.accent,
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
              child: Text(
                'Start Shopping',
                style: AppTypography.labelLarge.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCartItems() {
    return ListView.builder(
      padding: const EdgeInsets.all(AppSpacing.md),
      itemCount: widget.cartProvider.items.length,
      itemBuilder: (context, index) {
        final item = widget.cartProvider.items[index];
        return _buildCartItem(item);
      },
    );
  }

  Widget _buildCartItem(item) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      child: GlassContainer(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Row(
            children: [
              // Product image
              ClipRRect(
                borderRadius: BorderRadius.circular(AppRadius.md),
                child: CachedNetworkImage(
                  imageUrl: item.product.images.first,
                  width: 80,
                  height: 80,
                  fit: BoxFit.cover,
                ),
              ),
              
              const SizedBox(width: AppSpacing.md),
              
              // Product info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.product.name,
                      style: AppTypography.bodyMedium.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      '\$${item.product.price.toStringAsFixed(2)}',
                      style: AppTypography.titleSmall.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              
              // Quantity controls
              Column(
                children: [
                  Row(
                    children: [
                      GestureDetector(
                        onTap: () {
                          setState(() {
                            widget.cartProvider.updateQuantity(item.id, item.quantity - 1);
                          });
                        },
                        child: Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: AppColors.glassLight,
                            borderRadius: BorderRadius.circular(AppRadius.sm),
                          ),
                          child: const Icon(Icons.remove, size: 16, color: AppColors.textPrimary),
                        ),
                      ),
                      
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
                        child: Text(
                          '${item.quantity}',
                          style: AppTypography.titleSmall.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      
                      GestureDetector(
                        onTap: () {
                          setState(() {
                            widget.cartProvider.updateQuantity(item.id, item.quantity + 1);
                          });
                        },
                        child: Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            gradient: AppGradients.accent,
                            borderRadius: BorderRadius.circular(AppRadius.sm),
                          ),
                          child: const Icon(Icons.add, size: 16, color: AppColors.textPrimary),
                        ),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: AppSpacing.xs),
                  
                  GestureDetector(
                    onTap: () {
                      setState(() {
                        widget.cartProvider.removeFromCart(item.id);
                      });
                    },
                    child: const Icon(Iconsax.trash, size: 20, color: AppColors.error),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCheckoutSection() {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: const BoxDecoration(
        color: AppColors.backgroundLight,
        border: Border(
          top: BorderSide(color: AppColors.glassLight),
        ),
      ),
      child: Column(
        children: [
          _buildPriceRow('Subtotal', widget.cartProvider.subtotal),
          const SizedBox(height: AppSpacing.sm),
          _buildPriceRow('Shipping', widget.cartProvider.shipping),
          const SizedBox(height: AppSpacing.sm),
          _buildPriceRow('Tax', widget.cartProvider.tax),
          const Divider(color: AppColors.glassLight, height: AppSpacing.lg),
          _buildPriceRow('Total', widget.cartProvider.total, isTotal: true),
          const SizedBox(height: AppSpacing.md),
          SizedBox(
            width: double.infinity,
            child: GestureDetector(
              onTap: () {
                // TODO: Navigate to checkout
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Proceeding to checkout...'),
                    backgroundColor: AppColors.successGreen,
                  ),
                );
              },
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
                decoration: BoxDecoration(
                  gradient: AppGradients.accent,
                  borderRadius: BorderRadius.circular(AppRadius.md),
                ),
                child: Text(
                  'Proceed to Checkout',
                  textAlign: TextAlign.center,
                  style: AppTypography.labelLarge.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPriceRow(String label, double amount, {bool isTotal = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: (isTotal ? AppTypography.titleMedium : AppTypography.bodyMedium).copyWith(
            fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
          ),
        ),
        Text(
          '\$${amount.toStringAsFixed(2)}',
          style: (isTotal ? AppTypography.titleMedium : AppTypography.bodyMedium).copyWith(
            color: isTotal ? AppColors.primary : AppColors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }
}
