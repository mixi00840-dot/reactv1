import 'package:freezed_annotation/freezed_annotation.dart';

part 'product_model.freezed.dart';
part 'product_model.g.dart';

/// Product model for e-commerce
@freezed
class Product with _$Product {
  const factory Product({
    required String id,
    required String title,
    required String description,
    required double price,
    @Default(0) double originalPrice,
    @Default([]) List<String> images,
    @Default(0.0) double rating,
    @Default(0) int reviewCount,
    @Default(0) int stock,
    required String category,
    @Default([]) List<String> sizes,
    @Default([]) List<String> colors,
    @Default([]) List<String> features,
    String? sellerId,
    String? sellerName,
    @Default(false) bool isSellerVerified,
    @Default(0.0) double sellerRating,
    @Default(false) bool isFeatured,
    @Default(false) bool isNew,
    DateTime? createdAt,
  }) = _Product;

  factory Product.fromJson(Map<String, dynamic> json) =>
      _$ProductFromJson(json);
}

/// Cart item model
@freezed
class CartItem with _$CartItem {
  const factory CartItem({
    required String id,
    required Product product,
    required int quantity,
    String? selectedSize,
    String? selectedColor,
    required double subtotal,
  }) = _CartItem;

  factory CartItem.fromJson(Map<String, dynamic> json) =>
      _$CartItemFromJson(json);
}

/// Address model
@freezed
class Address with _$Address {
  const factory Address({
    required String id,
    required String name,
    required String addressLine1,
    String? addressLine2,
    required String city,
    required String state,
    required String zipCode,
    required String phone,
    @Default(false) bool isDefault,
  }) = _Address;

  factory Address.fromJson(Map<String, dynamic> json) =>
      _$AddressFromJson(json);
}

/// Payment method model
@freezed
class PaymentMethod with _$PaymentMethod {
  const factory PaymentMethod({
    required String id,
    required String type, // 'card', 'paypal', 'cod'
    required String name,
    String? description,
    String? cardLast4,
    @Default(false) bool isDefault,
  }) = _PaymentMethod;

  factory PaymentMethod.fromJson(Map<String, dynamic> json) =>
      _$PaymentMethodFromJson(json);
}

/// Order model
@freezed
class Order with _$Order {
  const factory Order({
    required String id,
    required String orderNumber,
    required DateTime date,
    required String status, // 'pending', 'shipped', 'delivered', 'canceled'
    required List<OrderItem> items,
    required double subtotal,
    required double shipping,
    required double tax,
    required double total,
    required Address shippingAddress,
    required PaymentMethod paymentMethod,
    String? trackingNumber,
    DateTime? estimatedDelivery,
  }) = _Order;

  factory Order.fromJson(Map<String, dynamic> json) => _$OrderFromJson(json);
}

/// Order item model
@freezed
class OrderItem with _$OrderItem {
  const factory OrderItem({
    required String id,
    required String productId,
    required String title,
    required String image,
    required int quantity,
    required double price,
    String? selectedSize,
    String? selectedColor,
  }) = _OrderItem;

  factory OrderItem.fromJson(Map<String, dynamic> json) =>
      _$OrderItemFromJson(json);
}

/// Review model
@freezed
class Review with _$Review {
  const factory Review({
    required String id,
    required String userId,
    required String userName,
    String? userAvatar,
    required double rating,
    required String comment,
    required DateTime date,
    @Default(false) bool isVerifiedPurchase,
    @Default(0) int helpfulCount,
  }) = _Review;

  factory Review.fromJson(Map<String, dynamic> json) => _$ReviewFromJson(json);
}
