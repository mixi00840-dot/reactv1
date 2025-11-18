import 'package:flutter/material.dart';

class BadgesPage extends StatelessWidget {
  const BadgesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Badges'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'Earned Badges',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.military_tech_outlined,
                  size: 64,
                  color:
                      Theme.of(context).colorScheme.primary.withOpacity(0.5),
                ),
                const SizedBox(height: 16),
                Text(
                  'No Badges Yet',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 8),
                Text(
                  'Complete achievements to earn badges',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.grey,
                      ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
          const Text(
            'Available Badges',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          _buildBadgeCard(
            context,
            'First Post',
            'Upload your first video',
            Icons.post_add,
            Colors.blue,
            locked: true,
          ),
          _buildBadgeCard(
            context,
            '100 Followers',
            'Reach 100 followers',
            Icons.people,
            Colors.purple,
            locked: true,
          ),
          _buildBadgeCard(
            context,
            'Trending',
            'Get featured on trending page',
            Icons.trending_up,
            Colors.orange,
            locked: true,
          ),
        ],
      ),
    );
  }

  Widget _buildBadgeCard(
    BuildContext context,
    String title,
    String description,
    IconData icon,
    Color color, {
    bool locked = false,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: locked ? Colors.grey.shade300 : color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(
            locked ? Icons.lock_outline : icon,
            color: locked ? Colors.grey : color,
          ),
        ),
        title: Text(title),
        subtitle: Text(description),
        trailing: locked ? const Icon(Icons.chevron_right) : null,
      ),
    );
  }
}
