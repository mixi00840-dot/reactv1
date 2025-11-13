import 'package:flutter/material.dart';

class LevelsBadgesScreen extends StatefulWidget {
  const LevelsBadgesScreen({Key? key}) : super(key: key);

  @override
  State<LevelsBadgesScreen> createState() => _LevelsBadgesScreenState();
}

class _LevelsBadgesScreenState extends State<LevelsBadgesScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool isLoading = false;

  // TODO: Replace with actual API data
  final UserLevel currentLevel = UserLevel(
    level: 12,
    currentXP: 3450,
    requiredXP: 5000,
    title: 'Rising Star',
    perks: [
      'Upload up to 10 videos per day',
      'Verified badge eligibility',
      'Priority support',
      'Custom profile themes',
    ],
  );

  final List<Badge> earnedBadges = [
    Badge(
      id: '1',
      name: 'Early Adopter',
      description: 'Joined in the first month',
      icon: Icons.star,
      color: Color(0xFFFFD700),
      earnedAt: DateTime.now().subtract(Duration(days: 90)),
      rarity: 'legendary',
    ),
    Badge(
      id: '2',
      name: '1K Followers',
      description: 'Reached 1,000 followers',
      icon: Icons.people,
      color: Color(0xFF4CAF50),
      earnedAt: DateTime.now().subtract(Duration(days: 60)),
      rarity: 'rare',
    ),
    Badge(
      id: '3',
      name: 'Content Creator',
      description: 'Posted 100 videos',
      icon: Icons.videocam,
      color: Color(0xFF2196F3),
      earnedAt: DateTime.now().subtract(Duration(days: 45)),
      rarity: 'epic',
    ),
    Badge(
      id: '4',
      name: 'Viral Hit',
      description: 'Video reached 1M views',
      icon: Icons.whatshot,
      color: Color(0xFFFF5722),
      earnedAt: DateTime.now().subtract(Duration(days: 30)),
      rarity: 'legendary',
    ),
    Badge(
      id: '5',
      name: 'Supporter',
      description: 'Sent 50 supports',
      icon: Icons.favorite,
      color: Color(0xFFE91E63),
      earnedAt: DateTime.now().subtract(Duration(days: 15)),
      rarity: 'common',
    ),
  ];

  final List<Badge> availableBadges = [
    Badge(
      id: '6',
      name: '10K Followers',
      description: 'Reach 10,000 followers',
      icon: Icons.people,
      color: Color(0xFF9C27B0),
      earnedAt: null,
      rarity: 'epic',
      progress: 0.65,
    ),
    Badge(
      id: '7',
      name: 'Trendsetter',
      description: 'Be on trending page 10 times',
      icon: Icons.trending_up,
      color: Color(0xFFFF9800),
      earnedAt: null,
      rarity: 'rare',
      progress: 0.3,
    ),
    Badge(
      id: '8',
      name: 'Collaborator',
      description: 'Create 20 duets',
      icon: Icons.groups,
      color: Color(0xFF00BCD4),
      earnedAt: null,
      rarity: 'common',
      progress: 0.45,
    ),
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text('Levels & Badges'),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.blue,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.grey,
          tabs: const [
            Tab(text: 'Level'),
            Tab(text: 'Badges'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildLevelTab(),
          _buildBadgesTab(),
        ],
      ),
    );
  }

  Widget _buildLevelTab() {
    final progress = currentLevel.currentXP / currentLevel.requiredXP;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          const SizedBox(height: 20),

          // Level Display
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFF667eea), Color(0xFF764ba2)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.blue.withOpacity(0.3),
                  blurRadius: 20,
                  offset: Offset(0, 10),
                ),
              ],
            ),
            child: Column(
              children: [
                Text(
                  'Level ${currentLevel.level}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 48,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  currentLevel.title,
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.9),
                    fontSize: 24,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.star, color: Colors.amber, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      '${currentLevel.currentXP} / ${currentLevel.requiredXP} XP',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.9),
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: LinearProgressIndicator(
                    value: progress,
                    minHeight: 12,
                    backgroundColor: Colors.white.withOpacity(0.2),
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.amber),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '${((1 - progress) * currentLevel.requiredXP).toInt()} XP to Level ${currentLevel.level + 1}',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.7),
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 32),

          // Perks Section
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.grey[900],
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.workspace_premium, color: Colors.amber),
                    const SizedBox(width: 8),
                    const Text(
                      'Current Perks',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                ...currentLevel.perks.map((perk) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Row(
                        children: [
                          Icon(Icons.check_circle,
                              color: Colors.green, size: 20),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              perk,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 15,
                              ),
                            ),
                          ),
                        ],
                      ),
                    )),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // How to earn XP
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.grey[900],
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'How to earn XP',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),
                _buildXPItem('Post a video', '+10 XP'),
                _buildXPItem('Get 100 views', '+5 XP'),
                _buildXPItem('Get 10 likes', '+3 XP'),
                _buildXPItem('Get a new follower', '+2 XP'),
                _buildXPItem('Daily login', '+1 XP'),
              ],
            ),
          ),

          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildXPItem(String action, String xp) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            action,
            style: TextStyle(
              color: Colors.grey[300],
              fontSize: 15,
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.amber.withOpacity(0.2),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              xp,
              style: const TextStyle(
                color: Colors.amber,
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBadgesTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 8),

          // Earned Badges Section
          const Text(
            'Earned Badges',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1,
            ),
            itemCount: earnedBadges.length,
            itemBuilder: (context, index) {
              return _buildBadgeCard(earnedBadges[index], true);
            },
          ),

          const SizedBox(height: 32),

          // Available Badges Section
          const Text(
            'Available Badges',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1,
            ),
            itemCount: availableBadges.length,
            itemBuilder: (context, index) {
              return _buildBadgeCard(availableBadges[index], false);
            },
          ),

          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildBadgeCard(Badge badge, bool isEarned) {
    return InkWell(
      onTap: () => _showBadgeDetails(badge, isEarned),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.grey[900],
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isEarned ? badge.color.withOpacity(0.5) : Colors.grey[800]!,
            width: 2,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Stack(
              alignment: Alignment.center,
              children: [
                if (!isEarned && badge.progress != null)
                  SizedBox(
                    width: 60,
                    height: 60,
                    child: CircularProgressIndicator(
                      value: badge.progress,
                      strokeWidth: 3,
                      backgroundColor: Colors.grey[800],
                      valueColor: AlwaysStoppedAnimation<Color>(badge.color),
                    ),
                  ),
                Icon(
                  badge.icon,
                  size: 40,
                  color: isEarned ? badge.color : Colors.grey[700],
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              badge.name,
              style: TextStyle(
                color: isEarned ? Colors.white : Colors.grey[600],
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            _buildRarityChip(badge.rarity, isEarned),
          ],
        ),
      ),
    );
  }

  Widget _buildRarityChip(String rarity, bool isEarned) {
    Color color;
    switch (rarity) {
      case 'legendary':
        color = Color(0xFFFFD700);
        break;
      case 'epic':
        color = Color(0xFF9C27B0);
        break;
      case 'rare':
        color = Color(0xFF2196F3);
        break;
      default:
        color = Colors.grey;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: (isEarned ? color : Colors.grey).withOpacity(0.2),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        rarity.toUpperCase(),
        style: TextStyle(
          color: isEarned ? color : Colors.grey[700],
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  void _showBadgeDetails(Badge badge, bool isEarned) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.grey[900],
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                badge.icon,
                size: 64,
                color: isEarned ? badge.color : Colors.grey[700],
              ),
              const SizedBox(height: 16),
              Text(
                badge.name,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              _buildRarityChip(badge.rarity, isEarned),
              const SizedBox(height: 16),
              Text(
                badge.description,
                style: TextStyle(
                  color: Colors.grey[400],
                  fontSize: 16,
                ),
                textAlign: TextAlign.center,
              ),
              if (!isEarned && badge.progress != null) ...[
                const SizedBox(height: 16),
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: LinearProgressIndicator(
                    value: badge.progress,
                    minHeight: 8,
                    backgroundColor: Colors.grey[800],
                    valueColor: AlwaysStoppedAnimation<Color>(badge.color),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '${(badge.progress! * 100).toInt()}% Complete',
                  style: TextStyle(
                    color: Colors.grey[400],
                    fontSize: 14,
                  ),
                ),
              ],
              if (isEarned && badge.earnedAt != null) ...[
                const SizedBox(height: 16),
                Text(
                  'Earned on ${_formatDate(badge.earnedAt!)}',
                  style: TextStyle(
                    color: Colors.grey[500],
                    fontSize: 14,
                  ),
                ),
              ],
              const SizedBox(height: 24),
            ],
          ),
        );
      },
    );
  }

  String _formatDate(DateTime date) {
    return '${date.month}/${date.day}/${date.year}';
  }
}

class UserLevel {
  final int level;
  final int currentXP;
  final int requiredXP;
  final String title;
  final List<String> perks;

  UserLevel({
    required this.level,
    required this.currentXP,
    required this.requiredXP,
    required this.title,
    required this.perks,
  });
}

class Badge {
  final String id;
  final String name;
  final String description;
  final IconData icon;
  final Color color;
  final DateTime? earnedAt;
  final String rarity;
  final double? progress;

  Badge({
    required this.id,
    required this.name,
    required this.description,
    required this.icon,
    required this.color,
    this.earnedAt,
    required this.rarity,
    this.progress,
  });
}
