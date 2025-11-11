import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/models/post_model.dart';
import '../../data/mock_posts_data.dart';
import '../widgets/post_card.dart';
import '../../../stories/data/mock_stories_data.dart';
import '../../../stories/presentation/widgets/story_list_widget.dart';
import '../../../stories/presentation/pages/story_viewer_page.dart';

/// Instagram-style posts feed page
class PostsFeedPage extends StatefulWidget {
  const PostsFeedPage({super.key});

  @override
  State<PostsFeedPage> createState() => _PostsFeedPageState();
}

class _PostsFeedPageState extends State<PostsFeedPage> {
  List<Post> _posts = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPosts();
  }

  Future<void> _loadPosts() async {
    // Simulate network delay
    await Future.delayed(const Duration(milliseconds: 500));
    setState(() {
      _posts = MockPostsData.getPosts();
      _isLoading = false;
    });
  }

  Future<void> _refreshPosts() async {
    await Future.delayed(const Duration(seconds: 1));
    setState(() {
      _posts = MockPostsData.getPosts();
    });
  }

  void _handleLike(Post post) {
    // TODO: Implement like logic with API
    print('Liked post: ${post.id}');
  }

  void _handleComment(Post post) {
    // TODO: Show comments modal
    _showCommentsModal(post);
  }

  void _handleShare(Post post) {
    // TODO: Implement share functionality
    print('Share post: ${post.id}');
  }

  void _handleBookmark(Post post) {
    // TODO: Implement bookmark logic with API
    print('Bookmarked post: ${post.id}');
  }

  void _showCommentsModal(Post post) {
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
            
            // Comments list
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.all(AppSpacing.md),
                itemCount: post.comments,
                itemBuilder: (context, index) {
                  final comments = MockPostsData.getComments(post.id);
                  if (index >= comments.length) return const SizedBox.shrink();
                  final comment = comments[index];
                  
                  return Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.md),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Avatar
                        Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: AppColors.primary,
                              width: 2,
                            ),
                            image: DecorationImage(
                              image: NetworkImage(comment.userAvatar),
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                        
                        const SizedBox(width: AppSpacing.sm),
                        
                        // Comment content
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              RichText(
                                text: TextSpan(
                                  style: AppTypography.bodyMedium,
                                  children: [
                                    TextSpan(
                                      text: '${comment.username} ',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    TextSpan(text: comment.text),
                                  ],
                                ),
                              ),
                              
                              const SizedBox(height: AppSpacing.xs),
                              
                              Row(
                                children: [
                                  Text(
                                    _getTimeAgo(comment.createdAt),
                                    style: AppTypography.caption.copyWith(
                                      color: AppColors.textTertiary,
                                    ),
                                  ),
                                  const SizedBox(width: AppSpacing.md),
                                  Text(
                                    '${comment.likes} likes',
                                    style: AppTypography.caption.copyWith(
                                      color: AppColors.textTertiary,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  const SizedBox(width: AppSpacing.md),
                                  Text(
                                    'Reply',
                                    style: AppTypography.caption.copyWith(
                                      color: AppColors.textTertiary,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        
                        // Like button
                        IconButton(
                          icon: Icon(
                            comment.isLiked ? Icons.favorite : Icons.favorite_border,
                            size: 16,
                            color: comment.isLiked ? AppColors.error : AppColors.textSecondary,
                          ),
                          onPressed: () {
                            // TODO: Implement comment like
                          },
                        ),
                      ],
                    ),
                  );
                },
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
                      // TODO: Post comment
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

  String _getTimeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);
    
    if (difference.inSeconds < 60) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}d';
    } else {
      return '${(difference.inDays / 7).floor()}w';
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(
          color: AppColors.primary,
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _refreshPosts,
      color: AppColors.primary,
      backgroundColor: AppColors.background,
      child: CustomScrollView(
        slivers: [
          // Stories section at the top
          SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.only(
                top: AppSpacing.md,
                bottom: AppSpacing.sm,
              ),
              child: StoryListWidget(
                stories: MockStoriesData.getStories(),
                onStoryTap: (story, index) {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => StoryViewerPage(
                        stories: MockStoriesData.getStories(),
                        initialStoryIndex: index,
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
          
          // Divider between stories and posts
          const SliverToBoxAdapter(
            child: Divider(
              color: AppColors.glassLight,
              thickness: 1,
              height: 1,
            ),
          ),
          
          // Posts list
          SliverPadding(
            padding: const EdgeInsets.only(
              top: AppSpacing.md,
              bottom: AppSpacing.xxl,
            ),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final post = _posts[index];
                  return PostCard(
                    post: post,
                    onLike: () => _handleLike(post),
                    onComment: () => _handleComment(post),
                    onShare: () => _handleShare(post),
                    onBookmark: () => _handleBookmark(post),
                  );
                },
                childCount: _posts.length,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
