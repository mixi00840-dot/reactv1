# E-Commerce API Integration Guide

## Overview
This document covers the Week 4 implementation of backend API integration for the Mixillo e-commerce features.

## Architecture

### State Management: Riverpod
- **Provider Type**: Using `flutter_riverpod` (already in project)
- **Pattern**: StateNotifier for mutable state, FutureProvider for async data
- **Benefits**: Type-safe, testable, compile-time safety

### API Layer Structure

```
lib/features/shop/
├── models/
│   └── product_model.dart          # Freezed models with JSON serialization
├── services/
│   ├── api_service.dart            # Base API service with Dio
│   ├── product_api_service.dart    # Product endpoints
│   ├── cart_api_service.dart       # Cart endpoints
│   └── order_api_service.dart      # Orders, addresses, payments
└── providers/
    ├── product_provider.dart       # Product state management
    ├── cart_state_provider.dart    # Cart state management
    └── order_provider.dart         # Orders, addresses, payments
```

## Models (Freezed + JSON)

All models use `@freezed` for immutability and `json_serializable` for API serialization:

### Core Models
- **Product**: E-commerce product with images, pricing, variants, seller info
- **CartItem**: Cart item with product reference, quantity, selected variant
- **Order**: Complete order with items, address, payment, status
- **Address**: Shipping/billing address with default flag
- **PaymentMethod**: Saved payment methods (card, PayPal, COD)
- **Review**: Product reviews with rating and helpful count

### Generated Files
Run `flutter pub run build_runner build --delete-conflicting-outputs` to generate:
- `product_model.freezed.dart` - Freezed data classes
- `product_model.g.dart` - JSON serialization

## API Services

### ApiService (Base)
**File**: `lib/features/shop/services/api_service.dart`

Core functionality:
- Dio HTTP client configuration
- JWT token management (via SharedPreferences)
- Request/response interceptors
- Automatic token injection in headers
- Error handling with user-friendly messages
- Logging (debug mode only)

**Configuration**:
```dart
final baseUrl = dotenv.env['API_BASE_URL'] ?? 'http://localhost:5000/api';
```

**Token Management**:
- Stored in SharedPreferences as `auth_token`
- Auto-injected in all requests via interceptor
- Auto-cleared on 401 responses

**Error Handling**:
- Connection timeout → User-friendly message
- 404/500 errors → Specific messages
- Network errors → Generic connection error

### ProductApiService
**File**: `lib/features/shop/services/product_api_service.dart`

**Endpoints**:
- `GET /products/featured` - Featured products (limit param)
- `GET /products/category/:category` - Products by category (paginated)
- `GET /products/:id` - Single product details
- `GET /products/search` - Search with filters (query, category, price, rating)
- `GET /products/:id/related` - Related products
- `GET /products/:id/reviews` - Product reviews (paginated)
- `GET /products/categories` - All categories

**Example Usage**:
```dart
final service = ProductApiService(apiService);
final products = await service.getFeaturedProducts(limit: 10);
```

### CartApiService
**File**: `lib/features/shop/services/cart_api_service.dart`

**Endpoints**:
- `GET /cart` - Get user cart items
- `POST /cart/add` - Add item (productId, quantity, size, color)
- `PUT /cart/:id` - Update item quantity
- `DELETE /cart/:id` - Remove item
- `DELETE /cart/clear` - Clear entire cart
- `GET /cart/summary` - Get totals (subtotal, shipping, tax)

**Features**:
- Guest cart vs authenticated cart handling
- Cart persistence
- Server-side total calculations

### OrderApiService
**File**: `lib/features/shop/services/order_api_service.dart`

**Endpoints**:
- `POST /orders` - Create order (addressId, paymentMethodId, notes)
- `GET /orders` - Get orders (paginated, status filter)
- `GET /orders/:id` - Order details
- `POST /orders/:id/cancel` - Cancel order
- `GET /user/addresses` - Saved addresses
- `POST /user/addresses` - Add address
- `PUT /user/addresses/:id` - Update address
- `DELETE /user/addresses/:id` - Delete address
- `GET /user/payment-methods` - Saved payment methods
- `POST /user/payment-methods` - Add payment method

