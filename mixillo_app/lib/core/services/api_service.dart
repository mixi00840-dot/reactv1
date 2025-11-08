import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'dart:io';
import '../constants/api_constants.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';

/// Main API Service using Firebase Authentication
/// Handles all API calls to the backend with Firebase ID tokens
class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  late final Dio _dio;
  final FirebaseAuth _auth = FirebaseAuth.instance;
  
  // Expose dio for internal services
  Dio get dio => _dio;

  /// Initialize the API service
  Future<void> initialize() async {
    _dio = Dio(
      BaseOptions(
        baseUrl: '${ApiConstants.baseUrl}${ApiConstants.apiVersion}',
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
        },
      ),
    );

    // Add request interceptor to attach Firebase token
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Get Firebase ID token
          final user = _auth.currentUser;
          if (user != null) {
            try {
              final token = await user.getIdToken();
              options.headers['Authorization'] = 'Bearer $token';
            } catch (e) {
              print('Error getting Firebase token: $e');
            }
          }
          return handler.next(options);
        },
        onError: (error, handler) async {
          // Handle 401 - token expired, try to refresh
          if (error.response?.statusCode == 401) {
            try {
              final user = _auth.currentUser;
              if (user != null) {
                // Force token refresh
                final token = await user.getIdToken(true);
                final opts = error.requestOptions;
                opts.headers['Authorization'] = 'Bearer $token';
                final response = await _dio.fetch(opts);
                return handler.resolve(response);
              }
            } catch (e) {
              print('Error refreshing token: $e');
            }
          }
          return handler.next(error);
        },
      ),
    );

    // Add logger in debug mode
    if (const bool.fromEnvironment('dart.vm.product') == false) {
      _dio.interceptors.add(
        PrettyDioLogger(
          requestHeader: true,
          requestBody: true,
          responseBody: true,
          responseHeader: false,
          error: true,
          compact: true,
        ),
      );
    }
  }

  // ==================== AUTHENTICATION ====================

  /// Register new user
  Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    required String username,
    required String fullName,
    String? phone,
    String? dateOfBirth,
  }) async {
    try {
      // Create Firebase user
      final credential = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );

      // Update display name
      await credential.user?.updateDisplayName(username);

      // Call backend to create user profile
      final response = await _dio.post(
        ApiConstants.register,
        data: {
          'email': email,
          'username': username,
          'fullName': fullName,
          'phone': phone,
          'dateOfBirth': dateOfBirth,
        },
      );

      if (response.data['success'] == true) {
        return {
          'user': credential.user,
          'profile': response.data['data'],
        };
      }

      throw Exception(response.data['message'] ?? 'Registration failed');
    } on FirebaseAuthException catch (e) {
      throw Exception(_handleFirebaseError(e));
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Login user
  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      // Sign in with Firebase
      final credential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );

      // Get user profile from backend
      final token = await credential.user?.getIdToken();
      final response = await _dio.get(
        ApiConstants.userProfile(credential.user!.uid),
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      if (response.data['success'] == true) {
        return {
          'user': credential.user,
          'profile': response.data['data'],
        };
      }

      throw Exception(response.data['message'] ?? 'Login failed');
    } on FirebaseAuthException catch (e) {
      throw Exception(_handleFirebaseError(e));
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Logout user
  Future<void> logout() async {
    await _auth.signOut();
  }

  /// Get current user
  User? get currentUser => _auth.currentUser;

  /// Check if user is authenticated
  bool get isAuthenticated => _auth.currentUser != null;

  // ==================== FEED ====================

  /// Get video feed
  Future<Map<String, dynamic>> getFeed({
    int limit = 20,
    int page = 1,
    String type = 'for-you',
    String? hashtag,
  }) async {
    try {
      // Use recommendation-based feed for 'for-you' type
      if (type == 'for-you') {
        final offset = (page - 1) * limit;
        final response = await _dio.get(
          '/feed/for-you',
          queryParameters: {
            'limit': limit,
            'offset': offset,
          },
        );

        if (response.data['success'] == true) {
          final data = response.data['data'];
          return {
            'videos': data['feed'] ?? [],
            'pagination': {
              'page': page,
              'limit': limit,
              'hasMore': data['hasMore'] ?? false,
            }
          };
        }
      } else {
        // Use regular feed for other types
        final response = await _dio.get(
          '/feed',
          queryParameters: {
            'limit': limit,
            'page': page,
            'type': type,
            if (hashtag != null) 'hashtag': hashtag,
          },
        );

        if (response.data['success'] == true) {
          return response.data['data'];
        }
      }

      throw Exception('Failed to load feed');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  // ==================== CONTENT ====================

  /// Get content by ID
  Future<Map<String, dynamic>> getContent(String contentId) async {
    try {
      final response = await _dio.get('/content/$contentId');

      if (response.data['success'] == true) {
        return response.data['data'];
      }

      throw Exception(response.data['message'] ?? 'Failed to load content');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Like/Unlike content
  Future<Map<String, dynamic>> toggleLike(String contentId) async {
    try {
      final response = await _dio.post('/content/$contentId/like');

      if (response.data['success'] == true) {
        return response.data['data'];
      }

      throw Exception(response.data['message'] ?? 'Failed to toggle like');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Create content
  Future<Map<String, dynamic>> createContent({
    required String type,
    required String mediaUrl,
    String? caption,
    List<String>? hashtags,
    String? thumbnailUrl,
  }) async {
    try {
      final response = await _dio.post(
        '/content',
        data: {
          'type': type,
          'mediaUrl': mediaUrl,
          'caption': caption,
          'hashtags': hashtags,
          'thumbnailUrl': thumbnailUrl,
        },
      );

      if (response.data['success'] == true) {
        return response.data['data'];
      }

      throw Exception(response.data['message'] ?? 'Failed to create content');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  // ==================== COMMENTS ====================

  /// Get comments for content
  Future<List<dynamic>> getComments(String contentId, {int limit = 50}) async {
    try {
      final response = await _dio.get(
        '/comments',
        queryParameters: {
          'contentId': contentId,
          'limit': limit,
        },
      );

      if (response.data['success'] == true) {
        return response.data['data']['comments'] ?? [];
      }

      throw Exception(response.data['message'] ?? 'Failed to load comments');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Create comment
  Future<Map<String, dynamic>> createComment({
    required String contentId,
    required String text,
    String? parentCommentId,
  }) async {
    try {
      final response = await _dio.post(
        '/comments',
        data: {
          'contentId': contentId,
          'text': text,
          if (parentCommentId != null) 'parentCommentId': parentCommentId,
        },
      );

      if (response.data['success'] == true) {
        return response.data['data'];
      }

      throw Exception(response.data['message'] ?? 'Failed to create comment');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  // ==================== USERS ====================

  /// Follow/Unfollow user
  Future<Map<String, dynamic>> toggleFollow(String userId) async {
    try {
      final response = await _dio.post('/users/$userId/follow');

      if (response.data['success'] == true) {
        return response.data['data'];
      }

      throw Exception(response.data['message'] ?? 'Failed to toggle follow');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  // ==================== WALLET ====================

  /// Get wallet balance
  Future<Map<String, dynamic>> getWalletBalance() async {
    try {
      final response = await _dio.get('/wallets/balance');

      if (response.data['success'] == true) {
        return response.data['data'];
      }

      throw Exception(response.data['message'] ?? 'Failed to get balance');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Purchase coins
  Future<Map<String, dynamic>> purchaseCoins({
    required String packageId,
    required double amount,
    required String paymentMethod,
    String? transactionId,
    String? idempotencyKey,
  }) async {
    try {
      final response = await _dio.post(
        '/wallets/purchase',
        data: {
          'packageId': packageId,
          'amount': amount,
          'paymentMethod': paymentMethod,
          if (transactionId != null) 'transactionId': transactionId,
          if (idempotencyKey != null) 'idempotencyKey': idempotencyKey,
        },
      );

      if (response.data['success'] == true) {
        return response.data['data'];
      }

      throw Exception(response.data['message'] ?? 'Failed to purchase coins');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Get transactions
  Future<List<dynamic>> getTransactions({int limit = 50}) async {
    try {
      final response = await _dio.get(
        '/wallets/transactions',
        queryParameters: {'limit': limit},
      );

      if (response.data['success'] == true) {
        return response.data['data']['transactions'] ?? [];
      }

      throw Exception(response.data['message'] ?? 'Failed to load transactions');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  // ==================== STREAMING ====================

  /// Get streaming providers
  Future<List<dynamic>> getStreamingProviders() async {
    try {
      final response = await _dio.get('/streaming/providers');

      if (response.data['success'] == true) {
        return response.data['data']['providers'] ?? [];
      }

      throw Exception(response.data['message'] ?? 'Failed to load providers');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Get public settings (for default provider)
  Future<Map<String, dynamic>> getPublicSettings() async {
    try {
      final response = await _dio.get('/settings/public');

      if (response.data['success'] == true) {
        return response.data['data'] ?? {};
      }

      throw Exception(response.data['message'] ?? 'Failed to load settings');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Start livestream
  Future<Map<String, dynamic>> startLivestream({
    String? title,
    bool isPrivate = false,
  }) async {
    try {
      final response = await _dio.post(
        '/streaming/start',
        data: {
          'title': title,
          'isPrivate': isPrivate,
        },
      );

      if (response.data['success'] == true) {
        return response.data['data'];
      }

      throw Exception(response.data['message'] ?? 'Failed to start stream');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Get livestreams
  Future<List<dynamic>> getLivestreams({int limit = 20}) async {
    try {
      final response = await _dio.get(
        '/streaming/livestreams',
        queryParameters: {'limit': limit},
      );

      if (response.data['success'] == true) {
        return response.data['data']['livestreams'] ?? [];
      }

      throw Exception(response.data['message'] ?? 'Failed to load livestreams');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  // ==================== PK BATTLES ====================

  /// Get PK battle
  Future<Map<String, dynamic>> getPKBattle(String battleId) async {
    try {
      final response = await _dio.get('/pk-battles/$battleId');

      if (response.data['success'] == true) {
        return response.data['battle'] ?? response.data['data'] ?? {};
      }

      throw Exception(response.data['message'] ?? 'Failed to load battle');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Get active PK battles
  Future<List<dynamic>> getActivePKBattles({int limit = 20}) async {
    try {
      final response = await _dio.get(
        '/pk-battles/active/list',
        queryParameters: {'limit': limit},
      );

      if (response.data['success'] == true) {
        return response.data['data']?['battles'] ?? response.data['battles'] ?? [];
      }

      throw Exception(response.data['message'] ?? 'Failed to load battles');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Create PK battle
  Future<Map<String, dynamic>> createPKBattle({
    required String host2Id,
    required String stream1Id,
    required String stream2Id,
    String? host3Id,
    String? stream3Id,
    String? host4Id,
    String? stream4Id,
    int duration = 300,
  }) async {
    try {
      final response = await _dio.post(
        '/pk-battles',
        data: {
          'host2Id': host2Id,
          'stream1Id': stream1Id,
          'stream2Id': stream2Id,
          'duration': duration,
          if (host3Id != null) 'host3Id': host3Id,
          if (stream3Id != null) 'stream3Id': stream3Id,
          if (host4Id != null) 'host4Id': host4Id,
          if (stream4Id != null) 'stream4Id': stream4Id,
        },
      );

      if (response.data['success'] == true) {
        return response.data['battle'] ?? response.data['data'] ?? {};
      }

      throw Exception(response.data['message'] ?? 'Failed to create battle');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Accept PK battle
  Future<Map<String, dynamic>> acceptPKBattle(String battleId) async {
    try {
      final response = await _dio.post('/pk-battles/$battleId/accept');

      if (response.data['success'] == true) {
        return response.data['battle'] ?? response.data['data'] ?? {};
      }

      throw Exception(response.data['message'] ?? 'Failed to accept battle');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Send gift in PK battle
  Future<Map<String, dynamic>> sendPKBattleGift({
    required String battleId,
    required int hostNumber,
    required String giftId,
    required int amount,
  }) async {
    try {
      final response = await _dio.post(
        '/pk-battles/$battleId/gift',
        data: {
          'hostNumber': hostNumber,
          'giftId': giftId,
          'amount': amount,
        },
      );

      if (response.data['success'] == true) {
        return response.data['battle'] ?? response.data['data'] ?? {};
      }

      throw Exception(response.data['message'] ?? 'Failed to send gift');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  // ==================== GIFTS ====================

  /// Get gifts catalog
  Future<List<dynamic>> getGifts({
    String? category,
    bool featured = false,
    int limit = 100,
  }) async {
    try {
      final response = await _dio.get(
        '/gifts',
        queryParameters: {
          if (category != null) 'category': category,
          if (featured) 'featured': 'true',
          'limit': limit,
        },
      );

      if (response.data['success'] == true) {
        return response.data['data']?['gifts'] ?? [];
      }

      throw Exception(response.data['message'] ?? 'Failed to load gifts');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Get gift categories
  Future<List<String>> getGiftCategories() async {
    try {
      final response = await _dio.get('/gifts/categories');

      if (response.data['success'] == true) {
        return List<String>.from(response.data['data']?['categories'] ?? []);
      }

      throw Exception(response.data['message'] ?? 'Failed to load categories');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Send gift
  Future<Map<String, dynamic>> sendGift({
    required String giftId,
    required String receiverId,
    int quantity = 1,
    String? message,
    bool anonymous = false,
    Map<String, dynamic>? context,
  }) async {
    try {
      final response = await _dio.post(
        '/supporters/gifts/send',
        data: {
          'giftId': giftId,
          'receiverId': receiverId,
          'quantity': quantity,
          if (message != null) 'message': message,
          'anonymous': anonymous,
          if (context != null) 'context': context,
        },
      );

      if (response.data['success'] == true) {
        return response.data['data'] ?? response.data;
      }

      throw Exception(response.data['message'] ?? 'Failed to send gift');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  // ==================== SELLERS & STORES ====================

  /// Check seller eligibility
  Future<Map<String, dynamic>> checkSellerEligibility() async {
    try {
      final response = await _dio.get('/sellers/check-eligibility');

      if (response.data['success'] == true) {
        return response.data['data'] ?? {};
      }

      throw Exception(response.data['message'] ?? 'Failed to check eligibility');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Get seller application
  Future<Map<String, dynamic>> getSellerApplication() async {
    try {
      final response = await _dio.get('/sellers/application');

      if (response.data['success'] == true) {
        return response.data['data'] ?? {};
      }

      throw Exception(response.data['message'] ?? 'Failed to load application');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Get stores
  Future<List<dynamic>> getStores({
    String? category,
    String? status,
    bool? isVerified,
    bool? isFeatured,
    String? search,
    int limit = 20,
  }) async {
    try {
      final response = await _dio.get(
        '/stores',
        queryParameters: {
          if (category != null) 'category': category,
          if (status != null) 'status': status,
          if (isVerified != null) 'isVerified': isVerified.toString(),
          if (isFeatured != null) 'isFeatured': isFeatured.toString(),
          if (search != null) 'search': search,
          'limit': limit,
        },
      );

      if (response.data['success'] == true) {
        return response.data['data'] ?? [];
      }

      throw Exception(response.data['message'] ?? 'Failed to load stores');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Get store by ID
  Future<Map<String, dynamic>> getStore(String storeId) async {
    try {
      final response = await _dio.get('/stores/$storeId');

      if (response.data['success'] == true) {
        return response.data['data'] ?? {};
      }

      throw Exception(response.data['message'] ?? 'Failed to load store');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Create store
  Future<Map<String, dynamic>> createStore({
    required String name,
    String? description,
    String? logo,
    String? banner,
    Map<String, dynamic>? businessInfo,
    Map<String, dynamic>? shipping,
    Map<String, dynamic>? policies,
  }) async {
    try {
      final response = await _dio.post(
        '/stores',
        data: {
          'name': name,
          if (description != null) 'description': description,
          if (logo != null) 'logo': logo,
          if (banner != null) 'banner': banner,
          if (businessInfo != null) 'businessInfo': businessInfo,
          if (shipping != null) 'shipping': shipping,
          if (policies != null) 'policies': policies,
        },
      );

      if (response.data['success'] == true) {
        return response.data['data'] ?? {};
      }

      throw Exception(response.data['message'] ?? 'Failed to create store');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Get products
  Future<List<dynamic>> getProducts({
    String? storeId,
    String? category,
    String? status,
    int limit = 20,
    String? orderBy,
    String? order,
  }) async {
    try {
      final response = await _dio.get(
        '/products',
        queryParameters: {
          if (storeId != null) 'storeId': storeId,
          if (category != null) 'category': category,
          if (status != null) 'status': status,
          'limit': limit,
          if (orderBy != null) 'orderBy': orderBy,
          if (order != null) 'order': order,
        },
      );

      if (response.data['success'] == true) {
        return response.data['data'] ?? [];
      }

      throw Exception(response.data['message'] ?? 'Failed to load products');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Get product by ID
  Future<Map<String, dynamic>> getProduct(String productId) async {
    try {
      final response = await _dio.get('/products/$productId');

      if (response.data['success'] == true) {
        return response.data['data'] ?? {};
      }

      throw Exception(response.data['message'] ?? 'Failed to load product');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Search products
  Future<List<dynamic>> searchProducts(String query) async {
    try {
      final response = await _dio.get(
        '/products/search',
        queryParameters: {'q': query},
      );

      if (response.data['success'] == true) {
        return response.data['data'] ?? [];
      }

      throw Exception(response.data['message'] ?? 'Failed to search products');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  // ==================== STORIES ====================

  /// Get stories feed
  Future<List<dynamic>> getStoriesFeed({int limit = 50}) async {
    try {
      final response = await _dio.get(
        '/stories/feed',
        queryParameters: {'limit': limit},
      );

      if (response.data['success'] == true) {
        return response.data['data']?['stories'] ?? [];
      }

      throw Exception(response.data['message'] ?? 'Failed to load stories feed');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Get user stories
  Future<List<dynamic>> getUserStories(String userId, {int limit = 50}) async {
    try {
      final response = await _dio.get(
        '/stories/user/$userId',
        queryParameters: {'limit': limit},
      );

      if (response.data['success'] == true) {
        return response.data['data']?['stories'] ?? [];
      }

      throw Exception(response.data['message'] ?? 'Failed to load user stories');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Create story
  Future<Map<String, dynamic>> createStory({
    required String mediaUrl,
    required String mediaType,
    String? thumbnail,
    String? caption,
    int duration = 5,
    String? backgroundColor,
    Map<String, dynamic>? music,
    Map<String, dynamic>? location,
    List<Map<String, dynamic>>? mentions,
    List<String>? hashtags,
  }) async {
    try {
      final response = await _dio.post(
        '/stories',
        data: {
          'mediaUrl': mediaUrl,
          'mediaType': mediaType,
          if (thumbnail != null) 'thumbnail': thumbnail,
          if (caption != null) 'caption': caption,
          'duration': duration,
          if (backgroundColor != null) 'backgroundColor': backgroundColor,
          if (music != null) 'music': music,
          if (location != null) 'location': location,
          if (mentions != null) 'mentions': mentions,
          if (hashtags != null) 'hashtags': hashtags,
        },
      );

      if (response.data['success'] == true) {
        return response.data['data'] ?? response.data['story'] ?? {};
      }

      throw Exception(response.data['message'] ?? 'Failed to create story');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// View story
  Future<bool> viewStory(String storyId) async {
    try {
      final response = await _dio.post('/stories/$storyId/view');
      return response.data['success'] == true;
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Add reaction to story
  Future<Map<String, dynamic>> addStoryReaction(String storyId, String type) async {
    try {
      final response = await _dio.post(
        '/stories/$storyId/reactions',
        data: {'type': type},
      );

      if (response.data['success'] == true) {
        return response.data['data'] ?? {};
      }

      throw Exception(response.data['message'] ?? 'Failed to add reaction');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Reply to story
  Future<Map<String, dynamic>> replyToStory(String storyId, String message) async {
    try {
      final response = await _dio.post(
        '/stories/$storyId/replies',
        data: {'message': message},
      );

      if (response.data['success'] == true) {
        return response.data['data'] ?? {};
      }

      throw Exception(response.data['message'] ?? 'Failed to reply to story');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Get story viewers
  Future<List<String>> getStoryViewers(String storyId) async {
    try {
      final response = await _dio.get('/stories/$storyId/viewers');

      if (response.data['success'] == true) {
        return List<String>.from(response.data['data']?['viewers'] ?? []);
      }

      throw Exception(response.data['message'] ?? 'Failed to get viewers');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Delete story
  Future<bool> deleteStory(String storyId) async {
    try {
      final response = await _dio.delete('/stories/$storyId');
      return response.data['success'] == true;
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  // ==================== SEARCH ====================

  /// Search
  Future<Map<String, dynamic>> search({
    required String query,
    String type = 'all', // all, hashtag, user, video
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _dio.get(
        '/search',
        queryParameters: {
          'q': query,
          'type': type,
          'page': page,
          'limit': limit,
        },
      );

      if (response.data['success'] == true) {
        return response.data['data'];
      }

      throw Exception(response.data['message'] ?? 'Failed to search');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Get trending hashtags
  Future<List<dynamic>> getTrendingHashtags({int limit = 20}) async {
    try {
      final response = await _dio.get(
        '/trending/hashtags',
        queryParameters: {'limit': limit},
      );

      if (response.data['success'] == true) {
        return response.data['data'] ?? response.data['hashtags'] ?? [];
      }

      throw Exception(response.data['message'] ?? 'Failed to load trending hashtags');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Get trending videos
  Future<List<dynamic>> getTrendingVideos({int limit = 50}) async {
    try {
      final response = await _dio.get(
        '/trending/global',
        queryParameters: {'limit': limit},
      );

      if (response.data['success'] == true) {
        return response.data['data'] ?? response.data['videos'] ?? [];
      }

      throw Exception(response.data['message'] ?? 'Failed to load trending videos');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Get explore feed
  Future<List<dynamic>> getExploreFeed({
    int limit = 50,
    String? country,
    List<String>? categories,
  }) async {
    try {
      final response = await _dio.get(
        '/trending/explore',
        queryParameters: {
          'limit': limit,
          if (country != null) 'country': country,
          if (categories != null) 'categories': categories.join(','),
        },
      );

      if (response.data['success'] == true) {
        return response.data['data'] ?? [];
      }

      throw Exception(response.data['message'] ?? 'Failed to load explore feed');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  // ==================== PROFILE & USERS ====================

  /// Get current user profile
  Future<Map<String, dynamic>> getCurrentUserProfile() async {
    try {
      final response = await _dio.get('/users/profile');

      if (response.data['success'] == true) {
        return response.data['data']?['user'] ?? {};
      }

      throw Exception(response.data['message'] ?? 'Failed to load profile');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Get user by ID
  Future<Map<String, dynamic>> getUserProfile(String userId) async {
    try {
      final response = await _dio.get('/users/$userId');

      if (response.data['success'] == true) {
        return response.data['data']?['user'] ?? {};
      }

      throw Exception(response.data['message'] ?? 'Failed to load user profile');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Update user profile
  Future<Map<String, dynamic>> updateUserProfile({
    String? fullName,
    String? bio,
    String? phone,
    DateTime? dateOfBirth,
  }) async {
    try {
      final response = await _dio.put(
        '/users/profile',
        data: {
          if (fullName != null) 'fullName': fullName,
          if (bio != null) 'bio': bio,
          if (phone != null) 'phone': phone,
          if (dateOfBirth != null) 'dateOfBirth': dateOfBirth.toIso8601String(),
        },
      );

      if (response.data['success'] == true) {
        return response.data['data']?['user'] ?? {};
      }

      throw Exception(response.data['message'] ?? 'Failed to update profile');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Upload avatar
  Future<Map<String, dynamic>> uploadAvatar(File imageFile) async {
    try {
      final formData = FormData.fromMap({
        'avatar': await MultipartFile.fromFile(
          imageFile.path,
          filename: 'avatar.jpg',
        ),
      });

      final response = await _dio.post(
        '/users/upload-avatar',
        data: formData,
      );

      if (response.data['success'] == true) {
        return response.data['data'] ?? {};
      }

      throw Exception(response.data['message'] ?? 'Failed to upload avatar');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Follow user
  Future<bool> followUser(String userId) async {
    try {
      final response = await _dio.post('/users/$userId/follow');
      return response.data['success'] == true;
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Unfollow user
  Future<bool> unfollowUser(String userId) async {
    try {
      final response = await _dio.delete('/users/$userId/unfollow');
      return response.data['success'] == true;
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Get user followers
  Future<List<dynamic>> getUserFollowers(String userId, {int limit = 50}) async {
    try {
      final response = await _dio.get(
        '/users/$userId/followers',
        queryParameters: {'limit': limit},
      );

      if (response.data['success'] == true) {
        return response.data['data']?['followers'] ?? [];
      }

      throw Exception(response.data['message'] ?? 'Failed to load followers');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Get user following
  Future<List<dynamic>> getUserFollowing(String userId, {int limit = 50}) async {
    try {
      final response = await _dio.get(
        '/users/$userId/following',
        queryParameters: {'limit': limit},
      );

      if (response.data['success'] == true) {
        return response.data['data']?['following'] ?? [];
      }

      throw Exception(response.data['message'] ?? 'Failed to load following');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Change password
  Future<bool> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      final response = await _dio.post(
        '/users/change-password',
        data: {
          'currentPassword': currentPassword,
          'newPassword': newPassword,
        },
      );

      return response.data['success'] == true;
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Get user stats
  Future<Map<String, dynamic>> getUserStats() async {
    try {
      final response = await _dio.get('/users/stats');

      if (response.data['success'] == true) {
        return response.data['data'] ?? {};
      }

      throw Exception(response.data['message'] ?? 'Failed to load stats');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  // ==================== NOTIFICATIONS ====================

  /// Get notifications
  Future<List<dynamic>> getNotifications({int limit = 50}) async {
    try {
      final response = await _dio.get(
        '/notifications',
        queryParameters: {'limit': limit},
      );

      if (response.data['success'] == true) {
        return response.data['data']['notifications'] ?? [];
      }

      throw Exception(response.data['message'] ?? 'Failed to load notifications');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  // ==================== UPLOADS ====================

  /// Get presigned URL for upload
  Future<Map<String, dynamic>> getPresignedUrl({
    required String fileName,
    required String fileType,
    required String contentType,
  }) async {
    try {
      final response = await _dio.post(
        '/uploads/presigned-url',
        data: {
          'fileName': fileName,
          'fileType': fileType,
          'contentType': contentType,
        },
      );

      if (response.data['success'] == true) {
        return response.data['data'];
      }

      throw Exception(response.data['message'] ?? 'Failed to get upload URL');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  // ==================== FILTERS & AR EFFECTS ====================

  /// Get available filters
  Future<List<dynamic>> getFilters({
    String? category,
    String? type,
    bool? isPremium,
    int limit = 50,
  }) async {
    try {
      final response = await _dio.get(
        '/stream-filters',
        queryParameters: {
          if (category != null) 'category': category,
          if (type != null) 'type': type,
          if (isPremium != null) 'isPremium': isPremium,
          'limit': limit,
        },
      );

      if (response.data['success'] == true) {
        return response.data['data']['filters'] ?? [];
      }

      throw Exception(response.data['message'] ?? 'Failed to load filters');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Get trending filters
  Future<List<dynamic>> getTrendingFilters({int limit = 20}) async {
    try {
      final response = await _dio.get(
        '/stream-filters/trending',
        queryParameters: {'limit': limit},
      );

      if (response.data['success'] == true) {
        return response.data['data']['filters'] ?? [];
      }

      throw Exception(response.data['message'] ?? 'Failed to load trending filters');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Get featured filters
  Future<List<dynamic>> getFeaturedFilters({int limit = 20}) async {
    try {
      final response = await _dio.get(
        '/stream-filters/featured',
        queryParameters: {'limit': limit},
      );

      if (response.data['success'] == true) {
        return response.data['data']['filters'] ?? [];
      }

      throw Exception(response.data['message'] ?? 'Failed to load featured filters');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Get filters by category
  Future<List<dynamic>> getFiltersByCategory(String category, {int limit = 50}) async {
    try {
      final response = await _dio.get(
        '/stream-filters/category/$category',
        queryParameters: {'limit': limit},
      );

      if (response.data['success'] == true) {
        return response.data['data']['filters'] ?? [];
      }

      throw Exception(response.data['message'] ?? 'Failed to load filters');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Search filters
  Future<List<dynamic>> searchFilters(String query, {int limit = 50}) async {
    try {
      final response = await _dio.get(
        '/stream-filters/search',
        queryParameters: {
          'q': query,
          'limit': limit,
        },
      );

      if (response.data['success'] == true) {
        return response.data['data']['filters'] ?? [];
      }

      throw Exception(response.data['message'] ?? 'Failed to search filters');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Apply filter
  Future<Map<String, dynamic>> applyFilter(String filterId, {Map<String, dynamic>? parameters}) async {
    try {
      final response = await _dio.post(
        '/stream-filters/$filterId/apply',
        data: parameters,
      );

      if (response.data['success'] == true) {
        return response.data['data'] ?? {};
      }

      throw Exception(response.data['message'] ?? 'Failed to apply filter');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Unlock premium filter
  Future<bool> unlockFilter(String filterId) async {
    try {
      final response = await _dio.post('/stream-filters/$filterId/unlock');
      return response.data['success'] == true;
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Favorite/unfavorite filter
  Future<bool> favoriteFilter(String filterId) async {
    try {
      final response = await _dio.post('/stream-filters/$filterId/favorite');
      return response.data['success'] == true;
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Get user's favorite filters
  Future<List<dynamic>> getUserFavoriteFilters() async {
    try {
      final response = await _dio.get('/stream-filters/user/favorites');

      if (response.data['success'] == true) {
        return response.data['data']['filters'] ?? [];
      }

      throw Exception(response.data['message'] ?? 'Failed to load favorite filters');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  // ==================== VIDEO PROCESSING ====================

  /// Process video with filters/effects
  Future<Map<String, dynamic>> processVideo({
    required String videoUrl,
    String? filterId,
    Map<String, dynamic>? effects,
    Map<String, dynamic>? trimOptions,
  }) async {
    try {
      final response = await _dio.post(
        '/video/process',
        data: {
          'videoUrl': videoUrl,
          if (filterId != null) 'filterId': filterId,
          if (effects != null) 'effects': effects,
          if (trimOptions != null) 'trimOptions': trimOptions,
        },
      );

      if (response.data['success'] == true) {
        return response.data['data'] ?? {};
      }

      throw Exception(response.data['message'] ?? 'Failed to process video');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Trim video
  Future<Map<String, dynamic>> trimVideo({
    required String videoUrl,
    required double startTime,
    required double endTime,
  }) async {
    try {
      final response = await _dio.post(
        '/video/trim',
        data: {
          'videoUrl': videoUrl,
          'startTime': startTime,
          'endTime': endTime,
        },
      );

      if (response.data['success'] == true) {
        return response.data['data'] ?? {};
      }

      throw Exception(response.data['message'] ?? 'Failed to trim video');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  // ==================== SOUNDS & MUSIC ====================

  /// Get sounds
  Future<List<dynamic>> getSounds({
    int limit = 50,
    int skip = 0,
    String? category,
    String? mood,
  }) async {
    try {
      final response = await _dio.get(
        '/sounds',
        queryParameters: {
          'limit': limit,
          'skip': skip,
          if (category != null) 'category': category,
          if (mood != null) 'mood': mood,
        },
      );

      if (response.data['success'] == true) {
        return response.data['data']['sounds'] ?? [];
      }

      throw Exception(response.data['message'] ?? 'Failed to load sounds');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Get trending sounds
  Future<List<dynamic>> getTrendingSounds({int limit = 20}) async {
    try {
      final response = await _dio.get(
        '/sounds/trending',
        queryParameters: {'limit': limit},
      );

      if (response.data['success'] == true) {
        return response.data['data']['sounds'] ?? [];
      }

      throw Exception(response.data['message'] ?? 'Failed to load trending sounds');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Get featured sounds
  Future<List<dynamic>> getFeaturedSounds({int limit = 20}) async {
    try {
      final response = await _dio.get(
        '/sounds/featured',
        queryParameters: {'limit': limit},
      );

      if (response.data['success'] == true) {
        return response.data['data']['sounds'] ?? [];
      }

      throw Exception(response.data['message'] ?? 'Failed to load featured sounds');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Search sounds
  Future<List<dynamic>> searchSounds(String query, {
    int limit = 50,
    int skip = 0,
    String? category,
    String? mood,
  }) async {
    try {
      final response = await _dio.get(
        '/sounds/search',
        queryParameters: {
          'q': query,
          'limit': limit,
          'skip': skip,
          if (category != null) 'category': category,
          if (mood != null) 'mood': mood,
        },
      );

      if (response.data['success'] == true) {
        return response.data['data']['sounds'] ?? [];
      }

      throw Exception(response.data['message'] ?? 'Failed to search sounds');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Get sound details
  Future<Map<String, dynamic>> getSoundDetails(String soundId) async {
    try {
      final response = await _dio.get('/sounds/$soundId');

      if (response.data['success'] == true) {
        return response.data['data']['sound'] ?? {};
      }

      throw Exception(response.data['message'] ?? 'Failed to load sound details');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Record sound usage (when used in content)
  Future<bool> recordSoundUsage(String soundId, {String? contentId}) async {
    try {
      final response = await _dio.post(
        '/sounds/$soundId/use',
        data: {
          if (contentId != null) 'contentId': contentId,
        },
      );
      return response.data['success'] == true;
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  // ==================== RECOMMENDATIONS ====================

  /// Get personalized recommendations
  Future<Map<String, dynamic>> getRecommendations({
    int limit = 50,
    bool useCache = true,
  }) async {
    try {
      final response = await _dio.get(
        ApiConstants.recommendations,
        queryParameters: {
          'limit': limit,
          'useCache': useCache,
        },
      );

      if (response.data['success'] == true) {
        return response.data['data'] ?? {};
      }

      throw Exception(response.data['message'] ?? 'Failed to get recommendations');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Refresh recommendations (force new generation)
  Future<bool> refreshRecommendations({int limit = 50}) async {
    try {
      final response = await _dio.post(
        ApiConstants.refreshRecommendations,
        data: {'limit': limit},
      );
      return response.data['success'] == true;
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  /// Get user recommendation preferences
  Future<Map<String, dynamic>> getRecommendationPreferences() async {
    try {
      final response = await _dio.get(ApiConstants.recommendationPreferences);
      if (response.data['success'] == true) {
        return response.data['data'] ?? {};
      }
      throw Exception(response.data['message'] ?? 'Failed to get preferences');
    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    }
  }

  // ==================== INTERACTION TRACKING ====================

  /// Track user interaction with content
  Future<bool> trackInteraction({
    required String contentId,
    required String interactionType, // 'view', 'like', 'comment', 'share'
    int? watchTime,
    double? completionRate,
    Map<String, dynamic>? metadata,
  }) async {
    try {
      final response = await _dio.post(
        ApiConstants.trackInteraction,
        data: {
          'contentId': contentId,
          'interactionType': interactionType,
          if (watchTime != null) 'watchTime': watchTime,
          if (completionRate != null) 'completionRate': completionRate,
          if (metadata != null) 'metadata': metadata,
        },
      );
      return response.data['success'] == true;
    } on DioException catch (e) {
      // Don't throw - interaction tracking failures shouldn't break the app
      print('Error tracking interaction: ${_handleDioError(e)}');
      return false;
    }
  }

  /// Mark content as not interested
  Future<bool> markNotInterested(String contentId) async {
    try {
      final response = await _dio.post(
        '${ApiConstants.notInterested}/$contentId',
      );
      return response.data['success'] == true;
    } on DioException catch (e) {
      print('Error marking not interested: ${_handleDioError(e)}');
      return false;
    }
  }

  // ==================== ERROR HANDLING ====================

  String _handleDioError(DioException error) {
    if (error.response != null) {
      final data = error.response!.data;
      if (data is Map && data['message'] != null) {
        return data['message'];
      }
      return 'Server error: ${error.response!.statusCode}';
    }

    if (error.type == DioExceptionType.connectionTimeout) {
      return 'Connection timeout. Please check your internet connection.';
    }

    if (error.type == DioExceptionType.receiveTimeout) {
      return 'Server is taking too long to respond.';
    }

    if (error.type == DioExceptionType.connectionError) {
      return 'Cannot connect to server. Please check your internet connection.';
    }

    return 'An unexpected error occurred.';
  }

  String _handleFirebaseError(FirebaseAuthException error) {
    switch (error.code) {
      case 'weak-password':
        return 'The password provided is too weak.';
      case 'email-already-in-use':
        return 'An account already exists for that email.';
      case 'user-not-found':
        return 'No user found for that email.';
      case 'wrong-password':
        return 'Wrong password provided.';
      case 'invalid-email':
        return 'The email address is invalid.';
      case 'user-disabled':
        return 'This user account has been disabled.';
      case 'too-many-requests':
        return 'Too many requests. Please try again later.';
      default:
        return error.message ?? 'An authentication error occurred.';
    }
  }
}

