import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../../domain/entities/post.dart';
import '../../../domain/repositories/posts_repository.dart';
import '../../state/posts_notifier.dart';
import 'post_detail_screen.dart';

/// Instagram-Style Posts Grid Screen
class PostsGridScreen extends ConsumerStatefulWidget {
  final String? userId; // null = feed, userId = user's posts
  final PostContentType? contentType;

  const PostsGridScreen({
    Key? key,
    this.userId,
    this.contentType,
  }) : super(key: key);

  @override
  ConsumerState<PostsGridScreen> createState() => _PostsGridScreenState();
}

class _PostsGridScreenState extends ConsumerState<PostsGridScreen> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    
    // Load posts on init
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadPosts();
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _loadPosts() {
    if (widget.userId != null) {
      ref.read(postsNotifierProvider.notifier).loadUserPosts(
            userId: widget.userId!,
            contentType: widget.contentType,
            refresh: true,
          );
    } else {
      ref.read(postsNotifierProvider.notifier).loadPosts(
            feedType: PostFeedType.forYou,
            refresh: true,
          );
    }
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent * 0.8) {
      final state = ref.read(postsNotifierProvider);
      if (!state.isLoadingMore && !state.hasReachedMax) {
        if (widget.userId != null) {
          ref.read(postsNotifierProvider.notifier).loadUserPosts(
                userId: widget.userId!,
                contentType: widget.contentType,
              );
        } else {
          ref.read(postsNotifierProvider.notifier).loadMorePosts();
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(postsNotifierProvider);

    if (state.isLoading && state.posts.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.errorMessage != null && state.posts.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              state.errorMessage!,
              style: TextStyle(color: Colors.grey[600]),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _loadPosts,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (state.posts.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.photo_library_outlined, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'No posts yet',
              style: TextStyle(fontSize: 18, color: Colors.grey[600]),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        _loadPosts();
      },
      child: GridView.builder(
        controller: _scrollController,
        padding: const EdgeInsets.all(1),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3,
          mainAxisSpacing: 1,
          crossAxisSpacing: 1,
          childAspectRatio: 1,
        ),
        itemCount: state.posts.length + (state.isLoadingMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index >= state.posts.length) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(8.0),
                child: CircularProgressIndicator(),
              ),
            );
          }

          final post = state.posts[index];
          return PostGridItem(
            post: post,
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => PostDetailScreen(
                    post: post,
                    posts: state.posts,
                    initialIndex: index,
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

/// Post Grid Item Widget
class PostGridItem extends StatelessWidget {
  final Post post;
  final VoidCallback onTap;

  const PostGridItem({
    Key? key,
    required this.post,
    required this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final media = post.media.first;
    final isVideo = media.type == MediaType.video;
    final isMultiple = post.media.length > 1;

    return GestureDetector(
      onTap: onTap,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Thumbnail
          CachedNetworkImage(
            imageUrl: media.thumbnail ?? media.url,
            fit: BoxFit.cover,
            placeholder: (context, url) => Container(
              color: Colors.grey[300],
              child: const Center(
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            ),
            errorWidget: (context, url, error) => Container(
              color: Colors.grey[300],
              child: const Icon(Icons.error, color: Colors.grey),
            ),
          ),

          // Video indicator
          if (isVideo)
            Positioned(
              top: 8,
              right: 8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.6),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.play_arrow, color: Colors.white, size: 16),
                    if (media.duration != null) ...[
                      const SizedBox(width: 2),
                      Text(
                        _formatDuration(media.duration!),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),

          // Multiple photos indicator
          if (isMultiple)
            const Positioned(
              top: 8,
              right: 8,
              child: Icon(
                Icons.collections,
                color: Colors.white,
                size: 20,
                shadows: [Shadow(blurRadius: 4, color: Colors.black)],
              ),
            ),

          // Stats overlay (optional)
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [
                    Colors.black.withOpacity(0.5),
                    Colors.transparent,
                  ],
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.favorite, color: Colors.white, size: 14),
                      const SizedBox(width: 4),
                      Text(
                        _formatCount(post.stats.likes),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      const Icon(Icons.comment, color: Colors.white, size: 14),
                      const SizedBox(width: 4),
                      Text(
                        _formatCount(post.stats.comments),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDuration(int seconds) {
    final minutes = seconds ~/ 60;
    final secs = seconds % 60;
    return '$minutes:${secs.toString().padLeft(2, '0')}';
  }

  String _formatCount(int count) {
    if (count >= 1000000) {
      return '${(count / 1000000).toStringAsFixed(1)}M';
    } else if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    }
    return count.toString();
  }
}
