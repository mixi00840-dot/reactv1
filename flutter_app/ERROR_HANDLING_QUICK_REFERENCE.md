# Error Handling Quick Reference Guide

## For Developers: How to Use the New Error Handling System

### 1. Using Error Widgets in Pages

#### ErrorRetryWidget (Most Common)
Use for any error that can be retried:

```dart
productsAsync.when(
  data: (products) => ProductGrid(products),
  loading: () => LoadingWidget(),
  error: (error, stack) => ErrorRetryWidget(
    message: error.toString(),
    onRetry: () {
      ref.invalidate(myProvider);
    },
  ),
);
```

**With Custom Title and Icon:**
```dart
ErrorRetryWidget(
  title: 'Products Not Found',
  message: error.toString(),
  icon: Icons.shopping_bag_outlined,
  buttonText: 'Try Again',
  onRetry: () { /* ... */ },
)
```

#### NetworkErrorIndicator
Use specifically for network errors:

```dart
error: (error, stack) {
  if (error is NetworkException) {
    return NetworkErrorIndicator(
      onRetry: () {
        ref.invalidate(myProvider);
      },
    );
  }
  return ErrorRetryWidget(message: error.toString(), onRetry: () { /* ... */ });
}
```

#### ServerErrorIndicator
Use specifically for server errors:

```dart
error: (error, stack) {
  if (error is ServerException) {
    return ServerErrorIndicator(
      errorMessage: error.message,
      onRetry: () {
        ref.invalidate(myProvider);
      },
    );
  }
  return ErrorRetryWidget(message: error.toString(), onRetry: () { /* ... */ });
}
```

#### LoadingWidget
Use for loading states:

```dart
loading: () => LoadingWidget(),

// Or with custom message
loading: () => LoadingWidget(message: 'Loading products...'),

// In RefreshIndicator
if (isRefreshing) LoadingWidget(message: 'Refreshing...')
```

#### EmptyStateWidget
Use when data is empty:

```dart
if (products.isEmpty) {
  return EmptyStateWidget(
    icon: Icons.shopping_bag_outlined,
    title: 'No Products Found',
    message: 'Try adjusting your filters or search terms',
    action: TextButton(
      onPressed: () { /* clear filters */ },
      child: Text('Clear Filters'),
    ),
  );
}
```

### 2. API Service Error Handling

#### Using safeApiCall
Wrap all API calls with `safeApiCall()`:

```dart
Future<List<ProductModel>> getProducts() async {
  return safeApiCall(() async {
    final response = await dio.get('/products');
    return (response.data as List)
        .map((json) => ProductModel.fromJson(json))
        .toList();
  });
}
```

**Benefits:**
- Automatic network check before request
- Consistent error handling
- User-friendly error messages
- Custom exception preservation

#### Custom Exception Handling
You can throw custom exceptions that will be preserved:

```dart
Future<ProductModel> getProductDetails(String id) async {
  return safeApiCall(() async {
    if (id.isEmpty) {
      throw ClientException('Product ID is required');
    }
    
    final response = await dio.get('/products/$id');
    
    if (response.data == null) {
      throw ParseException('Invalid product data received');
    }
    
    return ProductModel.fromJson(response.data);
  });
}
```

### 3. Offline Caching

#### Save to Cache
```dart
import '../utils/cache_manager.dart';

// After successful API call
final products = await getProducts();
await CacheManager.saveToCache(
  key: 'featured_products',
  data: products.map((p) => p.toJson()).toList(),
  expiration: Duration(minutes: 30), // optional, defaults to 1 hour
);
```

#### Load from Cache
```dart
// Try cache first, then API
try {
  final cached = await CacheManager.getFromCache<List>(
    key: 'featured_products',
  );
  
  if (cached != null) {
    return cached.map((json) => ProductModel.fromJson(json)).toList();
  }
  
  // Cache miss or expired, fetch from API
  return await getProducts();
} catch (e) {
  throw CacheException('Failed to load products: $e');
}
```

#### Clear Cache
```dart
// Clear specific cache
await CacheManager.clearCache('featured_products');

// Clear all caches (e.g., on logout)
await CacheManager.clearAllCaches();

// Check if cache is valid
final isValid = await CacheManager.isCacheValid('featured_products');
if (!isValid) {
  // Fetch fresh data
}
```

### 4. Network Status Detection

#### Using networkStatusProvider
The network status is already available app-wide:

```dart
final isOnline = ref.watch(networkStatusProvider);

return isOnline.when(
  data: (online) {
    if (!online) {
      return NetworkErrorIndicator(onRetry: () { /* ... */ });
    }
    return MyContent();
  },
  loading: () => LoadingWidget(),
  error: (_, __) => MyContent(), // Assume online on error
);
```

#### Manual Network Check
```dart
import '../utils/network_utils.dart';

final hasInternet = await NetworkUtils.hasInternetConnection();
if (!hasInternet) {
  throw NetworkException('No internet connection');
}

// Check connection type
final isWiFi = await NetworkUtils.isConnectedToWiFi();
final isMobile = await NetworkUtils.isConnectedToMobile();
```

