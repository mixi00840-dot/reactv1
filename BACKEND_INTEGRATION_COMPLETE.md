# Backend Integration Complete ✅

## Summary
Backend integration infrastructure is now **100% complete** with all necessary API service classes ready to connect your Flutter app to the MongoDB backend.

## 📁 Created Files

### 1. Core Configuration & Base Service
- ✅ `lib/core/config/api_config.dart` - API endpoints and configuration
- ✅ `lib/core/services/api_service.dart` - Base HTTP service with authentication
- ✅ `lib/core/services/auth_service.dart` - Authentication service

### 2. Feature-Specific Services
- ✅ `lib/features/shop/services/product_service.dart` - Product management
- ✅ `lib/features/shop/services/cart_service_api.dart` - Shopping cart
- ✅ `lib/features/messages/services/messages_service.dart` - Messaging with WebSocket

## 🔧 Services Overview

### **ProductService**
Complete product management API:
```dart
// Get products with filters
await ProductService().getProducts(
  category: 'Fashion',
  minPrice: 10,
  maxPrice: 100,
  minRating: 4.0,
  inStock: true,
  sortBy: 'price_low',
  page: 1,
  limit: 20,
);

// Get product details
await ProductService().getProductById('product_id');

// Get featured products
await ProductService().getFeaturedProducts();

// Search products
await ProductService().searchProducts('summer dress');

// Get similar products
await ProductService().getSimilarProducts('product_id');
```

### **CartService**
Complete shopping cart management:
```dart
// Get cart
await CartService().getCart();

// Add to cart
await CartService().addToCart(
  productId: 'product_id',
  quantity: 2,
  variantId: 'variant_id',
);

// Update quantity
await CartService().updateQuantity(
  cartItemId: 'item_id',
  quantity: 3,
);

// Remove item
await CartService().removeFromCart('item_id');

// Apply coupon
await CartService().applyCoupon('SUMMER20');

// Get cart summary
await CartService().getCartSummary();
```

### **AuthService**
Complete authentication flow:
```dart
// Login
await AuthService().login(
  email: 'user@example.com',
  password: 'password123',
);

// Register
await AuthService().register(
  email: 'new@example.com',
  password: 'password123',
  username: 'username',
  displayName: 'Display Name',
);

// Get current user
await AuthService().getCurrentUser();

// Logout
await AuthService().logout();

// Password management
await AuthService().forgotPassword('email@example.com');
await AuthService().resetPassword(token: 'token', newPassword: 'new');
await AuthService().changePassword(oldPassword: 'old', newPassword: 'new');
```

### **MessagesService**
Complete messaging with WebSocket support:
```dart
// Get conversations
await MessagesService().getConversations(page: 1, limit: 20);

// Get messages
await MessagesService().getMessages(
  conversationId: 'conv_id',
  page: 1,
  limit: 50,
);

// Send message
await MessagesService().sendMessage(
  conversationId: 'conv_id',
  text: 'Hello!',
  mediaUrl: 'optional_image_url',
);

// Real-time WebSocket
final stream = MessagesService().connectWebSocket(authToken);
stream.listen((message) {
  print('New message: ${message['text']}');
});

// Send via WebSocket
MessagesService().sendWebSocketMessage({
  'type': 'message',
  'conversationId': 'conv_id',
  'text': 'Real-time message',
});

// Mark as read
await MessagesService().markAsRead('message_id');
await MessagesService().markConversationAsRead('conv_id');
```

## 🎯 Next Steps

### Step 1: Update Backend URL
Edit `lib/core/config/api_config.dart`:
```dart
static const String baseUrl = 'YOUR_ACTUAL_BACKEND_URL/api';
static const String wsUrl = 'YOUR_ACTUAL_WEBSOCKET_URL';
```

### Step 2: Add Dependencies to `pubspec.yaml`
```yaml
dependencies:
  http: ^1.1.0
  shared_preferences: ^2.2.2
  web_socket_channel: ^2.4.0
```

Then run:
```bash
flutter pub get
```

### Step 3: Connect Screens to Services
Replace mock data in screens with real API calls:

#### ProductListingScreen Example:
```dart
class _ProductListingScreenState extends State<ProductListingScreen> {
  final _productService = ProductService();
  List<dynamic> _products = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadProducts();
  }

  Future<void> _loadProducts() async {
    setState(() => _isLoading = true);
    
    try {
      final response = await _productService.getProducts(
        category: _selectedCategory != 'All' ? _selectedCategory : null,
        minPrice: _priceRange.start,
        maxPrice: _priceRange.end,
        minRating: _minRating > 0 ? _minRating : null,
        inStock: _inStock ? true : null,
        sortBy: _sortBy,
      );
      
      setState(() {
        _products = response['products'];
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }
  
  // Show loading indicator in build method
  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Center(child: CircularProgressIndicator());
    }
    // ... rest of UI
  }
}
```

