import 'package:flutter/foundation.dart';
import '../../../core/services/api_service.dart';
import '../models/streaming_provider_model.dart';
import 'streaming_service_interface.dart';
import 'agora_streaming_service.dart';
import 'zegocloud_streaming_service.dart';
import 'webrtc_streaming_service.dart';

/// Manages streaming provider selection and switching
/// Fetches active provider from backend and initializes appropriate service
class StreamingProviderManager {
  static final StreamingProviderManager _instance = StreamingProviderManager._internal();
  factory StreamingProviderManager() => _instance;
  StreamingProviderManager._internal();

  final ApiService _apiService = ApiService();
  StreamingServiceInterface? _currentService;
  StreamingProviderModel? _activeProvider;
  List<StreamingProviderModel> _availableProviders = [];

  StreamingServiceInterface? get currentService => _currentService;
  StreamingProviderModel? get activeProvider => _activeProvider;
  List<StreamingProviderModel> get availableProviders => _availableProviders;

  /// Fetch available providers from backend and select active one
  Future<StreamingProviderModel> fetchActiveProvider() async {
    try {
      // Get providers list
      final response = await _apiService.dio.get('/streaming/providers');
      
      if (response.data['success'] == true) {
        final providersData = response.data['data']['providers'] ?? [];
        _availableProviders = providersData
            .map((json) => StreamingProviderModel.fromJson(json))
            .toList();

        // Get default provider from settings
        final settingsResponse = await _apiService.dio.get('/settings/public');
        final defaultProvider = settingsResponse.data['data']?['streaming']?['default_provider'] ?? 'agora';

        // Find active provider (enabled, active status, highest priority)
        final enabledProviders = _availableProviders
            .where((p) => p.isActive)
            .toList();

        if (enabledProviders.isEmpty) {
          throw Exception('No active streaming providers available');
        }

        // Sort by priority and find default or first available
        enabledProviders.sort((a, b) => a.priority.compareTo(b.priority));
        
        _activeProvider = enabledProviders.firstWhere(
          (p) => p.name == defaultProvider,
          orElse: () => enabledProviders.first,
        );

        // Initialize the service
        await _initializeService(_activeProvider!);

        return _activeProvider!;
      }

      throw Exception('Failed to fetch streaming providers');
    } catch (e) {
      print('Error fetching active provider: $e');
      // Fallback to Agora if available
      if (_availableProviders.isEmpty) {
        throw Exception('No streaming providers available');
      }
      
      final agoraProvider = _availableProviders.firstWhere(
        (p) => p.name == 'agora' && p.isActive,
        orElse: () => _availableProviders.firstWhere(
          (p) => p.isActive,
          orElse: () => throw Exception('No active providers'),
        ),
      );
      
      _activeProvider = agoraProvider;
      await _initializeService(_activeProvider!);
      return _activeProvider!;
    }
  }

  /// Initialize the appropriate streaming service based on provider
  Future<void> _initializeService(StreamingProviderModel provider) async {
    // Dispose current service if exists
    if (_currentService != null) {
      await _currentService!.dispose();
    }

    // Create new service based on provider name
    switch (provider.name.toLowerCase()) {
      case 'agora':
        _currentService = AgoraStreamingService();
        break;
      case 'zegocloud':
      case 'zego':
        _currentService = ZegoCloudStreamingService();
        break;
      case 'webrtc':
        _currentService = WebRTCStreamingService();
        break;
      default:
        throw Exception('Unknown streaming provider: ${provider.name}');
    }

    // Initialize with provider config
    await _currentService!.initialize(provider.config);
  }

  /// Switch to a different provider (admin-controlled)
  Future<void> switchProvider(String providerName) async {
    final provider = _availableProviders.firstWhere(
      (p) => p.name == providerName && p.isActive,
      orElse: () => throw Exception('Provider not available: $providerName'),
    );

    _activeProvider = provider;
    await _initializeService(provider);
  }

  /// Refresh provider list and reinitialize if needed
  Future<void> refresh() async {
    await fetchActiveProvider();
  }

  /// Dispose all resources
  Future<void> dispose() async {
    if (_currentService != null) {
      await _currentService!.dispose();
      _currentService = null;
    }
    _activeProvider = null;
    _availableProviders = [];
  }
}

