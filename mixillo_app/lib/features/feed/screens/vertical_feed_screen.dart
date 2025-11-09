import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'dart:developer' as developer;
import '../../../core/theme/app_colors.dart';
import '../../../core/services/api_service.dart';
import '../../../core/network/api_endpoints.dart';
import '../widgets/video_feed_item.dart';
import '../models/feed_video_model.dart';

/// Vertical video feed (TikTok-style)
/// Features: Vertical PageView, auto-play, like/comment/share, infinite scroll
class VerticalFeedScreen extends StatefulWidget {
  const VerticalFeedScreen({Key? key}) : super(key: key);

  @override
  State<VerticalFeedScreen> createState() => _VerticalFeedScreenState();
}

class _VerticalFeedScreenState extends State<VerticalFeedScreen> {
  final PageController _pageController = PageController();
  final ApiService _apiService = ApiService();
  
  List<FeedVideoModel> _videos = [];
  int _currentVideoIndex = 0;
  bool _isLoading = false;
  bool _hasMore = true;
  
  // Pagination
  final int _pageSize = 10;
  int _loadedPages = 0;

  @override
  void initState() {
    super.initState();
    _loadInitialVideos();
  }

  @override
  void dispose() {
    _pageController.dispose();
    // Dispose all video controllers
    for (var video in _videos) {
      video.controller?.dispose();
    }
    super.dispose();
  }

  /// Load initial batch of videos
  Future<void> _loadInitialVideos() async {
    if (_isLoading) return;
    
    setState(() {
      _isLoading = true;
    });

    try {
      developer.log('📺 Loading initial videos...');
      
      final response = await _apiService.get(
        ApiEndpoints.contentFeed,
        queryParameters: {
          'page': 1,
          'limit': _pageSize,
        },
      );

      final List<dynamic> videoData = response.data['data'] ?? response.data['videos'] ?? [];
      
      if (videoData.isNotEmpty) {
        final videos = videoData.map((json) => FeedVideoModel.fromJson(json)).toList();
        
        setState(() {
          _videos = videos;
          _loadedPages = 1;
          _hasMore = videoData.length >= _pageSize;
        });

        // Pre-initialize first video
        if (_videos.isNotEmpty) {
          await _initializeVideo(0);
        }
        
        developer.log('✅ Loaded ${_videos.length} videos');
      } else {
        setState(() {
          _hasMore = false;
        });
        developer.log('⚠️ No videos found in feed');
      }
    } catch (e) {
      developer.log('❌ Error loading videos: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load videos: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  /// Load more videos when approaching end
  Future<void> _loadMoreVideos() async {
    if (_isLoading || !_hasMore) return;
    
    setState(() {
      _isLoading = true;
    });

    try {
      developer.log('📺 Loading more videos (page ${_loadedPages + 1})...');
      
      final response = await _apiService.get(
        ApiEndpoints.contentFeed,
        queryParameters: {
          'page': _loadedPages + 1,
          'limit': _pageSize,
        },
      );

      final List<dynamic> videoData = response.data['data'] ?? response.data['videos'] ?? [];
      
      if (videoData.isNotEmpty) {
        final newVideos = videoData.map((json) => FeedVideoModel.fromJson(json)).toList();
        
        setState(() {
          _videos.addAll(newVideos);
          _loadedPages++;
          _hasMore = videoData.length >= _pageSize;
        });
        
        developer.log('✅ Loaded ${newVideos.length} more videos (total: ${_videos.length})');
      } else {
        setState(() {
          _hasMore = false;
        });
        developer.log('✅ Reached end of feed');
      }
    } catch (e) {
      developer.log('❌ Error loading more videos: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  /// Initialize video player for a specific index
  Future<void> _initializeVideo(int index) async {
    if (index < 0 || index >= _videos.length) return;
    
    final video = _videos[index];
    
    // Skip if already initialized
    if (video.controller != null && video.controller!.value.isInitialized) {
      return;
    }

    try {
      developer.log('▶️ Initializing video $index: ${video.videoUrl}');
      
      final controller = VideoPlayerController.networkUrl(
        Uri.parse(video.videoUrl),
      );
      
      await controller.initialize();
      controller.setLooping(true);
      
      setState(() {
        video.controller = controller;
      });
      
      // Auto-play if this is the current video
      if (index == _currentVideoIndex) {
        controller.play();
      }
      
      developer.log('✅ Video $index initialized');
    } catch (e) {
      developer.log('❌ Error initializing video $index: $e');
    }
  }

  /// Handle page change
  void _onPageChanged(int index) {
    developer.log('📄 Page changed to $index');
    
    setState(() {
      _currentVideoIndex = index;
    });

    // Pause previous video
    if (index > 0 && index - 1 < _videos.length) {
      _videos[index - 1].controller?.pause();
    }

    // Play current video
    if (index < _videos.length) {
      final currentVideo = _videos[index];
      if (currentVideo.controller != null && currentVideo.controller!.value.isInitialized) {
        currentVideo.controller!.play();
      } else {
        _initializeVideo(index);
      }
    }

    // Pre-load next video
    if (index + 1 < _videos.length) {
      _initializeVideo(index + 1);
    }

    // Load more videos when approaching end
    if (index >= _videos.length - 3 && _hasMore && !_isLoading) {
      _loadMoreVideos();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading && _videos.isEmpty) {
      return const Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: CircularProgressIndicator(
            color: AppColors.primary,
          ),
        ),
      );
    }

    if (_videos.isEmpty) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.video_library_outlined,
                size: 64,
                color: Colors.white38,
              ),
              const SizedBox(height: 16),
              const Text(
                'No videos yet',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Be the first to post!',
                style: TextStyle(
                  color: Colors.white54,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () {
                  // Navigate to camera
                  Navigator.pushNamed(context, '/camera');
                },
                icon: const Icon(Icons.add),
                label: const Text('Create Video'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: PageView.builder(
        controller: _pageController,
        scrollDirection: Axis.vertical,
        itemCount: _videos.length,
        onPageChanged: _onPageChanged,
        itemBuilder: (context, index) {
          final video = _videos[index];
          
          return VideoFeedItem(
            video: video,
            isPlaying: index == _currentVideoIndex,
          );
        },
      ),
    );
  }
}
