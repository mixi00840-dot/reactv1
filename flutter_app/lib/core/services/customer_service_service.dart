import '../services/api_service.dart';
import '../models/models.dart';

/// Customer Service - Support tickets
/// Integrates with backend /api/customer-service endpoints
class CustomerServiceService {
  final ApiService _apiService = ApiService();

  /// Get all user's tickets
  Future<List<CustomerServiceModel>> getMyTickets({
    String? status,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.get(
        '/customer-service/tickets',
        queryParameters: {
          if (status != null) 'status': status,
          'page': page,
          'limit': limit,
        },
      );
      return (response['data']['tickets'] as List)
          .map((json) => CustomerServiceModel.fromJson(json))
          .toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Get ticket by ID
  Future<CustomerServiceModel> getTicket(String ticketId) async {
    try {
      final response =
          await _apiService.get('/customer-service/tickets/$ticketId');
      return CustomerServiceModel.fromJson(response['data']['ticket']);
    } catch (e) {
      rethrow;
    }
  }

  /// Create new ticket
  Future<CustomerServiceModel> createTicket({
    required String subject,
    required String category,
    required String description,
    String? priority,
    List<String>? attachments,
  }) async {
    try {
      final response =
          await _apiService.post('/customer-service/tickets', data: {
        'subject': subject,
        'category': category,
        'description': description,
        if (priority != null) 'priority': priority,
        if (attachments != null) 'attachments': attachments,
      });
      return CustomerServiceModel.fromJson(response['data']['ticket']);
    } catch (e) {
      rethrow;
    }
  }

  /// Add message to ticket
  Future<CustomerServiceModel> addMessage({
    required String ticketId,
    required String message,
    List<String>? attachments,
  }) async {
    try {
      final response = await _apiService.post(
        '/customer-service/tickets/$ticketId/messages',
        data: {
          'message': message,
          if (attachments != null) 'attachments': attachments,
        },
      );
      return CustomerServiceModel.fromJson(response['data']['ticket']);
    } catch (e) {
      rethrow;
    }
  }

  /// Close ticket
  Future<CustomerServiceModel> closeTicket(String ticketId) async {
    try {
      final response =
          await _apiService.put('/customer-service/tickets/$ticketId/close');
      return CustomerServiceModel.fromJson(response['data']['ticket']);
    } catch (e) {
      rethrow;
    }
  }

  /// Reopen ticket
  Future<CustomerServiceModel> reopenTicket(String ticketId) async {
    try {
      final response =
          await _apiService.put('/customer-service/tickets/$ticketId/reopen');
      return CustomerServiceModel.fromJson(response['data']['ticket']);
    } catch (e) {
      rethrow;
    }
  }

  /// Rate support experience
  Future<void> rateSupport({
    required String ticketId,
    required int rating,
    String? feedback,
  }) async {
    try {
      await _apiService.post('/customer-service/tickets/$ticketId/rate', data: {
        'rating': rating,
        if (feedback != null) 'feedback': feedback,
      });
    } catch (e) {
      rethrow;
    }
  }

  /// Get FAQs
  Future<List<Map<String, dynamic>>> getFAQs({
    String? category,
  }) async {
    try {
      final response = await _apiService.get(
        '/customer-service/faq',
        queryParameters: {
          if (category != null) 'category': category,
        },
      );
      return List<Map<String, dynamic>>.from(response['data']['faqs'] ?? []);
    } catch (e) {
      rethrow;
    }
  }

  /// Search FAQs
  Future<List<Map<String, dynamic>>> searchFAQs(String query) async {
    try {
      final response = await _apiService.get(
        '/customer-service/faq/search',
        queryParameters: {
          'query': query,
        },
      );
      return List<Map<String, dynamic>>.from(response['data']['faqs'] ?? []);
    } catch (e) {
      rethrow;
    }
  }

  /// Get support categories
  Future<List<String>> getCategories() async {
    try {
      final response = await _apiService.get('/customer-service/categories');
      return List<String>.from(response['data']['categories'] ?? []);
    } catch (e) {
      rethrow;
    }
  }
}