## Providers (Riverpod)

### Product Providers
**File**: `lib/features/shop/providers/product_provider.dart`

**Providers**:
```dart
// API service singleton
final apiServiceProvider = Provider<ApiService>((ref) => ApiService());
final productApiServiceProvider = Provider<ProductApiService>(...);

// Data providers
final featuredProductsProvider = FutureProvider<List<Product>>(...);
final productByIdProvider = FutureProvider.family<Product, String>(...);
final productReviewsProvider = FutureProvider.family<List<Review>, String>(...);
final categoriesProvider = FutureProvider<List<Map>>(...);

// State notifiers (mutable state)
final productsByCategoryProvider = StateNotifierProvider<...>(...);
final searchProductsProvider = StateNotifierProvider<...>(...);
```

**Usage in Widgets**:
```dart
// Watch featured products
final productsAsync = ref.watch(featuredProductsProvider);
productsAsync.when(
  data: (products) => ListView(...),
  loading: () => CircularProgressIndicator(),
  error: (err, stack) => ErrorWidget(err),
);

// Search products with state
ref.read(searchProductsProvider.notifier).search(
  query: 'headphones',
  minPrice: 50.0,
  maxPrice: 200.0,
);
```

### Cart Providers
**File**: `lib/features/shop/providers/cart_state_provider.dart`

**Providers**:
```dart
final cartStateProvider = StateNotifierProvider<CartNotifier, AsyncValue<List<CartItem>>>(...);

// Computed providers
final cartItemCountProvider = Provider<int>(...);
final cartSubtotalProvider = Provider<double>(...);
final cartShippingProvider = Provider<double>(...); // Free over $50
final cartTaxProvider = Provider<double>(...); // 8%
final cartTotalProvider = Provider<double>(...);
```

**Cart Operations**:
```dart
// Add to cart
await ref.read(cartStateProvider.notifier).addToCart(
  productId: '123',
  quantity: 2,
  size: 'M',
  color: '#7B61FF',
);

// Update quantity
await ref.read(cartStateProvider.notifier).updateQuantity(cartItemId, 3);

// Remove item (optimistic update)
await ref.read(cartStateProvider.notifier).removeItem(cartItemId);

// Clear cart
await ref.read(cartStateProvider.notifier).clearCart();

// Watch totals
final total = ref.watch(cartTotalProvider); // Auto-updates
```

**Features**:
- Optimistic updates (instant UI, revert on error)
- Automatic total calculations
- Free shipping over $50
- 8% tax rate
- Server-side subtotal calculation

### Order Providers
**File**: `lib/features/shop/providers/order_provider.dart`

**Providers**:
```dart
final ordersProvider = StateNotifierProvider<OrdersNotifier, AsyncValue<List<Order>>>(...);
final orderByIdProvider = FutureProvider.family<Order, String>(...);
final addressesProvider = StateNotifierProvider<AddressesNotifier, ...>(...);
final paymentMethodsProvider = StateNotifierProvider<PaymentMethodsNotifier, ...>(...);
```

**Order Operations**:
```dart
// Create order
final order = await ref.read(ordersProvider.notifier).createOrder(
  addressId: 'addr123',
  paymentMethodId: 'pm456',
  notes: 'Leave at door',
);

// Load orders (with filter)
await ref.read(ordersProvider.notifier).loadOrders(status: 'pending');

// Load more (pagination)
await ref.read(ordersProvider.notifier).loadMore();

// Cancel order
await ref.read(ordersProvider.notifier).cancelOrder(orderId);
```

**Address Operations**:
```dart
// Load addresses
final addressesAsync = ref.watch(addressesProvider);

// Add address
await ref.read(addressesProvider.notifier).addAddress(newAddress);

// Update address
await ref.read(addressesProvider.notifier).updateAddress(id, updatedAddress);

// Delete address
await ref.read(addressesProvider.notifier).deleteAddress(id);
```

## Integration Steps

### Step 1: Update pubspec.yaml
Already configured with:
- `flutter_riverpod: ^2.4.9`
- `dio: ^5.4.0`
- `shared_preferences: ^2.2.2`
- `flutter_dotenv: ^5.1.0`

