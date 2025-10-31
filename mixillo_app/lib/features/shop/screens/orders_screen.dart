import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../models/product_model.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Sample orders data
  final List<OrderModel> _orders = [
    OrderModel(
      id: 'ORD-1234567890',
      items: [],
      subtotal: 139.98,
      shipping: 5.99,
      tax: 11.20,
      total: 157.17,
      status: 'delivered',
      orderDate: DateTime.now().subtract(const Duration(days: 10)),
      trackingNumber: 'TRK-98765432',
      shippingAddress: {
        'name': 'John Doe',
        'address': '123 Main Street',
        'city': 'New York',
        'state': 'NY',
        'zip': '10001',
      },
      paymentMethod: 'Credit Card',
    ),
    OrderModel(
      id: 'ORD-1234567891',
      items: [],
      subtotal: 89.99,
      shipping: 0,
      tax: 7.20,
      total: 97.19,
      status: 'shipping',
      orderDate: DateTime.now().subtract(const Duration(days: 3)),
      trackingNumber: 'TRK-98765433',
      shippingAddress: {
        'name': 'John Doe',
        'address': '123 Main Street',
        'city': 'New York',
        'state': 'NY',
        'zip': '10001',
      },
      paymentMethod: 'PayPal',
    ),
    OrderModel(
      id: 'ORD-1234567892',
      items: [],
      subtotal: 49.99,
      shipping: 5.99,
      tax: 4.00,
      total: 59.98,
      status: 'processing',
      orderDate: DateTime.now().subtract(const Duration(days: 1)),
      trackingNumber: 'TRK-98765434',
      shippingAddress: {
        'name': 'John Doe',
        'address': '123 Main Street',
        'city': 'New York',
        'state': 'NY',
        'zip': '10001',
      },
      paymentMethod: 'Cash on Delivery',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      appBar: AppBar(
        title: const Text('My Orders'),
        backgroundColor: isDark ? AppColors.darkCard : AppColors.lightCard,
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor: isDark ? Colors.white54 : Colors.black54,
          tabs: const [
            Tab(text: 'All'),
            Tab(text: 'Processing'),
            Tab(text: 'Shipping'),
            Tab(text: 'Delivered'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildOrdersList(_orders, isDark),
          _buildOrdersList(
            _orders.where((o) => o.status == 'processing').toList(),
            isDark,
          ),
          _buildOrdersList(
            _orders.where((o) => o.status == 'shipping').toList(),
            isDark,
          ),
          _buildOrdersList(
            _orders.where((o) => o.status == 'delivered').toList(),
            isDark,
          ),
        ],
      ),
    );
  }

  Widget _buildOrdersList(List<OrderModel> orders, bool isDark) {
    if (orders.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.shopping_bag_outlined,
              size: 80,
              color: isDark ? Colors.white24 : Colors.black12,
            ),
            const SizedBox(height: 16),
            Text(
              'No orders found',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: isDark ? Colors.white70 : Colors.black54,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: orders.length,
      itemBuilder: (context, index) {
        return _OrderCard(
          order: orders[index],
          isDark: isDark,
          onTap: () => _showOrderDetails(orders[index]),
        );
      },
    );
  }

  void _showOrderDetails(OrderModel order) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _OrderDetailsSheet(order: order),
    );
  }
}

class _OrderCard extends StatelessWidget {
  final OrderModel order;
  final bool isDark;
  final VoidCallback onTap;

  const _OrderCard({
    required this.order,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : AppColors.lightCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? Colors.white10 : Colors.black12,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Order Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                order.id,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : Colors.black,
                ),
              ),
              _StatusChip(status: order.status),
            ],
          ),

          const SizedBox(height: 12),

          // Order Date
          Row(
            children: [
              Icon(
                Icons.calendar_today_outlined,
                size: 14,
                color: isDark ? Colors.white54 : Colors.black45,
              ),
              const SizedBox(width: 6),
              Text(
                _formatDate(order.orderDate),
                style: TextStyle(
                  fontSize: 12,
                  color: isDark ? Colors.white54 : Colors.black45,
                ),
              ),
            ],
          ),

          const SizedBox(height: 8),

          // Tracking Number
          Row(
            children: [
              Icon(
                Icons.local_shipping_outlined,
                size: 14,
                color: isDark ? Colors.white54 : Colors.black45,
              ),
              const SizedBox(width: 6),
              Text(
                order.trackingNumber ?? 'N/A',
                style: TextStyle(
                  fontSize: 12,
                  color: isDark ? Colors.white54 : Colors.black45,
                ),
              ),
            ],
          ),

          const Divider(height: 24),

          // Order Total
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Total',
                style: TextStyle(
                  fontSize: 14,
                  color: isDark ? Colors.white70 : Colors.black54,
                ),
              ),
              Text(
                '\$${order.total.toStringAsFixed(2)}',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // View Details Button
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: onTap,
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.primary,
                side: const BorderSide(color: AppColors.primary),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text('View Details'),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    final months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }
}

