import 'package:flutter/material.dart';
import '../data/models/user_profile_model.dart';

class ProfileHeader extends StatelessWidget {
  final UserProfile profile;
  final bool isOwnProfile;
  final VoidCallback? onEditProfile;
  final VoidCallback? onFollow;
  final bool isFollowLoading;

  const ProfileHeader({
    Key? key,
    required this.profile,
    required this.isOwnProfile,
    this.onEditProfile,
    this.onFollow,
    this.isFollowLoading = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Avatar and Username
          Row(
            children: [
              // Profile Picture
              Stack(
                children: [
                  CircleAvatar(
                    radius: 40,
                    backgroundColor: Colors.grey[800],
                    backgroundImage: profile.avatarUrl.isNotEmpty
                        ? NetworkImage(profile.avatarUrl)
                        : null,
                    child: profile.avatarUrl.isEmpty
                        ? Text(
                            profile.displayName.isNotEmpty
                                ? profile.displayName[0].toUpperCase()
                                : '?',
                            style: const TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                            ),
                          )
                        : null,
                  ),
                  if (profile.isVerified)
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        padding: const EdgeInsets.all(2),
                        decoration: BoxDecoration(
                          color: Colors.blue,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.black, width: 2),
                        ),
                        child: const Icon(
                          Icons.check,
                          color: Colors.white,
                          size: 14,
                        ),
                      ),
                    ),
                ],
              ),
              const Spacer(),
              
              // Action Buttons
              if (isOwnProfile) ...[
                _buildActionButton(
                  context,
                  label: 'Edit Profile',
                  icon: Icons.edit,
                  onTap: onEditProfile,
                  isPrimary: true,
                ),
                const SizedBox(width: 8),
                _buildIconButton(
                  context,
                  icon: Icons.person_add_outlined,
                  onTap: () {
                    // TODO: Share profile
                  },
                ),
              ] else ...[
                _buildActionButton(
                  context,
                  label: profile.isFollowing ? 'Following' : 'Follow',
                  icon: profile.isFollowing ? Icons.check : Icons.person_add,
                  onTap: isFollowLoading ? null : onFollow,
                  isPrimary: !profile.isFollowing,
                ),
                const SizedBox(width: 8),
                _buildIconButton(
                  context,
                  icon: Icons.message_outlined,
                  onTap: () {
                    // TODO: Navigate to messages
                  },
                ),
                const SizedBox(width: 8),
                _buildIconButton(
                  context,
                  icon: Icons.favorite_outline,
                  onTap: () {
                    // TODO: Navigate to support screen
                  },
                ),
              ],
            ],
          ),

          const SizedBox(height: 16),

          // Display Name
          Row(
            children: [
              Text(
                profile.displayName,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              if (profile.isVerified) ...[
                const SizedBox(width: 4),
                const Icon(
                  Icons.verified,
                  color: Colors.blue,
                  size: 18,
                ),
              ],
            ],
          ),

          const SizedBox(height: 4),

          // Username
          Text(
            '@${profile.username}',
            style: TextStyle(
              color: Colors.grey[400],
              fontSize: 14,
            ),
          ),

          // Bio
          if (profile.bio.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              profile.bio,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
              ),
            ),
          ],

          // Website
          if (profile.website != null && profile.website!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.link, size: 16, color: Colors.grey[400]),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    profile.website!,
                    style: TextStyle(
                      color: Colors.blue[300],
                      fontSize: 14,
                      decoration: TextDecoration.underline,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ],

          // Social Links
          if (profile.socialLinks != null && profile.socialLinks!.isNotEmpty) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 16,
              children: profile.socialLinks!.entries.map((entry) {
                return _buildSocialIcon(entry.key);
              }).toList(),
            ),
          ],

          // Joined Date
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(Icons.calendar_today, size: 14, color: Colors.grey[400]),
              const SizedBox(width: 4),
              Text(
                'Joined ${_formatJoinDate(profile.createdAt)}',
                style: TextStyle(
                  color: Colors.grey[400],
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(
    BuildContext context, {
    required String label,
    required IconData icon,
    VoidCallback? onTap,
    bool isPrimary = false,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        decoration: BoxDecoration(
          color: isPrimary ? Colors.blue : Colors.grey[800],
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: Colors.white, size: 18),
            const SizedBox(width: 8),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildIconButton(
    BuildContext context, {
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: Colors.grey[800],
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: Colors.white, size: 20),
      ),
    );
  }

  Widget _buildSocialIcon(String platform) {
    IconData icon;
    Color color;

    switch (platform.toLowerCase()) {
      case 'instagram':
        icon = Icons.photo_camera;
        color = Colors.pink;
        break;
      case 'twitter':
        icon = Icons.alternate_email;
        color = Colors.lightBlue;
        break;
      case 'youtube':
        icon = Icons.play_circle_outline;
        color = Colors.red;
        break;
      case 'facebook':
        icon = Icons.facebook;
        color = Colors.blue;
        break;
      case 'tiktok':
        icon = Icons.music_note;
        color = Colors.white;
        break;
      default:
        icon = Icons.link;
        color = Colors.grey;
    }

    return Icon(icon, color: color, size: 20);
  }

  String _formatJoinDate(DateTime date) {
    final months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${months[date.month - 1]} ${date.year}';
  }
}
