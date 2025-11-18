// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'product_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Product _$ProductFromJson(Map<String, dynamic> json) => _Product(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      price: (json['price'] as num).toDouble(),
      originalPrice: (json['originalPrice'] as num?)?.toDouble() ?? 0,
      images: (json['images'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      rating: (json['rating'] as num?)?.toDouble() ?? 0.0,
      reviewCount: (json['reviewCount'] as num?)?.toInt() ?? 0,
      stock: (json['stock'] as num?)?.toInt() ?? 0,
      category: json['category'] as String,
      sizes:
          (json['sizes'] as List<dynamic>?)?.map((e) => e as String).toList() ??
              const [],
      colors: (json['colors'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      features: (json['features'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      sellerId: json['sellerId'] as String?,
      sellerName: json['sellerName'] as String?,
      isSellerVerified: json['isSellerVerified'] as bool? ?? false,
      sellerRating: (json['sellerRating'] as num?)?.toDouble() ?? 0.0,
      isFeatured: json['isFeatured'] as bool? ?? false,
      isNew: json['isNew'] as bool? ?? false,
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$ProductToJson(_Product instance) => <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'description': instance.description,
      'price': instance.price,
      'originalPrice': instance.originalPrice,
      'images': instance.images,
      'rating': instance.rating,
      'reviewCount': instance.reviewCount,
      'stock': instance.stock,
      'category': instance.category,
      'sizes': instance.sizes,
      'colors': instance.colors,
      'features': instance.features,
      'sellerId': instance.sellerId,
      'sellerName': instance.sellerName,
      'isSellerVerified': instance.isSellerVerified,
      'sellerRating': instance.sellerRating,
      'isFeatured': instance.isFeatured,
      'isNew': instance.isNew,
      'createdAt': instance.createdAt?.toIso8601String(),
    };

_CartItem _$CartItemFromJson(Map<String, dynamic> json) => _CartItem(
      id: json['id'] as String,
      product: Product.fromJson(json['product'] as Map<String, dynamic>),
      quantity: (json['quantity'] as num).toInt(),
      selectedSize: json['selectedSize'] as String?,
      selectedColor: json['selectedColor'] as String?,
      subtotal: (json['subtotal'] as num).toDouble(),
    );

Map<String, dynamic> _$CartItemToJson(_CartItem instance) => <String, dynamic>{
      'id': instance.id,
      'product': instance.product,
      'quantity': instance.quantity,
      'selectedSize': instance.selectedSize,
      'selectedColor': instance.selectedColor,
      'subtotal': instance.subtotal,
    };

_Address _$AddressFromJson(Map<String, dynamic> json) => _Address(
      id: json['id'] as String,
      name: json['name'] as String,
      addressLine1: json['addressLine1'] as String,
      addressLine2: json['addressLine2'] as String?,
      city: json['city'] as String,
      state: json['state'] as String,
      zipCode: json['zipCode'] as String,
      phone: json['phone'] as String,
      isDefault: json['isDefault'] as bool? ?? false,
    );

Map<String, dynamic> _$AddressToJson(_Address instance) => <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'addressLine1': instance.addressLine1,
      'addressLine2': instance.addressLine2,
      'city': instance.city,
      'state': instance.state,
      'zipCode': instance.zipCode,
      'phone': instance.phone,
      'isDefault': instance.isDefault,
    };

_PaymentMethod _$PaymentMethodFromJson(Map<String, dynamic> json) =>
    _PaymentMethod(
      id: json['id'] as String,
      type: json['type'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      cardLast4: json['cardLast4'] as String?,
      isDefault: json['isDefault'] as bool? ?? false,
    );

Map<String, dynamic> _$PaymentMethodToJson(_PaymentMethod instance) =>
    <String, dynamic>{
      'id': instance.id,
      'type': instance.type,
      'name': instance.name,
      'description': instance.description,
      'cardLast4': instance.cardLast4,
      'isDefault': instance.isDefault,
    };

_Order _$OrderFromJson(Map<String, dynamic> json) => _Order(
      id: json['id'] as String,
      orderNumber: json['orderNumber'] as String,
      date: DateTime.parse(json['date'] as String),
      status: json['status'] as String,
      items: (json['items'] as List<dynamic>)
          .map((e) => OrderItem.fromJson(e as Map<String, dynamic>))
          .toList(),
      subtotal: (json['subtotal'] as num).toDouble(),
      shipping: (json['shipping'] as num).toDouble(),
      tax: (json['tax'] as num).toDouble(),
      total: (json['total'] as num).toDouble(),
      shippingAddress:
          Address.fromJson(json['shippingAddress'] as Map<String, dynamic>),
      paymentMethod:
          PaymentMethod.fromJson(json['paymentMethod'] as Map<String, dynamic>),
      trackingNumber: json['trackingNumber'] as String?,
      estimatedDelivery: json['estimatedDelivery'] == null
          ? null
          : DateTime.parse(json['estimatedDelivery'] as String),
    );

Map<String, dynamic> _$OrderToJson(_Order instance) => <String, dynamic>{
      'id': instance.id,
      'orderNumber': instance.orderNumber,
      'date': instance.date.toIso8601String(),
      'status': instance.status,
      'items': instance.items,
      'subtotal': instance.subtotal,
      'shipping': instance.shipping,
      'tax': instance.tax,
      'total': instance.total,
      'shippingAddress': instance.shippingAddress,
      'paymentMethod': instance.paymentMethod,
      'trackingNumber': instance.trackingNumber,
      'estimatedDelivery': instance.estimatedDelivery?.toIso8601String(),
    };

_OrderItem _$OrderItemFromJson(Map<String, dynamic> json) => _OrderItem(
      id: json['id'] as String,
      productId: json['productId'] as String,
      title: json['title'] as String,
      image: json['image'] as String,
      quantity: (json['quantity'] as num).toInt(),
      price: (json['price'] as num).toDouble(),
      selectedSize: json['selectedSize'] as String?,
      selectedColor: json['selectedColor'] as String?,
    );

Map<String, dynamic> _$OrderItemToJson(_OrderItem instance) =>
    <String, dynamic>{
      'id': instance.id,
      'productId': instance.productId,
      'title': instance.title,
      'image': instance.image,
      'quantity': instance.quantity,
      'price': instance.price,
      'selectedSize': instance.selectedSize,
      'selectedColor': instance.selectedColor,
    };

_Review _$ReviewFromJson(Map<String, dynamic> json) => _Review(
      id: json['id'] as String,
      userId: json['userId'] as String,
      userName: json['userName'] as String,
      userAvatar: json['userAvatar'] as String?,
      rating: (json['rating'] as num).toDouble(),
      comment: json['comment'] as String,
      date: DateTime.parse(json['date'] as String),
      isVerifiedPurchase: json['isVerifiedPurchase'] as bool? ?? false,
      helpfulCount: (json['helpfulCount'] as num?)?.toInt() ?? 0,
    );

Map<String, dynamic> _$ReviewToJson(_Review instance) => <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'userName': instance.userName,
      'userAvatar': instance.userAvatar,
      'rating': instance.rating,
      'comment': instance.comment,
      'date': instance.date.toIso8601String(),
      'isVerifiedPurchase': instance.isVerifiedPurchase,
      'helpfulCount': instance.helpfulCount,
    };
