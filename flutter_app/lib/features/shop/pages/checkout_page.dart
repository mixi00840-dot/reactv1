import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../constants/shop_constants.dart';
import '../widgets/checkout/address_selector.dart';
import '../widgets/checkout/payment_method_selector.dart';
import '../widgets/cart/cart_summary.dart';
import '../models/product_model.dart';
import '../providers/order_provider.dart';
import '../providers/cart_state_provider.dart';

/// Checkout page with shipping address, payment method, and order summary
class CheckoutPage extends ConsumerStatefulWidget {
  final List<CartItem> cartItems;
  final double subtotal;
  final double shipping;
  final double tax;
  final double total;

  const CheckoutPage({
    Key? key,
    required this.cartItems,
    required this.subtotal,
    required this.shipping,
    required this.tax,
    required this.total,
  }) : super(key: key);

  @override
  ConsumerState<CheckoutPage> createState() => _CheckoutPageState();
}

class _CheckoutPageState extends ConsumerState<CheckoutPage> {
  String? _selectedAddressId;
  String? _selectedPaymentMethodId;
  final TextEditingController _notesController = TextEditingController();
  bool _isProcessing = false;

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Pre-load addresses and payment methods
    ref.watch(addressesProvider);
    ref.watch(paymentMethodsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        title: const Text(
          'Checkout',
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
      ),
      body: Column(
        children: [
          // Scrollable Content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(ShopConstants.defaultPadding),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Shipping Address Section
                  const Text(
                    'Shipping Address',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  
                  const SizedBox(height: ShopConstants.defaultPadding),
                  
                  AddressSelector(
                    selectedAddressId: _selectedAddressId,
                    onAddressSelected: (addressId) {
                      setState(() {
                        _selectedAddressId = addressId;
                      });
                    },
                  ),
                  
                  const SizedBox(height: ShopConstants.defaultPaddingLarge),
                  
                  // Payment Method Section
                  const Text(
                    'Payment Method',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  
                  const SizedBox(height: ShopConstants.defaultPadding),
                  
                  PaymentMethodSelector(
                    selectedMethod: _selectedPaymentMethodId,
                    onMethodSelected: (methodId) {
                      setState(() {
                        _selectedPaymentMethodId = methodId;
                      });
                    },
                  ),
                  
                  const SizedBox(height: ShopConstants.defaultPaddingLarge),
                  
                  // Order Notes Section
                  const Text(
                    'Order Notes (Optional)',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  
                  const SizedBox(height: ShopConstants.defaultPadding),
                  
                  TextField(
                    controller: _notesController,
                    maxLines: 3,
                    decoration: InputDecoration(
                      hintText: 'Add any special instructions for your order...',
                      hintStyle: const TextStyle(
                        color: AppColors.textTertiary,
                      ),
                      filled: true,
                      fillColor: AppColors.surface,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(
                          ShopConstants.defaultBorderRadius,
                        ),
                        borderSide: BorderSide(
                          color: AppColors.border,
                        ),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(
                          ShopConstants.defaultBorderRadius,
                        ),
                        borderSide: BorderSide(
                          color: AppColors.border,
                        ),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(
                          ShopConstants.defaultBorderRadius,
                        ),
                        borderSide: BorderSide(
                          color: AppColors.primary,
                          width: 2,
                        ),
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: ShopConstants.defaultPaddingLarge),
                  
                  // Order Summary Section
                  const Text(
                    'Order Summary',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  
                  const SizedBox(height: ShopConstants.defaultPadding),
                  
                  // Items Count
                  Container(
                    padding: const EdgeInsets.all(ShopConstants.defaultPadding),
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
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Total Items',
                          style: TextStyle(
                            fontSize: 14,
                            color: AppColors.textSecondary,
                          ),
                        ),
                        Text(
                          '${widget.cartItems.length} items',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: ShopConstants.defaultPadding),
                  
                  // Cart Summary
                  CartSummary(
                    subtotal: widget.subtotal,
                    shipping: widget.shipping,
                    tax: widget.tax,
                    total: widget.total,
                  ),
                  
                  const SizedBox(height: 100), // Space for bottom button
                ],
              ),
            ),
          ),
          
          // Place Order Button
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
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _canPlaceOrder() && !_isProcessing
                        ? _placeOrder
                        : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(
                          ShopConstants.defaultBorderRadius,
                        ),
                      ),
                      disabledBackgroundColor: AppColors.textTertiary,
                    ),
                    child: _isProcessing
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                Colors.white,
                              ),
                            ),
                          )
                        : Text(
                            'Place Order - \$${widget.total.toStringAsFixed(2)}',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
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

  bool _canPlaceOrder() {
    return _selectedAddressId != null && _selectedPaymentMethodId != null;
  }

  void _placeOrder() async {
    if (!_canPlaceOrder()) return;
    
    setState(() {
      _isProcessing = true;
    });
    
    try {
      // Create order via API
      final order = await ref.read(ordersProvider.notifier).createOrder(
        addressId: _selectedAddressId!,
        paymentMethodId: _selectedPaymentMethodId!,
        notes: _notesController.text.trim(),
      );
      
      // Clear cart after successful order
      await ref.read(cartStateProvider.notifier).clearCart();
      
      if (!mounted) return;
      
      // Show success message
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              Icon(
                Icons.check_circle,
                color: AppColors.success,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Order ${order.orderNumber} placed successfully!',
                ),
              ),
            ],
          ),
          backgroundColor: AppColors.surface,
          duration: const Duration(seconds: 3),
          behavior: SnackBarBehavior.floating,
        ),
      );
      
      // Navigate back to shop or orders page
      Navigator.of(context).popUntil((route) => route.isFirst);
      
      // Optionally navigate to orders page
      // Navigator.pushReplacementNamed(context, '/shop/orders');
      
    } catch (e) {
      if (!mounted) return;
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              Icon(
                Icons.error_outline,
                color: AppColors.error,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Failed to place order: ${e.toString()}',
                ),
              ),
            ],
          ),
          backgroundColor: AppColors.surface,
          duration: const Duration(seconds: 4),
          behavior: SnackBarBehavior.floating,
          action: SnackBarAction(
            label: 'Retry',
            textColor: AppColors.primary,
            onPressed: _placeOrder,
          ),
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
}