### Step 2: Configure Environment
Edit `.env` file:
```env
API_BASE_URL=https://your-backend-url.com/api
```

### Step 3: Wrap App with ProviderScope
```dart
// main.dart
void main() {
  runApp(
    ProviderScope(
      child: MyApp(),
    ),
  );
}
```

### Step 4: Replace Mock Data in Pages

#### Shop Home Page
```dart
class ShopHomePage extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productsAsync = ref.watch(featuredProductsProvider);
    
    return productsAsync.when(
      data: (products) => _buildProductGrid(products),
      loading: () => Center(child: CircularProgressIndicator()),
      error: (err, stack) => ErrorWidget(err.toString()),
    );
  }
}
```

#### Product Details Page
```dart
class ProductDetailsPage extends ConsumerWidget {
  final String productId;
  
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productAsync = ref.watch(productByIdProvider(productId));
    final reviewsAsync = ref.watch(productReviewsProvider(productId));
    
    return productAsync.when(
      data: (product) => _buildDetails(product, reviewsAsync),
      loading: () => LoadingState(),
      error: (err, stack) => ErrorState(err),
    );
  }
  
  void _addToCart() async {
    try {
      await ref.read(cartStateProvider.notifier).addToCart(
        productId: productId,
        quantity: _quantity,
        size: _selectedSize,
        color: _selectedColor,
      );
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Added to cart!')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString())),
      );
    }
  }
}
```

#### Cart Page
```dart
class CartPage extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cartAsync = ref.watch(cartStateProvider);
    final subtotal = ref.watch(cartSubtotalProvider);
    final shipping = ref.watch(cartShippingProvider);
    final tax = ref.watch(cartTaxProvider);
    final total = ref.watch(cartTotalProvider);
    
    return cartAsync.when(
      data: (items) => items.isEmpty 
        ? EmptyCartState()
        : Column(
            children: [
              Expanded(
                child: ListView.builder(
                  itemCount: items.length,
                  itemBuilder: (context, index) => CartItemCard(
                    item: items[index],
                    onQuantityChanged: (qty) {
                      ref.read(cartStateProvider.notifier)
                        .updateQuantity(items[index].id, qty);
                    },
                    onRemove: () {
                      ref.read(cartStateProvider.notifier)
                        .removeItem(items[index].id);
                    },
                  ),
                ),
              ),
              CartSummary(
                subtotal: subtotal,
                shipping: shipping,
                tax: tax,
                total: total,
              ),
            ],
          ),
      loading: () => LoadingState(),
      error: (err, stack) => ErrorState(err),
    );
  }
}
```

#### Checkout Page
```dart
class CheckoutPage extends ConsumerStatefulWidget {
  @override
  ConsumerState<CheckoutPage> createState() => _CheckoutPageState();
}

class _CheckoutPageState extends ConsumerState<CheckoutPage> {
  String? _selectedAddressId;
  String? _selectedPaymentId;
  
  @override
  Widget build(BuildContext context) {
    final addressesAsync = ref.watch(addressesProvider);
    final paymentMethodsAsync = ref.watch(paymentMethodsProvider);
    
    return Scaffold(
      body: Column(
        children: [
          // Address selector
          addressesAsync.when(
            data: (addresses) => AddressSelector(
              addresses: addresses,
              selectedId: _selectedAddressId,
              onSelected: (id) => setState(() => _selectedAddressId = id),
            ),
            loading: () => LoadingState(),
            error: (err, stack) => ErrorState(err),
          ),
          
          // Payment method selector
          paymentMethodsAsync.when(
            data: (methods) => PaymentMethodSelector(
              methods: methods,
              selectedId: _selectedPaymentId,
              onSelected: (id) => setState(() => _selectedPaymentId = id),
            ),
            loading: () => LoadingState(),
            error: (err, stack) => ErrorState(err),
          ),
        ],
      ),
      bottomNavigationBar: ElevatedButton(
        onPressed: _canPlaceOrder ? _placeOrder : null,
        child: Text('Place Order'),
      ),
    );
  }
  
  bool get _canPlaceOrder =>
    _selectedAddressId != null && _selectedPaymentId != null;
  
  Future<void> _placeOrder() async {
    try {
      final order = await ref.read(ordersProvider.notifier).createOrder(
        addressId: _selectedAddressId!,
        paymentMethodId: _selectedPaymentId!,
      );
      
      // Navigate to success page
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => OrderSuccessPage(order: order),
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString())),
      );
    }
  }
}
```

