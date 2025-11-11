import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/interaction_service.dart';
import '../../../core/services/socket_service.dart';
import '../../../core/models/video_model.dart';
import 'video_feed_provider.dart';

// Interaction service provider
final interactionServiceProvider = Provider((ref) => InteractionService());

// Video interaction notifier
class VideoInteractionNotifier extends StateNotifier<Map<String, VideoModel>> {
  final InteractionService _interactionService;
  final SocketService _socketService;
  final Ref _ref;

  VideoInteractionNotifier(
    this._interactionService,
    this._socketService,
    this._ref,
  ) : super({}) {
    _setupSocketListeners();
  }

  void _setupSocketListeners() {
    // Listen for like updates
    _socketService.videoLikeStream.listen((data) {
      final contentId = data['contentId'] as String;
      final likesCount = data['likesCount'] as int;
      _updateVideoLikes(contentId, likesCount);
    });

    // Listen for comment updates
    _socketService.videoCommentStream.listen((data) {
      final contentId = data['contentId'] as String;
      final commentsCount = data['commentsCount'] as int;
      _updateVideoComments(contentId, commentsCount);
    });

    // Listen for view updates
    _socketService.videoViewStream.listen((data) {
      final contentId = data['contentId'] as String;
      final viewsCount = data['viewsCount'] as int;
      _updateVideoViews(contentId, viewsCount);
    });

    // Listen for share updates
    _socketService.videoShareStream.listen((data) {
      final contentId = data['contentId'] as String;
      final sharesCount = data['sharesCount'] as int;
      _updateVideoShares(contentId, sharesCount);
    });
  }

  // Toggle like
  Future<void> toggleLike(String videoId) async {
    // Optimistic update
    final video = _getVideoFromFeed(videoId);
    if (video != null) {
      final updatedVideo = video.copyWith(
        isLiked: !video.isLiked,
        likes: video.isLiked ? video.likes - 1 : video.likes + 1,
      );
      _updateVideoInFeed(videoId, updatedVideo);
      state = {...state, videoId: updatedVideo};
    }

    // API call
    final result = await _interactionService.toggleLike(videoId);
    
    if (result['success'] == true) {
      // Update with server response
      if (video != null) {
        final updatedVideo = video.copyWith(
          isLiked: result['isLiked'],
          likes: result['likesCount'],
        );
        _updateVideoInFeed(videoId, updatedVideo);
        state = {...state, videoId: updatedVideo};
      }
    } else {
      // Revert optimistic update on failure
      if (video != null) {
        _updateVideoInFeed(videoId, video);
        state = {...state, videoId: video};
      }
    }
  }

  // Share video
  Future<void> shareVideo(String videoId) async {
    final result = await _interactionService.shareVideo(videoId);
    
    if (result['success'] == true) {
      final video = _getVideoFromFeed(videoId);
      if (video != null) {
        final updatedVideo = video.copyWith(
          shares: result['sharesCount'],
        );
        _updateVideoInFeed(videoId, updatedVideo);
        state = {...state, videoId: updatedVideo};
      }
    }
  }

  // Update video likes from socket
  void _updateVideoLikes(String videoId, int likesCount) {
    final video = _getVideoFromFeed(videoId);
    if (video != null) {
      final updatedVideo = video.copyWith(likes: likesCount);
      _updateVideoInFeed(videoId, updatedVideo);
      state = {...state, videoId: updatedVideo};
    }
  }

  // Update video comments from socket
  void _updateVideoComments(String videoId, int commentsCount) {
    final video = _getVideoFromFeed(videoId);
    if (video != null) {
      final updatedVideo = video.copyWith(comments: commentsCount);
      _updateVideoInFeed(videoId, updatedVideo);
      state = {...state, videoId: updatedVideo};
    }
  }

  // Update video views from socket
  void _updateVideoViews(String videoId, int viewsCount) {
    final video = _getVideoFromFeed(videoId);
    if (video != null) {
      final updatedVideo = video.copyWith(views: viewsCount);
      _updateVideoInFeed(videoId, updatedVideo);
      state = {...state, videoId: updatedVideo};
    }
  }

  // Update video shares from socket
  void _updateVideoShares(String videoId, int sharesCount) {
    final video = _getVideoFromFeed(videoId);
    if (video != null) {
      final updatedVideo = video.copyWith(shares: sharesCount);
      _updateVideoInFeed(videoId, updatedVideo);
      state = {...state, videoId: updatedVideo};
    }
  }

  // Helper: Get video from feed provider
  VideoModel? _getVideoFromFeed(String videoId) {
    final feedState = _ref.read(videoFeedProvider);
    return feedState.videos.firstWhere(
      (v) => v.id == videoId,
      orElse: () => state[videoId]!,
    );
  }

  // Helper: Update video in feed provider
  void _updateVideoInFeed(String videoId, VideoModel updatedVideo) {
    final feedNotifier = _ref.read(videoFeedProvider.notifier);
    final currentState = _ref.read(videoFeedProvider);
    
    final updatedVideos = currentState.videos.map((v) {
      return v.id == videoId ? updatedVideo : v;
    }).toList();

    // Update feed state
    feedNotifier.state = currentState.copyWith(videos: updatedVideos);
  }
}

// Video interaction provider instance
final videoInteractionProvider = 
    StateNotifierProvider<VideoInteractionNotifier, Map<String, VideoModel>>((ref) {
  final interactionService = ref.watch(interactionServiceProvider);
  final socketService = ref.watch(socketServiceProvider);
  return VideoInteractionNotifier(interactionService, socketService, ref);
});
