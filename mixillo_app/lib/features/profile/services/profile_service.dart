import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'dart:io';
import '../models/user_settings_model.dart';
import '../models/seller_application_model.dart';
import '../models/activity_model.dart';
import '../models/wallet_model.dart';
import '../models/conversation_model.dart';

class ProfileService {
  final Dio _dio;
  final FlutterSecureStorage _storage;
  static const String baseUrl = 'http://localhost:5000/api';

  ProfileService({Dio? dio, FlutterSecureStorage? storage})
      : _dio = dio ?? Dio(),
        _storage = storage ?? const FlutterSecureStorage() {
    _setupInterceptors();
  }

  void _setupInterceptors() {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'auth_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (DioException error, handler) async {
        if (error.response?.statusCode == 401) {
          // Token refresh logic here
        }
        return handler.next(error);
      },
    ));
  }

  // Settings APIs
  Future<UserSettings> getUserSettings() async {
    try {
      final response = await _dio.get('$baseUrl/users/settings');
      return UserSettings.fromJson(response.data);
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<UserSettings> updateUserSettings(UserSettings settings) async {
    try {
      final response = await _dio.put(
        '$baseUrl/users/settings',
        data: settings.toJson(),
      );
      return UserSettings.fromJson(response.data);
    } catch (e) {
      throw _handleError(e);
    }
  }

  // Seller Application APIs
  Future<SellerApplication?> getSellerStatus() async {
    try {
      final response = await _dio.get('$baseUrl/sellers/status');
      if (response.data == null) return null;
      return SellerApplication.fromJson(response.data);
    } catch (e) {
      if (e is DioException && e.response?.statusCode == 404) {
        return null; // No application yet
      }
      throw _handleError(e);
    }
  }

  Future<SellerApplication> submitSellerApplication({
    required String businessName,
    required String businessType,
    required String businessDescription,
    required Map<String, dynamic> businessAddress,
    required String phoneNumber,
    required String email,
    required List<File> documents,
  }) async {
    try {
      final formData = FormData.fromMap({
        'businessName': businessName,
        'businessType': businessType,
        'businessDescription': businessDescription,
        'businessAddress': businessAddress,
        'phoneNumber': phoneNumber,
        'email': email,
      });

      // Add document files
      for (var i = 0; i < documents.length; i++) {
        formData.files.add(MapEntry(
          'documents',
          await MultipartFile.fromFile(
            documents[i].path,
            filename: documents[i].path.split('/').last,
          ),
        ));
      }

      final response = await _dio.post(
        '$baseUrl/sellers/apply',
        data: formData,
      );
      return SellerApplication.fromJson(response.data);
    } catch (e) {
      throw _handleError(e);
    }
  }

  // Inbox/Messages APIs
  Future<List<Conversation>> getConversations() async {
    try {
      final response = await _dio.get('$baseUrl/messaging/conversations');
      return (response.data as List)
          .map((conv) => Conversation.fromJson(conv))
          .toList();
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> markConversationAsRead(String conversationId) async {
    try {
      await _dio.put('$baseUrl/messaging/conversations/$conversationId/read');
    } catch (e) {
      throw _handleError(e);
    }
  }

  // Activity Feed APIs
  Future<List<ActivityEvent>> getActivityFeed({
    String? type,
    bool? unreadOnly,
    int limit = 20,
    String? cursor,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'limit': limit,
        if (type != null) 'type': type,
        if (unreadOnly != null) 'unreadOnly': unreadOnly,
        if (cursor != null) 'cursor': cursor,
      };

      final response = await _dio.get(
        '$baseUrl/notifications/activity',
        queryParameters: queryParams,
      );
      return (response.data as List)
          .map((event) => ActivityEvent.fromJson(event))
          .toList();
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> markActivityAsRead(String activityId) async {
    try {
      await _dio.put('$baseUrl/notifications/activity/$activityId/read');
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> markAllActivitiesAsRead() async {
    try {
      await _dio.put('$baseUrl/notifications/activity/read-all');
    } catch (e) {
      throw _handleError(e);
    }
  }

  // Levels & Badges APIs
  Future<UserLevel> getUserLevel(String userId) async {
    try {
      final response = await _dio.get('$baseUrl/users/$userId/levels');
      return UserLevel.fromJson(response.data);
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<List<UserBadge>> getUserBadges(String userId) async {
    try {
      final response = await _dio.get('$baseUrl/users/$userId/badges');
      return (response.data as List)
          .map((badge) => UserBadge.fromJson(badge))
          .toList();
    } catch (e) {
      throw _handleError(e);
    }
  }

  // Wallet APIs
  Future<WalletData> getWalletData() async {
    try {
      final response = await _dio.get('$baseUrl/wallets/balance');
      return WalletData.fromJson(response.data);
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<List<Transaction>> getTransactions({
    TransactionType? type,
    TransactionStatus? status,
    DateTime? startDate,
    DateTime? endDate,
    int limit = 50,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'limit': limit,
        if (type != null) 'type': type.name,
        if (status != null) 'status': status.name,
        if (startDate != null) 'startDate': startDate.toIso8601String(),
        if (endDate != null) 'endDate': endDate.toIso8601String(),
      };

      final response = await _dio.get(
        '$baseUrl/wallets/transactions',
        queryParameters: queryParams,
      );
      return (response.data as List)
          .map((tx) => Transaction.fromJson(tx))
          .toList();
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<Transaction> purchaseCoins(double amount) async {
    try {
      final response = await _dio.post(
        '$baseUrl/wallets/purchase-coins',
        data: {'amount': amount},
      );
      return Transaction.fromJson(response.data);
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<Transaction> withdrawFunds(double amount, Map<String, dynamic> withdrawalDetails) async {
    try {
      final response = await _dio.post(
        '$baseUrl/wallets/withdraw',
        data: {
          'amount': amount,
          'withdrawalDetails': withdrawalDetails,
        },
      );
      return Transaction.fromJson(response.data);
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<String> getTransactionReceipt(String transactionId) async {
    try {
      final response = await _dio.get(
        '$baseUrl/wallets/transactions/$transactionId/receipt',
      );
      return response.data['receiptUrl'] ?? '';
    } catch (e) {
      throw _handleError(e);
    }
  }

  // Content APIs
  Future<List<dynamic>> getSavedContent({int limit = 20, String? cursor}) async {
    try {
      final queryParams = <String, dynamic>{
        'limit': limit,
        if (cursor != null) 'cursor': cursor,
      };

      final response = await _dio.get(
        '$baseUrl/content/saved',
        queryParameters: queryParams,
      );
      return response.data as List;
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<List<dynamic>> getLikedContent({int limit = 20, String? cursor}) async {
    try {
      final queryParams = <String, dynamic>{
        'limit': limit,
        if (cursor != null) 'cursor': cursor,
      };

      final response = await _dio.get(
        '$baseUrl/content/liked',
        queryParameters: queryParams,
      );
      return response.data as List;
    } catch (e) {
      throw _handleError(e);
    }
  }

  Exception _handleError(dynamic error) {
    if (error is DioException) {
      final response = error.response;
      if (response != null) {
        final message = response.data['message'] ?? response.statusMessage;
        return Exception(message);
      }
      return Exception('Network error: ${error.message}');
    }
    return Exception('Unknown error: $error');
  }
}
