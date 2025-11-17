import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/order.dart';
import '../data/services/order_service.dart';

// Order service provider
final orderServiceProvider = Provider<OrderService>((ref) {
  return OrderService();
});

// Orders list provider
final ordersProvider =
    StateNotifierProvider<OrdersNotifier, AsyncValue<List<Order>>>((ref) {
  final service = ref.watch(orderServiceProvider);
  return OrdersNotifier(service);
});

class OrdersNotifier extends StateNotifier<AsyncValue<List<Order>>> {
  final OrderService _service;

  OrdersNotifier(this._service) : super(const AsyncValue.loading()) {
    loadOrders();
  }

  Future<void> loadOrders({String? status}) async {
    state = const AsyncValue.loading();
    try {
      final orders = await _service.getOrders(status: status);
      state = AsyncValue.data(orders);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> cancelOrder(String orderId) async {
    try {
      await _service.cancelOrder(orderId);
      await loadOrders();
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> refresh() async {
    await loadOrders();
  }
}

// Single order provider
final singleOrderProvider =
    FutureProvider.family<Order, String>((ref, orderId) async {
  final service = ref.watch(orderServiceProvider);
  return await service.getOrder(orderId);
});

// Filtered orders by status
final filteredOrdersProvider =
    Provider.family<List<Order>, String?>((ref, status) {
  final ordersState = ref.watch(ordersProvider);
  return ordersState.when(
    data: (orders) {
      if (status == null || status == 'all') {
        return orders;
      }
      return orders.where((o) => o.status == status).toList();
    },
    loading: () => [],
    error: (_, __) => [],
  );
});

// Order counts by status
final orderCountsProvider = Provider<Map<String, int>>((ref) {
  final ordersState = ref.watch(ordersProvider);
  return ordersState.when(
    data: (orders) {
      final counts = <String, int>{
        'all': orders.length,
        'pending': 0,
        'processing': 0,
        'shipped': 0,
        'delivered': 0,
        'cancelled': 0,
      };

      for (final order in orders) {
        counts[order.status] = (counts[order.status] ?? 0) + 1;
      }

      return counts;
    },
    loading: () => {},
    error: (_, __) => {},
  );
});
