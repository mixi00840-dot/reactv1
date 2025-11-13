import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'agora_stream_manager.dart';
import 'zego_stream_manager.dart';
import 'live_streaming_service.dart';

/// Stream provider type
enum StreamProvider {
  agora,
  zegocloud,
}

/// Unified stream manager that switches between Agora and ZegoCloud
class StreamProviderManager {
  static final StreamProviderManager _instance = StreamProviderManager._internal();
  factory StreamProviderManager() => _instance;
  StreamProviderManager._internal();

  // ✅ NEW: SharedPreferences key for provider preference
  static const String _providerPreferenceKey = 'preferred_streaming_provider';

  StreamProvider _currentProvider = StreamProvider.agora;
  final AgoraStreamManager _agoraManager = AgoraStreamManager();
  final ZegoStreamManager _zegoManager = ZegoStreamManager();

  // ✅ NEW: Load preferred provider on first access
  bool _isPreferenceLoaded = false;

  // Getters
  StreamProvider get currentProvider => _currentProvider;
  
  // ✅ NEW: Get preferred provider from storage
  Future<StreamProvider> getPreferredProvider() async {
    final prefs = await SharedPreferences.getInstance();
    final providerName = prefs.getString(_providerPreferenceKey);
    
    if (providerName == 'zegocloud') {
      return StreamProvider.zegocloud;
    }
    return StreamProvider.agora; // Default
  }

  // ✅ NEW: Save provider preference
  Future<void> saveProviderPreference(StreamProvider provider) async {
    final prefs = await SharedPreferences.getInstance();
    final providerName = provider == StreamProvider.agora ? 'agora' : 'zegocloud';
    await prefs.setString(_providerPreferenceKey, providerName);
    debugPrint('✅ Saved provider preference: $providerName');
  }

  // ✅ NEW: Initialize with saved preference
  Future<void> initializeWithPreference() async {
    if (!_isPreferenceLoaded) {
      _currentProvider = await getPreferredProvider();
      _isPreferenceLoaded = true;
      debugPrint('🎯 Loaded preferred provider: $_currentProvider');
    }
  }

  bool get isInitialized {
    switch (_currentProvider) {
      case StreamProvider.agora:
        return _agoraManager.isInitialized;
      case StreamProvider.zegocloud:
        return _zegoManager.isInitialized;
    }
  }

  bool get isStreaming {
    switch (_currentProvider) {
      case StreamProvider.agora:
        return _agoraManager.isJoined;
      case StreamProvider.zegocloud:
        return _zegoManager.isPublishing || _zegoManager.isPlaying;
    }
  }

  bool get isMuted {
    switch (_currentProvider) {
      case StreamProvider.agora:
        return _agoraManager.isMuted;
      case StreamProvider.zegocloud:
        return _zegoManager.isMuted;
    }
  }

  bool get isCameraOff {
    switch (_currentProvider) {
      case StreamProvider.agora:
        return _agoraManager.isCameraOff;
      case StreamProvider.zegocloud:
        return _zegoManager.isCameraOff;
    }
  }

  bool get isFrontCamera {
    switch (_currentProvider) {
      case StreamProvider.agora:
        return _agoraManager.isFrontCamera;
      case StreamProvider.zegocloud:
        return _zegoManager.isFrontCamera;
    }
  }

  /// Set active provider (call this after fetching from backend)
  Future<void> setProvider(StreamProvider provider) async {
    _currentProvider = provider;
    // ✅ NEW: Save preference for future sessions
    await saveProviderPreference(provider);
    debugPrint('🎯 Stream provider set to: ${provider.name}');
  }

  /// ✅ NEW: Set provider from string name
  Future<void> setProviderByName(String providerName) async {
    final provider = providerName.toLowerCase() == 'zegocloud' 
        ? StreamProvider.zegocloud 
        : StreamProvider.agora;
    await setProvider(provider);
  }

  /// Initialize the current provider
  Future<bool> initialize(Map<String, dynamic> config) async {
    switch (_currentProvider) {
      case StreamProvider.agora:
        final appId = config['appId'] as String? ?? '';
        return await _agoraManager.initialize(appId);
        
      case StreamProvider.zegocloud:
        final appID = config['appID'] as int? ?? 0;
        final appSign = config['appSign'] as String? ?? '';
        return await _zegoManager.initialize(appID, appSign);
    }
  }

  /// Start broadcasting
  Future<bool> startBroadcasting({
    required LiveStreamConfig streamConfig,
    String quality = 'high',
  }) async {
    switch (_currentProvider) {
      case StreamProvider.agora:
        final agoraQuality = _mapToAgoraQuality(quality);
        return await _agoraManager.startBroadcasting(
          streamConfig: streamConfig,
          quality: agoraQuality,
        );
        
      case StreamProvider.zegocloud:
        final zegoQuality = _mapToZegoQuality(quality);
        return await _zegoManager.startBroadcasting(
          streamConfig: streamConfig,
          quality: zegoQuality,
        );
    }
  }

  /// Join as viewer
  Future<bool> joinAsViewer({
    required LiveStreamConfig streamConfig,
  }) async {
    switch (_currentProvider) {
      case StreamProvider.agora:
        return await _agoraManager.joinAsViewer(streamConfig: streamConfig);
        
      case StreamProvider.zegocloud:
        return await _zegoManager.joinAsViewer(streamConfig: streamConfig);
    }
  }

  /// Toggle microphone mute
  Future<void> toggleMute() async {
    switch (_currentProvider) {
      case StreamProvider.agora:
        await _agoraManager.toggleMute();
        break;
      case StreamProvider.zegocloud:
        await _zegoManager.toggleMute();
        break;
    }
  }

