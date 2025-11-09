# 🔌 Screen Integration Guide

## How to Replace Mock Data with Real API Calls

This guide shows exactly how to update each screen to use the backend services.

---

## 1. Product Listing Screen Integration

### Current State
`lib/features/shop/screens/product_listing_screen.dart` uses `_mockProducts` list.

### Changes Needed

#### Add Service Import
```dart
import '../services/product_service.dart';
```

#### Add State Variables
```dart
class _ProductListingScreenState extends State<ProductListingScreen> {
  final _productService = ProductService();
  List<dynamic> _products = [];
  bool _isLoading = false;
  String? _error;
  int _currentPage = 1;
  bool _hasMore = true;
  
  // ... existing filter variables
```

#### Replace initState
```dart
@override
void initState() {
  super.initState();
  _loadProducts();
}

Future<void> _loadProducts() async {
  if (_isLoading || !_hasMore) return;
  
  setState(() => _isLoading = true);
  
  try {
    final response = await _productService.getProducts(
      page: _currentPage,
      limit: 20,
      category: _selectedCategories.contains('All') ? null : _selectedCategories.first,
      minPrice: _priceRange.start,
      maxPrice: _priceRange.end,
      minRating: _minRating > 0 ? _minRating : null,
      inStock: _inStock ? true : null,
      sortBy: _sortBy,
    );
    
    setState(() {
      _products.addAll(response['products'] ?? []);
      _hasMore = response['hasMore'] ?? false;
      _currentPage++;
      _isLoading = false;
      _error = null;
    });
  } catch (e) {
    setState(() {
      _error = e.toString();
      _isLoading = false;
    });
  }
}
```

#### Update Filters to Reload
```dart
void _applyFilters() {
  setState(() {
    _products.clear();
    _currentPage = 1;
    _hasMore = true;
  });
  _loadProducts();
  Navigator.pop(context);
}
```

#### Update Build Method
```dart
@override
Widget build(BuildContext context) {
  return Scaffold(
    body: _isLoading && _products.isEmpty
        ? Center(child: CircularProgressIndicator())
        : _error != null
            ? _buildErrorWidget()
            : _buildProductGrid(),
  );
}

Widget _buildErrorWidget() {
  return Center(
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(Icons.error_outline, size: 64, color: Colors.red),
        SizedBox(height: 16),
        Text(_error ?? 'An error occurred'),
        SizedBox(height: 16),
        ElevatedButton(
          onPressed: () {
            setState(() {
              _products.clear();
              _currentPage = 1;
              _hasMore = true;
            });
            _loadProducts();
          },
          child: Text('Retry'),
        ),
      ],
    ),
  );
}
```

---

## 2. Shopping Cart Screen Integration

### Current State
`lib/features/shop/screens/shopping_cart_screen.dart` uses local `_cartItems` list.

### Changes Needed

#### Add Service Import
```dart
import '../services/cart_service_api.dart';
```

#### Update State
```dart
class _ShoppingCartScreenState extends State<ShoppingCartScreen> {
  final _cartService = CartService();
  List<dynamic> _cartItems = [];
  Map<String, dynamic>? _cartSummary;
  bool _isLoading = false;
  
  @override
  void initState() {
    super.initState();
    _loadCart();
  }
  
  Future<void> _loadCart() async {
    setState(() => _isLoading = true);
    
    try {
      final cartData = await _cartService.getCart();
      final summary = await _cartService.getCartSummary();
      
      setState(() {
        _cartItems = cartData['items'] ?? [];
        _cartSummary = summary;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      _showError(e.toString());
    }
  }
```

#### Update Quantity Changes
```dart
Future<void> _updateQuantity(String itemId, int newQuantity) async {
  if (newQuantity <= 0) {
    await _removeItem(itemId);
    return;
  }
  
  try {
    await _cartService.updateQuantity(
      cartItemId: itemId,
      quantity: newQuantity,
    );
    _loadCart(); // Refresh cart
  } catch (e) {
    _showError('Failed to update quantity');
  }
}

Future<void> _removeItem(String itemId) async {
  try {
    await _cartService.removeFromCart(itemId);
    _loadCart(); // Refresh cart
  } catch (e) {
    _showError('Failed to remove item');
  }
}
```

