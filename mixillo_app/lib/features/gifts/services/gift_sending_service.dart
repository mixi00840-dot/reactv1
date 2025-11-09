import '../../../core/services/api_helper.dart';

class GiftSendingService {
  final ApiHelper _api = ApiHelper();

  /// Send gift to a user
  Future<Map<String, dynamic>?> sendGift({
    required String giftId,
    required String receiverId,
    int quantity = 1,
    String? message,
    bool anonymous = false,
    GiftContext? context,
  }) async {
    try {
      final response = await _api.dio.post(
        '/supporters/gifts/send',
        data: {
          'giftId': giftId,
          'receiverId': receiverId,
          'quantity': quantity,
          if (message != null) 'message': message,
          'anonymous': anonymous,
          if (context != null) 'context': {
            'type': context.type.name,
            'referenceId': context.referenceId,
            if (context.referenceName != null) 'referenceName': context.referenceName,
          },
        },
      );

      if (response.data['success'] == true) {
        return response.data['data'] ?? response.data;
      }

      throw Exception(response.data['message'] ?? 'Failed to send gift');
    } catch (e) {
      print('Error sending gift: $e');
      return null;
    }
  }

  /// Get gift transactions
  Future<List<Map<String, dynamic>>> getGiftTransactions({
    int limit = 20,
    int offset = 0,
  }) async {
    try {
      final response = await _api.dio.get(
        '/supporters/gifts/transactions',
        queryParameters: {
          'limit': limit,
          'offset': offset,
        },
      );

      if (response.data['success'] == true) {
        return List<Map<String, dynamic>>.from(
          response.data['data']?['transactions'] ?? [],
        );
      }

      return [];
    } catch (e) {
      print('Error loading gift transactions: $e');
      return [];
    }
  }

  /// Get gifts for a livestream
  Future<List<Map<String, dynamic>>> getLivestreamGifts(String livestreamId) async {
    try {
      final response = await _api.dio.get(
        '/supporters/gifts/livestream/$livestreamId',
      );

      if (response.data['success'] == true) {
        return List<Map<String, dynamic>>.from(
          response.data['data']?['gifts'] ?? [],
        );
      }

      return [];
    } catch (e) {
      print('Error loading livestream gifts: $e');
      return [];
    }
  }
}

class GiftContext {
  final GiftContextType type;
  final String referenceId;
  final String? referenceName;

  GiftContext({
    required this.type,
    required this.referenceId,
    this.referenceName,
  });
}

enum GiftContextType {
  livestream,
  pkBattle,
  multihost,
  video,
  post,
  directMessage;

  String get name {
    switch (this) {
      case GiftContextType.livestream:
        return 'livestream';
      case GiftContextType.pkBattle:
        return 'pk_battle';
      case GiftContextType.multihost:
        return 'multihost';
      case GiftContextType.video:
        return 'video';
      case GiftContextType.post:
        return 'post';
      case GiftContextType.directMessage:
        return 'direct_message';
    }
  }
}

