import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/activity_model.dart';
import '../providers/profile_providers.dart';

class LevelBadgeWidget extends ConsumerWidget {
  final String userId;
  final bool showDetails;

  const LevelBadgeWidget({
    super.key,
    required this.userId,
    this.showDetails = true,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final levelAsync = ref.watch(userLevelProvider(userId));
    final badgesAsync = ref.watch(userBadgesProvider(userId));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Level Display
        levelAsync.when(
          data: (level) => _buildLevelCard(context, level),
          loading: () => const Center(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: CircularProgressIndicator(),
            ),
          ),
          error: (error, stack) => _buildErrorCard(context, 'Failed to load level'),
        ),

        if (showDetails) ...[
          const SizedBox(height: 24),
          Text(
            'Badges',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 12),

          // Badges Grid
          badgesAsync.when(
            data: (badges) => _buildBadgesGrid(context, badges),
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, stack) => _buildErrorCard(context, 'Failed to load badges'),
          ),
        ],
      ],
    );
  }

  Widget _buildLevelCard(BuildContext context, UserLevel level) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Theme.of(context).primaryColor,
            Theme.of(context).primaryColor.withOpacity(0.6),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Theme.of(context).primaryColor.withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _buildLevelBadge(level.level),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Your Level',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Level ${level.level}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          _buildXPProgressBar(context, level),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${level.currentXP} XP',
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 12,
                ),
              ),
              Text(
                '${level.xpForNextLevel} XP',
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          if (level.unlockedFeatures.isNotEmpty) ...[
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: level.unlockedFeatures.map((feature) {
                return Chip(
                  label: Text(
                    feature,
                    style: const TextStyle(fontSize: 10),
                  ),
                  backgroundColor: Colors.white.withOpacity(0.2),
                  labelStyle: const TextStyle(color: Colors.white),
                  visualDensity: VisualDensity.compact,
                );
              }).toList(),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildLevelBadge(int level) {
    return Container(
      width: 60,
      height: 60,
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.2),
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: 2),
      ),
      child: Center(
        child: Text(
          '$level',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  Widget _buildXPProgressBar(BuildContext context, UserLevel level) {
    return TweenAnimationBuilder<double>(
      duration: const Duration(milliseconds: 1500),
      curve: Curves.easeOutCubic,
      tween: Tween<double>(
        begin: 0,
        end: level.progressPercentage / 100,
      ),
      builder: (context, value, _) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: LinearProgressIndicator(
                value: value,
                minHeight: 12,
                backgroundColor: Colors.white.withOpacity(0.2),
                valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
              ),
            ),
            const SizedBox(height: 4),
            Align(
              alignment: Alignment.centerRight,
              child: Text(
                '${(value * 100).toStringAsFixed(1)}%',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildBadgesGrid(BuildContext context, List<UserBadge> badges) {
    if (badges.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            children: [
              Icon(
                Icons.emoji_events,
                size: 64,
                color: Colors.grey.withOpacity(0.5),
              ),
              const SizedBox(height: 16),
              Text(
                'No badges yet',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: Colors.grey,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'Earn badges by completing activities',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.grey,
                    ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 4,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: badges.length,
      itemBuilder: (context, index) {
        return _buildBadgeItem(context, badges[index]);
      },
    );
  }

  Widget _buildBadgeItem(BuildContext context, UserBadge badge) {
    return GestureDetector(
      onTap: () => _showBadgeDetails(context, badge),
      child: Column(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: _getBadgeColor(badge.rarity).withOpacity(0.1),
              shape: BoxShape.circle,
              border: Border.all(
                color: _getBadgeColor(badge.rarity),
                width: 2,
              ),
              boxShadow: badge.isDisplayed
                  ? [
                      BoxShadow(
                        color: _getBadgeColor(badge.rarity).withOpacity(0.3),
                        blurRadius: 8,
                        spreadRadius: 2,
                      ),
                    ]
                  : null,
            ),
            child: Center(
              child: badge.iconUrl.isNotEmpty
                  ? Image.network(
                      badge.iconUrl,
                      width: 32,
                      height: 32,
                      errorBuilder: (_, __, ___) => Icon(
                        Icons.emoji_events,
                        color: _getBadgeColor(badge.rarity),
                        size: 32,
                      ),
                    )
                  : Icon(
                      Icons.emoji_events,
                      color: _getBadgeColor(badge.rarity),
                      size: 32,
                    ),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            badge.name,
            style: const TextStyle(fontSize: 10),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Color _getBadgeColor(BadgeRarity rarity) {
    switch (rarity) {
      case BadgeRarity.common:
        return Colors.grey;
      case BadgeRarity.rare:
        return Colors.blue;
      case BadgeRarity.epic:
        return Colors.purple;
      case BadgeRarity.legendary:
        return Colors.amber;
    }
  }

  void _showBadgeDetails(BuildContext context, UserBadge badge) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  color: _getBadgeColor(badge.rarity).withOpacity(0.1),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: _getBadgeColor(badge.rarity),
                    width: 3,
                  ),
                ),
                child: Center(
                  child: badge.iconUrl.isNotEmpty
                      ? Image.network(
                          badge.iconUrl,
                          width: 50,
                          height: 50,
                          errorBuilder: (_, __, ___) => Icon(
                            Icons.emoji_events,
                            color: _getBadgeColor(badge.rarity),
                            size: 50,
                          ),
                        )
                      : Icon(
                          Icons.emoji_events,
                          color: _getBadgeColor(badge.rarity),
                          size: 50,
                        ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                badge.name,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Chip(
                label: Text(badge.rarity.name.toUpperCase()),
                backgroundColor: _getBadgeColor(badge.rarity).withOpacity(0.2),
                labelStyle: TextStyle(
                  color: _getBadgeColor(badge.rarity),
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                badge.description,
                style: Theme.of(context).textTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Earned on ${_formatDate(badge.earnedAt)}',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.grey,
                    ),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 48),
                ),
                child: const Text('Close'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildErrorCard(BuildContext context, String message) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            const Icon(Icons.error_outline, color: Colors.red),
            const SizedBox(width: 12),
            Expanded(child: Text(message)),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