#### Update Checkout
```dart
Future<void> _checkout() async {
  try {
    // Show loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Center(child: CircularProgressIndicator()),
    );
    
    // Process checkout - this would go to OrderService
    // For now, just clear the cart
    await _cartService.clearCart();
    
    Navigator.pop(context); // Close loading
    Navigator.pop(context); // Go back
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Order placed successfully!')),
    );
  } catch (e) {
    Navigator.pop(context); // Close loading
    _showError('Checkout failed');
  }
}
```

---

## 3. Product Details Screen Integration

### Changes Needed

#### Add Service Import
```dart
import '../services/product_service.dart';
import '../services/cart_service_api.dart';
```

#### Update Constructor to Accept Product ID
```dart
class ProductDetailsScreen extends StatefulWidget {
  final String? productId; // If null, use passed product data
  final Map<String, dynamic>? productData; // For offline/cached data
  
  const ProductDetailsScreen({
    Key? key,
    this.productId,
    this.productData,
  }) : super(key: key);
```

#### Load Product Data
```dart
class _ProductDetailsScreenState extends State<ProductDetailsScreen> {
  final _productService = ProductService();
  final _cartService = CartService();
  
  Map<String, dynamic>? _product;
  List<dynamic> _similarProducts = [];
  bool _isLoading = false;
  
  @override
  void initState() {
    super.initState();
    if (widget.productId != null) {
      _loadProductDetails();
    } else {
      _product = widget.productData;
      _loadSimilarProducts();
    }
  }
  
  Future<void> _loadProductDetails() async {
    setState(() => _isLoading = true);
    
    try {
      final product = await _productService.getProductById(widget.productId!);
      final similar = await _productService.getSimilarProducts(widget.productId!);
      
      setState(() {
        _product = product;
        _similarProducts = similar;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      _showError(e.toString());
    }
  }
```

#### Add to Cart Implementation
```dart
Future<void> _addToCart() async {
  if (_product == null) return;
  
  try {
    await _cartService.addToCart(
      productId: _product!['_id'],
      quantity: _quantity,
      variantId: _selectedSize != null ? '${_selectedSize}_${_selectedColor}' : null,
    );
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Added to cart!'),
        action: SnackBarAction(
          label: 'VIEW CART',
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => ShoppingCartScreen()),
            );
          },
        ),
      ),
    );
  } catch (e) {
    _showError('Failed to add to cart');
  }
}
```

---

## 4. Messages Screen Integration

### Changes Needed

#### Add Service Import
```dart
import '../services/messages_service.dart';
```

#### Update State
```dart
class _MessagesScreenState extends State<MessagesScreen> {
  final _messagesService = MessagesService();
  List<dynamic> _conversations = [];
  bool _isLoading = false;
  
  @override
  void initState() {
    super.initState();
    _loadConversations();
  }
  
  Future<void> _loadConversations() async {
    setState(() => _isLoading = true);
    
    try {
      final response = await _messagesService.getConversations();
      setState(() {
        _conversations = response['conversations'] ?? [];
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      _showError(e.toString());
    }
  }
```

#### Add Pull to Refresh
```dart
@override
Widget build(BuildContext context) {
  return Scaffold(
    body: RefreshIndicator(
      onRefresh: _loadConversations,
      child: _isLoading && _conversations.isEmpty
          ? Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: _conversations.length,
              itemBuilder: (context, index) {
                final convo = _conversations[index];
                return _buildConversationItem(convo);
              },
            ),
    ),
  );
}
```

---

## 5. Chat Screen Integration with WebSocket

### Changes Needed

#### Add Service Import
```dart
import '../services/messages_service.dart';
import 'dart:async';
```

