import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../features/posts/models/post_model.dart';
import 'network_connectivity_service.dart';

/// Upload queue item status
enum UploadStatus {
  pending,
  uploading,
  completed,
  failed,
  retrying,
}

/// Upload queue item
class UploadQueueItem {
  final String id;
  final String videoPath;
  final PostData postData;
  final DateTime createdAt;
  UploadStatus status;
  int retryCount;
  String? error;
  double progress;

  UploadQueueItem({
    required this.id,
    required this.videoPath,
    required this.postData,
    required this.createdAt,
    this.status = UploadStatus.pending,
    this.retryCount = 0,
    this.error,
    this.progress = 0.0,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'videoPath': videoPath,
        'postData': postData.toJson(),
        'createdAt': createdAt.toIso8601String(),
        'status': status.toString(),
        'retryCount': retryCount,
        'error': error,
        'progress': progress,
      };

  factory UploadQueueItem.fromJson(Map<String, dynamic> json) {
    return UploadQueueItem(
      id: json['id'],
      videoPath: json['videoPath'],
      postData: PostData.fromJson(json['postData']),
      createdAt: DateTime.parse(json['createdAt']),
      status: UploadStatus.values.firstWhere(
        (e) => e.toString() == json['status'],
        orElse: () => UploadStatus.pending,
      ),
      retryCount: json['retryCount'] ?? 0,
      error: json['error'],
      progress: json['progress'] ?? 0.0,
    );
  }
}

/// Upload queue manager with retry logic
class UploadQueueService {
  static final UploadQueueService _instance = UploadQueueService._internal();
  factory UploadQueueService() => _instance;
  UploadQueueService._internal();

  static const String _queueKey = 'upload_queue';
  static const int _maxRetries = 3;
  static const Duration _retryDelay = Duration(seconds: 5);

  final List<UploadQueueItem> _queue = [];
  final NetworkConnectivityService _networkService =
      NetworkConnectivityService();

  bool _isProcessing = false;
  UploadQueueItem? _currentItem;

  // Callback for actual upload processing - set this from the app
  Future<void> Function(PostData postData, Function(double) onProgress)?
      uploadHandler;

  List<UploadQueueItem> get queue => List.unmodifiable(_queue);
  UploadQueueItem? get currentItem => _currentItem;
  bool get isProcessing => _isProcessing;

  /// Initialize upload queue
  Future<void> initialize() async {
    await _loadQueue();
    _networkService.initialize();

    // Listen for connectivity changes to resume uploads
    _networkService.connectivityStream.listen((connected) {
      if (connected &&
          !_isProcessing &&
          _queue.any((item) => item.status == UploadStatus.pending)) {
        debugPrint('📡 Network connected, resuming uploads...');
        processQueue();
      }
    });

    debugPrint(
        '✅ Upload queue service initialized with ${_queue.length} items');
  }

  /// Add item to upload queue
  Future<void> addToQueue({
    required String videoPath,
    required PostData postData,
  }) async {
    final item = UploadQueueItem(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      videoPath: videoPath,
      postData: postData,
      createdAt: DateTime.now(),
    );

    _queue.add(item);
    await _saveQueue();

    debugPrint('📤 Added to upload queue: ${item.id}');

    // Start processing if not already processing
    if (!_isProcessing) {
      processQueue();
    }
  }

  /// Process upload queue
  Future<void> processQueue() async {
    if (_isProcessing) {
      debugPrint('⚠️ Queue already processing');
      return;
    }

    _isProcessing = true;

    try {
      while (_queue.any((item) =>
          item.status == UploadStatus.pending ||
          item.status == UploadStatus.retrying)) {
        // Check network connectivity
        if (!await _networkService.checkConnectivity()) {
          debugPrint('📡 No network connection, pausing queue');
          break;
        }

        // Get next pending item
        final item = _queue.firstWhere(
          (item) =>
              item.status == UploadStatus.pending ||
              item.status == UploadStatus.retrying,
        );

        await _processItem(item);
      }
    } catch (e) {
      debugPrint('❌ Queue processing error: $e');
    } finally {
      _isProcessing = false;
      _currentItem = null;
      debugPrint('✅ Queue processing complete');
    }
  }

