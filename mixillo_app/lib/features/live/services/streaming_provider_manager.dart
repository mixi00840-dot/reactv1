import '../../../core/services/api_service.dart';
import '../models/streaming_provider_model.dart';
import 'streaming_service_interface.dart';
import 'agora_streaming_service.dart';
import 'zegocloud_streaming_service.dart';
import 'webrtc_streaming_service.dart';
import 'dart:async';
import 'package:dio/dio.dart';

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
  Timer? _healthCheckTimer;
  int _failureCount = 0;
  static const int maxFailures = 3;
  
  bool _isHealthy = true;
  // ignore: unused_field
  DateTime? _lastHealthCheck; // Track last health check time for debugging

  StreamingServiceInterface? get currentService => _currentService;
  StreamingProviderModel? get activeProvider => _activeProvider;
  List<StreamingProviderModel> get availableProviders => _availableProviders;
  bool get isHealthy => _isHealthy;

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
    _failureCount = 0; // Reset failure count on manual switch
    _isHealthy = true;
  }

  /// Automatic failover to next available provider
  Future<bool> failoverToNextProvider({String? currentStreamId}) async {
    try {
      print('Attempting failover from ${_activeProvider?.name}...');
      
      // Get list of providers excluding current failed one
      final fallbackProviders = _availableProviders
          .where((p) => p.isActive && p.name != _activeProvider?.name)
          .toList();
      
      fallbackProviders.sort((a, b) => a.priority.compareTo(b.priority));
      
      if (fallbackProviders.isEmpty) {
        print('No fallback providers available');
        _isHealthy = false;
        return false;
      }
      
      // Try each provider in order
      for (final provider in fallbackProviders) {
        try {
          print('Trying failover to ${provider.name}...');
          
          // Store current stream state if active
          final wasStreaming = currentStreamId != null;
          
          // Initialize new provider
          await _initializeService(provider);
          _activeProvider = provider;
          _failureCount = 0;
          _isHealthy = true;
          
          print('Successfully failed over to ${provider.name}');
          
          // If there was an active stream, notify caller to restart with new provider
          if (wasStreaming) {
            print('Active stream detected - migration needed for stream: $currentStreamId');
            // Caller will handle stream migration
          }
          
          return true;
        } catch (e) {
          print('Failed to initialize ${provider.name}: $e');
          continue;
        }
      }
      
      print('All failover attempts exhausted');
      _isHealthy = false;
      return false;
    } catch (e) {
      print('Error during failover: $e');
      _isHealthy = false;
      return false;
    }
  }

  /// Start health monitoring for active streams
  void startHealthMonitoring() {
    _healthCheckTimer?.cancel();
    _healthCheckTimer = Timer.periodic(
      const Duration(seconds: 30),
      (_) => _performHealthCheck(),
    );
    print('Health monitoring started for ${_activeProvider?.name}');
  }

  /// Stop health monitoring
  void stopHealthMonitoring() {
    _healthCheckTimer?.cancel();
    _healthCheckTimer = null;
    print('Health monitoring stopped');
  }

  /// Perform health check on current provider
  Future<void> _performHealthCheck() async {
    if (_activeProvider == null) return;
    
    try {
      _lastHealthCheck = DateTime.now();
      
      // Check with backend if provider is still active
      final response = await _apiService.dio.get(
        '/streaming/providers/${_activeProvider!.name}/health',
        options: Options(
          sendTimeout: const Duration(seconds: 5),
          receiveTimeout: const Duration(seconds: 5),
        ),
      );
      
      if (response.data['success'] == true && response.data['data']?['healthy'] == true) {
        _failureCount = 0;
        _isHealthy = true;
      } else {
        _handleHealthCheckFailure();
      }
    } catch (e) {
      print('Health check failed for ${_activeProvider?.name}: $e');
      _handleHealthCheckFailure();
    }
  }

  /// Handle health check failure
  void _handleHealthCheckFailure() {
    _failureCount++;
    print('Health check failure #$_failureCount for ${_activeProvider?.name}');
    
    if (_failureCount >= maxFailures) {
      print('Max failures reached, marking provider as unhealthy');
      _isHealthy = false;
      // Failover will be triggered by the streaming provider
    }
  }

  /// Record streaming error for failover detection
  Future<void> recordStreamingError(String? currentStreamId) async {
    _failureCount++;
    print('Streaming error recorded (#$_failureCount) for ${_activeProvider?.name}');
    
    if (_failureCount >= maxFailures) {
      print('Max streaming errors reached, initiating automatic failover');
      await failoverToNextProvider(currentStreamId: currentStreamId);
    }
  }

  /// Refresh provider list and reinitialize if needed
  Future<void> refresh() async {
    await fetchActiveProvider();
  }

  /// Dispose all resources
  Future<void> dispose() async {
    _healthCheckTimer?.cancel();
    _healthCheckTimer = null;
    
    if (_currentService != null) {
      await _currentService!.dispose();
      _currentService = null;
    }
    _activeProvider = null;
    _availableProviders = [];
    _failureCount = 0;
    _isHealthy = true;
  }
}

