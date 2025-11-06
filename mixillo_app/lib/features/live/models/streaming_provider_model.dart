class StreamingProviderModel {
  final String name; // 'agora', 'zegocloud', 'webrtc'
  final String displayName;
  final bool enabled;
  final String status; // 'active', 'maintenance', 'degraded', 'offline'
  final int priority;
  final StreamingProviderConfig config;
  final Map<String, dynamic>? features;

  StreamingProviderModel({
    required this.name,
    required this.displayName,
    required this.enabled,
    required this.status,
    required this.priority,
    required this.config,
    this.features,
  });

  factory StreamingProviderModel.fromJson(Map<String, dynamic> json) {
    return StreamingProviderModel(
      name: json['name'] ?? '',
      displayName: json['displayName'] ?? json['display_name'] ?? '',
      enabled: json['enabled'] ?? false,
      status: json['status'] ?? 'offline',
      priority: json['priority'] ?? 999,
      config: StreamingProviderConfig.fromJson(json['config'] ?? {}),
      features: json['features'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'displayName': displayName,
      'enabled': enabled,
      'status': status,
      'priority': priority,
      'config': config.toJson(),
      'features': features,
    };
  }

  bool get isActive => enabled && status == 'active';
}

class StreamingProviderConfig {
  final String appId;
  final String? appKey;
  final String? appSecret;
  final String? serverUrl;
  final String region;
  final String protocol; // 'rtmp', 'webrtc', 'hls', 'flv'
  final String maxResolution;
  final int? maxBitrate;
  final int? maxFrameRate;

  StreamingProviderConfig({
    required this.appId,
    this.appKey,
    this.appSecret,
    this.serverUrl,
    this.region = 'global',
    this.protocol = 'webrtc',
    this.maxResolution = '1080p',
    this.maxBitrate,
    this.maxFrameRate,
  });

  factory StreamingProviderConfig.fromJson(Map<String, dynamic> json) {
    return StreamingProviderConfig(
      appId: json['appId'] ?? json['app_id'] ?? '',
      appKey: json['appKey'] ?? json['app_key'],
      appSecret: json['appSecret'] ?? json['app_secret'],
      serverUrl: json['serverUrl'] ?? json['server_url'],
      region: json['region'] ?? 'global',
      protocol: json['protocol'] ?? 'webrtc',
      maxResolution: json['maxResolution'] ?? json['max_resolution'] ?? '1080p',
      maxBitrate: json['maxBitrate'] ?? json['max_bitrate'],
      maxFrameRate: json['maxFrameRate'] ?? json['max_frame_rate'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'appId': appId,
      'appKey': appKey,
      'appSecret': appSecret,
      'serverUrl': serverUrl,
      'region': region,
      'protocol': protocol,
      'maxResolution': maxResolution,
      'maxBitrate': maxBitrate,
      'maxFrameRate': maxFrameRate,
    };
  }
}

class LiveStreamModel {
  final String id;
  final String userId;
  final String title;
  final String status; // 'starting', 'live', 'ended', 'paused'
  final bool isPrivate;
  final int viewers;
  final String? chatRoomId;
  final String? rtmpUrl;
  final String? streamKey;
  final String? hlsUrl;
  final String? websocketUrl;
  final String? provider; // 'agora', 'zegocloud', 'webrtc'
  final DateTime createdAt;
  final Map<String, dynamic>? metadata;

  LiveStreamModel({
    required this.id,
    required this.userId,
    required this.title,
    required this.status,
    this.isPrivate = false,
    this.viewers = 0,
    this.chatRoomId,
    this.rtmpUrl,
    this.streamKey,
    this.hlsUrl,
    this.websocketUrl,
    this.provider,
    required this.createdAt,
    this.metadata,
  });

  factory LiveStreamModel.fromJson(Map<String, dynamic> json) {
    return LiveStreamModel(
      id: json['id'] ?? json['streamId'] ?? '',
      userId: json['userId'] ?? '',
      title: json['title'] ?? '',
      status: json['status'] ?? 'offline',
      isPrivate: json['isPrivate'] ?? json['is_private'] ?? false,
      viewers: json['viewers'] ?? 0,
      chatRoomId: json['chatRoomId'] ?? json['chat_room_id'],
      rtmpUrl: json['rtmpUrl'] ?? json['rtmp_url'],
      streamKey: json['streamKey'] ?? json['stream_key'],
      hlsUrl: json['hlsUrl'] ?? json['hls_url'],
      websocketUrl: json['websocketUrl'] ?? json['websocket_url'],
      provider: json['provider'],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'].toString())
          : DateTime.now(),
      metadata: json['metadata'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'title': title,
      'status': status,
      'isPrivate': isPrivate,
      'viewers': viewers,
      'chatRoomId': chatRoomId,
      'rtmpUrl': rtmpUrl,
      'streamKey': streamKey,
      'hlsUrl': hlsUrl,
      'websocketUrl': websocketUrl,
      'provider': provider,
      'createdAt': createdAt.toIso8601String(),
      'metadata': metadata,
    };
  }
}