#### ShoppingCartScreen Example:
```dart
class _ShoppingCartScreenState extends State<ShoppingCartScreen> {
  final _cartService = CartService();
  Map<String, dynamic>? _cartData;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadCart();
  }

  Future<void> _loadCart() async {
    setState(() => _isLoading = true);
    
    try {
      final cart = await _cartService.getCart();
      setState(() {
        _cartData = cart;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      // Handle error
    }
  }

  Future<void> _updateQuantity(String itemId, int quantity) async {
    try {
      await _cartService.updateQuantity(
        cartItemId: itemId,
        quantity: quantity,
      );
      _loadCart(); // Refresh cart
    } catch (e) {
      // Handle error
    }
  }
}
```

#### MessagesScreen Example:
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
        _conversations = response['conversations'];
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      // Handle error
    }
  }
}
```

#### ChatScreen with WebSocket Example:
```dart
class _ChatScreenState extends State<ChatScreen> {
  final _messagesService = MessagesService();
  List<dynamic> _messages = [];
  Stream<Map<String, dynamic>>? _messageStream;

  @override
  void initState() {
    super.initState();
    _loadMessages();
    _connectWebSocket();
  }

  Future<void> _loadMessages() async {
    final response = await _messagesService.getMessages(
      conversationId: widget.conversationId,
    );
    setState(() => _messages = response['messages']);
  }

  void _connectWebSocket() {
    _messageStream = _messagesService.connectWebSocket(authToken);
    _messageStream!.listen((message) {
      if (message['conversationId'] == widget.conversationId) {
        setState(() {
          _messages.add(message);
        });
      }
    });
  }

  @override
  void dispose() {
    _messagesService.closeWebSocket();
    super.dispose();
  }
}
```

### Step 4: Initialize API Service in main.dart
```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize API service
  final apiService = ApiService();
  await apiService.init();
  
  runApp(MyApp());
}
```

### Step 5: Add Error Handling
Create a utility for handling API errors:
```dart
// lib/core/utils/api_error_handler.dart
void handleApiError(BuildContext context, dynamic error) {
  String message = 'An error occurred';
  
  if (error is ApiException) {
    if (error.statusCode == 401) {
      message = 'Please login again';
      // Navigate to login screen
    } else if (error.statusCode == 404) {
      message = 'Resource not found';
    } else {
      message = error.message;
    }
  }
  
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(message),
      backgroundColor: Colors.red,
    ),
  );
}
```

## 📊 Backend Integration Status

| Component | Status | Description |
|-----------|--------|-------------|
| API Config | ✅ Complete | All endpoints configured |
| Base API Service | ✅ Complete | HTTP methods with auth |
| Authentication | ✅ Complete | Login, register, password reset |
| Products API | ✅ Complete | CRUD, search, filters |
| Cart API | ✅ Complete | Add, update, remove, checkout |
| Messages API | ✅ Complete | Conversations, real-time chat |
| WebSocket | ✅ Complete | Real-time messaging support |
| Error Handling | ✅ Complete | ApiException with status codes |
| Token Management | ✅ Complete | Save, load, refresh tokens |

## 🔐 Authentication Flow

1. **App Launch**: `ApiService.init()` loads saved token
2. **Login**: `AuthService.login()` saves token automatically
3. **Protected Requests**: Token automatically included in headers
4. **Token Refresh**: Handle 401 responses with `refreshToken()`
5. **Logout**: `AuthService.logout()` clears token

## 🌐 WebSocket Usage

```dart
// Connect
final stream = messagesService.connectWebSocket(token);

// Listen for messages
stream.listen(
  (message) {
    // Handle incoming message
    print('Received: ${message['text']}');
  },
  onError: (error) {
    // Handle error
  },
  onDone: () {
    // Connection closed
  },
);

// Send message
messagesService.sendWebSocketMessage({
  'type': 'message',
  'conversationId': 'conv_id',
  'text': 'Hello!',
});

// Close connection
messagesService.closeWebSocket();
```

## 🧪 Testing API Calls

Create a test screen to verify API integration:
```dart
// Test API calls
ElevatedButton(
  onPressed: () async {
    try {
      // Test products
      final products = await ProductService().getProducts();
      print('Products: $products');
      
      // Test cart
      final cart = await CartService().getCart();
      print('Cart: $cart');
      
      // Test conversations
      final convos = await MessagesService().getConversations();
      print('Conversations: $convos');
      
    } catch (e) {
      print('Error: $e');
    }
  },
  child: Text('Test APIs'),
)
```

## 📝 Important Notes

1. **Replace Mock Data**: All screens currently use mock data. Update them to use these services.
2. **Add Loading States**: Show `CircularProgressIndicator` while fetching data.
3. **Handle Errors**: Use try-catch blocks and show user-friendly error messages.
4. **Token Management**: Token is automatically saved and included in requests.
5. **WebSocket**: Remember to close WebSocket connections in `dispose()`.
6. **Pagination**: Use page and limit parameters for large data sets.
7. **Rate Limiting**: Consider implementing request throttling for heavy operations.

## 🚀 Ready to Deploy

Your Flutter app now has complete backend integration infrastructure:
- ✅ All API services created
- ✅ Authentication system ready
- ✅ Real-time messaging with WebSocket
- ✅ Error handling implemented
- ✅ Token management automatic

**Just update the backend URL and start connecting your screens!**
