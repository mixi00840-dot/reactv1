import 'package:flutter/material.dart';

class SupportersScreen extends StatefulWidget {
  final String userId;

  const SupportersScreen({
    Key? key,
    required this.userId,
  }) : super(key: key);

  @override
  State<SupportersScreen> createState() => _SupportersScreenState();
}

class _SupportersScreenState extends State<SupportersScreen> {
  bool isLoading = false;
  String selectedPeriod = 'allTime';

  // TODO: Replace with actual API data
  final List<Supporter> supporters = [
    Supporter(
      userId: '1',
      username: 'johndoe',
      displayName: 'John Doe',
      avatar: 'https://via.placeholder.com/150',
      totalCoins: 1250,
      supportCount: 45,
      isVerified: true,
    ),
    Supporter(
      userId: '2',
      username: 'janedoe',
      displayName: 'Jane Doe',
      avatar: 'https://via.placeholder.com/150',
      totalCoins: 980,
      supportCount: 32,
      isVerified: false,
    ),
    Supporter(
      userId: '3',
      username: 'bobsmith',
      displayName: 'Bob Smith',
      avatar: 'https://via.placeholder.com/150',
      totalCoins: 750,
      supportCount: 28,
      isVerified: true,
    ),
    Supporter(
      userId: '4',
      username: 'alicejones',
      displayName: 'Alice Jones',
      avatar: 'https://via.placeholder.com/150',
      totalCoins: 620,
      supportCount: 21,
      isVerified: false,
    ),
    Supporter(
      userId: '5',
      username: 'charlie',
      displayName: 'Charlie Brown',
      avatar: 'https://via.placeholder.com/150',
      totalCoins: 580,
      supportCount: 19,
      isVerified: false,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text('Supporters'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.calendar_today),
            onSelected: (value) {
              setState(() {
                selectedPeriod = value;
              });
              // TODO: Fetch data for selected period
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'today',
                child: Text('Today'),
              ),
              const PopupMenuItem(
                value: 'week',
                child: Text('This Week'),
              ),
              const PopupMenuItem(
                value: 'month',
                child: Text('This Month'),
              ),
              const PopupMenuItem(
                value: 'allTime',
                child: Text('All Time'),
              ),
            ],
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refreshSupporters,
        color: Colors.blue,
        backgroundColor: Colors.grey[900],
        child: isLoading
            ? const Center(
                child: CircularProgressIndicator(color: Colors.blue),
              )
            : supporters.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.favorite_border,
                          color: Colors.grey[600],
                          size: 64,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'No supporters yet',
                          style: TextStyle(
                            color: Colors.grey[400],
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Create great content to get support!',
                          style: TextStyle(
                            color: Colors.grey[600],
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  )
                : Column(
                    children: [
                      // Summary Card
                      Container(
                        margin: const EdgeInsets.all(16),
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF667eea), Color(0xFF764ba2)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.blue.withOpacity(0.3),
                              blurRadius: 20,
                              offset: const Offset(0, 10),
                            ),
                          ],
                        ),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceAround,
                              children: [
                                _buildSummaryItem(
                                  'Total Supporters',
                                  '${supporters.length}',
                                  Icons.people,
                                ),
                                Container(
                                  width: 1,
                                  height: 40,
                                  color: Colors.white.withOpacity(0.3),
                                ),
                                _buildSummaryItem(
                                  'Total Support',
                                  '${_getTotalCoins()}',
                                  Icons.currency_bitcoin,
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),

                      // Period Selector
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Text(
                          _getPeriodLabel(),
                          style: TextStyle(
                            color: Colors.grey[400],
                            fontSize: 14,
                          ),
                        ),
                      ),

                      const SizedBox(height: 16),

                      // Supporters List
                      Expanded(
                        child: ListView.builder(
                          itemCount: supporters.length,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemBuilder: (context, index) {
                            final supporter = supporters[index];
                            final rank = index + 1;

                            return _buildSupporterCard(
                              supporter: supporter,
                              rank: rank,
                            );
                          },
                        ),
                      ),
                    ],
                  ),
      ),
    );
  }

  Widget _buildSummaryItem(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: Colors.white, size: 28),
        const SizedBox(height: 8),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            color: Colors.white.withOpacity(0.8),
            fontSize: 13,
          ),
        ),
      ],
    );
  }

  Widget _buildSupporterCard({
    required Supporter supporter,
    required int rank,
  }) {
    Color rankColor;
    if (rank == 1) {
      rankColor = const Color(0xFFFFD700); // Gold
    } else if (rank == 2) {
      rankColor = const Color(0xFFC0C0C0); // Silver
    } else if (rank == 3) {
      rankColor = const Color(0xFFCD7F32); // Bronze
    } else {
      rankColor = Colors.grey;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[900],
        borderRadius: BorderRadius.circular(12),
        border: rank <= 3
            ? Border.all(color: rankColor.withOpacity(0.3), width: 2)
            : null,
      ),
      child: Row(
        children: [
          // Rank Badge
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: rankColor.withOpacity(0.2),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: rankColor, width: 2),
            ),
            child: Center(
              child: Text(
                '#$rank',
                style: TextStyle(
                  color: rankColor,
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),

          const SizedBox(width: 12),

          // Avatar
          Stack(
            children: [
              CircleAvatar(
                radius: 25,
                backgroundImage: NetworkImage(supporter.avatar),
              ),
              if (supporter.isVerified)
                Positioned(
                  right: 0,
                  bottom: 0,
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
                      size: 12,
                    ),
                  ),
                ),
            ],
          ),

          const SizedBox(width: 12),

          // User Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  supporter.displayName,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '@${supporter.username}',
                  style: TextStyle(
                    color: Colors.grey[500],
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(
                      Icons.favorite,
                      color: Colors.pink,
                      size: 14,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${supporter.supportCount} supports',
                      style: TextStyle(
                        color: Colors.grey[400],
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Coins Amount
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Row(
                children: [
                  Icon(
                    Icons.currency_bitcoin,
                    color: Colors.amber,
                    size: 20,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '${supporter.totalCoins}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                'total',
                style: TextStyle(
                  color: Colors.grey[500],
                  fontSize: 11,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  int _getTotalCoins() {
    return supporters.fold(0, (sum, supporter) => sum + supporter.totalCoins);
  }

  String _getPeriodLabel() {
    switch (selectedPeriod) {
      case 'today':
        return 'Supporters today';
      case 'week':
        return 'Supporters this week';
      case 'month':
        return 'Supporters this month';
      case 'allTime':
      default:
        return 'All-time supporters';
    }
  }

  Future<void> _refreshSupporters() async {
    setState(() {
      isLoading = true;
    });

    // TODO: Implement API call to fetch supporters
    await Future.delayed(const Duration(seconds: 1));

    setState(() {
      isLoading = false;
    });
  }
}

class Supporter {
  final String userId;
  final String username;
  final String displayName;
  final String avatar;
  final int totalCoins;
  final int supportCount;
  final bool isVerified;

  Supporter({
    required this.userId,
    required this.username,
    required this.displayName,
    required this.avatar,
    required this.totalCoins,
    required this.supportCount,
    required this.isVerified,
  });
}
