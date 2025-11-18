import '../../../orders/data/models/order.dart' as order_model;

/// Mock service for order management
class OrderService {
  // Mock data for orders
  static final List<order_model.Order> _mockOrders = [
    Order(
      id: '1',
      userId: 'user1',
      items: [],
      subtotal: 99.99,
      tax: 8.99,
      shipping: 5.99,
      total: 114.97,
      status: 'delivered',
      shippingAddress: {},
      paymentMethod: 'card',
      createdAt: DateTime.now().subtract(const Duration(days: 7)),
      updatedAt: DateTime.now().subtract(const Duration(days: 2)),
    ),
    order_model.Order(
      id: '2',
      userId: 'user1',
      items: [
        order_model.OrderItem(
          id: 'item2',
          productId: 'prod2',
          productName: 'Another Product',
          price: 49.99,
          quantity: 1,
          total: 49.99,
        ),
      ],
      subtotal: 49.99,
      tax: 4.49,
      shipping: 5.99,
      total: 60.47,
      status: 'shipped',
      shippingAddress: '456 Oak Ave, Town, State 67890',
      paymentMethod: 'paypal',
      orderDate: DateTime.now().subtract(const Duration(days: 3)),
      createdAt: DateTime.now().subtract(const Duration(days: 3)),
      updatedAt: DateTime.now().subtract(const Duration(days: 1)),
    ),
  ];

  /// Get all orders for a user
  Future<List<order_model.Order>> getUserOrders(String userId) async {
    await Future.delayed(const Duration(milliseconds: 300));
    return _mockOrders.where((order) => order.userId == userId).toList()
      ..sort((a, b) => (b.createdAt ?? DateTime.now()).compareTo(a.createdAt ?? DateTime.now()));
  }

  /// Get order by ID
  Future<order_model.Order?> getOrder(String orderId) async {
    await Future.delayed(const Duration(milliseconds: 200));
    try {
      return _mockOrders.firstWhere((order) => order.id == orderId);
    } catch (e) {
      return null;
    }
  }

  /// Create a new order
  Future<order_model.Order> createOrder({
    required String userId,
    required List<order_model.OrderItem> items,
    required double subtotal,
    required double tax,
    required double shipping,
    required double total,
    required String shippingAddress,
    required String paymentMethod,
  }) async {
    await Future.delayed(const Duration(milliseconds: 500));
    
    final order = order_model.Order(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      userId: userId,
      items: items,
      subtotal: subtotal,
      tax: tax,
      shipping: shipping,
      total: total,
      status: 'pending',
      shippingAddress: shippingAddress,
      paymentMethod: paymentMethod,
      orderDate: DateTime.now(),
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
    
    _mockOrders.add(order);
    return order;
  }

  /// Update order status
  Future<order_model.Order> updateOrderStatus(String orderId, String status) async {
    await Future.delayed(const Duration(milliseconds: 300));
    
    final orderIndex = _mockOrders.indexWhere((order) => order.id == orderId);
    if (orderIndex == -1) {
      throw Exception('Order not found');
    }
    
    // Create updated order (since Order is immutable)
    final order = _mockOrders[orderIndex];
    final updatedOrder = order_model.Order(
      id: order.id,
      userId: order.userId,
      items: order.items,
      subtotal: order.subtotal,
      tax: order.tax,
      shipping: order.shipping,
      discount: order.discount,
      total: order.total,
      status: status,
      trackingNumber: order.trackingNumber,
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod,
      orderDate: order.orderDate,
      estimatedDelivery: order.estimatedDelivery,
      deliveredAt: order.deliveredAt,
      createdAt: order.createdAt,
      updatedAt: DateTime.now(),
    );
    
    _mockOrders[orderIndex] = updatedOrder;
    return updatedOrder;
  }

  /// Cancel an order
  Future<order_model.Order> cancelOrder(String orderId) async {
    await Future.delayed(const Duration(milliseconds: 300));
    return updateOrderStatus(orderId, 'cancelled');
  }

  /// Add tracking number to order
  Future<order_model.Order> addTracking(String orderId, String trackingNumber) async {
    await Future.delayed(const Duration(milliseconds: 300));
    
    final orderIndex = _mockOrders.indexWhere((order) => order.id == orderId);
    if (orderIndex == -1) {
      throw Exception('Order not found');
    }
    
    final order = _mockOrders[orderIndex];
    final updatedOrder = order_model.Order(
      id: order.id,
      userId: order.userId,
      items: order.items,
      subtotal: order.subtotal,
      tax: order.tax,
      shipping: order.shipping,
      discount: order.discount,
      total: order.total,
      status: order.status,
      trackingNumber: trackingNumber,
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod,
      orderDate: order.orderDate,
      estimatedDelivery: order.estimatedDelivery,
      deliveredAt: order.deliveredAt,
      createdAt: order.createdAt,
      updatedAt: DateTime.now(),
    );
    
    _mockOrders[orderIndex] = updatedOrder;
    return updatedOrder;
  }

  /// Get orders by status
  Future<List<order_model.Order>> getOrdersByStatus(String userId, String status) async {
    await Future.delayed(const Duration(milliseconds: 300));
    return _mockOrders
        .where((order) => order.userId == userId && order.status == status)
        .toList()
      ..sort((a, b) => (b.createdAt ?? DateTime.now()).compareTo(a.createdAt ?? DateTime.now()));
  }

  /// Get order statistics
  Future<Map<String, dynamic>> getOrderStats(String userId) async {
    await Future.delayed(const Duration(milliseconds: 400));
    
    final userOrders = _mockOrders.where((order) => order.userId == userId);
    
    return {
      'totalOrders': userOrders.length,
      'pendingOrders': userOrders.where((o) => o.status == 'pending').length,
      'shippedOrders': userOrders.where((o) => o.status == 'shipped').length,
      'deliveredOrders': userOrders.where((o) => o.status == 'delivered').length,
      'cancelledOrders': userOrders.where((o) => o.status == 'cancelled').length,
      'totalSpent': userOrders.fold<double>(0.0, (sum, order) => sum + order.total),
    };
  }
}