#### Orders Page
```dart
class OrdersPage extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ordersAsync = ref.watch(ordersProvider);
    
    return ordersAsync.when(
      data: (orders) => orders.isEmpty
        ? EmptyOrdersState()
        : RefreshIndicator(
            onRefresh: () => ref.read(ordersProvider.notifier).refresh(),
            child: ListView.builder(
              itemCount: orders.length,
              itemBuilder: (context, index) => OrderCard(order: orders[index]),
            ),
          ),
      loading: () => LoadingState(),
      error: (err, stack) => ErrorState(err),
    );
  }
}
```

## Backend API Requirements

The Flutter app expects the following API structure:

### Products
```
GET    /api/products/featured?limit=10
GET    /api/products/category/:category?page=1&limit=20
GET    /api/products/:id
GET    /api/products/search?q=query&category=&minPrice=&maxPrice=&minRating=&sortBy=
GET    /api/products/:id/related?limit=6
GET    /api/products/:id/reviews?page=1&limit=10
GET    /api/products/categories
```

### Cart
```
GET    /api/cart
POST   /api/cart/add
PUT    /api/cart/:id
DELETE /api/cart/:id
DELETE /api/cart/clear
GET    /api/cart/summary
```

### Orders
```
POST   /api/orders
GET    /api/orders?page=1&limit=20&status=
GET    /api/orders/:id
POST   /api/orders/:id/cancel
```

### User
```
GET    /api/user/addresses
POST   /api/user/addresses
PUT    /api/user/addresses/:id
DELETE /api/user/addresses/:id
GET    /api/user/payment-methods
POST   /api/user/payment-methods
```

### Expected Response Format
```json
{
  "success": true,
  "data": [...],
  "message": "Success",
  "statusCode": 200
}
```

### Error Response Format
```json
{
  "success": false,
  "message": "Error message",
  "statusCode": 400
}
```

## Testing

### Unit Tests
Test providers and services:
```dart
test('ProductApiService fetches featured products', () async {
  final service = ProductApiService(mockApiService);
  final products = await service.getFeaturedProducts();
  expect(products, isA<List<Product>>());
});
```

### Widget Tests
Test UI with mock providers:
```dart
testWidgets('Cart page shows items', (tester) async {
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        cartStateProvider.overrideWith((ref) => MockCartNotifier()),
      ],
      child: MaterialApp(home: CartPage()),
    ),
  );
  
  expect(find.byType(CartItemCard), findsNWidgets(3));
});
```

## Next Steps

1. ✅ Models created with Freezed
2. ✅ API services implemented
3. ✅ Riverpod providers configured
4. 🔄 Update shop pages to use providers
5. ⏳ Add error handling and retry logic
6. ⏳ Implement search and filters
7. ⏳ Add caching for offline support
8. ⏳ Write tests
9. ⏳ Performance optimization

## Files Created (Week 4 - Part 1)

1. `lib/features/shop/models/product_model.dart` (169 lines)
2. `lib/features/shop/services/api_service.dart` (120 lines)
3. `lib/features/shop/services/product_api_service.dart` (128 lines)
4. `lib/features/shop/services/cart_api_service.dart` (85 lines)
5. `lib/features/shop/services/order_api_service.dart` (134 lines)
6. `lib/features/shop/providers/product_provider.dart` (170 lines)
7. `lib/features/shop/providers/cart_state_provider.dart` (184 lines)
8. `lib/features/shop/providers/order_provider.dart` (205 lines)

**Total**: 8 files, ~1,195 lines of production code

## Status

**Week 4 Progress**: 2/10 tasks complete
- ✅ State management setup (Riverpod providers)
- ✅ API service layer (base + 3 services)
- 🔄 Next: Integrate shop home page with API
