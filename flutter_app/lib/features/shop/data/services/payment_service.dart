import '../models/payment_method_model.dart';

/// Mock Payment Service for managing payment methods
class PaymentService {
  // Mock method to get user payment methods
  Future<List<PaymentMethodModel>> getPaymentMethods() async {
    // Simulate API delay
    await Future.delayed(const Duration(milliseconds: 500));
    
    // Return mock payment methods
    return [
      PaymentMethodModel(
        id: '1',
        type: 'card',
        name: 'Visa ending in 1234',
        cardLast4: '1234',
        cardBrand: 'visa',
        expiryMonth: '12',
        expiryYear: '25',
        isDefault: true,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
      PaymentMethodModel(
        id: '2',
        type: 'paypal',
        name: 'PayPal Account',
        isDefault: false,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
    ];
  }

  // Mock method to add payment method
  Future<PaymentMethodModel> addPaymentMethod(PaymentMethodModel paymentMethod) async {
    await Future.delayed(const Duration(milliseconds: 300));
    return paymentMethod;
  }

  // Mock method to update payment method
  Future<PaymentMethodModel> updatePaymentMethod(PaymentMethodModel paymentMethod) async {
    await Future.delayed(const Duration(milliseconds: 300));
    return paymentMethod;
  }

  // Mock method to delete payment method
  Future<void> deletePaymentMethod(String paymentMethodId) async {
    await Future.delayed(const Duration(milliseconds: 300));
  }

  // Mock method to set default payment method
  Future<void> setDefaultPaymentMethod(String paymentMethodId) async {
    await Future.delayed(const Duration(milliseconds: 300));
  }

  // Mock method to process payment
  Future<Map<String, dynamic>> processPayment({
    required String paymentMethodId,
    required double amount,
    required String currency,
    String? description,
  }) async {
    await Future.delayed(const Duration(seconds: 2)); // Simulate payment processing
    
    // Mock successful payment response
    return {
      'success': true,
      'transactionId': 'txn_${DateTime.now().millisecondsSinceEpoch}',
      'amount': amount,
      'currency': currency,
      'status': 'completed',
    };
  }
}