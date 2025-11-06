import 'package:flutter/material.dart';
import '../../../core/services/api_service.dart';
import '../models/streaming_provider_model.dart';
import '../services/streaming_provider_manager.dart';

class LiveStreamingProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  final StreamingProviderManager _providerManager = StreamingProviderManager();
  
  StreamingProviderModel? _activeProvider;
  List<LiveStreamModel> _livestreams = [];
  LiveStreamModel? _currentStream;
  bool _isLoading = false;
  bool _isStreaming = false;
  String? _error;
  
  StreamingProviderModel? get activeProvider => _activeProvider;
  List<LiveStreamModel> get livestreams => _livestreams;
  LiveStreamModel? get currentStream => _currentStream;
  bool get isLoading => _isLoading;
  bool get isStreaming => _isStreaming;
  String? get error => _error;
  
  /// Initialize and fetch active streaming provider
  Future<void> initialize() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      _activeProvider = await _providerManager.fetchActiveProvider();
      _error = null;
    } catch (e) {
      _error = e.toString();
      print('Error initializing streaming provider: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  /// Load available livestreams
  Future<void> loadLivestreams({bool refresh = false}) async {
    if (_isLoading && !refresh) return;
    
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      if (refresh) {
        _livestreams = [];
      }
      
      final streamsData = await _apiService.getLivestreams(limit: 20);
      final List<LiveStreamModel> newStreams = streamsData
          .map((json) => LiveStreamModel.fromJson(json))
          .toList();
      
      if (refresh) {
        _livestreams = newStreams;
      } else {
        _livestreams.addAll(newStreams);
      }
      
      _error = null;
    } catch (e) {
      _error = e.toString();
      print('Error loading livestreams: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  /// Start a new livestream
  Future<LiveStreamModel?> startStream({
    required String userId,
    String? title,
    bool isPrivate = false,
  }) async {
    if (_activeProvider == null) {
      await initialize();
      if (_activeProvider == null) {
        throw Exception('No active streaming provider');
      }
    }
    
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      // Get stream configuration from backend
      final streamData = await _apiService.startLivestream(
        title: title,
        isPrivate: isPrivate,
      );
      
      final streamId = streamData['streamId'] ?? '';
      
      // Start stream using active provider
      final service = _providerManager.currentService;
      if (service == null) {
        throw Exception('Streaming service not initialized');
      }
      
      await service.startStream(
        streamId: streamId,
        userId: userId,
        title: title,
        isPrivate: isPrivate,
      );
      
      _currentStream = LiveStreamModel.fromJson({
        'id': streamId,
        'userId': userId,
        'title': title ?? 'My Live Stream',
        'status': 'live',
        'isPrivate': isPrivate,
        'provider': _activeProvider!.name,
        ...streamData,
      });
      
      _isStreaming = true;
      _error = null;
      notifyListeners();
      
      return _currentStream;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      print('Error starting stream: $e');
      return null;
    }
  }
  
  /// Join a livestream as viewer
  Future<void> joinStream({
    required String streamId,
    required String userId,
  }) async {
    if (_activeProvider == null) {
      await initialize();
      if (_activeProvider == null) {
        throw Exception('No active streaming provider');
      }
    }
    
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final service = _providerManager.currentService;
      if (service == null) {
        throw Exception('Streaming service not initialized');
      }
      
      await service.joinStream(
        streamId: streamId,
        userId: userId,
      );
      
      // Load stream details
      final streams = await _apiService.getLivestreams();
      final streamData = streams.cast<Map<String, dynamic>>().firstWhere(
        (s) => (s['id'] ?? '') == streamId || (s['streamId'] ?? '') == streamId,
        orElse: () => <String, dynamic>{},
      );
      
      if (streamData.isNotEmpty) {
        _currentStream = LiveStreamModel.fromJson(streamData);
      }
      
      _error = null;
    } catch (e) {
      _error = e.toString();
      print('Error joining stream: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  /// End current stream
  Future<void> endStream() async {
    if (_currentStream == null) return;
    
    _isLoading = true;
    notifyListeners();
    
    try {
      final service = _providerManager.currentService;
      if (service != null) {
        await service.endStream(_currentStream!.id);
      }
      
      // Call backend to end stream
      await _apiService.dio.post('/streaming/livestreams/${_currentStream!.id}/stop');
      
      _currentStream = null;
      _isStreaming = false;
      _error = null;
    } catch (e) {
      _error = e.toString();
      print('Error ending stream: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  /// Leave current stream
  Future<void> leaveStream() async {
    if (_currentStream == null) return;
    
    try {
      final service = _providerManager.currentService;
      if (service != null) {
        await service.leaveStream(_currentStream!.id);
      }
      
      _currentStream = null;
      _isStreaming = false;
      notifyListeners();
    } catch (e) {
      print('Error leaving stream: $e');
    }
  }
  
  /// Refresh provider (when admin switches)
  /// Checks if provider has changed and reinitializes if needed
  Future<void> refreshProvider() async {
    try {
      final previousProvider = _activeProvider?.name;
      await _providerManager.refresh();
      _activeProvider = _providerManager.activeProvider;
      
      // If provider changed, notify listeners
      if (previousProvider != _activeProvider?.name) {
        print('Streaming provider changed: $previousProvider -> ${_activeProvider?.name}');
        // If currently streaming, end current stream (provider changed)
        if (_isStreaming && _currentStream != null) {
          await endStream();
        }
      }
      
      _error = null;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      print('Error refreshing provider: $e');
      notifyListeners();
    }
  }
  
  /// Check if provider needs refresh (called periodically or on app resume)
  Future<void> checkProviderUpdate() async {
    if (!_isStreaming) {
      // Only refresh if not currently streaming
      await refreshProvider();
    }
  }
  
  /// Dispose resources
  @override
  void dispose() {
    if (_isStreaming && _currentStream != null) {
      endStream();
    }
    _providerManager.dispose();
    super.dispose();
  }
}

