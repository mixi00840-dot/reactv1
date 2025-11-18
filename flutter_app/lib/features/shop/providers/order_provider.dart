import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:state_notifier/state_notifier.dart';
import '../models/product_model_simple.dart';
import '../services/order_api_service.dart';
import 'product_provider.dart';

// Order API Service Provider
final orderApiServiceProvider = Provider<OrderApiService>(
  (ref) => OrderApiService(ref.watch(apiServiceProvider)),
);

// Orders State Notifier
class OrdersNotifier extends StateNotifier<AsyncValue<List<Order>>> {
  final OrderApiService _service;
  int _currentPage = 1;
  bool _hasMore = true;
  String? _statusFilter;

  OrdersNotifier(this._service) : super(const AsyncValue.loading()) {
    loadOrders();
  }

  /// Load orders from API
  Future<void> loadOrders({String? status}) async {
    _statusFilter = status;
    _currentPage = 1;
    _hasMore = true;
    state = const AsyncValue.loading();

    try {
      final orders = await _service.getOrders(
        page: _currentPage,
        limit: 20,
        status: status,
      );
      state = AsyncValue.data(orders);
      _hasMore = orders.length == 20;
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  /// Load more orders (pagination)
  Future<void> loadMore() async {
    if (!_hasMore || state.isLoading) return;

    try {
      _currentPage++;
      final orders = await _service.getOrders(
        page: _currentPage,
        limit: 20,
        status: _statusFilter,
      );

      state.whenData((currentOrders) {
        state = AsyncValue.data([...currentOrders, ...orders]);
      });

      _hasMore = orders.length == 20;
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  /// Refresh orders
  Future<void> refresh() async {
    await loadOrders(status: _statusFilter);
  }

  /// Create new order
  Future<Order> createOrder({
    required String addressId,
    required String paymentMethodId,
    String? notes,
  }) async {
    try {
      final order = await _service.createOrder(
        addressId: addressId,
        paymentMethodId: paymentMethodId,
        notes: notes,
      );

      // Add new order to the beginning of the list
      state.whenData((orders) {
        state = AsyncValue.data([order, ...orders]);
      });

      return order;
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }

  /// Cancel order
  Future<void> cancelOrder(String orderId) async {
    try {
      final canceledOrder = await _service.cancelOrder(orderId);

      state.whenData((orders) {
        final updatedOrders = orders
            .map((order) => order.id == orderId ? canceledOrder : order)
            .toList();
        state = AsyncValue.data(updatedOrders);
      });
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }
}

final ordersProvider =
    StateNotifierProvider<OrdersNotifier, AsyncValue<List<Order>>>((ref) {
  final service = ref.watch(orderApiServiceProvider);
  return OrdersNotifier(service);
});

// Order by ID provider
final orderByIdProvider =
    FutureProvider.family<Order, String>((ref, orderId) async {
  final service = ref.watch(orderApiServiceProvider);
  return service.getOrderById(orderId);
});

// Addresses Provider
class AddressesNotifier extends StateNotifier<AsyncValue<List<Address>>> {
  final OrderApiService _service;

  AddressesNotifier(this._service) : super(const AsyncValue.loading()) {
    loadAddresses();
  }

  Future<void> loadAddresses() async {
    state = const AsyncValue.loading();
    try {
      final addresses = await _service.getAddresses();
      state = AsyncValue.data(addresses);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> addAddress(Address address) async {
    try {
      final newAddress = await _service.addAddress(address);
      state.whenData((addresses) {
        state = AsyncValue.data([...addresses, newAddress]);
      });
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }

  Future<void> updateAddress(String addressId, Address address) async {
    try {
      final updatedAddress =
          await _service.updateAddress(addressId, address);
      state.whenData((addresses) {
        final updatedAddresses = addresses
            .map((addr) => addr.id == addressId ? updatedAddress : addr)
            .toList();
        state = AsyncValue.data(updatedAddresses);
      });
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }

  Future<void> deleteAddress(String addressId) async {
    try {
      await _service.deleteAddress(addressId);
      state.whenData((addresses) {
        state = AsyncValue.data(
          addresses.where((addr) => addr.id != addressId).toList(),
        );
      });
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }
}

final addressesProvider =
    StateNotifierProvider<AddressesNotifier, AsyncValue<List<Address>>>((ref) {
  final service = ref.watch(orderApiServiceProvider);
  return AddressesNotifier(service);
});

// Payment Methods Provider
class PaymentMethodsNotifier
    extends StateNotifier<AsyncValue<List<PaymentMethod>>> {
  final OrderApiService _service;

  PaymentMethodsNotifier(this._service) : super(const AsyncValue.loading()) {
    loadPaymentMethods();
  }

  Future<void> loadPaymentMethods() async {
    state = const AsyncValue.loading();
    try {
      final methods = await _service.getPaymentMethods();
      state = AsyncValue.data(methods);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> addPaymentMethod(PaymentMethod method) async {
    try {
      final newMethod = await _service.addPaymentMethod(method);
      state.whenData((methods) {
        state = AsyncValue.data([...methods, newMethod]);
      });
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }
}

final paymentMethodsProvider = StateNotifierProvider<PaymentMethodsNotifier,
    AsyncValue<List<PaymentMethod>>>((ref) {
  final service = ref.watch(orderApiServiceProvider);
  return PaymentMethodsNotifier(service);
});
