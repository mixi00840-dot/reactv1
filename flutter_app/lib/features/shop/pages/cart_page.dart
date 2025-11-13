import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../constants/shop_constants.dart';
import '../widgets/cart/cart_item_card.dart';
import '../widgets/cart/cart_summary.dart';
import '../models/product_model.dart';
import '../providers/cart_state_provider.dart';

/// Shopping cart page with items list, summary, and checkout button
class CartPage extends ConsumerStatefulWidget {
  const CartPage({Key? key}) : super(key: key);

  @override
  ConsumerState<CartPage> createState() => _CartPageState();
}

class _CartPageState extends ConsumerState<CartPage> {

  void _removeItem(String cartItemId) async {
    final cartItems = ref.read(cartStateProvider).value;
    if (cartItems == null) return;

    // Find the item to remove for undo functionality
    final itemToRemove = cartItems.firstWhere((item) => item.id == cartItemId);
    
    // Remove the item
    await ref.read(cartStateProvider.notifier).removeItem(cartItemId);

    if (!mounted) return;

    // Show undo snackbar
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${itemToRemove.product.title} removed from cart'),
        backgroundColor: AppColors.surface,
        action: SnackBarAction(
          label: 'Undo',
          textColor: AppColors.primary,
          onPressed: () async {
            // Re-add the item
            await ref.read(cartStateProvider.notifier).addToCart(
              productId: itemToRemove.product.id,
              quantity: itemToRemove.quantity,
              size: itemToRemove.selectedSize,
              color: itemToRemove.selectedColor,
            );
          },
        ),
        duration: const Duration(seconds: 4),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _showClearCartDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear Cart'),
        content: const Text('Are you sure you want to remove all items from your cart?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              await ref.read(cartStateProvider.notifier).clearCart();
              if (!mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Cart cleared')),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
            ),
            child: const Text('Clear'),
          ),
        ],
      ),
    );
  }

  void _proceedToCheckout() {
    final cartItems = ref.read(cartStateProvider).value;
    if (cartItems == null || cartItems.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Your cart is empty')),
      );
      return;
    }

    Navigator.pushNamed(
      context,
      '/shop/checkout',
      arguments: {
        'subtotal': ref.read(cartSubtotalProvider),
        'shipping': ref.read(cartShippingProvider),
        'tax': ref.read(cartTaxProvider),
        'total': ref.read(cartTotalProvider),
        'cartItems': cartItems,
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final cartState = ref.watch(cartStateProvider);
    final itemCount = ref.watch(cartItemCountProvider);
    final subtotal = ref.watch(cartSubtotalProvider);
    final shipping = ref.watch(cartShippingProvider);
    final tax = ref.watch(cartTaxProvider);
    final total = ref.watch(cartTotalProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        title: const Text(
          'Shopping Cart',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        centerTitle: true,
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(
            Icons.arrow_back,
            color: AppColors.textPrimary,
          ),
        ),
        actions: [
          if (itemCount > 0)
            TextButton(
              onPressed: _showClearCartDialog,
              child: const Text(
                'Clear',
                style: TextStyle(
                  color: AppColors.error,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
        ],
      ),
      body: cartState.when(
        data: (cartItems) {
          if (cartItems.isEmpty) {
            return _buildEmptyCart();
          }
          return _buildCartContent(cartItems, subtotal, shipping, tax, total);
        },
        loading: () => _buildLoadingState(),
        error: (error, stack) => _buildErrorState(error.toString()),
      ),
    );
  }

  Widget _buildLoadingState() {
    return const Center(
      child: CircularProgressIndicator(),
    );
  }

  Widget _buildErrorState(String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(ShopConstants.defaultPaddingLarge),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 80,
              color: AppColors.textTertiary,
            ),
            const SizedBox(height: ShopConstants.defaultPaddingLarge),
            const Text(
              'Failed to load cart',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: ShopConstants.defaultPaddingSmall),
            Text(
              error,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: ShopConstants.defaultPaddingLarge),
            ElevatedButton.icon(
              onPressed: () {
                ref.read(cartStateProvider.notifier).loadCart();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 32,
                  vertical: 16,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(
                    ShopConstants.defaultBorderRadius,
                  ),
                ),
              ),
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyCart() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(ShopConstants.defaultPaddingLarge),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.shopping_cart_outlined,
              size: 120,
              color: AppColors.textTertiary,
            ),
            const SizedBox(height: ShopConstants.defaultPaddingLarge),
            const Text(
              'Your cart is empty',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: ShopConstants.defaultPaddingSmall),
            const Text(
              'Add items to get started',
              style: TextStyle(
                fontSize: 14,
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: ShopConstants.defaultPaddingLarge),
            ElevatedButton(
              onPressed: () {
                // Navigate to shop home
                Navigator.pop(context);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 32,
                  vertical: 16,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(
                    ShopConstants.defaultBorderRadius,
                  ),
                ),
              ),
              child: const Text(
                'Start Shopping',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCartContent(List<CartItem> cartItems, double subtotal, double shipping, double tax, double total) {
    return Column(
      children: [
        // Cart Items List
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(ShopConstants.defaultPadding),
            itemCount: cartItems.length,
            itemBuilder: (context, index) {
              final item = cartItems[index];
              return Padding(
                padding: const EdgeInsets.only(
                  bottom: ShopConstants.defaultPadding,
                ),
                child: CartItemCard(
                  imageUrl: item.product.images.isNotEmpty 
                      ? item.product.images.first 
                      : 'https://via.placeholder.com/80x80',
                  title: item.product.title,
                  variant: _buildVariantText(item),
                  price: item.product.price,
                  originalPrice: item.product.originalPrice,
                  quantity: item.quantity,
                  onQuantityChanged: (newQuantity) async {
                    await ref.read(cartStateProvider.notifier).updateQuantity(
                      item.id,
                      newQuantity,
                    );
                  },
                  onRemove: () {
                    _removeItem(item.id);
                  },
                  onTap: () {
                    Navigator.pushNamed(
                      context,
                      '/shop/product-details',
                      arguments: item.product.id,
                    );
                  },
                ),
              );
            },
          ),
        ),
        
        // Cart Summary and Checkout
        Container(
          decoration: BoxDecoration(
            color: AppColors.background,
            border: Border(
              top: BorderSide(
                color: AppColors.border,
                width: 1,
              ),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 10,
                offset: const Offset(0, -2),
              ),
            ],
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(ShopConstants.defaultPadding),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Cart Summary
                  CartSummary(
                    subtotal: subtotal,
                    shipping: shipping,
                    tax: tax,
                    total: total,
                  ),
                  
                  const SizedBox(height: ShopConstants.defaultPadding),
                  
                  // Checkout Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _proceedToCheckout,
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
                      child: const Text(
                        'Proceed to Checkout',
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
      ],
    );
  }

  String? _buildVariantText(CartItem item) {
    final parts = <String>[];
    if (item.selectedColor != null) {
      parts.add('Color: ${item.selectedColor}');
    }
    if (item.selectedSize != null) {
      parts.add('Size: ${item.selectedSize}');
    }
    return parts.isEmpty ? null : parts.join(', ');
  }
}
