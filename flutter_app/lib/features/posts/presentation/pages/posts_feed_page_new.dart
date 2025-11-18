import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/models/feed_post_model.dart';
import '../../providers/feed_provider.dart';
import '../widgets/feed_post_card.dart';
import '../../../stories/data/models/story_model.dart';
import '../../../stories/presentation/widgets/story_list_widget.dart';
import '../../../stories/presentation/pages/story_viewer_page.dart';
import '../../data/mock_posts_data.dart';
import '../../../camera_editor/presentation/pages/tiktok_camera_page_new.dart';

/// Instagram-style posts feed with proper stories positioning
class PostsFeedPageNew extends ConsumerStatefulWidget {
  const PostsFeedPageNew({super.key});

  @override
  ConsumerState<PostsFeedPageNew> createState() => _PostsFeedPageNewState();
}

class _PostsFeedPageNewState extends ConsumerState<PostsFeedPageNew> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    // Load feed on init
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(feedProvider.notifier).loadFeed();
    });

    // Setup pagination
    _scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      ref.read(feedProvider.notifier).loadMore();
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _onRefresh() async {
    await ref.read(feedProvider.notifier).loadFeed(refresh: true);
  }

  void _navigateToCamera({bool isStory = false}) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const TikTokCameraPageNew(),
        // TODO: Pass mode parameter when camera modes are implemented
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final feedState = ref.watch(feedProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _onRefresh,
          color: AppColors.primary,
          backgroundColor: AppColors.background,
          child: CustomScrollView(
            controller: _scrollController,
            slivers: [
              // App bar
              SliverAppBar(
                floating: true,
                snap: true,
                backgroundColor: AppColors.background,
                elevation: 0,
                title: Text(
                  'Posts',
                  style: AppTypography.titleLarge.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                actions: [
                  IconButton(
                    icon: const Icon(Icons.add_circle_outline),
                    onPressed: () => _navigateToCamera(isStory: false),
                    tooltip: 'Create Post',
                  ),
                ],
              ),

              // Stories section - NOW PROPERLY POSITIONED
              SliverToBoxAdapter(
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
                  child: SizedBox(
                    height: 96, // Fixed height for stories
                    child: StoryListWidget(
                      stories: MockStoriesData.getStories()
                          .map((json) => Story.fromJson(json))
                          .toList(),
                      onStoryTap: (story, index) {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => StoryViewerPage(
                              stories: MockStoriesData.getStories()
                                  .map((json) => Story.fromJson(json))
                                  .toList(),
                              initialStoryIndex: index,
                            ),
                          ),
                        );
                      },
                      onAddStory: () => _navigateToCamera(isStory: true),
                    ),
                  ),
                ),
              ),

              // Divider
              const SliverToBoxAdapter(
                child: Divider(
                  color: AppColors.glassLight,
                  thickness: 1,
                  height: 1,
                ),
              ),

              // Loading state
              if (feedState.isLoading && feedState.posts.isEmpty)
                const SliverFillRemaining(
                  child: Center(
                    child: CircularProgressIndicator(
                      color: AppColors.primary,
                    ),
                  ),
                ),

              // Error state
              if (feedState.error != null && feedState.posts.isEmpty)
                SliverFillRemaining(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.error_outline,
                          size: 64,
                          color: AppColors.error,
                        ),
                        const SizedBox(height: AppSpacing.md),
                        Text(
                          'Failed to load feed',
                          style: AppTypography.titleMedium,
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        Text(
                          feedState.error!,
                          style: AppTypography.bodySmall.copyWith(
                            color: AppColors.textTertiary,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: AppSpacing.lg),
                        ElevatedButton(
                          onPressed: () => ref.read(feedProvider.notifier).loadFeed(),
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                ),

              // Posts list
              if (feedState.posts.isNotEmpty)
                SliverPadding(
                  padding: const EdgeInsets.only(
                    top: AppSpacing.sm,
                    bottom: AppSpacing.xxl,
                  ),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        if (index >= feedState.posts.length) {
                          // Loading more indicator
                          if (feedState.isLoadingMore) {
                            return const Padding(
                              padding: EdgeInsets.all(AppSpacing.lg),
                              child: Center(
                                child: CircularProgressIndicator(
                                  color: AppColors.primary,
                                ),
                              ),
                            );
                          }
                          return const SizedBox.shrink();
                        }

                        final post = feedState.posts[index];
                        return FeedPostCard(
                          post: post,
                          onLike: () => ref.read(feedProvider.notifier).toggleLike(post.id),
                          onComment: () => _showCommentsModal(post),
                          onShare: () => ref.read(feedProvider.notifier).sharePost(post.id),
                          onBookmark: () => ref.read(feedProvider.notifier).toggleBookmark(post.id),
                          onGift: (giftId) => ref.read(feedProvider.notifier).sendGift(post.id, giftId),
                        );
                      },
                      childCount: feedState.posts.length + (feedState.isLoadingMore ? 1 : 0),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  void _showCommentsModal(FeedPost post) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.7,
        decoration: BoxDecoration(
          color: AppColors.background,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(AppRadius.xl),
            topRight: Radius.circular(AppRadius.xl),
          ),
        ),
        child: Column(
          children: [
            // Handle bar
            Container(
              margin: const EdgeInsets.symmetric(vertical: AppSpacing.md),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.textTertiary,
                borderRadius: BorderRadius.circular(AppRadius.sm),
              ),
            ),

            // Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Comments',
                    style: AppTypography.titleMedium.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: AppColors.textPrimary),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),

            const Divider(color: AppColors.glassLight),

            // TODO: Implement real comments list
            Expanded(
              child: Center(
                child: Text(
                  '${post.commentsCount} comments',
                  style: AppTypography.bodyMedium.copyWith(
                    color: AppColors.textTertiary,
                  ),
                ),
              ),
            ),

            // Add comment input
            Container(
              padding: EdgeInsets.only(
                left: AppSpacing.md,
                right: AppSpacing.md,
                top: AppSpacing.sm,
                bottom: MediaQuery.of(context).viewInsets.bottom + AppSpacing.sm,
              ),
              decoration: const BoxDecoration(
                border: Border(
                  top: BorderSide(color: AppColors.glassLight),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: AppColors.primary,
                        width: 2,
                      ),
                      image: const DecorationImage(
                        image: NetworkImage('https://i.pravatar.cc/150?img=1'),
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),

                  const SizedBox(width: AppSpacing.sm),

                  Expanded(
                    child: TextField(
                      style: AppTypography.bodyMedium,
                      decoration: InputDecoration(
                        hintText: 'Add a comment...',
                        hintStyle: AppTypography.bodyMedium.copyWith(
                          color: AppColors.textTertiary,
                        ),
                        border: InputBorder.none,
                      ),
                      maxLines: null,
                    ),
                  ),

                  TextButton(
                    onPressed: () {
                      // TODO: Post comment via API
                    },
                    child: Text(
                      'Post',
                      style: AppTypography.labelLarge.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