#### Update State with WebSocket
```dart
class _ChatScreenState extends State<ChatScreen> {
  final _messagesService = MessagesService();
  final _messageController = TextEditingController();
  
  List<dynamic> _messages = [];
  StreamSubscription? _messageSubscription;
  bool _isLoading = false;
  
  @override
  void initState() {
    super.initState();
    _loadMessages();
    _connectWebSocket();
  }
  
  Future<void> _loadMessages() async {
    setState(() => _isLoading = true);
    
    try {
      final response = await _messagesService.getMessages(
        conversationId: widget.conversationId,
        page: 1,
        limit: 50,
      );
      
      setState(() {
        _messages = response['messages'] ?? [];
        _isLoading = false;
      });
      
      // Mark conversation as read
      await _messagesService.markConversationAsRead(widget.conversationId);
    } catch (e) {
      setState(() => _isLoading = false);
      _showError(e.toString());
    }
  }
  
  void _connectWebSocket() async {
    // Get auth token
    final apiService = ApiService();
    await apiService.init();
    final token = apiService._token; // You'll need to make this accessible
    
    if (token == null) return;
    
    try {
      final stream = _messagesService.connectWebSocket(token);
      _messageSubscription = stream.listen(
        (message) {
          if (message['conversationId'] == widget.conversationId) {
            setState(() {
              _messages.insert(0, message);
            });
          }
        },
        onError: (error) {
          print('WebSocket error: $error');
        },
      );
    } catch (e) {
      print('Failed to connect WebSocket: $e');
    }
  }
```

#### Send Message Implementation
```dart
Future<void> _sendMessage() async {
  final text = _messageController.text.trim();
  if (text.isEmpty) return;
  
  try {
    // Clear input immediately for better UX
    _messageController.clear();
    
    // Send via WebSocket for real-time delivery
    _messagesService.sendWebSocketMessage({
      'type': 'message',
      'conversationId': widget.conversationId,
      'text': text,
      'timestamp': DateTime.now().toIso8601String(),
    });
    
    // Also send via HTTP as backup
    await _messagesService.sendMessage(
      conversationId: widget.conversationId,
      text: text,
    );
  } catch (e) {
    _showError('Failed to send message');
    _messageController.text = text; // Restore message
  }
}
```

#### Clean Up WebSocket
```dart
@override
void dispose() {
  _messageSubscription?.cancel();
  _messagesService.closeWebSocket();
  _messageController.dispose();
  super.dispose();
}
```

---

## 6. Shop Home Screen Integration

### Changes Needed

#### Add Service Import
```dart
import '../services/product_service.dart';
```

#### Load Featured Products
```dart
class _ShopHomeScreenNewState extends State<ShopHomeScreenNew> {
  final _productService = ProductService();
  
  List<dynamic> _featuredProducts = [];
  List<dynamic> _categories = [];
  bool _isLoading = false;
  
  @override
  void initState() {
    super.initState();
    _loadData();
  }
  
  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    
    try {
      final featured = await _productService.getFeaturedProducts();
      final categories = await _productService.getCategories();
      
      setState(() {
        _featuredProducts = featured;
        _categories = categories;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      _showError(e.toString());
    }
  }
```

---

## 7. Main App Initialization

### Update main.dart

```dart
import 'package:flutter/material.dart';
import 'core/services/api_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize API service and load saved token
  final apiService = ApiService();
  await apiService.init();
  
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Mixillo',
      theme: ThemeData.light(),
      darkTheme: ThemeData.dark(),
      home: SplashScreen(), // Check auth and navigate
    );
  }
}
```

---

## 8. Create Splash Screen for Auth Check

### Create new file: `lib/core/screens/splash_screen.dart`

```dart
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../../features/feed/screens/feed_screen.dart';
import '../../features/auth/screens/login_screen.dart'; // You'll create this

class SplashScreen extends StatefulWidget {
  @override
  _SplashScreenState createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  final _apiService = ApiService();
  final _authService = AuthService();
  
  @override
  void initState() {
    super.initState();
    _checkAuth();
  }
  
  Future<void> _checkAuth() async {
    await Future.delayed(Duration(seconds: 2)); // Show splash
    
    try {
      // Try to get current user
      await _authService.getCurrentUser();
      
      // Success - user is logged in
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => FeedScreen()),
      );
    } catch (e) {
      // Failed - need to login
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => LoginScreen()),
      );
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Your app logo
            FlutterLogo(size: 100),
            SizedBox(height: 24),
            CircularProgressIndicator(),
          ],
        ),
      ),
    );
  }
}
```

