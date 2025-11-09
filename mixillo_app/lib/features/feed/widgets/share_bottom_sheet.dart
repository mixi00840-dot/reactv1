import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/services/video_interaction_service.dart';

/// Share bottom sheet
/// Shows options to share video to various platforms
class ShareBottomSheet extends StatelessWidget {
  final String contentId;
  final String videoUrl;
  final String caption;
  final String username;

  const ShareBottomSheet({
    Key? key,
    required this.contentId,
    required this.videoUrl,
    required this.caption,
    required this.username,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final shareUrl = 'https://mixillo.com/video/$contentId';
    final shareText = '$caption\n\nBy @$username\n\nWatch on Mixillo: $shareUrl';

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Row(
              children: [
                const Text(
                  'Share to',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Share options grid
            GridView.count(
              crossAxisCount: 4,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 16,
              crossAxisSpacing: 16,
              children: [
                _buildShareOption(
                  context,
                  icon: Icons.link,
                  label: 'Copy Link',
                  onTap: () => _copyLink(context, shareUrl),
                ),
                _buildShareOption(
                  context,
                  icon: Icons.share,
                  label: 'Share',
                  onTap: () => _shareGeneral(context, shareText, contentId),
                ),
                _buildShareOption(
                  context,
                  icon: Icons.message,
                  label: 'Message',
                  onTap: () => _shareToMessaging(context, shareText),
                ),
                _buildShareOption(
                  context,
                  icon: Icons.download,
                  label: 'Save Video',
                  onTap: () => _saveVideo(context, videoUrl),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Social platforms
            const Divider(),
            const SizedBox(height: 16),
            const Text(
              'Share to social',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: Colors.grey,
              ),
            ),
            const SizedBox(height: 16),
            
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildSocialButton(
                  context,
                  icon: Icons.facebook,
                  label: 'Facebook',
                  color: const Color(0xFF1877F2),
                  onTap: () => _shareToSocial(context, 'Facebook', shareText),
                ),
                _buildSocialButton(
                  context,
                  icon: Icons.chat_bubble,
                  label: 'WhatsApp',
                  color: const Color(0xFF25D366),
                  onTap: () => _shareToSocial(context, 'WhatsApp', shareText),
                ),
                _buildSocialButton(
                  context,
                  icon: Icons.send,
                  label: 'Telegram',
                  color: const Color(0xFF0088CC),
                  onTap: () => _shareToSocial(context, 'Telegram', shareText),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildShareOption(
    BuildContext context, {
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              icon,
              size: 28,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildSocialButton(
    BuildContext context, {
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              color: Colors.white,
              size: 24,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _copyLink(BuildContext context, String url) async {
    await Clipboard.setData(ClipboardData(text: url));
    
    if (context.mounted) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('✅ Link copied to clipboard'),
          duration: Duration(seconds: 2),
          backgroundColor: AppColors.success,
        ),
      );
    }
  }

  Future<void> _shareGeneral(BuildContext context, String text, String contentId) async {
    // Increment share count on backend
    final interactionService = VideoInteractionService();
    await interactionService.shareVideo(contentId);
    
    if (context.mounted) {
      Navigator.of(context).pop();
      await Share.share(text);
    }
  }

  Future<void> _shareToMessaging(BuildContext context, String text) async {
    if (context.mounted) {
      Navigator.of(context).pop();
      await Share.share(text);
    }
  }

  Future<void> _shareToSocial(BuildContext context, String platform, String text) async {
    if (context.mounted) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Opening $platform...'),
          duration: const Duration(seconds: 2),
        ),
      );
      // In production, integrate with platform-specific share APIs
      await Share.share(text);
    }
  }

  Future<void> _saveVideo(BuildContext context, String videoUrl) async {
    if (context.mounted) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('📥 Downloading video...'),
          duration: Duration(seconds: 2),
        ),
      );
      // In production, implement video download
      // Use packages like dio for downloading with progress
    }
  }
}
