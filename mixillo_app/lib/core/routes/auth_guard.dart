import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../features/auth/providers/mongodb_auth_provider.dart';

/// Auth redirect logic for route protection
/// Redirects unauthenticated users to login screen
String? authGuard(BuildContext context, GoRouterState state) {
  final authProvider = context.read<MongoDBAuthProvider>();
  final isAuthenticated = authProvider.isAuthenticated;
  
  // Allow access to auth routes without authentication
  final isAuthRoute = state.matchedLocation.startsWith('/login') ||
      state.matchedLocation.startsWith('/register') ||
      state.matchedLocation.startsWith('/auth/') ||
      state.matchedLocation.startsWith('/splash') ||
      state.matchedLocation.startsWith('/walkthrough') ||
      state.matchedLocation.startsWith('/onboarding/');
  
  // If not authenticated and trying to access protected route
  if (!isAuthenticated && !isAuthRoute) {
    // Save the intended destination to redirect after login
    return '/login?redirect=${Uri.encodeComponent(state.matchedLocation)}';
  }
  
  // If authenticated and trying to access auth routes, redirect to main
  if (isAuthenticated && isAuthRoute) {
    return '/main';
  }
  
  // Allow access
  return null;
}

/// List of routes that require authentication
const List<String> protectedRoutes = [
  '/main',
  '/upload',
  '/profile',
  '/settings',
  '/wallet',
  '/messages',
  '/shop',
  '/pk-battle',
  '/stories',
];

/// Check if a route requires authentication
bool isProtectedRoute(String path) {
  return protectedRoutes.any((route) => path.startsWith(route));
}
