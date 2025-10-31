import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import '../../../core/theme/app_colors.dart';
import '../screens/video_feed_screen.dart';

class ShareBottomSheet extends StatelessWidget {
  final VideoModel video;

  const ShareBottomSheet({
    super.key,
    required this.video,
  });

  void _copyLink(BuildContext context) {
    Clipboard.setData(
      ClipboardData(text: 'https://mixillo.app/video/${video.id}'),
    );
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Link copied to clipboard'),
        duration: Duration(seconds: 2),
        backgroundColor: AppColors.success,
      ),
    );
  }

  void _shareToOtherApps() {
    Share.share(
      'Check out this video on Mixillo! https://mixillo.app/video/${video.id}',
      subject: 'Video by ${video.username}',
    );
  }

  void _downloadVideo(BuildContext context) {
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Downloading video...'),
        duration: Duration(seconds: 2),
        backgroundColor: AppColors.info,
      ),
    );
  }

  void _reportVideo(BuildContext context) {
    Navigator.pop(context);
    // Show report dialog
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Report Video'),
        content: const Text('Why are you reporting this video?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Video reported. Thank you for your feedback.'),
                  backgroundColor: AppColors.success,
                ),
              );
            },
            child: const Text('Report'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkBackground : AppColors.lightBackground,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle
            Container(
              margin: const EdgeInsets.symmetric(vertical: 8),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            
            // Header
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                'Share to',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            
            // Share Options Grid
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildShareOption(
                        icon: Icons.person_add,
                        label: 'Friends',
                        color: AppColors.primary,
                        onTap: () {
                          Navigator.pop(context);
                          // Open friends list
                        },
                      ),
                      _buildShareOption(
                        icon: Icons.copy,
                        label: 'Copy Link',
                        color: AppColors.info,
                        onTap: () => _copyLink(context),
                      ),
                      _buildShareOption(
                        icon: Icons.share,
                        label: 'Share',
                        color: AppColors.success,
                        onTap: _shareToOtherApps,
                      ),
                      _buildShareOption(
                        icon: Icons.download,
                        label: 'Download',
                        color: AppColors.warning,
                        onTap: () => _downloadVideo(context),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
            
            const Divider(height: 1),
            
            // Additional Options
            _buildListOption(
              icon: Icons.link,
              title: 'Copy Link',
              onTap: () => _copyLink(context),
              isDark: isDark,
            ),
            _buildListOption(
              icon: Icons.share,
              title: 'Share via...',
              onTap: _shareToOtherApps,
              isDark: isDark,
            ),
            _buildListOption(
              icon: Icons.download,
              title: 'Save Video',
              onTap: () => _downloadVideo(context),
              isDark: isDark,
            ),
            _buildListOption(
              icon: Icons.bookmark_border,
              title: 'Add to Favorites',
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Added to favorites'),
                    backgroundColor: AppColors.success,
                  ),
                );
              },
              isDark: isDark,
            ),
            _buildListOption(
              icon: Icons.not_interested,
              title: 'Not Interested',
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('We\'ll show you less content like this'),
                    backgroundColor: AppColors.info,
                  ),
                );
              },
              isDark: isDark,
            ),
            _buildListOption(
              icon: Icons.flag_outlined,
              title: 'Report',
              onTap: () => _reportVideo(context),
              isDark: isDark,
              isDestructive: true,
            ),
            
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildShareOption({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              color: color,
              size: 28,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildListOption({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    required bool isDark,
    bool isDestructive = false,
  }) {
    return ListTile(
      leading: Icon(
        icon,
        color: isDestructive 
            ? AppColors.error 
            : (isDark ? AppColors.darkText : AppColors.lightText),
      ),
      title: Text(
        title,
        style: TextStyle(
          color: isDestructive ? AppColors.error : null,
          fontWeight: FontWeight.w500,
        ),
      ),
      onTap: onTap,
    );
  }
}
