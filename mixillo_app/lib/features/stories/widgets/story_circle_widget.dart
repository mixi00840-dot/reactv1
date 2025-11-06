import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/app_colors.dart';

class StoryCircleWidget extends StatelessWidget {
  final String? avatarUrl;
  final String? username;
  final bool isVerified;
  final bool hasUnviewed;
  final bool isMyStory;
  final VoidCallback onTap;
  final double size;

  const StoryCircleWidget({
    super.key,
    this.avatarUrl,
    this.username,
    this.isVerified = false,
    this.hasUnviewed = false,
    this.isMyStory = false,
    required this.onTap,
    this.size = 70,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Stack(
            children: [
              // Outer ring (gradient if unviewed)
              Container(
                width: size,
                height: size,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: hasUnviewed && !isMyStory
                      ? LinearGradient(
                          colors: [AppColors.primary, AppColors.secondary],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        )
                      : null,
                  border: !hasUnviewed || isMyStory
                      ? Border.all(
                          color: Colors.white30,
                          width: 2,
                        )
                      : null,
                ),
                padding: EdgeInsets.all(hasUnviewed && !isMyStory ? 3 : 2),
                child: CircleAvatar(
                  radius: (size - 6) / 2,
                  backgroundColor: Colors.grey[800],
                  backgroundImage: avatarUrl != null && avatarUrl!.isNotEmpty
                      ? CachedNetworkImageProvider(avatarUrl!)
                      : null,
                  child: avatarUrl == null || avatarUrl!.isEmpty
                      ? Icon(
                          isMyStory ? Icons.add : Icons.person,
                          color: Colors.white,
                          size: size * 0.4,
                        )
                      : null,
                ),
              ),
              
              // Verified badge
              if (isVerified)
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    padding: const EdgeInsets.all(2),
                    decoration: const BoxDecoration(
                      color: Colors.blue,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.verified,
                      color: Colors.white,
                      size: 16,
                    ),
                  ),
                ),
              
              // My story indicator
              if (isMyStory)
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.black, width: 2),
                    ),
                    child: const Icon(
                      Icons.add,
                      color: Colors.white,
                      size: 16,
                    ),
                  ),
                ),
            ],
          ),
          
          if (username != null) ...[
            const SizedBox(height: 6),
            SizedBox(
              width: size + 20,
              child: Text(
                username!,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

