import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:timeago/timeago.dart' as timeago;

import '../../../domain/entities/post.dart';
import '../../../core/widgets/custom_video_player.dart';
import '../../state/posts_notifier.dart';

/// Instagram-Style Post Detail Screen with Carousel
class PostDetailScreen extends ConsumerStatefulWidget {
  final Post post;
  final List<Post>? posts; // For swiping between posts
  final int initialIndex;

  const PostDetailScreen({
    Key? key,
    required this.post,
    this.posts,
    this.initialIndex = 0,
  }) : super(key: key);

  @override
  ConsumerState<PostDetailScreen> createState() => _PostDetailScreenState();
}

class _PostDetailScreenState extends ConsumerState<PostDetailScreen> {
  late PageController _postsPageController;
  late PageController _mediaPageController;
  int _currentPostIndex = 0;
  int _currentMediaIndex = 0;

  @override
  void initState() {
    super.initState();
    _currentPostIndex = widget.initialIndex;
    _postsPageController = PageController(initialPage: widget.initialIndex);
    _mediaPageController = PageController();
  }

  @override
  void dispose() {
    _postsPageController.dispose();
    _mediaPageController.dispose();
    super.dispose();
  }

  Post get _currentPost {
    if (widget.posts != null && _currentPostIndex < widget.posts!.length) {
      return widget.posts![_currentPostIndex];
    }
    return widget.post;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Posts PageView (vertical swipe)
          widget.posts != null
              ? PageView.builder(
                  controller: _postsPageController,
                  scrollDirection: Axis.vertical,
                  itemCount: widget.posts!.length,
                  onPageChanged: (index) {
                    setState(() {
                      _currentPostIndex = index;
                      _currentMediaIndex = 0;
                      _mediaPageController = PageController();
                    });
                  },
                  itemBuilder: (context, index) {
                    return _buildPostContent(widget.posts![index]);
                  },
                )
              : _buildPostContent(_currentPost),

          // Top Bar
          SafeArea(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withOpacity(0.6),
                    Colors.transparent,
                  ],
                ),
              ),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                  CircleAvatar(
                    radius: 16,
                    backgroundImage: _currentPost.creator.avatar != null
                        ? CachedNetworkImageProvider(_currentPost.creator.avatar!)
                        : null,
                    child: _currentPost.creator.avatar == null
                        ? Text(_currentPost.creator.username[0].toUpperCase())
                        : null,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(
                          children: [
                            Text(
                              _currentPost.creator.username,
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                              ),
                            ),
                            if (_currentPost.creator.isVerified) ...[
                              const SizedBox(width: 4),
                              const Icon(
                                Icons.verified,
                                color: Colors.blue,
                                size: 14,
                              ),
                            ],
                          ],
                        ),
                        if (_currentPost.location != null)
                          Text(
                            _currentPost.location!.name,
                            style: TextStyle(
                              color: Colors.white.withOpacity(0.8),
                              fontSize: 12,
                            ),
                          ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.more_vert, color: Colors.white),
                    onPressed: () => _showOptionsMenu(context),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPostContent(Post post) {
    return Column(
      children: [
        // Media Carousel
        Expanded(
          child: Stack(
            children: [
              PageView.builder(
                controller: _mediaPageController,
                itemCount: post.media.length,
                onPageChanged: (index) {
                  setState(() => _currentMediaIndex = index);
                },
                itemBuilder: (context, index) {
                  final media = post.media[index];
                  return _buildMediaItem(media);
                },
              ),

              // Page indicator
              if (post.media.length > 1)
                Positioned(
                  top: 16,
                  left: 0,
                  right: 0,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(
                      post.media.length,
                      (index) => Container(
                        margin: const EdgeInsets.symmetric(horizontal: 3),
                        width: 6,
                        height: 6,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: _currentMediaIndex == index
                              ? Colors.white
                              : Colors.white.withOpacity(0.4),
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),

        // Bottom Section (Like, Comment, Share, Caption)
        Container(
          color: Colors.black,
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Action Buttons
              Row(
                children: [
                  IconButton(
                    icon: Icon(
                      post.isLiked ? Icons.favorite : Icons.favorite_border,
                      color: post.isLiked ? Colors.red : Colors.white,
                      size: 28,
                    ),
                    onPressed: () {
                      ref.read(postsNotifierProvider.notifier).toggleLike(post.id);
                    },
                  ),
                  IconButton(
                    icon: const Icon(Icons.comment_outlined,
                        color: Colors.white, size: 28),
                    onPressed: () {
                      // TODO: Open comments
                    },
                  ),
                  IconButton(
                    icon: const Icon(Icons.send_outlined,
                        color: Colors.white, size: 28),
                    onPressed: () {
                      // TODO: Share post
                    },
                  ),
                  const Spacer(),
                  IconButton(
                    icon: Icon(
                      post.isSaved ? Icons.bookmark : Icons.bookmark_border,
                      color: Colors.white,
                      size: 28,
                    ),
                    onPressed: () {
                      ref.read(postsNotifierProvider.notifier).toggleSave(post.id);
                    },
                  ),
                ],
              ),

              const SizedBox(height: 8),

              // Likes Count
              Text(
                '${_formatCount(post.stats.likes)} likes',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),

              const SizedBox(height: 8),

              // Caption
              RichText(
                text: TextSpan(
                  children: [
                    TextSpan(
                      text: post.creator.username,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                    const TextSpan(text: ' '),
                    TextSpan(
                      text: post.caption,
                      style: const TextStyle(fontSize: 14),
                    ),
                  ],
                  style: const TextStyle(color: Colors.white),
                ),
              ),

              // Hashtags
              if (post.hashtags.isNotEmpty) ...[
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 4,
                  children: post.hashtags.map((tag) {
                    return Text(
                      '#$tag',
                      style: TextStyle(
                        color: Colors.blue[300],
                        fontSize: 13,
                      ),
                    );
                  }).toList(),
                ),
              ],

              const SizedBox(height: 8),

              // View Comments
              if (post.stats.comments > 0)
                GestureDetector(
                  onTap: () {
                    // TODO: Open comments
                  },
                  child: Text(
                    'View all ${post.stats.comments} comments',
                    style: TextStyle(
                      color: Colors.grey[400],
                      fontSize: 13,
                    ),
                  ),
                ),

              const SizedBox(height: 8),

              // Timestamp
              Text(
                timeago.format(post.createdAt, locale: 'en_short'),
                style: TextStyle(
                  color: Colors.grey[500],
                  fontSize: 11,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildMediaItem(Media media) {
    if (media.type == MediaType.video) {
      // Video player with controls
      return CustomVideoPlayer(
        videoUrl: media.url,
        autoPlay: true,
        looping: true,
        showControls: true, // Show controls for posts (unlike feed)
      );
    }

    return InteractiveViewer(
      minScale: 1.0,
      maxScale: 4.0,
      child: CachedNetworkImage(
        imageUrl: media.url,
        fit: BoxFit.contain,
        width: double.infinity,
        placeholder: (context, url) => const Center(
          child: CircularProgressIndicator(),
        ),
        errorWidget: (context, url, error) => const Center(
          child: Icon(Icons.error, color: Colors.white),
        ),
      ),
    );
  }

  void _showOptionsMenu(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.grey[900],
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.link, color: Colors.white),
                title: const Text('Copy Link', style: TextStyle(color: Colors.white)),
                onTap: () {
                  Navigator.pop(context);
                  // TODO: Copy link
                },
              ),
              ListTile(
                leading: const Icon(Icons.share, color: Colors.white),
                title: const Text('Share to...', style: TextStyle(color: Colors.white)),
                onTap: () {
                  Navigator.pop(context);
                  // TODO: Share
                },
              ),
              ListTile(
                leading: const Icon(Icons.report, color: Colors.red),
                title: const Text('Report', style: TextStyle(color: Colors.red)),
                onTap: () {
                  Navigator.pop(context);
                  // TODO: Report
                },
              ),
            ],
          ),
        );
      },
    );
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