class _StatusChip extends StatelessWidget {
  final String status;

  const _StatusChip({required this.status});

  @override
  Widget build(BuildContext context) {
    Color backgroundColor;
    Color textColor;
    String label;

    switch (status) {
      case 'processing':
        backgroundColor = Colors.orange.withOpacity(0.2);
        textColor = Colors.orange;
        label = 'Processing';
        break;
      case 'shipping':
        backgroundColor = Colors.blue.withOpacity(0.2);
        textColor = Colors.blue;
        label = 'Shipping';
        break;
      case 'delivered':
        backgroundColor = AppColors.success.withOpacity(0.2);
        textColor = AppColors.success;
        label = 'Delivered';
        break;
      default:
        backgroundColor = Colors.grey.withOpacity(0.2);
        textColor = Colors.grey;
        label = 'Unknown';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: textColor,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

class _OrderDetailsSheet extends StatelessWidget {
  final OrderModel order;

  const _OrderDetailsSheet({required this.order});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      height: MediaQuery.of(context).size.height * 0.75,
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : AppColors.lightCard,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Handle
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: isDark ? Colors.white24 : Colors.black12,
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Order Details',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : Colors.black,
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
          ),

          const Divider(height: 1),

          // Content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _DetailRow(
                    label: 'Order ID',
                    value: order.id,
                    isDark: isDark,
                  ),
                  const SizedBox(height: 12),
                  _DetailRow(
                    label: 'Tracking Number',
                    value: order.trackingNumber ?? 'N/A',
                    isDark: isDark,
                  ),
                  const SizedBox(height: 12),
                  _DetailRow(
                    label: 'Status',
                    value: order.status.toUpperCase(),
                    isDark: isDark,
                  ),
                  const SizedBox(height: 12),
                  _DetailRow(
                    label: 'Order Date',
                    value: _formatDate(order.orderDate),
                    isDark: isDark,
                  ),

                  const SizedBox(height: 24),
                  Text(
                    'Shipping Address',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : Colors.black,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: isDark
                          ? AppColors.darkBackground
                          : AppColors.lightBackground,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      '${order.shippingAddress['name']}\n'
                      '${order.shippingAddress['address']}\n'
                      '${order.shippingAddress['city']}, ${order.shippingAddress['state']} ${order.shippingAddress['zip']}',
                      style: TextStyle(
                        fontSize: 14,
                        height: 1.5,
                        color: isDark ? Colors.white70 : Colors.black54,
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),
                  Text(
                    'Payment Summary',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : Colors.black,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _SummaryRow(
                    label: 'Subtotal',
                    value: '\$${order.subtotal.toStringAsFixed(2)}',
                    isDark: isDark,
                  ),
                  const SizedBox(height: 8),
                  _SummaryRow(
                    label: 'Shipping',
                    value: order.shipping == 0
                        ? 'FREE'
                        : '\$${order.shipping.toStringAsFixed(2)}',
                    isDark: isDark,
                  ),
                  const SizedBox(height: 8),
                  _SummaryRow(
                    label: 'Tax',
                    value: '\$${order.tax.toStringAsFixed(2)}',
                    isDark: isDark,
                  ),
                  const Divider(height: 24),
                  _SummaryRow(
                    label: 'Total',
                    value: '\$${order.total.toStringAsFixed(2)}',
                    isDark: isDark,
                    isTotal: true,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    final months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isDark;

  const _DetailRow({
    required this.label,
    required this.value,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            color: isDark ? Colors.white70 : Colors.black54,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: isDark ? Colors.white : Colors.black,
          ),
        ),
      ],
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isDark;
  final bool isTotal;

  const _SummaryRow({
    required this.label,
    required this.value,
    required this.isDark,
    this.isTotal = false,
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
            color: isTotal
                ? AppColors.primary
                : (isDark ? Colors.white : Colors.black),
          ),
        ),
      ],
    );
  }
}
