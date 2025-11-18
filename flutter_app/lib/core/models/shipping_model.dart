/// Shipping Model - Order tracking
/// Matches backend/src/models/Shipping.js
enum ShippingStatus {
  pending,
  processing,
  shipped,
  inTransit,
  outForDelivery,
  delivered,
  failed,
  returned,
  cancelled;

  static ShippingStatus fromString(String value) {
    return ShippingStatus.values.firstWhere(
      (e) => e.name == value,
      orElse: () => ShippingStatus.pending,
    );
  }
}

class ShippingAddress {
  final String fullName;
  final String addressLine1;
  final String? addressLine2;
  final String city;
  final String state;
  final String country;
  final String postalCode;
  final String phone;

  ShippingAddress({
    required this.fullName,
    required this.addressLine1,
    this.addressLine2,
    required this.city,
    required this.state,
    required this.country,
    required this.postalCode,
    required this.phone,
  });

  factory ShippingAddress.fromJson(Map<String, dynamic> json) {
    return ShippingAddress(
      fullName: json['fullName'],
      addressLine1: json['addressLine1'],
      addressLine2: json['addressLine2'],
      city: json['city'],
      state: json['state'],
      country: json['country'],
      postalCode: json['postalCode'],
      phone: json['phone'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'fullName': fullName,
      'addressLine1': addressLine1,
      if (addressLine2 != null) 'addressLine2': addressLine2,
      'city': city,
      'state': state,
      'country': country,
      'postalCode': postalCode,
      'phone': phone,
    };
  }

  String get fullAddress {
    final line2 = addressLine2 != null ? ', $addressLine2' : '';
    return '$addressLine1$line2, $city, $state $postalCode, $country';
  }
}

class TrackingUpdate {
  final String status;
  final String location;
  final String description;
  final DateTime timestamp;

  TrackingUpdate({
    required this.status,
    required this.location,
    required this.description,
    required this.timestamp,
  });

  factory TrackingUpdate.fromJson(Map<String, dynamic> json) {
    return TrackingUpdate(
      status: json['status'],
      location: json['location'],
      description: json['description'],
      timestamp: DateTime.parse(json['timestamp']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'status': status,
      'location': location,
      'description': description,
      'timestamp': timestamp.toIso8601String(),
    };
  }
}

class ShippingModel {
  final String id;
  final String orderId;
  final ShippingAddress address;
  final String? carrier;
  final String? trackingNumber;
  final ShippingStatus status;
  final double? shippingCost;
  final List<TrackingUpdate> trackingHistory;
  final DateTime? estimatedDelivery;
  final DateTime? actualDelivery;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  ShippingModel({
    required this.id,
    required this.orderId,
    required this.address,
    this.carrier,
    this.trackingNumber,
    this.status = ShippingStatus.pending,
    this.shippingCost,
    this.trackingHistory = const [],
    this.estimatedDelivery,
    this.actualDelivery,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
  });

  factory ShippingModel.fromJson(Map<String, dynamic> json) {
    return ShippingModel(
      id: json['_id'] ?? json['id'],
      orderId: json['order'] ?? json['orderId'],
      address: ShippingAddress.fromJson(json['address']),
      carrier: json['carrier'],
      trackingNumber: json['trackingNumber'],
      status: ShippingStatus.fromString(json['status'] ?? 'pending'),
      shippingCost: json['shippingCost']?.toDouble(),
      trackingHistory: json['trackingHistory'] != null
          ? (json['trackingHistory'] as List)
              .map((e) => TrackingUpdate.fromJson(e))
              .toList()
          : [],
      estimatedDelivery: json['estimatedDelivery'] != null
          ? DateTime.parse(json['estimatedDelivery'])
          : null,
      actualDelivery: json['actualDelivery'] != null
          ? DateTime.parse(json['actualDelivery'])
          : null,
      notes: json['notes'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'order': orderId,
      'address': address.toJson(),
      if (carrier != null) 'carrier': carrier,
      if (trackingNumber != null) 'trackingNumber': trackingNumber,
      'status': status.name,
      if (shippingCost != null) 'shippingCost': shippingCost,
      'trackingHistory': trackingHistory.map((e) => e.toJson()).toList(),
      if (estimatedDelivery != null)
        'estimatedDelivery': estimatedDelivery!.toIso8601String(),
      if (actualDelivery != null)
        'actualDelivery': actualDelivery!.toIso8601String(),
      if (notes != null) 'notes': notes,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  bool get isDelivered => status == ShippingStatus.delivered;
  bool get isCancelled => status == ShippingStatus.cancelled;
  bool get isInTransit => status == ShippingStatus.inTransit;
  bool get isInProgress =>
      status == ShippingStatus.shipped ||
      status == ShippingStatus.inTransit ||
      status == ShippingStatus.outForDelivery;
  bool get hasTracking => trackingNumber != null && trackingNumber!.isNotEmpty;
  bool get hasTrackingHistory => trackingHistory.isNotEmpty;

  // Additional getters for backward compatibility
  String? get carrierContact => carrier; // Use carrier as contact for now
  String get serviceType => 'Standard Shipping'; // Default service type
  String get weight => '0.5 kg'; // Default weight
  String get dimensions => '20x15x5 cm'; // Default dimensions

  String get statusDisplay {
    switch (status) {
      case ShippingStatus.pending:
        return 'Pending';
      case ShippingStatus.processing:
        return 'Processing';
      case ShippingStatus.shipped:
        return 'Shipped';
      case ShippingStatus.inTransit:
        return 'In Transit';
      case ShippingStatus.outForDelivery:
        return 'Out for Delivery';
      case ShippingStatus.delivered:
        return 'Delivered';
      case ShippingStatus.failed:
        return 'Delivery Failed';
      case ShippingStatus.returned:
        return 'Returned';
      case ShippingStatus.cancelled:
        return 'Cancelled';
    }
  }

  TrackingUpdate? get latestUpdate {
    if (trackingHistory.isEmpty) return null;
    return trackingHistory.last;
  }
}