#### Listen to Network Changes
```dart
NetworkUtils.onConnectivityChanged.listen((result) {
  if (result == ConnectivityResult.none) {
    // Show offline message
  } else {
    // Retry failed requests
  }
});
```

### 5. Exception Types Reference

```dart
import '../utils/api_exceptions.dart';

try {
  final data = await apiCall();
} on NetworkException catch (e) {
  // No internet connection
  print('Network error: ${e.message}');
} on AuthException catch (e) {
  // 401/403 errors - redirect to login
  print('Auth error: ${e.message}');
  navigateToLogin();
} on ServerException catch (e) {
  // 5xx errors - show server error
  print('Server error: ${e.message}');
} on ClientException catch (e) {
  // 4xx errors - show client error
  print('Client error: ${e.message}');
} on TimeoutException catch (e) {
  // Connection timeout
  print('Timeout: ${e.message}');
} on ParseException catch (e) {
  // JSON parsing error
  print('Parse error: ${e.message}');
} on CacheException catch (e) {
  // Cache read/write error
  print('Cache error: ${e.message}');
} on ApiException catch (e) {
  // Generic API error
  print('API error: ${e.message}');
}
```

### 6. Common Patterns

#### Loading + Error + Data Pattern
```dart
final productsAsync = ref.watch(featuredProductsProvider);

return productsAsync.when(
  data: (products) {
    if (products.isEmpty) {
      return EmptyStateWidget(
        message: 'No products available',
      );
    }
    return ProductGrid(products: products);
  },
  loading: () => LoadingWidget(message: 'Loading products...'),
  error: (error, stack) => ErrorRetryWidget(
    message: error.toString(),
    onRetry: () {
      ref.invalidate(featuredProductsProvider);
    },
  ),
);
```

#### Refresh with Loading State
```dart
Future<void> _refresh() async {
  setState(() => _isRefreshing = true);
  try {
    await ref.read(productsProvider.notifier).loadProducts();
  } finally {
    if (mounted) {
      setState(() => _isRefreshing = false);
    }
  }
}

// In build
if (_isRefreshing) {
  return LoadingWidget(message: 'Refreshing...');
}
```

#### Optimistic Updates with Error Handling
```dart
Future<void> addToCart(ProductModel product) async {
  // Optimistically update UI
  final previousCart = ref.read(cartStateProvider);
  ref.read(cartStateProvider.notifier).addItem(product);
  
  try {
    await ref.read(cartApiServiceProvider).addToCart(product.id);
  } catch (e) {
    // Revert on error
    ref.read(cartStateProvider.notifier).setState(previousCart);
    
    // Show error
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to add to cart: $e'),
          action: SnackBarAction(
            label: 'Retry',
            onPressed: () => addToCart(product),
          ),
        ),
      );
    }
  }
}
```

### 7. Testing Error Scenarios

#### Test Network Errors
```dart
// Turn off WiFi/mobile data
// App should show:
// - Red banner at top: "No internet connection"
// - NetworkErrorIndicator on pages
// - Retry button should work when connection restored
```

#### Test Server Errors
```dart
// Use mock API that returns 500 status
// App should show:
// - ServerErrorIndicator with cloud_off icon
// - User-friendly "Server error" message
// - Retry button
```

#### Test Timeout
```dart
// Use mock API with delayed response (>30s)
// App should show:
// - "Connection timeout" error message
// - Retry button
```

#### Test Invalid Data
```dart
// Use mock API that returns invalid JSON
// App should show:
// - "Failed to parse response" message
// - Retry button or graceful fallback
```

## Best Practices

1. **Always use safeApiCall()**: Wrap all API calls for consistent error handling
2. **Use appropriate error widgets**: NetworkErrorIndicator for network, ServerErrorIndicator for server, ErrorRetryWidget for generic
3. **Provide retry functionality**: Always give users a way to retry failed operations
4. **Cache strategically**: Cache frequently accessed, slowly changing data
5. **Clear error messages**: Use user-friendly language, avoid technical jargon
6. **Test offline scenarios**: Ensure app works gracefully without internet
7. **Handle edge cases**: Empty states, slow connections, partial failures
8. **Log errors**: Use proper logging for debugging production issues

## Troubleshooting

### Error Widget Not Showing
- Check if import is added: `import '../widgets/error_widgets.dart';`
- Verify error is being thrown from provider
- Check AsyncValue.error case in when() method

### Network Banner Not Appearing
- Verify NetworkStatusIndicator wraps app in main.dart
- Check connectivity_plus package is in pubspec.yaml
- Test by turning off WiFi/mobile data

### Retry Not Working
- Verify ref.invalidate() is called for correct provider
- Check provider is not cached indefinitely
- Ensure onRetry callback is properly connected

### Cache Not Working
- Verify SharedPreferences is properly initialized
- Check cache key matches between save and retrieve
- Ensure data is JSON-serializable
- Check expiration duration is not too short

---

**Note**: This error handling system is designed to provide a great user experience even when things go wrong. Always test error scenarios to ensure your app handles them gracefully!