  /// Process single upload item
  Future<void> _processItem(UploadQueueItem item) async {
    _currentItem = item;
    item.status = UploadStatus.uploading;
    await _saveQueue();

    debugPrint('📤 Uploading: ${item.id}');

    try {
      if (uploadHandler == null) {
        throw Exception(
            'Upload handler not set. Call UploadQueueService().uploadHandler = yourFunction');
      }

      // Upload with progress tracking
      await uploadHandler!(
        item.postData,
        (progress) {
          item.progress = progress;
          _saveQueue();
        },
      );

      // Success
      item.status = UploadStatus.completed;
      item.progress = 1.0;
      debugPrint('✅ Upload completed: ${item.id}');
    } catch (e) {
      debugPrint('❌ Upload failed: ${item.id}, error: $e');
      item.error = e.toString();

      // Retry logic
      if (item.retryCount < _maxRetries) {
        item.retryCount++;
        item.status = UploadStatus.retrying;
        debugPrint(
            '🔄 Retrying upload (${item.retryCount}/$_maxRetries): ${item.id}');

        // Wait before retry
        await Future.delayed(_retryDelay);
      } else {
        item.status = UploadStatus.failed;
        debugPrint('❌ Upload permanently failed: ${item.id}');
      }
    }

    await _saveQueue();
  }

  /// Remove completed items from queue
  Future<void> clearCompleted() async {
    _queue.removeWhere((item) => item.status == UploadStatus.completed);
    await _saveQueue();
    debugPrint('🗑️ Cleared completed uploads');
  }

  /// Remove failed item
  Future<void> removeItem(String id) async {
    _queue.removeWhere((item) => item.id == id);
    await _saveQueue();
    debugPrint('🗑️ Removed upload item: $id');
  }

  /// Retry failed upload
  Future<void> retryItem(String id) async {
    final item = _queue.firstWhere((item) => item.id == id);
    item.status = UploadStatus.pending;
    item.retryCount = 0;
    item.error = null;
    item.progress = 0.0;

    await _saveQueue();

    if (!_isProcessing) {
      processQueue();
    }
  }

  /// Save queue to persistent storage
  Future<void> _saveQueue() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final queueJson = _queue.map((item) => item.toJson()).toList();
      await prefs.setString(_queueKey, jsonEncode(queueJson));
    } catch (e) {
      debugPrint('❌ Error saving queue: $e');
    }
  }

  /// Load queue from persistent storage
  Future<void> _loadQueue() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final queueString = prefs.getString(_queueKey);

      if (queueString != null) {
        final queueJson = jsonDecode(queueString) as List;
        _queue.clear();
        _queue.addAll(queueJson.map((json) => UploadQueueItem.fromJson(json)));

        // Reset uploading items to pending
        for (var item in _queue) {
          if (item.status == UploadStatus.uploading) {
            item.status = UploadStatus.pending;
            item.progress = 0.0;
          }
        }

        await _saveQueue();
      }
    } catch (e) {
      debugPrint('❌ Error loading queue: $e');
    }
  }

  /// Get queue statistics
  Map<String, int> getStatistics() {
    return {
      'total': _queue.length,
      'pending':
          _queue.where((item) => item.status == UploadStatus.pending).length,
      'uploading':
          _queue.where((item) => item.status == UploadStatus.uploading).length,
      'completed':
          _queue.where((item) => item.status == UploadStatus.completed).length,
      'failed':
          _queue.where((item) => item.status == UploadStatus.failed).length,
      'retrying':
          _queue.where((item) => item.status == UploadStatus.retrying).length,
    };
  }
}