  /// Toggle camera on/off
  Future<void> toggleCamera() async {
    switch (_currentProvider) {
      case StreamProvider.agora:
        await _agoraManager.toggleCamera();
        break;
      case StreamProvider.zegocloud:
        await _zegoManager.toggleCamera();
        break;
    }
  }

  /// Switch camera (front/back)
  Future<void> switchCamera() async {
    switch (_currentProvider) {
      case StreamProvider.agora:
        await _agoraManager.switchCamera();
        break;
      case StreamProvider.zegocloud:
        await _zegoManager.switchCamera();
        break;
    }
  }

  /// Change stream quality
  Future<void> setStreamQuality(String quality) async {
    switch (_currentProvider) {
      case StreamProvider.agora:
        final agoraQuality = _mapToAgoraQuality(quality);
        await _agoraManager.setStreamQuality(agoraQuality);
        break;
        
      case StreamProvider.zegocloud:
        final zegoQuality = _mapToZegoQuality(quality);
        await _zegoManager.setStreamQuality(zegoQuality);
        break;
    }
  }

  /// Enable beauty effects
  Future<void> enableBeautyEffects() async {
    switch (_currentProvider) {
      case StreamProvider.agora:
        await _agoraManager.enableBeautyEffects();
        break;
      case StreamProvider.zegocloud:
        await _zegoManager.enableBeautyEffects();
        break;
    }
  }

  /// Disable beauty effects
  Future<void> disableBeautyEffects() async {
    switch (_currentProvider) {
      case StreamProvider.agora:
        await _agoraManager.disableBeautyEffects();
        break;
      case StreamProvider.zegocloud:
        await _zegoManager.disableBeautyEffects();
        break;
    }
  }

  /// Leave channel/room
  Future<void> leaveStream() async {
    switch (_currentProvider) {
      case StreamProvider.agora:
        await _agoraManager.leaveChannel();
        break;
      case StreamProvider.zegocloud:
        await _zegoManager.leaveRoom();
        break;
    }
  }

  /// Dispose all resources
  Future<void> dispose() async {
    await _agoraManager.dispose();
    await _zegoManager.dispose();
  }

  /// Get Agora manager (for direct access when needed)
  AgoraStreamManager get agoraManager => _agoraManager;

  /// Get ZegoCloud manager (for direct access when needed)
  ZegoStreamManager get zegoManager => _zegoManager;

  /// Map quality string to Agora quality
  AgoraStreamQuality _mapToAgoraQuality(String quality) {
    switch (quality.toLowerCase()) {
      case 'low':
        return AgoraStreamQuality.low;
      case 'medium':
        return AgoraStreamQuality.medium;
      case 'ultra':
        return AgoraStreamQuality.ultra;
      case 'high':
      default:
        return AgoraStreamQuality.high;
    }
  }

  /// Map quality string to ZegoCloud quality
  ZegoStreamQuality _mapToZegoQuality(String quality) {
    switch (quality.toLowerCase()) {
      case 'low':
        return ZegoStreamQuality.low;
      case 'medium':
        return ZegoStreamQuality.medium;
      case 'ultra':
        return ZegoStreamQuality.ultra;
      case 'high':
      default:
        return ZegoStreamQuality.high;
    }
  }

  /// Get quality description
  String getQualityDescription(String quality) {
    switch (_currentProvider) {
      case StreamProvider.agora:
        final agoraQuality = _mapToAgoraQuality(quality);
        switch (agoraQuality) {
          case AgoraStreamQuality.low:
            return '480p, 15fps, 400kbps';
          case AgoraStreamQuality.medium:
            return '720p, 24fps, 1000kbps';
          case AgoraStreamQuality.high:
            return '720p, 30fps, 1500kbps';
          case AgoraStreamQuality.ultra:
            return '1080p, 30fps, 2500kbps';
        }
        
      case StreamProvider.zegocloud:
        final zegoQuality = _mapToZegoQuality(quality);
        switch (zegoQuality) {
          case ZegoStreamQuality.low:
            return '360p, 15fps';
          case ZegoStreamQuality.medium:
            return '540p, 24fps';
          case ZegoStreamQuality.high:
            return '720p, 30fps';
          case ZegoStreamQuality.ultra:
            return '1080p, 30fps';
        }
    }
  }

  /// Get provider display name
  String getProviderName() {
    switch (_currentProvider) {
      case StreamProvider.agora:
        return 'Agora';
      case StreamProvider.zegocloud:
        return 'ZegoCloud';
    }
  }

  /// Get preview widget (async for ZegoCloud)
  Future<Widget?> getPreviewWidgetAsync() async {
    switch (_currentProvider) {
      case StreamProvider.agora:
        return null; // Agora uses AgoraVideoView directly with engine
      case StreamProvider.zegocloud:
        return await _zegoManager.createPreviewView();
    }
  }

  /// Get remote widget (async for ZegoCloud)
  Future<Widget?> getRemoteWidgetAsync(String streamID) async {
    switch (_currentProvider) {
      case StreamProvider.agora:
        return null; // Agora uses AgoraVideoView directly with engine
      case StreamProvider.zegocloud:
        return await _zegoManager.createPlayView(streamID);
    }
  }

  /// Parse provider from string
  static StreamProvider parseProvider(String provider) {
    switch (provider.toLowerCase()) {
      case 'zegocloud':
      case 'zego':
        return StreamProvider.zegocloud;
      case 'agora':
      default:
        return StreamProvider.agora;
    }
  }
}