---

## 9. Error Handling Utility

### Create: `lib/core/utils/error_handler.dart`

```dart
import 'package:flutter/material.dart';
import '../services/api_service.dart';

void handleApiError(BuildContext context, dynamic error, {VoidCallback? onRetry}) {
  String message = 'An error occurred';
  bool shouldLogout = false;
  
  if (error is ApiException) {
    if (error.statusCode == 401) {
      message = 'Session expired. Please login again.';
      shouldLogout = true;
    } else if (error.statusCode == 404) {
      message = 'Resource not found';
    } else if (error.statusCode == 429) {
      message = 'Too many requests. Please try again later.';
    } else {
      message = error.message;
    }
  } else {
    message = error.toString();
  }
  
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(message),
      backgroundColor: shouldLogout ? Colors.red : Colors.orange,
      action: onRetry != null
          ? SnackBarAction(
              label: 'RETRY',
              onPressed: onRetry,
            )
          : null,
    ),
  );
  
  if (shouldLogout) {
    // Navigate to login after showing error
    Future.delayed(Duration(seconds: 2), () {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (context) => LoginScreen()),
        (route) => false,
      );
    });
  }
}
```

---

## 10. Loading Widget Utility

### Create: `lib/core/widgets/loading_overlay.dart`

```dart
import 'package:flutter/material.dart';

class LoadingOverlay extends StatelessWidget {
  final bool isLoading;
  final Widget child;
  final String? message;
  
  const LoadingOverlay({
    Key? key,
    required this.isLoading,
    required this.child,
    this.message,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        child,
        if (isLoading)
          Container(
            color: Colors.black54,
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(),
                  if (message != null) ...[
                    SizedBox(height: 16),
                    Text(
                      message!,
                      style: TextStyle(color: Colors.white),
                    ),
                  ],
                ],
              ),
            ),
          ),
      ],
    );
  }
}
```

---

## Quick Integration Checklist

For each screen, follow these steps:

1. ☐ Import the relevant service(s)
2. ☐ Add service instance as class variable
3. ☐ Add `_isLoading` state variable
4. ☐ Replace mock data with empty list/null
5. ☐ Add load method in `initState()`
6. ☐ Implement async load method with try-catch
7. ☐ Update UI to show loading state
8. ☐ Add error handling with retry option
9. ☐ Update user actions to call API methods
10. ☐ Refresh data after mutations

---

## Testing Your Integration

1. **Start with Product Listing**
   - Easiest to test
   - Visual feedback immediate
   - Test filters and sorting

2. **Then Cart Operations**
   - Add to cart from product details
   - Update quantities in cart screen
   - Test checkout flow

3. **Then Messages**
   - Test loading conversations
   - Test sending messages
   - Verify WebSocket real-time updates

4. **Finally Authentication**
   - Test login flow
   - Test token persistence
   - Test token refresh on 401

---

## Common Issues & Solutions

### Issue: "Target of URI doesn't exist"
**Solution**: Check import paths are correct relative to file location

### Issue: "Undefined class ApiService"
**Solution**: Ensure `api_service.dart` is created and path is correct

### Issue: "setState called after dispose"
**Solution**: Check widget is mounted before setState:
```dart
if (mounted) {
  setState(() { /* ... */ });
}
```

### Issue: WebSocket not connecting
**Solution**: 
1. Check token is valid
2. Verify WebSocket URL in `api_config.dart`
3. Check backend WebSocket server is running

### Issue: API calls timing out
**Solution**: Increase timeout in `api_config.dart`:
```dart
static const Duration receiveTimeout = Duration(seconds: 60);
```

---

## Next Steps

1. ✅ Created all service files
2. ⏭️ Add dependencies to `pubspec.yaml`
3. ⏭️ Update backend URL in `api_config.dart`
4. ⏭️ Follow this guide to update each screen
5. ⏭️ Test with real backend
6. ⏭️ Add state management (Provider/Riverpod) for better scalability

**You're ready to transform your app from UI demo to fully functional!**
