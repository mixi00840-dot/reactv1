import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:state_notifier/state_notifier.dart';
import '../../../core/models/video_model.dart';
import '../../../core/services/video_service.dart';
import '../../../core/services/socket_service.dart';

// Video service provider
final videoServiceProvider = Provider((ref) => VideoService());

// Socket service provider
final socketServiceProvider = Provider((ref) => SocketService());

// Video feed state
class VideoFeedState {
  final List<VideoModel> videos;
  final int currentIndex;
  final bool isLoading;
  final bool hasMore;
  final int currentPage;
  final String? error;
  final bool isFollowingTab;

  VideoFeedState({
    this.videos = const [],
    this.currentIndex = 0,
    this.isLoading = false,
    this.hasMore = true,
    this.currentPage = 1,
    this.error,
    this.isFollowingTab = false,
  });

  VideoFeedState copyWith({
    List<VideoModel>? videos,
    int? currentIndex,
    bool? isLoading,
    bool? hasMore,
    int? currentPage,
    String? error,
    bool? isFollowingTab,
  }) {
    return VideoFeedState(
      videos: videos ?? this.videos,
      currentIndex: currentIndex ?? this.currentIndex,
      isLoading: isLoading ?? this.isLoading,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
      error: error ?? this.error,
      isFollowingTab: isFollowingTab ?? this.isFollowingTab,
    );
  }

  VideoModel? get currentVideo => 
      videos.isNotEmpty && currentIndex < videos.length 
          ? videos[currentIndex] 
          : null;
}

// Video feed provider
class VideoFeedNotifier extends StateNotifier<VideoFeedState> {
  final VideoService _videoService;
  final SocketService _socketService;

  VideoFeedNotifier(this._videoService, this._socketService) 
      : super(VideoFeedState());

  // Load initial feed
  Future<void> loadFeed({bool isFollowing = false}) async {
    if (state.isLoading) return;

    state = state.copyWith(
      isLoading: true,
      error: null,
      isFollowingTab: isFollowing,
      currentPage: 1,
    );

    try {
      final videos = isFollowing
          ? await _videoService.getFollowingFeed(page: 1, limit: 10)
          : await _videoService.getPersonalizedFeed(page: 1, limit: 10);

      state = state.copyWith(
        videos: videos,
        isLoading: false,
        hasMore: videos.length >= 10,
        currentPage: 1,
      );

      // Join first video room if videos exist
      if (videos.isNotEmpty) {
        _socketService.joinVideoRoom(videos[0].id);
        _videoService.recordView(videos[0].id);
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  // Load more videos (infinite scroll)
  Future<void> loadMore() async {
    if (state.isLoading || !state.hasMore) return;

    state = state.copyWith(isLoading: true);

    try {
      final lastVideoId = state.videos.isNotEmpty 
          ? state.videos.last.id 
          : null;

      final newVideos = state.isFollowingTab
          ? await _videoService.getFollowingFeed(
              page: state.currentPage + 1,
              limit: 10,
            )
          : await _videoService.getPersonalizedFeed(
              page: state.currentPage + 1,
              limit: 10,
              lastVideoId: lastVideoId,
            );

      state = state.copyWith(
        videos: [...state.videos, ...newVideos],
        isLoading: false,
        hasMore: newVideos.length >= 10,
        currentPage: state.currentPage + 1,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  // Update current index
  void updateIndex(int index) {
    if (index == state.currentIndex) return;

    final oldIndex = state.currentIndex;
    state = state.copyWith(currentIndex: index);

    // Leave old video room
    if (oldIndex < state.videos.length) {
      _socketService.leaveVideoRoom(state.videos[oldIndex].id);
    }

    // Join new video room and record view
    if (index < state.videos.length) {
      _socketService.joinVideoRoom(state.videos[index].id);
      _videoService.recordView(state.videos[index].id);
    }

    // Load more if near the end
    if (index >= state.videos.length - 2 && state.hasMore && !state.isLoading) {
      loadMore();
    }
  }

  // Refresh feed
  Future<void> refresh() async {
    state = state.copyWith(
      videos: [],
      currentIndex: 0,
      currentPage: 1,
      hasMore: true,
    );
    await loadFeed(isFollowing: state.isFollowingTab);
  }

  // Switch between For You and Following tabs
  void switchTab(bool isFollowing) {
    if (state.isFollowingTab == isFollowing) return;
    
    // Leave current video room
    if (state.currentVideo != null) {
      _socketService.leaveVideoRoom(state.currentVideo!.id);
    }

    state = state.copyWith(
      videos: [],
      currentIndex: 0,
      currentPage: 1,
      hasMore: true,
      isFollowingTab: isFollowing,
    );
    loadFeed(isFollowing: isFollowing);
  }
}

// Video feed provider instance
final videoFeedProvider = StateNotifierProvider<VideoFeedNotifier, VideoFeedState>((ref) {
  final videoService = ref.watch(videoServiceProvider);
  final socketService = ref.watch(socketServiceProvider);
  return VideoFeedNotifier(videoService, socketService);
});
