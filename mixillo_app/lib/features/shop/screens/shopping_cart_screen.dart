import 'package:flutter/material.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/common_widgets.dart';

/// Shopping Cart Screen
class ShoppingCartScreen extends StatefulWidget {
  const ShoppingCartScreen({Key? key}) : super(key: key);

  @override
  State<ShoppingCartScreen> createState() => _ShoppingCartScreenState();
}

class _ShoppingCartScreenState extends State<ShoppingCartScreen> {
  // Mock cart items
  final List<Map<String, dynamic>> _cartItems = [
    {
      'id': '1',
      'name': 'Wireless Headphones Pro',
      'price': 89.99,
      'originalPrice': 129.99,
      'quantity': 1,
      'selectedSize': 'One Size',
      'selectedColor': 'Black',
      'store': 'TechStore',
      'inStock': true,
    },
    {
      'id': '2',
      'name': 'Smart Watch Pro',
      'price': 199.99,
      'quantity': 1,
      'selectedSize': 'M',
      'selectedColor': 'Silver',
      'store': 'WearablesTech',
      'inStock': true,
    },
    {
      'id': '3',
      'name': 'Designer Backpack',
      'price': 49.99,
      'originalPrice': 79.99,
      'quantity': 2,
      'selectedSize': 'L',
      'selectedColor': 'Navy Blue',
      'store': 'FashionHub',
      'inStock': false,
    },
  ];

  double get _subtotal {
    return _cartItems.fold(0.0, (sum, item) => sum + (item['price'] * item['quantity']));
  }

  double get _discount {
    double total = 0.0;
    for (var item in _cartItems) {
      if (item['originalPrice'] != null) {
        total += (item['originalPrice'] - item['price']) * item['quantity'];
      }
    }
    return total;
  }

  double get _shipping => _subtotal > 50 ? 0.0 : 5.99;

  double get _total => _subtotal + _shipping;

  void _updateQuantity(int index, int delta) {
    setState(() {
      final newQuantity = _cartItems[index]['quantity'] + delta;
      if (newQuantity > 0 && newQuantity <= 99) {
        _cartItems[index]['quantity'] = newQuantity;
      }
    });
  }

