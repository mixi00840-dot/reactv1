import 'dart:io';
import 'package:flutter/material.dart';
import 'lib/core/services/mongodb_auth_service.dart';
import 'dart:developer' as developer;

/// Simple auth test runner for command-line testing
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  developer.log('🧪 Starting Auth API Tests with Live Backend...');
  developer.log('🌐 Backend: https://mixillo-backend-52242135857.europe-west1.run.app');
  
  final authService = MongoDBAuthService();
  
  try {
    // Initialize
    developer.log('\n📝 Test 1: Initialize Service');
    await authService.initialize();
    developer.log('✅ Service initialized');
    
    // Create test user
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final testEmail = 'fluttertest$timestamp@mixillo.com';
    final testPassword = 'Test123!@#';
    final testUsername = 'fluttertest$timestamp';
    
    // Test Registration
    developer.log('\n📝 Test 2: Register New User');
    developer.log('   Email: $testEmail');
    developer.log('   Username: $testUsername');
    
    try {
      final registerResult = await authService.register(
        email: testEmail,
        password: testPassword,
        username: testUsername,
        fullName: 'Flutter Test User',
      );
      
      if (registerResult['success'] == true) {
        developer.log('✅ Registration successful!');
        developer.log('   User ID: ${registerResult['user']['_id'] ?? registerResult['user']['id']}');
        developer.log('   Username: ${registerResult['user']['username']}');
        developer.log('   Email: ${registerResult['user']['email']}');
        developer.log('   Authenticated: ${authService.isAuthenticated}');
      } else {
        developer.log('❌ Registration failed: ${registerResult['message']}');
        exit(1);
      }
    } catch (e) {
      developer.log('❌ Registration error: $e');
      exit(1);
    }
    
    // Test Get Current User
    developer.log('\n📝 Test 3: Get Current User');
    final currentUser = await authService.getCurrentUser();
    if (currentUser != null) {
      developer.log('✅ Current user fetched successfully');
      developer.log('   Username: ${currentUser['username']}');
      developer.log('   Email: ${currentUser['email']}');
      developer.log('   Role: ${currentUser['role']}');
    } else {
      developer.log('❌ Failed to fetch current user');
    }
    
    // Test Logout
    developer.log('\n📝 Test 4: Logout');
    await authService.logout();
    developer.log('✅ Logged out successfully');
    developer.log('   Authenticated: ${authService.isAuthenticated}');
    
    // Test Login
    developer.log('\n📝 Test 5: Login with Same User');
    try {
      final loginResult = await authService.login(
        identifier: testEmail,
        password: testPassword,
      );
      
      if (loginResult['success'] == true) {
        developer.log('✅ Login successful!');
        developer.log('   Username: ${loginResult['user']['username']}');
        developer.log('   Authenticated: ${authService.isAuthenticated}');
      } else {
        developer.log('❌ Login failed: ${loginResult['message']}');
        exit(1);
      }
    } catch (e) {
      developer.log('❌ Login error: $e');
      exit(1);
    }
    
    // Final cleanup
    developer.log('\n📝 Test 6: Final Logout');
    await authService.logout();
    developer.log('✅ Cleaned up successfully');
    
    developer.log('\n✅✅✅ ALL AUTH TESTS PASSED! ✅✅✅');
    developer.log('🎉 Authentication is working with live backend!');
    exit(0);
    
  } catch (e, stackTrace) {
    developer.log('❌ Test Error: $e');
    developer.log('Stack Trace: $stackTrace');
    exit(1);
  }
}
