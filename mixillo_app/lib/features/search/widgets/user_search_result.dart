import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../screens/search_screen.dart';

class UserSearchResultWidget extends StatefulWidget {
  final UserSearchResult user;
  final VoidCallback onTap;
  final VoidCallback onFollow;

  const UserSearchResultWidget({
    super.key,
    required this.user,
    required this.onTap,
    required this.onFollow,
  });

  @override
  State<UserSearchResultWidget> createState() => _UserSearchResultWidgetState();
}

class _UserSearchResultWidgetState extends State<UserSearchResultWidget> {
  late bool _isFollowing;

  @override
  void initState() {
    super.initState();
    _isFollowing = widget.user.isFollowing;
  }

  void _toggleFollow() {
    setState(() {
      _isFollowing = !_isFollowing;
    });
    widget.onFollow();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return InkWell(
      onTap: widget.onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
        child: Row(
          children: [
            // Avatar
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: AppColors.primary.withOpacity(0.3),
                  width: 2,
                ),
                image: DecorationImage(
                  image: NetworkImage(widget.user.avatarUrl),
                  fit: BoxFit.cover,
                ),
              ),
            ),
            
            const SizedBox(width: 12),
            
            // User Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          widget.user.displayName,
                          style: TextStyle(
                            color: isDark ? Colors.white : Colors.black,
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (widget.user.isVerified) ...[
                        const SizedBox(width: 4),
                        const Icon(
                          Icons.verified,
                          color: AppColors.primary,
                          size: 16,
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    widget.user.username,
                    style: TextStyle(
                      color: isDark ? Colors.white70 : Colors.black54,
                      fontSize: 13,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${_formatCount(widget.user.followers)} followers',
                    style: TextStyle(
                      color: isDark ? Colors.white60 : Colors.black45,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            
            // Follow Button
            SizedBox(
              height: 34,
              child: ElevatedButton(
                onPressed: _toggleFollow,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _isFollowing
                      ? (isDark ? AppColors.darkCard : AppColors.lightCard)
                      : AppColors.primary,
                  foregroundColor: _isFollowing
                      ? (isDark ? Colors.white : Colors.black)
                      : Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                    side: _isFollowing
                        ? BorderSide(
                            color: isDark ? Colors.white24 : Colors.black12,
                          )
                        : BorderSide.none,
                  ),
                  elevation: _isFollowing ? 0 : 2,
                ),
                child: Text(
                  _isFollowing ? 'Following' : 'Follow',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
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