  void _removeItem(int index) {
    setState(() {
      _cartItems.removeAt(index);
    });
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Item removed from cart'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? DesignTokens.darkBackground : DesignTokens.lightBackground,
      appBar: AppBar(
        backgroundColor: isDark ? DesignTokens.darkBackground : DesignTokens.lightBackground,
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: DesignTokens.space2,
                vertical: DesignTokens.space1,
              ),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: DesignTokens.brandGradient),
                borderRadius: BorderRadius.circular(DesignTokens.radiusSm),
              ),
              child: const Icon(
                Icons.shopping_cart,
                color: DesignTokens.darkTextPrimary,
                size: 20,
              ),
            ),
            const SizedBox(width: DesignTokens.space2),
            Text(
              'Shopping Cart',
              style: AppTypography.h2(context).copyWith(
                fontWeight: DesignTokens.fontWeightBold,
              ),
            ),
          ],
        ),
        actions: [
          if (_cartItems.isNotEmpty)
            TextButton(
              onPressed: () {
                setState(() {
                  _cartItems.clear();
                });
              },
              child: Text(
                'Clear All',
                style: AppTypography.link(context).copyWith(
                  color: DesignTokens.errorDefault,
                ),
              ),
            ),
          const SizedBox(width: DesignTokens.space2),
        ],
      ),
      body: _cartItems.isEmpty ? _buildEmptyCart(isDark) : _buildCartContent(isDark),
      bottomNavigationBar: _cartItems.isEmpty ? null : _buildBottomBar(isDark),
    );
  }

  Widget _buildEmptyCart(bool isDark) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(DesignTokens.space6),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: DesignTokens.brandGradient),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.shopping_cart_outlined,
                size: 60,
                color: DesignTokens.darkTextPrimary,
              ),
            ),
            const SizedBox(height: DesignTokens.space4),
            Text(
              'Your cart is empty',
              style: AppTypography.h2(context).copyWith(
                fontWeight: DesignTokens.fontWeightBold,
              ),
            ),
            const SizedBox(height: DesignTokens.space2),
            Text(
              'Add items to get started',
              style: AppTypography.bodyLarge(context).copyWith(
                color: isDark ? DesignTokens.darkTextSecondary : DesignTokens.lightTextSecondary,
              ),
            ),
            const SizedBox(height: DesignTokens.space6),
            PrimaryButton(
              text: 'Start Shopping',
              width: 200,
              onPressed: () => Navigator.pop(context),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCartContent(bool isDark) {
    return CustomScrollView(
      slivers: [
        // Free Shipping Banner
        if (_subtotal < 50)
          SliverToBoxAdapter(
            child: Container(
              margin: const EdgeInsets.all(DesignTokens.space4),
              padding: const EdgeInsets.all(DesignTokens.space3),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: DesignTokens.brandGradient),
                borderRadius: BorderRadius.circular(DesignTokens.radiusCard),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.local_shipping,
                    color: DesignTokens.darkTextPrimary,
                  ),
                  const SizedBox(width: DesignTokens.space3),
                  Expanded(
                    child: Text(
                      'Add \$${(50 - _subtotal).toStringAsFixed(2)} more to get FREE shipping!',
                      style: AppTypography.bodyMedium(context).copyWith(
                        color: DesignTokens.darkTextPrimary,
                        fontWeight: DesignTokens.fontWeightSemiBold,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

        // Cart Items
        SliverPadding(
          padding: const EdgeInsets.all(DesignTokens.space4),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                return _buildCartItem(_cartItems[index], index, isDark);
              },
              childCount: _cartItems.length,
            ),
          ),
        ),

        // Summary Card
        SliverToBoxAdapter(child: _buildSummaryCard(isDark)),
        
        const SliverToBoxAdapter(child: SizedBox(height: 100)),
      ],
    );
  }

  Widget _buildCartItem(Map<String, dynamic> item, int index, bool isDark) {
    final hasDiscount = item['originalPrice'] != null;
    final isInStock = item['inStock'] ?? true;

    return Container(
      margin: const EdgeInsets.only(bottom: DesignTokens.space3),
      padding: const EdgeInsets.all(DesignTokens.space3),
      decoration: BoxDecoration(
        color: isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface,
        borderRadius: BorderRadius.circular(DesignTokens.radiusCard),
        border: Border.all(
          color: !isInStock
              ? DesignTokens.errorDefault
              : (isDark ? DesignTokens.darkBorder : DesignTokens.lightBorder),
        ),
      ),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Product Image
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  color: isDark ? DesignTokens.darkBackground : DesignTokens.lightBackground,
                  borderRadius: BorderRadius.circular(DesignTokens.radiusSm),
                ),
                child: Center(
                  child: Icon(
                    Icons.shopping_bag_outlined,
                    size: 40,
                    color: (isDark ? DesignTokens.darkTextPrimary : DesignTokens.lightTextPrimary)
                        .withOpacity(0.3),
                  ),
                ),
              ),
              const SizedBox(width: DesignTokens.space3),
              
              // Product Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item['name'],
                      style: AppTypography.titleSmall(context).copyWith(
                        fontWeight: DesignTokens.fontWeightSemiBold,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: DesignTokens.space1),
                    Text(
                      item['store'],
                      style: AppTypography.labelSmall(context).copyWith(
                        color: isDark ? DesignTokens.darkTextSecondary : DesignTokens.lightTextSecondary,
                      ),
                    ),
                    const SizedBox(height: DesignTokens.space2),
                    
                    // Variants
                    Wrap(
                      spacing: DesignTokens.space2,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: DesignTokens.space2,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: (isDark ? DesignTokens.darkBackground : DesignTokens.lightBackground),
                            borderRadius: BorderRadius.circular(DesignTokens.radiusSm),
                          ),
                          child: Text(
                            item['selectedSize'],
                            style: AppTypography.labelSmall(context),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: DesignTokens.space2,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: (isDark ? DesignTokens.darkBackground : DesignTokens.lightBackground),
                            borderRadius: BorderRadius.circular(DesignTokens.radiusSm),
                          ),
                          child: Text(
                            item['selectedColor'],
                            style: AppTypography.labelSmall(context),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: DesignTokens.space2),
                    
                    // Price
                    Row(
                      children: [
                        Text(
                          '\$${item['price']}',
                          style: AppTypography.titleMedium(context).copyWith(
                            fontWeight: DesignTokens.fontWeightBold,
                            color: DesignTokens.brandPrimary,
                          ),
                        ),
                        if (hasDiscount) ...[
                          const SizedBox(width: DesignTokens.space2),
                          Text(
                            '\$${item['originalPrice']}',
                            style: AppTypography.labelSmall(context).copyWith(
                              decoration: TextDecoration.lineThrough,
                              color: isDark ? DesignTokens.darkTextSecondary : DesignTokens.lightTextSecondary,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
              
              // Delete Button
              IconButton(
                icon: const Icon(
                  Icons.delete_outline,
                  color: DesignTokens.errorDefault,
                ),
                onPressed: () => _removeItem(index),
              ),
            ],
          ),
          
          const SizedBox(height: DesignTokens.space3),
          
          // Stock Status & Quantity
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Stock Status
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: DesignTokens.space2,
                  vertical: DesignTokens.space1,
                ),
                decoration: BoxDecoration(
                  color: isInStock
                      ? DesignTokens.successDefault.withOpacity(0.1)
                      : DesignTokens.errorDefault.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(DesignTokens.radiusSm),
                  border: Border.all(
                    color: isInStock ? DesignTokens.successDefault : DesignTokens.errorDefault,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      isInStock ? Icons.check_circle : Icons.error,
                      size: 14,
                      color: isInStock ? DesignTokens.successDefault : DesignTokens.errorDefault,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      isInStock ? 'In Stock' : 'Out of Stock',
                      style: AppTypography.labelSmall(context).copyWith(
                        color: isInStock ? DesignTokens.successDefault : DesignTokens.errorDefault,
                        fontWeight: DesignTokens.fontWeightSemiBold,
                      ),
                    ),
                  ],
                ),
              ),
              
              // Quantity Selector
              Row(
                children: [
                  _buildQuantityButton(
                    icon: Icons.remove,
                    onTap: () => _updateQuantity(index, -1),
                    isDark: isDark,
                  ),
                  Container(
                    width: 50,
                    height: 36,
                    margin: const EdgeInsets.symmetric(horizontal: DesignTokens.space2),
                    decoration: BoxDecoration(
                      color: isDark ? DesignTokens.darkBackground : DesignTokens.lightBackground,
                      borderRadius: BorderRadius.circular(DesignTokens.radiusSm),
                    ),
                    child: Center(
                      child: Text(
                        '${item['quantity']}',
                        style: AppTypography.titleSmall(context).copyWith(
                          fontWeight: DesignTokens.fontWeightBold,
                        ),
                      ),
                    ),
                  ),
                  _buildQuantityButton(
                    icon: Icons.add,
                    onTap: () => _updateQuantity(index, 1),
                    isDark: isDark,
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuantityButton({
    required IconData icon,
    required VoidCallback onTap,
    required bool isDark,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface,
          borderRadius: BorderRadius.circular(DesignTokens.radiusSm),
          border: Border.all(
            color: isDark ? DesignTokens.darkBorder : DesignTokens.lightBorder,
          ),
        ),
        child: Icon(
          icon,
          size: 20,
          color: isDark ? DesignTokens.darkTextPrimary : DesignTokens.lightTextPrimary,
        ),
      ),
    );
  }

  Widget _buildSummaryCard(bool isDark) {
    return Padding(
      padding: const EdgeInsets.all(DesignTokens.space4),
      child: Container(
        padding: const EdgeInsets.all(DesignTokens.space4),
        decoration: BoxDecoration(
          color: isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface,
          borderRadius: BorderRadius.circular(DesignTokens.radiusCard),
          border: Border.all(
            color: isDark ? DesignTokens.darkBorder : DesignTokens.lightBorder,
          ),
        ),
        child: Column(
          children: [
            _buildSummaryRow('Subtotal', '\$${_subtotal.toStringAsFixed(2)}', isDark),
            if (_discount > 0) ...[
              const SizedBox(height: DesignTokens.space2),
              _buildSummaryRow(
                'Discount',
                '-\$${_discount.toStringAsFixed(2)}',
                isDark,
                isDiscount: true,
              ),
            ],
            const SizedBox(height: DesignTokens.space2),
            _buildSummaryRow(
              'Shipping',
              _shipping == 0 ? 'FREE' : '\$${_shipping.toStringAsFixed(2)}',
              isDark,
              isFree: _shipping == 0,
            ),
            const Divider(height: DesignTokens.space4),
            _buildSummaryRow(
              'Total',
              '\$${_total.toStringAsFixed(2)}',
              isDark,
              isTotal: true,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryRow(
    String label,
    String value,
    bool isDark, {
    bool isTotal = false,
    bool isDiscount = false,
    bool isFree = false,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: isTotal
              ? AppTypography.titleMedium(context).copyWith(
                  fontWeight: DesignTokens.fontWeightBold,
                )
              : AppTypography.bodyMedium(context),
        ),
        Text(
          value,
          style: isTotal
              ? AppTypography.h3(context).copyWith(
                  fontWeight: DesignTokens.fontWeightBold,
                  color: DesignTokens.brandPrimary,
                )
              : AppTypography.titleSmall(context).copyWith(
                  fontWeight: DesignTokens.fontWeightSemiBold,
                  color: isDiscount
                      ? DesignTokens.successDefault
                      : isFree
                          ? DesignTokens.successDefault
                          : null,
                ),
        ),
      ],
    );
  }

  Widget _buildBottomBar(bool isDark) {
    final hasOutOfStock = _cartItems.any((item) => !(item['inStock'] ?? true));

    return Container(
      padding: EdgeInsets.only(
        left: DesignTokens.space4,
        right: DesignTokens.space4,
        top: DesignTokens.space3,
        bottom: DesignTokens.space3 + MediaQuery.of(context).padding.bottom,
      ),
      decoration: BoxDecoration(
        color: isDark ? DesignTokens.darkSurface : DesignTokens.lightSurface,
        border: Border(
          top: BorderSide(
            color: isDark ? DesignTokens.darkBorder : DesignTokens.lightBorder,
          ),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (hasOutOfStock)
            Padding(
              padding: const EdgeInsets.only(bottom: DesignTokens.space3),
              child: Row(
                children: [
                  const Icon(
                    Icons.error_outline,
                    color: DesignTokens.errorDefault,
                    size: 20,
                  ),
                  const SizedBox(width: DesignTokens.space2),
                  Expanded(
                    child: Text(
                      'Some items are out of stock',
                      style: AppTypography.labelSmall(context).copyWith(
                        color: DesignTokens.errorDefault,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Total',
                      style: AppTypography.labelSmall(context).copyWith(
                        color: isDark ? DesignTokens.darkTextSecondary : DesignTokens.lightTextSecondary,
                      ),
                    ),
                    Text(
                      '\$${_total.toStringAsFixed(2)}',
                      style: AppTypography.h2(context).copyWith(
                        fontWeight: DesignTokens.fontWeightBold,
                        color: DesignTokens.brandPrimary,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: DesignTokens.space3),
              Expanded(
                flex: 2,
                child: PrimaryButton(
                  text: hasOutOfStock ? 'Review Cart' : 'Proceed to Checkout',
                  onPressed: hasOutOfStock
                      ? null
                      : () {
                          // Navigate to checkout
                        },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
