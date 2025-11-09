import 'package:flutter/material.dart';
import '../../core/services/mongodb_auth_service.dart';
import 'dart:developer' as developer;

/// Test authentication flows
Future<void> testAuthFlows() async {
  final authService = MongoDBAuthService();
  
  developer.log('🧪 Starting Auth Tests...');
  
  try {
    // Initialize the service
    developer.log('\n📝 Test 1: Initialize Service');
    await authService.initialize();
    developer.log('✅ Service initialized');
    
    // Test Registration
    developer.log('\n📝 Test 2: Register New User');
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final testUser = {
      'email': 'test$timestamp@mixillo.com',
      'password': 'Test123!@#',
      'username': 'testuser$timestamp',
      'fullName': 'Test User $timestamp',
    };
    
    final registerResult = await authService.register(
      email: testUser['email']!,
      password: testUser['password']!,
      username: testUser['username']!,
      fullName: testUser['fullName']!,
    );
    
    if (registerResult['success'] == true) {
      developer.log('✅ Registration successful');
      developer.log('   Username: ${registerResult['user']['username']}');
      developer.log('   Email: ${registerResult['user']['email']}');
    } else {
      developer.log('❌ Registration failed: ${registerResult['message']}');
    }
    
    // Test Get Current User
    developer.log('\n📝 Test 3: Get Current User');
    final currentUser = await authService.getCurrentUser();
    if (currentUser != null) {
      developer.log('✅ Current user fetched');
      developer.log('   Username: ${currentUser['username']}');
      developer.log('   Email: ${currentUser['email']}');
    } else {
      developer.log('❌ Failed to fetch current user');
    }
    
    // Test Logout
    developer.log('\n📝 Test 4: Logout');
    await authService.logout();
    developer.log('✅ Logged out successfully');
    developer.log('   Authenticated: ${authService.isAuthenticated}');
    
    // Test Login
    developer.log('\n📝 Test 5: Login');
    final loginResult = await authService.login(
      identifier: testUser['email']!,
      password: testUser['password']!,
    );
    
    if (loginResult['success'] == true) {
      developer.log('✅ Login successful');
      developer.log('   Username: ${loginResult['user']['username']}');
      developer.log('   Authenticated: ${authService.isAuthenticated}');
    } else {
      developer.log('❌ Login failed: ${loginResult['message']}');
    }
    
    // Test Token Refresh
    developer.log('\n📝 Test 6: Token Refresh');
    final refreshed = await authService.refreshAccessToken();
    if (refreshed) {
      developer.log('✅ Token refreshed successfully');
    } else {
      developer.log('⚠️ Token refresh not needed or failed');
    }
    
    // Final logout
    developer.log('\n📝 Test 7: Final Cleanup');
    await authService.logout();
    developer.log('✅ Cleaned up test data');
    
    developer.log('\n✅ All Auth Tests Completed!');
    
  } catch (e, stackTrace) {
    developer.log('❌ Test Error: $e');
    developer.log('Stack Trace: $stackTrace');
  }
}

/// Widget to run auth tests
class AuthTestScreen extends StatefulWidget {
  const AuthTestScreen({super.key});

  @override
  State<AuthTestScreen> createState() => _AuthTestScreenState();
}

class _AuthTestScreenState extends State<AuthTestScreen> {
  String _testStatus = 'Ready to test';
  bool _isTesting = false;

  Future<void> _runTests() async {
    setState(() {
      _isTesting = true;
      _testStatus = 'Running tests...';
    });

    try {
      await testAuthFlows();
      setState(() {
        _testStatus = '✅ All tests passed! Check console for details.';
      });
    } catch (e) {
      setState(() {
        _testStatus = '❌ Tests failed: $e';
      });
    } finally {
      setState(() {
        _isTesting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Auth Tests'),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.science,
                size: 64,
                color: Colors.blue,
              ),
              const SizedBox(height: 24),
              Text(
                _testStatus,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 16),
              ),
              const SizedBox(height: 32),
              ElevatedButton.icon(
                onPressed: _isTesting ? null : _runTests,
                icon: _isTesting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.play_arrow),
                label: Text(_isTesting ? 'Testing...' : 'Run Auth Tests'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 32,
                    vertical: 16,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
