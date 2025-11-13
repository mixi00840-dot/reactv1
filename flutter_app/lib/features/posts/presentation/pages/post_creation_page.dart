import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:io';

/// TikTok-style post creation page
/// Allows users to add caption, hashtags, location, and privacy settings before posting
class PostCreationPage extends StatefulWidget {
  final String mediaPath;
  final String mediaType; // 'photo' or 'video'
  final Duration? videoDuration;

  const PostCreationPage({
    super.key,
    required this.mediaPath,
    required this.mediaType,
    this.videoDuration,
  });

  @override
  State<PostCreationPage> createState() => _PostCreationPageState();
}

class _PostCreationPageState extends State<PostCreationPage> {
  final TextEditingController _captionController = TextEditingController();
  final FocusNode _captionFocus = FocusNode();
  
  String _privacy = 'public'; // public, friends, private
  bool _allowComments = true;
  bool _allowDuet = true;
  bool _allowStitch = true;
  bool _isPosting = false;

  @override
  void dispose() {
    _captionController.dispose();
    _captionFocus.dispose();
    super.dispose();
  }

  Future<void> _post() async {
    if (_isPosting) return;

    setState(() => _isPosting = true);

    try {
      // TODO: Implement actual post upload
      // 1. Upload media to cloud storage
      // 2. Create post entry in database
      // 3. Navigate to home/profile

      await Future.delayed(const Duration(seconds: 2)); // Simulate upload

      if (mounted) {
        // Success - navigate to home
        Navigator.of(context).popUntil((route) => route.isFirst);
        
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Posted successfully! 🎉'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      setState(() => _isPosting = false);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to post: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _saveAsDraft() async {
    // TODO: Save post as draft
    Navigator.of(context).pop();
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Saved as draft')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          'New Post',
          style: TextStyle(color: Colors.white, fontSize: 18),
        ),
        actions: [
          TextButton(
            onPressed: _saveAsDraft,
            child: const Text('Drafts', style: TextStyle(color: Colors.white70)),
          ),
        ],
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Media preview + Caption
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Media thumbnail
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: widget.mediaType == 'photo'
                            ? Image.file(
                                File(widget.mediaPath),
                                width: 80,
                                height: 120,
                                fit: BoxFit.cover,
                              )
                            : Stack(
                                children: [
                                  Image.file(
                                    File(widget.mediaPath),
                                    width: 80,
                                    height: 120,
                                    fit: BoxFit.cover,
                                  ),
                                  const Positioned.fill(
                                    child: Center(
                                      child: Icon(
                                        Icons.play_circle_outline,
                                        color: Colors.white,
                                        size: 32,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                      ),
                      
                      const SizedBox(width: 12),
                      
                      // Caption input
                      Expanded(
                        child: TextField(
                          controller: _captionController,
                          focusNode: _captionFocus,
                          maxLines: 5,
                          maxLength: 2200,
                          style: const TextStyle(color: Colors.white, fontSize: 16),
                          decoration: const InputDecoration(
                            hintText: 'Add a caption...',
                            hintStyle: TextStyle(color: Colors.white54),
                            border: InputBorder.none,
                            counterStyle: TextStyle(color: Colors.white54),
                          ),
                          textCapitalization: TextCapitalization.sentences,
                        ),
                      ),
                    ],
                  ),
                ),

                const Divider(color: Colors.white12, height: 1),

                // Privacy settings
                _buildSettingTile(
                  icon: Icons.public,
                  title: 'Who can view this post',
                  value: _privacy == 'public' ? 'Everyone' : 
                         _privacy == 'friends' ? 'Friends' : 'Only me',
                  onTap: () => _showPrivacySelector(),
                ),

                // Allow Comments
                _buildSwitchTile(
                  icon: Icons.comment,
                  title: 'Allow comments',
                  value: _allowComments,
                  onChanged: (val) => setState(() => _allowComments = val),
                ),

                // Allow Duet
                if (widget.mediaType == 'video')
                  _buildSwitchTile(
                    icon: Icons.people,
                    title: 'Allow Duet',
                    value: _allowDuet,
                    onChanged: (val) => setState(() => _allowDuet = val),
                  ),

                // Allow Stitch
                if (widget.mediaType == 'video')
                  _buildSwitchTile(
                    icon: Icons.layers,
                    title: 'Allow Stitch',
                    value: _allowStitch,
                    onChanged: (val) => setState(() => _allowStitch = val),
                  ),

                const SizedBox(height: 100), // Space for button
              ],
            ),
          ),

          // Post button
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: Container(
              padding: EdgeInsets.only(
                left: 16,
                right: 16,
                bottom: MediaQuery.of(context).padding.bottom + 16,
                top: 16,
              ),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [
                    Colors.black,
                    Colors.black.withValues(alpha: 0.0),
                  ],
                ),
              ),
              child: ElevatedButton(
                onPressed: _isPosting ? null : _post,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFF006B),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: _isPosting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : const Text(
                        'Post',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSettingTile({
    required IconData icon,
    required String title,
    required String value,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: Colors.white),
      title: Text(
        title,
        style: const TextStyle(color: Colors.white),
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            value,
            style: const TextStyle(color: Colors.white54),
          ),
          const Icon(Icons.chevron_right, color: Colors.white54),
        ],
      ),
      onTap: onTap,
    );
  }

  Widget _buildSwitchTile({
    required IconData icon,
    required String title,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return SwitchListTile(
      secondary: Icon(icon, color: Colors.white),
      title: Text(
        title,
        style: const TextStyle(color: Colors.white),
      ),
      value: value,
      onChanged: onChanged,
      activeColor: const Color(0xFFFF006B),
    );
  }

  void _showPrivacySelector() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.grey[900],
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 16),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Who can view this post',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 16),
            _buildPrivacyOption('public', 'Everyone', 'Anyone can see your post'),
            _buildPrivacyOption('friends', 'Friends', 'Only your friends'),
            _buildPrivacyOption('private', 'Only me', 'Only you can see this'),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildPrivacyOption(String value, String title, String subtitle) {
    final isSelected = _privacy == value;
    return ListTile(
      leading: Icon(
        value == 'public' ? Icons.public :
        value == 'friends' ? Icons.people :
        Icons.lock,
        color: isSelected ? const Color(0xFFFF006B) : Colors.white,
      ),
      title: Text(
        title,
        style: TextStyle(
          color: isSelected ? const Color(0xFFFF006B) : Colors.white,
          fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
        ),
      ),
      subtitle: Text(
        subtitle,
        style: const TextStyle(color: Colors.white54, fontSize: 12),
      ),
      trailing: isSelected
          ? const Icon(Icons.check, color: Color(0xFFFF006B))
          : null,
      onTap: () {
        setState(() => _privacy = value);
        Navigator.pop(context);
      },
    );
  }
}
