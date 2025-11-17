/// StreamProvider Model - Stream configuration
/// Matches backend/src/models/StreamProvider.js
enum StreamProviderType {
  agora,
  zegocloud,
  webrtc;

  static StreamProviderType fromString(String value) {
    return StreamProviderType.values.firstWhere(
      (e) => e.name == value,
      orElse: () => StreamProviderType.agora,
    );
  }
}

class StreamProviderConfig {
  final String? appId;
  final String? appCertificate;
  final String? apiKey;
  final String? apiSecret;
  final Map<String, dynamic>? additionalSettings;

  StreamProviderConfig({
    this.appId,
    this.appCertificate,
    this.apiKey,
    this.apiSecret,
    this.additionalSettings,
  });

  factory StreamProviderConfig.fromJson(Map<String, dynamic> json) {
    return StreamProviderConfig(
      appId: json['appId'],
      appCertificate: json['appCertificate'],
      apiKey: json['apiKey'],
      apiSecret: json['apiSecret'],
      additionalSettings: json['additionalSettings'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (appId != null) 'appId': appId,
      if (appCertificate != null) 'appCertificate': appCertificate,
      if (apiKey != null) 'apiKey': apiKey,
      if (apiSecret != null) 'apiSecret': apiSecret,
      if (additionalSettings != null) 'additionalSettings': additionalSettings,
    };
  }
}

class StreamProviderModel {
  final String id;
  final String name;
  final StreamProviderType type;
  final StreamProviderConfig config;
  final bool active;
  final bool isPrimary;
  final int priority;
  final Map<String, dynamic>? features;
  final DateTime createdAt;
  final DateTime updatedAt;

  StreamProviderModel({
    required this.id,
    required this.name,
    required this.type,
    required this.config,
    this.active = true,
    this.isPrimary = false,
    this.priority = 0,
    this.features,
    required this.createdAt,
    required this.updatedAt,
  });

  factory StreamProviderModel.fromJson(Map<String, dynamic> json) {
    return StreamProviderModel(
      id: json['_id'] ?? json['id'],
      name: json['name'],
      type: StreamProviderType.fromString(json['type'] ?? 'agora'),
      config: StreamProviderConfig.fromJson(json['config'] ?? {}),
      active: json['active'] ?? true,
      isPrimary: json['isPrimary'] ?? false,
      priority: json['priority'] ?? 0,
      features: json['features'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'type': type.name,
      'config': config.toJson(),
      'active': active,
      'isPrimary': isPrimary,
      'priority': priority,
      if (features != null) 'features': features,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  bool supportsFeature(String feature) {
    if (features == null) return false;
    return features![feature] == true;
  }

  bool get hasValidConfig {
    return config.appId != null && config.appId!.isNotEmpty;
  }
}
