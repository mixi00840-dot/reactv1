# Flutter App Fix Plan - 548 Errors Remaining

## Current Progress
- ✅ Created User model with freezed
- ✅ Fixed AuthService (added getCurrentUser, register, updateProfile)
- ✅ Fixed auth_provider imports and Map->User conversion
- ✅ Fixed providers.dart import paths
- ✅ Generated freezed code
- **Errors: 580 → 548 (32 fixed)**

## Remaining Error Categories

### 1. User Model Freezed Issues (27 errors)
**Problem**: User model has annotation conflicts
**Files**: `lib/core/models/user_model.dart`
**Fix**: Remove @JsonKey from class parameter, keep it only on class field

```dart
// WRONG:
const factory User({
  @JsonKey(name: '_id') required String id,  // ❌ Conflict
  required String username,
}) = _User;

// CORRECT:
const factory User({
  required String id,
  required String username,
}) = _User;

// Add JsonKey in fromJson factory or use @JsonKey above class
@JsonKey(name: '_id')
```

### 2. ProviderObserver Import Missing (6 errors)
**Problem**: ProviderObserver, ProviderBase, ProviderContainer not imported
**Files**: `lib/core/providers/providers.dart`
**Fix**: Add proper riverpod imports

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ProviderLogger extends ProviderObserver {
  // ... existing code
}
```

### 3. Missing Presentation Pages (~100 errors)
**Problem**: Router imports pages that don't exist
**Files**: `lib/core/routing/router.dart`
**Missing Pages**:
- messages_list_page.dart
- notification_settings_page.dart
- wallet_page.dart
- transaction_history_page.dart
- top_up_page.dart
- cart_page.dart
- orders_page.dart
- product_list_page.dart
- analytics_page.dart
- scheduled_posts_page.dart
- schedule_post_page.dart

**Fix Strategy**:
1. Create stub pages for each missing page
2. Each page should follow this template:

```dart
import 'package:flutter/material.dart';

class WalletPage extends StatelessWidget {
  const WalletPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Wallet')),
      body: const Center(
        child: Text('Wallet Page - Coming Soon'),
      ),
    );
  }
}
```

### 4. Socket Provider Method Missing (1 error)
**Problem**: `onConnecting` method doesn't exist in Socket
**File**: `lib/core/providers/socket_provider.dart:47`
**Fix**: Replace with proper socket_io_client method

```dart
// WRONG:
socket.onConnecting(() => {});

// CORRECT:
socket.onConnect(() => {});
socket.onDisconnect(() => {});
```

### 5. Theme Provider Type Error (2 errors)
**Problem**: CardTheme vs CardThemeData type mismatch
**File**: `lib/core/providers/theme_provider.dart:63,91`
**Fix**: Use CardTheme.of(context) or proper CardThemeData constructor

```dart
// WRONG:
cardTheme: CardTheme(...)

// CORRECT:
cardTheme: const CardThemeData(...)
```

### 6. Missing Provider Implementations (~400 errors)
**Problem**: Many provider files exist but may have undefined providers
**Files**: All feature provider files
**Fix Strategy**:
1. Check each provider file for correct exports
2. Ensure all providers are defined with proper syntax
3. Example pattern:

```dart
// In features/wallet/providers/wallet_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/wallet_service.dart';
import '../data/wallet_model.dart';

final walletProvider = FutureProvider<Wallet>((ref) async {
  final service = WalletService();
  return await service.getWallet();
});

final walletBalanceProvider = Provider<double>((ref) {
  final walletAsync = ref.watch(walletProvider);
  return walletAsync.when(
    data: (wallet) => wallet.balance,
    loading: () => 0.0,
    error: (_, __) => 0.0,
  );
});
```

## Systematic Fix Order

### Phase 1: Core Fixes (Priority 1) - 36 errors
1. ✅ Fix User model freezed annotations
2. ✅ Fix ProviderObserver imports
3. ✅ Fix Socket provider onConnecting method
4. ✅ Fix Theme provider CardTheme issues

### Phase 2: Create Missing Pages (Priority 2) - 100 errors
1. Create all missing presentation pages as stubs
2. Add proper routing
3. Ensure all imports work

### Phase 3: Fix Provider Implementations (Priority 3) - 400 errors
1. Audit each provider file
2. Ensure all referenced providers are defined
3. Fix import paths
4. Add missing models/services

### Phase 4: Integration Testing (Priority 4)
1. Run flutter analyze
2. Fix any remaining errors
3. Test app compilation
4. Test basic navigation

## Quick Win Commands

### Check specific error types:
```powershell
# Check freezed errors
flutter analyze 2>&1 | Select-String "user_model"

# Check provider errors
flutter analyze 2>&1 | Select-String "provider"

# Check import errors
flutter analyze 2>&1 | Select-String "uri_does_not_exist"

# Check undefined errors
flutter analyze 2>&1 | Select-String "undefined"
```

### Generate code after fixes:
```powershell
flutter pub run build_runner build --delete-conflicting-outputs
```

### Count remaining errors:
```powershell
flutter analyze 2>&1 | Select-String "error" | Measure-Object
```

## Backend API Mapping Status

### ✅ Completed Mappings:
- Auth endpoints (/auth/mongodb/login, /auth/mongodb/register)
- User endpoints (/users/:id)

### ⏳ Needs Mapping:
- Content endpoints (/api/content/*)
- Product endpoints (/api/products/*)
- Wallet endpoints (/api/wallet/*)
- Cart endpoints (/api/cart/*)
- Order endpoints (/api/orders/*)
- Live streaming endpoints (/api/live/*)
- Messages endpoints (/api/messages/*)
- Notifications endpoints (/api/notifications/*)

## Next Steps

1. **Immediate**: Fix Phase 1 core issues (36 errors)
2. **Short-term**: Create missing page stubs (100 errors)
3. **Medium-term**: Audit and fix all provider files (400 errors)
4. **Long-term**: Complete backend API integration

## Notes
- Do NOT remove any mock/fake/dummy data - these are placeholders
- All screens/features must match backend API structure
- Focus on reducing errors systematically, not adding features yet
- Each fix should be tested with `flutter analyze` before moving to next
